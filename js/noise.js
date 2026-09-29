// ════════ Шумоподавление в звонках (как в Discord) ════════
// Нейросеть на устройстве, звук никуда не уходит: микрофон → нейросеть → в звонок.
//  • RNNoise — лёгкая, убирает клавиатуру, вентилятор, улицу, гул (по умолчанию);
//  • GTCRN  — новее и чище (ближе к Krisp из Discord), чуть тяжелее;
//  • выключено — только встроенное шумоподавление браузера.
// Библиотека @sapphi-red/web-noise-suppressor (MIT), модели ~150–200 КБ.
const NS_CDN='https://cdn.jsdelivr.net/npm/@sapphi-red/web-noise-suppressor@0.4.1/dist/';
const NS_MODES={off:'Выключено',rnnoise:'Нейросеть (RNNoise)',gtcrn:'Максимальное (GTCRN)'};
function _nsMode(){try{const v=localStorage.getItem('sl_ns');return NS_MODES[v]?v:'rnnoise';}catch(e){return 'rnnoise';}}
function _nsSet(v){try{localStorage.setItem('sl_ns',v);}catch(e){}
  toast(v==='off'?'Шумоподавление выключено':'Шумоподавление: '+NS_MODES[v]+(typeof activeCall!=='undefined'&&activeCall?' — со следующего звонка':''));
  document.querySelectorAll('.ns-card').forEach(c=>c.classList.toggle('sel',c.dataset.ns===v));}

let _nsLib=null;const _nsWasm={};
async function _nsProcess(stream){
  const mode=_nsMode(),tr=stream&&stream.getAudioTracks()[0];
  if(mode==='off'||!tr||typeof AudioWorkletNode==='undefined')return stream;
  const ctx=new AudioContext({sampleRate:48000});
  try{
    if(ctx.state==='suspended')await ctx.resume().catch(()=>{});
    _nsLib=_nsLib||await import(NS_CDN+'index.js');
    await ctx.audioWorklet.addModule(NS_CDN+mode+'/workletProcessor.js');
    const wasmBinary=_nsWasm[mode]=_nsWasm[mode]||(mode==='gtcrn'
      ?await _nsLib.loadGtcrn({url:NS_CDN+'gtcrn.wasm'})
      :await _nsLib.loadRnnoise({url:NS_CDN+'rnnoise.wasm',simdUrl:NS_CDN+'rnnoise_simd.wasm'}));
    const node=mode==='gtcrn'?new _nsLib.GtcrnWorkletNode(ctx,{maxChannels:1,wasmBinary:wasmBinary.slice(0)})
                             :new _nsLib.RnnoiseWorkletNode(ctx,{maxChannels:1,wasmBinary:wasmBinary.slice(0)});
    const src=ctx.createMediaStreamSource(new MediaStream([tr])),dst=ctx.createMediaStreamDestination();
    src.connect(node).connect(dst);
    const out=dst.stream.getAudioTracks()[0];
    // остановили обработанную дорожку (конец звонка) — гасим и настоящий микрофон, и нейросеть
    const stop0=out.stop.bind(out);
    out.stop=()=>{stop0();try{tr.stop();}catch(e){}try{node.destroy();}catch(e){}ctx.close().catch(()=>{});};
    tr.addEventListener('ended',()=>{try{out.stop();}catch(e){}});
    out._nsRaw=tr;
    return new MediaStream([out,...stream.getVideoTracks()]);
  }catch(e){
    console.warn('[ns]',e);ctx.close().catch(()=>{});
    return stream;                                  // не вышло — звоним как раньше, без нейросети
  }
}
// все звонки (личные, групповые, голосовые комнаты) берут микрофон через getMediaStream
{const f=getMediaStream;getMediaStream=async function(){
  const s=await f.apply(this,arguments);
  try{return await _nsProcess(s);}catch(e){return s;}
};}
// выбор в панели устройств звонка
{const f=loadDevices;loadDevices=async function(){
  const r=await f.apply(this,arguments);
  try{
    const body=$('devBody');
    if(body&&!body.querySelector('.ns-grp')){
      const m=_nsMode();
      const html=`<div class="dev-grp ns-grp"><div class="dev-grp-lbl">${icoSvg('i-mic')} Шумоподавление</div><div class="dev-list">`
        +Object.entries(NS_MODES).map(([k,t])=>`<div class="dev-card ns-card${k===m?' sel':''}" data-ns="${k}" onclick="_nsSet('${k}')">
          <div class="dev-ico">${icoSvg('i-mic')}</div><div style="flex:1;min-width:0"><div class="dev-nm">${t}</div>
          <div class="dev-sub">${k==='off'?'Только встроенное в браузер':k==='rnnoise'?'Убирает клавиатуру, вентилятор, улицу':'Чище всего, как в Discord · чуть тяжелее'}</div></div>
          <div class="dev-chk">${icoSvg('i-check')}</div></div>`).join('')+`</div></div>`;
      const ref=body.querySelector('.dev-ref');
      if(ref)ref.insertAdjacentHTML('beforebegin',html);else body.insertAdjacentHTML('beforeend',html);
    }
  }catch(e){}
  return r;
};}
