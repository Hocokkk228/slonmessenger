// ════════ Демонстрация экрана: чистый звук и плавные 30 кадров ════════
// Звук. Раньше на звук демки стояло эхоподавление (оно рассчитано на голос — музыка от него «булькает
// под водой»), а кодек слал его как речь: моно, низкий битрейт. Теперь:
//   • эхоподавление выключено там, где браузер сам не берёт в демку звук SLON (restrictOwnAudio) —
//     иначе голос собеседника вернулся бы ему эхом; шумодав и автогромкость выключены всегда;
//   • Opus для звука демки: стерео, 48 кГц, до 192 кбит/с, без экономии на тишине (DTX).
// Видео. Цель — не меньше 30 кадров/с. Раз в 2 с смотрим статистику отправки: если кадров меньше 28
// И браузер жалуется на канал/процессор — снижаем разрешение ступенью; держится стабильно 10 с — поднимаем.
// Статичный экран (браузер сам шлёт мало кадров, когда ничего не меняется) просадкой не считается.

// ── звук: захват ──
if(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia){
  const gdm=navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
  const sup=(navigator.mediaDevices.getSupportedConstraints&&navigator.mediaDevices.getSupportedConstraints())||{};
  navigator.mediaDevices.getDisplayMedia=function(c){
    try{
      if(c&&c.audio){
        const a=typeof c.audio==='object'?{...c.audio}:{};
        a.echoCancellation=!sup.restrictOwnAudio;     // браузер сам вырезает звук SLON — эхоподавление не нужно
        a.noiseSuppression=false;a.autoGainControl=false;
        a.channelCount={ideal:2};a.sampleRate={ideal:48000};
        c={...c,audio:a};
      }
    }catch(e){}
    return gdm(c);
  };
}

// ── звук: кодек. Первая аудио-строка — микрофон, остальные — звук демки ──
function _sqMusicSdp(sdp){
  const L=String(sdp||'').split('\r\n');let audioN=-1,inMusic=false;const pts=new Set();
  for(const l of L){
    if(l.startsWith('m=')){inMusic=l.startsWith('m=audio')&&(++audioN)>=1;continue;}
    const m=inMusic&&l.match(/^a=rtpmap:(\d+) opus\//i);if(m)pts.add(m[1]);
  }
  if(!pts.size)return sdp;
  audioN=-1;inMusic=false;
  const P='stereo=1;sprop-stereo=1;maxaveragebitrate=192000;maxplaybackrate=48000;useinbandfec=1;usedtx=0';
  return L.map(l=>{
    if(l.startsWith('m=')){inMusic=l.startsWith('m=audio')&&(++audioN)>=1;return l;}
    const f=inMusic&&l.match(/^a=fmtp:(\d+) (.*)$/);
    if(f&&pts.has(f[1])){
      const kv=Object.fromEntries(f[2].split(';').map(x=>x.trim().split('=')).filter(x=>x[0]));
      for(const p of P.split(';')){const [k,v]=p.split('=');kv[k]=v;}
      return 'a=fmtp:'+f[1]+' '+Object.entries(kv).map(([k,v])=>v===undefined?k:k+'='+v).join(';');
    }
    return l;
  }).join('\r\n');
}
// описание собеседника: так наш браузер узнаёт, что можно слать стерео и с высоким битрейтом
if(typeof _boostDesc==='function'){const f=_boostDesc;_boostDesc=function(desc){
  const r=f.apply(this,arguments);
  try{return new RTCSessionDescription({type:r.type,sdp:_sqMusicSdp(r.sdp)});}catch(e){return r;}
};}
// своё описание: собеседник узнаёт, что мы принимаем стерео
{const sld=RTCPeerConnection.prototype.setLocalDescription;
  RTCPeerConnection.prototype.setLocalDescription=function(d){
    try{if(d&&d.sdp&&(d.type==='offer'||d.type==='answer'))d={type:d.type,sdp:_sqMusicSdp(d.sdp)};}catch(e){}
    return sld.apply(this,d===undefined?[]:[d]);
  };}
// битрейт отправки звука демки — не урезать до «речевых» 64 кбит/с
if(typeof _tuneAudioSender==='function'){const f=_tuneAudioSender;_tuneAudioSender=async function(s){
  if(s&&s._isScreenAudio)return _sqAudioTx(s);
  return f.apply(this,arguments);
};}
async function _sqAudioTx(s){
  try{const p=s.getParameters();if(!p.encodings||!p.encodings.length)p.encodings=[{}];
    p.encodings[0].maxBitrate=192000;p.encodings[0].priority='high';p.encodings[0].networkPriority='high';
    await s.setParameters(p);s._sqA=true;}catch(e){}
}

// ── видео: держим 30 кадров ──
const _SQ_SCALE=[1,1.25,1.5,2,2.5,3];            // 1080p → 864p → 720p → 540p → 432p → 360p
function _sqPcs(){
  const out=new Set();
  try{if(typeof _callPC!=='undefined'&&_callPC)out.add(_callPC);}catch(e){}
  try{if(typeof _getActivePCs==='function')for(const [,pc] of _getActivePCs())pc&&out.add(pc);}catch(e){}
  return [...out];
}
async function _sqApply(s,lvl){
  try{const p=s.getParameters();if(!p.encodings||!p.encodings.length)p.encodings=[{}];
    p.encodings[0].scaleResolutionDownBy=_SQ_SCALE[lvl];
    p.encodings[0].maxFramerate=30;
    p.degradationPreference='maintain-framerate';          // при нехватке — сначала чёткость, а не кадры
    await s.setParameters(p);s._sqLvl=lvl;}catch(e){}
}
async function _sqTick(){
  if(typeof isScreenSharing==='undefined'||!isScreenSharing||typeof screenShareStream==='undefined'||!screenShareStream)return;
  const vt=screenShareStream.getVideoTracks()[0];
  for(const pc of _sqPcs()){
    for(const s of pc.getSenders()){
      if(s._isScreenAudio&&!s._sqA)_sqAudioTx(s);
      if(!vt||s.track!==vt)continue;
      if(s._sqLvl==null){s._sqBad=0;s._sqGood=0;await _sqApply(s,0);}
      let fps=0,why='none';
      try{(await s.getStats()).forEach(r=>{if(r.type==='outbound-rtp'&&r.kind==='video'){if(r.framesPerSecond!=null)fps=Math.max(fps,r.framesPerSecond);if(r.qualityLimitationReason)why=r.qualityLimitationReason;}});}catch(e){continue;}
      const limited=why==='bandwidth'||why==='cpu';
      if(fps<28&&limited){s._sqBad++;s._sqGood=0;}
      else if(fps>=29&&!limited){s._sqGood++;s._sqBad=0;}
      else{s._sqBad=0;s._sqGood=0;}
      if(s._sqBad>=2&&s._sqLvl<_SQ_SCALE.length-1){s._sqBad=0;await _sqApply(s,s._sqLvl+1);console.log('[SLON] демка: кадров',fps.toFixed(0),'(',why,') — снижаю качество, ×',_SQ_SCALE[s._sqLvl]);}
      else if(s._sqGood>=5&&s._sqLvl>0){s._sqGood=0;await _sqApply(s,s._sqLvl-1);console.log('[SLON] демка: снова тянет — поднимаю качество, ×',_SQ_SCALE[s._sqLvl]);}
    }
  }
}
setInterval(()=>{_sqTick().catch(()=>{});},2000);
// новая демка — с полного качества
if(typeof toggleScreenShare==='function'){const f=toggleScreenShare;toggleScreenShare=async function(){
  const r=await f.apply(this,arguments);
  for(const pc of _sqPcs())for(const s of pc.getSenders())if(s._sqLvl!=null&&screenShareStream&&s.track===screenShareStream.getVideoTracks()[0]){s._sqLvl=null;}
  return r;
};}
