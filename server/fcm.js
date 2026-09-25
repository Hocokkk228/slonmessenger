// FCM (Firebase Cloud Messaging) — только чтобы разбудить Android-приложение,
// как это делает Telegram. Данные и переписка остаются на сервере SLON.
// Нужен секрет FCM_SA — JSON сервисного аккаунта Firebase (кладётся server/set-fcm.cmd).
let _tok=null,_tokExp=0;

const b64u=buf=>{let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const b64uStr=s=>b64u(new TextEncoder().encode(s));

async function accessToken(sa){
  if(_tok&&Date.now()<_tokExp)return _tok;
  const pem=sa.private_key.replace(/-----[^-]+-----/g,'').replace(/\s+/g,'');
  const der=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('pkcs8',der,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const now=Math.floor(Date.now()/1000);
  const unsigned=b64uStr(JSON.stringify({alg:'RS256',typ:'JWT'}))+'.'+b64uStr(JSON.stringify({
    iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',
    aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned));
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion='+unsigned+'.'+b64u(sig)});
  const d=await r.json();
  if(!d.access_token)throw new Error('fcm oauth: '+JSON.stringify(d).slice(0,200));
  _tok=d.access_token;_tokExp=Date.now()+(d.expires_in-120)*1000;
  return _tok;
}

// Разбудить все Android-устройства пользователя. data — только строки.
export async function sendFcm(env,username,data,{ttl='3600s'}={}){
  if(!env.FCM_SA)return 0;
  let sa;try{sa=JSON.parse(env.FCM_SA);}catch(e){return 0;}
  const rows=(await env.DB.prepare('SELECT device,token FROM fcm_tokens WHERE username=?').bind(username).all()).results||[];
  if(!rows.length)return 0;
  const tok=await accessToken(sa);
  const str={};for(const [k,v] of Object.entries(data))str[k]=String(v??'');
  let sent=0;
  await Promise.all(rows.map(async row=>{
    const r=await fetch('https://fcm.googleapis.com/v1/projects/'+sa.project_id+'/messages:send',{method:'POST',
      headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},
      body:JSON.stringify({message:{token:row.token,data:str,android:{priority:'HIGH',ttl}}})});
    if(r.ok){sent++;return;}
    const t=await r.text();
    // приложение удалили/переустановили — токен больше не действует
    if(r.status===404||/UNREGISTERED|INVALID_ARGUMENT/.test(t))
      await env.DB.prepare('DELETE FROM fcm_tokens WHERE username=? AND device=?').bind(username,row.device).run();
  }));
  return sent;
}
