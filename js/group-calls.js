function startGroupCall(gid, isVideo) {
  if (activeCall) return toast('Сначала заверши текущий звонок');
  if (_gc) return toast('Групповой звонок уже идёт');
  const g = groups[gid]; if (!g) return;
  const members = (g.members || []).filter(m => m !== myUsername);
  if (!members.length) return toast('В группе нет других участников');

  getMediaStream(isVideo)
    .then(stream => _gcStart(gid, isVideo, stream, members))
    .catch(e => { if (e.message !== 'skipped') toast('Нет доступа к микрофону'); });
}

async function _gcStart(gid, isVideo, stream, members) {
  const callId = 'gc' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  _gc = { gid, callId, isVideo, pcs: {}, streams: {}, localStream: stream,
          muted: false, camOff: false, timer: null, timerSec: 0 };

  // Публикуем в Firebase что звонок начался
  if (window._fbDb) {
    const ref = window._fbRef(window._fbDb, `group_calls/${gid}/active`);
    window._fbSet(ref, { callId, by: myUsername, isVideo, ts: Date.now(),
      members: [myUsername, ...members] });
    // Слушаем сигналинг для себя
    _gcListenSignals(gid, callId);
  }

  // Показываем UI
  _gcShowUI(gid, isVideo);

  // Добавляем свою плитку
  _gcAddSelfTile(stream, isVideo);

  // Рассылаем входящий звонок всем участникам группы
  const g = groups[gid];
  members.forEach(pid => {
    _fbSend(pid, { type: 'grp_call_incoming', gid, callId, isVideo,
      nick: myNick || ('@' + myUsername), groupName: g?.name || 'Группа' });
  });

  // Создаём PeerConnection для каждого участника (инициатор → шлём офферы)
  for (const pid of members) {
    await _gcCreatePc(gid, callId, pid, true);
  }
}

function joinGroupCall() {
  $('grpIncoming').style.display = 'none';
  stopRingSound();
  if (!_pendingGrpCall) return;
  const { gid, callId, isVideo } = _pendingGrpCall;
  _pendingGrpCall = null;
  if (_gc) return;
  if (activeCall) return toast('Сначала заверши текущий звонок');

  getMediaStream(isVideo)
    .then(stream => _gcJoin(gid, callId, isVideo, stream))
    .catch(() => toast('Нет доступа к микрофону'));
}

function rejectGroupCall() {
  $('grpIncoming').style.display = 'none';
  stopRingSound();
  _pendingGrpCall = null;
}

async function _gcJoin(gid, callId, isVideo, stream) {
  _gc = { gid, callId, isVideo, pcs: {}, streams: {}, localStream: stream,
          muted: false, camOff: false, timer: null, timerSec: 0 };

  _gcShowUI(gid, isVideo);
  _gcAddSelfTile(stream, isVideo);

  // Сообщаем всем что присоединился → они создадут к нам PeerConnection и пришлют офферы
  if (window._fbDb) {
    const g = groups[gid] || {};
    const members = (g.members || []).filter(m => m !== myUsername);
    members.forEach(pid => {
      _fbSend(pid, { type: 'grp_call_join', gid, callId, from: myUsername });
    });
    _gcListenSignals(gid, callId);
  }
}

async function _gcCreatePc(gid, callId, pid, isInitiator) {
  if (!_gc || _gc.pcs[pid]) return;
  const pc = new RTCPeerConnection({ iceServers: _GC_ICE });
  _gc.pcs[pid] = pc;

  // Добавляем свои треки
  if (_gc.localStream) {
    _gc.localStream.getTracks().forEach(t => pc.addTrack(t, _gc.localStream));
  }

  pc.onicecandidate = e => {
    if (e.candidate) _gcSignal(gid, callId, pid, { type: 'ice', candidate: e.candidate.toJSON() });
  };

  pc.ontrack = e => {
    if (!_gc) return;
    if (!_gc.streams[pid]) _gc.streams[pid] = new MediaStream();
    _gc.streams[pid].addTrack(e.track);
    _gcUpdateTile(pid);
  };

  pc.onconnectionstatechange = () => {
    if (!_gc) return;
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      _gcRemovePeer(pid);
    }
  };

  // Добавляем плитку участника (без потока пока)
  _gcEnsureTile(pid);

  if (isInitiator) {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      _gcSignal(gid, callId, pid, { type: 'offer', sdp: pc.localDescription.toJSON() });
    } catch(e) { console.warn('gc offer error', e); }
  }
}

function _gcSignal(gid, callId, toPid, data) {
  if (!window._fbDb) return;
  const ref = window._fbRef(window._fbDb, `group_calls/${gid}/signals/${toPid}/${myUsername}`);
  window._fbPush(ref, { ...data, callId, ts: Date.now() });
}

function _gcListenSignals(gid, callId) {
  if (!window._fbDb) return;
  const ref = window._fbRef(window._fbDb, `group_calls/${gid}/signals/${myUsername}`);
  _gcSignalUnsub = window._fbOnChildAdded(ref, snap => {
    const fromPid = snap.key;
    window._fbOnChildAdded(snap.ref, msgSnap => {
      const d = msgSnap.val();
      if (!d || d.callId !== callId || !_gc) return;
      window._fbRemove(msgSnap.ref).catch(() => {});
      _gcHandleSignal(gid, callId, fromPid, d);
    });
  });
}

async function _gcHandleSignal(gid, callId, fromPid, d) {
  if (!_gc || _gc.callId !== callId) return;
  if (d.type === 'offer') {
    if (!_gc.pcs[fromPid]) await _gcCreatePc(gid, callId, fromPid, false);
    const pc = _gc.pcs[fromPid]; if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      _gcSignal(gid, callId, fromPid, { type: 'answer', sdp: pc.localDescription.toJSON() });
    } catch(e) { console.warn('gc answer error', e); }
  } else if (d.type === 'answer') {
    const pc = _gc.pcs[fromPid]; if (!pc) return;
    try { await pc.setRemoteDescription(new RTCSessionDescription(d.sdp)); } catch(e) {}
  } else if (d.type === 'ice') {
    const pc = _gc.pcs[fromPid]; if (!pc) return;
    try { await pc.addIceCandidate(new RTCIceCandidate(d.candidate)); } catch(e) {}
  }
}

function _gcShowUI(gid, isVideo) {
  const g = groups[gid] || {};
  $('grpCallTitle').textContent = (g.name || 'Группа') + (isVideo ? ' · Видео' : ' · Аудио');
  $('grpCallGrid').innerHTML = '';
  $('grpCallScreen').style.display = 'flex';
  // Таймер
  _gc.timerSec = 0;
  _gc.timer = setInterval(() => {
    if (!_gc) return;
    _gc.timerSec++;
    const m = String(Math.floor(_gc.timerSec / 60)).padStart(2,'0');
    const s = String(_gc.timerSec % 60).padStart(2,'0');
    $('grpCallTimer').textContent = m + ':' + s;
  }, 1000);
  _gcUpdateGrid();
}

function _gcAddSelfTile(stream, isVideo) {
  const tile = _gcMakeTile('me', myNick || ('@' + myUsername), myAvatar, stream, isVideo);
  $('grpCallGrid').insertBefore(tile, $('grpCallGrid').firstChild);
  _gcUpdateGrid();
}

function _gcEnsureTile(pid) {
  if ($('gctile-' + pid)) return;
  const name = peerNames[pid] || ('@' + pid);
  const av = peerAvatars[pid] || null;
  const tile = _gcMakeTile(pid, name, av, null, false);
  $('grpCallGrid').appendChild(tile);
  _gcUpdateGrid();
}

function _gcUpdateTile(pid) {
  const tile = $('gctile-' + pid); if (!tile) return;
  const stream = _gc?.streams[pid];
  const hasVideo = stream && stream.getVideoTracks().some(t => t.enabled && !t.muted);
  const vid = tile.querySelector('video');
  const avWrap = tile.querySelector('.grp-tile-av');
  if (stream && vid) {
    vid.srcObject = stream;
    vid.play().catch(() => {});
  }
  if (vid) vid.style.display = hasVideo ? '' : 'none';
  if (avWrap) avWrap.style.display = hasVideo ? 'none' : 'flex';
}

function _gcMakeTile(pid, name, av, stream, hasVideo) {
  const tile = document.createElement('div');
  tile.className = 'grp-tile'; tile.id = 'gctile-' + pid;
  const vid = document.createElement('video');
  vid.autoplay = true; vid.playsInline = true;
  if (pid === 'me') vid.muted = true;
  vid.style.display = hasVideo && stream ? '' : 'none';
  if (stream) { vid.srcObject = stream; vid.play().catch(() => {}); }
  tile.appendChild(vid);
  // Avatar fallback
  const avWrap = document.createElement('div');
  avWrap.className = 'grp-tile-av';
  avWrap.style.display = hasVideo && stream ? 'none' : 'flex';
  if (av) { const img = document.createElement('img'); img.src = av; avWrap.appendChild(img); }
  else { avWrap.innerHTML = _avHtml(pid, peerNames[pid]||pid); }
  tile.appendChild(avWrap);
  // Name bar
  const info = document.createElement('div'); info.className = 'grp-tile-info';
  info.innerHTML = `<span class="grp-tile-name">${esc(name)}</span>`;
  tile.appendChild(info);
  return tile;
}

function _gcRemovePeer(pid) {
  if (!_gc) return;
  try { _gc.pcs[pid]?.close(); } catch(e) {}
  delete _gc.pcs[pid];
  delete _gc.streams[pid];
  $('gctile-' + pid)?.remove();
  _gcUpdateGrid();
}

function _gcUpdateGrid() {
  const grid = $('grpCallGrid'); if (!grid) return;
  const n = grid.children.length;
  grid.className = 'grp-call-grid p' + Math.min(n, 6);
}

function grpToggleMute() {
  if (!_gc?.localStream) return;
  _gc.muted = !_gc.muted;
  _gc.localStream.getAudioTracks().forEach(t => t.enabled = !_gc.muted);
  const btn = $('grpMuteBtn');
  if (btn) btn.classList.toggle('active', _gc.muted);
}

function grpToggleCam() {
  if (!_gc?.localStream) return;
  _gc.camOff = !_gc.camOff;
  _gc.localStream.getVideoTracks().forEach(t => t.enabled = !_gc.camOff);
  const selfVid = $('gctile-me')?.querySelector('video');
  if (selfVid) selfVid.style.display = _gc.camOff ? 'none' : '';
  const selfAv = $('gctile-me')?.querySelector('.grp-tile-av');
  if (selfAv) selfAv.style.display = _gc.camOff ? 'flex' : 'none';
  const btn = $('grpCamBtn');
  if (btn) btn.classList.toggle('active', _gc.camOff);
}

function leaveGroupCall() {
  if (!_gc) return;
  // Уведомляем всех что вышли
  const { gid, callId } = _gc;
  const g = groups[gid] || {};
  (g.members || []).filter(m => m !== myUsername).forEach(pid => {
    _fbSend(pid, { type: 'grp_call_leave', gid, callId, from: myUsername });
  });
  _gcCleanup();
}

function _gcCleanup() {
  if (!_gc) return;
  if (_gc.timer) clearInterval(_gc.timer);
  // Закрываем все PeerConnection
  Object.values(_gc.pcs).forEach(pc => { try { pc.close(); } catch(e) {} });
  // Останавливаем локальный поток
  if (_gc.localStream) _gc.localStream.getTracks().forEach(t => t.stop());
  // Отписываемся от сигналинга
  if (_gcSignalUnsub) { try { _gcSignalUnsub(); } catch(e) {} _gcSignalUnsub = null; }
  // Удаляем Firebase-запись (если мы последний или инициатор)
  if (window._fbDb) {
    window._fbRemove(window._fbRef(window._fbDb, `group_calls/${_gc.gid}/active`)).catch(() => {});
  }
  _gc = null;
  $('grpCallScreen').style.display = 'none';
  $('grpCallGrid').innerHTML = '';
  playHangupSound();
}

function _handleGrpCallMsg(pid, data) {
  const { type, gid, callId } = data;
  if (type === 'grp_call_incoming') {
    if (_gc || activeCall) return; // уже в звонке
    _pendingGrpCall = { gid, callId, isVideo: !!data.isVideo };
    const g = groups[gid] || {};
    $('grpIncName').textContent = data.groupName || g.name || 'Группа';
    $('grpIncSub').textContent = (data.nick || '@' + pid) + ' · ' + (data.isVideo ? 'Видео' : 'Аудио');
    $('grpIncoming').style.display = 'flex';
    startRingSound();
    setTimeout(() => {
      if (_pendingGrpCall?.callId === callId) {
        $('grpIncoming').style.display = 'none';
        stopRingSound();
        _pendingGrpCall = null;
      }
    }, 30000);
  } else if (type === 'grp_call_join') {
    // Кто-то присоединился — шлём ему оффер
    if (!_gc || _gc.callId !== callId) return;
    _gcCreatePc(gid, callId, data.from, true);
  } else if (type === 'grp_call_leave') {
    if (!_gc || _gc.callId !== callId) return;
    _gcRemovePeer(data.from);
  }
}
