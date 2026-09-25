// SLON API — Cloudflare Worker + D1.
// Этап 1 переезда с Firebase: аккаунты и вход.
// Пароль проверяется ТОЛЬКО на сервере; после входа устройство получает токен.
// Мягкая миграция: аккаунт, которого ещё нет в D1, сверяется со старым хешем
// в Firebase, переносится сюда, а хеш из Firebase стирается.

const FB='https://slon-376b4-default-rtdb.europe-west1.firebasedatabase.app';
const BUILTIN_ADMINS=['mamedov','vadimslonik67'];
const MAX_FAILS=10,LOCK_MS=5*60*1000,RESET_TTL=15*60*1000;

const enc=new TextEncoder();
const hex=buf=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const rnd=n=>{const b=crypto.getRandomValues(new Uint8Array(n));return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
// сравнение без утечки по времени
const same=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0;};
const validUser=u=>typeof u==='string'&&/^[a-z0-9_]{3,20}$/.test(u);
const validHash=h=>typeof h==='string'&&/^[0-9a-f]{64}$/.test(h);

const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'86400'};
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

export default {
  async fetch(req,env){
    if(req.method==='OPTIONS')return new Response(null,{headers:CORS});
    const url=new URL(req.url);
    if(url.pathname==='/')return json({ok:true,service:'slon-api',version:1});
    const h=routes[req.method+' '+url.pathname];
    if(!h)return err('not_found','Нет такого метода',404);
    let d={};
    if(req.method==='POST'){try{d=await req.json();}catch(e){return err('bad_json','Неверный JSON');}}
    try{return await h(req,env,d);}
    catch(e){console.error(e);return err('server','Ошибка сервера',500);}
  }
};
