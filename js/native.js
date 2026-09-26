// ════════════════════════════════════════
// ── НАТИВНОЕ ПРИЛОЖЕНИЕ (Android, Capacitor) ──
// На сайте ничего не делает. В APK: системные уведомления с кнопками
// у звонка, сохранение фото/кружков в галерею, голосовых/файлов — в память,
// кнопка «Назад», цвет статус-бара, проверка обновлений.
// ════════════════════════════════════════
const IS_NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const _NP=IS_NATIVE?window.Capacitor.Plugins:{};
const APP_SITE='https://hocokkk228.github.io/slonmessenger/';
let _nativeBgOn=false;
// Выход из аккаунта: фоновая служба отключается и забывает токен
function _nativeBgStop(){try{if(IS_NATIVE)_NP.SlonSystem?.stopBackground();}catch(e){}_nativeBgOn=false;}

// Медиа сообщения → Blob (фото/голосовое/кружок/файл, в т.ч. из IndexedDB)
async function _mediaBlob(msg,kind){
  let src=null;
  if(kind==='photo')src=await _resolvePhotoSrc(msg.photoId);
  else if(kind==='file')src=await _resolveFileSrc(msg.fileDataId);
  else{
    const v=kind==='voice'?msg.voiceData:msg.slonData;
    if(v&&v.startsWith('idb:')){const p=v.split(':');src=await _loadMediaFromIdb(p[1],p[2]||kind);}
    else src=v||null;
  }
  if(!src)return null;
  try{return await (await fetch(src)).blob();}catch(e){return null;}
}
function _blobToDataUrl(b){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(b);});}
function _extOf(mime,fallback){
  const m=String(mime||'').split(';')[0];
  return ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','video/webm':'webm','video/mp4':'mp4','audio/webm':'webm','audio/ogg':'ogg','audio/mp4':'m4a','audio/mpeg':'mp3'})[m]||fallback;
}

// ── Сохранение: в галерею (фото/видео) и в «Документы/SLON» (голосовые, файлы) ──
let _slonAlbum=null;
async function _nativeAlbum(){
  if(_slonAlbum)return _slonAlbum;
  const M=_NP.Media;
  try{
    const {albums}=await M.getAlbums();
    let a=albums.find(x=>x.name==='SLON');
    if(!a){await M.createAlbum({name:'SLON'});a=(await M.getAlbums()).albums.find(x=>x.name==='SLON');}
    _slonAlbum=a?.identifier||null;
  }catch(e){console.warn('album:',e);}
  return _slonAlbum;
}
async function _nativeSave(msg,kind,name){
  const b=await _mediaBlob(msg,kind);
  if(!b){toast('Файл недоступен');return;}
  const data=await _blobToDataUrl(b);
  try{
    if(kind==='photo'||kind==='slon'){
      const albumIdentifier=await _nativeAlbum();
      if(kind==='photo')await _NP.Media.savePhoto({path:data,albumIdentifier,fileName:'slon_'+msg.id});
      else await _NP.Media.saveVideo({path:data,albumIdentifier,fileName:'slon_'+msg.id});
      toast('Сохранено в галерею 🖼');
    }else{
      const fname=name||(kind+'_'+msg.id+'.'+_extOf(b.type,'bin'));
      await _NP.Filesystem.writeFile({path:'SLON/'+fname,data:data.split(',')[1],directory:'DOCUMENTS',recursive:true});
      toast('Сохранено: Документы/SLON/'+fname);
    }
  }catch(e){console.warn('save:',e);toast('Не удалось сохранить: '+(e.message||e));}
}

// На сайте голосовые/кружки из IndexedDB раньше не скачивались (ссылка idb:…) — чиним и там
async function _webSave(msg,kind,name){
  const b=await _mediaBlob(msg,kind);
  if(!b){toast('Файл недоступен');return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download=name||(kind+'_'+msg.id+'.'+_extOf(b.type,'bin'));
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
_downloadPhoto=msg=>(IS_NATIVE?_nativeSave:_webSave)(msg,'photo',msg.fileName);
_downloadVoice=msg=>(IS_NATIVE?_nativeSave:_webSave)(msg,'voice');
_downloadSlon=msg=>(IS_NATIVE?_nativeSave:_webSave)(msg,'slon');
if(IS_NATIVE){
  dlFile=async(fdid,name)=>{
    const m={id:String(fdid).replace(/\W/g,''),fileDataId:fdid};
    return _nativeSave(m,'file',name);
  };
}

if(IS_NATIVE){
  document.documentElement.classList.add('is-native');

  // ── Уведомления: системные (LocalNotifications), у звонка — «Ответить»/«Отклонить» ──
  const LN=_NP.LocalNotifications;
  const CALL_NID=777001;
  let _nid=1000;
  const _chatNid={};   // одно уведомление на чат — новые заменяют старые
  LN.requestPermissions().catch(()=>{});
  LN.registerActionTypes({types:[
    {id:'CALL',actions:[{id:'answer',title:'📞 Ответить',foreground:true},{id:'decline',title:'❌ Отклонить',destructive:true,foreground:false}]},
    {id:'MSG',actions:[{id:'open',title:'Открыть',foreground:true}]},
  ]}).catch(()=>{});
  LN.createChannel?.({id:'calls',name:'Звонки',importance:5,visibility:1,vibration:true}).catch(()=>{});
  LN.createChannel?.({id:'messages',name:'Сообщения',importance:4,visibility:1,vibration:true}).catch(()=>{});
  LN.addListener('localNotificationActionPerformed',ev=>{
    const x=ev.notification?.extra||{};
    const action=ev.actionId==='tap'?(x.kind==='call'?'answer':'open'):ev.actionId;
    _onNotifAction({type:'notif_action',action,...x});
  });

  showDesktopNotif=function(title,body,iconUrl,tag,extra){
    // Фоновая служба сама показывает уведомления (и при закрытом приложении) — не дублируем
    if(_nativeBgOn)return;
    if(myNotif.web===false&&tag!=='call')return;
    // Приложение на экране — оно само всё показывает
    if(document.visibilityState==='visible'&&(extra?.kind!=='call'))return;
    const kind=extra?.kind||(tag==='call'?'call':'msg');
    const isCall=kind==='call';
    let id;
    if(isCall)id=CALL_NID;
    else{const key=tag||'msg';id=_chatNid[key]||(_chatNid[key]=++_nid);}
    LN.schedule({notifications:[{
      id,title:isCall?title:('SLON · '+title),body:body||'',
      channelId:isCall?'calls':'messages',
      actionTypeId:isCall?'CALL':'MSG',
      smallIcon:'ic_stat_slon',iconColor:'#3390ec',
      ongoing:isCall,autoCancel:!isCall,
      extra:{kind,me:myUsername,...(extra||{})},
    }]}).catch(e=>console.warn('notif:',e));
  };
  _closeCallNotif=function(){LN.cancel({notifications:[{id:CALL_NID}]}).catch(()=>{});};

  // ── Кнопка «Назад»: закрываем окна по очереди, из списка чатов — сворачиваем ──
  _NP.App.addListener('backButton',()=>{
    if($('photoView')?.classList.contains('show')){closePhoto();return;}
    if($('peerProfOverlay')?.classList.contains('show')){closePeerProfile();return;}
    if(typeof _spStack!=='undefined'&&_spStack.length){_spPop();return;}
    if($('spPanel')?.classList.contains('open')){closeMyProfilePanel();return;}
    if(window.innerWidth<=640&&!$('sidebar').classList.contains('open')){toggleSidebar();return;}
    _NP.App.minimizeApp();
  });

  // ── Работа в фоне: без ограничений батареи + автозапуск (ColorOS, MIUI/HyperOS) ──
  // Иначе прошивка усыпляет SLON, и сообщения/звонки не приходят, пока его не откроешь.
  async function _bgAsk(){
    const S=_NP.SlonSystem;if(!S)return;
    let st;try{st=await S.backgroundStatus();}catch(e){return;}
    if(st.unrestricted)return;
    try{const t=+localStorage.getItem('sl_bg_asked')||0;if(Date.now()-t<3*864e5)return;}catch(e){}
    if($('bgAsk'))return;
    const el=document.createElement('div');el.id='bgAsk';el.className='notif-ask';
    el.innerHTML=`<div class="na-ico"><svg viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"/></svg></div>
      <div class="na-txt"><b>Разреши SLON работать в фоне</b><span>Чтобы сообщения и звонки приходили сразу, даже когда приложение свёрнуто</span></div>
      <div class="na-btns"><button class="na-no">Не сейчас</button><button class="na-yes">Разрешить</button></div>`;
    const done=()=>{try{localStorage.setItem('sl_bg_asked',String(Date.now()));}catch(e){}el.classList.remove('show');setTimeout(()=>el.remove(),300);};
    el.querySelector('.na-no').onclick=done;
    el.querySelector('.na-yes').onclick=async()=>{
      done();
      await S.requestUnrestricted().catch(()=>{});
      // На OPPO/realme/OnePlus и Xiaomi/Redmi/POCO ещё отдельный «Автозапуск»
      const m=String(st.manufacturer||'').toLowerCase();
      if(/oppo|realme|oneplus|xiaomi|redmi|poco|huawei|honor|vivo/.test(m)){
        const back=()=>{document.removeEventListener('visibilitychange',back);
          if(document.visibilityState==='visible')setTimeout(()=>{
            toast('Теперь включи SLON в «Автозапуске» — открываю настройки',4000);
            setTimeout(()=>S.openAutostart().catch(()=>{}),1200);
          },600);};
        document.addEventListener('visibilitychange',back);
      }
    };
    document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
  }
  setTimeout(_bgAsk,6000);
  window._bgSetup=()=>{try{localStorage.removeItem('sl_bg_asked');}catch(e){}_bgAsk();};

  // ── Фоновая связь с сервером: уведомления, даже когда приложение закрыто ──
  // (своя служба Android держит соединение с хабом аккаунта — без Firebase/Google)
  setInterval(()=>{
    if(_nativeBgOn||!myUsername||typeof _apiToken!=='function'||!_apiToken()||!_NP.SlonSystem)return;
    _NP.SlonSystem.startBackground({token:_apiToken(),api:_BG_API,dev:_myDeviceId||''})
      .then(()=>{_nativeBgOn=true;if(typeof _e2eNotifSync==='function')_e2eNotifSync();}).catch(()=>{});
  },4000);
  // Приложение открыли кнопкой в уведомлении: «Ответить» на звонок / переход в чат
  const _onLaunch=l=>{
    if(!l||!l.action)return;
    if(l.action==='answer')_onNotifAction({type:'notif_action',kind:'call',action:'answer',peerId:l.chat||'',callId:l.callId||''});
    else if(l.action==='open'&&l.chat){
      const go=()=>{if(typeof openChat==='function'&&(peerNames[l.chat]||l.chat==='saved')){openChat(l.chat);if(window.innerWidth<=640)closeSidebar?.();}else setTimeout(go,500);};
      go();
    }
  };
  _NP.SlonSystem?.getLaunch().then(_onLaunch).catch(()=>{});
  _NP.SlonSystem?.addListener('launch',_onLaunch);

  // ── Статус-бар в цвет темы ──
  const _paintBar=()=>{
    try{
      const bg=getComputedStyle(document.body).getPropertyValue('--bg2').trim()||'#0d1520';
      _NP.StatusBar.setBackgroundColor({color:bg}).catch(()=>{});
      const light=['liketg','light','arctic'].includes(document.body.dataset.theme);
      _NP.StatusBar.setStyle({style:light?'LIGHT':'DARK'}).catch(()=>{});
    }catch(e){}
  };
  new MutationObserver(_paintBar).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
  setTimeout(_paintBar,300);

  // ── Обновления: встроенная версия vs version.json на сайте ──
  (async()=>{
    try{
      const mine=await (await fetch(location.origin+'/app-version.json')).json();
      const site=await (await fetch(APP_SITE+'version.json?'+Date.now(),{cache:'no-store'})).json();
      if(site.android&&site.android.version&&site.android.version!==mine.version&&_verNewer(site.android.version,mine.version)){
        setTimeout(()=>_offerUpdate(site.android),4000);
      }
    }catch(e){}
  })();
}
function _verNewer(a,b){const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0);}return false;}
function _offerUpdate(info){
  if($('updAsk'))return;
  const el=document.createElement('div');el.id='updAsk';el.className='notif-ask';
  el.innerHTML=`<div class="na-ico"><img src="icons/icon-96.png" alt=""></div>
    <div class="na-txt"><b>Доступна новая версия ${esc(info.version)}</b><span>${esc(info.notes||'Исправления и улучшения')}</span></div>
    <div class="na-btns"><button class="na-no">Позже</button><button class="na-yes">Обновить</button></div>`;
  const done=()=>{el.classList.remove('show');setTimeout(()=>el.remove(),300);};
  el.querySelector('.na-no').onclick=done;
  // внешняя ссылка из WebView открывается в системном браузере — там и скачается APK
  el.querySelector('.na-yes').onclick=()=>{done();location.href=info.url;};
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
}

// ── Скачать приложение для Android (кнопка в настройках и на экране входа) ──
const APK_URL='https://github.com/Hocokkk228/slonmessenger/releases/latest/download/SLON.apk';
function downloadAndroidApp(){
  const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(ios){toast('Для iPhone: Safari → «Поделиться» → «На экран Домой»',6000);return;}
  location.href=APK_URL;
  toast('Скачивается SLON.apk — открой его, чтобы установить',6000);
}

// ── «Проверка уведомлений» (только в приложении для Android) ──
// Показывает, какое звено мешает уведомлениям, и чинит его в один тап.
async function _spNotifDiag(){
  const S=_NP.SlonSystem;if(!S)return;
  let d={};try{d=await S.diag();}catch(e){}
  const IC_OK='<svg class="nd-ic" viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
  const IC_BAD='<svg class="nd-ic" viewBox="0 0 24 24"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>';
  const IC_WAIT='<svg class="nd-ic" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7z"/></svg>';
  const ok=(v,good,bad)=>v?`<span class="nd-ok">${IC_OK}${good}</span>`:`<span class="nd-bad">${IC_BAD}${bad}</span>`;
  const row=(title,state,btn,fn)=>`<div class="sp-row nd-row"><div class="sp-row-txt"><div class="sp-row-title">${title}</div><div class="sp-row-sub">${state}</div></div>${btn?`<button class="nd-btn" onclick="${fn}">${btn}</button>`:''}</div>`;
  const m=String(d.manufacturer||'').toLowerCase();
  const oem=/xiaomi|redmi|poco|oppo|realme|oneplus|huawei|honor|vivo/.test(m);
  const html=_spSec('Статус')+_spCard(
      row('Разрешение на уведомления',ok(d.notifEnabled,'Разрешены','Запрещены — SLON не может показывать уведомления'),d.notifEnabled?'':'Разрешить','_NP.SlonSystem.requestNotifPermission().then(()=>setTimeout(_spNotifDiagRefresh,1500))')
     +row('Уведомления о сообщениях',ok(d.msgChannel!==0,'Включены','Канал «Сообщения» выключен в настройках'),d.msgChannel===0?'Включить':'','_NP.SlonSystem.openNotifSettings()')
     +row('Уведомления о звонках',ok(d.callChannel!==0,'Включены','Канал «Звонки» выключен в настройках'),d.callChannel===0?'Включить':'','_NP.SlonSystem.openNotifSettings()')
     +row('Фоновая связь с сервером',d.serviceRunning?(d.connected?`<span class="nd-ok">${IC_OK}Подключена</span>`:`<span class="nd-bad">${IC_WAIT}Служба работает, но нет соединения — проверь интернет</span>`):`<span class="nd-bad">${IC_BAD}Не запущена</span>`,d.serviceRunning?'':'Запустить','_nativeBgOn=false;setTimeout(_spNotifDiagRefresh,2500)')
     +row('Работа в фоне без ограничений',ok(d.unrestricted,'Разрешена','Батарея усыпляет SLON — уведомления будут опаздывать'),d.unrestricted?'':'Разрешить','_NP.SlonSystem.requestUnrestricted().then(()=>setTimeout(_spNotifDiagRefresh,1500))')
     +(oem?row('Автозапуск ('+esc(d.manufacturer)+')','На этом телефоне без автозапуска система убивает SLON в фоне','Открыть','_NP.SlonSystem.openAutostart()'):'')
    )
    +_spSec('Проверка')
    +_spCard(`<div class="sp-row" onclick="_spNotifTest()"><div class="sp-row-txt"><div class="sp-row-title" style="color:var(--accent)">Отправить тестовое уведомление</div><div class="sp-row-sub">Сигнал пройдёт через сервер и фоновую службу — как настоящее сообщение</div></div></div>`)
    +_spHint('Если тест пришёл, а сообщения при закрытом приложении — нет: включи автозапуск и в «Недавних» закрепи SLON замочком (так же делают для Telegram на Xiaomi/OPPO).');
  if($('ndPage'))$('ndPage').innerHTML=html;
  else _spPush('Проверка уведомлений','<div id="ndPage">'+html+'</div>');
}
function _spNotifDiagRefresh(){if($('ndPage'))_spNotifDiag();}
function _spNotifTest(){
  if(typeof _hubSend!=='function'||!_hubSend({t:'send',to:myUsername,payload:{type:'bg_test'}})){toast('Нет соединения с сервером');return;}
  toast('Отправлено — уведомление должно появиться через секунду');
}
if(IS_NATIVE){
  // Android 13+: без этого разрешения уведомлений нет вообще — спрашиваем сразу
  setTimeout(()=>{_NP.SlonSystem?.diag().then(d=>{if(!d.notifEnabled)_NP.SlonSystem.requestNotifPermission();}).catch(()=>{});},3000);
}
