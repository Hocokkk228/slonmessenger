// ════════════════════════════════════════════════════════
// ── ГРУППОВЫЕ ЗВОНКИ: полносвязная сеть (mesh) ──
//
// Каждый участник соединён с каждым отдельным RTCPeerConnection.
// Чтобы не было «A слышит B, а B не слышит A»:
//  • в каждой паре оффер шлёт ТОЛЬКО тот, чей юзернейм меньше (нет встречных офферов);
//  • список участников живёт в Firebase и сам чистится при обрыве (onDisconnect);
//  • ICE-кандидаты, пришедшие раньше описания, копятся в очереди;
//  • звук каждого — в своём <audio> (а не в <video>, который браузер может не проиграть);
//  • сторож раз в 4 с проверяет, что соединение есть с КАЖДЫМ участником, и чинит.
//
// Firebase:
//  group_calls/{gid}/active                       {callId,by,isVideo,ts}
//  group_calls/{gid}/parts/{callId}/{user}        {ts,muted,cam}
//  group_calls/{gid}/sig/{callId}/{to}/{from}/*   {type,sdp|candidate}
// ════════════════════════════════════════════════════════

function _gcRef(path){return window._fbRef(window._fbDb,path);}
function _gcIsOfferer(pid){return myUsername<pid;} // детерминированно для пары

// ── Старт / вход / выход ──
function startGroupCall(gid,isVideo){
  if(activeCall)return toast('Сначала заверши текущий звонок');
  if(_gc)return _gcShowScreen();
  const g=groups[gid];if(!g)return;
  if(!(g.members||[]).some(m=>m!==myUsername))return toast('В группе нет других участников');
  if(!window._fbDb)return toast('Нет интернета');
  // Если звонок в группе уже идёт — присоединяемся к нему, а не создаём второй
  _fbOnce(`group_calls/${gid}/active`).then(s=>{
    const a=s?.val();
    if(a&&a.callId&&Date.now()-(a.ts||0)<6*3600e3)_gcEnter(gid,a.callId,!!a.isVideo,false);
    else _gcEnter(gid,'gc'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),isVideo,true);
  });
}

async function _gcEnter(gid,callId,isVideo,isNew){
  let stream;
  try{stream=await getMediaStream(isVideo);}
  catch(e){if(e?.message!=='skipped')toast('Нет доступа к микрофону');return;}
  _gc={gid,callId,isVideo,pcs:{},streams:{},audios:{},iceQ:{},parts:{},localStream:stream,
       muted:false,camOff:!isVideo,timer:null,timerSec:0,unsubs:[],watch:null,meters:{}};
  const g=groups[gid]||{};
  if(isNew){
    window._fbSet(_gcRef(`group_calls/${gid}/active`),{callId,by:myUsername,isVideo,ts:Date.now()});
    // Звоним всем участникам группы
    (g.members||[]).filter(m=>m!==myUsername).forEach(pid=>{
      _fbSend(pid,{type:'grp_call_incoming',gid,callId,isVideo,nick:myNick||('@'+myUsername),groupName:g.name||'Группа'});
    });
  }
  // Я в списке участников; при обрыве Firebase сам меня уберёт
  const me=_gcRef(`group_calls/${gid}/parts/${callId}/${myUsername}`);
  window._fbSet(me,{ts:Date.now(),muted:false,cam:!!isVideo});
  try{me.onDisconnect().remove();}catch(e){}

  _gcBuildScreen();
  _gcShowScreen();
  _gcTile(myUsername);
  _gcUpdateTile(myUsername);

  // Участники
  const partsRef=_gcRef(`group_calls/${gid}/parts/${callId}`);
  _gc.unsubs.push(window._fbOnChildAdded(partsRef,snap=>{
    const pid=snap.key,d=snap.val()||{};if(!_gc)return;
    _gc.parts[pid]=d;
    if(pid===myUsername)return;
    _gcTile(pid);_gcUpdateTile(pid);_gcConnect(pid);
  }));
  const onChanged=snap=>{if(!_gc)return;_gc.parts[snap.key]=snap.val()||{};_gcUpdateTile(snap.key);};
  partsRef.on('child_changed',onChanged);_gc.unsubs.push(()=>partsRef.off('child_changed',onChanged));
  const onRemoved=snap=>{if(!_gc)return;const pid=snap.key;delete _gc.parts[pid];if(pid!==myUsername)_gcDropPeer(pid,true);};
  partsRef.on('child_removed',onRemoved);_gc.unsubs.push(()=>partsRef.off('child_removed',onRemoved));

  // Сигналы для меня
  const sigRef=_gcRef(`group_calls/${gid}/sig/${callId}/${myUsername}`);
  _gc.unsubs.push(window._fbOnChildAdded(sigRef,fromSnap=>{
    const from=fromSnap.key;
    const u=window._fbOnChildAdded(fromSnap.ref,m=>{
      const d=m.val();window._fbRemove(m.ref).catch(()=>{});
      if(d&&_gc)_gcOnSignal(from,d);
    });
    _gc?.unsubs.push(u);
  }));

  // Сторож: соединение должно быть с КАЖДЫМ участником
  _gc.watch=setInterval(_gcWatchdog,4000);
  // Таймер
  _gc.timer=setInterval(()=>{if(!_gc)return;_gc.timerSec++;const t=$('gcTimer');if(t)t.textContent=_gcFmt(_gc.timerSec);},1000);
  _gcRenderBar();
}

function leaveGroupCall(){
  if(!_gc)return;
  const {gid,callId}=_gc;
  window._fbRemove(_gcRef(`group_calls/${gid}/parts/${callId}/${myUsername}`)).catch(()=>{});
  // Последний вышедший закрывает звонок
  _fbOnce(`group_calls/${gid}/parts/${callId}`).then(s=>{
    const left=Object.keys(s?.val()||{}).filter(u=>u!==myUsername);
    if(!left.length){
      window._fbRemove(_gcRef(`group_calls/${gid}/active`)).catch(()=>{});
      window._fbRemove(_gcRef(`group_calls/${gid}/sig/${callId}`)).catch(()=>{});
    }
  });
  _gcCleanup();
}

function _gcCleanup(){
  if(!_gc)return;
  clearInterval(_gc.timer);clearInterval(_gc.watch);
  _gc.unsubs.forEach(u=>{try{u();}catch(e){}});
  Object.values(_gc.pcs).forEach(pc=>{try{pc.close();}catch(e){}});
  Object.values(_gc.audios).forEach(a=>{try{a.srcObject=null;a.remove();}catch(e){}});
  Object.values(_gc.meters).forEach(m=>{try{m.stop();}catch(e){}});
  _gc.localStream?.getTracks().forEach(t=>t.stop());
  const gid=_gc.gid;
  _gc=null;
  const scr=$('gcScreen');
  if(scr){scr.classList.remove('show');setTimeout(()=>{if(!_gc)scr.remove();},300);}
  try{playHangupSound();}catch(e){}
  if(activeChat===gid)_gcRenderBar();
}

// ── Соединение с одним участником ──
function _gcNewPc(pid){
  const pc=new RTCPeerConnection({iceServers:_GC_ICE});
  _gc.pcs[pid]=pc;_gc.iceQ[pid]=[];
  _gc.localStream?.getTracks().forEach(t=>pc.addTrack(t,_gc.localStream));
  // Даже без камеры держим видео-слот, чтобы камеру можно было включить без пересборки
  if(!_gc.localStream?.getVideoTracks().length)pc.addTransceiver('video',{direction:'recvonly'});
  pc.onicecandidate=e=>{if(e.candidate)_gcSend(pid,{type:'ice',candidate:e.candidate.toJSON()});};
  pc.ontrack=e=>_gcOnTrack(pid,e.track);
  pc.onconnectionstatechange=()=>{
    if(!_gc||_gc.pcs[pid]!==pc)return;
    const st=pc.connectionState;
    $('gct-'+pid)?.classList.toggle('connecting',st!=='connected');
    if(st==='failed'){_gcDropPeer(pid,false);setTimeout(()=>_gc&&_gc.parts[pid]&&_gcConnect(pid),800);}
    if(st==='disconnected'){
      // Короткий обрыв — даём сети шанс, потом перезапускаем ICE
      setTimeout(()=>{if(_gc&&_gc.pcs[pid]===pc&&pc.connectionState==='disconnected'&&_gcIsOfferer(pid))_gcOffer(pid,true);},4000);
    }
  };
  return pc;
}
function _gcConnect(pid){
  if(!_gc||pid===myUsername)return;
  const pc=_gc.pcs[pid];
  if(pc&&!['failed','closed'].includes(pc.connectionState))return;
  if(pc)_gcDropPeer(pid,false);
  _gcNewPc(pid);
  if(_gcIsOfferer(pid))_gcOffer(pid,false);
  // Не-оффереру ничего не делаем: оффер придёт от второй стороны (она увидит меня в списке)
}
async function _gcOffer(pid,iceRestart){
  const pc=_gc?.pcs[pid];if(!pc)return;
  try{
    const offer=await pc.createOffer(iceRestart?{iceRestart:true}:undefined);
    await pc.setLocalDescription(offer);
    _gcSend(pid,{type:'offer',sdp:pc.localDescription.toJSON()});
  }catch(e){console.warn('[gc] offer',pid,e);}
}
async function _gcOnSignal(from,d){
  if(!_gc||!_gc.parts[from]&&d.type!=='offer')return;
  let pc=_gc.pcs[from];
  if(d.type==='offer'){
    if(!pc||['failed','closed'].includes(pc.connectionState))pc=_gcNewPc(from);
    try{
      await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
      await _gcFlushIce(from);
      const ans=await pc.createAnswer();await pc.setLocalDescription(ans);
      _gcSend(from,{type:'answer',sdp:pc.localDescription.toJSON()});
    }catch(e){console.warn('[gc] answer',from,e);}
  }else if(d.type==='answer'){
    if(!pc||pc.signalingState!=='have-local-offer')return;
    try{await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));await _gcFlushIce(from);}catch(e){console.warn('[gc] set answer',e);}
  }else if(d.type==='need_offer'){
    // Вторая сторона включила камеру — пересогласуем (оффер всегда шлёт оффер-сторона пары)
    if(_gcIsOfferer(from))_gcOffer(from,false);
  }else if(d.type==='ice'){
    if(!pc)return;
    if(pc.remoteDescription)try{await pc.addIceCandidate(new RTCIceCandidate(d.candidate));}catch(e){}
    else _gc.iceQ[from].push(d.candidate);
  }
}
async function _gcFlushIce(pid){
  const pc=_gc?.pcs[pid],q=_gc?.iceQ[pid]||[];if(!pc)return;
  while(q.length){const c=q.shift();try{await pc.addIceCandidate(new RTCIceCandidate(c));}catch(e){}}
}
function _gcSend(to,data){
  if(!_gc)return;
  window._fbPush(_gcRef(`group_calls/${_gc.gid}/sig/${_gc.callId}/${to}/${myUsername}`),{...data,ts:Date.now()});
}
function _gcDropPeer(pid,removeTile){
  if(!_gc)return;
  try{_gc.pcs[pid]?.close();}catch(e){}
  delete _gc.pcs[pid];delete _gc.streams[pid];_gc.iceQ[pid]=[];
  const a=_gc.audios[pid];if(a){a.srcObject=null;a.remove();delete _gc.audios[pid];}
  _gc.meters[pid]?.stop();delete _gc.meters[pid];
  if(removeTile){const t=$('gct-'+pid);if(t){t.classList.add('leaving');setTimeout(()=>{t.remove();_gcLayout();},250);}}
  else _gcUpdateTile(pid);
}
function _gcWatchdog(){
  if(!_gc)return;
  Object.keys(_gc.parts).forEach(pid=>{if(pid!==myUsername)_gcConnect(pid);});
  // Звук каждого должен играть
  Object.values(_gc.audios).forEach(a=>{if(a.paused)a.play().catch(()=>{});});
}

// ── Потоки ──
function _gcOnTrack(pid,track){
  if(!_gc)return;
  if(track.kind==='audio'){
    let a=_gc.audios[pid];
    if(!a){a=document.createElement('audio');a.autoplay=true;a.style.display='none';document.body.appendChild(a);_gc.audios[pid]=a;}
    a.srcObject=new MediaStream([track]);a.play().catch(()=>{});
    if(selSpk&&selSpk!=='default'&&typeof a.setSinkId==='function')a.setSinkId(selSpk).catch(()=>{});
    _gc.meters[pid]?.stop();_gc.meters[pid]=_gcMeter(new MediaStream([track]),pid);
  }else{
    _gc.streams[pid]=new MediaStream([track]);
    track.onunmute=()=>_gcUpdateTile(pid);track.onmute=()=>_gcUpdateTile(pid);track.onended=()=>_gcUpdateTile(pid);
  }
  _gcUpdateTile(pid);
}
// Подсветка говорящего
function _gcMeter(stream,pid){
  try{
    const ac=getAC();const an=ac.createAnalyser();an.fftSize=512;
    const src=ac.createMediaStreamSource(stream);src.connect(an);
    const buf=new Uint8Array(an.fftSize);let alive=true;
    const tick=()=>{
      if(!alive)return;
      an.getByteTimeDomainData(buf);let p=0;for(const v of buf)p=Math.max(p,Math.abs(v-128));
      $('gct-'+pid)?.classList.toggle('speaking',p>12);
      setTimeout(tick,120);
    };tick();
    return {stop(){alive=false;try{src.disconnect();}catch(e){}}};
  }catch(e){return {stop(){}};}
}

// ── Кнопки ──
function grpToggleMute(){
  if(!_gc)return;
  _gc.muted=!_gc.muted;
  _gc.localStream?.getAudioTracks().forEach(t=>t.enabled=!_gc.muted);
  window._fbSet(_gcRef(`group_calls/${_gc.gid}/parts/${_gc.callId}/${myUsername}/muted`),_gc.muted);
  $('gcMuteBtn')?.classList.toggle('off',_gc.muted);
  _gcTapAnim($('gcMuteBtn'));
}
async function grpToggleCam(){
  if(!_gc)return;
  _gcTapAnim($('gcCamBtn'));
  const vt=_gc.localStream.getVideoTracks();
  if(vt.length&&!_gc.camOff){
    vt.forEach(t=>{t.stop();_gc.localStream.removeTrack(t);});
    for(const pc of Object.values(_gc.pcs)){const s=pc.getSenders().find(x=>x.track?.kind==='video'||x._gcVideo);if(s)try{await s.replaceTrack(null);}catch(e){}}
    _gc.camOff=true;
  }else{
    try{
      const cs=await navigator.mediaDevices.getUserMedia({video:selCam&&selCam!=='default'?{deviceId:{ideal:selCam}}:true});
      const t=cs.getVideoTracks()[0];_gc.localStream.addTrack(t);
      for(const [pid,pc] of Object.entries(_gc.pcs)){
        const tr=pc.getTransceivers().find(x=>x.receiver?.track?.kind==='video');
        if(tr){tr.sender._gcVideo=true;await tr.sender.replaceTrack(t);
          if(tr.direction!=='sendrecv'){tr.direction='sendrecv';if(_gcIsOfferer(pid))_gcOffer(pid,false);else _gcSend(pid,{type:'need_offer'});}}
      }
      _gc.camOff=false;
    }catch(e){toast('Нет доступа к камере');}
  }
  window._fbSet(_gcRef(`group_calls/${_gc.gid}/parts/${_gc.callId}/${myUsername}/cam`),!_gc.camOff);
  $('gcCamBtn')?.classList.toggle('on',!_gc.camOff);
  _gcUpdateTile(myUsername);
}
function _gcTapAnim(b){if(!b)return;b.classList.remove('tap');void b.offsetWidth;b.classList.add('tap');}

// ── Экран звонка ──
function _gcFmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
const _GC_ICONS={
  mic:'M12 15.2a3.7 3.7 0 0 0 3.7-3.7V5.7a3.7 3.7 0 1 0-7.4 0v5.8a3.7 3.7 0 0 0 3.7 3.7zm6.6-3.9a1.1 1.1 0 0 0-2.2.1 4.4 4.4 0 0 1-8.8 0 1.1 1.1 0 0 0-2.2-.1 6.6 6.6 0 0 0 5.5 6.5v2H9.3a1.1 1.1 0 0 0 0 2.2h5.4a1.1 1.1 0 0 0 0-2.2h-1.6v-2a6.6 6.6 0 0 0 5.5-6.5z',
  micOff:'M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z',
  cam:'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
  end:'M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.96.96 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.3 11.3 0 0 0-2.67-1.85 1 1 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z',
  min:'M19 13H5v-2h14v2z'
};
const _gcSvg=n=>`<svg viewBox="0 0 24 24"><path d="${_GC_ICONS[n]}"/></svg>`;
function _gcBuildScreen(){
  $('gcScreen')?.remove();
  const g=groups[_gc.gid]||{};
  const el=document.createElement('div');el.id='gcScreen';el.className='gc-screen';
  el.innerHTML=`<div class="gc-card">
    <div class="gc-top">
      <button class="gc-top-btn" onclick="_gcHideScreen()" title="Свернуть">${_gcSvg('min')}</button>
      <div class="gc-title"><div class="gc-name">${esc(g.name||'Группа')}</div><div class="gc-sub"><span id="gcCount"></span> · <span id="gcTimer">00:00</span></div></div>
      <div style="width:40px"></div>
    </div>
    <div class="gc-grid" id="gcGrid"></div>
    <div class="gc-ctrl">
      <div class="gc-bw"><button class="gc-b${_gc.camOff?'':' on'}" id="gcCamBtn" onclick="grpToggleCam()">${_gcSvg('cam')}</button><span>Камера</span></div>
      <div class="gc-bw"><button class="gc-b gc-b-big" id="gcMuteBtn" onclick="grpToggleMute()">${_gcSvg('mic')}${_gcSvg('micOff').replace('<svg','<svg class="gc-off-ico"')}</button><span>Микрофон</span></div>
      <div class="gc-bw"><button class="gc-b gc-b-end" onclick="leaveGroupCall()">${_gcSvg('end')}</button><span>Выйти</span></div>
    </div></div>`;
  document.body.appendChild(el);
}
function _gcShowScreen(){const s=$('gcScreen');if(!s)return;s.classList.remove('show');void s.offsetWidth;s.classList.add('show');}
function _gcHideScreen(){$('gcScreen')?.classList.remove('show');if(_gc&&activeChat===_gc.gid)_gcRenderBar();}

function _gcTile(pid){
  const grid=$('gcGrid');if(!grid||$('gct-'+pid))return;
  const me=pid===myUsername;
  const name=me?((typeof _myFullName==='function'&&_myFullName().trim())||myUsername):(peerNames[pid]||'@'+pid);
  const av=me?myAvatar:peerAvatars[pid];
  const t=document.createElement('div');t.className='gc-tile'+(me?'':' connecting');t.id='gct-'+pid;
  t.innerHTML=`<video autoplay playsinline muted></video>
    <div class="gc-av">${av?`<img src="${av}" alt="">`:_avHtml(pid,name)}</div>
    <div class="gc-lbl"><span class="gc-mic-off">${_gcSvg('micOff')}</span><span>${esc(name)}${me?' (ты)':''}</span></div>`;
  grid.appendChild(t);_gcLayout();
}
function _gcUpdateTile(pid){
  if(!_gc)return;
  const t=$('gct-'+pid);if(!t)return;
  const me=pid===myUsername,p=_gc.parts[pid]||{};
  const vt=me?_gc.localStream?.getVideoTracks().filter(x=>x.readyState==='live'):(_gc.streams[pid]?.getVideoTracks().filter(x=>x.readyState==='live'&&!x.muted)||[]);
  const hasVid=!!vt?.length&&(me?!_gc.camOff:p.cam!==false);
  const v=t.querySelector('video');
  if(hasVid){const want=vt.map(x=>x.id).join();const cur=v.srcObject?.getVideoTracks?.().map(x=>x.id).join()||'';if(cur!==want)v.srcObject=new MediaStream(vt);v.play().catch(()=>{});}
  else v.srcObject=null;
  t.classList.toggle('has-video',hasVid);
  t.classList.toggle('muted',me?_gc.muted:!!p.muted);
  const c=$('gcCount');if(c)c.textContent=_grpMembersText(Object.keys(_gc.parts).length||1);
}
function _gcLayout(){const g=$('gcGrid');if(g)g.dataset.n=Math.min(g.children.length,9);}

// ── Плашка в чате группы: «Идёт звонок · Присоединиться» ──
let _gcBarWatch=null;
function _gcRenderBar(){
  const id=activeChat;
  let bar=$('gcJoinBar');
  if(_gcBarWatch){try{_gcBarWatch();}catch(e){}_gcBarWatch=null;}
  if(!id||!id.startsWith('g_')||!window._fbDb){bar?.classList.remove('show');return;}
  if(!bar){
    bar=document.createElement('div');bar.id='gcJoinBar';bar.className='gc-join-bar';
    const pb=$('pinnedBar');pb?.parentNode.insertBefore(bar,pb.nextSibling);
  }
  _gcBarWatch=window._fbOnValue(_gcRef(`group_calls/${id}/active`),snap=>{
    const a=snap.val();
    if(activeChat!==id)return;
    const inThis=_gc&&_gc.gid===id;
    if(!a&&!inThis){bar.classList.remove('show');return;}
    bar.innerHTML=inThis
      ?`<div class="gc-jb-ico">${_gcSvg('mic')}</div><div class="gc-jb-txt"><b>Ты в звонке</b><span>${esc(groups[id]?.name||'')}</span></div><button onclick="_gcShowScreen()">Открыть</button>`
      :`<div class="gc-jb-ico">${_gcSvg('mic')}</div><div class="gc-jb-txt"><b>Идёт групповой звонок</b><span>Нажми, чтобы присоединиться</span></div><button onclick="startGroupCall('${id}',false)">Присоединиться</button>`;
    bar.classList.add('show');
  });
}

// ── Входящий групповой звонок ──
function _handleGrpCallMsg(pid,data){
  const {type,gid,callId}=data;
  if(type!=='grp_call_incoming')return; // остальное теперь идёт через Firebase-список участников
  if(_gc||activeCall||!groups[gid])return;
  _pendingGrpCall={gid,callId,isVideo:!!data.isVideo};
  $('gcIncoming')?.remove();
  const el=document.createElement('div');el.id='gcIncoming';el.className='gc-incoming';
  el.innerHTML=`<div class="gc-inc-av">${_avHtml(gid,groups[gid].name||'Группа')}</div>
    <div class="gc-inc-txt"><b>${esc(data.groupName||groups[gid].name||'Группа')}</b><span>${esc(data.nick||'@'+pid)} зовёт в групповой звонок</span></div>
    <button class="gc-inc-no" onclick="rejectGroupCall()">${_gcSvg('end')}</button>
    <button class="gc-inc-yes" onclick="joinGroupCall()">${_gcSvg('mic')}</button>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
  try{startRingSound();}catch(e){}
  setTimeout(()=>{if(_pendingGrpCall?.callId===callId)rejectGroupCall();},30000);
}
function joinGroupCall(){
  const p=_pendingGrpCall;_pendingGrpCall=null;
  $('gcIncoming')?.remove();try{stopRingSound();}catch(e){}
  if(!p||_gc)return;
  if(activeCall)return toast('Сначала заверши текущий звонок');
  _gcEnter(p.gid,p.callId,p.isVideo,false);
}
function rejectGroupCall(){
  _pendingGrpCall=null;
  const el=$('gcIncoming');if(el){el.classList.remove('show');setTimeout(()=>el.remove(),250);}
  try{stopRingSound();}catch(e){}
}
