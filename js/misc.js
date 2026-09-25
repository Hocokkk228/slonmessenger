function _initServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  // Отдельный файл sw.js: из blob: браузеры Service Worker не регистрируют
  navigator.serviceWorker.register('sw.js',{scope:'./'})
    .then(reg=>{_swReg=reg;console.log('[SLON] Service Worker registered');})
    .catch(e=>console.warn('[SLON] SW registration failed:',e));
  navigator.serviceWorker.ready.then(reg=>{_swReg=reg;}).catch(()=>{});
  // Нажатия на кнопки уведомлений
  navigator.serviceWorker.addEventListener('message',e=>_onNotifAction(e.data||{}));
}

// «Ответить»/«Отклонить» у звонка, «Открыть» у сообщения
function _onNotifAction(d){
  if(d.type!=='notif_action')return;
  if(d.kind==='call'){
    if(d.action==='decline'){if(pendingCall)rejectCall();return;}
    // ответить: звонок уже висит — берём; ещё не дошёл (приложение только открылось) — ждём
    if(pendingCall)answerCall();
    else _naAnswer={peer:d.peerId,cid:d.callId,until:Date.now()+60000};
    return;
  }
  if(d.chat&&(peerNames[d.chat]||d.chat==='saved'))openChat(d.chat);
}
// Приложение открыто кнопкой «Ответить» из уведомления (?na=answer&cid=…&peer=…)
let _naAnswer=null;
(function(){
  try{
    const q=new URLSearchParams(location.search);
    const na=q.get('na');if(!na)return;
    if(na==='answer')_naAnswer={peer:q.get('peer')||'',cid:q.get('cid')||'',until:Date.now()+60000};
    else if(na==='open'&&q.get('chat')){const c=q.get('chat');setTimeout(function t(){if(typeof openChat==='function'&&peerNames[c])openChat(c);else setTimeout(t,500);},800);}
    history.replaceState(null,'',location.pathname);
  }catch(e){}
})();
// Вызывается при входящем звонке: если его уже «приняли» из уведомления — отвечаем сразу
function _naTryAnswer(pid,callId){
  if(!_naAnswer||Date.now()>_naAnswer.until)return;
  if(_naAnswer.peer&&_naAnswer.peer!==pid)return;
  if(_naAnswer.cid&&callId&&_naAnswer.cid!==String(callId))return;
  _naAnswer=null;
  setTimeout(()=>{if(pendingCall)answerCall();},300);
}
// Убрать уведомление о звонке (взяли, отклонили, отменили — в т.ч. на другом устройстве)
function _closeCallNotif(){
  try{_swReg?.active?.postMessage({type:'CLOSE_TAG',tag:'call'});}catch(e){}
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

function showDesktopNotif(title, body, iconUrl, tag, extra){
  if(!('Notification' in window))return;
  // Настройки → Уведомления: веб-уведомления выключены (звонки показываем всегда)
  if(myNotif.web===false&&tag!=='call')return;
  const _doShow=()=>{
    const iconSvg='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><text y=%221em%22 font-size=%2256%22>🐘</text></svg>';
    const icon=iconUrl||iconSvg;
    const notifTitle='SLON · '+title;

    // Путь 1: Service Worker (работает когда браузер свёрнут на мобильных)
    if(_swReg?.active){
      const kind=extra?.kind||(tag==='call'?'call':'msg');
      _swReg.active.postMessage({type:'NOTIFY',title:kind==='call'?title:notifTitle,body,icon,tag:tag||'msg',
        kind,me:myUsername,...(extra||{})});
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
