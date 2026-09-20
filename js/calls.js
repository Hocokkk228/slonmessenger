function showPermRequest(isVideo,onGranted,onDenied){
  if(!hasMediaDevices){toast('WebRTC не поддерживается');onDenied&&onDenied(new Error('no_webrtc'));return;}
  _permIsVideo=isVideo;_permResolve={onGranted,onDenied};
  $('permIcon').innerHTML=isVideo?icoSvg('i-video'):icoSvg('i-mic');
  $('permTitle').textContent=isVideo?'Нужен доступ к камере и микрофону':'Нужен доступ к микрофону';
  $('permDesc').textContent=isVideo?'Для видеозвонка разреши доступ.':'Для голосового звонка разреши доступ к микрофону.';
  $('permAllowBtn').innerHTML=isVideo?`${icoSvg('i-video')} Разрешить`:`${icoSvg('i-mic')} Разрешить`;
  $('permDeniedHint').style.display='none';
  $('permOverlay').classList.add('show');
}

// ── Ограничения качества видео ──
// Без них камера/экран отдаются в максимальном разрешении (вплоть до 4K),
// канал захлёбывается и получается «1 кадр в 2 секунды» либо чёрный экран.
const CAM_MAX={w:1280,h:720,fps:30};
const SCREEN_MAX={w:1920,h:1080,fps:30};
const CAM_BITRATE=900000;     // ~0.9 Мбит/с на камеру
const SCREEN_BITRATE=2000000; // ~2 Мбит/с на экран

// Видео-констрейнты камеры с лимитами (deviceId/facingMode сохраняем)
function _camConstraints(extra){
  const vc=Object.assign({},extra||{});
  if(selCam&&selCam!=='default')vc.deviceId={ideal:selCam};
  if(!vc.facingMode)vc.facingMode=_camFacing||'user';
  vc.width={ideal:CAM_MAX.w,max:CAM_MAX.w};
  vc.height={ideal:CAM_MAX.h,max:CAM_MAX.h};
  vc.frameRate={ideal:CAM_MAX.fps,max:CAM_MAX.fps};
  return vc;
}
// Констрейнты демонстрации экрана
function _screenConstraints(){
  return {width:{max:SCREEN_MAX.w},height:{max:SCREEN_MAX.h},
    frameRate:{ideal:SCREEN_MAX.fps,max:SCREEN_MAX.fps}};
}
// Ограничиваем битрейт/фпс у отправителя и просим держать плавность,
// иначе браузер шлёт огромный поток и картинка замирает/рассинхронится со звуком
async function _tuneVideoSender(sender,isScreen){
  if(!sender||!sender.getParameters)return;
  try{
    const p=sender.getParameters();
    if(!p.encodings||!p.encodings.length)p.encodings=[{}];
    p.encodings[0].maxBitrate=isScreen?SCREEN_BITRATE:CAM_BITRATE;
    p.encodings[0].maxFramerate=isScreen?SCREEN_MAX.fps:CAM_MAX.fps;
    p.encodings[0].scaleResolutionDownBy=1;
    // плавность важнее детализации — держим 30 кадров
    p.degradationPreference='maintain-framerate';
    await sender.setParameters(p);
  }catch(e){console.warn('tune sender:',e);}
}
// Подсказка кодеку: движение (плавность) вместо статичной детализации
function _hintTrack(track,isScreen){
  try{if(track)track.contentHint=isScreen?'motion':'motion';}catch(e){}
}
// Ограничиваем битрейт звука — меньше нагрузка на канал, меньше рассинхрон с видео
async function _tuneAudioSender(sender){
  if(!sender||!sender.getParameters)return;
  try{
    const p=sender.getParameters();
    if(!p.encodings||!p.encodings.length)p.encodings=[{}];
    p.encodings[0].maxBitrate=64000; // 64 кбит/с — с запасом для речи
    await sender.setParameters(p);
  }catch(e){}
}
// Привести все отправители звонка к ограничениям (звук + видео)
function _tuneAllSenders(pc,isScreen){
  if(!pc||!pc.getSenders)return;
  pc.getSenders().forEach(s=>{
    if(!s.track)return;
    if(s.track.kind==='audio')_tuneAudioSender(s);
    else if(s.track.kind==='video')_tuneVideoSender(s,!!isScreen);
  });
}

async function permDoRequest(){
  const isVideo=_permIsVideo;
  const ac={echoCancellation:true,noiseSuppression:true,autoGainControl:true};
  if(selMic&&selMic!=='default')ac.deviceId={ideal:selMic};
  const constraints=isVideo?{audio:ac,video:_camConstraints()}:{audio:ac};
  try{
    const stream=await navigator.mediaDevices.getUserMedia(constraints);
    $('permOverlay').classList.remove('show');_permResolve?.onGranted(stream);_permResolve=null;
  }catch(e){
    if(e.name==='NotAllowedError'||e.name==='PermissionDeniedError'){
      $('permDeniedHint').style.display='block';
      $('permAllowBtn').textContent='Повторить';
      toast('Доступ к микрофону запрещён',4000);
      _permResolve?.onDenied(e);
    }else if(e.name==='NotFoundError'||e.name==='DevicesNotFoundError'){
      $('permOverlay').classList.remove('show');
      toast('Микрофон не найден',4000);
      _permResolve?.onDenied(e);_permResolve=null;
    }else if(e.name==='OverconstrainedError'){
      try{
        const s=await navigator.mediaDevices.getUserMedia(isVideo?{audio:true,video:true}:{audio:true});
        $('permOverlay').classList.remove('show');_permResolve?.onGranted(s);_permResolve=null;
      }catch(e2){
        $('permOverlay').classList.remove('show');
        toast('Ошибка: '+(e2.message||e2.name),5000);
        _permResolve?.onDenied(e2);_permResolve=null;
      }
    }else{
      $('permOverlay').classList.remove('show');
      toast('Ошибка: '+(e.message||e.name),5000);
      _permResolve?.onDenied(e);_permResolve=null;
    }
  }
}

function permSkip(){$('permOverlay').classList.remove('show');_permResolve?.onDenied(new Error('skipped'));_permResolve=null;}

async function getMediaStream(isVideo){
  return new Promise((resolve,reject)=>{
    const doGet=()=>showPermRequest(isVideo,resolve,reject);
    if(typeof navigator.permissions!=='undefined'&&navigator.permissions.query){
      navigator.permissions.query({name:'microphone'}).then(result=>{
        if(result.state==='granted'){
          const ac={echoCancellation:true,noiseSuppression:true,autoGainControl:true};
          if(selMic&&selMic!=='default')ac.deviceId={ideal:selMic};
          const c=isVideo?{audio:ac,video:_camConstraints()}:{audio:ac};
          navigator.mediaDevices.getUserMedia(c)
            .then(resolve)
            .catch(e=>{
              if(e.name==='OverconstrainedError'){
                navigator.mediaDevices.getUserMedia(isVideo?{audio:true,video:true}:{audio:true}).then(resolve).catch(reject);
              }else doGet();
            });
        }else doGet();
      }).catch(()=>doGet());
    }else doGet();
  });
}

function _callSend(peerId,data){
  // В Firebase-режиме всегда шлём через inbox: DataChannel может числиться
  // открытым, но быть мёртвым — тогда пакеты (в т.ч. ренеготиация демки) молча пропадают
  if(typeof _fbMode!=='undefined'&&_fbMode){_fbSend(peerId,data);return;}
  if(conns[peerId]?.open){
    try{conns[peerId].send(data);return;}catch(e){}
  }
  _fbSend(peerId,data);
}

// Отправка offer'а ренеготиации (включили камеру/демонстрацию) с повтором:
// если ответ не пришёл за 2.5 с — шлём ещё раз, иначе демка «не доходит» вообще
function _sendRenegOffer(pc,peerId,attempt){
  if(!pc||!peerId||!pc.localDescription)return;
  _callSend(peerId,{type:'webrtc_offer',sdp:pc.localDescription.toJSON()});
  const n=attempt||0;
  if(n>=2)return;
  setTimeout(()=>{
    try{
      if(pc.signalingState==='have-local-offer'&&activeCall&&activeCall.peerId===peerId){
        console.warn('[SLON] ответ на ренеготиацию не пришёл, повтор #'+(n+1));
        _sendRenegOffer(pc,peerId,n+1);
      }
    }catch(e){}
  },2500);
}

async function _flushPendingIce(){
  if(!_callPC||!_pendingIceCandidates.length)return;
  const candidates=_pendingIceCandidates.slice();
  _pendingIceCandidates=[];
  for(const c of candidates){
    try{await _callPC.addIceCandidate(new RTCIceCandidate(c));}
    catch(e){console.warn('flush ice error:',e);}
  }
}

function startCallWithPerm(peerId,isVideo){
  if(peerId&&peerId.startsWith('g_'))return startGroupCall(peerId,isVideo); // групповой звонок
  // В fbMode считаем всех потенциально доступными
  if(activeCall)return toast('Уже идёт звонок');
  if(!hasMediaDevices)return toast('Медиа-устройства недоступны');
  getMediaStream(isVideo)
    .then(stream=>doStartCall(peerId,isVideo,stream))
    .catch(e=>{if(e.message!=='skipped')console.error('Perm error:',e);});
}

async function doStartCall(peerId,isVideo,stream){
  // Сброс буферов сигналинга от предыдущих звонков
  _pendingIceCandidates=[];
  _pendingRemoteOffer=null;
  _remoteStream=new MediaStream();
  localStream=stream;
  // Уникальный ID этого звонка — для идентификации при оффлайн-доставке
  const callId='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  _callPC=new RTCPeerConnection({iceServers:ICE_SERVERS});
  stream.getTracks().forEach(t=>{if(t.kind==='video')_hintTrack(t,false);_callPC.addTrack(t,stream);});
  _callPC.getSenders().filter(s=>s.track&&s.track.kind==='video').forEach(s=>{s._isVideoSender=true;});_tuneAllSenders(_callPC,false);
  _callPC.onicecandidate=e=>{
    if(e.candidate)_callSend(peerId,{type:'call_ice',candidate:e.candidate.toJSON()});
  };
  _callPC.ontrack=e=>{
    if(activeCall)activeCall.answered=true;
    _handleRemoteTrack(e.track);
  };
  _callPC.onconnectionstatechange=()=>{
    if(_callPC?.connectionState==='failed'||_callPC?.connectionState==='closed'){
      if(activeCall)endCallCleanup();
    }
  };
  const fakeCall={peer:peerId,close:()=>{_callPC?.close();_callPC=null;},peerConnection:_callPC};
  activeCall={call:fakeCall,peerId,isVideo,answered:false,callId,outgoing:true};
  setupCallUI(peerId,isVideo);
  // Уведомляем собеседника о звонке (с callId чтобы отмена корректно привязалась)
  _callSend(peerId,{type:'call_incoming',isVideo,nick:myNick||('@'+myUsername),avatar:myAvatar||null,callId});
  // Offer
  try{
    const offer=await _callPC.createOffer();
    await _callPC.setLocalDescription(offer);
    _callSend(peerId,{type:'call_offer',sdp:_callPC.localDescription.toJSON(),isVideo,callId});
  }catch(e){console.error('call offer error',e);endCallCleanup();}
}

async function answerCall(){
  $('incoming').classList.remove('show');stopRingSound();
  if(!pendingCall)return;
  const{peerId,isVideo,callId}=pendingCall;
  let sdp=pendingCall.sdp;
  if(!sdp&&_pendingRemoteOffer?.peerId===peerId)sdp=_pendingRemoteOffer.sdp;
  pendingCall=null;

  // Сообщаем другим нашим устройствам что ответили здесь
  _syncCallToSelf('answered',callId,peerId);

  getMediaStream(isVideo).then(async stream=>{
    _remoteStream=new MediaStream();
    localStream=stream;
    _callPC=new RTCPeerConnection({iceServers:ICE_SERVERS});
    stream.getTracks().forEach(t=>{if(t.kind==='video')_hintTrack(t,false);_callPC.addTrack(t,stream);});
    _callPC.getSenders().filter(s=>s.track&&s.track.kind==='video').forEach(s=>{s._isVideoSender=true;});_tuneAllSenders(_callPC,false);
    _callPC.onicecandidate=e=>{
      if(e.candidate)_callSend(peerId,{type:'call_ice',candidate:e.candidate.toJSON()});
    };
    _callPC.ontrack=e=>{
      _handleRemoteTrack(e.track);
    };
    _callPC.onconnectionstatechange=()=>{
      if(_callPC?.connectionState==='failed'||_callPC?.connectionState==='closed'){
        if(activeCall)endCallCleanup();
      }
    };
    const fakeCall={peer:peerId,close:()=>{_callPC?.close();_callPC=null;},peerConnection:_callPC};
    activeCall={call:fakeCall,peerId,isVideo,answered:true,outgoing:false,callId};
    setupCallUI(peerId,isVideo);

    if(sdp){
      // Offer уже есть — применяем сразу
      try{
        await _callPC.setRemoteDescription(new RTCSessionDescription(sdp));
        await _flushPendingIce();
        const answer=await _callPC.createAnswer();
        await _callPC.setLocalDescription(answer);
        _callSend(peerId,{type:'call_answer',sdp:_callPC.localDescription.toJSON()});
        _pendingRemoteOffer=null;
      }catch(e){console.error('answer error',e);endCallCleanup();}
    }
    // Если offer ещё не пришёл — он применится в обработчике 'call_offer' (там есть ветка для activeCall+_callPC)
  }).catch(()=>toast('Нет доступа к микрофону'));
}

function rejectCall(){
  $('incoming').classList.remove('show');stopRingSound();playHangupSound();
  if(pendingCall){
    const{callId,peerId,isVideo}=pendingCall;
    _callSend(peerId,{type:'call_reject',callId});
    _syncCallToSelf('rejected',callId,peerId); // сообщаем другим устройствам
    _logCallMessage(peerId,{outgoing:false,outcome:'declined',isVideo});
    pendingCall=null;
  }
}

function _syncCallToSelf(action,callId,peerId){
  if(!_fbMode||!window._fbDb||!myUsername||!callId)return;
  try{
    // Шлём себе в inbox (все наши устройства слушают inbox/myUsername)
    _fbSend(myUsername,{
      type:'call_self_sync',
      action, // 'answered' | 'rejected'
      callId,
      peerId,
      _device:_myDeviceId, // чтобы отправитель сам себя не обработал
      ts:Date.now()
    });
  }catch(e){}
}

function setupCallUI(peerId,isVideo){
  const av=peerAvatars[peerId];
  const callAvEl=$('callAv');callAvEl.innerHTML='';
  if(av){const i=document.createElement('img');i.src=av;callAvEl.appendChild(i);}
  else callAvEl.innerHTML=_avHtml(peerId,peerNames[peerId]||peerId);
  const mcAvEl=$('mcAv');mcAvEl.innerHTML='';
  if(av){const i=document.createElement('img');i.src=av;i.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%';mcAvEl.appendChild(i);}
  else mcAvEl.innerHTML=_avHtml(peerId,peerNames[peerId]||peerId);
  const name=peerNames[peerId]||('@'+peerId);
  $('callPName').textContent=$('mcName').textContent=name;
  $('callTimer').textContent=$('mcTimer').textContent='00:00';
  $('callSub').textContent='Соединение…';$('tapHint').style.display='none';
  $('csTypeText').textContent=isVideo?'Видеозвонок':'Аудиозвонок';
  $('csTypeIco').innerHTML=`<use href="${isVideo?'#i-video':'#i-phone'}"/>`;

  // Видео-обёртка: только для видеозвонков изначально
  $('callVidWrap').classList.toggle('show',isVideo);
  $('callAudUI').style.display=isVideo?'none':'';

  // Локальное видео для видеозвонка
  if(isVideo&&localStream){
    const lv=$('localVideo');lv.srcObject=localStream;lv.play().catch(()=>{});
    $('localVideo').style.display='';
    $('pipSelfInfo').style.display='none';
  }else{
    $('localVideo').style.display='none';
    updatePipSelfInfo();
  }

  // Сбрасываем состояние кнопок
  isMuted=false;isCamOff=false;
  updateMuteBtn();updateCamBtn();updateScreenShareBtn();
  // Показываем кнопку переворота только на мобильных и только при активной камере
  const isMob=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const fbw=$('flipCamWrap');if(fbw)fbw.style.display=isMob&&isVideo?'':'none';
  _camFacing='user';

  callMinimized=false;
  $('callScreen').classList.add('show');
  $('miniCall').classList.remove('show');

  // Клик на localVideo (PiP рамку) — swap или переключение
  const lv2=$('localVideo');
  if(lv2&&!lv2._pipClickBound){
    lv2._pipClickBound=true;
    let _lastPipTap=0;
    const doPipClick=()=>{
      const hasLocal=isScreenSharing||(localStream&&localStream.getVideoTracks().length>0&&!isCamOff);
      const hasRemote=$('remoteVideo').srcObject&&$('remoteVideo').srcObject.getVideoTracks().length>0;
      if(hasLocal&&hasRemote){
        // Обе стороны с видео — swap main↔pip
        swapPip();
      }
      // Если нет видео — ничего (рамка и так показывает ник/аватар)
    };
    lv2.addEventListener('click',e=>{e.stopPropagation();doPipClick();});
    lv2.addEventListener('touchend',e=>{
      e.stopPropagation();
      const now=Date.now();
      if(now-_lastPipTap<400)return; // ignore double-tap
      _lastPipTap=now;
      doPipClick();
    },{passive:true});
  }
}

function swapPip(){
  _pipSwapped=!_pipSwapped;
  const rv=$('remoteVideo');
  const lv=$('localVideo');
  const wrap=$('callVidWrap');
  if(_pipSwapped){
    // local → main, remote → pip
    rv.classList.add('pip-mode');
    lv.classList.add('main-mode');
    wrap.classList.add('pip-swapped');
  }else{
    rv.classList.remove('pip-mode');
    lv.classList.remove('main-mode');
    wrap.classList.remove('pip-swapped');
  }
  toast(_pipSwapped?'Вы на экране':'Собеседник на экране');
}

async function stopScreenShare(){
  if(screenShareStream){screenShareStream.getTracks().forEach(t=>t.stop());screenShareStream=null;}
  isScreenSharing=false;updateScreenShareBtn();
  const lv=$('localVideo');if(lv){lv.srcObject=null;lv.style.display='none';}
  for(const[pid,pc] of _getActivePCs()){
    try{
      // Убираем screen audio
      const audS=pc.getSenders().find(s=>s._isScreenAudio);
      if(audS)try{await audS.replaceTrack(null);}catch(e){}
      // Видео: возвращаем камеру или recvonly
      const vTr=pc.getTransceivers().find(t=>t.sender._isVideoSender||t.receiver?.track?.kind==='video'||t.sender?.track?.kind==='video');
      const camTracks=localStream?.getVideoTracks()||[];
      const hasActiveCam=camTracks.length>0&&camTracks[0].readyState==='live';
      if(hasActiveCam&&vTr){
        try{await vTr.sender.replaceTrack(camTracks[0]);}catch(e){}
        try{vTr.direction='sendrecv';}catch(e){}
      }else if(vTr){
        try{await vTr.sender.replaceTrack(null);}catch(e){}
        try{vTr.direction='recvonly';}catch(e){}
      }
      const offer=await pc.createOffer();await pc.setLocalDescription(offer);
      if(_vr)_vrSignal(pid,{type:'offer',sdp:pc.localDescription.toJSON()});
      else _sendRenegOffer(pc,activeCall?.peerId);
    }catch(e){console.warn('stop screen renegotiate',pid,e);}
  }
  const camTracks=localStream?.getVideoTracks()||[];
  if(camTracks.length>0&&camTracks[0].readyState==='live'){
    const lv2=$('localVideo');lv2.srcObject=localStream;lv2.play().catch(()=>{});lv2.style.display='';
    if(!_vr){$('pipSelfInfo').style.display='none';}
  }
  if(_vr)_vrUpdateSelfTile(false);
  else _updateRemoteVideoUI();
  toast('Демонстрация экрана остановлена');
}

async function _toggleCamScreen(){
  if(!activeCall)return;
  const sh=$('vidSwitchHint');
  if(sh&&!sh._shown){sh._shown=true;sh.classList.add('show');setTimeout(()=>sh.classList.remove('show'),2500);}
  if(isScreenSharing){
    // Экран → камера
    await stopScreenShare();
    await _activateCam();
  }else if(localStream?.getVideoTracks().length>0){
    // Камера → экран
    await toggleScreenShare();
  }
}

function _handleRemoteTrack(track){
  if(!_remoteStream)_remoteStream=new MediaStream();
  if(!_remoteStream.getTracks().some(t=>t.id===track.id)){
    _remoteStream.addTrack(track);
  }
  // onmute/onunmute — вызываем _updateRemoteVideoUI для ОБОИХ типов треков
  track.onmute=()=>{
    console.log('remote track muted:',track.kind);
    _updateRemoteVideoUI();
  };
  track.onunmute=()=>{
    console.log('remote track unmuted:',track.kind);
    if(track.kind==='video'){const rv=$('remoteVideo');if(rv)rv._needRefresh=true;}
    // При размьючивании убеждаемся что трек в _remoteStream
    if(!_remoteStream.getTracks().some(t=>t.id===track.id)){
      _remoteStream.addTrack(track);
    }
    _updateRemoteVideoUI();
    // Для аудио — перезапускаем воспроизведение
    if(track.kind==='audio')_tryPlayRemote();
  };
  track.onended=()=>{
    console.log('remote track ended:',track.kind);
    try{_remoteStream.removeTrack(track);}catch(e){}
    _updateRemoteVideoUI();
  };
  const rv=$('remoteVideo'),a=$('remAudio');
  rv.muted=true; // звук — только через remAudio, иначе он удваивается
  // Видео назначает _updateRemoteVideoUI (свежим потоком только с видео)
  if(a.srcObject!==_remoteStream)a.srcObject=_remoteStream;
  a.volume=1.0;
  if(selSpk&&selSpk!=='default'&&typeof a.setSinkId==='function')
    a.setSinkId(selSpk).catch(()=>{});
  _tryPlayRemote();
  _updateRemoteVideoUI();
  startCallTimer();
  $('callSub').textContent='';
}

function _updateRemoteVideoUI(){
  if(!_remoteStream||!activeCall||!_callPC)return;

  // Собираем ТОЛЬКО видео receiver-треки для UI решения
  // Аудио-треки НЕ трогаем — ими управляет _handleRemoteTrack
  const liveVideoReceiverTracks=[];
  if(!_callPC)return;
  (_callPC).getTransceivers().forEach(tr=>{
    const t=tr.receiver?.track;
    if(!t||t.kind!=='video'||t.readyState!=='live')return;
    const dir=tr.currentDirection;
    // null = negotiation ещё не завершена — разрешаем
    if(dir===null||dir==='sendrecv'||dir==='recvonly'){
      liveVideoReceiverTracks.push(t);
    }
  });

  // Синхронизируем ТОЛЬКО видео-треки в _remoteStream
  const liveVideoIds=new Set(liveVideoReceiverTracks.map(t=>t.id));
  // Удаляем устаревшие видео-треки
  _remoteStream.getVideoTracks().forEach(t=>{
    if(!liveVideoIds.has(t.id)){
      try{_remoteStream.removeTrack(t);}catch(e){}
    }
  });
  // Добавляем новые видео-треки
  liveVideoReceiverTracks.forEach(t=>{
    if(!_remoteStream.getTracks().some(x=>x.id===t.id)){
      _remoteStream.addTrack(t);
    }
  });

  // UI решение на основе наличия видео
  // Видео есть, только если трек живой И реально идут кадры (muted = собеседник перестал слать)
  const liveVids=_remoteStream.getVideoTracks().filter(t=>t.readyState==='live'&&!t.muted);
  const remoteLiveVideo=liveVids.length>0;
  const myCamTracks=localStream?.getVideoTracks()||[];
  const myLiveVideo=myCamTracks.some(t=>t.readyState==='live')||isScreenSharing;

  const rv=$('remoteVideo');rv.muted=true;
  if(remoteLiveVideo){
    // Видео собеседника — на месте аватарки
    $('callVidWrap').classList.add('show');
    $('callAudUI').style.display='none';
    // Каждый раз, когда набор видеотреков меняется, даём <video> СВЕЖИЙ поток.
    // Если держать один MediaStream и удалять/добавлять в него треки, Chrome
    // оставляет чёрный кадр навсегда (демка «отваливается» до перезагрузки)
    const want=liveVids.map(t=>t.id).join(',');
    const cur=(rv.srcObject&&rv.srcObject.getVideoTracks?rv.srcObject.getVideoTracks().map(t=>t.id).join(','):'');
    if(cur!==want||rv._needRefresh){rv.srcObject=new MediaStream(liveVids);rv._needRefresh=false;}
    rv.play().catch(()=>{});
  }else{
    // Нет видео у собеседника — стандартный экран: аватарка, ник, время звонка
    $('callVidWrap').classList.remove('show');
    $('callAudUI').style.display='';
    rv.srcObject=null;
  }
  // Моя камера/демонстрация — окошко в правом нижнем углу (оно вне callVidWrap)
  if(!myLiveVideo){const lv=$('localVideo');lv.srcObject=null;lv.style.display='none';}
  $('callCard')?.classList.toggle('has-self-video',myLiveVideo);
  updatePipSelfInfo();
}

function _tryPlayRemote(){
  const a=$('remAudio'),rv=$('remoteVideo');
  const playAudio=()=>{
    const pp=a.play();
    if(pp&&pp.then){
      pp.then(()=>{
        $('tapHint').style.display='none';
        if($('callSub').textContent==='Нажми для звука')$('callSub').textContent='';
      }).catch(err=>{
        // Заблокировано — пробуем разблокировать на любой клик в окне звонка
        if(!_audioUnlockBound){
          _audioUnlockBound=true;
          const unlock=()=>{
            a.play().then(()=>{
              $('tapHint').style.display='none';
              if($('callSub').textContent==='Нажми для звука')$('callSub').textContent='';
              document.removeEventListener('click',unlock,true);
              document.removeEventListener('touchstart',unlock,true);
              _audioUnlockBound=false;
            }).catch(()=>{});
          };
          document.addEventListener('click',unlock,true);
          document.addEventListener('touchstart',unlock,true);
        }
        // Не показываем хинт сразу — даём пару секунд (вдруг user уже двигает мышью)
        setTimeout(()=>{
          if(activeCall&&a.paused){
            $('tapHint').style.display='flex';
            $('callSub').textContent='Нажми для звука';
          }
        },800);
      });
    }
  };
  // Сначала пробуем сразу
  playAudio();
  // И на всякий случай ещё раз через 300мс (когда новый трек прицепился, иногда нужна пауза)
  setTimeout(playAudio,300);
  if(rv.srcObject){rv.play().catch(()=>{});}
}

function onRemoteStream(rs,isVideo){
  // Эта функция оставлена для обратной совместимости, но теперь логика в _handleRemoteTrack
  $('callSub').textContent='';
  startCallTimer();
}

function tapPlay(){
  const a=$('remAudio');
  a.play().then(()=>{$('tapHint').style.display='none';$('callSub').textContent='';toast('Звук включён');}).catch(()=>toast('Не удалось включить звук'));
}

// Длительность: с часами (2:18:29) когда звонок длиннее часа, иначе 18:29
function _fmtCallDur(sec){
  sec=Math.max(0,Math.floor(sec));
  const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;
  const mm=String(m).padStart(2,'0'),ss=String(s).padStart(2,'0');
  return h>0?h+':'+mm+':'+ss:mm+':'+ss;
}
function startCallTimer(){
  if(callTimer)return;callSecs=0;
  callTimer=setInterval(()=>{
    callSecs++;
    const s=_fmtCallDur(callSecs);
    $('callTimer').textContent=s;$('mcTimer').textContent=s;
  },1000);
}

// Сворачивание/разворачивание — с анимацией островка (settings-extra.js)
function minimizeCall(){callMinimized=true;_callMinimizeAnimated();}

function maximizeCall(){callMinimized=false;_callMaximizeAnimated();}

function toggleCallFullscreen(){
  _callFullscreen=!_callFullscreen;
  $('callScreen').classList.toggle('fullscreen',_callFullscreen);
  const btn=$('csFullscreenBtn');
  if(btn){
    btn.innerHTML=_callFullscreen
      ?'<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>'
      :'<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
    btn.title=_callFullscreen?'Свернуть окно':'На весь экран';
  }
}

function endCall(){
  if(typeof _showPeerMute==='function')_showPeerMute(false);
  if(_vr){leaveVoiceRoom();return;}
  if(activeCall?.peerId){
    const msgType=activeCall.answered?'call_end':'call_cancel';
    const callId=activeCall.callId;
    _callSend(activeCall.peerId,{type:msgType,callId});
    // Запоминаем отменённый callId чтобы не показывать его при оффлайн-доставке
    if(callId){_cancelledCallIds.add(callId);setTimeout(()=>_cancelledCallIds.delete(callId),60000);}
  }
  endCallCleanup();
}

function cancelOutgoingCall(){
  if(activeCall?.peerId){
    const callId=activeCall.callId;
    _callSend(activeCall.peerId,{type:'call_cancel',callId});
    if(callId){_cancelledCallIds.add(callId);setTimeout(()=>_cancelledCallIds.delete(callId),60000);}
  }
  endCallCleanup();
}

// Записать завершённый звонок сообщением в чат (у каждой стороны — свой взгляд)
function _logCallMessage(peerId,o){
  if(!peerId||peerId==='ai'||peerId==='saved'||peerId.startsWith('g_'))return;
  const ts=Date.now();
  const msg={id:'call'+ts.toString(36)+Math.random().toString(36).slice(2,5),ts,time:fmtTime(ts),
    type:'call',sender:o.outgoing?'me':'inc',senderId:peerId,
    name:o.outgoing?undefined:(peerNames[peerId]||('@'+peerId)),
    avatar:o.outgoing?null:(peerAvatars[peerId]||null),
    callOutgoing:!!o.outgoing,callOutcome:o.outcome,callSecs:o.secs||0,isVideo:!!o.isVideo};
  if(!chatHist[peerId])chatHist[peerId]=[];
  chatHist[peerId].push(msg);
  if(typeof activeChat!=='undefined'&&activeChat===peerId){appendMsg(msg);scrollDown();}
  const prev=o.outcome==='missed'?'Пропущенный звонок':o.outcome==='answered'?(o.outgoing?'Исходящий звонок':'Входящий звонок'):o.outcome==='declined'?'Звонок отклонён':'Звонок отменён';
  if(typeof updatePreview==='function')updatePreview(peerId,prev);
  saveAll();
}

function endCallCleanup(){playHangupSound();stopRingSound();
  // Запись звонка сообщением в чат (один раз)
  if(activeCall&&activeCall.peerId&&!activeCall._logged){
    activeCall._logged=true;
    const outcome=activeCall._rejected?'declined':activeCall.answered?'answered':activeCall.outgoing?'cancelled':'missed';
    _logCallMessage(activeCall.peerId,{outgoing:!!activeCall.outgoing,outcome,secs:callSecs||0,isVideo:!!activeCall.isVideo});
  }
  // Сброс буферов сигналинга
  _pendingIceCandidates=[];
  _pendingRemoteOffer=null;
  // Останавливаем демонстрацию экрана
  if(screenShareStream){
    screenShareStream.getTracks().forEach(t=>t.stop());
    screenShareStream=null;
  }
  isScreenSharing=false;

  try{activeCall?.call?.close();}catch(e){}
  try{if(_callPC){_callPC.close();_callPC=null;}}catch(e){}
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  if(callTimer){clearInterval(callTimer);callTimer=null;}
  const a=$('remAudio');a.srcObject=null;a.pause();
  $('remoteVideo').srcObject=null;$('localVideo').srcObject=null;
  $('callScreen').classList.remove('show');$('callScreen').classList.remove('fullscreen');_callFullscreen=false;
  $('miniCall').classList.remove('show','open');
  activeCall=null;isMuted=false;isCamOff=false;callMinimized=false;
  _camFacing='user';
  _remoteStream=null;
  _audioUnlockBound=false;
  const fbw=$('flipCamWrap');if(fbw)fbw.style.display='none';
  updateMuteBtn();updateCamBtn();updateScreenShareBtn();
}

function toggleMute(){
  const stream=(_vr?.localStream)||localStream;
  if(!stream)return;
  isMuted=!isMuted;
  stream.getAudioTracks().forEach(t=>t.enabled=!isMuted);
  if(_vr)_vr.muted=isMuted;
  updateMuteBtn();
  _vrSyncButtons();
  if(activeCall?.peerId){try{sendData(conns[activeCall.peerId]||activeCall.peerId,{type:'call_mute',muted:isMuted});}catch(e){}}
}

function updateMuteBtn(){
  const btn=$('muteBtn'),lbl=$('muteLbl'),mc=$('mcMuteBtn');
  if(btn){btn.innerHTML=icoSvg(isMuted?'i-mic-off':'i-mic');btn.className='cbtn'+(isMuted?' active-off':'');}
  if(lbl)lbl.textContent=isMuted?'Включить':'Микро';
  if(mc){mc.innerHTML=icoSvg(isMuted?'i-mic-off':'i-mic');mc.className='mc-btn mc-btn-mute'+(isMuted?' off':'');}
}

async function toggleCam(){
  if(!activeCall&&!_vr)return;

  // Если идёт демонстрация экрана — переключаемся на камеру (stopScreen→startCam)
  if(isScreenSharing){
    await stopScreenShare();
    await _activateCam();
    return;
  }

  const videoTracks=localStream?localStream.getVideoTracks():[];
  const hasLiveCam=videoTracks.length>0&&videoTracks[0].readyState==='live';

  if(!hasLiveCam){
    // Нет камеры — включаем (как в аудиозвонке, так и после выключения)
    await _activateCam();
    return;
  }

  // Есть рабочий видеотрек — выключаем камеру: полностью останавливаем трек
  isCamOff=true;
  videoTracks.forEach(t=>{t.stop();localStream.removeTrack(t);});
  // Меняем direction трансивера на 'recvonly' — это РЕАЛЬНО меняет SDP и собеседник
  // увидит что видео ушло (а не просто muted). replaceTrack(null) такого не делает.
  // Ищем видео-трансивер строго — никогда не берём аудио
  for(const[pid,pc] of _getActivePCs()){
    try{
      const tr=pc.getTransceivers().find(t=>
        t.sender._isVideoSender||t.receiver?.track?.kind==='video'||t.sender?.track?.kind==='video');
      if(tr){
        try{await tr.sender.replaceTrack(null);}catch(e){}
        try{tr.direction='recvonly';}catch(e){}
      }
      const offer=await pc.createOffer();
      await pc.setLocalDescription(offer);
      if(_vr) _vrSignal(pid,{type:'offer',sdp:pc.localDescription.toJSON()});
      else _sendRenegOffer(pc,activeCall?.peerId);
    }catch(e){console.warn('cam off renegotiate:',e);}
  }
  // Скрываем своё локальное превью
  if(!_vr){
    const lv=$('localVideo');lv.srcObject=null;lv.style.display='none';
    const fbw=$('flipCamWrap');if(fbw)fbw.style.display='none';
  }else{
    _vrUpdateSelfTile(false);
  }
  updateCamBtn();
  // UI решается централизованно
  _updateRemoteVideoUI();
  toast('Камера выключена');
}

function _getActivePCs(){
  if(_vr) return Object.entries(_vr.pcs); // [[pid, pc], ...]
  if(_callPC) return [['peer', _callPC]];
  return [];
}

async function _renegotiateAll(){
  for(const [pid, pc] of _getActivePCs()){
    try{
      const offer=await pc.createOffer();
      await pc.setLocalDescription(offer);
      if(_vr) _vrSignal(pid,{type:'offer',sdp:pc.localDescription.toJSON()});
      else _sendRenegOffer(pc,activeCall?.peerId);
    }catch(e){console.warn('renegotiate error:',e);}
  }
}

async function _activateCam(){
  if(!activeCall&&!_vr){toast('Нет активного звонка');return;}
  try{
    const camStream=await navigator.mediaDevices.getUserMedia({video:_camConstraints(),audio:false});
    const videoTrack=camStream.getVideoTracks()[0];
    if(!videoTrack){toast('Камера не найдена');return;}
    _hintTrack(videoTrack,false);

    // Добавляем трек в localStream
    if(localStream){
      localStream.getVideoTracks().forEach(t=>{t.stop();localStream.removeTrack(t);});
      localStream.addTrack(videoTrack);
    }else{
      localStream=new MediaStream([videoTrack]);
      if(_vr)_vr.localStream=localStream;
    }

    // Renegotiate со всеми активными PCs
    for(const[pid,pc] of _getActivePCs()){
      try{
        const tr=pc.getTransceivers().find(t=>
          t.sender._isVideoSender||t.receiver?.track?.kind==='video'||t.sender?.track?.kind==='video');
        let vs=null;
        if(tr){
          await tr.sender.replaceTrack(videoTrack);
          tr.sender._isVideoSender=true;vs=tr.sender;
          if(tr.direction==='recvonly'||tr.direction==='inactive')try{tr.direction='sendrecv';}catch(e){}
        }else{
          const s=pc.addTrack(videoTrack,localStream);
          if(s){s._isVideoSender=true;vs=s;}
        }
        await _tuneVideoSender(vs,false);
        const offer=await pc.createOffer();
        await pc.setLocalDescription(offer);
        if(_vr) _vrSignal(pid,{type:'offer',sdp:pc.localDescription.toJSON()});
        else _sendRenegOffer(pc,activeCall?.peerId);
      }catch(e){console.warn('cam on renegotiate:',e);}
    }

    const lv=$('localVideo');lv.srcObject=localStream;lv.play().catch(()=>{});
    lv.style.display='';
    if(!_vr)$('pipSelfInfo').style.display='none';
    $('callVidWrap').classList.add('show');
    $('callAudUI').style.display='none';
    isCamOff=false;updateCamBtn();
    const fbw=$('flipCamWrap');
    if(fbw){const isMob=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);fbw.style.display=isMob?'':'none';}
    if(!_vr)_updateRemoteVideoUI();
    toast('Камера включена');
  }catch(e){
    console.error('_activateCam error:',e);
    toast('Не удалось включить камеру: '+(e.message||e.name));
  }
}

function updateCamBtn(){
  const btn=$('camBtn'),lbl=$('camLbl');
  if(btn){btn.innerHTML=icoSvg(isCamOff?'i-video-off':'i-video');btn.className='cbtn'+(isCamOff?' active-off':'');}
  if(lbl)lbl.textContent=isCamOff?'Вкл камеру':'Камера';
  // Войс кнопки
  const vb=$('vrCamBtn');if(vb){vb.innerHTML=icoSvg(isCamOff?'i-video-off':'i-video');vb.className='cbtn'+(isCamOff?' active-off':'');}
  if(_vr)_vrUpdateSelfTile(!isCamOff&&!isScreenSharing);
}

async function toggleScreenShare(){
  if(!activeCall&&!_vr){toast('Нет активного звонка');return;}
  if(isScreenSharing){stopScreenShare();return;}
  const pcs=_getActivePCs();
  // Разрешаем начать демку даже без соединений — новые участники получат трек при входе
  try{
    if(!navigator.mediaDevices?.getDisplayMedia){toast('Демонстрация экрана не поддерживается');return;}
    screenShareStream=await navigator.mediaDevices.getDisplayMedia({video:_screenConstraints(),audio:true});
    const screenTrack=screenShareStream.getVideoTracks()[0];
    if(!screenTrack){screenShareStream.getTracks().forEach(t=>t.stop());screenShareStream=null;toast('Нет видео экрана');return;}
    _hintTrack(screenTrack,true);
    // Если браузер выдал больше 30 к/с или 1080p — дожимаем ограничениями
    try{await screenTrack.applyConstraints(_screenConstraints());}catch(e){}
    const screenAudioTracks=screenShareStream.getAudioTracks();

    // Renegotiate со всеми PC
    for(const[pid,pc] of pcs){
      try{
        // Audio трек экрана
        if(screenAudioTracks.length>0){
          const existAud=pc.getSenders().find(s=>s._isScreenAudio);
          if(existAud){try{await existAud.replaceTrack(screenAudioTracks[0]);}catch(e){}}
          else{try{const s=pc.addTrack(screenAudioTracks[0],screenShareStream);if(s)s._isScreenAudio=true;}catch(e){}}
        }
        // Видео трек экрана
        const vTr=pc.getTransceivers().find(t=>
          t.sender._isVideoSender||t.receiver?.track?.kind==='video'||t.sender?.track?.kind==='video');
        let vs=null;
        if(vTr){
          await vTr.sender.replaceTrack(screenTrack);
          vTr.sender._isVideoSender=true;vs=vTr.sender;
          if(vTr.direction==='recvonly'||vTr.direction==='inactive')try{vTr.direction='sendrecv';}catch(e){}
        }else{
          const s=pc.addTrack(screenTrack,screenShareStream);if(s){s._isVideoSender=true;vs=s;}
        }
        await _tuneVideoSender(vs,true);
        const offer=await pc.createOffer();await pc.setLocalDescription(offer);
        if(_vr)_vrSignal(pid,{type:'offer',sdp:pc.localDescription.toJSON()});
        else _sendRenegOffer(pc,activeCall?.peerId);
      }catch(e){console.warn('screen share renegotiate',pid,e);}
    }

    // Локальное превью
    const lv=$('localVideo');lv.srcObject=new MediaStream([screenTrack]);lv.play().catch(()=>{});
    lv.style.display='';
    if(!_vr){$('pipSelfInfo').style.display='none';$('callVidWrap').classList.add('show');$('callAudUI').style.display='none';}
    else{_vrUpdateSelfTile(true);}
    isScreenSharing=true;updateScreenShareBtn();
    if(!_vr)_updateRemoteVideoUI();
    screenTrack.onended=()=>stopScreenShare();
    toast('🖥 Экран'+(screenAudioTracks.length>0?' + звук':''));
  }catch(e){
    screenShareStream?.getTracks().forEach(t=>t.stop());screenShareStream=null;
    if(e.name==='NotAllowedError')toast('Доступ к экрану запрещён');
    else toast('Ошибка демонстрации: '+(e.message||e.name));
    console.error('Screen share error:',e);
  }
}

function updateScreenShareBtn(){
  const btn=$('screenShareBtn'),lbl=$('screenShareLbl');
  if(btn){
    btn.innerHTML=icoSvg(isScreenSharing?'i-screen-share-off':'i-screen-share');
    btn.className='cbtn'+(isScreenSharing?' screen-active':'');
  }
  if(lbl)lbl.textContent=isScreenSharing?'Стоп':'Экран';
}

async function showDevPanel(){
  $('devOverlay').classList.add('show');
  await loadDevices();
}

function hideDevPanel(){$('devOverlay').classList.remove('show');}

async function loadDevices(){
  const body=$('devBody');
  body.innerHTML=`<div class="perm-box info">${icoSvg('i-info')}<span>Загрузка устройств…</span></div>`;
  if(!hasMediaDevices){
    body.innerHTML=`<div class="perm-box err">${icoSvg('i-warn')}<span>WebRTC не поддерживается в этом браузере</span></div>`;return;
  }

  // Проверяем разрешение
  let hasPerm=false;
  try{
    const r=await navigator.permissions.query({name:'microphone'});
    hasPerm=r.state==='granted';
  }catch(e){}

  let devices=[];
  try{
    if(!hasPerm){
      // Запрашиваем доступ для получения меток
      const s=await navigator.mediaDevices.getUserMedia({audio:true});
      s.getTracks().forEach(t=>t.stop());
      hasPerm=true;
    }
    devices=await navigator.mediaDevices.enumerateDevices();
  }catch(e){
    body.innerHTML=`
      <div class="perm-box warn">${icoSvg('i-warn')}<span>Нет доступа к микрофону</span>
        <button class="perm-grant" onclick="showPermRequest(false,()=>{hideDevPanel();showDevPanel();},()=>{})">Разрешить</button>
      </div>`;
    return;
  }

  const mics=devices.filter(d=>d.kind==='audioinput');
  const spks=devices.filter(d=>d.kind==='audiooutput');
  const cams=devices.filter(d=>d.kind==='videoinput');
  const hasSink=typeof HTMLMediaElement.prototype.setSinkId==='function';

  const devCard=(d,type,selId)=>{
    const isSel=(selId&&selId!=='default')?d.deviceId===selId:d.deviceId==='default'||mics.indexOf(d)===0&&!selId;
    const ico=type==='mic'?'i-mic':type==='cam'?'i-video':'i-speaker';
    return `<div class="dev-card${isSel?' sel':''}" onclick="selectDev('${type}','${d.deviceId}',this)">
      <div class="dev-ico">${icoSvg(ico)}</div>
      <div style="flex:1;min-width:0">
        <div class="dev-nm">${esc(d.label||d.deviceId.slice(0,16)+'…')}</div>
        <div class="dev-sub">${d.deviceId==='default'?'По умолчанию':d.deviceId.slice(0,12)+'…'}</div>
      </div>
      <div class="dev-chk">${icoSvg('i-check')}</div>
    </div>`;
  };

  let html=`<div class="perm-box ok">${icoSvg('i-ok')}<span>Разрешение выдано</span>
    <span class="dev-live-badge">● LIVE</span></div>`;

  if(activeCall){
    html+=`<div class="perm-box info">${icoSvg('i-info')}<span>Звонок активен — смена устройства применится сразу</span></div>`;
  }

  html+=`<div class="dev-grp"><div class="dev-grp-lbl">${icoSvg('i-mic')} Микрофон</div><div class="dev-list" id="devMicList">`;
  if(mics.length){mics.forEach(d=>{html+=devCard(d,'mic',selMic);});}
  else html+=`<div class="dev-empty">Микрофоны не найдены</div>`;
  html+=`</div></div>`;

  html+=`<div class="dev-grp"><div class="dev-grp-lbl">${icoSvg('i-video')} Камера</div><div class="dev-list" id="devCamList">`;
  if(cams.length){cams.forEach(d=>{html+=devCard(d,'cam',selCam);});}
  else html+=`<div class="dev-empty">Камеры не найдены</div>`;
  html+=`</div></div>`;

  html+=`<div class="dev-grp"><div class="dev-grp-lbl">${icoSvg('i-speaker')} Динамик</div>`;
  if(!hasSink){html+=`<div class="dev-empty">Выбор динамика не поддерживается браузером</div>`;}
  else{
    html+=`<div class="dev-list" id="devSpkList">`;
    if(spks.length){spks.forEach(d=>{html+=devCard(d,'spk',selSpk);});}
    else html+=`<div class="dev-empty">Динамики не найдены</div>`;
    html+=`</div>`;
  }
  html+=`</div>`;

  html+=`<button class="dev-ref" onclick="loadDevices()"><svg class="spin" style="display:inline;width:15px;height:15px"><use href="#i-refresh"/></svg> Обновить список</button>`;
  body.innerHTML=html;
}

async function selectDev(type,deviceId,card){
  // Снимаем выделение в группе
  const list=card.closest('.dev-list');
  list?.querySelectorAll('.dev-card').forEach(c=>c.classList.remove('sel'));
  card.classList.add('sel');

  if(type==='mic'){
    selMic=deviceId;saveAll();
    // Apply mic change to active call if running
    if(activeCall&&localStream){
      const ac={echoCancellation:true,noiseSuppression:true,autoGainControl:true,deviceId:{exact:deviceId}};
      navigator.mediaDevices.getUserMedia({audio:ac}).then(newStream=>{
        const newTrack=newStream.getAudioTracks()[0];
        if(!newTrack)return;
        const pc=activeCall.call.peerConnection;
        if(pc){const s=pc.getSenders().find(s=>s.track?.kind==='audio');if(s)s.replaceTrack(newTrack);}
        localStream.getAudioTracks().forEach(t=>{t.stop();localStream.removeTrack(t);});
        localStream.addTrack(newTrack);
        toast('Микрофон изменён');
      }).catch(()=>toast('Не удалось применить микрофон'));
    }
    if(activeCall&&localStream){
      // Заменяем аудиотрек в активном звонке
      try{
        const ac={echoCancellation:true,noiseSuppression:true,autoGainControl:true};
        if(deviceId&&deviceId!=='default')ac.deviceId={exact:deviceId};
        const s=await navigator.mediaDevices.getUserMedia({audio:ac});
        const newTrack=s.getAudioTracks()[0];
        if(newTrack){
          const pc=activeCall.call.peerConnection;
          const sender=pc?.getSenders().find(s=>s.track?.kind==='audio');
          if(sender)await sender.replaceTrack(newTrack);
          localStream.getAudioTracks().forEach(t=>{t.stop();localStream.removeTrack(t);});
          localStream.addTrack(newTrack);
          toast('Микрофон переключён');
        }
      }catch(e){toast('Не удалось переключить микрофон: '+(e.message||e.name));}
    }else toast('Микрофон выбран');
  }else if(type==='cam'){
    selCam=deviceId;saveAll();
    if(activeCall&&localStream){
      const videoTracks=localStream.getVideoTracks();
      if(videoTracks.length){
        try{
          const vc={facingMode:'user'};
          if(deviceId&&deviceId!=='default')vc.deviceId={exact:deviceId};
          const s=await navigator.mediaDevices.getUserMedia({video:vc});
          const newTrack=s.getVideoTracks()[0];
          if(newTrack){
            const pc=activeCall.call.peerConnection;
            const sender=pc?.getSenders().find(s=>s.track?.kind==='video');
            if(sender)await sender.replaceTrack(newTrack);
            videoTracks.forEach(t=>{t.stop();localStream.removeTrack(t);});
            localStream.addTrack(newTrack);
            $('localVideo').srcObject=localStream;
            toast('Камера переключена');
          }
        }catch(e){toast('Не удалось переключить камеру: '+(e.message||e.name));}
      }else toast('Камера выбрана (применится при следующем звонке)');
    }else toast('Камера выбрана');
  }else if(type==='spk'){
    selSpk=deviceId;saveAll();
    const ra=$('remAudio');
    if(ra&&typeof ra.setSinkId==='function')ra.setSinkId(deviceId).catch(()=>{});
    toast('Динамик изменён');
    const a=$('remAudio');
    if(a&&typeof a.setSinkId==='function'){
      a.setSinkId(deviceId).then(()=>toast('Динамик переключён')).catch(e=>toast('Ошибка: '+e.message));
    }
  }
}

function _setCallVolume(val){
  const a=$('remAudio'),v=$('remoteVideo');
  const vol=parseFloat(val);
  if(a)a.volume=vol;
  if(v)v.volume=vol;
}

function playNotifSound(){
  return; // временно отключено по просьбе — звуки уведомлений убраны
  try{
    const ac=getAC();
    // Громкость из настроек уведомлений (0..10, по умолчанию 5)
    const vol=(myNotif.volume??5)/5;if(vol<=0)return;
    const g=ac.createGain();g.gain.setValueAtTime(0.18*vol,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.35);
    const o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(880,ac.currentTime);o.frequency.setValueAtTime(1100,ac.currentTime+0.1);
    o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+0.35);
  }catch(e){}
}

function startRingSound(){
  stopRingSound();
  _playRingOnce();
  _ringInterval=setInterval(_playRingOnce,1600);
}

function stopRingSound(){
  if(_ringInterval){clearInterval(_ringInterval);_ringInterval=null;}
}

function _playRingOnce(){
  try{
    const ac=getAC();
    [[0,780,0.22],[0.18,780,0.22],[0.36,780,0.22]].forEach(([t,freq,vol])=>{
      const o=ac.createOscillator(),g=ac.createGain();
      o.type='sine';o.frequency.value=freq;
      g.gain.setValueAtTime(0,ac.currentTime+t);
      g.gain.linearRampToValueAtTime(vol,ac.currentTime+t+0.03);
      g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+t+0.26);
      o.connect(g);g.connect(ac.destination);
      o.start(ac.currentTime+t);o.stop(ac.currentTime+t+0.28);
    });
  }catch(e){}
}

function playHangupSound(){
  return; // временно отключено — звук завершения звонка убран
  try{
    const ac=getAC();
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o.frequency.setValueAtTime(480,ac.currentTime);o.frequency.linearRampToValueAtTime(300,ac.currentTime+0.4);
    g.gain.setValueAtTime(0.2,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.42);
    o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+0.45);
  }catch(e){}
}

async function flipCamera(){
  if(!activeCall){toast('Сначала прими/начни звонок');return;}
  if(!_callPC){toast('Нет соединения');return;}
  const camTracks=localStream?.getVideoTracks()||[];
  if(!camTracks.length||camTracks[0].readyState!=='live'){
    toast('Сначала включи камеру в звонке');return;
  }

  const newFacing=_camFacing==='user'?'environment':'user';
  let newStream=null;

  // СНАЧАЛА пытаемся через enumerateDevices — это самый надёжный путь на мобильных,
  // т.к. не требует повторного user-gesture для нового facingMode
  try{
    const devices=await navigator.mediaDevices.enumerateDevices();
    const cams=devices.filter(d=>d.kind==='videoinput');
    if(cams.length>=2){
      const currentSettings=camTracks[0].getSettings();
      const currentId=currentSettings.deviceId;
      // Берём камеру, у которой deviceId отличается
      const otherCam=cams.find(c=>c.deviceId&&c.deviceId!==currentId);
      if(otherCam){
        try{
          // Сначала останавливаем текущий трек чтобы устройство было свободно
          camTracks[0].stop();
          newStream=await navigator.mediaDevices.getUserMedia({
            video:{deviceId:{exact:otherCam.deviceId}},audio:false
          });
        }catch(e){
          console.warn('flipCamera: deviceId exact failed,',e.name,e.message);
        }
      }
    }
  }catch(e){
    console.warn('flipCamera: enumerateDevices failed,',e);
  }

  // Fallback 1: facingMode ideal (мягче чем exact)
  if(!newStream){
    try{
      newStream=await navigator.mediaDevices.getUserMedia({
        video:{facingMode:{ideal:newFacing}},audio:false
      });
    }catch(e){console.warn('flipCamera: facingMode ideal failed,',e.name);}
  }

  // Fallback 2: facingMode exact (последний шанс)
  if(!newStream){
    try{
      newStream=await navigator.mediaDevices.getUserMedia({
        video:{facingMode:{exact:newFacing}},audio:false
      });
    }catch(e){
      console.error('flipCamera: all attempts failed,',e.name,e.message);
      // Если ничего не вышло — попытаемся вернуть исходную камеру
      try{
        newStream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        const tr=newStream.getVideoTracks()[0];
        if(tr){
          const oldTrack=localStream.getVideoTracks()[0];
          if(oldTrack){localStream.removeTrack(oldTrack);try{oldTrack.stop();}catch(_){}}
          localStream.addTrack(tr);
          for(const[,pc] of _getActivePCs()){
            const s=pc.getSenders().find(s=>s._isVideoSender)||pc.getSenders().find(s=>s.track?.kind==='video');
            if(s)try{await s.replaceTrack(tr);}catch(_){}
          }
          const lv=$('localVideo');lv.srcObject=localStream;lv.play().catch(()=>{});
        }
      }catch(_){}
      toast('У устройства одна камера или нет доступа к другой');
      return;
    }
  }

  if(!newStream){toast('Не удалось получить новую камеру');return;}
  const newTrack=newStream.getVideoTracks()[0];
  if(!newTrack){toast('Камера не найдена');return;}

  // Определяем фактический facingMode
  const settings=newTrack.getSettings();
  if(settings.facingMode)_camFacing=settings.facingMode;
  else _camFacing=newFacing;

  // Заменяем в localStream
  const oldTrack=localStream.getVideoTracks()[0];
  if(oldTrack){localStream.removeTrack(oldTrack);try{oldTrack.stop();}catch(_){}}
  localStream.addTrack(newTrack);

  // Заменяем в sender'е (все PC — обычный звонок или войс)
  for(const[,pc] of _getActivePCs()){
    const s=pc.getSenders().find(s=>s._isVideoSender)||pc.getSenders().find(s=>s.track?.kind==='video');
    if(s)try{await s.replaceTrack(newTrack);}catch(e){console.warn('flip replaceTrack:',e);}
  }
  // Локальное превью
  const lv=$('localVideo');lv.srcObject=localStream;lv.play().catch(()=>{});

  toast(_camFacing==='environment'?'📷 Задняя камера':'🤳 Фронтальная камера');
}
