// ════════════════════════════════════════════════════════════════
// SLON — автономный сервер. Тот же протокол и та же схема, что на Cloudflare,
// но на своём железе (Node + SQLite + ws). Раздаёт и сам сайт — фронт на том же
// адресе, не на GitHub. Запуск: npm i && node server.js  (или через systemd).
// Настройки — через переменные окружения (см. .env.example / README).
// ════════════════════════════════════════════════════════════════
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { WebSocketServer } from 'ws';
import { sendFcm } from '../fcm.js';

globalThis.crypto ??= webcrypto;                 // fcm.js и наши хелперы используют crypto.subtle

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT      = +(process.env.PORT || 8080);
const DATA_DIR  = process.env.DATA_DIR || __dir;
const WEB_DIR   = process.env.WEB_DIR || path.resolve(__dir, '..', '..');   // корень репо = сайт
const FB        = process.env.FB_URL || 'https://slon-376b4-default-rtdb.europe-west1.firebasedatabase.app';
const FB_ON     = process.env.FB_MIGRATE !== '0';                            // мягкая миграция старых аккаунтов
const BUILTIN_ADMINS = (process.env.ADMINS || 'mamedov,vadimslonik67').split(',').map(s=>s.trim()).filter(Boolean);
const MAX_FAILS=10, LOCK_MS=5*60*1000, RESET_TTL=15*60*1000;
const QUEUE_TTL=7*24*3600e3, MEDIA_MAX=100*1024*1024;

// ── База ──
const sq = new DatabaseSync(path.join(DATA_DIR, 'slon.db'));
sq.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
sq.exec(fs.readFileSync(path.join(__dir, 'schema.sql'), 'utf8'));
const qAll=(s,...p)=>sq.prepare(s).all(...p);
const qGet=(s,...p)=>sq.prepare(s).get(...p);
const qRun=(s,...p)=>sq.prepare(s).run(...p);
// D1-совместимая обёртка — чтобы дословно переиспользовать fcm.js и логику маршрутов
const DB = {
  prepare(sqlStr){
    const st=sq.prepare(sqlStr); let args=[];
    const api={
      bind(...a){args=a;return api;},
      first(){return st.get(...args) ?? null;},
      all(){return {results: st.all(...args)};},
      run(){return {meta: st.run(...args)};},
      _bound(){return {st,args};}
    };
    return api;
  },
  batch(list){ const tx=sq.transaction(items=>items.map(i=>{const{st,args}=i._bound();return st.run(...args);})); return tx(list); }
};
const envFcm = { get FCM_SA(){return process.env.FCM_SA;}, DB };

// ── Крипто/валидация (как на Cloudflare) ──
const enc=new TextEncoder();
const hex=buf=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
const sha=async s=>hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const rnd=n=>{const b=crypto.getRandomValues(new Uint8Array(n));return Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const same=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0;};
const validUser=u=>typeof u==='string'&&/^[a-z0-9_]{3,20}$/.test(u);
const validHash=h=>typeof h==='string'&&/^[0-9a-f]{64}$/.test(h);

// ── Firebase (только миграция старых аккаунтов; на своём сервере может быть недоступен) ──
async function fbGet(p){ if(!FB_ON)return null; try{const r=await fetch(FB+'/'+p+'.json',{signal:AbortSignal.timeout(4000)});return r.ok?await r.json():null;}catch(e){return null;} }
async function fbPut(p,v){ if(!FB_ON)return; try{await fetch(FB+'/'+p+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(v),signal:AbortSignal.timeout(4000)});}catch(e){} }
const fbMarkMigrated=u=>fbPut('auth/'+u,{migrated:true,ts:Date.now()});
async function dropPushSubs(u,match){ if(!FB_ON)return 0; const subs=await fbGet('push_subs/'+u); if(!subs)return 0; let n=0; for(const [id,sub] of Object.entries(subs)){ if(match(sub)){await fetch(FB+'/push_subs/'+u+'/'+id+'.json',{method:'DELETE'}).catch(()=>{});n++;} } return n; }

// ── Аккаунты/сессии ──
const getUser=u=>qGet('SELECT * FROM users WHERE username=?',u);
async function setPassword(u,clientHash,migrated){
  const salt=rnd(16), verifier=await sha(salt+clientHash), now=Date.now();
  qRun(`INSERT INTO users(username,salt,verifier,created,pass_updated,migrated) VALUES(?,?,?,?,?,?)
    ON CONFLICT(username) DO UPDATE SET salt=excluded.salt,verifier=excluded.verifier,pass_updated=excluded.pass_updated`,
    u,salt,verifier,now,now,migrated?1:0);
}
async function newSession(u,device){ const token=rnd(32),now=Date.now();
  qRun('INSERT INTO sessions(token_hash,username,device,created,last_seen) VALUES(?,?,?,?,?)',await sha(token),u,String(device||'').slice(0,40),now,now); return token; }
async function newReset(u){ const t=rnd(24); qRun('INSERT INTO resets(token_hash,username,expires) VALUES(?,?,?)',await sha(t),u,Date.now()+RESET_TTL); return t; }
async function authed(req){
  const h=req.headers['authorization']||''; const t=h.startsWith('Bearer ')?h.slice(7):''; if(!t)return null;
  const s=qGet('SELECT username,last_seen FROM sessions WHERE token_hash=?',await sha(t)); if(!s)return null;
  if(Date.now()-s.last_seen>3600e3)qRun('UPDATE sessions SET last_seen=? WHERE token_hash=?',Date.now(),await sha(t));
  return s.username;
}
const isAdmin=u=>BUILTIN_ADMINS.includes(u)||!!qGet('SELECT 1 FROM admins WHERE username=?',u);
const failCheck=u=>{const f=qGet('SELECT count,until FROM login_fails WHERE username=?',u);return f&&f.count>=MAX_FAILS&&f.until>Date.now()?Math.ceil((f.until-Date.now())/60000):0;};
const failAdd=u=>qRun(`INSERT INTO login_fails(username,count,until) VALUES(?,1,?)
  ON CONFLICT(username) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END, until=?`,u,Date.now()+LOCK_MS,Date.now(),Date.now()+LOCK_MS);
const failClear=u=>qRun('DELETE FROM login_fails WHERE username=?',u);
function putPrekeys(u,dev,opks){ if(!Array.isArray(opks)||!opks.length)return;
  const st=sq.prepare('INSERT OR IGNORE INTO e2e_prekeys(username,device_id,key_id,pub) VALUES(?,?,?,?)');
  const tx=sq.transaction(list=>{for(const k of list)if(k&&k.pub)st.run(u,dev,+k.id,String(k.pub));}); tx(opks.slice(0,100)); }

// ════════ ХАБ (в процессе, вместо Durable Objects) ════════
const QUEUE_TYPES=new Set(['msg','read','msg_edit','msg_delete','msg_pin','chat_delete','hello','call_incoming','call_offer',
  'call_cancel','call_reject','call_end','group_invite','group_add','group_update','group_kick','group_profile_update',
  'group_msg','system_premium','system_admin_granted','system_pass_reset','system_elephant','channel_invite']);
const conns=new Map();                                   // user -> Set<ws>
const uset=u=>{let s=conns.get(u);if(!s){s=new Set();conns.set(u,s);}return s;};
const socks=(u,ex)=>[...(conns.get(u)||[])].filter(w=>w!==ex&&w.readyState===1);
const appSocks=(u,ex)=>socks(u,ex).filter(w=>!w.slon.bg);
const sendW=(w,o)=>{try{w.send(JSON.stringify(o));}catch(e){}};
const bcast=(u,o,ex)=>{const s=JSON.stringify(o);for(const w of socks(u,ex))try{w.send(s);}catch(e){}};

function setPresence(u,online){
  if(!u)return;
  const row=qGet('SELECT ls FROM hub_ls WHERE user=?',u);
  const lsAllowed=!row||row.ls!=='0'; const now=Date.now();
  qRun(`INSERT INTO presence(username,online,ts,ls) VALUES(?,?,?,?)
    ON CONFLICT(username) DO UPDATE SET online=excluded.online,ts=excluded.ts,ls=excluded.ls`,u,online?1:0,now,lsAllowed?now:0);
}
function mlPut(u,key,rec,exceptWs){
  const old=qGet('SELECT rec FROM ml WHERE user=? AND key=?',u,key);
  if(old){try{const o=JSON.parse(old.rec);if(o.del||o.gone)return;}catch(e){}}
  const now=Date.now();
  qRun('INSERT OR REPLACE INTO ml(user,key,rec,upd) VALUES(?,?,?,?)',u,key,JSON.stringify(rec),now);
  bcast(u,{t:'ml',key,rec,upd:now},exceptWs);
  if(!old&&!rec.out&&rec.chat!=='saved'&&!appSocks(u).length){
    const lbl={photo:'📷 Фото',voice:'🎙️ Голосовое',slon:'🐘 Слонкружок',file:'📎 Файл',e2e:'Новое сообщение'};
    const body=lbl[rec.k]||(rec.text?String(rec.text).slice(0,200):'Новое сообщение');
    const data={type:'msg',chat:rec.chat,title:rec.nick||('@'+rec.chat),body};
    if(rec.n){const n=JSON.stringify(rec.n);if(n.length<3500)data.n=n;}
    sendFcm(envFcm,u,data).catch(()=>{});
  }
}
function mlPatch(u,key,patch,exceptWs){
  const row=qGet('SELECT rec FROM ml WHERE user=? AND key=?',u,key); if(!row)return;
  const rec={...JSON.parse(row.rec),...patch}, now=Date.now();
  qRun('UPDATE ml SET rec=?,upd=? WHERE user=? AND key=?',JSON.stringify(rec),now,u,key);
  bcast(u,{t:'ml',key,rec,upd:now,chg:1},exceptWs);
}
async function deliver(fromUser,toUser,payload,bridge){
  const item={t:'data',from:fromUser,payload};
  if(socks(toUser).length)bcast(toUser,item);
  if(appSocks(toUser).length)return true;
  if(QUEUE_TYPES.has(payload.type))qRun('INSERT INTO queue(user,msg,ts) VALUES(?,?,?)',toUser,JSON.stringify(item),Date.now());
  if(payload.type==='call_incoming')
    sendFcm(envFcm,toUser,{type:'call',peer:fromUser,title:payload.nick||('@'+fromUser),callId:payload.callId||'',video:payload.isVideo?'1':'0'},{ttl:'45s'}).catch(()=>{});
  else if(payload.type==='call_cancel'||payload.type==='call_end')
    sendFcm(envFcm,toUser,{type:'call_end',peer:fromUser,title:'@'+fromUser},{ttl:'60s'}).catch(()=>{});
  if(bridge&&FB_ON)fbPut('inbox/'+toUser,undefined); // старый мост не нужен на своём сервере
  return false;
}

// ── WebSocket устройства ──
const wss=new WebSocketServer({noServer:true});
wss.on('connection',(ws,user,dev,bg,lsParam)=>{
  ws.slon={user,dev,bg};
  uset(user).add(ws);
  qRun('INSERT OR REPLACE INTO hub_ls(user,ls) VALUES(?,?)',user,lsParam==='0'?'0':'1');
  if(!bg){
    setPresence(user,true);
    const q=qAll('SELECT id,msg,ts FROM queue WHERE user=? ORDER BY id',user);
    const fresh=q.filter(x=>Date.now()-x.ts<QUEUE_TTL).map(x=>{try{return JSON.parse(x.msg);}catch(e){return null;}}).filter(Boolean);
    if(fresh.length)sendW(ws,{t:'batch',items:fresh});
    if(q.length)qRun('DELETE FROM queue WHERE user=?',user);
  }
  ws.on('message',async raw=>{
    let m; try{m=JSON.parse(raw.toString());}catch(e){return;}
    const me=ws.slon.user;
    if(m.t==='ping'){sendW(ws,{t:'pong'});return;}
    try{
      switch(m.t){
        case 'send':{
          if(!m.to||!m.payload)return;
          if(m.to===me){bcast(me,{t:'data',from:me,payload:m.payload},ws);return;}
          await deliver(me,m.to,m.payload,m.bridge!==false);return;}
        case 'self': bcast(me,{t:'self',payload:m.payload},ws);return;
        case 'ml_post':{
          const {key,rec,chat}=m; if(!key||!rec||!chat)return;
          mlPut(me,key,{...rec,chat,out:true,from:me},ws);
          if(chat!=='saved'){ mlPut(chat,key,{...(m.recPeer||rec),chat:me,out:false,from:me}); sendW(ws,{t:'ml_ack',key}); }
          return;}
        case 'ml_patch':{
          const {key,patch,chat}=m; if(!key||!patch)return;
          mlPatch(me,key,patch,null);
          if(chat&&chat!=='saved'&&!patch.gone)mlPatch(chat,key,m.patchPeer||patch,null);
          return;}
        case 'vault_put':{
          if(!m.key||typeof m.blob!=='string'||m.blob.length>1500000)return;
          const now=Date.now();
          qRun('INSERT OR REPLACE INTO vault(user,key,blob,upd) VALUES(?,?,?,?)',me,m.key,m.blob,now);
          bcast(me,{t:'vault',key:m.key,blob:m.blob,upd:now},ws);return;}
        case 'vault_sync':{
          const since=+m.since||0;
          const rows=qAll('SELECT key,blob,upd FROM vault WHERE user=? AND upd>? ORDER BY upd LIMIT 2000',me,since);
          sendW(ws,{t:'vault_batch',items:rows,more:rows.length===2000});return;}
        case 'ml_sync':{
          const since=+m.since||0;
          const rows=since?qAll('SELECT key,rec,upd FROM ml WHERE user=? AND upd>? ORDER BY upd LIMIT 1000',me,since)
            :qAll('SELECT key,rec,upd FROM ml WHERE user=? ORDER BY key DESC LIMIT 400',me).reverse();
          sendW(ws,{t:'ml_batch',items:rows.map(r=>({key:r.key,rec:JSON.parse(r.rec),upd:r.upd})),full:!since});return;}
      }
    }catch(e){console.error('ws msg:',e);}
  });
  const leave=()=>{ const s=conns.get(user); if(s){s.delete(ws); if(!s.size)conns.delete(user);} if(!bg&&!appSocks(user).length)setPresence(user,false); };
  ws.on('close',leave); ws.on('error',leave);
});

// ════════ HTTP ════════
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Mime, X-Name','Access-Control-Max-Age':'86400'};
const J=(res,o,s=200)=>{res.writeHead(s,{...CORS,'Content-Type':'application/json'});res.end(JSON.stringify(o));};
const E=(res,code,msg,s=400)=>J(res,{ok:false,error:code,message:msg},s);

const routes={
  async 'POST /auth/login'(req,res,d){
    const u=String(d.u||'').toLowerCase();
    if(!validUser(u)||!validHash(d.h))return E(res,'bad_request','Неверные данные');
    const locked=failCheck(u); if(locked)return E(res,'locked','Слишком много попыток — подожди '+locked+' мин.',429);
    let user=getUser(u);
    if(!user){
      const fb=await fbGet('auth/'+u);
      if(!fb)return E(res,'not_found','Аккаунт не найден — зарегистрируйся!',404);
      if(!fb.hash||fb.reset){ qRun('INSERT OR IGNORE INTO users(username,salt,verifier,created,pass_updated,migrated) VALUES(?,NULL,NULL,?,?,1)',u,Date.now(),Date.now());
        return J(res,{ok:true,status:'set_password',rt:await newReset(u)}); }
      if(!same(fb.hash,d.h)){failAdd(u);return E(res,'wrong_password','Неверный пароль',401);}
      await setPassword(u,d.h,true); await fbMarkMigrated(u); failClear(u);
      return J(res,{ok:true,status:'ok',token:await newSession(u,d.device),migrated:true});
    }
    if(!user.verifier)return J(res,{ok:true,status:'set_password',rt:await newReset(u)});
    if(!same(await sha(user.salt+d.h),user.verifier)){failAdd(u);return E(res,'wrong_password','Неверный пароль',401);}
    failClear(u); return J(res,{ok:true,status:'ok',token:await newSession(u,d.device)});
  },
  async 'POST /auth/register'(req,res,d){
    const u=String(d.u||'').toLowerCase();
    if(!validUser(u)||!validHash(d.h))return E(res,'bad_request','Юзернейм: 3–20 символов, латиница, цифры и _');
    if(getUser(u))return E(res,'taken','Юзернейм занят — выбери другой или войди',409);
    if(await fbGet('auth/'+u))return E(res,'taken','Юзернейм занят — выбери другой или войди',409);
    await setPassword(u,d.h,false); await fbMarkMigrated(u);
    return J(res,{ok:true,token:await newSession(u,d.device)});
  },
  async 'POST /auth/set-password'(req,res,d){
    const u=String(d.u||'').toLowerCase();
    if(!validUser(u)||!validHash(d.h)||!d.rt)return E(res,'bad_request','Неверные данные');
    const r=qGet('SELECT username,expires FROM resets WHERE token_hash=?',await sha(d.rt));
    if(!r||r.username!==u||r.expires<Date.now())return E(res,'expired','Ссылка устарела — войди ещё раз',401);
    qRun('DELETE FROM resets WHERE username=?',u); await setPassword(u,d.h,true); await fbMarkMigrated(u);
    return J(res,{ok:true,token:await newSession(u,d.device)});
  },
  async 'POST /auth/change-password'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    if(!validHash(d.old)||!validHash(d.h))return E(res,'bad_request','Неверные данные');
    const user=getUser(u);
    if(user?.verifier&&!same(await sha(user.salt+d.old),user.verifier))return E(res,'wrong_password','Неверный текущий пароль',401);
    await setPassword(u,d.h,!!user?.migrated);
    qRun('DELETE FROM sessions WHERE username=?',u);
    return J(res,{ok:true,token:await newSession(u,d.device)});
  },
  async 'GET /auth/me'(req,res){ const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401); return J(res,{ok:true,username:u,admin:isAdmin(u)}); },
  async 'POST /auth/logout'(req,res){
    const h=req.headers['authorization']||'';
    if(h.startsWith('Bearer ')){ const th=await sha(h.slice(7));
      const ses=qGet('SELECT username,device FROM sessions WHERE token_hash=?',th);
      qRun('DELETE FROM sessions WHERE token_hash=?',th);
      if(ses?.device){ await dropPushSubs(ses.username,s=>s&&s.dev===ses.device); qRun('DELETE FROM fcm_tokens WHERE username=? AND device=?',ses.username,ses.device); }
    }
    return J(res,{ok:true});
  },
  async 'GET /auth/exists'(req,res,d,url){
    const u=String(url.searchParams.get('u')||'').toLowerCase();
    if(!validUser(u))return J(res,{ok:true,exists:false});
    return J(res,{ok:true,exists:!!getUser(u)||!!(await fbGet('auth/'+u))});
  },
  async 'GET /turn'(req,res){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    if(process.env.TURN_URLS&&process.env.TURN_USER&&process.env.TURN_PASS)
      return J(res,{ok:true,iceServers:[{urls:process.env.TURN_URLS.split(',').map(x=>x.trim()).filter(Boolean),username:process.env.TURN_USER,credential:process.env.TURN_PASS}],ttl:86400});
    return E(res,'no_turn','TURN не настроен',503);
  },
  async 'GET /presence'(req,res,d,url){
    const us=String(url.searchParams.get('u')||'').toLowerCase().split(',').filter(validUser).slice(0,200);
    if(!us.length)return J(res,{ok:true,presence:{}});
    const rows=qAll('SELECT username,online,ts,ls FROM presence WHERE username IN ('+us.map(()=>'?').join(',')+')',...us);
    const out={}; for(const r of rows)out[r.username]={online:!!r.online,ts:r.ts,ls:r.ls};
    return J(res,{ok:true,presence:out});
  },
  async 'POST /profile'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const data=JSON.stringify(d.data||{}); if(data.length>900000)return E(res,'too_large','Профиль слишком большой (аватарка?)',413);
    qRun('INSERT INTO profiles(username,data,ts) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET data=excluded.data,ts=excluded.ts',u,data,Date.now());
    return J(res,{ok:true});
  },
  async 'GET /profiles'(req,res,d,url){
    const us=String(url.searchParams.get('u')||'').toLowerCase().split(',').filter(validUser).slice(0,100);
    if(!us.length)return J(res,{ok:true,profiles:{}});
    const rows=qAll('SELECT username,data,ts FROM profiles WHERE username IN ('+us.map(()=>'?').join(',')+')',...us);
    const out={}; for(const r of rows){try{out[r.username]={...JSON.parse(r.data),ts:r.ts};}catch(e){}}
    return J(res,{ok:true,profiles:out});
  },
  async 'GET /me/sync'(req,res){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const r=qGet('SELECT data,ts FROM user_sync WHERE username=?',u);
    return J(res,{ok:true,data:r?JSON.parse(r.data):null,ts:r?.ts||0});
  },
  async 'POST /me/sync'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const data=JSON.stringify(d.data||{}); if(data.length>900000)return E(res,'too_large','Слишком большой профиль',413);
    const ts=+d.ts||Date.now();
    qRun('INSERT INTO user_sync(username,data,ts) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET data=excluded.data,ts=excluded.ts WHERE excluded.ts>user_sync.ts',u,data,ts);
    bcast(u,{t:'self',payload:{type:'profile_sync',data:d.data,ts,dev:d.dev||''}});
    return J(res,{ok:true});
  },
  async 'POST /e2e/register'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const dev=+d.deviceId;
    if(!Number.isInteger(dev)||dev<1||!d.ik||!d.ikd||!d.spk?.pub||!d.spk?.sig)return E(res,'bad_request','Неверные ключи');
    const cnt=qGet('SELECT COUNT(*) AS n FROM e2e_devices WHERE username=? AND device_id<>?',u,dev);
    if((cnt?.n||0)>=20)return E(res,'too_many_devices','Слишком много устройств',409);
    qRun(`INSERT INTO e2e_devices(username,device_id,ik,ikd,spk_id,spk_pub,spk_sig,updated) VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT(username,device_id) DO UPDATE SET ik=excluded.ik,ikd=excluded.ikd,spk_id=excluded.spk_id,spk_pub=excluded.spk_pub,spk_sig=excluded.spk_sig,updated=excluded.updated`,
      u,dev,String(d.ik),String(d.ikd),+d.spk.id,String(d.spk.pub),String(d.spk.sig),Date.now());
    putPrekeys(u,dev,d.opks); return J(res,{ok:true});
  },
  async 'POST /e2e/prekeys'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    putPrekeys(u,+d.deviceId,d.opks);
    if(d.spk?.pub)qRun('UPDATE e2e_devices SET spk_id=?,spk_pub=?,spk_sig=?,updated=? WHERE username=? AND device_id=?',+d.spk.id,String(d.spk.pub),String(d.spk.sig),Date.now(),u,+d.deviceId);
    return J(res,{ok:true});
  },
  async 'GET /e2e/count'(req,res,d,url){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const dev=+url.searchParams.get('d');
    const r=qGet('SELECT COUNT(*) AS n FROM e2e_prekeys WHERE username=? AND device_id=?',u,dev);
    const reg=qGet('SELECT 1 AS x FROM e2e_devices WHERE username=? AND device_id=?',u,dev);
    return J(res,{ok:true,count:r?.n||0,registered:!!reg});
  },
  async 'POST /e2e/nk'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    if(!d.nk||!d.sig||String(d.nk).length>64||String(d.sig).length>128)return E(res,'bad_request','Неверный ключ');
    qRun('UPDATE e2e_devices SET nk=?,nks=? WHERE username=? AND device_id=?',String(d.nk),String(d.sig),u,+d.deviceId);
    return J(res,{ok:true});
  },
  async 'GET /e2e/devices'(req,res,d,url){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const us=String(url.searchParams.get('u')||'').toLowerCase().split(',').filter(validUser).slice(0,20);
    if(!us.length)return J(res,{ok:true,devices:{}});
    const rows=qAll('SELECT username,device_id,ik,nk,nks FROM e2e_devices WHERE username IN ('+us.map(()=>'?').join(',')+')',...us);
    const out={}; for(const x of us)out[x]=[];
    for(const r of rows)out[r.username].push(r.nk?{d:r.device_id,ik:r.ik,nk:r.nk,nks:r.nks}:{d:r.device_id,ik:r.ik});
    return J(res,{ok:true,devices:out});
  },
  async 'GET /e2e/bundle'(req,res,d,url){
    const me=await authed(req); if(!me)return E(res,'unauthorized','Войди заново',401);
    const u=String(url.searchParams.get('u')||'').toLowerCase(),dev=+url.searchParams.get('d');
    const r=qGet('SELECT * FROM e2e_devices WHERE username=? AND device_id=?',u,dev);
    if(!r)return E(res,'not_found','Нет такого устройства',404);
    const opk=qGet('DELETE FROM e2e_prekeys WHERE rowid=(SELECT rowid FROM e2e_prekeys WHERE username=? AND device_id=? LIMIT 1) RETURNING key_id,pub',u,dev);
    return J(res,{ok:true,bundle:{ik:r.ik,ikd:r.ikd,spk:{id:r.spk_id,pub:r.spk_pub,sig:r.spk_sig},opk:opk?{id:opk.key_id,pub:opk.pub}:null}});
  },
  async 'POST /e2e/remove'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const dev=+d.deviceId;
    qRun('DELETE FROM e2e_devices WHERE username=? AND device_id=?',u,dev);
    qRun('DELETE FROM e2e_prekeys WHERE username=? AND device_id=?',u,dev);
    return J(res,{ok:true});
  },
  async 'GET /e2e/vaultkey'(req,res){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const r=qGet('SELECT wrapped,ts FROM vault_keys WHERE username=?',u);
    return J(res,{ok:true,wrapped:r?.wrapped||null,ts:r?.ts||0});
  },
  async 'POST /e2e/vaultkey'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    if(typeof d.wrapped!=='string'||d.wrapped.length>2000)return E(res,'bad_request','Неверные данные');
    if(d.replace)qRun('INSERT INTO vault_keys(username,wrapped,ts) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET wrapped=excluded.wrapped,ts=excluded.ts',u,d.wrapped,Date.now());
    else qRun('INSERT OR IGNORE INTO vault_keys(username,wrapped,ts) VALUES(?,?,?)',u,d.wrapped,Date.now());
    return J(res,{ok:true,wrapped:qGet('SELECT wrapped FROM vault_keys WHERE username=?',u).wrapped});
  },
  async 'POST /push/fcm'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    if(typeof d.token!=='string'||d.token.length<20||d.token.length>4096)return E(res,'bad_request','Неверный токен');
    qRun('INSERT INTO fcm_tokens(username,device,token,updated) VALUES(?,?,?,?) ON CONFLICT(username,device) DO UPDATE SET token=excluded.token,updated=excluded.updated',
      u,String(d.dev||'').slice(0,40)||'android',d.token,Date.now());
    return J(res,{ok:true});
  },
  async 'POST /signal'(req,res,d){
    const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
    const to=String(d.to||'').toLowerCase();
    if(!validUser(to)||!d.payload||typeof d.payload.type!=='string')return E(res,'bad_request','Неверные данные');
    if(!['call_reject','call_cancel','call_end','read'].includes(d.payload.type))return E(res,'forbidden','Нельзя',403);
    await deliver(u,to,d.payload,true); return J(res,{ok:true});
  },
  async 'POST /admin/reset-password'(req,res,d){
    const a=await authed(req); if(!a||!isAdmin(a))return E(res,'forbidden','Только для админов',403);
    const u=String(d.u||'').toLowerCase(); if(!validUser(u))return E(res,'bad_request','Неверный юзернейм');
    const now=Date.now();
    qRun(`INSERT INTO users(username,salt,verifier,created,pass_updated,migrated) VALUES(?,NULL,NULL,?,?,1)
      ON CONFLICT(username) DO UPDATE SET salt=NULL,verifier=NULL,pass_updated=excluded.pass_updated`,u,now,now);
    qRun('DELETE FROM sessions WHERE username=?',u); qRun('DELETE FROM vault_keys WHERE username=?',u);
    await fbPut('auth/'+u,{migrated:true,reset:{by:a,ts:now}});
    return J(res,{ok:true});
  },
};

// ── Медиа ──
function readBody(req,limit){ return new Promise((resolve,reject)=>{ const chunks=[]; let n=0;
  req.on('data',c=>{n+=c.length; if(n>limit){reject(new Error('too_large'));req.destroy();return;} chunks.push(c);});
  req.on('end',()=>resolve(Buffer.concat(chunks))); req.on('error',reject); }); }
async function mediaUpload(req,res){
  const u=await authed(req); if(!u)return E(res,'unauthorized','Войди заново',401);
  let buf; try{buf=await readBody(req,MEDIA_MAX);}catch(e){return E(res,'too_large','Файл больше 100 МБ',413);}
  if(!buf.length)return E(res,'empty','Пустой файл');
  const id=rnd(18);
  const mime=(req.headers['x-mime']||req.headers['content-type']||'application/octet-stream').slice(0,100);
  const name=decodeURIComponent(req.headers['x-name']||'').slice(0,200);
  qRun('INSERT OR REPLACE INTO media(id,mime,name,size,owner,created,data) VALUES(?,?,?,?,?,?,?)',id,mime,name,buf.length,u,Date.now(),buf);
  return J(res,{ok:true,id,size:buf.length});
}
function mediaGet(id,res){
  if(!/^[A-Za-z0-9_-]{16,40}$/.test(id))return E(res,'not_found','Нет файла',404);
  const m=qGet('SELECT mime,name,size,data FROM media WHERE id=?',id);
  if(!m)return E(res,'not_found','Файл не найден',404);
  res.writeHead(200,{...CORS,'Content-Type':m.mime||'application/octet-stream','Content-Length':String(m.size),'Cache-Control':'public, max-age=31536000, immutable'});
  res.end(m.data);
}

// ── Статика (сайт на том же адресе) ──
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
function serveStatic(req,res,pathname){
  let rel=decodeURIComponent(pathname).replace(/\?.*$/,''); if(rel==='/'||rel==='')rel='/index.html';
  const full=path.join(WEB_DIR,path.normalize(rel));
  if(!full.startsWith(WEB_DIR)){res.writeHead(403);res.end('forbidden');return;}
  fs.readFile(full,(e,data)=>{
    if(e){res.writeHead(404,{...CORS,'Content-Type':'text/plain; charset=utf-8'});res.end('404');return;}
    res.writeHead(200,{...CORS,'Content-Type':MIME[path.extname(full).toLowerCase()]||'application/octet-stream'});res.end(data);
  });
}

const server=http.createServer(async (req,res)=>{
  try{
    if(req.method==='OPTIONS'){res.writeHead(204,CORS);res.end();return;}
    const url=new URL(req.url,'http://x');
    const p=url.pathname;
    if(p==='/api'||p==='/api/')return J(res,{ok:true,service:'slon-server',version:1});
    if(p==='/media'&&req.method==='POST')return mediaUpload(req,res).catch(e=>{console.error(e);E(res,'server','Не удалось сохранить файл',500);});
    if(p.startsWith('/media/')&&req.method==='GET')return mediaGet(p.slice(7),res);
    const h=routes[req.method+' '+p];
    if(h){ let d={}; if(req.method==='POST'){ try{const b=await readBody(req,2*1024*1024); d=b.length?JSON.parse(b.toString()):{};}catch(e){return E(res,'bad_json','Неверный JSON');} }
      return h(req,res,d,url).catch(e=>{console.error(e);E(res,'server','Ошибка сервера',500);}); }
    if(req.method==='GET')return serveStatic(req,res,p);
    E(res,'not_found','Нет такого метода',404);
  }catch(e){console.error(e);E(res,'server','Ошибка',500);}
});

// ── WebSocket upgrade (/ws?token=…) — токен в адресе, у WebSocket нет заголовков ──
server.on('upgrade',async (req,socket,head)=>{
  try{
    const url=new URL(req.url,'http://x');
    if(url.pathname!=='/ws'){socket.destroy();return;}
    const tok=url.searchParams.get('token')||'';
    const s=tok?qGet('SELECT username FROM sessions WHERE token_hash=?',await sha(tok)):null;
    if(!s){socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');socket.destroy();return;}
    const dev=(url.searchParams.get('dev')||'').slice(0,40);
    const bg=url.searchParams.get('bg')==='1';
    const ls=url.searchParams.get('ls');
    wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,s.username,dev,bg,ls));
  }catch(e){try{socket.destroy();}catch(_){}}
});

// периодическая чистка протухшей офлайн-очереди
setInterval(()=>{try{qRun('DELETE FROM queue WHERE ts<?',Date.now()-QUEUE_TTL);}catch(e){}},3600e3);

server.listen(PORT,()=>console.log('SLON server на :'+PORT+'  (сайт из '+WEB_DIR+', база '+path.join(DATA_DIR,'slon.db')+')'));
