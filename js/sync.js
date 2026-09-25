// ════════════════════════════════════════
// ── СИНХРОНИЗАЦИЯ МЕЖДУ УСТРОЙСТВАМИ ──
// 1) Профиль и вся его кастомизация: user_sync/{я}/profile — последняя правка
//    с любого устройства побеждает, остальные устройства подхватывают её сразу.
// 2) Журнал личных сообщений: ml/{аккаунт}/{ключ}. Отправитель пишет копию
//    себе и получателю — сообщение доходит, даже если получатель офлайн,
//    и видно на ВСЕХ устройствах обоих (inbox для этого не годится: запись
//    из него забирает первое прочитавшее устройство).
// 3) Медиа к сообщениям (фото, файлы, голосовые, кружки): mstore/{id} кусками.
// ════════════════════════════════════════

// ── 1. Профиль ──
const PS_FIELDS={
  nick:[()=>myNick,v=>myNick=v||''],
  lastName:[()=>myLastName,v=>myLastName=v||''],
  bio:[()=>myBio,v=>myBio=v||''],
  avatar:[()=>myAvatar,v=>myAvatar=v||null],
  profileBg:[()=>myProfileBg,v=>myProfileBg=v||'bg0'],
  bgColor:[()=>myProfileBgColor,v=>myProfileBgColor=v||''],
  bgPattern:[()=>myProfilePattern,v=>myProfilePattern=v||''],
  avFrame:[()=>myAvFrame,v=>myAvFrame=v||''],
  profileWallpaper:[()=>myProfileWallpaper,v=>myProfileWallpaper=v||''],
  profileTheme:[()=>myProfileTheme,v=>myProfileTheme=v||''],
  linkedChannel:[()=>myLinkedChannel,v=>myLinkedChannel=v||''],
  birthday:[()=>myBirthday,v=>myBirthday=v||null],
  businessHours:[()=>myBusinessHours,v=>{if(v)myBusinessHours=v;}],
  privacy:[()=>myPrivacy,v=>{if(v&&typeof v==='object')myPrivacy=Object.assign({},myPrivacy,v);}],
};
let _psUser=null,_psReady=false,_psApplying=false,_psSig='',_psTs=0,_psOff=null;
function _psCollect(){const o={};for(const k in PS_FIELDS){const v=PS_FIELDS[k][0]();o[k]=v===undefined?null:v;}return o;}
function _psSigOf(o){try{return JSON.stringify(o);}catch(e){return '';}}
function _psKey(){return _getAccountPrefix(myUsername)+'profTs';}
function _psRef(){return window._fbRef(window._fbDb,'user_sync/'+myUsername+'/profile');}

function _psApply(d){
  _psApplying=true;
  try{
    for(const k in PS_FIELDS)if(k in d)PS_FIELDS[k][1](d[k]);
    _psTs=d.ts||Date.now();
    try{localStorage.setItem(_psKey(),String(_psTs));}catch(e){}
    _psSig=_psSigOf(_psCollect());
    saveAll();
    try{updateProfileDisplay();setMyLabel();}catch(e){}
    const bnAv=$('bnProfAv');
    if(bnAv){bnAv.innerHTML='';
      if(myAvatar){const i=document.createElement('img');i.src=myAvatar;i.style.cssText='width:100%;height:100%;border-radius:50%;object-fit:cover';bnAv.appendChild(i);}
      else bnAv.innerHTML=_avHtml(myUsername,myNick||myUsername);}
    // Открытая панель настроек — перерисуем шапку с новыми данными
    try{if($('spHero')&&typeof _spRender==='function')_spRender();}catch(e){}
  }finally{_psApplying=false;}
}
function _psPush(){
  if(!_psReady||_psApplying||!window._fbDb||!myUsername||_psUser!==myUsername)return;
  const cur=_psCollect(),sig=_psSigOf(cur);
  if(sig===_psSig)return;
  _psSig=sig;_psTs=Math.max(Date.now(),_psTs+1); // строго новее прошлой правки (часы устройств могут расходиться)
  try{localStorage.setItem(_psKey(),String(_psTs));}catch(e){}
  window._fbSet(_psRef(),{...cur,ts:_psTs,dev:_myDeviceId}).catch(e=>console.warn('profile sync push:',e));
}
async function _psStart(){
  _psUser=myUsername;_psReady=false;
  if(_psOff){try{_psOff();}catch(e){}_psOff=null;}
  _psTs=+(localStorage.getItem(_psKey())||0);
  let remote=null;
  try{remote=(await _fbOnce('user_sync/'+myUsername+'/profile',8000))?.val()||null;}catch(e){}
  if(_psUser!==myUsername)return;
  if(remote&&(remote.ts||0)>_psTs)_psApply(remote);
  else _psSig='';               // локальное новее или облака ещё нет — отправим своё
  _psReady=true;
  if(!remote||(remote.ts||0)<=_psTs)_psPush();
  // Живые изменения с других устройств
  _psOff=window._fbOnValue(_psRef(),snap=>{
    const d=snap.val();
    if(!d||d.dev===_myDeviceId||(d.ts||0)<=_psTs)return;
    _psApply(d);
    toast('🔄 Профиль обновлён с другого устройства');
  });
}

// ── 3. Хранилище медиа ──
const MS_CHUNK=100000;  // символов data URL на кусок (< 256 КБ лимита узла)
async function _msUpload(id,dataUrl,meta,onProg){
  const db=window._fbDb,total=Math.ceil(dataUrl.length/MS_CHUNK);
  const base='mstore/'+id;
  await window._fbSet(window._fbRef(db,base+'/m'),{...meta,total,ts:Date.now(),from:myUsername});
  for(let i=0;i<total;i++){
    await window._fbSet(window._fbRef(db,base+'/c/'+i),dataUrl.slice(i*MS_CHUNK,(i+1)*MS_CHUNK));
    onProg&&onProg(Math.round((i+1)/total*100));
  }
}
const _msCache={};
function _msDownload(id){
  if(_msCache[id])return _msCache[id];
  const p=(async()=>{
    const m=(await _fbOnce('mstore/'+id+'/m',20000))?.val();
    if(!m||!m.total)throw new Error('медиа не найдено');
    const parts=await Promise.all(Array.from({length:m.total},(_,i)=>
      _fbOnce('mstore/'+id+'/c/'+i,60000).then(s=>{const v=s?.val();if(typeof v!=='string')throw new Error('кусок '+i);return v;})));
    return parts.join('');
  })();
  _msCache[id]=p;p.catch(()=>{delete _msCache[id];});
  return p;
}

// ── 2. Журнал сообщений ──
let _mlUser=null,_mlOffs=[];
const _mlPending=new Set();
const _mlSessionStart=Date.now();
function _mlKey(ts,id){return String(ts||0).padStart(13,'0')+'_'+String(id).replace(/[^A-Za-z0-9_-]/g,'_');}
function _mlRef(owner,key){return window._fbRef(window._fbDb,'ml/'+owner+(key?'/'+key:''));}
function _mlOn(){return !!(_fbMode&&window._fbDb&&myUsername&&_mlUser===myUsername);}
function _mlSeenKey(){return _getAccountPrefix(myUsername)+'mlSeen';}

// Записать сообщение себе и собеседнику (для «Избранного» — только себе)
function _mlPost(chat,rec){
  if(!_mlOn()||!chat||chat==='ai'||chat.startsWith('g_')||_isChannelId?.(chat))return null;
  const key=_mlKey(rec.ts,rec.id);
  const clean={};for(const k in rec)if(rec[k]!==undefined&&rec[k]!==null)clean[k]=rec[k];
  window._fbSet(_mlRef(myUsername,key),{...clean,chat,out:true,from:myUsername,dev:_myDeviceId}).catch(e=>console.warn('ml self:',e));
  let p=Promise.resolve();
  if(chat!=='saved'){
    p=window._fbSet(_mlRef(chat,key),{...clean,chat:myUsername,out:false,from:myUsername,nick:myNick||('@'+myUsername)});
    p.then(()=>{
      const m=(chatHist[chat]||[]).find(x=>x.id===rec.id);
      if(m&&(m.status==='sent'||!m.status)){m.status='delivered';_updateMsgStatus(rec.id,'delivered');saveAll();}
    }).catch(e=>console.warn('ml peer:',e));
  }
  return p;
}
function _mlFindKey(chat,id){
  const m=(chatHist[chat]||[]).find(x=>x.id===id);
  return m?(m._mk||_mlKey(m.ts,id)):null;
}
function _mlEdit(chat,id,patch){
  if(!_mlOn())return;
  const key=_mlFindKey(chat,id);if(!key)return;
  window._fbRef(window._fbDb,'ml/'+myUsername+'/'+key).update(patch).catch(()=>{});
  if(chat!=='saved')window._fbRef(window._fbDb,'ml/'+chat+'/'+key).update(patch).catch(()=>{});
}
function _mlDelete(chat,msg,forAll){
  if(!_mlOn()||!msg)return;
  const key=msg._mk||_mlKey(msg.ts,msg.id);
  if(forAll&&chat!=='saved'){
    window._fbRef(window._fbDb,'ml/'+myUsername+'/'+key).update({del:true}).catch(()=>{});
    window._fbRef(window._fbDb,'ml/'+chat+'/'+key).update({del:true}).catch(()=>{});
  }else window._fbRef(window._fbDb,'ml/'+myUsername+'/'+key).update({gone:true}).catch(()=>{});
}

// Медиа-сообщение: сначала кусками в mstore, потом запись в журнал.
// Получатель может быть офлайн — заберёт, когда зайдёт.
async function _mlSendMedia(chat,id,kind,dataUrl,meta,onProg){
  if(!_mlOn()||!chat||chat==='ai'||chat.startsWith('g_')||_isChannelId(chat))return false;
  try{
    await _msUpload(id,dataUrl,{kind,mime:meta.mime||'',name:meta.name||''},onProg);
    await _mlPost(chat,{id,k:kind,ts:meta.ts||Date.now(),name:meta.name,mime:meta.mime,size:meta.size,
      dur:meta.dur,wave:meta.wave?meta.wave.join(','):undefined});
    return true;
  }catch(e){console.warn('ml media:',e);toast('Не удалось отправить медиа: '+e.message);return false;}
}

// Запись журнала → локальное сообщение
async function _mlMaterialize(key,r){
  const out=!!r.out,chat=r.chat;
  const base={id:r.id,sender:out?'me':'inc',ts:r.ts,time:fmtTime(r.ts),_mk:key};
  if(!out){base.senderId=chat;base.name=peerNames[chat]||r.nick||('@'+chat);base.avatar=peerAvatars[chat]||null;}
  else base.status='delivered';
  if(r.edited)base.edited=true;
  const k=r.k||'text';
  if(k==='text')return {...base,text:r.text||''};
  const data=await _msDownload(r.id);
  if(k==='photo'){
    const photoId=storePhoto(data);const thumb=await makeThumb(data);
    return {...base,photoId,photoThumb:thumb||data,fileName:r.name||'photo'};
  }
  if(k==='voice'){
    await _saveMediaToIdb(r.id,'voice',data);
    const m={...base,voiceData:'idb:'+r.id+':voice',voiceDur:r.dur||0};
    if(r.wave)m.voiceWave=String(r.wave).split(',').map(Number);
    return m;
  }
  if(k==='slon'){
    await _saveMediaToIdb(r.id,'slon',data);
    return {...base,slonData:'idb:'+r.id+':slon',slonDur:r.dur||0};
  }
  // файл
  const fdid='fd_'+r.id;
  try{
    const b64=data.includes(',')?data.split(',')[1]:data;
    const bin=atob(b64),arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    fileStore[fdid]=URL.createObjectURL(new Blob([arr],{type:r.mime||'application/octet-stream'}));
  }catch(e){fileStore[fdid]=null;}
  return {...base,fileInfo:{name:r.name||'файл',size:r.size||''},fileDataId:fdid};
}
const ML_PREVIEW={text:null,photo:'📷 Фото',file:'📎 Файл',voice:'🎙️ Голосовое',slon:'🐘 Слонкружок'};

async function _mlOnAdd(key,r){
  if(!r||!r.id||!r.chat||r.del||r.gone)return;
  const chat=r.chat,out=!!r.out;
  if(!out&&blockedUsers[chat])return;
  if(!out&&chat!=='saved'&&typeof _privacyGate==='function'&&!_privacyGate(chat,{type:r.k==='text'||!r.k?'msg':'file_start'}))return;
  const hist=chatHist[chat]||(chatHist[chat]=[]);
  const have=hist.find(m=>m.id===r.id);
  if(have){have._mk=key;return;}
  if(_mlPending.has(r.id))return;
  _mlPending.add(r.id);
  try{
    // Новый собеседник (написал впервые или чат открыт на другом устройстве)
    if(chat!=='saved'&&!peerNames[chat]){
      if(!out&&myPrivacy.archiveUnknown){archivedChats[chat]=true;mutedChats[chat]=true;}
      peerNames[chat]=r.nick||('@'+chat);
      if(!$('si-'+chat))addSbItem(chat);
      try{_watchPresence(chat);_fetchProfile(chat);}catch(e){}
    }
    let msg;
    try{msg=await _mlMaterialize(key,r);}
    catch(e){console.warn('ml materialize:',r.id,e);return;}
    if(hist.some(m=>m.id===r.id))return;   // успело прийти другим путём
    hist.push(msg);
    const isLast=!hist.some(m=>m!==msg&&(m.ts||0)>(msg.ts||0));
    if(!isLast)hist.sort((a,b)=>(a.ts||0)-(b.ts||0));
    if(activeChat===chat){
      if(isLast){appendMsg(msg);scrollDown();}else renderChat(chat);
      if(!out&&document.visibilityState==='visible')sendData(conns[chat]||chat,{type:'read',ids:[r.id]});
    }
    const k=r.k||'text';
    const pv=ML_PREVIEW[k]||(r.text||'').slice(0,28);
    if(isLast)updatePreview(chat,(out?'Вы: ':'')+(k==='text'?(r.text||'').slice(0,28):pv));
    // Новое входящее: непрочитанное и уведомление (старое из истории — молча)
    const seen=+(localStorage.getItem(_mlSeenKey())||0);
    if(!out&&chat!=='saved'&&(r.ts||0)>seen){
      if(activeChat!==chat||document.visibilityState!=='visible'){
        if(activeChat!==chat)addUnread(chat);
        if((r.ts||0)>_mlSessionStart-120000&&!mutedChats[chat]&&_notifOn('private')){
          playNotifSound();
          showDesktopNotif(peerNames[chat]||('@'+chat),_notifText('private',k==='text'?r.text:pv).slice(0,60),peerAvatars[chat]||null,'msg:'+chat);
        }
      }
    }
    if((r.ts||0)>seen)try{localStorage.setItem(_mlSeenKey(),String(r.ts));}catch(e){}
    saveAll();
  }finally{_mlPending.delete(r.id);}
}
function _mlOnChange(key,r){
  if(!r||!r.chat)return;
  const chat=r.chat,hist=chatHist[chat];if(!hist)return;
  const m=hist.find(x=>x.id===r.id);if(!m)return;
  if(r.del||r.gone){
    chatHist[chat]=hist.filter(x=>x.id!==r.id);
    document.querySelector('[data-msg-id="'+r.id+'"]')?.remove();
    saveAll();return;
  }
  if(r.text!==undefined&&r.text!==m.text){
    m.text=r.text;m.edited=true;
    const bub=document.querySelector('[data-msg-id="'+r.id+'"] .msg-bub');
    if(bub)bub.innerHTML=linkify(r.text)+'<span style="font-size:10px;opacity:.5;margin-left:4px">ред.</span>';
    saveAll();
  }
}
function _mlStart(){
  _mlOffs.forEach(f=>{try{f();}catch(e){}});_mlOffs=[];
  _mlUser=myUsername;
  const q=_mlRef(myUsername).limitToLast(400);
  // child_removed не слушаем: у limitToLast он срабатывает и когда старое просто выпало из окна
  const add=s=>_mlOnAdd(s.key,s.val()),chg=s=>_mlOnChange(s.key,s.val());
  q.on('child_added',add);q.on('child_changed',chg);
  _mlOffs.push(()=>{q.off('child_added',add);q.off('child_changed',chg);});
}

// ── Запуск: ждём Firebase-режим; при смене аккаунта перезапускаемся ──
setInterval(()=>{
  if(!_fbMode||!window._fbDb||!myUsername)return;
  if(_mlUser!==myUsername){try{_mlStart();}catch(e){console.warn('ml start:',e);}}
  if(_psUser!==myUsername){_psStart().catch(e=>console.warn('profile sync:',e));}
},1500);

// Любое сохранение — проверяем, не поменялся ли профиль, и рассылаем на устройства
const _syncOrigSaveAll=saveAll;
saveAll=function(){
  const r=_syncOrigSaveAll.apply(this,arguments);
  try{_psPush();}catch(e){}
  return r;
};
