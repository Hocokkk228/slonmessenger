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
      body:JSON.stringify({to,payload:{...payload,me:to,sentAt:Date.now(),pid:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}})}).catch(()=>{});
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
// Звонок отменили — уведомление о звонке заменяется «пропущенным» (как в Telegram).
// Пустой пуш без уведомления Chrome наказывает системным «сайт обновлён в фоне».
function _pushCallGone(to,isVideo){
  _pushSend(to,{kind:'missed',title:_pushMyName(),body:isVideo?'📹 Пропущенный видеозвонок':'📞 Пропущенный звонок',peerId:myUsername,chat:myUsername,tag:'call'});
}

// Один раз на устройстве просим разрешить уведомления — плашкой с кнопкой
// (без нажатия пользователя телефонные браузеры системный запрос не показывают)
function _notifAskOnce(){
  if(!('Notification' in window)||Notification.permission!=='default'||!myUsername)return;
  try{if(localStorage.getItem('sl_notif_asked'))return;}catch(e){}
  if($('notifAsk'))return;
  const el=document.createElement('div');
  el.id='notifAsk';el.className='notif-ask';
  el.innerHTML=`<div class="na-ico"><svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-1.7 1.7A1 1 0 0 0 4 19.4h16a1 1 0 0 0 .7-1.7z"/></svg></div>
    <div class="na-txt"><b>Включи уведомления</b><span>Чтобы не пропускать сообщения и звонки, даже когда SLON закрыт</span></div>
    <div class="na-btns"><button class="na-no">Не сейчас</button><button class="na-yes">Включить</button></div>`;
  const done=()=>{try{localStorage.setItem('sl_notif_asked','1');}catch(e){}el.classList.remove('show');setTimeout(()=>el.remove(),300);};
  el.querySelector('.na-no').onclick=done;
  el.querySelector('.na-yes').onclick=()=>{
    done();
    Notification.requestPermission().then(p=>{
      _notifPermission=p;try{_updateNotifRow();}catch(e){}
      if(p==='granted'){toast('Уведомления включены 🔔');_pushSubscribe();}
    }).catch(()=>{});
  };
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
}

// Установка как приложение (Android: WebAPK — настоящее приложение в системе
// со своими настройками батареи/уведомлений; с ним пуши доходят надёжнее)
let _installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();_installEvt=e;});
window.addEventListener('appinstalled',()=>{_installEvt=null;$('installAsk')?.remove();toast('SLON установлен 🐘');});
function _installAskOnce(){
  if(!_installEvt||!myUsername||$('installAsk')||$('notifAsk'))return;
  try{if(localStorage.getItem('sl_install_asked'))return;}catch(e){}
  const el=document.createElement('div');
  el.id='installAsk';el.className='notif-ask';
  el.innerHTML=`<div class="na-ico"><img src="launchericon-96x96.png" alt=""></div>
    <div class="na-txt"><b>Установи SLON как приложение</b><span>Иконка на рабочем столе, отдельное окно и надёжные уведомления о звонках</span></div>
    <div class="na-btns"><button class="na-no">Не сейчас</button><button class="na-yes">Установить</button></div>`;
  const done=()=>{try{localStorage.setItem('sl_install_asked','1');}catch(e){}el.classList.remove('show');setTimeout(()=>el.remove(),300);};
  el.querySelector('.na-no').onclick=done;
  el.querySelector('.na-yes').onclick=async()=>{done();const ev=_installEvt;_installEvt=null;if(!ev)return;try{ev.prompt();await ev.userChoice;}catch(e){}};
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
}
// Для кнопки в настройках: установить вручную
function installSlonApp(){
  if(_installEvt){const ev=_installEvt;_installEvt=null;ev.prompt();return;}
  const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  toast(ios?'Safari → «Поделиться» → «На экран Домой»':'Меню браузера (⋮) → «Установить приложение» / «Добавить на главный экран»',6000);
}

// Подписываемся, как только есть аккаунт, Firebase и разрешение на уведомления
setInterval(()=>{if(_fbMode){_pushSubscribe();_notifAskOnce();_installAskOnce();}},5000);
