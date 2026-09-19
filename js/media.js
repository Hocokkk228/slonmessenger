async function _saveMediaToIdb(msgId,kind,src){
  try{
    let blob;
    if(src.startsWith('blob:')){
      const resp=await fetch(src);
      blob=await resp.blob();
    }else if(src.startsWith('data:')){
      const parts=src.split(',');
      const mime=parts[0].match(/:(.*?);/)?.[1]||'application/octet-stream';
      const bytes=atob(parts[1]);
      const buf=new Uint8Array(bytes.length);
      for(let i=0;i<bytes.length;i++)buf[i]=bytes.charCodeAt(i);
      blob=new Blob([buf],{type:mime});
    }else return;
    await _idb.put(msgId+':'+kind,blob);
  }catch(e){console.warn('[IDB] save failed:',msgId,kind,e);}
}

async function _loadMediaFromIdb(msgId,kind){
  try{
    const blob=await _idb.get(msgId+':'+kind);
    if(!blob)return null;
    return URL.createObjectURL(blob);
  }catch(e){return null;}
}

function startVoiceRec(){
  if(activeChat==='ai'){toast('Голосовые недоступны с ИИ');return;}
  if(mediaRecorder){cancelRec();return;}
  navigator.mediaDevices.getUserMedia({audio:true})
    .then(stream=>beginRec(stream,'voice'))
    .catch(()=>toast('Нет доступа к микрофону'));
}

function startSlonRec(){
  if(activeChat==='ai'){toast('Слонкружки недоступны с ИИ');return;}
  if(mediaRecorder){cancelRec();return;}
  navigator.mediaDevices.getUserMedia({audio:true,video:{facingMode:'user',width:{ideal:320},height:{ideal:320}}})
    .then(stream=>beginRec(stream,'slon'))
    .catch(()=>navigator.mediaDevices.getUserMedia({audio:true,video:true})
      .then(stream=>beginRec(stream,'slon'))
      .catch(()=>toast('Нет доступа к камере')));
}

function beginRec(stream,mode){
  recMode=mode;recChunks=[];recSecs=0;
  $('recModalTitle').textContent=mode==='slon'?'Запись слонкружка 🐘':'Запись голосового 🎙️';
  $('recAnim').textContent=mode==='slon'?'🐘':'🎙️';
  const sp=$('slonPreview');
  if(sp){sp.style.display=mode==='slon'?'block':'none';}
  $('recTimerEl').textContent='0:00';
  $('recModal').classList.add('show');

  // Определяем поддерживаемый mimeType
  const mimeTypes=mode==='slon'
    ?['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4;codecs=h264,aac','video/mp4']
    :['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];
  let mime='';
  for(const m of mimeTypes){
    try{if(MediaRecorder.isTypeSupported(m)){mime=m;break;}}catch(e){}
  }
  // Запоминаем итоговый mime чтобы использовать его при сборке blob
  const _recMime=mime||( mode==='slon'?'video/webm':'audio/webm');

  try{
    mediaRecorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});
  }catch(e){
    // Fallback без mimeType
    try{mediaRecorder=new MediaRecorder(stream);}
    catch(e2){toast('Запись не поддерживается');return;}
  }

  mediaRecorder.ondataavailable=e=>{if(e.data&&e.data.size>0)recChunks.push(e.data);};
  mediaRecorder._recMime=_recMime; // сохраняем для сборки
  mediaRecorder.start(200); // 200ms чанки — достаточно, без лишних вызовов

  recTimer=setInterval(()=>{
    recSecs++;
    $('recTimerEl').textContent=Math.floor(recSecs/60)+':'+String(recSecs%60).padStart(2,'0');
    if(recSecs>=120)stopAndSendRec();
  },1000);

  const btn=$('voiceRecBtn');if(btn)btn.classList.add('rec-active');

  // Живой превью и кнопка поворота камеры
  if(mode==='slon'){
    _slonFacing='user';
    _slonStream=stream;
    const preview=$('slonPreview');
    if(preview){
      preview.srcObject=stream;
      preview.play().catch(()=>{});
    }
    const flipBtn=$('slonFlipBtn');
    if(flipBtn){
      const isMob=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      flipBtn.style.display=isMob?'flex':'none';
    }
  }
}

function cancelRec(){
  _stopRec();
  _slonStream=null;
  const preview=$('slonPreview');if(preview){preview.srcObject=null;preview.style.display='none';}
  const flipBtn=$('slonFlipBtn');if(flipBtn)flipBtn.style.display='none';
  $('recModal').classList.remove('show');
  const btn=$('voiceRecBtn');if(btn)btn.classList.remove('rec-active');
}

function _stopRec(){
  if(recTimer){clearInterval(recTimer);recTimer=null;}
  if(mediaRecorder){
    const mr=mediaRecorder;
    mediaRecorder=null;
    try{mr.stream?.getTracks().forEach(t=>t.stop());}catch(e){}
    try{mr.stop();}catch(e){}
  }
}

function stopAndSendRec(){
  if(!mediaRecorder)return;
  $('recModal').classList.remove('show');
  const btn=$('voiceRecBtn');if(btn)btn.classList.remove('rec-active');
  if(recTimer){clearInterval(recTimer);recTimer=null;}

  const _stream=mediaRecorder.stream;
  const _mode=recMode;
  const _recMime=mediaRecorder._recMime||(_mode==='slon'?'video/webm':'audio/webm');
  const _mr=mediaRecorder;
  mediaRecorder=null; // сбрасываем до stop() чтобы не было двойного вызова

  _mr.onstop=()=>{
    const preview=$('slonPreview');
    if(preview){preview.srcObject=null;preview.style.display='none';}
    const flipBtn=$('slonFlipBtn');if(flipBtn)flipBtn.style.display='none';
    _slonStream=null;

    if(!recChunks.length){toast('Запись пустая');return;}
    // Берём тип из первого непустого чанка, fallback на _recMime
    const blobMime=recChunks[0].type||_recMime;
    const blob=new Blob(recChunks,{type:blobMime});
    recChunks=[];
    const dur=recSecs;

    // Для слонкружков конвертируем в Blob URL сразу (не data URL)
    // чтобы избежать проблем с чёрным экраном
    if(_mode==='slon'){
      const blobUrl=URL.createObjectURL(blob);
      sendSlonMsg(blobUrl,dur,blobMime,true); // true = isUrl (не data:)
    }else{
      const reader=new FileReader();
      reader.onload=e=>sendVoiceMsg(e.target.result,dur,blobMime);
      reader.readAsDataURL(blob);
    }
  };

  try{_mr.stop();}catch(e){console.warn('MediaRecorder stop error:',e);}
}

function sendVoiceMsg(dataUrl,dur,mimeType){
  const mid='vm'+Date.now();
  const ts=Date.now();
  _saveMediaToIdb(mid,'voice',dataUrl).catch(()=>{});
  const msg={id:mid,sender:'me',ts,time:fmtTime(ts),voiceData:'idb:'+mid+':voice',voiceDur:dur};
  if(!chatHist[activeChat])chatHist[activeChat]=[];
  chatHist[activeChat].push(msg);appendMsg(msg);scrollDown();
  updatePreview(activeChat,'Вы: 🎙️ Голосовое');
  if(activeChat.startsWith('g_')){
    // Группа: загружаем один раз, публикуем в grp_msgs
    _sendGrpMedia(activeChat,mid,'voice',dataUrl,dur,mimeType);
  }else if(activeChat!=='ai'&&activeChat!=='saved'&&(_fbMode||conns[activeChat]?.open)){
    sendMediaChunked(_fbMode?activeChat:conns[activeChat],'voice',mid,dataUrl,dur,mimeType);
  }
  saveAll();
}

function sendSlonMsg(dataUrl,dur,mimeType,isBlobUrl=false){
  const mid='sc'+Date.now();
  const ts=Date.now();
  // Если передан Blob URL — используем его напрямую, не конвертируем
  const slonData=dataUrl;
  const msg={id:mid,sender:'me',ts,time:fmtTime(ts),slonData,slonDur:dur,isUrl:isBlobUrl};
  if(!chatHist[activeChat])chatHist[activeChat]=[];
  chatHist[activeChat].push(msg);appendMsg(msg);scrollDown();
  updatePreview(activeChat,'Вы: 🐘 Слонкружок');
  if(activeChat.startsWith('g_')){
    // Группа
    if(isBlobUrl){
      fetch(dataUrl).then(r=>r.blob()).then(blob=>{
        const reader=new FileReader();
        reader.onload=e=>_sendGrpMedia(activeChat,mid,'slon',e.target.result,dur,mimeType);
        reader.readAsDataURL(blob);
      }).catch(e=>console.warn('slon fetch error:',e));
    }else{_sendGrpMedia(activeChat,mid,'slon',dataUrl,dur,mimeType);}
  }else if(activeChat!=='ai'&&activeChat!=='saved'&&(_fbMode||conns[activeChat]?.open)){
    if(isBlobUrl){
      fetch(dataUrl).then(r=>r.blob()).then(blob=>{
        const reader=new FileReader();
        reader.onload=e=>sendMediaChunked(_fbMode?activeChat:conns[activeChat],'slon',mid,e.target.result,dur,mimeType);
        reader.readAsDataURL(blob);
      }).catch(e=>console.warn('slon fetch error:',e));
    }else{sendMediaChunked(_fbMode?activeChat:conns[activeChat],'slon',mid,dataUrl,dur,mimeType);}
  }
  saveAll();
}

async function _sendGrpMedia(gid, mid, kind, dataUrl, dur, mimeType){
  if(!window._fbDb||!_fbMode)return;
  const nick=myNick||('@'+myUsername);
  const avatar=myAvatar||null;
  const ts=Date.now();
  try{
    const db=window._fbDb;
    const totalChunks=Math.ceil(dataUrl.length/FB_MEDIA_CHUNK);
    // Храним данные под именем отправителя — все участники читают отсюда
    const base='grp_media/'+gid+'/'+mid;
    await window._fbSet(window._fbRef(db,base+'/meta'),
      {kind,dur,mime:mimeType,nick,avatar,total:totalChunks,from:myUsername,ts});
    for(let i=0;i<totalChunks;i++){
      await window._fbSet(window._fbRef(db,base+'/chunks/'+i),
        dataUrl.slice(i*FB_MEDIA_CHUNK,(i+1)*FB_MEDIA_CHUNK));
    }
    // Публикуем уведомление в grp_msgs
    await window._fbSet(window._fbRef(db,'grp_msgs/'+gid+'/'+mid),{
      id:mid,type:kind,gid,sid:myUsername,nick,avatar,dur:dur||0,
      totalChunks,ts
    });
    toast(kind==='voice'?'🎙️ Голосовое отправлено':'🐘 Слонкружок отправлен');
  }catch(e){toast('Ошибка отправки медиа: '+e.message);console.error('_sendGrpMedia:',e);}
}

async function sendMediaChunked(conn,kind,id,dataUrl,dur,mimeType){
  const nick=myNick||('@'+myUsername);
  const avatar=myAvatar||null;
  const pid=typeof conn==='string'?conn:(conn?.peer||conn?.pid||null);
  if(!pid)return;
  const sendTs=Date.now();

  if(_fbMode&&window._fbDb){
    try{
      const db=window._fbDb;
      const totalChunks=Math.ceil(dataUrl.length/FB_MEDIA_CHUNK);
      const base='media_transfer/'+pid+'/'+id;
      // Пишем метаданные
      await window._fbSet(window._fbRef(db,base+'/meta'),
        {kind,dur,mime:mimeType,nick,avatar,total:totalChunks,from:myUsername,ts:sendTs});
      // Пишем чанки последовательно
      for(let i=0;i<totalChunks;i++){
        await window._fbSet(
          window._fbRef(db,base+'/chunks/'+i),
          dataUrl.slice(i*FB_MEDIA_CHUNK,(i+1)*FB_MEDIA_CHUNK)
        );
      }
      // Сигнал получателю через inbox
      sendData(pid,{type:'media_rtdb',kind,id,dur,mime:mimeType,nick,avatar,total:totalChunks,ts:sendTs});
      return;
    }catch(e){
      console.warn('RTDB media failed:',e);
      toast('Ошибка отправки медиа: '+e.message);
      return;
    }
  }
  // P2P fallback
  const chunks=[];
  for(let i=0;i<dataUrl.length;i+=CHUNK)chunks.push(dataUrl.slice(i,i+CHUNK));
  sendData(conn,{type:'media_start',kind,id,dur,mime:mimeType,chunks:chunks.length,nick,avatar,ts:sendTs});
  chunks.forEach((d,i)=>sendData(conn,{type:'media_chunk',id,i,d}));
  sendData(conn,{type:'media_end',id});
}

function renderVoiceBub(msg,isOut){
  const dur=msg.voiceDur||0;
  const barsCount=24;
  let bars='';
  for(let i=0;i<barsCount;i++){
    const h=18+Math.floor(Math.random()*10+Math.sin(i*0.7)*5);
    bars+=`<div class="vb-bar" style="height:${h}px" data-i="${i}"></div>`;
  }
  const div=document.createElement('div');
  div.className='voice-bub';
  div.innerHTML=`
    <button class="vb-play" title="Воспроизвести"><svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor"><path d="M8 5v14l11-7z"/></svg></button>
    <div class="vb-bars">${bars}</div>
    <div class="vb-dur">${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}</div>`;
  const playBtn=div.querySelector('.vb-play');
  let audio=null,playing=false;

  async function _getAudioSrc(){
    const src=msg.voiceData;
    if(!src) return null;
    if(src.startsWith('idb:')){
      const parts=src.split(':'); // idb:msgId:kind
      return await _loadMediaFromIdb(parts[1],parts[2]||'voice');
    }
    if(src.startsWith('blob:')||src.startsWith('data:')||src.startsWith('http')) return src;
    return src;
  }

  playBtn.onclick=async()=>{
    if(!audio){
      const src=await _getAudioSrc();
      if(!src){toast('Аудио недоступно');return;}
      audio=new Audio(src);
      audio.onended=()=>{playing=false;playBtn.innerHTML='<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor"><path d="M8 5v14l11-7z"/></svg>';div.querySelectorAll('.vb-bar').forEach(b=>b.classList.remove('played'));};
      audio.ontimeupdate=()=>{
        const pct=audio.duration?audio.currentTime/audio.duration:0;
        const n=Math.floor(pct*barsCount);
        div.querySelectorAll('.vb-bar').forEach((b,i)=>b.classList.toggle('played',i<n));
      };
    }
    if(playing){audio.pause();playBtn.innerHTML='<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor"><path d="M8 5v14l11-7z"/></svg>';playing=false;}
    else{audio.play().catch(e=>{toast('Ошибка воспроизведения: '+e.message);});playBtn.innerHTML='<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor"><path d="M6 6h12v12H6z"/></svg>';playing=true;}
  };
  return div;
}

function renderSlonBub(msg){
  const dur=msg.slonDur||0;
  const durStr=Math.floor(dur/60)+':'+String(dur%60).padStart(2,'0');
  const wrap=document.createElement('div');wrap.className='slon-circle-bub';
  const isOut=msg.sender==='me';

  wrap.innerHTML=`
    <div class="slon-circle-wrap" id="sw-${msg.id}">
      <svg class="slon-circle-svg" viewBox="0 0 180 185" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="16" cy="72" rx="22" ry="34" fill="rgba(88,166,255,0.55)" stroke="rgba(88,166,255,0.85)" stroke-width="2.5"/>
        <ellipse cx="164" cy="72" rx="22" ry="34" fill="rgba(88,166,255,0.55)" stroke="rgba(88,166,255,0.85)" stroke-width="2.5"/>
        <circle cx="90" cy="82" r="72" fill="none" stroke="rgba(88,166,255,0.7)" stroke-width="3"/>
        <path d="M 76 152 Q 68 165 64 174 Q 62 182 70 184 Q 82 186 88 178 Q 92 170 88 160 Q 84 152 82 152 Z" fill="rgba(88,166,255,0.72)" stroke="rgba(88,166,255,0.9)" stroke-width="1.5"/>
      </svg>
      <video class="slon-circle-vid" id="sv-${msg.id}" playsinline muted loop></video>
      <div class="slon-circle-play-overlay" id="so-${msg.id}">
        <svg viewBox="0 0 24 24" style="width:32px;height:32px;fill:#fff"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    <div class="slon-circle-dur">🐘 ${durStr}</div>`;

  const vid=wrap.querySelector('#sv-'+msg.id);
  const overlay=wrap.querySelector('#so-'+msg.id);
  const playSvg='<svg viewBox="0 0 24 24" style="width:32px;height:32px;fill:#fff"><path d="M8 5v14l11-7z"/></svg>';
  const pauseSvg='<svg viewBox="0 0 24 24" style="width:32px;height:32px;fill:#fff"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

  // Загружаем видео — обрабатываем все форматы
  async function _loadSrc(){
    const src=msg.slonData;
    if(!src||src==='null'){
      // Нет данных — показываем заглушку
      if(overlay)overlay.innerHTML='<span style="font-size:11px;color:rgba(255,255,255,.6)">Видео недоступно</span>';
      return;
    }
    try{
      if(src.startsWith('idb:')){
        // Загружаем из IndexedDB
        const parts=src.split(':'); // idb:msgId:kind
        const blobUrl=await _loadMediaFromIdb(parts[1],parts[2]||'slon');
        if(blobUrl){vid.src=blobUrl;}
        else if(overlay)overlay.innerHTML='<span style="font-size:11px;color:rgba(255,255,255,.6)">Видео недоступно</span>';
      }else if(src.startsWith('blob:')){
        // Живой Blob URL — используем напрямую, и сохраняем в IDB на всякий случай
        vid.src=src;
        _saveMediaToIdb(msg.id,'slon',src).catch(()=>{});
      }else if(src.startsWith('data:')){
        // data URL → Blob URL
        const parts=src.split(',');
        const mime=parts[0].match(/:(.*?);/)?.[1]||'video/webm';
        const bytes=atob(parts[1]);
        const buf=new Uint8Array(bytes.length);
        for(let i=0;i<bytes.length;i++)buf[i]=bytes.charCodeAt(i);
        const blob=new Blob([buf],{type:mime});
        vid.src=URL.createObjectURL(blob);
        // Сохраняем в IDB для будущих перезагрузок
        _idb.put(msg.id+':slon',blob).catch(()=>{});
      }else{
        vid.src=src; // HTTP URL или что-то другое
      }
    }catch(e){
      console.warn('renderSlonBub load error:',e);
      if(overlay)overlay.innerHTML='<span style="font-size:11px;color:rgba(255,255,255,.6)">Ошибка загрузки</span>';
    }
  }
  _loadSrc();

  let playing=false;
  const slonWrap=wrap.querySelector('.slon-circle-wrap');

  slonWrap.onclick=()=>{
    if(!vid.src&&!vid.srcObject){return;}
    if(playing){
      vid.pause();playing=false;
      if(overlay)overlay.innerHTML=playSvg;
    }else{
      vid.muted=false;
      vid.play().catch(()=>{vid.muted=true;vid.play().catch(()=>{});});
      playing=true;
      if(overlay)overlay.innerHTML=pauseSvg;
    }
  };
  vid.onended=()=>{playing=false;if(overlay)overlay.innerHTML=playSvg;};

  return wrap;
}

async function flipSlonCamera(){
  if(!_slonStream||!mediaRecorder)return;
  const newFacing=_slonFacing==='user'?'environment':'user';
  let newStream=null;

  // Перебираем камеры через enumerateDevices (надёжнее на мобильных)
  try{
    const devices=await navigator.mediaDevices.enumerateDevices();
    const cams=devices.filter(d=>d.kind==='videoinput');
    if(cams.length>=2){
      const curId=_slonStream.getVideoTracks()[0]?.getSettings().deviceId;
      const other=cams.find(c=>c.deviceId&&c.deviceId!==curId);
      if(other){
        // Останавливаем только видеотрек, аудио оставляем
        _slonStream.getVideoTracks().forEach(t=>{t.stop();_slonStream.removeTrack(t);});
        const vs=await navigator.mediaDevices.getUserMedia({
          video:{deviceId:{exact:other.deviceId}},audio:false
        });
        vs.getVideoTracks().forEach(t=>_slonStream.addTrack(t));
        newStream=_slonStream;
      }
    }
  }catch(e){console.warn('flipSlon enum:',e);}

  // Fallback facingMode
  if(!newStream){
    try{
      const ns=await navigator.mediaDevices.getUserMedia({
        audio:true,video:{facingMode:{ideal:newFacing}}
      });
      // Останавливаем старый стрим и переключаемся
      _slonStream.getTracks().forEach(t=>t.stop());
      _slonStream=ns;
      newStream=ns;
    }catch(e){toast('Не удалось переключить камеру');return;}
  }

  _slonFacing=newFacing;

  // Обновляем превью
  const preview=$('slonPreview');
  if(preview){
    preview.srcObject=_slonStream||newStream;
    preview.play().catch(()=>{});
  }
  toast(newFacing==='environment'?'📷 Задняя камера':'🤳 Фронтальная');
}

function icoSvgPlay(){return '<svg viewBox="0 0 24 24" style="width:1em;height:1em;fill:currentColor"><path d="M8 5v14l11-7z"/></svg>';}

function icoSvgStop(){return '<svg viewBox="0 0 24 24" style="width:1em;height:1em;fill:currentColor"><path d="M6 6h12v12H6z"/></svg>';}
