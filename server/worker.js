// SLON API — Cloudflare Worker + D1.
// Этап 1 переезда с Firebase: аккаунты и вход.
// Пароль проверяется ТОЛЬКО на сервере; после входа устройство получает токен.
// Мягкая миграция: аккаунт, которого ещё нет в D1, сверяется со старым хешем
// в Firebase, переносится сюда, а хеш из Firebase стирается.

const FB='https://slon-376b4-default-rtdb.europe-west1.firebasedatabase.app';
const BUILTIN_ADMINS=['mamedov','vadimslonik67'];
const MAX_FAILS=10,LOCK_MS=5*60*1000,RESET_TTL=15*60*1000;

const MEDIA_SHARDS=8,MEDIA_CHUNK=1024*1024,MEDIA_MAX=100*1024*1024;

// ── Хранилище медиа: Durable Object с SQLite. Файл режется на куски по 1 МБ
// (лимит строки 2 МБ). Шардируем по id, чтобы нагрузка делилась на 8 объектов.
import {DurableObject} from 'cloudflare:workers';
import {UserHub} from './hub.js';
export {UserHub};
export class MediaStore extends DurableObject{
  constructor(ctx,env){
    super(ctx,env);
    this.sql=ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS meta(id TEXT PRIMARY KEY,mime TEXT,name TEXT,size INTEGER,chunks INTEGER,owner TEXT,created INTEGER);
      CREATE TABLE IF NOT EXISTS chunks(id TEXT,idx INTEGER,data BLOB,PRIMARY KEY(id,idx));`);
  }
  async put(id,buf,mime,name,owner){
    const b=new Uint8Array(buf),n=Math.max(1,Math.ceil(b.length/MEDIA_CHUNK));
    for(let i=0;i<n;i++)this.sql.exec('INSERT OR REPLACE INTO chunks(id,idx,data) VALUES(?,?,?)',id,i,b.subarray(i*MEDIA_CHUNK,(i+1)*MEDIA_CHUNK));
    this.sql.exec('INSERT OR REPLACE INTO meta(id,mime,name,size,chunks,owner,created) VALUES(?,?,?,?,?,?,?)',id,mime,name,b.length,n,owner,Date.now());
    return {id,size:b.length};
  }
  async get(id){
    const m=[...this.sql.exec('SELECT * FROM meta WHERE id=?',id)][0];
    if(!m)return null;
    const parts=[...this.sql.exec('SELECT data FROM chunks WHERE id=? ORDER BY idx',id)].map(x=>new Uint8Array(x.data));
    const out=new Uint8Array(m.size);let p=0;for(const c of parts){out.set(c,p);p+=c.length;}
    return {mime:m.mime,name:m.name,size:m.size,body:out.buffer};
  }
}
const mediaStub=(env,id)=>{let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))|0;return env.MEDIA.get(env.MEDIA.idFromName('shard'+(Math.abs(h)%MEDIA_SHARDS)));};

const enc=new TextEncoder();
const hex=buf=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const rnd=n=>{const b=crypto.getRandomValues(new Uint8Array(n));return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
// сравнение без утечки по времени
const same=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0;};
const validUser=u=>typeof u==='string'&&/^[a-z0-9_]{3,20}$/.test(u);
const validHash=h=>typeof h==='string'&&/^[0-9a-f]{64}$/.test(h);

const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Mime, X-Name','Access-Control-Max-Age':'86400'};
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...CORS,'Content-Type':'application/json'}});
const err=(code,msg,s=400)=>json({ok:false,error:code,message:msg},s);

// ── Firebase (только для миграции старых аккаунтов) ──
async function fbGet(path){const r=await fetch(FB+'/'+path+'.json');return r.ok?r.json():null;}
async function fbPut(path,val){await fetch(FB+'/'+path+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(val)}).catch(()=>{});}
// Хеш больше не лежит в открытой базе — только метка, что юзернейм занят
const fbMarkMigrated=u=>fbPut('auth/'+u,{migrated:true,ts:Date.now()});

async function getUser(env,u){return env.DB.prepare('SELECT * FROM users WHERE username=?').bind(u).first();}
async function setPassword(env,u,clientHash,migrated){
  const salt=rnd(16),verifier=await sha(salt+clientHash),now=Date.now();
  await env.DB.prepare(`INSERT INTO users(username,salt,verifier,created,pass_updated,migrated) VALUES(?,?,?,?,?,?)
    ON CONFLICT(username) DO UPDATE SET salt=excluded.salt,verifier=excluded.verifier,pass_updated=excluded.pass_updated`)
    .bind(u,salt,verifier,now,now,migrated?1:0).run();
}
async function newSession(env,u,device){
  const token=rnd(32),now=Date.now();
  await env.DB.prepare('INSERT INTO sessions(token_hash,username,device,created,last_seen) VALUES(?,?,?,?,?)')
    .bind(await sha(token),u,String(device||'').slice(0,40),now,now).run();
  return token;
}
async function newReset(env,u){
  const t=rnd(24);
  await env.DB.prepare('INSERT INTO resets(token_hash,username,expires) VALUES(?,?,?)').bind(await sha(t),u,Date.now()+RESET_TTL).run();
  return t;
}
async function authed(req,env){
  const h=req.headers.get('Authorization')||'';
  const t=h.startsWith('Bearer ')?h.slice(7):'';
  if(!t)return null;
  const s=await env.DB.prepare('SELECT username,last_seen FROM sessions WHERE token_hash=?').bind(await sha(t)).first();
  if(!s)return null;
  if(Date.now()-s.last_seen>3600e3)await env.DB.prepare('UPDATE sessions SET last_seen=? WHERE token_hash=?').bind(Date.now(),await sha(t)).run();
  return s.username;
}
async function isAdmin(env,u){
  if(BUILTIN_ADMINS.includes(u))return true;
  return !!(await env.DB.prepare('SELECT 1 FROM admins WHERE username=?').bind(u).first());
}
async function failCheck(env,u){
  const f=await env.DB.prepare('SELECT count,until FROM login_fails WHERE username=?').bind(u).first();
  return f&&f.count>=MAX_FAILS&&f.until>Date.now()?Math.ceil((f.until-Date.now())/60000):0;
}
async function failAdd(env,u){
  await env.DB.prepare(`INSERT INTO login_fails(username,count,until) VALUES(?,1,?)
    ON CONFLICT(username) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END, until=?`)
    .bind(u,Date.now()+LOCK_MS,Date.now(),Date.now()+LOCK_MS).run();
}
const failClear=(env,u)=>env.DB.prepare('DELETE FROM login_fails WHERE username=?').bind(u).run();

// ── Маршруты ──
const routes={
  // Вход. h = SHA-256(пароль) в hex, как считал клиент и раньше.
  async 'POST /auth/login'(req,env,d){
    const u=String(d.u||'').toLowerCase();
    if(!validUser(u)||!validHash(d.h))return err('bad_request','Неверные данные');
    const locked=await failCheck(env,u);
    if(locked)return err('locked','Слишком много попыток — подожди '+locked+' мин.',429);
    let user=await getUser(env,u);
    if(!user){
      // Нет у нас — пробуем перенести из Firebase
      const fb=await fbGet('auth/'+u);
      if(!fb)return err('not_found','Аккаунт не найден — зарегистрируйся!',404);
      if(!fb.hash||fb.reset){
        // Пароль сброшен админом (или его не было) — даём установить новый
        await env.DB.prepare('INSERT OR IGNORE INTO users(username,salt,verifier,created,pass_updated,migrated) VALUES(?,NULL,NULL,?,?,1)').bind(u,Date.now(),Date.now()).run();
        return json({ok:true,status:'set_password',rt:await newReset(env,u)});
      }
      if(!same(fb.hash,d.h)){await failAdd(env,u);return err('wrong_password','Неверный пароль',401);}
      await setPassword(env,u,d.h,true);
      await fbMarkMigrated(u);
      await failClear(env,u);
      return json({ok:true,status:'ok',token:await newSession(env,u,d.device),migrated:true});
    }
    if(!user.verifier)return json({ok:true,status:'set_password',rt:await newReset(env,u)});
    if(!same(await sha(user.salt+d.h),user.verifier)){await failAdd(env,u);return err('wrong_password','Неверный пароль',401);}
    await failClear(env,u);
    return json({ok:true,status:'ok',token:await newSession(env,u,d.device)});
  },

  async 'POST /auth/register'(req,env,d){
    const u=String(d.u||'').toLowerCase();
    if(!validUser(u)||!validHash(d.h))return err('bad_request','Юзернейм: 3–20 символов, латиница, цифры и _');
    if(await getUser(env,u))return err('taken','Юзернейм занят — выбери другой или войди',409);
    if(await fbGet('auth/'+u))return err('taken','Юзернейм занят — выбери другой или войди',409);
    await setPassword(env,u,d.h,false);
    await fbMarkMigrated(u);   // юзернейм занят и для старых проверок
    return json({ok:true,token:await newSession(env,u,d.device)});
  },

  // Новый пароль после сброса (rt — одноразовый токен из /auth/login)
  async 'POST /auth/set-password'(req,env,d){
    const u=String(d.u||'').toLowerCase();
    if(!validUser(u)||!validHash(d.h)||!d.rt)return err('bad_request','Неверные данные');
    const r=await env.DB.prepare('SELECT username,expires FROM resets WHERE token_hash=?').bind(await sha(d.rt)).first();
    if(!r||r.username!==u||r.expires<Date.now())return err('expired','Ссылка устарела — войди ещё раз',401);
    await env.DB.prepare('DELETE FROM resets WHERE username=?').bind(u).run();
    await setPassword(env,u,d.h,true);
    await fbMarkMigrated(u);
    return json({ok:true,token:await newSession(env,u,d.device)});
  },

  async 'POST /auth/change-password'(req,env,d){
    const u=await authed(req,env);if(!u)return err('unauthorized','Войди заново',401);
    if(!validHash(d.old)||!validHash(d.h))return err('bad_request','Неверные данные');
    const user=await getUser(env,u);
    if(user?.verifier&&!same(await sha(user.salt+d.old),user.verifier))return err('wrong_password','Неверный текущий пароль',401);
    await setPassword(env,u,d.h,!!user?.migrated);
    // все остальные устройства выходят, текущее получает новый токен
    await env.DB.prepare('DELETE FROM sessions WHERE username=?').bind(u).run();
    return json({ok:true,token:await newSession(env,u,d.device)});
  },

  async 'GET /auth/me'(req,env){
    const u=await authed(req,env);if(!u)return err('unauthorized','Войди заново',401);
    return json({ok:true,username:u,admin:await isAdmin(env,u)});
  },

  async 'POST /auth/logout'(req,env){
    const h=req.headers.get('Authorization')||'';
    if(h.startsWith('Bearer '))await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(h.slice(7))).run();
    return json({ok:true});
  },

  // Существует ли аккаунт (для поиска/регистрации) — без раскрытия данных
  async 'GET /auth/exists'(req,env){
    const u=String(new URL(req.url).searchParams.get('u')||'').toLowerCase();
    if(!validUser(u))return json({ok:true,exists:false});
    const exists=!!(await getUser(env,u))||!!(await fbGet('auth/'+u));
    return json({ok:true,exists});
  },

  // Серверы для звонков: свой TURN Cloudflare (быстрый ретранслятор — демка и видео
  // без «144p», когда прямое соединение не получилось). Доступ временный, на сутки.
  async 'GET /turn'(req,env){
    const u=await authed(req,env);if(!u)return err('unauthorized','Войди заново',401);
    // Статичный TURN (ExpressTURN и т.п. — без карты): секреты TURN_URLS (через запятую), TURN_USER, TURN_PASS
    if(env.TURN_URLS&&env.TURN_USER&&env.TURN_PASS)
      return json({ok:true,iceServers:[{urls:String(env.TURN_URLS).split(',').map(x=>x.trim()).filter(Boolean),username:env.TURN_USER,credential:env.TURN_PASS}],ttl:86400});
    if(!env.TURN_KEY_ID||!env.TURN_KEY_TOKEN)return err('no_turn','TURN не настроен',503);
    const r=await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/'+env.TURN_KEY_ID+'/credentials/generate-ice-servers',{
      method:'POST',headers:{'Authorization':'Bearer '+env.TURN_KEY_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({ttl:86400})});
    if(!r.ok)return err('turn_failed','TURN недоступен',502);
    const d=await r.json();
    return json({ok:true,iceServers:d.iceServers||[],ttl:86400});
  },

  // ── Статусы «в сети» / «был(а)» — пачкой по списку контактов ──
  async 'GET /presence'(req,env){
    const us=String(new URL(req.url).searchParams.get('u')||'').toLowerCase().split(',').filter(validUser).slice(0,200);
    if(!us.length)return json({ok:true,presence:{}});
    const rows=(await env.DB.prepare('SELECT username,online,ts,ls FROM presence WHERE username IN ('+us.map(()=>'?').join(',')+')').bind(...us).all()).results||[];
    const out={};for(const r of rows)out[r.username]={online:!!r.online,ts:r.ts,ls:r.ls};
    return json({ok:true,presence:out});
  },

  // ── Публичные профили (то, что видят все; скрытое по приватности сюда не кладётся) ──
  async 'POST /profile'(req,env,d){
    const u=await authed(req,env);if(!u)return err('unauthorized','Войди заново',401);
    const data=JSON.stringify(d.data||{});
    if(data.length>900000)return err('too_large','Профиль слишком большой (аватарка?)',413);
    await env.DB.prepare('INSERT INTO profiles(username,data,ts) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET data=excluded.data,ts=excluded.ts')
      .bind(u,data,Date.now()).run();
    return json({ok:true});
  },
  async 'GET /profiles'(req,env){
    const us=String(new URL(req.url).searchParams.get('u')||'').toLowerCase().split(',').filter(validUser).slice(0,100);
    if(!us.length)return json({ok:true,profiles:{}});
    const rows=(await env.DB.prepare('SELECT username,data,ts FROM profiles WHERE username IN ('+us.map(()=>'?').join(',')+')').bind(...us).all()).results||[];
    const out={};for(const r of rows){try{out[r.username]={...JSON.parse(r.data),ts:r.ts};}catch(e){}}
    return json({ok:true,profiles:out});
  },

  // ── Синк своего профиля/кастомизации между своими устройствами ──
  async 'GET /me/sync'(req,env){
    const u=await authed(req,env);if(!u)return err('unauthorized','Войди заново',401);
    const r=await env.DB.prepare('SELECT data,ts FROM user_sync WHERE username=?').bind(u).first();
    return json({ok:true,data:r?JSON.parse(r.data):null,ts:r?.ts||0});
  },
  async 'POST /me/sync'(req,env,d){
    const u=await authed(req,env);if(!u)return err('unauthorized','Войди заново',401);
    const data=JSON.stringify(d.data||{});
    if(data.length>900000)return err('too_large','Слишком большой профиль',413);
    const ts=+d.ts||Date.now();
    await env.DB.prepare('INSERT INTO user_sync(username,data,ts) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET data=excluded.data,ts=excluded.ts WHERE excluded.ts>user_sync.ts')
      .bind(u,data,ts).run();
    await env.HUB.get(env.HUB.idFromName(u)).pushSelf({type:'profile_sync',data:d.data,ts,dev:d.dev||''});
    return json({ok:true});
  },

  // Сброс пароля — только админ
  async 'POST /admin/reset-password'(req,env,d){
    const a=await authed(req,env);if(!a||!(await isAdmin(env,a)))return err('forbidden','Только для админов',403);
    const u=String(d.u||'').toLowerCase();if(!validUser(u))return err('bad_request','Неверный юзернейм');
    const now=Date.now();
    await env.DB.prepare(`INSERT INTO users(username,salt,verifier,created,pass_updated,migrated) VALUES(?,NULL,NULL,?,?,1)
      ON CONFLICT(username) DO UPDATE SET salt=NULL,verifier=NULL,pass_updated=excluded.pass_updated`).bind(u,now,now).run();
    await env.DB.prepare('DELETE FROM sessions WHERE username=?').bind(u).run();
    await fbPut('auth/'+u,{migrated:true,reset:{by:a,ts:now}});
    return json({ok:true});
  },
};

async function mediaUpload(req,env){
  const u=await authed(req,env);if(!u)return err('unauthorized','Войди заново',401);
  const len=+(req.headers.get('Content-Length')||0);
  if(len>MEDIA_MAX)return err('too_large','Файл больше 100 МБ',413);
  const buf=await req.arrayBuffer();
  if(!buf.byteLength)return err('empty','Пустой файл');
  if(buf.byteLength>MEDIA_MAX)return err('too_large','Файл больше 100 МБ',413);
  const id=rnd(18);
  const mime=(req.headers.get('X-Mime')||req.headers.get('Content-Type')||'application/octet-stream').slice(0,100);
  const name=decodeURIComponent(req.headers.get('X-Name')||'').slice(0,200);
  await mediaStub(env,id).put(id,buf,mime,name,u);
  return json({ok:true,id,size:buf.byteLength});
}
async function mediaGet(id,env){
  if(!/^[A-Za-z0-9_-]{16,40}$/.test(id))return err('not_found','Нет файла',404);
  const f=await mediaStub(env,id).get(id);
  if(!f)return err('not_found','Файл не найден',404);
  return new Response(f.body,{headers:{...CORS,'Content-Type':f.mime||'application/octet-stream','Content-Length':String(f.size),
    'Cache-Control':'public, max-age=31536000, immutable'}});
}

export default {
  async fetch(req,env){
    if(req.method==='OPTIONS')return new Response(null,{headers:{...CORS,'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Mime, X-Name'}});
    const url=new URL(req.url);
    if(url.pathname==='/')return json({ok:true,service:'slon-api',version:2});
    // Живое соединение устройства с хабом аккаунта (токен в адресе — у WebSocket нет заголовков)
    if(url.pathname==='/ws'){
      if(req.headers.get('Upgrade')!=='websocket')return err('bad_request','Нужен WebSocket',426);
      const tok=url.searchParams.get('token')||'';
      const s=tok?await env.DB.prepare('SELECT username FROM sessions WHERE token_hash=?').bind(await sha(tok)).first():null;
      if(!s)return new Response('unauthorized',{status:401,headers:CORS});
      const fwd=new URL('https://hub/ws');
      fwd.searchParams.set('u',s.username);
      fwd.searchParams.set('dev',(url.searchParams.get('dev')||'').slice(0,40));
      fwd.searchParams.set('ls',url.searchParams.get('ls')==='0'?'0':'1');
      if(url.searchParams.get('bg')==='1')fwd.searchParams.set('bg','1');
      return env.HUB.get(env.HUB.idFromName(s.username)).fetch(new Request(fwd,req));
    }
    if(url.pathname==='/media'&&req.method==='POST')return mediaUpload(req,env).catch(e=>{console.error(e);return err('server','Не удалось сохранить файл',500);});
    if(url.pathname.startsWith('/media/')&&req.method==='GET')return mediaGet(url.pathname.slice(7),env).catch(e=>{console.error(e);return err('server','Ошибка',500);});
    const h=routes[req.method+' '+url.pathname];
    if(!h)return err('not_found','Нет такого метода',404);
    let d={};
    if(req.method==='POST'){try{d=await req.json();}catch(e){return err('bad_json','Неверный JSON');}}
    try{return await h(req,env,d);}
    catch(e){console.error(e);return err('server','Ошибка сервера',500);}
  }
};
