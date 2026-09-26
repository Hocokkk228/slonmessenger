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
  if(typeof _apiToken==='function'&&_apiToken())api('/me/sync',{data:cur,ts:_psTs,dev:_myDeviceId}).catch(e=>console.warn('profile sync api:',e));
  window._fbSet(_psRef(),{...cur,ts:_psTs,dev:_myDeviceId}).catch(e=>console.warn('profile sync push:',e));
}
async function _psStart(){
  _psUser=myUsername;_psReady=false;
  if(_psOff){try{_psOff();}catch(e){}_psOff=null;}
  _psTs=+(localStorage.getItem(_psKey())||0);
  let remote=null;
  try{remote=(await _fbOnce('user_sync/'+myUsername+'/profile',8000))?.val()||null;}catch(e){}
  // С нашего сервера — берём, если новее
  try{
    if(typeof _apiToken==='function'&&_apiToken()){
      const d=await api('/me/sync');
      if(d.data&&(d.ts||0)>(remote?.ts||0))remote={...d.data,ts:d.ts};
    }
  }catch(e){}
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

  });
}

// Синк профиля пришёл через хаб с другого нашего устройства
function _psRemote(p){
  if(!p||!p.data||p.dev===_myDeviceId||(p.ts||0)<=_psTs)return;
  _psApply({...p.data,ts:p.ts});
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

// ── Медиа на нашем сервере (Cloudflare, Durable Objects) ──
// Файл уходит одним запросом как есть (не base64), с прогрессом загрузки.
// Скачивание — по неугадываемому id. Старые медиа (mstore в Firebase) читаются по-прежнему.
function _srvUpload(dataUrl,meta,onProg){
  const [head,b64]=dataUrl.split(',');
  const mime=meta.mime||head.match(/:(.*?);/)?.[1]||'application/octet-stream';
  const bin=atob(b64||''),buf=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);
  return _srvUploadBlob(new Blob([buf],{type:mime}),mime,meta.name,onProg);
}
function _srvUploadBlob(blob,mime,name,onProg){
  const meta={name};
  if(SRV_KIND==='yc')return _ycUploadBlob(blob,mime,onProg);
  return new Promise((res,rej)=>{
    const x=new XMLHttpRequest();
    x.open('POST',API_URL+'/media');
    x.setRequestHeader('Authorization','Bearer '+_apiToken());
    x.setRequestHeader('X-Mime',mime);
    x.setRequestHeader('X-Name',encodeURIComponent(meta.name||''));
    x.upload.onprogress=e=>{if(e.lengthComputable&&onProg)onProg(Math.round(e.loaded/e.total*100));};
    x.onload=()=>{let d={};try{d=JSON.parse(x.responseText);}catch(e){}
      if(x.status===200&&d.id)res(d.id);else rej(new Error(d.message||('ошибка '+x.status)));};
    x.onerror=()=>rej(new Error('нет интернета'));
    x.send(blob);
  });
}
// Яндекс: сервер выдаёт подписанную ссылку, файл уходит прямо в хранилище (без лимита функции)
async function _ycUploadBlob(blob,mime,onProg){
  const d=await api('/media/presign',{size:blob.size,mime});
  await new Promise((res,rej)=>{
    const x=new XMLHttpRequest();
    x.open('PUT',d.put);
    x.setRequestHeader('Content-Type',mime||'application/octet-stream');
    x.upload.onprogress=e=>{if(e.lengthComputable&&onProg)onProg(Math.round(e.loaded/e.total*100));};
    x.onload=()=>x.status>=200&&x.status<300?res():rej(new Error('хранилище: '+x.status));
    x.onerror=()=>rej(new Error('нет интернета'));
    x.send(blob);
  });
  return d.id;
}
const _srvCache={};
function _srvDownload(mid){
  if(_srvCache[mid])return _srvCache[mid];
  const p=(async()=>{
    const r=await fetch(_mediaUrl(mid));
    if(!r.ok)throw new Error('медиа не найдено');
    const b=await r.blob();
    return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b);});
  })();
  _srvCache[mid]=p;p.catch(()=>{delete _srvCache[mid];});
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
  // Сквозное шифрование (Signal): получилось — всё; у собеседника старая версия — как раньше
  if(typeof _e2eOn!=='undefined'&&_e2eOn&&typeof _hubUp!=='undefined'&&_hubUp&&!clean._plain){
    return (async()=>{
      if(await _e2ePost(chat,key,clean))return;
      if((clean.k||'text')==='text'&&chat!=='saved')
        sendData(conns[chat]||chat,{type:'msg',id:clean.id,text:clean.text,ts:clean.ts,nick:myNick||('@'+myUsername),avatar:myAvatar||null});
      return _mlPost(chat,{...clean,_plain:1,mk:undefined});
    })();
  }
  delete clean._plain;
  // Наш сервер: журнал у себя и у собеседника, доставка на все устройства (галочки — по ml_ack)
  if(typeof _hubSend==='function'&&_hubSend({t:'ml_post',chat,key,rec:clean})){
    if(chat!=='saved'&&typeof _pushMsg==='function')_pushMsg(chat,(rec.k||'text')==='text'?rec.text:(ML_PREVIEW[rec.k]||'Медиа'));
    return Promise.resolve();
  }
  window._fbSet(_mlRef(myUsername,key),{...clean,chat,out:true,from:myUsername,dev:_myDeviceId}).catch(e=>console.warn('ml self:',e));
  let p=Promise.resolve();
  if(chat!=='saved'){
    if(typeof _pushMsg==='function')_pushMsg(chat,(rec.k||'text')==='text'?rec.text:(ML_PREVIEW[rec.k]||'Медиа'));
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
  const em=(chatHist[chat]||[]).find(x=>x.id===id);
  if(em?._e2e&&typeof _e2eOn!=='undefined'&&_e2eOn&&patch.text!=null){_e2eEdit(chat,key,em,patch.text);return;}
  if(typeof _hubSend==='function'&&_hubSend({t:'ml_patch',chat,key,patch}))return;
  window._fbRef(window._fbDb,'ml/'+myUsername+'/'+key).update(patch).catch(()=>{});
  if(chat!=='saved')window._fbRef(window._fbDb,'ml/'+chat+'/'+key).update(patch).catch(()=>{});
}
function _mlDelete(chat,msg,forAll){
  if(!_mlOn()||!msg)return;
  const key=msg._mk||_mlKey(msg.ts,msg.id);
  if(typeof _hubSend==='function'&&_hubSend({t:'ml_patch',chat,key,patch:forAll&&chat!=='saved'?{del:true}:{gone:true}}))return;
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
    // На наш сервер; если у устройства ещё нет токена — по-старому, в Firebase
    let m,mk;
    if(typeof _e2eOn!=='undefined'&&_e2eOn&&typeof _apiToken==='function'&&_apiToken()){
      const enc=await _e2eEncryptMedia(dataUrl,meta.mime);
      mk=enc.mk;m=await _srvUploadBlob(enc.blob,'application/octet-stream','',onProg);
    }
    else if(typeof _apiToken==='function'&&_apiToken())m=await _srvUpload(dataUrl,{mime:meta.mime,name:meta.name},onProg);
    else await _msUpload(id,dataUrl,{kind,mime:meta.mime||'',name:meta.name||''},onProg);
    await _mlPost(chat,{id,k:kind,m,mk,ts:meta.ts||Date.now(),name:meta.name,mime:meta.mime,size:meta.size,
      dur:meta.dur,wave:meta.wave?meta.wave.join(','):undefined});
    return true;
  }catch(e){console.warn('ml media:',e);toast('Не удалось отправить медиа: '+e.message);return false;}
}

// Запись журнала → локальное сообщение
async function _mlMaterialize(key,r0){
  let r=r0,e2e=false;
  if(r0.e&&typeof _e2eOpen==='function'){
    const p=await _e2eOpen(key,r0);
    const out0=!!r0.out,chat0=r0.chat;
    if(!p)return {id:r0.id,sender:out0?'me':'inc',senderId:out0?undefined:chat0,name:out0?undefined:(peerNames[chat0]||('@'+chat0)),
      ts:r0.ts,time:fmtTime(r0.ts),_mk:key,_e2e:true,_e2eWait:true,text:'🔒 Зашифрованное сообщение — откроется, когда на устройство придёт ключ'};
    r={...r0,...p,k:p.k||'text'};e2e=true;
  }
  const out=!!r.out,chat=r.chat;
  const base={id:r.id,sender:out?'me':'inc',ts:r.ts,time:fmtTime(r.ts),_mk:key};
  if(!out){base.senderId=chat;base.name=peerNames[chat]||r.nick||('@'+chat);base.avatar=peerAvatars[chat]||null;}
  else base.status='delivered';
  if(r.edited)base.edited=true;
  if(e2e){base._e2e=true;base._ev=r.ev||0;}
  const k=r.k||'text';
  if(k==='text')return {...base,text:r.text||'',...(r.reply&&r.reply.id?{reply:{id:String(r.reply.id),name:String(r.reply.name||''),text:String(r.reply.text||'').slice(0,120)}}:{})};
  const data=r.mk?await _e2eFetchMedia(r.m,r.mk,r.mime):r.m?await _srvDownload(r.m):await _msDownload(r.id);
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
  if(have){
    have._mk=key;
    const isStub=have._e2eWait||(typeof have.text==='string'&&have.text.startsWith('🔒 Зашифрованное сообщение'));
    if(!isStub||!r.e)return;
    const i=hist.indexOf(have);if(i>=0)hist.splice(i,1);
    document.querySelector('[data-msg-id="'+r.id+'"]')?.remove();
  }
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
      if(!out)setTimeout(()=>_sendRead(chat),50);
    }
    const k=msg.text!=null?'text':msg.photoId?'photo':msg.voiceData?'voice':msg.slonData?'slon':msg.fileInfo?'file':'text';
    r={...r,text:msg.text};
    const pv=ML_PREVIEW[k]||(msg.text||'').slice(0,28);
    if(isLast)updatePreview(chat,(out?'Вы: ':'')+(k==='text'?(msg.text||'').slice(0,28):pv));
    // Новое входящее: непрочитанное и уведомление (старое из истории — молча)
    const seen=+(localStorage.getItem(_mlSeenKey())||0);
    if(!out&&chat!=='saved'&&(r.ts||0)>seen){
      if(activeChat!==chat||document.visibilityState!=='visible'){
        if(activeChat!==chat)addUnread(chat);
        if((r.ts||0)>_mlSessionStart-120000&&!mutedChats[chat]&&_notifOn('private')){
          playNotifSound();
          showDesktopNotif(peerNames[chat]||('@'+chat),_notifText('private',k==='text'?r.text:pv).slice(0,60),peerAvatars[chat]||null,'msg:'+chat,{kind:'msg',chat});
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
  // зашифрованная правка: расшифровываем новую версию
  if(r.e&&!r.del&&!r.gone&&(r.ev||0)>(m._ev||0)&&typeof _e2eOpen==='function'){
    _e2eOpen(key,r).then(p=>{if(p&&p.text!=null){m._ev=r.ev;_mlOnChange(key,{id:r.id,chat,text:p.text});}});
    return;
  }
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


// ════════ Очередь исходящих (когда сервер недоступен) ════════
// Только текст: медиа (крупные блобы) сюда не кладём. Хранится по аккаунту.
// Досылается при переподключении к серверу; сервер идемпотентен по ключу.
const _obKey=()=>'sl_u_'+myUsername+'_outbox';
function _obLoad(){try{const a=JSON.parse(localStorage.getItem(_obKey())||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function _obSave(a){try{localStorage.setItem(_obKey(),JSON.stringify(a.slice(-500)));}catch(e){}}
function _obAdd(chat,rec){
  const a=_obLoad();
  if(a.some(x=>x.rec&&x.rec.id===rec.id))return;      // уже в очереди
  a.push({chat,rec,at:Date.now()});_obSave(a);
  _obBadge();
}
// «В сети» ли мы для журнала: есть токен и живое соединение с хабом
const _obHubMode=()=>typeof _apiToken==='function'&&_apiToken()&&typeof _hubUp!=='undefined';
let _obDraining=false;
async function _obDrain(){
  if(_obDraining||!myUsername||!_hubUp)return;
  _obDraining=true;
  try{
    let a=_obLoad();if(!a.length){_obBadge();return;}
    const rest=[];
    for(const it of a){
      if(!it||!it.rec||!it.chat){continue;}
      // сообщение удалили из истории — не досылаем
      const exists=(chatHist[it.chat]||[]).some(m=>m.id===it.rec.id)||it.chat==='saved';
      if(!exists)continue;
      if(!_hubUp){rest.push(it);continue;}            // связь снова пропала — оставляем на потом
      try{await _mlPost0(it.chat,{...it.rec,_fromOutbox:1});}
      catch(e){rest.push(it);}
    }
    _obSave(rest);_obBadge();
  }finally{_obDraining=false;}
}
// маленький счётчик «ждут отправки» в статусе списка чатов
function _obBadge(){
  const n=_obLoad().length,el=document.getElementById('sbUpd');
  if(!el)return;
  let b=document.getElementById('obWait');
  if(!n){b&&b.remove();return;}
  if(!b){b=document.createElement('div');b.id='obWait';b.className='ob-wait';el.parentNode.insertBefore(b,el.nextSibling);}
  b.textContent='⏳ Ждут отправки: '+n+' — отправим, как появится связь';
}

// Оборачиваем _mlPost: нет связи с хабом — кладём в очередь вместо потери
const _mlPost0=_mlPost;
_mlPost=function(chat,rec){
  // только личные текстовые (медиа и служебное — мимо очереди)
  const queueable=rec&&(rec.k==='text'||!rec.k)&&chat&&chat!=='ai'&&!String(chat).startsWith('g_')&&!(typeof _isChannelId==='function'&&_isChannelId(chat));
  if(queueable&&_obHubMode()&&!_hubUp&&!rec._fromOutbox){
    _obAdd(chat,rec);
    return Promise.resolve();     // сообщение уже в истории (одна галочка) — досыл при связи
  }
  const r=_mlPost0(chat,rec);
  return r;
};

// Досыл при переподключении и раз в 20 c на всякий
window.addEventListener('online',()=>setTimeout(_obDrain,800));
setInterval(()=>{if(_hubUp)_obDrain();},20000);
setTimeout(_obBadge,2500);
