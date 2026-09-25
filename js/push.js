// ════════════════════════════════════════
// ── WEB PUSH: уведомления, когда мессенджер ЗАКРЫТ ──
// Устройство подписывается на пуши (push_subs/{я}/{id}), а при сообщении
// или звонке отправитель просит наш ретранслятор (Cloudflare Worker,
// push-relay/worker.js) разбудить все устройства получателя.
// ════════════════════════════════════════
const PUSH_RELAY='https://slon-push.hopasup789.workers.dev';   // Cloudflare Worker (push-relay/)
const PUSH_VAPID='BGFKS0j-jPYtHB-zbRte_eY5TgPXfqQxlBC4mfhFuYv82n3JRrBGWJd8CRGP7S6AXkBnP9OAoBic4DcUhkDhMXk';

function _pushKeyBytes(b64){
  const s=atob(b64.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-b64.length%4)%4));
  return Uint8Array.from(s,c=>c.charCodeAt(0));
}
function _pushId(endpoint){let h=5381;for(let i=0;i<endpoint.length;i++)h=((h<<5)+h+endpoint.charCodeAt(i))|0;return 's'+(h>>>0).toString(36);}

let _pushSubUser=null;
async function _pushSubscribe(){
  if(!PUSH_RELAY||!('serviceWorker' in navigator)||!('PushManager' in window))return;
  if(!myUsername||!window._fbDb||Notification.permission!=='granted'||_pushSubUser===myUsername)return;
  try{
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    // Подписка на старый ключ — пересоздаём
    if(sub&&sub.options?.applicationServerKey){
      const k=new Uint8Array(sub.options.applicationServerKey),want=_pushKeyBytes(PUSH_VAPID);
      if(k.length!==want.length||k.some((v,i)=>v!==want[i])){await sub.unsubscribe();sub=null;}
    }
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:_pushKeyBytes(PUSH_VAPID)});
    const j=sub.toJSON();
    await window._fbSet(window._fbRef(window._fbDb,'push_subs/'+myUsername+'/'+_pushId(j.endpoint)),
      {endpoint:j.endpoint,keys:j.keys,dev:_myDeviceId,ua:navigator.userAgent.slice(0,120),ts:Date.now()});
    _pushSubUser=myUsername;
  }catch(e){console.warn('[push] subscribe:',e);}
}

// Разбудить устройства получателя (fire-and-forget)
function _pushSend(to,payload){
  if(!PUSH_RELAY||!to||to===myUsername)return;
  try{
    fetch(PUSH_RELAY+'/send',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
      body:JSON.stringify({to,payload:{...payload,me:to}})}).catch(()=>{});
  }catch(e){}
}
function _pushMyName(){return (typeof _myFullName==='function'&&_myFullName().trim())||myNick||('@'+myUsername);}
function _pushMsg(to,text){
  if(!to||to==='saved'||to==='ai'||to.startsWith('g_'))return;
  _pushSend(to,{kind:'msg',title:_pushMyName(),body:String(text||'').slice(0,120),chat:myUsername,tag:'msg:'+myUsername,icon:null});
}
function _pushCall(to,callId,isVideo){
  _pushSend(to,{kind:'call',title:_pushMyName(),body:isVideo?'📹 Входящий видеозвонок':'📞 Входящий звонок',
    callId:callId||'',peerId:myUsername,isVideo:!!isVideo,tag:'call'});
}
function _pushCallGone(to){_pushSend(to,{type:'CLOSE_TAG',tag:'call'});}

// Подписываемся, как только есть аккаунт, Firebase и разрешение на уведомления
setInterval(()=>{if(_fbMode)_pushSubscribe();},5000);
