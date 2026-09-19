function _initServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  // SW-код прямо в Blob — не нужен отдельный файл
  const swCode=`
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>self.clients.claim());
self.addEventListener('message',e=>{
  if(e.data?.type==='NOTIFY'){
    const d=e.data;
    self.registration.showNotification(d.title,{
      body:d.body,
      icon:d.icon||'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><text y=%221em%22 font-size=%2256%22>🐘</text></svg>',
      tag:d.tag||'msg',
      requireInteraction:d.tag==='call',
      vibrate:d.tag==='call'?[300,100,300,100,300]:[200,100],
      data:{url:self.location.origin}
    });
  }
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(cs=>{
    for(const c of cs)if('focus' in c)return c.focus();
    if(clients.openWindow)return clients.openWindow(e.notification.data?.url||'/');
  }));
});
`;
  const blob=new Blob([swCode],{type:'application/javascript'});
  const swUrl=URL.createObjectURL(blob);
  navigator.serviceWorker.register(swUrl,{scope:'./'})
    .then(reg=>{
      _swReg=reg;
      console.log('[SLON] Service Worker registered');
    })
    .catch(e=>console.warn('[SLON] SW registration failed:',e));
}

function _updateNotifRow(){
  const el=$('notifRowVal');if(!el)return;
  const p=Notification.permission;
  if(p==='granted'){el.textContent='Уведомления включены ✅';}
  else if(p==='denied'){el.textContent='Уведомления заблокированы ❌';}
  else{el.textContent='Включить уведомления 🔔';}
}

function initDesktopNotif(){
  if(!('Notification' in window))return;
  _notifPermission=Notification.permission;
  _updateNotifRow();
  _initServiceWorker();
  if(_notifPermission==='default'){
    // Запрашиваем разрешение сразу при старте для мобильных
    const isMob=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(isMob){
      Notification.requestPermission().then(p=>{_notifPermission=p;_updateNotifRow();});
    }
  }
}

function requestNotifPermission(){
  if(!('Notification' in window))return;
  Notification.requestPermission().then(p=>{
    _notifPermission=p;
    _updateNotifRow();
    toast(p==='granted'?'Уведомления включены 🔔':p==='denied'?'Уведомления заблокированы — разреши в настройках браузера':'Уведомления не разрешены');
  });
}

function showDesktopNotif(title, body, iconUrl, tag){
  if(!('Notification' in window))return;
  const _doShow=()=>{
    const iconSvg='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><text y=%221em%22 font-size=%2256%22>🐘</text></svg>';
    const icon=iconUrl||iconSvg;
    const notifTitle='SLON · '+title;

    // Путь 1: Service Worker (работает когда браузер свёрнут на мобильных)
    if(_swReg?.active){
      _swReg.active.postMessage({type:'NOTIFY',title:notifTitle,body,icon,tag:tag||'msg'});
      return;
    }
    // Путь 2: обычный Notification API (только когда страница открыта)
    if(_notifPermission==='granted'&&document.visibilityState!=='visible'){
      try{
        const n=new Notification(notifTitle,{
          body,icon,tag:tag||'msg',silent:false,requireInteraction:tag==='call'
        });
        n.onclick=()=>{window.focus();n.close();};
        if(tag!=='call')setTimeout(()=>n.close(),5000);
      }catch(e){}
    }
  };

  if(_notifPermission==='granted'){
    _doShow();
  }else if(_notifPermission==='default'){
    Notification.requestPermission().then(p=>{_notifPermission=p;if(p==='granted')_doShow();});
  }
}

function updatePipSelfInfo(){
  // Show self nik/avatar in PiP when no local video stream
  const hasLocalVid=(!isCamOff&&localStream&&localStream.getVideoTracks().length>0)||isScreenSharing;
  const lv=$('localVideo');
  const pip=$('pipSelfInfo');
  if(!lv||!pip)return;
  if(hasLocalVid){
    lv.style.display='';
    pip.style.display='none';
  }else{
    lv.style.display='none';
    pip.style.display='flex';
    // Populate avatar
    const av=$('pipSelfAv');
    av.innerHTML='';
    if(myAvatar){const img=document.createElement('img');img.src=myAvatar;av.appendChild(img);}
    else{av.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';}
    $('pipSelfNm').textContent=myNick||('@'+myUsername)||'Я';
  }
}

function exportData(){
  const data={username:myUsername,nick:myNick,bio:myBio,contacts:peerNames,groups:Object.keys(groups).map(k=>({id:k,...groups[k]})),theme:LS.get('sl_theme','dark'),exportedAt:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='slon_data.json';a.click();
  toast('Данные экспортированы');
}

function confirmClearAll(){
  showModal(`
    <div class="m-title">⚠️ Очистить всё?</div>
    <div class="m-info">Будут удалены все сообщения, контакты, юзернейм и настройки. Это действие необратимо!</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-danger" onclick="doClearAll()">Удалить всё</button>
    </div>
  `);
}

function doClearAll(){
  localStorage.clear();
  closeModal();
  setTimeout(()=>location.reload(),300);
}
