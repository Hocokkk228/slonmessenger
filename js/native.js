// ════════════════════════════════════════
// ── НАТИВНОЕ ПРИЛОЖЕНИЕ (Android, Capacitor) ──
// На сайте ничего не делает. В APK: системные уведомления с кнопками
// у звонка, сохранение фото/кружков в галерею, голосовых/файлов — в память,
// кнопка «Назад», цвет статус-бара, проверка обновлений.
// ════════════════════════════════════════
const IS_NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const _NP=IS_NATIVE?window.Capacitor.Plugins:{};
const APP_SITE='https://hocokkk228.github.io/slonmessenger/';

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
      const mine=await (await fetch('app-version.json')).json();
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
