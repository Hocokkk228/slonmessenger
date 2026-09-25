// SLON push relay — Cloudflare Worker.
// Будит телефон пушем, даже когда мессенджер закрыт.
// POST /send {to, payload}  → берёт подписки получателя из Firebase
// (push_subs/{to}) и шлёт каждому устройству зашифрованный Web Push
// (RFC 8291 aes128gcm + VAPID RFC 8292). Мёртвые подписки удаляет.
// Секрет VAPID_PRIVATE_JWK (приватный ключ) задаётся в Cloudflare, не в коде.

const DB_URL='https://slon-376b4-default-rtdb.europe-west1.firebasedatabase.app';
const VAPID_PUBLIC='BGFKS0j-jPYtHB-zbRte_eY5TgPXfqQxlBC4mfhFuYv82n3JRrBGWJd8CRGP7S6AXkBnP9OAoBic4DcUhkDhMXk';   // подставляется при деплое (см. README)
const VAPID_SUB='mailto:hopasup789@gmail.com';
const MAX_PAYLOAD=3000;

const enc=new TextEncoder();
const b64u={
  enc:buf=>{let s='';const b=new Uint8Array(buf);for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');},
  dec:str=>{str=str.replace(/-/g,'+').replace(/_/g,'/');while(str.length%4)str+='=';const s=atob(str),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;},
};
const concat=(...a)=>{const n=a.reduce((x,y)=>x+y.length,0),o=new Uint8Array(n);let p=0;for(const x of a){o.set(x,p);p+=x.length;}return o;};

async function hkdf(salt,ikm,info,len){
  const key=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},key,len*8));
}

// RFC 8291: шифрование содержимого пуша ключами подписки (p256dh, auth)
async function encryptPayload(sub,plaintext){
  const uaPub=b64u.dec(sub.keys.p256dh),auth=b64u.dec(sub.keys.auth);
  const as=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
  const asPub=new Uint8Array(await crypto.subtle.exportKey('raw',as.publicKey));
  const uaKey=await crypto.subtle.importKey('raw',uaPub,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:uaKey},as.privateKey,256));
  const ikm=await hkdf(auth,shared,concat(enc.encode('WebPush: info\0'),uaPub,asPub),32);
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const cek=await hkdf(salt,ikm,enc.encode('Content-Encoding: aes128gcm\0'),16);
  const nonce=await hkdf(salt,ikm,enc.encode('Content-Encoding: nonce\0'),12);
  const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,concat(plaintext,new Uint8Array([2]))));
  const rs=new Uint8Array([0,0,16,0]); // 4096
  return concat(salt,rs,new Uint8Array([asPub.length]),asPub,ct);
}

// RFC 8292: VAPID JWT, подписанный нашим приватным ключом
let _vapidKey=null;
async function vapidAuth(endpoint,env){
  if(!_vapidKey)_vapidKey=await crypto.subtle.importKey('jwk',JSON.parse(env.VAPID_PRIVATE_JWK),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const aud=new URL(endpoint).origin;
  const head=b64u.enc(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'})));
  const body=b64u.enc(enc.encode(JSON.stringify({aud,exp:Math.floor(Date.now()/1000)+12*3600,sub:VAPID_SUB})));
  const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},_vapidKey,enc.encode(head+'.'+body));
  return 'vapid t='+head+'.'+body+'.'+b64u.enc(sig)+', k='+VAPID_PUBLIC;
}

async function sendOne(sub,payload,env,opts){
  const body=await encryptPayload(sub,enc.encode(payload));
  return fetch(sub.endpoint,{method:'POST',headers:{
    'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',
    'TTL':String(opts.ttl),'Urgency':opts.urgency,
    ...(opts.topic?{'Topic':opts.topic}:{}),
    'Authorization':await vapidAuth(sub.endpoint,env),
  },body});
}

const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...CORS,'Content-Type':'application/json'}});

export default {
  async fetch(req,env){
    if(req.method==='OPTIONS')return new Response(null,{headers:CORS});
    const url=new URL(req.url);
    if(req.method==='GET'&&url.pathname==='/')return json({ok:true,service:'slon-push'});
    if(req.method!=='POST'||url.pathname!=='/send')return json({error:'not found'},404);
    let d;try{d=await req.json();}catch(e){return json({error:'bad json'},400);}
    const to=String(d.to||'').toLowerCase();
    if(!/^[a-z0-9_]{2,40}$/.test(to)||!d.payload)return json({error:'bad request'},400);
    const payload=JSON.stringify(d.payload);
    if(payload.length>MAX_PAYLOAD)return json({error:'payload too large'},413);
    const subsRes=await fetch(DB_URL+'/push_subs/'+to+'.json');
    const subs=(await subsRes.json())||{};
    const isCall=d.payload.kind==='call';
    const opts={ttl:isCall?45:86400,urgency:isCall?'high':'normal',
      topic:d.payload.tag?String(d.payload.tag).replace(/[^A-Za-z0-9_-]/g,'_').slice(0,32):null};
    const results={};
    await Promise.all(Object.entries(subs).map(async([id,sub])=>{
      if(!sub||!sub.endpoint||!sub.keys)return;
      try{
        const r=await sendOne(sub,payload,env,opts);
        results[id]=r.status;
        // подписка больше не существует (приложение удалили/сбросили) — убираем
        if(r.status===404||r.status===410)await fetch(DB_URL+'/push_subs/'+to+'/'+id+'.json',{method:'DELETE'});
      }catch(e){results[id]='err:'+e.message;}
    }));
    return json({ok:true,sent:results});
  }
};
