function _vrAddSelfTile(){
  const grid=$('vrGrid');if(!grid)return;
  let tile=$('vrtile-me');
  if(!tile){
    tile=_vrMakeTile('me', myNick||('@'+myUsername), myAvatar||null,
      myProfileBg||'bg0', myProfileBgColor||'', myProfilePattern||'');
    grid.appendChild(tile);
  }
  _vrUpdateGrid();
}

function _vrEnsurePeerTile(pid){
  if($('vrtile-'+pid))return;
  const grid=$('vrGrid');if(!grid)return;
  const name=peerNames[pid]||('@'+pid);
  const av=peerAvatars[pid]||null;
  const bg=peerProfileBgs[pid]||'bg0';
  const bgC=peerProfileBgColors[pid]||'';
  const bgP=peerProfilePatterns[pid]||'';
  grid.appendChild(_vrMakeTile(pid, name, av, bg, bgC, bgP));
  _vrUpdateGrid();
}

function _vrMakeTile(pid, name, av, bgId, bgColor, bgPattern){
  const tile=document.createElement('div');
  tile.className='vr-tile';tile.id='vrtile-'+pid;

  // Фоновый слой — профиль
  const bgDiv=document.createElement('div');bgDiv.className='vr-tile-bg';
  bgDiv.style.background=_getProfileBgStyle(bgId||'bg0',bgColor||'',bgPattern||'');
  tile.appendChild(bgDiv);

  // Видео элемент
  const vid=document.createElement('video');
  vid.autoplay=true;vid.playsInline=true;
  if(pid==='me')vid.muted=true;
  vid.className='hidden';vid.id='vrtile-vid-'+pid;
  tile.appendChild(vid);

  // Аватарка
  const avWrap=document.createElement('div');avWrap.className='vr-tile-av';avWrap.id='vrtile-av-'+pid;
  if(av){const img=document.createElement('img');img.src=av;avWrap.appendChild(img);}
  else{avWrap.innerHTML=_avHtml(pid,peerNames[pid]||pid);}
  tile.appendChild(avWrap);

  // Инфо-бар
  const info=document.createElement('div');info.className='vr-tile-info';
  info.innerHTML=`<span class="vr-tile-name">${esc(name)}</span>
    <svg class="vr-tile-mic active" viewBox="0 0 24 24" id="vrtile-mic-${pid}"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`;
  tile.appendChild(info);
  return tile;
}

function _vrUpdateTileVideo(pid, stream){
  const vid=$('vrtile-vid-'+pid);
  const avWrap=$('vrtile-av-'+pid);
  if(!vid)return;
  const hasVideo=stream&&stream.getVideoTracks().filter(t=>t.readyState!=='ended').length>0;
  if(hasVideo){
    if(vid.srcObject!==stream){vid.srcObject=stream;vid.muted=(pid==='me');vid.play().catch(()=>{});}
  }else{
    // Явно очищаем — убираем замороженный кадр
    vid.pause();vid.srcObject=null;
  }
  vid.classList.toggle('hidden',!hasVideo);
  if(avWrap)avWrap.style.display=hasVideo?'none':'flex';
}

function _vrUpdateSelfTile(hasVideo){
  const vid=$('vrtile-vid-me');
  const avWrap=$('vrtile-av-me');
  if(!vid)return;
  if(hasVideo){
    const vStream=isScreenSharing
      ?new MediaStream(screenShareStream?.getVideoTracks()||[])
      :localStream;
    if(vStream&&vStream.getVideoTracks().length>0){
      vid.srcObject=vStream;vid.muted=true;vid.play().catch(()=>{});
      vid.classList.remove('hidden');
      if(avWrap)avWrap.style.display='none';
      return;
    }
  }
  vid.pause();vid.srcObject=null;vid.classList.add('hidden');
  if(avWrap)avWrap.style.display='flex';
}

function _vrUpdateMic(pid, muted){
  const mic=$('vrtile-mic-'+pid);
  if(mic){mic.classList.toggle('muted',muted);mic.classList.toggle('active',!muted);}
  const tile=$('vrtile-'+pid);
  if(tile)tile.classList.toggle('speaking',!muted);
}

function _vrUpdateGrid(){
  const grid=$('vrGrid');if(!grid)return;
  const n=Math.max(1,grid.children.length);
  grid.className='vr-grid p'+Math.min(n,6);
}

function _vrRemoveTile(pid){
  $('vrtile-'+pid)?.remove();
  _vrUpdateGrid();
}

function _vrSetupUI2(roomName){
  const g=groups[_vr?.gid]||{};
  $('vrTopTitle').textContent=(g.name||'Группа')+' · '+roomName;
  $('vrMiniName').textContent=roomName;
  $('vrGrid').innerHTML='';
  _vrMinimized=false;
  $('vrScreen').style.display='flex';
  $('vrMini').style.display='none';
  // Таймер
  if(_vrCallTimer)clearInterval(_vrCallTimer);
  _vrCallSecs=0;
  _vrCallTimer=setInterval(()=>{
    _vrCallSecs++;
    const m=String(Math.floor(_vrCallSecs/60)).padStart(2,'0');
    const s=String(_vrCallSecs%60).padStart(2,'0');
    $('vrTopTimer').textContent=$('vrMiniTimer').textContent=m+':'+s;
  },1000);
  _vrAddSelfTile();
  // Синхронизируем кнопки с текущим состоянием
  updateMuteBtn();updateCamBtn();updateScreenShareBtn();
}

function vrMinimize(){
  _vrMinimized=true;
  $('vrScreen').style.display='none';
  $('vrMini').style.display='flex';
}

function vrExpand(){
  _vrMinimized=false;
  $('vrScreen').style.display='flex';
  $('vrMini').style.display='none';
}

function _vrSyncButtons(){
  // muteBtn, camBtn, screenShareBtn уже ссылаются на кнопки callScreen
  // Но нам нужно синхронизировать состояние с врscreen кнопками
  const vrMute=$('vrMuteBtn');const vrCam=$('vrCamBtn');const vrScreen=$('vrScreenBtn');
  if(vrMute)vrMute.className='cbtn'+(isMuted?' active-off':'');
  if(vrCam)vrCam.className='cbtn'+(isCamOff?' active-off':'');
  if(vrScreen)vrScreen.className='cbtn'+(isScreenSharing?' active-off':'');
}

function showVoiceRooms(gid){
  _vrCurrentGid = gid;
  const g = groups[gid] || {};
  $('voiceRoomsTitle').textContent = '🔊 ' + (g.name || 'Войсы');
  $('voiceRoomsOverlay').style.display = 'flex';
  _renderVoiceRoomsList(gid);
  _listenVoiceRooms(gid);
}

function hideVoiceRooms(){ $('voiceRoomsOverlay').style.display = 'none'; }

function _renderVoiceRoomsList(gid){
  const list = $('voiceRoomsList'); if(!list) return;
  list.innerHTML = '<div style="color:var(--text2);text-align:center;padding:20px">Загрузка…</div>';
  if(!window._fbDb){ list.innerHTML = '<div style="color:var(--text2);text-align:center;padding:20px">Нет соединения</div>'; return; }
  // Читаем все войсы группы
  _fbOnce('voice_rooms/'+gid).then(snap=>{
    const rooms = snap?.val() || {};
    list.innerHTML = '';
    if(!Object.keys(rooms).length){
      list.innerHTML = '<div style="color:var(--text2);text-align:center;padding:20px;font-size:13px">Войсов пока нет. Создай первый!</div>';
      return;
    }
    Object.entries(rooms).forEach(([roomId, room])=>{
      if(!room || !room.name) return;
      _renderVoiceRoomItem(list, gid, roomId, room);
    });
  });
}

function _renderVoiceRoomItem(list, gid, roomId, room){
  const isActive = _vr?.gid===gid && _vr?.roomId===roomId;
  const onlineCount = room.online ? Object.keys(room.online).length : 0;
  const activeSince = room.activeSince ? _formatActiveSince(room.activeSince) : null;
  const meta = onlineCount > 0
    ? `${onlineCount} участн. · ${activeSince||'активен'}`
    : 'Нет участников';
  const item = document.createElement('div');
  item.className = 'voice-room-item' + (isActive?' active':'');
  item.dataset.roomId = roomId;
  item.innerHTML = `
    <div class="voice-room-ico${onlineCount>0?' active-room':''}">
      <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
    </div>
    <div class="voice-room-info">
      <div class="voice-room-name">${esc(room.name)}</div>
      <div class="voice-room-meta">${esc(meta)}</div>
    </div>
    <div class="voice-room-join">${isActive?'В эфире':'Войти'}</div>
  `;
  item.onclick = () => { hideVoiceRooms(); joinVoiceRoom(gid, roomId, room.name); };
  list.appendChild(item);
}

function _formatActiveSince(ts){
  const diff = Math.floor((Date.now()-ts)/1000);
  if(diff < 60) return diff+'с';
  if(diff < 3600) return Math.floor(diff/60)+'мин';
  return Math.floor(diff/3600)+'ч';
}

function _listenVoiceRooms(gid){
  if(_vrRoomListeners[gid]) return;
  if(!window._fbDb) return;
  const ref = window._fbRef(window._fbDb, 'voice_rooms/'+gid);
  const unsub = window._fbOnValue(ref, snap=>{
    if(_vrCurrentGid !== gid || $('voiceRoomsOverlay').style.display==='none') return;
    const rooms = snap?.val() || {};
    const list = $('voiceRoomsList'); if(!list) return;
    list.innerHTML = '';
    if(!Object.keys(rooms).length){
      list.innerHTML = '<div style="color:var(--text2);text-align:center;padding:20px;font-size:13px">Войсов пока нет. Создай первый!</div>';
      return;
    }
    Object.entries(rooms).forEach(([roomId, room])=>{ if(room?.name) _renderVoiceRoomItem(list,gid,roomId,room); });
  });
  _vrRoomListeners[gid] = unsub;
}

function showCreateVoiceRoom(){
  const gid = _vrCurrentGid; if(!gid) return;
  showModal(`
    <div class="m-title">🔊 Создать войс</div>
    <input class="m-inp" id="vrNameInp" placeholder="Название (Основной, Gaming, Музыка…)" maxlength="30">
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doCreateVoiceRoom()">Создать</button>
    </div>
  `);
  setTimeout(()=>$('vrNameInp')?.focus(),100);
}

async function doCreateVoiceRoom(){
  const gid = _vrCurrentGid; if(!gid) return;
  const name = ($('vrNameInp')?.value||'').trim();
  if(!name) return toast('Введи название');
  closeModal();
  if(!window._fbDb) return toast('Нет соединения');
  const roomId = 'vr_'+Date.now().toString(36);
  try{
    await window._fbSet(window._fbRef(window._fbDb,'voice_rooms/'+gid+'/'+roomId),
      {name, createdBy:myUsername, ts:Date.now(), online:{}});
    toast('🔊 Войс «'+name+'» создан');
    showVoiceRooms(gid);
  }catch(e){ toast('Ошибка: '+e.message); }
}

function joinVoiceRoom(gid, roomId, roomName){
  if(activeCall) return toast('Сначала заверши текущий звонок');
  if(_vr){ leaveVoiceRoom(); }
  getMediaStream(false) // начинаем с аудио, камеру можно включить позже
    .then(stream => _vrJoin(gid, roomId, roomName, stream))
    .catch(e => { if(e.message!=='skipped') toast('Нет доступа к микрофону'); });
}

async function _vrJoin(gid, roomId, roomName, stream){
  _vr = { gid, roomId, roomName, pcs:{}, streams:{}, localStream:stream,
          muted:false, camOff:true, _onlineUnsub:null };
  localStream = stream;

  if(window._fbDb){try{
    // Пишем себя в онлайн-список
    const onRef = window._fbRef(window._fbDb,'voice_rooms/'+gid+'/'+roomId+'/online/'+myUsername);
    await window._fbSet(onRef, {nick:myNick||('@'+myUsername), ts:Date.now()});

    // activeSince: ставим только если мы первые (нет других в online)
    const snapOnline = await _fbOnce('voice_rooms/'+gid+'/'+roomId+'/online');
    const onlineNow = snapOnline?.val()||{};
    const othersOnline = Object.keys(onlineNow).filter(p=>p!==myUsername);
    if(othersOnline.length === 0){
      // Мы первые — ставим новый activeSince
      window._fbSet(window._fbRef(window._fbDb,'voice_rooms/'+gid+'/'+roomId+'/activeSince'), Date.now());
    }

    window.addEventListener('beforeunload', _vrCleanupOnUnload);

    // ── Ключевой фикс: слушаем onChildAdded вместо onlyOnce ──
    // onChildAdded сразу отдаёт существующих участников + новых в реальном времени
    const onlineRef = window._fbRef(window._fbDb,'voice_rooms/'+gid+'/'+roomId+'/online');
    const addedUnsub = window._fbOnChildAdded(onlineRef, snap=>{
      const pid = snap.key;
      if(!pid || pid === myUsername || !_vr) return;
      _vrEnsurePeerTile(pid); // плитка — всегда
      // PC НЕ создаём отсюда — только джоинер инициирует (см. voice_join)
    });

    // onChildRemoved — участник ушёл
    const removedUnsub = window._fbOnChildRemoved(onlineRef, snap=>{
      const pid = snap.key;
      if(pid && pid !== myUsername){
        _vrRemovePeer(pid);
        _vrRemoveTile(pid);
      }
      // Если больше никого нет — сбросить activeSince
      _fbOnce('voice_rooms/'+gid+'/'+roomId+'/online').then(s=>{
        const left = Object.keys(s?.val()||{}).filter(p=>p!==myUsername);
        if(left.length === 0 && window._fbDb){
          window._fbRemove(window._fbRef(window._fbDb,'voice_rooms/'+gid+'/'+roomId+'/activeSince')).catch(()=>{});
        }
      });
    });

    if(_vr) _vr._onlineUnsub = ()=>{ try{addedUnsub();}catch(e){} try{removedUnsub();}catch(e){} };
  }catch(e){console.warn('vrJoin firebase error:',e);}}

  // Показываем UI
  _vrSetupUI2(roomName);

  // Сообщаем всем участникам группы (они увидят тост-приглашение)
  const g = groups[gid] || {};
  (g.members||[]).filter(m=>m!==myUsername).forEach(pid=>{
    _fbSend(pid,{type:'voice_join',gid,roomId,roomName,from:myUsername,nick:myNick||('@'+myUsername)});
  });

  _vrListenSignals(gid, roomId);

  // Джоинер читает кто уже в комнате и инициирует соединения
  // Запускаем несколько раз чтобы поймать участников при задержке Firebase
  const _vrConnectExisting = ()=>{
    if(!_vr||_vr.gid!==gid||_vr.roomId!==roomId)return;
    _fbOnce('voice_rooms/'+gid+'/'+roomId+'/online').then(snap=>{
      const d=snap?.val()||{};
      Object.keys(d).filter(p=>p!==myUsername).forEach(p=>{
        if(_vr&&!_vr.pcs[p]){
          _vrEnsurePeerTile(p);
          _vrCreatePc(p, true); // джоинер = initiator
        }
      });
    });
  };
  if(window._fbDb){
    _vrConnectExisting(); // сразу
    setTimeout(_vrConnectExisting, 2000); // повтор через 2с
    setTimeout(_vrConnectExisting, 5000); // повтор через 5с
  }
}

async function _vrCreatePc(pid, isInitiator){
  if(!_vr||_vr.pcs[pid]) return;
  const pc = new RTCPeerConnection({iceServers:[
    {urls:'stun:stun.cloudflare.com:3478'},
    {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
    {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
  ]});
  _vr.pcs[pid] = pc;

  // Добавляем локальные треки
  const _vrBaseStream = _vr.localStream || localStream;
  if(_vrBaseStream){
    _vrBaseStream.getAudioTracks().forEach(t=>pc.addTrack(t, _vrBaseStream));
    if(!isCamOff && _vrBaseStream.getVideoTracks().length>0){
      _vrBaseStream.getVideoTracks().forEach(t=>pc.addTrack(t, _vrBaseStream));
    }else if(isScreenSharing && screenShareStream){
      screenShareStream.getVideoTracks().forEach(t=>pc.addTrack(t, screenShareStream));
    }
  }

  pc.onicecandidate = e=>{
    if(e.candidate) _vrSignal(pid, {type:'ice', candidate:e.candidate.toJSON()});
  };

  pc.ontrack = e=>{
    if(!_vr) return;
    if(!_vr.streams[pid]) _vr.streams[pid] = new MediaStream();
    const track = e.track;
    if(!_vr.streams[pid].getTracks().find(t=>t.id===track.id)){
      _vr.streams[pid].addTrack(track);
    }
    _vrEnsurePeerTile(pid);
    if(track.kind==='audio') _vrAttachAudio(pid);
    if(track.kind==='video'){
      _vrUpdateTileVideo(pid, _vr.streams[pid]);
      setTimeout(()=>_vrUpdateTileVideo(pid, _vr.streams[pid]), 500);
    }
    track.onunmute = ()=>_vrUpdateTileVideo(pid, _vr.streams[pid]);
    track.onended = ()=>{
      if(!_vr) return;
      if(_vr.streams[pid]) _vr.streams[pid].removeTrack(track);
      // Если больше нет видеотреков — показываем аватарку
      if(track.kind==='video') _vrUpdateTileVideo(pid, _vr.streams[pid]||new MediaStream());
    };
    track.onmute = ()=>{
      if(track.kind==='video') setTimeout(()=>_vrUpdateTileVideo(pid, _vr.streams[pid]||new MediaStream()), 300);
    };
  };

  pc.onconnectionstatechange = ()=>{
    if(!_vr) return;
    if(pc.connectionState==='failed'||pc.connectionState==='disconnected'){
      _vrRemovePeer(pid);
      _vrRemoveTile(pid);
    }
    if(pc.connectionState==='connected'){
      const pids = Object.keys(_vr.pcs).map(p=>peerNames[p]||('@'+p));
      $('callSub') && ($('callSub').textContent = pids.join(', ')||'В войсе');
    }
  };

  _vrEnsurePeerTile(pid);

  if(isInitiator){
    try{
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      _vrSignal(pid, {type:'offer', sdp: pc.localDescription.toJSON()});
    }catch(e){ console.warn('vr createOffer error:', e); }
  }
}

function _vrAttachAudio(pid){
  if(!_vr?.streams[pid]) return;
  let audio=document.getElementById('vr_audio_'+pid);
  if(!audio){
    audio=document.createElement('audio');audio.id='vr_audio_'+pid;
    audio.autoplay=true;document.body.appendChild(audio);
  }
  audio.srcObject=_vr.streams[pid];
}

function _vrSignal(toPid, data){
  if(!_vr||!window._fbDb)return;
  const path=`vr_signals/${_vr.gid}/${_vr.roomId}/${toPid}/${myUsername}`;
  window._fbPush(window._fbRef(window._fbDb,path),{
    sig:data.type, sdp:data.sdp||null, candidate:data.candidate||null, ts:Date.now()
  });
}

function _vrListenSignals(gid, roomId){
  if(!window._fbDb)return;
  // Слушаем входящие сигналы: vr_signals/{gid}/{roomId}/{myUsername}/{fromUser} → onChildAdded
  const myPath=`vr_signals/${gid}/${roomId}/${myUsername}`;
  // Чистим старые сигналы перед началом
  window._fbRemove(window._fbRef(window._fbDb,myPath)).catch(()=>{});
  const myRef=window._fbRef(window._fbDb,myPath);
  // Слушаем новые узлы (от каждого отправителя)
  const senderUnsub=window._fbOnChildAdded(myRef, senderSnap=>{
    const fromUser=senderSnap.key;
    if(!fromUser||fromUser===myUsername)return;
    // Слушаем сообщения от этого отправителя
    window._fbOnChildAdded(senderSnap.ref, msgSnap=>{
      const d=msgSnap.val();
      if(!d||!d.sig)return;
      // Удаляем после прочтения
      window._fbRemove(msgSnap.ref).catch(()=>{});
      if(!_vr)return;
      _vrHandleSignal(fromUser, d);
    });
  });
  _vrSignalListeners.push(senderUnsub);
  if(_vr)_vr._signalUnsub=()=>{
    _vrSignalListeners.forEach(u=>{try{u();}catch(e){}});
    _vrSignalListeners=[];
    window._fbRemove(window._fbRef(window._fbDb,myPath)).catch(()=>{});
  };
}

async function _vrHandleSignal(pid, data){
  if(!_vr) return;
  // gid/roomId не нужны — путь Firebase уже гарантирует правильную комнату
  const sig=data.sig||data.type;
  if(sig==='offer'){
    if(!_vr.pcs[pid]) await _vrCreatePc(pid,false);
    const pc=_vr.pcs[pid];if(!pc)return;
    try{
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer=await pc.createAnswer();
      await pc.setLocalDescription(answer);
      _vrSignal(pid,{type:'answer',sdp:pc.localDescription.toJSON()});
    }catch(e){console.warn('vr answer error',e);}
  }else if(sig==='answer'){
    const pc=_vr.pcs[pid];if(!pc)return;
    try{await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));}catch(e){}
  }else if(sig==='ice'){
    const pc=_vr.pcs[pid];if(!pc)return;
    try{await pc.addIceCandidate(new RTCIceCandidate(data.candidate));}catch(e){}
  }
}

function _vrRemovePeer(pid){
  if(!_vr||!pid)return;
  if(!_vr.pcs[pid]&&!_vr.streams[pid])return; // уже удалён
  try{_vr.pcs[pid]?.close();}catch(e){}
  delete _vr.pcs[pid];delete _vr.streams[pid];
  const audio=document.getElementById('vr_audio_'+pid);audio?.remove();
  const pids=Object.keys(_vr.pcs);
  $('callSub').textContent=pids.length?pids.map(p=>peerNames[p]||('@'+p)).join(', '):'В войсе';
}

function leaveVoiceRoom(){
  if(!_vr)return;
  const{gid,roomId}=_vr;
  // Уведомляем всех
  const g=groups[gid]||{};
  (g.members||[]).filter(m=>m!==myUsername).forEach(pid=>{
    _fbSend(pid,{type:'voice_leave',gid,roomId,from:myUsername});
  });
  _vrCleanup();
}

function _vrCleanupOnUnload(){ if(_vr)leaveVoiceRoom(); }

function _vrCleanup(){
  if(!_vr)return;
  const {gid, roomId} = _vr;
  // Отписываемся от online listeners
  try{_vr._onlineUnsub&&_vr._onlineUnsub();}catch(e){}
  try{_vr._signalUnsub&&_vr._signalUnsub();}catch(e){}
  // Убираем из Firebase (async — не ждём)
  if(window._fbDb){
    window._fbRemove(window._fbRef(window._fbDb,'voice_rooms/'+gid+'/'+roomId+'/online/'+myUsername)).catch(()=>{});
    // Чистим все входящие сигналы
    window._fbRemove(window._fbRef(window._fbDb,'vr_signals/'+gid+'/'+roomId+'/'+myUsername)).catch(()=>{});
    // Если последний — сбрасываем activeSince
    setTimeout(()=>{
      _fbOnce('voice_rooms/'+gid+'/'+roomId+'/online').then(s=>{
        if(!s?.val()||!Object.keys(s.val()).length){
          window._fbRemove(window._fbRef(window._fbDb,'voice_rooms/'+gid+'/'+roomId+'/activeSince')).catch(()=>{});
        }
      });
    }, 500);
  }
  // Закрываем PeerConnections
  Object.values(_vr.pcs).forEach(pc=>{try{pc.close();}catch(e){}});
  if(_vr.localStream)_vr.localStream.getTracks().forEach(t=>t.stop());
  localStream=null;
  // Убираем audio-элементы
  Object.keys(_vr.pcs||{}).forEach(pid=>document.getElementById('vr_audio_'+pid)?.remove());
  _vr=null;
  window.removeEventListener('beforeunload',_vrCleanupOnUnload);
  if(_vrCallTimer){clearInterval(_vrCallTimer);_vrCallTimer=null;}
  // Сбрасываем состояние медиа чтобы при следующем входе всё было чисто
  if(isScreenSharing){
    screenShareStream?.getTracks().forEach(t=>t.stop());
    screenShareStream=null;
    isScreenSharing=false;
  }
  isCamOff=true;
  updateMuteBtn();updateCamBtn();updateScreenShareBtn();
  $('vrScreen').style.display='none';
  $('vrMini').style.display='none';
  playHangupSound();
}

function _handleVoiceMsg(pid, data){
  const{type,gid,roomId}=data;
  if(type==='voice_join'){
    // Кто-то вошёл в войс — если мы в той же комнате, шлём оффер
    if(_vr&&_vr.gid===gid&&_vr.roomId===roomId&&data.from!==myUsername){
      // Существующий участник = NON-initiator: джоинер сам пришлёт оффер
      _vrEnsurePeerTile(data.from);
      if(!_vr.pcs[data.from]) _vrCreatePc(data.from, false);
      toast('🔊 '+(data.nick||('@'+data.from))+' зашёл в войс');
    }else if(!_vr){
      // Уведомление что кто-то в войсе (тост с приглашением)
      toast('🔊 '+(data.nick||('@'+data.from))+' в войсе «'+(data.roomName||'')+'»');
    }
  }else if(type==='voice_leave'){
    if(_vr&&_vr.gid===gid&&_vr.roomId===roomId&&data.from!==myUsername){
      _vrRemovePeer(data.from);
    }
  }
}
