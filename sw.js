// SLON Service Worker — уведомления о звонках и сообщениях с кнопками.
// Показывает уведомления по команде страницы (NOTIFY) и из Web Push (push),
// обрабатывает «Ответить» / «Отклонить» даже когда вкладка в фоне.
const DB_URL='https://slon-376b4-default-rtdb.europe-west1.firebasedatabase.app';
const ICON='icons/icon-192.png';

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));

function show(d){
  const isCall=d.kind==='call',isMissed=d.kind==='missed';
  const opts={
    body:d.body||'',
    icon:d.icon&&!String(d.icon).startsWith('data:image/svg')?d.icon:ICON,
    badge:ICON,
    tag:d.tag||(isCall||isMissed?'call':'msg'),
    renotify:!isMissed,
    requireInteraction:isCall,
    silent:isMissed,
    vibrate:isCall?[400,150,400,150,400,150,400]:[180,80,180],
    timestamp:d.sentAt||Date.now(),
    data:{kind:isMissed?'msg':(d.kind||'msg'),chat:d.chat||d.peerId||'',callId:d.callId||'',peerId:d.peerId||'',me:d.me||'',isVideo:!!d.isVideo},
  };
  if(isCall)opts.actions=[{action:'answer',title:'📞 Ответить'},{action:'decline',title:'❌ Отклонить'}];
  else opts.actions=[{action:'open',title:'Открыть'}];
  const title=d.title||'SLON';
  // Если телефон не принял что-то из опций — всё равно показываем простое уведомление
  return self.registration.showNotification(title,opts)
    .catch(()=>self.registration.showNotification(title,{body:opts.body,icon:ICON,tag:opts.tag,data:opts.data}));
}
async function closeTag(tag){
  const ns=await self.registration.getNotifications(tag?{tag}:undefined);
  ns.forEach(n=>n.close());
}

self.addEventListener('message',e=>{
  const d=e.data||{};
  if(d.type==='NOTIFY')e.waitUntil(show(d));
  else if(d.type==='CLOSE_TAG')e.waitUntil(closeTag(d.tag));
});

// Web Push (когда приложение закрыто) — payload в том же формате, что NOTIFY
// Журнал доставки: во сколько пуш реально дошёл до устройства (диагностика задержек)
function logDelivery(d){
  if(!d.me||!d.pid)return Promise.resolve();
  return fetch(DB_URL+'/push_log/'+d.me+'/'+d.pid+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sentAt:d.sentAt||0,recvAt:Date.now(),kind:d.kind||'',ua:(self.navigator&&navigator.userAgent||'').slice(0,90)})}).catch(()=>{});
}
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{};}catch(_){d={body:e.data&&e.data.text()};}
  e.waitUntil((async()=>{
    const log=logDelivery(d);
    // Мессенджер открыт и на экране — он сам покажет звонок/сообщение
    const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const onScreen=cs.some(c=>c.visibilityState==='visible'&&c.focused);
    if(!onScreen)await show(d);
    await log;
  })());
});

// Отклонить без открытия приложения: пишем прямо в Realtime Database (REST)
async function declineViaRest(data){
  if(!data.callId||!data.peerId||!data.me)return;
  const key=String(data.callId).replace(/[^A-Za-z0-9_-]/g,'_');
  const post=(path,body,method)=>fetch(DB_URL+'/'+path+'.json',{method:method||'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(()=>{});
  await Promise.all([
    post('inbox/'+data.peerId,{from:data.me,payload:{type:'call_reject',callId:data.callId},ts:Date.now()}),
    post('call_sync/'+data.me+'/'+key,{action:'rejected',peerId:data.peerId,dev:'sw',ts:Date.now()},'PUT'),
  ]);
}

self.addEventListener('notificationclick',e=>{
  const n=e.notification,data=n.data||{},action=e.action||'open';
  n.close();
  e.waitUntil((async()=>{
    const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const client=cs.find(c=>'focus' in c)||null;
    if(data.kind==='call'&&action==='decline'){
      if(client){client.postMessage({type:'notif_action',action:'decline',...data});return;}
      await declineViaRest(data);return;
    }
    const msg={type:'notif_action',action:data.kind==='call'?'answer':'open',...data};
    if(client){
      try{await client.focus();}catch(_){}
      client.postMessage(msg);
      return;
    }
    // Приложение закрыто — открываем его; действие подхватится при загрузке
    const q=data.kind==='call'
      ?'?na=answer&cid='+encodeURIComponent(data.callId)+'&peer='+encodeURIComponent(data.peerId)
      :'?na=open&chat='+encodeURIComponent(data.chat);
    await self.clients.openWindow(self.registration.scope+q);
  })());
});
