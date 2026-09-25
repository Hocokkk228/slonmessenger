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

// ════════════════════════════════════════
// ── ЗАПИСЬ ГОЛОСОВЫХ И СЛОНКРУЖКОВ (как в Telegram) ──
// Одна круглая кнопка: короткий тап — переключает режим микрофон ↔ камера,
// удержание — запись. Во время записи поле ввода плавно превращается в бар:
// корзина · [● волна 0:18,19] · пауза · отправить. Свайп вверх — фиксация
// (можно отпустить палец), свайп влево — отмена, отпустить — отправить.
// ════════════════════════════════════════
const RC_MAX={voice:600,slon:60};   // лимиты длительности, сек
const RC_HOLD_MS=220;                // дольше — это удержание, короче — тап
const RC_LOCK_DY=70,RC_CANCEL_DX=110;
const RC_AUDIO={echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1};
let _rcMode=(()=>{try{return localStorage.getItem('sl_recMode')==='slon'?'slon':'voice';}catch(e){return 'voice';}})();
let _rec=null;        // текущая запись (см. _rcBegin)
let _rcPress=null;    // текущее нажатие на кнопку

function _rcFmt(ms,cs){
  const s=Math.floor(ms/1000);
  const base=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  return cs?base+','+String(Math.floor(ms%1000/10)).padStart(2,'0'):base;
}
function _rcElapsed(){
  if(!_rec)return 0;
  return _rec.acc+(_rec.paused||!_rec.t0?0:performance.now()-_rec.t0);
}

// Режим кнопки: микрофон ↔ камера (иконка плавно перетекает)
function _rcSetMode(m){
  _rcMode=m==='slon'?'slon':'voice';
  try{localStorage.setItem('sl_recMode',_rcMode);}catch(e){}
  const b=$('voiceRecBtn');if(!b)return;
  b.classList.toggle('mode-slon',_rcMode==='slon');
  b.title=_rcMode==='slon'?'Слонкружок — удерживай для записи':'Голосовое — удерживай для записи';
}
function _rcToggleMode(){
  _rcSetMode(_rcMode==='voice'?'slon':'voice');
  // Как в Telegram: тап только переключает режим — подсказываем, как записывать
  toast(_rcMode==='slon'?'📹 Кружок — удерживай кнопку для записи':'🎙️ Голосовое — удерживай кнопку для записи');
  const b=$('voiceRecBtn');
  if(b){b.classList.remove('rc-flip');void b.offsetWidth;b.classList.add('rc-flip');}
}

// Старые точки входа — оставлены для совместимости (горячие клавиши и т.п.)
function startVoiceRec(){_rcSetMode('voice');_rcBegin(true);}
function startSlonRec(){_rcSetMode('slon');_rcBegin(true);}

function _rcInit(){
  const b=$('voiceRecBtn');if(!b||b._rcInit)return;
  b._rcInit=true;
  _rcSetMode(_rcMode);
  b.addEventListener('contextmenu',e=>e.preventDefault());
  // На телефоне долгое нажатие иначе вызывает выделение/лупу/меню и обрывает жест
  b.addEventListener('touchstart',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
  b.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    e.preventDefault();
    try{b.setPointerCapture(e.pointerId);}catch(_){}
    // Запись зафиксирована — кнопка работает как «отправить»
    if(_rec&&_rec.locked){_rcPress={x:e.clientX,y:e.clientY,send:true};return;}
    if(_rec)return;
    _rcPress={x:e.clientX,y:e.clientY,timer:setTimeout(()=>{
      if(!_rcPress)return;
      _rcPress.timer=null;_rcPress.holding=true;
      _rcBegin(false);
    },RC_HOLD_MS)};
  });
  b.addEventListener('pointermove',e=>{
    if(!_rcPress||!_rcPress.holding||!_rec||_rec.locked)return;
    const dy=Math.max(0,_rcPress.y-e.clientY),dx=Math.max(0,_rcPress.x-e.clientX);
    _rcDrag(dy,dx);
    if(dy>=RC_LOCK_DY)_rcLock();
    else if(dx>=RC_CANCEL_DX){_rcPress=null;_rcCancel();}
  });
  const up=()=>{
    const p=_rcPress;_rcPress=null;
    if(!p)return;
    if(p.send){_rcStop(true);return;}
    if(p.timer){clearTimeout(p.timer);_rcToggleMode();return;} // короткий тап
    if(!_rec)return;
    if(_rec.locked)return;                  // зафиксировали свайпом — палец можно убрать
    if(!_rec.mr){_rec.releasedEarly=true;return;} // ещё ждём доступ к микрофону
    _rcStop(true);
  };
  b.addEventListener('pointerup',up);
  // Браузер забрал жест (скролл и т.п.) — не теряем запись, а фиксируем её
  b.addEventListener('pointercancel',()=>{
    const p=_rcPress;_rcPress=null;
    if(p&&p.timer){clearTimeout(p.timer);return;}
    if(_rec&&!_rec.locked)_rcLock();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&_rec){e.preventDefault();_rcCancel();}});
}

// Подъём значка при свайпе вверх и сдвиг при свайпе влево
function _rcDrag(dy,dx){
  const w=$('inpWrap');if(!w)return;
  const k=Math.min(1,dy/RC_LOCK_DY);
  w.style.setProperty('--rc-lift',(-Math.min(dy,RC_LOCK_DY))+'px');
  w.style.setProperty('--rc-lock-k',k.toFixed(3));
  w.style.setProperty('--rc-shift',(-Math.min(dx,RC_CANCEL_DX)*.5)+'px');
}

async function _rcBegin(locked){
  if(_rec)return;
  if(activeChat==='ai'){toast(_rcMode==='slon'?'Слонкружки недоступны с ИИ':'Голосовые недоступны с ИИ');return;}
  if(!activeChat){return;}
  const mode=_rcMode;
  _rec={mode,chat:activeChat,locked:!!locked,paused:false,acc:0,t0:0,levels:[],mr:null,stream:null};
  const me=_rec;
  _rcShowBar(true);
  let stream=null;
  try{
    stream=mode==='slon'
      ?await navigator.mediaDevices.getUserMedia({audio:RC_AUDIO,video:{facingMode:'user',width:{ideal:480},height:{ideal:480}}})
        .catch(()=>navigator.mediaDevices.getUserMedia({audio:true,video:true}))
      :await navigator.mediaDevices.getUserMedia({audio:RC_AUDIO}).catch(()=>navigator.mediaDevices.getUserMedia({audio:true}));
  }catch(e){
    if(_rec===me){_rec=null;_rcShowBar(false);}
    console.warn('rec getUserMedia:',e);
    const why=e&&e.name==='NotAllowedError'?'доступ запрещён — разреши в настройках сайта'
      :e&&e.name==='NotFoundError'?'устройство не найдено'
      :e&&e.name==='NotReadableError'?'устройство занято другой программой'
      :(e&&e.message)||'ошибка';
    toast((mode==='slon'?'Камера: ':'Микрофон: ')+why);
    return;
  }
  if(!stream.getAudioTracks().length){stream.getTracks().forEach(t=>t.stop());if(_rec===me){_rec=null;_rcShowBar(false);}toast('Микрофон не найден');return;}
  // Пока спрашивали разрешение, запись отменили или палец уже отпустили
  if(_rec!==me||me.releasedEarly){
    stream.getTracks().forEach(t=>t.stop());
    if(_rec===me){_rec=null;_rcShowBar(false);toast('Удерживай кнопку, чтобы записать');}
    return;
  }
  me.stream=stream;
  const types=mode==='slon'
    ?['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4;codecs=h264,aac','video/mp4']
    :['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];
  let mime='';
  for(const m of types){try{if(MediaRecorder.isTypeSupported(m)){mime=m;break;}}catch(e){}}
  me.mime=mime||(mode==='slon'?'video/webm':'audio/webm');
  let mr;
  try{mr=new MediaRecorder(stream,mime?{mimeType:mime}:{});}
  catch(e){try{mr=new MediaRecorder(stream);}catch(e2){console.warn('MediaRecorder:',e2);stream.getTracks().forEach(t=>t.stop());_rec=null;_rcShowBar(false);toast('Запись не поддерживается браузером');return;}}
  mr.onerror=ev=>{console.warn('MediaRecorder error:',ev.error||ev);toast('Ошибка записи: '+(ev.error?.name||'сбой устройства'));if(_rec===me)_rcCancel();};
  me.chunks=[];
  mr.ondataavailable=e=>{if(e.data&&e.data.size>0)me.chunks.push(e.data);};
  mr.start(200);
  me.mr=mr;mediaRecorder=mr;recMode=mode;
  me.t0=performance.now();
  _rcStartMeter(me);
  if(mode==='slon')_rcShowCircle(stream);
  $('inpWrap')?.classList.add('rc-live');
}

// Уровень голоса: AnalyserNode (в динамики ничего не идёт — только анализ)
function _rcStartMeter(me){
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    me.ctx=new Ctx();
    const src=me.ctx.createMediaStreamSource(me.stream);
    me.an=me.ctx.createAnalyser();me.an.fftSize=1024;me.an.smoothingTimeConstant=.3;
    src.connect(me.an);
    me.buf=new Float32Array(me.an.fftSize);
  }catch(e){me.an=null;}
  const cv=$('rcWave');
  const acc=getComputedStyle($('inpWrap')||document.body).getPropertyValue('--accent').trim()||'#3390ec';
  // setInterval, а не rAF: в фоновой вкладке rAF замирает, а запись и лимит должны идти
  let lastPush=0;
  const tick=()=>{
    if(_rec!==me){clearInterval(me.iv);return;}
    const now=performance.now();
    const el=_rcElapsed();
    const t=$('rcTime');if(t)t.textContent=_rcFmt(el,true);
    if(me.mode==='slon'){const r=$('rcCircleRing');if(r)r.style.strokeDashoffset=String(1-Math.min(1,el/1000/RC_MAX.slon));}
    if(!me.paused&&now-lastPush>=70){
      lastPush=now;
      let lvl=0;
      if(me.an){
        me.an.getFloatTimeDomainData(me.buf);
        let s=0;for(let i=0;i<me.buf.length;i++)s+=me.buf[i]*me.buf[i];
        lvl=Math.min(1,Math.sqrt(Math.sqrt(s/me.buf.length))*1.6);
      }
      me.levels.push(lvl);
      $('inpWrap')?.style.setProperty('--rc-lvl',lvl.toFixed(3));
    }
    if(cv)_rcDrawWave(cv,me.levels,acc);
    if(el/1000>=RC_MAX[me.mode]){_rcStop(true);return;}
  };
  me.iv=setInterval(tick,33);
}
// «Бегущая дорожка»: столбики заполняют плашку слева направо, дальше едут влево
function _rcDrawWave(cv,levels,color){
  const dpr=window.devicePixelRatio||1;
  const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
  const g=cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  g.fillStyle=color;
  const bw=2,gap=2,step=bw+gap,max=Math.floor(w/step);
  const from=Math.max(0,levels.length-max);
  for(let i=from;i<levels.length;i++){
    const bh=Math.max(2,Math.round(levels[i]*h));
    const x=(i-from)*step,y=(h-bh)/2;
    if(g.roundRect){g.beginPath();g.roundRect(x,y,bw,bh,1);g.fill();}
    else g.fillRect(x,y,bw,bh);
  }
}

function _rcLock(){
  if(!_rec||_rec.locked)return;
  _rec.locked=true;
  const w=$('inpWrap');if(!w)return;
  w.classList.add('rc-locked');
  _rcDrag(0,0);
}

function _rcTogglePause(){
  const me=_rec;if(!me||!me.mr)return;
  if(me.paused){
    try{me.mr.resume();}catch(e){}
    me.paused=false;me.t0=performance.now();
  }else{
    try{me.mr.pause();}catch(e){}
    me.acc+=performance.now()-me.t0;me.paused=true;
    $('inpWrap')?.style.setProperty('--rc-lvl','0');
  }
  if(me.paused)_rcLock();
  $('inpWrap')?.classList.toggle('rc-paused',me.paused);
}

function _rcCleanup(me){
  if(!me)return;
  clearInterval(me.iv);
  try{me.stream?.getTracks().forEach(t=>t.stop());}catch(e){}
  try{me.ctx?.close();}catch(e){}
  if(mediaRecorder===me.mr)mediaRecorder=null;
  _rcHideCircle();
  _slonStream=null;
}

function _rcCancel(){
  const me=_rec;if(!me)return;
  _rec=null;
  if(me.mr){me.mr.ondataavailable=null;try{me.mr.stop();}catch(e){}}
  _rcCleanup(me);
  _rcShowBar(false,true);
}
function cancelRec(){_rcCancel();}

function _rcStop(send){
  const me=_rec;if(!me)return;
  if(!send){_rcCancel();return;}
  const ms=_rcElapsed();
  _rec=null;
  _rcShowBar(false);
  if(!me.mr){_rcCleanup(me);return;}
  if(ms<500){ // случайный тычок — такое не отправляем
    me.mr.ondataavailable=null;try{me.mr.stop();}catch(e){}
    _rcCleanup(me);toast('Удерживай кнопку, чтобы записать');return;
  }
  if(activeChat!==me.chat){me.mr.ondataavailable=null;try{me.mr.stop();}catch(e){}_rcCleanup(me);toast('Запись отменена — чат сменился');return;}
  const dur=Math.max(1,Math.round(ms/1000));
  const wave=_rcWaveOf(me.levels,48);
  me.mr.onstop=()=>{
    if(!me.chunks.length){toast('Запись пустая — микрофон не отдал звук');return;}
    const type=me.chunks[0].type||me.mime;
    const blob=new Blob(me.chunks,{type});
    if(me.mode==='slon'){
      sendSlonMsg(URL.createObjectURL(blob),dur,type,true);
    }else{
      const fr=new FileReader();
      fr.onload=e=>sendVoiceMsg(e.target.result,dur,type,wave);
      fr.readAsDataURL(blob);
    }
  };
  try{if(me.paused)me.mr.resume();}catch(e){}
  try{me.mr.stop();}catch(e){}
  _rcCleanup(me);
}
function stopAndSendRec(){_rcStop(true);}

// Уровни записи → N столбиков 0..31 (как waveform в Telegram)
function _rcWaveOf(levels,n){
  if(!levels.length)return null;
  const out=[];
  for(let i=0;i<n;i++){
    const a=Math.floor(i*levels.length/n),b=Math.max(a+1,Math.floor((i+1)*levels.length/n));
    // среднее по отрезку — у пиков по максимуму волна выходит «забитой»
    let m=0,k=0;for(let j=a;j<b&&j<levels.length;j++){m+=levels[j];k++;}
    out.push(k?m/k:0);
  }
  const top=Math.max(...out)||1;
  return out.map(v=>Math.round(v/top*31));
}

// Плавный переход «Сообщение…» → бар записи и обратно
function _rcShowBar(on,cancelled){
  const w=$('inpWrap');if(!w)return;
  if(on){
    const cv=$('rcWave');if(cv){const g=cv.getContext('2d');g&&g.clearRect(0,0,cv.width,cv.height);}
    const t=$('rcTime');if(t)t.textContent='0:00,00';
    w.classList.remove('rc-out','rc-cancel','rc-locked','rc-paused','rc-live');
    w.classList.toggle('rc-slon',_rcMode==='slon');
    w.classList.add('recording');
    _rcDrag(0,0);
  }else{
    if(!w.classList.contains('recording'))return;
    w.classList.remove('recording','rc-live','rc-locked','rc-paused');
    w.classList.add('rc-out');
    if(cancelled)w.classList.add('rc-cancel');
    _rcDrag(0,0);
    w.style.setProperty('--rc-lvl','0');
    clearTimeout(w._rcOutT);
    w._rcOutT=setTimeout(()=>w.classList.remove('rc-out','rc-cancel'),420);
  }
}

// Кружок-превью с кольцом прогресса по центру чата
function _rcShowCircle(stream){
  _slonFacing='user';_slonStream=stream;
  const c=$('rcCircle'),v=$('rcCircleVid');if(!c||!v)return;
  v.srcObject=stream;v.play().catch(()=>{});
  const flip=$('slonFlipBtn');
  if(flip)flip.style.display=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)?'flex':'none';
  c.classList.add('show');
}
function _rcHideCircle(){
  const c=$('rcCircle'),v=$('rcCircleVid');
  if(c)c.classList.remove('show');
  if(v)setTimeout(()=>{if(!c?.classList.contains('show'))v.srcObject=null;},300);
}

function sendVoiceMsg(dataUrl,dur,mimeType,wave){
  const mid='vm'+Date.now();
  const ts=Date.now();
  _saveMediaToIdb(mid,'voice',dataUrl).catch(()=>{});
  const msg={id:mid,sender:'me',ts,time:fmtTime(ts),voiceData:'idb:'+mid+':voice',voiceDur:dur};
  if(wave)msg.voiceWave=wave;
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

// ── Пузырь голосового (как в Telegram): кнопка play, волна, длительность
// с точкой «не прослушано», кнопка расшифровки →A ──
const VB_PLAY='<svg viewBox="0 0 24 24"><path d="M8.5 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4a1 1 0 0 0 0-1.8l-10-6.4c-.7-.4-1.6.1-1.6.9z"/></svg>';
const VB_PAUSE='<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1.3"/><rect x="13.5" y="5" width="4" height="14" rx="1.3"/></svg>';
const VB_TR='<svg class="vb-tr-ic" viewBox="0 0 24 24"><path d="M2 12h7.6M6.4 8.3 10 12l-3.6 3.7"/><path d="M12.6 19 17 5.2 21.4 19M14.2 14.3h5.6"/></svg>';
const VB_TR_UP='<svg class="vb-tr-ic" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>';
let _vbAudio=null,_vbSaveT=null;
function _vbSaveSoon(){clearTimeout(_vbSaveT);_vbSaveT=setTimeout(()=>{try{saveAll();}catch(e){}},800);}

// Детерминированная «волна» по id — пока настоящая не посчитана
function _vbFakeWave(id,n){
  let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))|0;
  const out=[];
  for(let i=0;i<n;i++){h=(h*1103515245+12345)|0;const r=((h>>>16)&0x7fff)/0x7fff;out.push(Math.round(6+r*20+Math.sin(i*.55)*4));}
  return out;
}
// Настоящая волна из аудио (для входящих и старых сообщений) — считаем один раз
let _vbDecodeQ=Promise.resolve(),_vbDecCtx=null;
function _vbComputeWave(src,n){
  _vbDecodeQ=_vbDecodeQ.then(async()=>{
    const ab=await (await fetch(src)).arrayBuffer();
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!_vbDecCtx)_vbDecCtx=new Ctx();
    const buf=await new Promise((res,rej)=>{const p=_vbDecCtx.decodeAudioData(ab,res,rej);if(p&&p.catch)p.catch(rej);});
    const d=buf.getChannelData(0),out=[],step=Math.floor(d.length/n)||1;
    for(let i=0;i<n;i++){let m=0;for(let j=i*step;j<(i+1)*step&&j<d.length;j++){const v=Math.abs(d[j]);if(v>m)m=v;}out.push(m);}
    const top=Math.max(...out)||1;
    return {wave:out.map(v=>Math.round(Math.sqrt(v/top)*31)),dur:buf.duration};
  }).catch(()=>null);
  return _vbDecodeQ;
}

function renderVoiceBub(msg,isOut){
  const N=48;
  const div=document.createElement('div');
  div.className='voice-bub'+(msg.voicePlayed?'':' vb-unplayed');
  const durOf=()=>Math.round(msg.voiceDur||0);
  div.innerHTML=`
    <button class="vb-play" title="Воспроизвести">${VB_PLAY}</button>
    <div class="vb-main">
      <div class="vb-wave"></div>
      <div class="vb-meta"><span class="vb-dur">${_rcFmt(durOf()*1000)}</span><i class="vb-dot"></i></div>
    </div>
    <button class="vb-tr" title="Расшифровать">${VB_TR}</button>
    <div class="vb-text"></div>`;
  const waveEl=div.querySelector('.vb-wave'),durEl=div.querySelector('.vb-dur');
  const playBtn=div.querySelector('.vb-play'),trBtn=div.querySelector('.vb-tr'),txtEl=div.querySelector('.vb-text');
  const drawWave=w=>{
    waveEl.innerHTML=w.map(v=>`<i style="height:${Math.max(2,Math.round(v/31*20))}px"></i>`).join('');
  };
  drawWave(msg.voiceWave&&msg.voiceWave.length?msg.voiceWave:_vbFakeWave(msg.id,N));
  if(msg.voiceText){txtEl.textContent=msg.voiceText;div.classList.add('vb-tr-open');trBtn.innerHTML=VB_TR_UP;}

  async function _getAudioSrc(){
    const src=msg.voiceData;
    if(!src)return null;
    if(src.startsWith('idb:')){const p=src.split(':');return await _loadMediaFromIdb(p[1],p[2]||'voice');}
    return src;
  }
  // Нет настоящей волны или длительности — досчитываем из самого аудио
  if(!(msg.voiceWave&&msg.voiceWave.length)||!msg.voiceDur){
    _getAudioSrc().then(src=>src&&_vbComputeWave(src,N)).then(r=>{
      if(!r)return;
      msg.voiceWave=r.wave;drawWave(r.wave);
      if(!msg.voiceDur&&isFinite(r.dur)){msg.voiceDur=Math.round(r.dur);durEl.textContent=_rcFmt(durOf()*1000);}
      _vbSaveSoon();
    });
  }

  let audio=null;
  const setProg=p=>{
    const bars=waveEl.children,n=Math.floor(p*bars.length);
    for(let i=0;i<bars.length;i++)bars[i].classList.toggle('on',i<n);
  };
  const setPlaying=on=>{playBtn.innerHTML=on?VB_PAUSE:VB_PLAY;div.classList.toggle('vb-playing',on);};
  async function ensureAudio(){
    if(audio)return audio;
    const src=await _getAudioSrc();
    if(!src){toast('Аудио недоступно');return null;}
    audio=new Audio(src);
    audio.onended=()=>{setPlaying(false);setProg(0);durEl.textContent=_rcFmt(durOf()*1000);};
    audio.onpause=()=>setPlaying(false);
    audio.onplay=()=>setPlaying(true);
    audio.ontimeupdate=()=>{
      const d=isFinite(audio.duration)?audio.duration:durOf();
      setProg(d?audio.currentTime/d:0);
      durEl.textContent=_rcFmt(audio.currentTime*1000);
    };
    return audio;
  }
  playBtn.onclick=async()=>{
    const a=await ensureAudio();if(!a)return;
    if(!a.paused){a.pause();return;}
    // Одновременно играет только одно голосовое
    if(_vbAudio&&_vbAudio!==a)_vbAudio.pause();
    _vbAudio=a;
    a.play().catch(e=>toast('Ошибка воспроизведения: '+e.message));
    if(!msg.voicePlayed){msg.voicePlayed=true;div.classList.remove('vb-unplayed');_vbSaveSoon();}
  };
  // Перемотка кликом по волне
  waveEl.onclick=async e=>{
    const a=await ensureAudio();if(!a)return;
    const r=waveEl.getBoundingClientRect(),p=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));
    const seek=()=>{const d=isFinite(a.duration)?a.duration:durOf();a.currentTime=p*d;setProg(p);};
    if(a.readyState>=1)seek();else a.addEventListener('loadedmetadata',seek,{once:true});
    if(a.paused)playBtn.onclick();
  };
  trBtn.onclick=()=>_vbTranscribe(msg,div,trBtn,txtEl,_getAudioSrc);
  return div;
}

// ════════════════════════════════════════
// ── РАСШИФРОВКА ГОЛОСОВЫХ И КРУЖКОВ (→A) ──
// Whisper прямо в браузере (transformers.js), без токенов и серверов:
// модель ~80 МБ качается один раз и дальше лежит в кэше браузера.
// Считаем в Web Worker, чтобы интерфейс не подвисал.
// ════════════════════════════════════════
const ASR_LIB='https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
const ASR_MODEL='onnx-community/whisper-base';
let _asrWorker=null,_asrSeq=0;
const _asrJobs={};
let _asrLoadPct=null;   // null — модель готова/не грузится; число — прогресс первой загрузки
function _asrGetWorker(){
  if(_asrWorker)return _asrWorker;
  const code=`
    let asr=null,loading=null;const files={};
    async function load(){
      if(asr)return asr;
      if(!loading)loading=(async()=>{
        const {pipeline}=await import('${ASR_LIB}');
        asr=await pipeline('automatic-speech-recognition','${ASR_MODEL}',{progress_callback:p=>{
          if(p.file&&p.total){files[p.file]=[p.loaded||0,p.total];
            let l=0,t=0;for(const k in files){l+=files[k][0];t+=files[k][1];}
            postMessage({type:'progress',pct:Math.round(l/t*100)});}
        }});
        postMessage({type:'ready'});
        return asr;
      })();
      return loading;
    }
    onmessage=async e=>{
      const {id,audio,language}=e.data;
      try{
        const a=await load();
        const r=await a(audio,{language,task:'transcribe',chunk_length_s:30,stride_length_s:5});
        postMessage({type:'done',id,text:String(r.text||'')});
      }catch(err){loading=null;postMessage({type:'error',id,error:String(err&&err.message||err)});}
    };`;
  _asrWorker=new Worker(URL.createObjectURL(new Blob([code],{type:'text/javascript'})),{type:'module'});
  _asrWorker.onmessage=e=>{
    const d=e.data;
    if(d.type==='progress'){_asrLoadPct=d.pct;Object.values(_asrJobs).forEach(j=>j.onProg&&j.onProg(d.pct));return;}
    if(d.type==='ready'){_asrLoadPct=null;return;}
    const j=_asrJobs[d.id];if(!j)return;
    delete _asrJobs[d.id];
    d.type==='done'?j.res(d.text):j.rej(new Error(d.error));
  };
  _asrWorker.onerror=e=>{
    Object.values(_asrJobs).forEach(j=>j.rej(new Error(e.message||'worker')));
    for(const k in _asrJobs)delete _asrJobs[k];
    _asrWorker=null;
  };
  return _asrWorker;
}
// Аудио (в т.ч. дорожка из видео кружка) → моно 16 кГц, как нужно Whisper
async function _asrDecode(blob){
  const Ctx=window.AudioContext||window.webkitAudioContext;
  const ctx=new Ctx({sampleRate:16000});
  try{
    const ab=await blob.arrayBuffer();
    const buf=await new Promise((res,rej)=>{const p=ctx.decodeAudioData(ab,res,rej);if(p&&p.catch)p.catch(rej);});
    const n=buf.numberOfChannels,out=new Float32Array(buf.length);
    for(let c=0;c<n;c++){const d=buf.getChannelData(c);for(let i=0;i<d.length;i++)out[i]+=d[i]/n;}
    return out;
  }finally{try{ctx.close();}catch(e){}}
}
// Whisper на тишине «слышит» титры с YouTube — вычищаем такие галлюцинации
// (в живой речи таких маркеров не бывает — если есть, выбрасываем весь результат)
const ASR_JUNK=/субтитр|корректор|синецк|егоров|dimatorzok|amara\.org|продолжение следует|спасибо за просмотр/i;
async function _asrTranscribe(blob,onProg){
  const audio=await _asrDecode(blob);
  let peak=0;for(let i=0;i<audio.length;i++){const v=Math.abs(audio[i]);if(v>peak)peak=v;}
  if(peak<0.02)return '';                      // тишина — нечего расшифровывать
  const id=++_asrSeq;
  const lang=(typeof SLON_LANG!=='undefined'&&SLON_LANG==='en')?'english':'russian';
  const p=new Promise((res,rej)=>{_asrJobs[id]={res,rej,onProg};});
  if(_asrLoadPct!=null&&onProg)onProg(_asrLoadPct);
  _asrGetWorker().postMessage({id,audio,language:lang},[audio.buffer]);
  const text=await p;
  const t=text.replace(/\s{2,}/g,' ').trim();
  return ASR_JUNK.test(t)?'':t;
}

// Кнопка →A у голосового и кружка: раскрыть/свернуть текст, результат кешируется в сообщении
async function _vbTranscribe(msg,div,btn,txtEl,getSrc){
  if(div.classList.contains('vb-tr-open')){
    div.classList.remove('vb-tr-open');btn.innerHTML=VB_TR;return;
  }
  if(msg.voiceText){txtEl.textContent=msg.voiceText;div.classList.add('vb-tr-open');btn.innerHTML=VB_TR_UP;return;}
  if(div.classList.contains('vb-tr-busy'))return;
  div.classList.add('vb-tr-busy','vb-tr-open');txtEl.textContent='';
  try{
    const src=await getSrc();if(!src)throw new Error('нет записи');
    const blob=await (await fetch(src)).blob();
    const text=await _asrTranscribe(blob,pct=>{
      if(div.classList.contains('vb-tr-busy'))txtEl.dataset.load='Загружаю распознавание речи… '+pct+'%';
    });
    delete txtEl.dataset.load;
    msg.voiceText=text||'Речь не распознана';
    txtEl.textContent=msg.voiceText;btn.innerHTML=VB_TR_UP;
    _vbSaveSoon();
  }catch(e){
    delete txtEl.dataset.load;
    div.classList.remove('vb-tr-open');
    console.warn('transcribe:',e);
    toast('Не удалось расшифровать: '+e.message);
  }finally{div.classList.remove('vb-tr-busy');}
}

// ── Слонкружок в переписке (как кружок в Telegram) + уши и хобот ──
// Всё рисуется в одной коробке 146×127 «единиц», где сам круг — 100 единиц:
// уши и хобот целиком помещаются внутрь, ничего не обрезается.
const SC_DECO=`<svg class="sc-deco" viewBox="0 0 146 127" aria-hidden="true">
  <defs>
    <linearGradient id="scSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9c5d3"/><stop offset="1" stop-color="#8e9cae"/></linearGradient>
    <radialGradient id="scInner" cx=".45" cy=".45" r=".7"><stop offset="0" stop-color="#ffd1dc"/><stop offset="1" stop-color="#ee9fb4"/></radialGradient>
  </defs>
  <g class="sc-ear sc-ear-l">
    <path d="M45 15C31 1 7 3 2.5 23.5-.5 42 4.5 62 14.5 74.5 22.5 84 33 88.5 39 84Z" fill="url(#scSkin)" stroke="#66748a" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M39 22C29 11 13 13 9.5 28 7 42 11.5 58 19.5 68 25 74.5 31.5 76.5 35 72Z" fill="url(#scInner)"/>
    <path d="M12 36c2-6 6-10 12-11" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>
  </g>
  <g class="sc-ear sc-ear-r"><g transform="translate(146 0) scale(-1 1)">
    <path d="M45 15C31 1 7 3 2.5 23.5-.5 42 4.5 62 14.5 74.5 22.5 84 33 88.5 39 84Z" fill="url(#scSkin)" stroke="#66748a" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M39 22C29 11 13 13 9.5 28 7 42 11.5 58 19.5 68 25 74.5 31.5 76.5 35 72Z" fill="url(#scInner)"/>
    <path d="M12 36c2-6 6-10 12-11" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>
  </g></g>
  <g class="sc-trunk">
    <path d="M73 92C72.5 106 74 115.5 81 118.5 86.5 120.5 90.5 116 88.5 111.5" fill="none" stroke="#66748a" stroke-width="13" stroke-linecap="round"/>
    <path d="M73 92C72.5 106 74 115.5 81 118.5 86.5 120.5 90.5 116 88.5 111.5" fill="none" stroke="url(#scSkin)" stroke-width="10" stroke-linecap="round"/>
    <path d="M69.5 104.5h7M70.5 110.5l6.5-1.2M75 116l5-3.4" fill="none" stroke="#66748a" stroke-width="1" stroke-linecap="round"/>
    <ellipse cx="88.6" cy="111.2" rx="2.1" ry="1.4" fill="#4d5869" transform="rotate(-30 88.6 111.2)"/>
  </g>
</svg>`;
const SC_PLAY='<svg viewBox="0 0 24 24"><path d="M8.5 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4a1 1 0 0 0 0-1.8l-10-6.4c-.7-.4-1.6.1-1.6.9z"/></svg>';
function _scFmt(s){s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
let _scPlaying=null;   // кружок, который сейчас играет со звуком
const _scIO=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{
  const v=e.target;if(v._scLoud)return;
  if(e.isIntersecting){v.muted=true;v.play().catch(()=>{});}else v.pause();
}),{threshold:.35}):null;

function renderSlonBub(msg,isOut){
  if(isOut===undefined)isOut=msg.sender==='me';
  const dur=msg.slonDur||0;
  const wrap=document.createElement('div');
  wrap.className='sc-bub'+(isOut?' sc-out':' sc-inc')+(msg.slonPlayed?'':' vb-unplayed');
  const time=(msg.time||'')+(isOut?' <span class="sc-ticks">✓✓</span>':'');
  wrap.innerHTML=`
    <div class="sc-box">
      ${SC_DECO}
      <div class="sc-face">
        <video playsinline muted loop preload="metadata"></video>
        <svg class="sc-prog" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48.6" pathLength="1"/></svg>
        <div class="sc-state">${SC_PLAY}</div>
      </div>
      <button class="sc-tr vb-tr" title="Расшифровать">${VB_TR}</button>
      <span class="sc-pill sc-dur"><span class="sc-dur-t">${_scFmt(dur)}</span><i class="vb-dot"></i></span>
      <span class="sc-pill sc-time">${time}</span>
    </div>
    <div class="sc-text vb-text"></div>`;
  const vid=wrap.querySelector('video'),face=wrap.querySelector('.sc-face');
  const ring=wrap.querySelector('.sc-prog circle'),durT=wrap.querySelector('.sc-dur-t');
  const trBtn=wrap.querySelector('.sc-tr'),txtEl=wrap.querySelector('.sc-text');
  if(msg.voiceText){txtEl.textContent=msg.voiceText;wrap.classList.add('vb-tr-open');trBtn.innerHTML=VB_TR_UP;}

  let srcUrl=null;
  async function _loadSrc(){
    const src=msg.slonData;
    if(!src||src==='null'){wrap.classList.add('sc-missing');return null;}
    try{
      if(src.startsWith('idb:')){
        const p=src.split(':');
        srcUrl=await _loadMediaFromIdb(p[1],p[2]||'slon');
      }else if(src.startsWith('blob:')){
        srcUrl=src;_saveMediaToIdb(msg.id,'slon',src).catch(()=>{});
      }else if(src.startsWith('data:')){
        const parts=src.split(',');
        const mime=parts[0].match(/:(.*?);/)?.[1]||'video/webm';
        const bytes=atob(parts[1]),buf=new Uint8Array(bytes.length);
        for(let i=0;i<bytes.length;i++)buf[i]=bytes.charCodeAt(i);
        const blob=new Blob([buf],{type:mime});
        srcUrl=URL.createObjectURL(blob);
        _idb.put(msg.id+':slon',blob).catch(()=>{});
      }else srcUrl=src;
    }catch(e){console.warn('renderSlonBub load error:',e);}
    if(!srcUrl){wrap.classList.add('sc-missing');return null;}
    vid.src=srcUrl;
    // Беззвучный повтор, пока кружок на экране — как в Telegram
    if(_scIO)_scIO.observe(vid);else{vid.play().catch(()=>{});}
    return srcUrl;
  }
  const ready=_loadSrc();
  vid.addEventListener('loadedmetadata',()=>{
    if(!msg.slonDur&&isFinite(vid.duration)){msg.slonDur=Math.round(vid.duration);durT.textContent=_scFmt(msg.slonDur);_vbSaveSoon();}
  });

  const stopLoud=()=>{
    vid._scLoud=false;wrap.classList.remove('sc-loud','sc-paused');
    vid.muted=true;vid.loop=true;ring.style.strokeDashoffset='1';
    durT.textContent=_scFmt(msg.slonDur||vid.duration||0);
    if(_scPlaying===stopLoud)_scPlaying=null;
    vid.play().catch(()=>{});
  };
  vid.addEventListener('timeupdate',()=>{
    if(!vid._scLoud)return;
    const d=isFinite(vid.duration)?vid.duration:(msg.slonDur||1);
    ring.style.strokeDashoffset=String(1-Math.min(1,vid.currentTime/d));
    durT.textContent=_scFmt(vid.currentTime);
  });
  vid.addEventListener('ended',()=>{if(vid._scLoud)stopLoud();});

  // Тап: запуск со звуком с начала; ещё тап — пауза/продолжить
  face.onclick=async()=>{
    await ready;if(!srcUrl){toast('Видео недоступно');return;}
    if(!vid._scLoud){
      if(_scPlaying)_scPlaying();
      _scPlaying=stopLoud;
      vid._scLoud=true;vid.loop=false;vid.currentTime=0;vid.muted=false;
      wrap.classList.add('sc-loud');
      vid.play().catch(()=>{vid.muted=true;vid.play().catch(()=>{});});
      if(!msg.slonPlayed){msg.slonPlayed=true;wrap.classList.remove('vb-unplayed');_vbSaveSoon();}
      if(_vbAudio&&!_vbAudio.paused)_vbAudio.pause();
    }else if(vid.paused){vid.play().catch(()=>{});wrap.classList.remove('sc-paused');}
    else{vid.pause();wrap.classList.add('sc-paused');}
  };
  trBtn.onclick=()=>_vbTranscribe(msg,wrap,trBtn,txtEl,async()=>{await ready;return srcUrl;});
  return wrap;
}

async function flipSlonCamera(){
  if(!_slonStream||!_rec||_rec.mode!=='slon')return;
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
  const preview=$('rcCircleVid');
  if(preview){
    preview.srcObject=_slonStream||newStream;
    preview.play().catch(()=>{});
  }
  toast(newFacing==='environment'?'📷 Задняя камера':'🤳 Фронтальная');
}

function icoSvgPlay(){return '<svg viewBox="0 0 24 24" style="width:1em;height:1em;fill:currentColor"><path d="M8 5v14l11-7z"/></svg>';}

function icoSvgStop(){return '<svg viewBox="0 0 24 24" style="width:1em;height:1em;fill:currentColor"><path d="M6 6h12v12H6z"/></svg>';}

// ── Patch appendMsg for voice+slon ──
const _origAppendMsg=appendMsg;
appendMsg=function(msg,container){
  if(msg.voiceData){
    const c=container||$('msgs');
    if(msg.sender==='system'){_origAppendMsg(msg,c);return;}
    const isOut=msg.sender==='me';
    const wrap=document.createElement('div');wrap.className='msg '+(isOut?'out':'inc');
    const av=document.createElement('div');av.className='msg-av';
    if(isOut){if(myAvatar){const i=document.createElement('img');i.src=myAvatar;av.appendChild(i);}else av.textContent='😎';}
    else{const src=msg.avatar||peerAvatars[msg.senderId]||null;if(src){const i=document.createElement('img');i.src=src;av.appendChild(i);}else av.innerHTML=_avHtml(msg.senderId||msg.name,msg.name||'?');}
    const body=document.createElement('div');body.className='msg-body';
    if(!isOut&&msg.name){
    const w=document.createElement('div');w.className='msg-who';
    const hasPrem=msg.senderId&&peerPremium[msg.senderId];
    // ⭐ значок Premium + верифицированный SLON канал
    const badge=hasPrem?' <span style="font-size:10px;vertical-align:middle;opacity:.9" title="SLON Premium">⭐</span>':'';
    const elephantBadge=(msg.senderId&&peerElephantBadges[msg.senderId])?' <span style="font-size:10px;vertical-align:middle;opacity:.85" title="Слонгалочка">🐘</span>':'';
    w.innerHTML=esc(msg.name)+elephantBadge+badge;
    body.appendChild(w);
  }
    body.appendChild(renderVoiceBub(msg,isOut));
    const t=document.createElement('div');t.className='msg-time';t.textContent=msg.time+(isOut?' ✓✓':'');
    body.appendChild(t);wrap.appendChild(av);wrap.appendChild(body);c.appendChild(wrap);
    return;
  }
  if(msg.slonData){
    const c=container||$('msgs');
    if(msg.sender==='system'){_origAppendMsg(msg,c);return;}
    const isOut=msg.sender==='me';
    const wrap=document.createElement('div');wrap.className='msg '+(isOut?'out':'inc');
    const av=document.createElement('div');av.className='msg-av';
    if(isOut){if(myAvatar){const i=document.createElement('img');i.src=myAvatar;av.appendChild(i);}else av.textContent='😎';}
    else{const src=msg.avatar||peerAvatars[msg.senderId]||null;if(src){const i=document.createElement('img');i.src=src;av.appendChild(i);}else av.innerHTML=_avHtml(msg.senderId||msg.name,msg.name||'?');}
    const body=document.createElement('div');body.className='msg-body';
    if(!isOut&&msg.name){
    const w=document.createElement('div');w.className='msg-who';
    const hasPrem=msg.senderId&&peerPremium[msg.senderId];
    // ⭐ значок Premium + верифицированный SLON канал
    const badge=hasPrem?' <span style="font-size:10px;vertical-align:middle;opacity:.9" title="SLON Premium">⭐</span>':'';
    const elephantBadge=(msg.senderId&&peerElephantBadges[msg.senderId])?' <span style="font-size:10px;vertical-align:middle;opacity:.85" title="Слонгалочка">🐘</span>':'';
    w.innerHTML=esc(msg.name)+elephantBadge+badge;
    body.appendChild(w);
  }
    body.appendChild(renderSlonBub(msg,isOut));
    wrap.classList.add('msg-slon');
    wrap.appendChild(av);wrap.appendChild(body);c.appendChild(wrap);
    return;
  }
  _origAppendMsg(msg,container);
};

// Кнопка записи в поле ввода — вешаем обработчики удержания/свайпа
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_rcInit);else _rcInit();
