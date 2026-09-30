// ════════ «Моя музыка» — личная фонотека ════════
// Треки лежат на устройстве (IndexedDB) и синхронизируются между своими устройствами через облако
// (сервер: /mm/list, /mm/presign, /mm/delete; квота на человека). Другим людям файлы не раздаются:
// в профиле гости слушают 30-секундные отрывки из каталога, полный трек можно только переслать в чате.
const _mm={list:[],loaded:false,used:0,quota:0,q:'',queue:[],qi:-1,up:{},urls:{}};
const _MM_ICO={
  note:'<svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>',
  cloud:'<svg viewBox="0 0 24 24"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17l5.18-5.18 1.41 1.41L10 17z"/></svg>',
  cloudDl:'<svg viewBox="0 0 24 24"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>',
  phone:'<svg viewBox="0 0 24 24"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14z"/></svg>',
  more:'<svg viewBox="0 0 24 24"><path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause:'<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
  next:'<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
  prev:'<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
  lyr:'<svg viewBox="0 0 24 24"><path d="M3 5h12v2H3zm0 4h12v2H3zm0 4h8v2H3zm14-8v8.55A3.5 3.5 0 1 0 19 17V9h3V5h-5z"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
};
const _mmAudioRe=/\.(mp3|m4a|aac|ogg|oga|opus|flac|wav)$/i;
const _mmSz=b=>b>=1<<30?(b/(1<<30)).toFixed(1)+' ГБ':Math.max(1,Math.round(b/(1<<20)))+' МБ';

// ── IndexedDB ──
let _mmDbP=null;
function _mmDb(){
  if(_mmDbP)return _mmDbP;
  _mmDbP=new Promise((res,rej)=>{
    const r=indexedDB.open('slon_music_'+myUsername,1);
    r.onupgradeneeded=()=>{r.result.createObjectStore('tr',{keyPath:'id'});};
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
  });
  return _mmDbP;
}
async function _mmTx(mode,fn){
  const db=await _mmDb();
  return new Promise((res,rej)=>{const t=db.transaction('tr',mode),s=t.objectStore('tr');const r=fn(s);t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error);});
}
const _mmGetAll=()=>_mmTx('readonly',s=>s.getAll());
const _mmPutRec=rec=>_mmTx('readwrite',s=>s.put(rec));
const _mmDelRec=id=>_mmTx('readwrite',s=>s.delete(id));
const _mmGetRec=id=>_mmTx('readonly',s=>s.get(id));

// ── загрузка списка: локальные + облачные с других устройств ──
let _mmUserLoaded=null;
async function _mmLoad(force){
  if(_mmUserLoaded!==myUsername){_mmDbP=null;_mm.list=[];_mm.loaded=false;_mmUserLoaded=myUsername;}
  if(_mm.loaded&&!force)return _mm.list;
  const local=await _mmGetAll().catch(()=>[]);
  const byC=new Map(local.filter(r=>r.cid).map(r=>[r.cid,r]));
  const list=local.map(r=>_mmItem(r));
  if(typeof _apiToken==='function'&&_apiToken()){
    try{
      const d=await api('/mm/list');_mm.used=d.used||0;_mm.quota=d.quota||0;
      const t0=(d.tracks||[])[0];if(t0&&t0.url)_mm.base=t0.url.slice(0,t0.url.length-t0.id.length);
      for(const t of d.tracks||[]){
        if(byC.has(t.id))continue;
        list.push({id:t.id,cid:t.id,title:t.title,artist:t.artist,album:t.album,dur:t.dur,size:t.size,mime:t.mime,ts:t.ts,url:t.url,coverUrl:t.coverUrl,local:false});
      }
      // локальные треки, которых ещё нет в облаке — докачиваем
      for(const it of list)if(it.local&&!it.cid&&!it.noCloud)_mmUpload(it.id);
    }catch(e){}
  }
  list.sort((a,b)=>(b.ts||0)-(a.ts||0));
  _mm.list=list;_mm.loaded=true;
  setTimeout(_mmCovFill,500);
  setTimeout(_lrcPrefetchAll,1500);
  setTimeout(_mmSyncAll,2500);
  try{_plRemap();}catch(e){}
  return list;
}
function _mmItem(r){
  if(r.cover&&!_mm.urls['c'+r.id])_mm.urls['c'+r.id]=URL.createObjectURL(r.cover);
  return {id:r.id,cid:r.cid||'',title:r.title,artist:r.artist,album:r.album||'',dur:r.dur||0,size:r.size||0,mime:r.mime,ts:r.ts,
    coverUrl:_mm.urls['c'+r.id]||r.coverUrl||'',url:r.url||'',local:!!r.audio,noCloud:!!r.noCloud};
}
const _mmFind=id=>_mm.list.find(x=>x.id===id||x.cid===id)||Object.values(_mmFam.of).flat().find(x=>x.id===id);

// ── добавление файлов ──
function _mmPick(){
  const i=document.createElement('input');i.type='file';i.multiple=true;i.accept='audio/*,.mp3,.m4a,.ogg,.flac,.wav,.opus';
  i.onchange=async()=>{const fs=[...(i.files||[])];if(!fs.length)return;
    let n=0;for(const f of fs){_mmSay('Добавляем '+(++n)+' из '+fs.length+'…');try{await _mmAddBlob(f,f.name);}catch(e){toast(f.name+': '+(e.message||'не удалось'));}}
    _mmSay('');toast(fs.length===1?'Трек добавлен':'Добавлено треков: '+fs.length);};
  i.click();
}
async function _mmAddBlob(blob,name){
  const mime=blob.type&&blob.type.startsWith('audio/')?blob.type:(/\.m4a$/i.test(name)?'audio/mp4':/\.ogg|\.oga|\.opus$/i.test(name)?'audio/ogg':/\.flac$/i.test(name)?'audio/flac':/\.wav$/i.test(name)?'audio/wav':'audio/mpeg');
  const tags=_id3Read(await blob.slice(0,Math.min(blob.size,2*1024*1024)).arrayBuffer());
  const base=String(name||'').replace(/\.[^.]+$/,''),m=base.split(/\s+[-–—]\s+/);
  const title=(tags.title||(m[1]||base)||'Без названия').slice(0,200),artist=(tags.artist||(m[1]?m[0]:'')).slice(0,200);
  const dup=_mm.list.find(x=>x.title===title&&x.artist===artist&&Math.abs((x.size||0)-blob.size)<1024);
  if(dup)return dup;
  const cover=tags.cover?await _pxCoverJpeg(tags.cover):null;
  const audio=blob.type===mime?blob:new Blob([blob],{type:mime});
  const rec={id:'l'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),cid:'',title,artist,album:tags.album||'',dur:await _pxDur(audio),size:audio.size,mime,cover,audio,ts:Date.now()};
  await _mmPutRec(rec);
  await _mmLoad();
  const it=_mmItem(rec);_mm.list=[it,..._mm.list.filter(x=>x.id!==it.id)];
  _mmPaint();_mmUpload(rec.id);
  if(typeof _lrcFind==='function')_lrcFind({title:rec.title,artist:rec.artist,dur:rec.dur}).catch(()=>{});   // текст — сразу, на будущее
  return it;
}

// ── облако ──
async function _mmUpload(id){
  if(_mm.up[id]!=null||typeof _apiToken!=='function'||!_apiToken())return;
  const rec=await _mmGetRec(id).catch(()=>null);if(!rec||rec.cid||!rec.audio)return;
  _mm.up[id]=0;_mmPaint();
  try{
    const d=await api('/mm/presign',{size:rec.size,mime:rec.mime,title:rec.title,artist:rec.artist,album:rec.album,dur:rec.dur,cover:!!rec.cover});
    await _pxPut(d.put,rec.audio,p=>{_mm.up[id]=p;_mmRowUp(id);});
    if(rec.cover&&d.putCover){try{await _pxPut(d.putCover,rec.cover);}catch(e){}}
    rec.cid=d.id;await _mmPutRec(rec);
    const it0=_mmFind(id);if(it0)it0.cid=d.id;try{_plRemap();}catch(e){}
    const it=_mmFind(id);if(it)it.cid=d.id;_mm.used+=rec.size;
  }catch(e){
    if(e.code==='quota'){rec.noCloud=true;await _mmPutRec(rec);const it=_mmFind(id);if(it)it.noCloud=true;toast(e.message);}
  }
  delete _mm.up[id];_mmPaint();
}
// ссылка для воспроизведения: с устройства, иначе из облака (и сохраняем на устройство)
async function _mmSrc(it){
  const rec=await _mmGetRec(it.id).catch(()=>null);
  if(rec&&rec.audio){if(!_mm.urls['a'+it.id])_mm.urls['a'+it.id]=URL.createObjectURL(rec.audio);return _mm.urls['a'+it.id];}
  if(it.url){if(!it.friend)_mmCache(it);return it.url;}
  throw new Error('Трека нет ни на устройстве, ни в облаке');
}
const _mmCaching=new Set();
async function _mmCache(it){
  if(_mmCaching.has(it.id))return;_mmCaching.add(it.id);
  try{
    const r=await fetch(it.url);if(!r.ok)throw new Error("http "+r.status);const b=await r.blob();
    let cover=null;if(it.coverUrl){try{cover=await (await fetch(it.coverUrl)).blob();}catch(e){}}
    await _mmPutRec({id:it.id,cid:it.cid,title:it.title,artist:it.artist,album:it.album,dur:it.dur,size:b.size,mime:it.mime||b.type,cover,audio:new Blob([b],{type:it.mime||b.type}),ts:it.ts});
    it.local=true;_mmPaint();
  }catch(e){}
  _mmCaching.delete(it.id);
}

// ── воспроизведение (через общий плеер профиля — работает караоке) ──
const _mmTr=it=>({id:'mm_'+it.id,src:'file',url:'',title:it.title,artist:it.artist,cover:it.coverUrl||'',dur:it.dur,mm:it.id});
async function _mmPlay(id,list){
  const it=_mmFind(id);if(!it)return;
  if(!_mm.fromHist&&_mm.cur&&_mm.cur.mm&&_mm.cur.mm!==id){_mm.hist.push(_mm.cur.mm);if(_mm.hist.length>200)_mm.hist.shift();}
  _mm.fromHist=false;
  if(list&&_mm.src==null)_mm.src='lib';
  if(list){_mm.queue=list;_mm.qi=list.indexOf(id);}
  else if(!_mm.queue.includes(id)){_mm.queue=_mmFiltered().map(x=>x.id);_mm.qi=_mm.queue.indexOf(id);}
  else _mm.qi=_mm.queue.indexOf(id);
  if(_pxAudio&&_pxAudioId==='mm_'+id){if(_pxAudio.paused)_pxAudio.play().catch(()=>{});else _pxAudio.pause();return;}
  try{const tr=_mmTr(it);tr.url=await _mmSrc(it);_mm.cur=tr;
    if($('pxKara')){_pxAudio?.pause();const lp=_pxLyrics(tr);$('pxKara')?.classList.add('swap');await Promise.race([lp,new Promise(r=>setTimeout(r,12000))]);}
    await _pxPlay(tr,null);_mmHook();}
  catch(e){toast(e.message||'Не удалось включить');}
  _mmBar();_mmPaint();
}
function _mmToggle(){if(!_pxAudio||!_mm.cur)return;if(_pxAudio.paused)_pxAudio.play().catch(()=>{});else _pxAudio.pause();}
function _mmStep(d){
  if(!_mm.queue.length)return;
  if(d<0&&_pxAudio&&_pxAudio.currentTime>4){_pxAudio.currentTime=0;return;}
  const cur=_mm.queue[_mm.qi];
  if(_mm.shuffle){
    if(d<0){const prev=_mm.hist.pop();if(prev){_mm.fromHist=true;_mmPlay(prev,_mm.queue);}return;}
    _mm.played=_mm.played||new Set();if(cur)_mm.played.add(cur);
    let left=_mm.queue.filter(x=>!_mm.played.has(x));
    if(!left.length){_mm.played=new Set(cur?[cur]:[]);left=_mm.queue.filter(x=>x!==cur);}   // круг пройден — заново
    if(!left.length){_pxAudio?.pause();return;}
    _mmPlay(left[Math.floor(Math.random()*left.length)],_mm.queue);return;
  }
  const i=_mm.qi+d;if(i<0||i>=_mm.queue.length){if(d>0){_pxAudio?.pause();}return;}
  _mmPlay(_mm.queue[i],_mm.queue);
}
// «Перемешать» — режим, а не кнопка запуска: включает случайный порядок для следующих треков
_mm.shuffle=(()=>{try{return localStorage.getItem('sl_mm_shuf')==='1';}catch(e){return false;}})();_mm.hist=[];
function _mmShufToggle(){
  _mm.shuffle=!_mm.shuffle;_mm.played=new Set();
  try{localStorage.setItem('sl_mm_shuf',_mm.shuffle?'1':'0');}catch(e){}
  toast(_mm.shuffle?'Перемешивание включено':'Перемешивание выключено');_mmPlayBtns();
}
// кнопка «Слушать» ↔ «Пауза» у того списка, который сейчас играет
function _mmPlayBtns(){
  const playing=!!(_mm.cur&&_pxAudio&&!_pxAudio.paused&&String(_pxAudioId)===_mm.cur.id);
  document.querySelectorAll('[data-mmsrc]').forEach(b=>{
    const on=playing&&_mm.src===b.dataset.mmsrc,st=on?'p':'l';
    if(b.dataset.st!==st){b.dataset.st=st;b.classList.remove('mm-swap');void b.offsetWidth;b.classList.add('mm-swap');
      b.innerHTML=on?_MM_ICO.pause+' Пауза':_MM_ICO.play+(_mm.src===b.dataset.mmsrc&&_mm.cur?' Продолжить':' Слушать');}
  });
  document.querySelectorAll('.mm-shuf').forEach(b=>b.classList.toggle('on',!!_mm.shuffle));
}
// нажали «Слушать»: этот список уже играет — пауза/продолжить; иначе — с начала (или со случайного, если перемешивание)
function _mmSrcPlay(src,ids){
  if(!ids.length)return;
  if(_mm.src===src&&_mm.cur&&_pxAudio&&String(_pxAudioId)===_mm.cur.id){if(_pxAudio.paused)_pxAudio.play().catch(()=>{});else _pxAudio.pause();return;}
  _mm.src=src;_mm.played=new Set();_mm.hist=[];
  _mmPlay(_mm.shuffle?ids[Math.floor(Math.random()*ids.length)]:ids[0],ids);
}
function _mmShuffle(){_mmShufToggle();}

let _mmHooked=null;
function _mmHook(){
  if(!_pxAudio||_mmHooked===_pxAudio)return;_mmHooked=_pxAudio;
  _pxAudio.addEventListener('ended',()=>{if(String(_pxAudioId).startsWith('mm_'))_mmStep(1);});
  ['play','pause','ended'].forEach(ev=>_pxAudio.addEventListener(ev,()=>{_mmBar();_mmPaintPlay();}));
  _pxAudio.addEventListener('timeupdate',_mmBarProg);
  if('mediaSession' in navigator){
    const ms=navigator.mediaSession,h=(a,f)=>{try{ms.setActionHandler(a,f);}catch(e){}};
    h('play',()=>_pxAudio?.play().catch(()=>{}));h('pause',()=>_pxAudio?.pause());
    h('nexttrack',()=>_islStep(1));h('previoustrack',()=>_islStep(-1));
    h('seekto',d=>{if(_pxAudio&&d&&isFinite(d.seekTime)){_pxAudio.currentTime=d.seekTime;_msPos(true);}});
    h('seekbackward',d=>{if(_pxAudio)_pxAudio.currentTime=Math.max(0,_pxAudio.currentTime-((d&&d.seekOffset)||10));});
    h('seekforward',d=>{if(_pxAudio)_pxAudio.currentTime=Math.min(_pxAudio.duration||1e9,_pxAudio.currentTime+((d&&d.seekOffset)||10));});
    ['play','pause'].forEach(ev=>_pxAudio.addEventListener(ev,()=>{try{ms.playbackState=_pxAudio.paused?'paused':'playing';}catch(e){}_msPos(true);}));
  }
  ['play','pause','seeked','loadedmetadata'].forEach(ev=>_pxAudio.addEventListener(ev,()=>_nmSync()));
}
function _mmMediaSession(tr){
  if(!('mediaSession' in navigator)||!tr)return;
  try{navigator.mediaSession.metadata=new MediaMetadata({title:tr.title||'',artist:tr.artist||'',artwork:tr.cover?[{src:tr.cover,sizes:'300x300',type:'image/jpeg'}]:[]});}catch(e){}
}
// ════════ «Остров» сверху — плеер для всего, что играет (моя музыка, трек из чата, профиль) ════════
// Свёрнут: пилюля с обложкой, названием и «эквалайзером». Нажатие — раскрывается: обложка, название,
// полоса с точкой (перемотка), назад / пауза / вперёд, текст песни.
let _islTr=null,_islOpen=false;
{const f=_pxPlay;_pxPlay=async function(tr){const r=await f.apply(this,arguments);if(tr&&_pxAudio&&String(_pxAudioId)===String(tr.id)){_islTr=tr;_mmHook();_isl();}return r;};}
const _islQueue=()=>_mm.cur&&_islTr&&_islTr.id===_mm.cur.id&&_mm.queue.length>1;
function _isl(){
  const on=_islTr&&_pxAudio&&String(_pxAudioId)===String(_islTr.id)&&(!_pxAudio.paused||_pxAudio.currentTime>0);
  let w=$('slIsl');
  if(_mobPl()){if(w)w.remove();_mini(on);return;}   // на телефоне вместо острова — плеер снизу
  $('mmMini')?.remove();
  if(!on){if(w&&!w.classList.contains('bye')){w.classList.add('bye');clearTimeout(w._byeT);w._byeT=setTimeout(()=>{if(w.classList.contains('bye'))w.remove();},250);}return;}
  if(!w){w=document.createElement('div');w.id='slIsl';w.className='sl-isl';w.onclick=e=>{if(!_islOpen&&!e.target.closest('button,input')){_islOpen=true;_isl();}};document.body.appendChild(w);
    document.addEventListener('pointerdown',_islOutside,true);}
  clearTimeout(w._byeT);w.classList.remove('bye');
  const t=_islTr,pl=!_pxAudio.paused,q=_islQueue(),key=[t.id,pl,_islOpen,q].join('|');
  w.classList.toggle('open',_islOpen);w.classList.toggle('playing',pl);
  if(w.dataset.k!==key){
    w.dataset.k=key;
    const cv=t.cover?`<img src="${esc(t.cover)}" alt="">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`;
    w.innerHTML=_islOpen?`<div class="isl-top">${cv}<div class="isl-t"><b>${esc(t.title||'')}</b><span>${esc(t.artist||'')}</span></div>
        <button class="isl-ly" onclick="_pxLyrics(_islTr)" title="Текст">${_MM_ICO.lyr}</button></div>
      <div class="isl-prog"><span id="islT">0:00</span><input type="range" id="islR" min="0" max="1000" value="0" oninput="_islSeek(this.value)"><span id="islD">0:00</span></div>
      <div class="isl-ctl"><button onclick="_islStep(-1)"${q?'':' class="dim"'}>${_MM_ICO.prev}</button>
        <button class="isl-pp" onclick="_islToggle()">${pl?_MM_ICO.pause:_MM_ICO.play}</button>
        <button onclick="_islStep(1)"${q?'':' class="dim"'}>${_MM_ICO.next}</button></div>
      <button class="isl-x" onclick="_islClose()" title="Остановить">${_MM_ICO.x}</button>`
    :`${cv}<div class="isl-mt">${esc(t.title||'')}</div><span class="isl-eq"><i></i><i></i><i></i><i></i></span>`;
    _mmMediaSession(t);
  }
  _islProg();
}
function _islProg(){
  if(!_pxAudio)return;
  _miniProg();_fpProg();_msPos();const d=_pxAudio.duration,t=_pxAudio.currentTime;
  const r=$('islR');if(r&&!r.matches(':active')&&isFinite(d)&&d)r.value=Math.round(t/d*1000);
  const a=$('islT');if(a)a.textContent=_rcFmt(t*1000);const b=$('islD');if(b)b.textContent=isFinite(d)?_rcFmt(d*1000):'';
  const r2=$('islR');if(r2)r2.style.setProperty('--p',(r2.value/10)+'%');
}
function _islSeek(v){if(_pxAudio&&isFinite(_pxAudio.duration)){_pxAudio.currentTime=v/1000*_pxAudio.duration;_islProg();}}
function _islToggle(){if(!_pxAudio)return;if(_pxAudio.paused)_pxAudio.play().catch(()=>{});else _pxAudio.pause();}
function _islStep(d){if(_islQueue())_mmStep(d);else if(_pxAudio){_pxAudio.currentTime=d<0?0:(_pxAudio.duration||0);}}
function _islOutside(e){if(_islOpen&&!e.target.closest('#slIsl,#pxKara')){_islOpen=false;_isl();}}
function _islClose(){setTimeout(_nmSync,0);_islOpen=false;_pxAudio?.pause();try{_pxAudio.currentTime=0;}catch(e){}_islTr=null;_mm.cur=null;_isl();_mmPaintPlay();_pxBtns();}
function _mmBar(){_isl();}
function _mmBarProg(){_islProg();}
function _mmStop(){_islClose();}

// ── страница «Моя музыка» в настройках ──
{const f=_spRender;_spRender=function(){
  const r=f.apply(this,arguments);
  try{
    const body=$('spBody'),wal=body?.querySelector('.wal-row');
    if(body&&!body.querySelector('.mm-row')){
      const row=`<div class="sp-row mm-row" onclick="_spMusic()"><div class="sp-ico mm-row-ico">${_MM_ICO.note}</div>
        <div class="sp-row-txt"><div class="sp-row-title">Моя музыка</div></div><div class="sp-row-val mm-row-n"></div></div>`;
      if(wal)wal.insertAdjacentHTML('afterend',row);else body.querySelector('.sp-card')?.insertAdjacentHTML('afterend',`<div class="sp-card">${row}</div>`);
      _mmLoad().then(l=>{const n=body.querySelector('.mm-row-n');if(n)n.textContent=l.length||'';}).catch(()=>{});
    }
    if(!_spRender._mmRetry){_spRender._mmRetry=1;[300,1000,2500].forEach(ms=>setTimeout(()=>{const b=$('spBody');if(b&&!b.querySelector('.mm-row')){const w=b.querySelector('.wal-row'),row=`<div class="sp-row mm-row" onclick="_spMusic()"><div class="sp-ico mm-row-ico">${_MM_ICO.note}</div><div class="sp-row-txt"><div class="sp-row-title">Моя музыка</div></div><div class="sp-row-val mm-row-n"></div></div>`;if(w)w.insertAdjacentHTML('afterend',row);else b.querySelector('.sp-card')?.insertAdjacentHTML('afterend',`<div class="sp-card">${row}</div>`);}if(ms===2500)_spRender._mmRetry=0;},ms));}
  }catch(e){console.warn('[mm] sp',e);}
  return r;
};}
function _spMusic(){
  const page=_spPush('Моя музыка',`<div class="mm-page">
    <div class="mm-top">
      <button class="wal-btn" onclick="_mmPick()">${_MM_ICO.plus} Добавить треки</button>
      <button class="mm-ib mm-shuf${_mm.shuffle?' on':''}" onclick="_mmShufToggle()" title="Перемешивание">${_MM_ICO.shuffle}</button>
    </div>
    <div class="mm-say" id="mmSay" style="display:none"></div>
    <input class="lm-inp mm-q" id="mmQ" placeholder="Поиск по моей музыке" oninput="_mm.q=this.value;_mmPaint()">
    <div class="sp-card mm-pls" id="mmPls"></div>
    <div class="mm-cloud" id="mmCloud"></div>
    <div class="sp-card mm-list" id="mmList"><div class="px-empty">Загрузка…</div></div>
    <div class="sp-hint">Треки хранятся на устройстве и в твоём облаке — появятся на всех твоих устройствах. В профиле для гостей играет отрывок из каталога, а полный трек можно переслать другу в чате.</div>
    <div class="sp-sec mm-fam-h">Семейный доступ</div>
    <div class="sp-card sp-pad" id="mmFam"><div class="px-empty">Загрузка…</div></div>
    <div class="sp-hint">Близкие друзья (до 20 человек) могут слушать всю твою музыку целиком. Убрать друга можно в любой момент.</div>
  </div>`);
  _mm.q='';
  _mmFamLoad();
  _mmLoad(true).then(_mmPaint).catch(e=>{const l=$('mmList');if(l)l.innerHTML='<div class="px-empty">Не удалось открыть фонотеку</div>';});
  return page;
}
function _mmSay(t){const e=$('mmSay');if(e){e.textContent=t;e.style.display=t?'':'none';}}
function _mmFiltered(){
  const q=_mm.q.trim().toLowerCase();
  return q?_mm.list.filter(x=>(x.title+' '+x.artist+' '+x.album).toLowerCase().includes(q)):_mm.list;
}
function _mmStatus(it){
  if(_mm.up[it.id]!=null)return `<span class="mm-st up" title="Загружается в облако">${_mm.up[it.id]}%</span>`;
  if(it.local&&it.cid)return `<span class="mm-st ok" title="На устройстве и в облаке">${_MM_ICO.cloud}</span>`;
  if(!it.local)return `<span class="mm-st cl" title="В облаке — скачается при прослушивании">${_MM_ICO.cloudDl}</span>`;
  return `<span class="mm-st lo" title="${it.noCloud?'Облако заполнено — только на этом устройстве':'Только на этом устройстве'}">${_MM_ICO.phone}</span>`;
}
function _mmPaint(){
  _mmPlsPaint();
  const box=$('mmList');if(!box)return;
  const l=_mmFiltered();
  const c=$('mmCloud');
  if(c)c.innerHTML=_mm.list.length?`<span>${_mm.list.length} ${_mmPlural(_mm.list.length)}</span>`+(_mm.quota?`<span>Облако: ${_mmSz(_mm.used)} из ${_mmSz(_mm.quota)}</span><div class="mm-cloud-bar"><i style="width:${Math.min(100,_mm.used/_mm.quota*100).toFixed(1)}%"></i></div>`:''):'';
  box.innerHTML=l.length?l.map(it=>`<div class="mm-tr${_pxAudioId==='mm_'+it.id?' cur':''}" data-mm="${esc(it.id)}" onclick="_mm.src='lib';_mmPlay('${esc(it.id)}',_mmFiltered().map(x=>x.id))">
      ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="" loading="lazy">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
      <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist||'Неизвестный исполнитель')}${it.dur?' · '+_rcFmt(it.dur*1000):''}</span></div>
      ${_mmStatus(it)}
      <button class="px-mini" onclick="event.stopPropagation();_mmMenu('${esc(it.id)}')" title="Ещё">${_MM_ICO.more}</button></div>`).join('')
    :`<div class="px-empty">${_mm.list.length?'Ничего не нашли':'Здесь пока пусто. Добавь свои mp3 — они будут на всех твоих устройствах.'}</div>`;
  _mmPaintPlay();
}
function _mmRowUp(id){const s=document.querySelector(`.mm-tr[data-mm="${CSS.escape(id)}"] .mm-st`);if(s&&_mm.up[id]!=null)s.textContent=_mm.up[id]+'%';}
function _mmPaintPlay(){_mmPlayBtns();document.querySelectorAll('.mm-tr').forEach(r=>r.classList.toggle('cur',_pxAudioId==='mm_'+r.dataset.mm&&_pxAudio&&!_pxAudio.paused));}
const _mmPlural=n=>{const a=n%10,b=n%100;return a===1&&b!==11?'трек':a>=2&&a<=4&&(b<12||b>14)?'трека':'треков';};

// ── меню трека ──
function _mmMenu(id){
  const it=_mmFind(id);if(!it)return;
  _pxSheet(`<div class="mm-sh-hd">${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}<div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist)}</span></div></div>
    <div class="mm-acts">
      <button onclick="_pxSheetClose();_mmLyrics('${esc(id)}')">Текст песни</button>
      <button onclick="_mmPlAddPick('${esc(id)}')">Добавить в плейлист</button>
      <button onclick="_pxSheetClose();_mmToProfile(['${esc(id)}'])">Добавить в плейлист профиля</button>
      <button onclick="_mmSendPick('${esc(id)}')">Отправить в чат</button>
      <button class="danger" onclick="_pxSheetClose();_mmDelete('${esc(id)}')">Удалить</button>
    </div>`);
}
async function _mmLyrics(id){
  const it=_mmFind(id);if(!it)return;
  if(_mm.cur&&_mm.cur.mm===id){_pxLyrics(_mm.cur);return;}
  const tr=_mmTr(it);try{tr.url=await _mmSrc(it);}catch(e){}
  _pxLyrics(tr);
}
async function _mmDelete(id){
  const it=_mmFind(id);if(!it)return;
  if(!confirm(`Удалить «${it.title}» из моей музыки на всех устройствах?`))return;
  try{
    if(it.cid)await api('/mm/delete',{id:it.cid});
    await _mmDelRec(it.id).catch(()=>{});
    _mm.list=_mm.list.filter(x=>x!==it);if(it.cid)_mm.used=Math.max(0,_mm.used-(it.size||0));
    if(_mm.cur&&_mm.cur.mm===id)_mmStop();
    _mmPaint();
  }catch(e){toast(e.message||'Не удалось удалить');}
}

// ── отправить трек в чат (обычным файлом — у получателя будет плеер) ──
function _mmChats(){
  const ids=Object.keys(chatHist||{}).filter(x=>x!=='ai'&&x!=='saved'&&!(typeof _isChannelId==='function'&&_isChannelId(x)));
  const g=Object.keys(typeof grpHist==='object'&&grpHist?grpHist:{}).filter(x=>x.startsWith('g_'));
  const last=id=>{const h=(id.startsWith('g_')?grpHist:chatHist)[id]||[];return h.length?h[h.length-1].ts||0:0;};
  return ['saved',...[...ids,...g].sort((a,b)=>last(b)-last(a))];
}
function _mmChatName(id){if(id==='saved')return 'Избранное';if(id.startsWith('g_'))return (groups[id]||{}).name||'Группа';return peerNames[id]||('@'+id);}
function _mmSendPick(id){
  _pxSheet(`<div class="px-sh-t">Отправить в чат</div><div class="mm-chats">${_mmChats().slice(0,60).map(c=>`<div class="mm-chat" onclick="_mmSendTo('${esc(id)}','${esc(c)}')">
    <span class="mm-chat-av">${c==='saved'?`<span class="av-l" style="background:var(--accent)">${_ico('star')}</span>`:c.startsWith('g_')?_avHtml(c,_mmChatName(c)):(peerAvatars[c]?`<img src="${esc(peerAvatars[c])}" alt="">`:_avHtml(c,_mmChatName(c)))}</span>
    <b>${esc(_mmChatName(c))}</b></div>`).join('')}</div>`);
}
async function _mmSendTo(id,chat){
  const it=_mmFind(id);if(!it)return;
  _pxSheetClose();
  try{
    toast('Готовим трек…');
    const rec=await _mmGetRec(it.id).catch(()=>null);
    const blob=rec&&rec.audio?rec.audio:await (await fetch(it.url)).blob();
    const ext=/mp4|aac/.test(it.mime||'')?'.m4a':/ogg/.test(it.mime||'')?'.ogg':/flac/.test(it.mime||'')?'.flac':/wav/.test(it.mime||'')?'.wav':'.mp3';
    const file=new File([blob],((it.artist?it.artist+' - ':'')+it.title).replace(/[\\/:*?"<>|]+/g,'_')+ext,{type:it.mime||blob.type||'audio/mpeg'});
    if(typeof closeMyProfilePanel==='function')closeMyProfilePanel();
    openChat(chat);
    setTimeout(()=>handleFile({files:[file],value:''}),350);
  }catch(e){toast('Не удалось отправить: '+(e.message||''));}
}

// ════════ Трек в чате: плеер вместо «файла» ════════
const _mmMeta={};   // fdid → {title,artist,cover}
async function _mmChatMeta(fdid,name){
  if(_mmMeta[fdid])return _mmMeta[fdid];
  const base=String(name||'').replace(/\.[^.]+$/,''),m=base.split(/\s+[-–—]\s+/);
  const meta={title:m[1]||base,artist:m[1]?m[0]:'',cover:''};
  try{
    const src=await _resolveFileSrc(fdid);
    if(src){
      const b=await (await fetch(src)).blob();
      const tags=_id3Read(await b.slice(0,Math.min(b.size,2*1024*1024)).arrayBuffer());
      if(tags.title)meta.title=tags.title;if(tags.artist)meta.artist=tags.artist;
      if(tags.cover){const c=await _pxCoverJpeg(tags.cover);if(c)meta.cover=URL.createObjectURL(c);}
    }
  }catch(e){}
  _mmMeta[fdid]=meta;return meta;
}
const _mmChatTr=(msg,meta)=>({id:'ct_'+msg.id,src:'file',url:'',title:meta.title,artist:meta.artist,cover:meta.cover,fdid:msg.fileDataId,name:msg.fileInfo.name});
{const f=appendMsg;appendMsg=function(msg,container){
  const r=f.apply(this,arguments);
  try{
    if(msg&&msg.fileInfo&&msg.fileDataId&&_mmAudioRe.test(msg.fileInfo.name||'')){
      const c=container||$('msgs');
      const bub=c&&c.querySelector(`.msg[data-msg-id="${CSS.escape(String(msg.id))}"] .file-bub`);
      if(bub)_mmChatBub(bub,msg);
    }
  }catch(e){console.warn('[mm] bub',e);}
  return r;
};}
function _mmChatBub(bub,msg){
  const prog=bub.querySelector('.upload-progress');
  bub.className='mm-cb';bub.onclick=null;
  const id='ct_'+msg.id;
  bub.innerHTML=`<div class="mm-cb-row"><span class="mm-cb-cv"><span class="mm-cv-none">${_MM_ICO.note}</span></span>
      <div class="mm-cb-t"><b>${esc(String(msg.fileInfo.name).replace(/\.[^.]+$/,''))}</b><span>${esc(msg.fileInfo.size||'')}</span></div>
      <button class="mm-cb-pp" data-trplay="${esc(id)}">${_MM_ICO.play}</button></div>
    <div class="mm-cb-bar"><input type="range" min="0" max="1000" value="0" class="mm-cb-r"><span class="mm-cb-time">0:00</span></div>
    <div class="mm-cb-acts"><button class="mm-cb-ly">Текст</button><button class="mm-cb-add">${_MM_ICO.plus} В мою музыку</button></div>`;
  if(prog)bub.appendChild(prog);
  const tr={id,src:'file',url:'',title:'',artist:'',cover:''};
  _mmChatMeta(msg.fileDataId,msg.fileInfo.name).then(m=>{
    Object.assign(tr,{title:m.title,artist:m.artist,cover:m.cover});
    bub.querySelector('.mm-cb-t b').textContent=m.title;
    bub.querySelector('.mm-cb-t span').textContent=(m.artist||'')+(m.artist&&msg.fileInfo.size?' · ':'')+(msg.fileInfo.size||'');
    if(m.cover)bub.querySelector('.mm-cb-cv').innerHTML=`<img src="${esc(m.cover)}" alt="">`;
  });
  const ensure=async()=>{if(!tr.url){tr.url=await _resolveFileSrc(msg.fileDataId);if(!tr.url)throw new Error('Файл недоступен');}};
  bub.querySelector('.mm-cb-pp').onclick=async e=>{e.stopPropagation();try{await ensure();_mm.cur=null;await _pxPlay(tr,e.currentTarget);_mmChatHook();}catch(x){toast(x.message);}};
  bub.querySelector('.mm-cb-ly').onclick=async e=>{e.stopPropagation();try{await ensure();}catch(x){}_pxLyrics(tr);};
  bub.querySelector('.mm-cb-add').onclick=async e=>{e.stopPropagation();const b=e.currentTarget;if(b.disabled)return;b.disabled=true;
    try{await ensure();const blob=await (await fetch(tr.url)).blob();await _mmLoad();await _mmAddBlob(blob,msg.fileInfo.name);b.innerHTML=_MM_ICO.cloud+' В моей музыке';toast('Трек добавлен в «Мою музыку»');}
    catch(x){b.disabled=false;toast('Не удалось добавить: '+(x.message||''));}};
  const rg=bub.querySelector('.mm-cb-r');
  rg.oninput=e=>{e.stopPropagation();if(_pxAudio&&_pxAudioId===id&&isFinite(_pxAudio.duration))_pxAudio.currentTime=rg.value/1000*_pxAudio.duration;};
  rg.onclick=e=>e.stopPropagation();
  _pxBtns();
}
let _mmChatHooked=null;
function _mmChatHook(){
  if(!_pxAudio||_mmChatHooked===_pxAudio)return;_mmChatHooked=_pxAudio;
  _pxAudio.addEventListener('timeupdate',()=>{
    const id=String(_pxAudioId);if(!id.startsWith('ct_'))return;
    const b=document.querySelector(`.msg[data-msg-id="${CSS.escape(id.slice(3))}"] .mm-cb`);if(!b)return;
    const d=_pxAudio.duration,t=_pxAudio.currentTime;
    const rg=b.querySelector('.mm-cb-r');if(rg&&!rg.matches(':active')&&isFinite(d))rg.value=Math.round(t/d*1000);
    const tm=b.querySelector('.mm-cb-time');if(tm)tm.textContent=_rcFmt(t*1000)+(isFinite(d)?' / '+_rcFmt(d*1000):'');
  });
}

// ════════ Плейлист профиля: безлимит + треки из «Моей музыки» ════════
// В профиле трек из фонотеки — это найденная в каталоге версия (гости слушают отрывок),
// а владелец на своих устройствах слышит свой полный файл (поле lib — только в личных данных).
const _plFull={};    // owner → полный список (если больше 10)
function _plStrip(list){return (list||[]).map(t=>{const x={...t};delete x.lib;delete x.url2;return x;});}
{const f=_pxPublic;_pxPublic=function(){const d=f.apply(this,arguments);const pl=_pxMe().playlist||[];d.playlist=_plStrip(d.playlist);d.track=d.track?_plStrip([d.track])[0]:null;d.pln=pl.length;return d;};}
{const f=_pxOf;_pxOf=function(owner){
  const d=f.apply(this,arguments)||{};
  if(owner===myUsername){const pl=_pxMe().playlist||[];if(pl.length>10)return {...d,playlist:_plStrip(pl)};return d;}
  return _plFull[owner]?{...d,playlist:_plFull[owner]}:d;
};}
{const f=_pxPlaylist;_pxPlaylist=async function(owner){
  const p=_pxOf(owner);
  if(owner!==myUsername&&(p.pln||0)>(p.playlist||[]).length&&!_plFull[owner]){
    try{const d=await api('/plist?u='+encodeURIComponent(owner));if(d.list&&d.list.length)_plFull[owner]=d.list;}catch(e){}
  }
  return f.apply(this,arguments);
};}
// свой трек из фонотеки для записи профиля (по id совпадает с опубликованной)
const _plOwn=tr=>tr?(_pxMe().playlist||[]).find(x=>String(x.id)===String(tr.id)&&x.lib)||null:null;
function _plMine(tr){
  const own=_plOwn(tr);if(!own)return null;
  const n=v=>String(v||'').trim().toLowerCase();
  return _mmFind(own.lib)||_mm.list.find(x=>n(x.title)===n(own.title)&&n(x.artist)===n(own.artist))||null;
}
// lib в плейлисте — локальный id (трек ещё не долетел в облако) → меняем на облачный, чтобы нашли другие устройства
function _plRemap(){
  const pl=_pxMe().playlist||[];let ch=false;
  for(const e of pl){if(!e.lib)continue;const it=_mm.list.find(x=>x.id===e.lib&&x.cid);if(it){e.lib=it.cid;ch=true;}}
  for(const p of _pxMe().mmPl||[])p.tr=(p.tr||[]).map(t=>{const it=_mm.list.find(x=>x.id===t&&x.cid);if(it){ch=true;return it.cid;}return t;});
  if(ch){_pxSave(true);_plPush();}
}
{const f=_pxPlay;_pxPlay=async function(tr,btn){
  if(tr&&!tr.url&&(tr.src==='lib'||tr.lib||_plOwn(tr))){
    try{await _mmLoad();if(_plOwn(tr)&&!_plMine(tr))await _mmLoad(true);}catch(e){}
    const it=_plMine(tr)||(tr.lib?_mmFind(tr.lib):null);
    if(it){try{const t2={...tr,src:'file',url:await _mmSrc(it)};return await f.call(this,t2,btn);}catch(e){}}
    if(tr.src==='lib'){
      if(!tr.dz){toast('Этого трека нет в каталоге — отрывок недоступен');return;}
      try{return await f.call(this,{...tr,src:'file',url:await _dzPreview(tr.dz)},btn);}catch(e){toast('Не удалось включить отрывок');return;}
    }
  }
  return f.apply(this,arguments);
};}
{const f=_pxLyrics;_pxLyrics=async function(tr){
  if(tr&&!tr.url&&tr.src!=='file'&&_plOwn(tr)){try{await _mmLoad();if(!_plMine(tr))await _mmLoad(true);}catch(e){}const it=_plMine(tr);if(it){try{return await f.call(this,{...tr,src:'file',url:await _mmSrc(it)});}catch(e){}}}
  return f.apply(this,arguments);
};}
// запись плейлиста для трека из фонотеки: свой id (не сливается с отрывками), отрывок для гостей — dz
function _plEntry(it,hit,lib){return {id:'lib_'+Math.random().toString(36).slice(2,12),src:'lib',dz:hit?hit.id:null,title:it.title,artist:it.artist||(hit&&hit.artist)||'',cover:(hit&&hit.cover)||'',dur:it.dur||(hit&&hit.dur)||0,lib};}
// найти трек в каталоге (для отрывка гостям и обложки)
// поиск трека в каталоге: несколько запросов, сравнение по похожести (с транслитом: «Егор Крид» = «Egor Kreed»);
// берём только если совпали и название, и исполнитель — чтобы не подтянуть одноимённый чужой хит
const _TR={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
const _tl=s=>String(s||'').toLowerCase().replace(/[а-яё]/g,c=>_TR[c]??c).replace(/ee/g,'i').replace(/oo/g,'u').replace(/ph/g,'f').replace(/w/g,'v');
const _arts=a=>String(a||'').split(/\s*(?:,|&|\/|;|\bfeat\.?|\bft\.?|\bx\b|\bи\b|(?<!\S)и(?!\S))\s*/i).map(x=>_lrcClean(x)).filter(Boolean);
async function _plMatch(title,artist){
  const T=_lrcClean(title)||String(title||'').toLowerCase(),A=_arts(artist);
  const qs=[...new Set([(A[0]?A[0]+' ':'')+T,...A.slice(1).map(x=>x+' '+T),A[0]?`artist:"${A[0]}" track:"${T}"`:'',T].filter(Boolean))];
  const seen=new Map();let best=null;
  for(const q of qs){
    let r=[];try{r=await _dzSearch(q);}catch(e){}
    const withArt=A.length&&q!==T;
    for(const [i,x] of r.entries()){
      if(seen.has(x.id))continue;
      const ts=_lrcSim(_tl(_lrcClean(x.title)),_tl(T));
      const xa=_arts(x.artist);
      let as=A.length?Math.max(0,...A.flatMap(a=>xa.map(b=>_lrcSim(_tl(b),_tl(a))))):0.6;
      if(withArt&&i===0&&ts>=0.9)as=Math.max(as,0.55);   // фиты: каталог пишет только главного артиста, но по запросу с исполнителем трек первый
      const sc={x,ts,as,s:ts*0.6+as*0.4};seen.set(x.id,sc);
      if(ts>=0.7&&as>=0.5&&(!best||sc.s>best.s))best=sc;
    }
    if(best&&best.ts>=0.95&&best.as>=0.8)break;       // уверенно — хватит
  }
  return best?best.x:null;
}
async function _mmToProfile(ids){
  await _mmLoad();
  const p=_pxMe();const pl=p.playlist=p.playlist||[];
  let n=0;
  toast('Добавляем в профиль…');
  for(const id of ids){
    const it=_mmFind(id);if(!it)continue;
    const lib=it.cid||it.id;
    const hit=await _plMatch(it.title,it.artist);
    pl.push(_plEntry(it,hit,lib));
    n++;
  }
  p.track=pl[0]||null;
  _pxSave(true);_plPush();
  try{if(typeof _publishMyProfile==='function')_publishMyProfile();}catch(e){}
  toast(n?'В плейлисте профиля: '+pl.length:'Уже в профиле');
}
// полный список — на сервер (в самом профиле только первые 10)
let _plT=0;
function _plPush(){
  clearTimeout(_plT);
  _plT=setTimeout(()=>{if(typeof _apiToken==='function'&&_apiToken())api('/plist',{list:_plStrip(_pxMe().playlist||[])}).catch(()=>{});},800);
}
{const f=_spSaveCustom;_spSaveCustom=function(){const r=f.apply(this,arguments);_plPush();return r;};}

// ── в редакторе профиля: «Из моей музыки» и импорт списком ──
{const f=_pxEditHtml;_pxEditHtml=function(){
  return f.apply(this,arguments).replace('<button class="lm-btn primary" onclick="_pxPickFile()">Загрузить свой трек</button>',
    '<button class="lm-btn primary" onclick="_plFromLib()">Из моей музыки</button><button class="lm-btn" onclick="_plImport()">Импорт списком</button><button class="lm-btn" onclick="_pxPickFile()">Загрузить файл</button>')
    .replace('Первая песня видна в профиле с обложкой, остальные — в плейлисте (до 10).','Первая песня видна в профиле с обложкой, остальные — в плейлисте, без ограничения. Треки из «Моей музыки» ты слышишь целиком, гости — отрывком из каталога.');
};}
async function _plFromLib(){
  const l=await _mmLoad();
  if(!l.length){toast('В «Моей музыке» пока пусто — добавь треки в настройках');return;}
  const have=new Set((_pxDraft?.playlist||[]).map(x=>x.lib).filter(Boolean));
  _pxSheet(`<div class="px-sh-t">Из моей музыки</div><div class="mm-pick">${l.map(it=>`<label class="mm-tr"><input type="checkbox" value="${esc(it.id)}"${have.has(it.cid||it.id)?' checked disabled':''}>
      ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
      <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist)}</span></div></label>`).join('')}</div>
    <div class="mm-pick-bar"><button class="lm-btn" onclick="document.querySelectorAll('.mm-pick input:not(:disabled)').forEach(i=>i.checked=true)">Выбрать все</button>
      <button class="lm-btn primary" onclick="_plFromLibGo()">Добавить</button></div>`);
}
async function _plFromLibGo(){
  const ids=[...document.querySelectorAll('.mm-pick input:checked:not(:disabled)')].map(i=>i.value);
  _pxSheetClose();if(!ids.length)return;
  const d=_pxDraft;if(!d)return _mmToProfile(ids);
  const pl=d.playlist=d.playlist||[];
  toast('Ищем треки в каталоге…');
  for(const id of ids){
    const it=_mmFind(id);if(!it)continue;const lib=it.cid||it.id;let n=0;
    const hit=await _plMatch(it.title,it.artist);
    pl.push(_plEntry(it,hit,lib));
  }
  d.track=pl[0]||null;_pxEditPaint();_pxDirty();toast('Добавлено: '+ids.length);
}
function _plImport(){
  _pxSheet(`<div class="px-sh-t">Импорт списком</div>
    <div class="mm-imp-h">Вставь список песен — по одной в строке, «Исполнитель — Название». Например, скопируй из Спотифая или Яндекс Музыки.</div>
    <textarea class="lm-inp mm-imp" id="plImpIn" rows="8" placeholder="9mice — 2017&#10;Kai Angel — LIPSTICK"></textarea>
    <div class="mm-imp-st" id="plImpSt"></div>
    <button class="gift-send" id="plImpGo" onclick="_plImportGo()">Найти и добавить</button>`);
}
async function _plImportGo(){
  const lines=String($('plImpIn')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean).slice(0,300);
  if(!lines.length||!_pxDraft)return;
  const btn=$('plImpGo');if(btn)btn.disabled=true;
  const pl=_pxDraft.playlist=_pxDraft.playlist||[],miss=[];let ok=0;
  for(let i=0;i<lines.length;i++){
    const st=$('plImpSt');if(st)st.textContent=`Ищем ${i+1} из ${lines.length}…`;
    const m=lines[i].replace(/^\d+[.)]\s*/,'').split(/\s+[-–—]\s+/);
    const artist=m.length>1?m[0]:'',title=m.length>1?m.slice(1).join(' - '):m[0];
    const hit=await _plMatch(title,artist);
    if(hit&&!pl.some(x=>String(x.id)===String(hit.id))){pl.push(hit);ok++;}else if(!hit)miss.push(lines[i]);
  }
  _pxDraft.track=pl[0]||null;_pxEditPaint();_pxDirty();
  const st=$('plImpSt');if(st)st.innerHTML=`Добавлено: ${ok}`+(miss.length?`<br>Не нашли: ${miss.slice(0,20).map(esc).join(', ')}${miss.length>20?' …':''}`:'');
  if(btn)btn.disabled=false;
  if(!miss.length)setTimeout(_pxSheetClose,900);
}

// ════════ Семейный доступ: доверенные друзья слушают мою музыку ════════
const _mmFam={mine:[],withMe:[],max:5,of:{}};
async function _mmFamLoad(){
  try{const d=await api('/mm/shares');_mmFam.mine=d.mine||[];_mmFam.withMe=d.withMe||[];_mmFam.max=d.max||5;}catch(e){}
  _mmFamPaint();
}
const _mmAv=u=>peerAvatars[u]?`<img src="${esc(peerAvatars[u])}" alt="">`:_avHtml(u,peerNames[u]||u);
function _mmFamPaint(){
  const b=$('mmFam');if(!b)return;
  const mine=_mmFam.mine,wm=_mmFam.withMe;
  b.innerHTML=`<div class="mm-fam">${mine.map(u=>`<div class="mm-fam-p"><span class="mm-chat-av">${_mmAv(u)}</span><b>${esc(peerNames[u]||('@'+u))}</b>
      <button class="px-mini" title="Закрыть доступ" onclick="_mmFamSet('${esc(u)}',false)">${_MM_ICO.x}</button></div>`).join('')}
    ${mine.length<_mmFam.max?`<button class="mm-fam-add" onclick="_mmFamPick()">${_MM_ICO.plus} Добавить друга <span>${mine.length}/${_mmFam.max}</span></button>`:''}</div>
    ${wm.length?`<div class="mm-fam-sub">Со мной поделились</div>${wm.map(u=>`<div class="mm-chat" onclick="_spMusicOf('${esc(u)}')"><span class="mm-chat-av">${_mmAv(u)}</span><b>Музыка ${esc(peerNames[u]||('@'+u))}</b></div>`).join('')}`:''}`;
}
function _mmFamPick(){
  const peers=_mmChats().filter(c=>c!=='saved'&&!c.startsWith('g_')&&!_mmFam.mine.includes(c));
  _pxSheet(`<div class="px-sh-t">Семейный доступ</div>
    <div class="px-add"><input class="lm-inp" id="mmFamIn" placeholder="юзернейм друга" autocapitalize="none" onkeydown="if(event.key==='Enter')_mmFamSet(this.value,true)"><button class="lm-btn primary" onclick="_mmFamSet($('mmFamIn').value,true)">Добавить</button></div>
    <div class="mm-chats">${peers.slice(0,50).map(c=>`<div class="mm-chat" onclick="_mmFamSet('${esc(c)}',true)"><span class="mm-chat-av">${_mmAv(c)}</span><b>${esc(_mmChatName(c))}</b></div>`).join('')}</div>`);
}
async function _mmFamSet(u,on){
  u=String(u||'').trim().toLowerCase().replace(/^@/,'');if(!u)return;
  if(on&&!confirm(`Дать @${u} доступ ко всей твоей музыке?`))return;
  try{await api('/mm/share',{friend:u,on});_pxSheetClose();
    if(on){if(!_mmFam.mine.includes(u))_mmFam.mine.push(u);toast('@'+u+' теперь слушает твою музыку');}
    else{_mmFam.mine=_mmFam.mine.filter(x=>x!==u);toast('Доступ закрыт');}
    _mmFamPaint();
  }catch(e){toast(e.message||'Не получилось');}
}
// фонотека друга
function _spMusicOf(owner){
  _spPush('Музыка '+esc(peerNames[owner]||('@'+owner)),`<div class="mm-page">
    <div class="mm-top"><button class="wal-btn" data-mmsrc="fam:${esc(owner)}" onclick="_mmOfPlayAll('${esc(owner)}')">${_MM_ICO.play} Слушать</button>
      <button class="mm-ib mm-shuf${_mm.shuffle?' on':''}" onclick="_mmShufToggle()" title="Перемешивание">${_MM_ICO.shuffle}</button></div>
    <div class="sp-card mm-list" id="mmOfList"><div class="px-empty">Загрузка…</div></div></div>`);
  api('/mm/of?u='+encodeURIComponent(owner)).then(d=>{
    _mmFam.of[owner]=(d.tracks||[]).map(t=>({id:'f_'+t.id,cid:'',title:t.title,artist:t.artist,album:t.album,dur:t.dur,size:t.size,mime:t.mime,ts:t.ts,url:t.url,coverUrl:t.coverUrl,local:false,friend:owner}));
    _mmOfPaint(owner);
  }).catch(e=>{const l=$('mmOfList');if(l)l.innerHTML=`<div class="px-empty">${esc(e.message||'Не удалось загрузить')}</div>`;});
}
function _mmOfPaint(owner){
  const box=$('mmOfList');if(!box)return;const l=_mmFam.of[owner]||[];
  box.innerHTML=l.length?l.map(it=>`<div class="mm-tr" data-mm="${esc(it.id)}" onclick="_mm.src='fam:${esc(owner)}';_mmPlay('${esc(it.id)}',_mmFam.of['${esc(owner)}'].map(x=>x.id))">
      ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="" loading="lazy">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
      <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist||'Неизвестный исполнитель')}${it.dur?' · '+_rcFmt(it.dur*1000):''}</span></div>
      <button class="px-mini" title="Ещё" onclick="event.stopPropagation();_mmOfMenu('${esc(it.id)}')">${_MM_ICO.more}</button></div>`).join('')
    :'<div class="px-empty">Здесь пока пусто</div>';
  _mmPaintPlay();
}
function _mmOfPlayAll(owner){_mmSrcPlay('fam:'+owner,(_mmFam.of[owner]||[]).map(x=>x.id));}
function _mmOfMenu(id){
  const it=_mmFind(id);if(!it)return;
  _pxSheet(`<div class="mm-sh-hd">${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}<div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist)}</span></div></div>
    <div class="mm-acts"><button onclick="_pxSheetClose();_mmLyrics('${esc(id)}')">Текст песни</button>
      <button onclick="_pxSheetClose();_mmOfCopy('${esc(id)}')">Добавить в мою музыку</button></div>`);
}
async function _mmOfCopy(id){
  const it=_mmFind(id);if(!it)return;
  try{toast('Добавляем…');const b=await (await fetch(it.url)).blob();await _mmLoad();await _mmAddBlob(new Blob([b],{type:it.mime||b.type}),(it.artist?it.artist+' - ':'')+it.title+'.mp3');toast('Трек в твоей музыке');}
  catch(e){toast('Не удалось: '+(e.message||''));}
}
// друг открыл доступ — уведомление
{const f=_handleIncoming;_handleIncoming=function(pid,payload){
  if(payload&&payload.type==='mm_share'){toast((peerNames[pid]||('@'+pid))+' открыл(а) тебе свою музыку — Настройки → Моя музыка');if(!_mmFam.withMe.includes(pid))_mmFam.withMe.push(pid);_mmFamPaint();return;}
  return f.apply(this,arguments);
};}

// загрузка своих файлов в редакторе профиля — через «Мою музыку» (без лимита по числу)
_pxPickFile=function(){
  const i=document.createElement('input');i.type='file';i.multiple=true;i.accept='audio/*,.mp3,.m4a,.ogg,.flac,.wav,.opus';
  i.onchange=async()=>{
    const fs=[...(i.files||[])];if(!fs.length||!_pxDraft)return;
    const st=$('pxUpSt');const say=t=>{if(st){st.textContent=t;st.style.display=t?'':'none';}};
    await _mmLoad();
    const pl=_pxDraft.playlist=_pxDraft.playlist||[];let n=0;
    for(const f of fs){
      say('Добавляем '+(n+1)+' из '+fs.length+'…');
      try{const it=await _mmAddBlob(f,f.name);const hit=await _plMatch(it.title,it.artist);pl.push(_plEntry(it,hit,it.cid||it.id));n++;}
      catch(e){toast(f.name+': '+(e.message||'не удалось'));}
    }
    say('');_pxDraft.track=pl[0]||null;_pxEditPaint();_pxDirty();
    if(n)toast(n===1?'Трек добавлен — он же теперь в «Моей музыке»':'Добавлено треков: '+n);
  };
  i.click();
};

// фонотеку подгружаем сама после входа — чтобы свои треки в профиле сразу играли целиком
setTimeout(function _mmBoot(){if(!myUsername){setTimeout(_mmBoot,5000);return;}_mmLoad().catch(()=>{});},7000);

// ════════ Цвет караоке — по обложке трека ════════
// Берём самый насыщенный заметный цвет обложки и поднимаем яркость, чтобы читался на тёмном фоне.
const _covColC={};
function _covColor(src){
  if(!src)return Promise.resolve(null);
  if(_covColC[src])return _covColC[src];
  return _covColC[src]=new Promise(res=>{
    const img=new Image();img.crossOrigin='anonymous';
    img.onload=()=>{
      try{
        const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.drawImage(img,0,0,32,32);
        const d=x.getImageData(0,0,32,32).data,bins={};
        for(let i=0;i<d.length;i+=4){
          const [h,s,l]=_rgb2hsl(d[i],d[i+1],d[i+2]);
          if(l<.12||l>.92)continue;
          const k=Math.round(h*24)%24,w=s*s*(1-Math.abs(l-.5));
          const b=bins[k]||(bins[k]={k,w:0,h:0,s:0,n:0});b.w+=w;b.h+=h;b.s+=s;b.n++;
        }
        const best=Object.values(bins).sort((a,b)=>b.w-a.w)[0];
        if(!best||best.s/best.n<.12){res(null);return;}
        const h=best.k/24,s=Math.max(.5,Math.min(.9,best.s/best.n));
        res(`hsl(${Math.round(h*360)} ${Math.round(s*100)}% 62%)`);
      }catch(e){res(null);}
    };
    img.onerror=()=>res(null);img.src=src;
  });
}
function _rgb2hsl(r,g,b){
  r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;
  if(mx===mn)return [0,0,l];
  const d=mx-mn,s=l>.5?d/(2-mx-mn):d/(mx+mn);
  const h=mx===r?((g-b)/d+(g<b?6:0))/6:mx===g?((b-r)/d+2)/6:((r-g)/d+4)/6;
  return [h,s,l];
}
{const f=_pxLyrics;_pxLyrics=function(tr){
  const p=f.apply(this,arguments);
  {const k0=$('pxKara');if(k0)k0.style.setProperty('--kara','#ffffff');}
  if(tr&&tr.cover)_covColor(tr.cover).then(c=>{const k=$('pxKara');if(k&&c)k.style.setProperty('--kara',c);});
  return p;
};}

// ════════ Плейлисты в «Моей музыке» ════════
// Хранятся в личных данных профиля (px.mmPl) — синхронизируются между своими устройствами, другим не видны.
// Обложка плейлиста — обложка последнего добавленного трека.
const _mmPls=()=>{const p=_pxMe();return p.mmPl=p.mmPl||[];};
const _mmPlById=id=>_mmPls().find(p=>p.id===id);
const _mmPlItems=p=>(p.tr||[]).map(id=>_mm.list.find(x=>x.id===id||x.cid===id)).filter(Boolean);
function _mmPlCover(p,cls){
  const l=_mmPlItems(p),last=l[l.length-1];
  return last&&last.coverUrl?`<img class="${cls||''}" src="${esc(last.coverUrl)}" alt="">`:`<span class="mm-cv-none ${cls||''}">${_MM_ICO.note}</span>`;
}
function _mmPlSave(){_pxSave(true);}
function _mmPlsPaint(){
  const b=$('mmPls');if(!b)return;
  b.innerHTML=`<div class="mm-tr" onclick="_mmPlNew()"><span class="mm-cv-none mm-pl-new">${_MM_ICO.plus}</span><div class="mm-tr-t"><b>Создать плейлист</b><span>Можно сразу из списка песен</span></div></div>`
    +_mmPls().map(p=>`<div class="mm-tr" onclick="_spMusicPl('${esc(p.id)}')">${_mmPlCover(p)}<div class="mm-tr-t"><b>${esc(p.name)}</b><span>Плейлист · ${_mmPlItems(p).length} ${_mmPlural(_mmPlItems(p).length)}</span></div></div>`).join('');
}
function _mmPlNew(){
  _pxSheet(`<div class="px-sh-t">Новый плейлист</div>
    <input class="lm-inp mm-pl-name" id="mmPlName" placeholder="Название" maxlength="60">
    <div class="mm-imp-h">Можно сразу вставить список песен — «Исполнитель — Название» по строке (например, из Спотифая). Треки, которые уже есть в «Моей музыке», встанут в плейлист в этом порядке.</div>
    <textarea class="lm-inp mm-imp" id="mmPlList" rows="6" placeholder="9mice — 2017&#10;Kai Angel — LIPSTICK"></textarea>
    <div class="mm-imp-st" id="mmPlSt"></div>
    <button class="gift-send" onclick="_mmPlCreate()">Создать</button>`);
  setTimeout(()=>$('mmPlName')?.focus(),250);
}
const _mmNorm=v=>String(v||'').toLowerCase().replace(/\(.*?\)|\[.*?\]/g,'').replace(/[^a-zа-яё0-9]+/gi,' ').trim();
function _mmMatchLine(line){
  const m=line.replace(/^\d+[.)]\s*/,'').split(/\s+[-–—]\s+/);
  const artist=m.length>1?m[0]:'',title=_mmNorm(m.length>1?m.slice(1).join(' - '):m[0]),a=_mmNorm(String(artist).split(/,|&| x | feat/i)[0]);
  return _mm.list.find(x=>_mmNorm(x.title)===title&&(!a||_mmNorm(x.artist).includes(a)))||_mm.list.find(x=>_mmNorm(x.title)===title)||null;
}
async function _mmPlCreate(){
  const name=($('mmPlName')?.value||'').trim()||'Мой плейлист';
  const lines=String($('mmPlList')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);
  await _mmLoad();
  const tr=[],miss=[];
  for(const l of lines){const it=_mmMatchLine(l);if(it){const k=it.cid||it.id;if(!tr.includes(k))tr.push(k);}else miss.push(l);}
  const p={id:'p'+Date.now().toString(36),name,tr,ts:Date.now()};
  _mmPls().unshift(p);_mmPlSave();_mmPlsPaint();
  if(miss.length){const st=$('mmPlSt');if(st)st.innerHTML=`Добавлено: ${tr.length}. Нет в «Моей музыке» (${miss.length}): ${miss.slice(0,15).map(esc).join(', ')}${miss.length>15?' …':''}<br>Добавь эти файлы и потом нажми «Дособрать» в плейлисте.`;
    p.want=miss;_mmPlSave();setTimeout(()=>{_pxSheetClose();_spMusicPl(p.id);},2600);}
  else{_pxSheetClose();_spMusicPl(p.id);}
}
function _spMusicPl(id){
  const p=_mmPlById(id);if(!p)return;
  const page=_spPush(esc(p.name),`<div class="mm-page" id="mmPlPage" data-pl="${esc(id)}"></div>`);
  _mmPlPagePaint(id);
  return page;
}
function _mmPlPagePaint(id){
  const box=$('mmPlPage');if(!box||box.dataset.pl!==id)return;
  const p=_mmPlById(id);if(!p){box.innerHTML='<div class="px-empty">Плейлист удалён</div>';return;}
  const l=_mmPlItems(p);
  box.innerHTML=`<div class="mm-pl-hero">${_mmPlCover(p,'mm-pl-big')}<div class="mm-pl-name">${esc(p.name)}</div><div class="mm-pl-sub">${l.length} ${_mmPlural(l.length)}</div></div>
    <div class="mm-top"><button class="wal-btn" data-mmsrc="pl:${esc(id)}" onclick="_mmPlPlay('${esc(id)}')">${_MM_ICO.play} Слушать</button>
      <button class="mm-ib mm-shuf${_mm.shuffle?' on':''}" onclick="_mmShufToggle()" title="Перемешивание">${_MM_ICO.shuffle}</button>
      <button class="mm-ib" onclick="_mmPlMenu('${esc(id)}')" title="Ещё">${_MM_ICO.more}</button></div>
    <button class="mm-fam-add" onclick="_mmPlPickTracks('${esc(id)}')">${_MM_ICO.plus} Добавить треки</button>
    ${p.want&&p.want.length?`<button class="mm-fam-add" onclick="_mmPlRefill('${esc(id)}')">${_MM_ICO.plus} Дособрать из списка <span>ждут ${p.want.length}</span></button>`:''}
    <div class="sp-card mm-list">${l.length?l.map(it=>`<div class="mm-tr${_pxAudioId==='mm_'+it.id?' cur':''}" data-mm="${esc(it.id)}" onclick="_mm.src='pl:${esc(id)}';_mmPlay('${esc(it.id)}',_mmPlItems(_mmPlById('${esc(id)}')).map(x=>x.id))">
        ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="" loading="lazy">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
        <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist||'Неизвестный исполнитель')}${it.dur?' · '+_rcFmt(it.dur*1000):''}</span></div>
        <button class="px-mini" title="Убрать из плейлиста" onclick="event.stopPropagation();_mmPlRemove('${esc(id)}','${esc(it.cid||it.id)}')">${_MM_ICO.x}</button></div>`).join('')
      :'<div class="px-empty">Пусто. Добавляй треки через ⋮ → «Добавить в плейлист».</div>'}</div>`;
  _mmPaintPlay();
}
function _mmPlPlay(id){_mmSrcPlay('pl:'+id,_mmPlItems(_mmPlById(id)||{}).map(x=>x.id));}
function _mmPlRemove(id,t){
  const p=_mmPlById(id);if(!p)return;
  p.tr=(p.tr||[]).filter(x=>x!==t);
  const it=_mm.list.find(x=>x.id===t||x.cid===t);if(it)p.tr=p.tr.filter(x=>x!==it.id&&x!==it.cid);
  _mmPlSave();_mmPlPagePaint(id);_mmPlsPaint();
}
function _mmPlMenu(id){
  const p=_mmPlById(id);if(!p)return;
  _pxSheet(`<div class="mm-sh-hd">${_mmPlCover(p)}<div class="mm-tr-t"><b>${esc(p.name)}</b><span>Плейлист</span></div></div>
    <div class="mm-acts"><button onclick="_mmPlRename('${esc(id)}')">Переименовать</button>
      <button onclick="_pxSheetClose();_mmToProfile(_mmPlItems(_mmPlById('${esc(id)}')).map(x=>x.id))">Добавить всё в плейлист профиля</button>
      <button class="danger" onclick="_mmPlDelete('${esc(id)}')">Удалить плейлист</button></div>`);
}
function _mmPlRename(id){
  const p=_mmPlById(id);if(!p)return;
  const n=prompt('Название плейлиста',p.name);if(n==null)return;
  p.name=n.trim().slice(0,60)||p.name;_mmPlSave();_pxSheetClose();
  const hd=$('mmPlPage')?.closest('.sp-page')?.querySelector('.sp-tb-title');if(hd)hd.textContent=p.name;
  _mmPlPagePaint(id);_mmPlsPaint();
}
function _mmPlDelete(id){
  const p=_mmPlById(id);if(!p||!confirm(`Удалить плейлист «${p.name}»? Сами треки останутся в «Моей музыке».`))return;
  const pe=_pxMe();pe.mmPl=_mmPls().filter(x=>x.id!==id);_mmPlSave();_pxSheetClose();
  if($('mmPlPage'))_spPop();
  _mmPlsPaint();
}
function _mmPlAddPick(tid){
  const it=_mmFind(tid);if(!it)return;const k=it.cid||it.id;
  _pxSheet(`<div class="px-sh-t">Добавить в плейлист</div><div class="mm-pick">
    <div class="mm-tr" onclick="_mmPlAddNew('${esc(tid)}')"><span class="mm-cv-none mm-pl-new">${_MM_ICO.plus}</span><div class="mm-tr-t"><b>Новый плейлист</b></div></div>
    ${_mmPls().map(p=>`<div class="mm-tr" onclick="_mmPlAdd('${esc(p.id)}','${esc(tid)}')">${_mmPlCover(p)}<div class="mm-tr-t"><b>${esc(p.name)}</b><span>${(p.tr||[]).includes(k)?'Уже здесь':_mmPlItems(p).length+' '+_mmPlural(_mmPlItems(p).length)}</span></div></div>`).join('')}</div>`);
}
function _mmPlAdd(pid,tid){
  const p=_mmPlById(pid),it=_mmFind(tid);if(!p||!it)return;const k=it.cid||it.id;
  p.tr=(p.tr||[]).filter(x=>x!==k&&x!==it.id);p.tr.push(k);   // в конец — станет обложкой
  _mmPlSave();_pxSheetClose();_mmPlsPaint();toast('Добавлено в «'+p.name+'»');
}
function _mmPlAddNew(tid){
  const n=prompt('Название плейлиста','Мой плейлист');if(n==null)return;
  const p={id:'p'+Date.now().toString(36),name:n.trim().slice(0,60)||'Мой плейлист',tr:[],ts:Date.now()};
  _mmPls().unshift(p);_mmPlAdd(p.id,tid);
}
// треки из списка, которых не было, — дособираем, когда файлы добавлены
async function _mmPlRefill(id){
  const p=_mmPlById(id);if(!p||!p.want)return;
  await _mmLoad(true);
  const still=[];let n=0;
  for(const l of p.want){const it=_mmMatchLine(l);if(it){const k=it.cid||it.id;if(!p.tr.includes(k)){p.tr.push(k);n++;}}else still.push(l);}
  p.want=still;_mmPlSave();_mmPlPagePaint(id);_mmPlsPaint();
  toast(n?'Добавлено: '+n+(still.length?', ещё ждут '+still.length:''):'Новых совпадений нет — ждут '+still.length);
}

// добавить в плейлист сразу несколько треков из «Моей музыки»
async function _mmPlPickTracks(pid){
  const p=_mmPlById(pid);if(!p)return;
  await _mmLoad();
  if(!_mm.list.length){toast('В «Моей музыке» пока пусто');return;}
  const have=new Set(p.tr||[]),on=it=>have.has(it.cid)||have.has(it.id);
  const row=(it,d)=>`<div class="mm-tr mm-pk${d?' done':''}" data-id="${esc(it.id)}"${d?'':` onclick="_mmPlPickOne('${esc(pid)}',this)"`}>
      ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
      <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist)}</span></div>${d?'<i class="mm-pk-ok">уже добавлен</i>':`<span class="mm-pk-plus">${_MM_ICO.plus}</span>`}</div>`;
  _pxSheet(`<div class="px-sh-t">Добавить в «${esc(p.name)}»</div>
    <input class="lm-inp mm-q" placeholder="Поиск" oninput="const q=this.value.toLowerCase();document.querySelectorAll('.mm-pk').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none')">
    <div class="mm-pick mm-pick-w" id="mmPkList">${_mm.list.filter(x=>!on(x)).map(x=>row(x,false)).join('')}<div class="mm-pk-sep" id="mmPkSep">Уже в плейлисте</div>${_mm.list.filter(on).map(x=>row(x,true)).join('')}</div>`);
  $('pxSheet')?.querySelector('.px-sheet-card')?.classList.add('wide');
}
function _mmPlPickOne(pid,el){
  const p=_mmPlById(pid),it=_mmFind(el.dataset.id);if(!p||!it||el.classList.contains('evap'))return;
  const k=it.cid||it.id;p.tr=p.tr||[];if(!p.tr.includes(k)&&!p.tr.includes(it.id))p.tr.push(k);
  _mmPlSave();
  el.classList.add('evap');el.onclick=null;el.removeAttribute('onclick');
  setTimeout(()=>{
    el.classList.remove('evap');el.classList.add('done');
    el.querySelector('.mm-pk-plus')?.replaceWith(Object.assign(document.createElement('i'),{className:'mm-pk-ok',textContent:'уже добавлен'}));
    $('mmPkSep')?.insertAdjacentElement('afterend',el);
    _mmPlPagePaint(pid);_mmPlsPaint();
  },520);
}
// обложки для треков без обложки — из каталога по названию и исполнителю
const _mmCovMap=(()=>{try{return JSON.parse(localStorage.getItem('sl_mmcov')||'{}')||{};}catch(e){return {};}})();
let _mmCovBusy=false;
async function _mmCovFill(){
  if(_mmCovBusy)return;_mmCovBusy=true;
  try{
    let ch=false;
    for(const it of _mm.list){
      if(it.coverUrl)continue;
      const k=(it.artist+'|'+it.title).toLowerCase();
      const miss=_mmCovMap[k]===''||(typeof _mmCovMap[k]==='number'&&Date.now()-_mmCovMap[k]>864e5);
      if(_mmCovMap[k]===undefined||miss){
        const hit=await _plMatch(it.title,it.artist);
        _mmCovMap[k]=hit&&hit.cover?hit.cover:Date.now();
        try{localStorage.setItem('sl_mmcov',JSON.stringify(_mmCovMap));}catch(e){}
        await new Promise(r=>setTimeout(r,250));
      }
      if(typeof _mmCovMap[k]==='string'&&_mmCovMap[k]){it.coverUrl=_mmCovMap[k];ch=true;}
      if(it.local&&typeof _mmCovMap[k]==='string'&&_mmCovMap[k]){   // обложку — на устройство, чтобы была и без сети
        try{const rec=await _mmGetRec(it.id);if(rec&&!rec.cover){const r=await fetch(_mmCovMap[k]);if(r.ok){rec.cover=await r.blob();await _mmPutRec(rec);it.coverUrl=_mm.urls['c'+it.id]=URL.createObjectURL(rec.cover);}}}catch(e){}
      }
    }
    if(ch){_mmPaint();const pp=$('mmPlPage');if(pp)_mmPlPagePaint(pp.dataset.pl);}
  }catch(e){}
  _mmCovBusy=false;
}

// тексты всех треков — скачиваем заранее в фоне (фонотека + плейлист профиля), по одному, уже найденные пропускаем
let _lrcPfBusy=false;
async function _lrcPrefetchAll(){
  if(_lrcPfBusy||typeof _lrcFind!=='function')return;_lrcPfBusy=true;
  try{
    const list=[..._mm.list.map(x=>({title:x.title,artist:x.artist,dur:x.dur})),...(_pxMe().playlist||[]).map(x=>({title:x.title,artist:x.artist,dur:x.dur}))];
    const done=new Set();
    for(const t of list){
      const k=_lrcKey(t);if(!t.title||done.has(k))continue;done.add(k);
      const c=await _lrcGet(k);if(c&&(c.syncedLyrics||c.plainLyrics))continue;
      if(_lrcMiss[k]&&Date.now()-_lrcMiss[k]<864e5)continue;           // не нашли недавно — не долбим каждый раз
      const h=await _lrcFind(t).catch(()=>null);
      if(!h){_lrcMiss[k]=Date.now();try{localStorage.setItem('sl_lrcmiss',JSON.stringify(_lrcMiss));}catch(e){}}
      await new Promise(r=>setTimeout(r,300));
    }
  }catch(e){}
  _lrcPfBusy=false;
}
const _lrcMiss=(()=>{try{return JSON.parse(localStorage.getItem('sl_lrcmiss')||'{}')||{};}catch(e){return {};}})();

// все треки из облака — сразу на устройство (в фоне, по одному), чтобы играли без ожидания и без сети
let _mmSyncBusy=false;
async function _mmSyncAll(){
  if(_mmSyncBusy)return;_mmSyncBusy=true;
  try{
    try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
    const todo=_mm.list.filter(it=>!it.local&&it.url&&!it.friend);
    if(!todo.length){_mmSyncBusy=false;return;}
    toast('Скачиваем на устройство треков: '+todo.length);
    let done=0,i=0;
    const say=()=>_mmSay(done<todo.length?'Скачиваем музыку на устройство: '+done+' из '+todo.length:'');
    say();
    const worker=async()=>{while(i<todo.length){const it=todo[i++];await _mmCache(it);done++;say();}};
    await Promise.all([worker(),worker(),worker()]);   // по 3 одновременно
    if(done)toast('Музыка на устройстве: '+_mm.list.filter(x=>x.local).length+' из '+_mm.list.length);
    _mmSay('');
  }catch(e){}
  _mmSyncBusy=false;
}

// ════════ Системный плеер: положение трека (перемотка с экрана блокировки / Dynamic Island) ════════
let _msT=0;
function _msPos(force){
  if(!('mediaSession' in navigator)||!_pxAudio||!navigator.mediaSession.setPositionState)return;
  const now=Date.now();if(!force&&now-_msT<4000)return;_msT=now;
  const d=_pxAudio.duration;if(!isFinite(d)||!d)return;
  try{navigator.mediaSession.setPositionState({duration:d,position:Math.min(d,_pxAudio.currentTime||0),playbackRate:_pxAudio.playbackRate||1});}catch(e){}
}

// ════════ Телефон: плеер снизу + полноэкранный плеер ════════
const _mobPl=()=>matchMedia('(max-width:640px)').matches;
const _FP_ICO={
  down:'<svg viewBox="0 0 24 24"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>',
  dl:'<svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>',
  del:'<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm4 2v8h2v-8h-2zm4 0v8h2v-8h-2z"/></svg>',
  ok:'<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>'
};
function _mini(on){
  document.body.classList.toggle('mm-mini-on',!!on);   // место под плеер в ленте сообщений
  let m=$('mmMini');
  if(!on){if(m){m.classList.remove('show');clearTimeout(m._t);m._t=setTimeout(()=>{if(!m.classList.contains('show'))m.remove();},300);}return;}
  if(!m){m=document.createElement('div');m.id='mmMini';m.className='mm-mini';
    m.innerHTML=`<div class="mm-mini-cv"></div><div class="mm-mini-t"><b></b><span></span></div>
      <button class="mm-mini-pp" onclick="event.stopPropagation();_islToggle()"></button><div class="mm-mini-prog"><i></i></div>`;
    m.onclick=()=>_fpOpen();document.body.appendChild(m);requestAnimationFrame(()=>m.classList.add('show'));}
  clearTimeout(m._t);m.classList.add('show');
  const t=_islTr,pl=!_pxAudio.paused;
  if(m.dataset.id!==String(t.id)){m.dataset.id=String(t.id);
    m.querySelector('.mm-mini-cv').innerHTML=t.cover?`<img src="${esc(t.cover)}" alt="">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`;
    m.querySelector('b').textContent=t.title||'';m.querySelector('.mm-mini-t span').textContent=t.artist||'';}
  if(m.dataset.pl!==String(pl)){m.dataset.pl=String(pl);m.querySelector('.mm-mini-pp').innerHTML=pl?_MM_ICO.pause:_MM_ICO.play;}
  _miniPos();_miniProg();
  if($('mmFp'))_fpPaint();
}
function _miniProg(){const i=document.querySelector('#mmMini .mm-mini-prog i');if(i&&_pxAudio&&isFinite(_pxAudio.duration))i.style.transform='scaleX('+(_pxAudio.currentTime/_pxAudio.duration)+')';}
// над полем ввода, если открыт чат
function _miniPos(){
  const m=$('mmMini');if(!m)return;
  const r=document.querySelector('.inp-row');let b=12;
  if(r&&r.offsetParent!==null){const rc=r.getBoundingClientRect();if(rc.top<innerHeight&&rc.bottom>0)b=Math.max(12,innerHeight-rc.top+8);}
  const nv=document.querySelector('.mx-nav');if(nv&&nv.offsetParent!==null){const rc=nv.getBoundingClientRect();if(rc.top<innerHeight&&rc.bottom>0)b=Math.max(b,innerHeight-rc.top+8);}   // над навигацией музыки
  if(m._b!==b){m._b=b;m.style.bottom='calc('+b+'px + env(safe-area-inset-bottom))';}
}
setInterval(()=>{if($('mmMini'))_miniPos();},700);
addEventListener('resize',()=>{if(!_islTr)return;_isl();});

// ── полноэкранный плеер ──
let _fpLyOn=false,_fpLines=null,_fpIdx=-2,_fpKey='';
function _fpOpen(){
  if($('mmFp')||!_islTr)return;
  const w=document.createElement('div');w.id='mmFp';w.className='mm-fp';
  w.innerHTML=`<div class="fp-bg" id="fpBg"></div>
    <div class="fp-hd"><button class="fp-ib" onclick="_fpClose()" title="Свернуть">${_FP_ICO.down}</button><span>Сейчас играет</span><i></i></div>
    <div class="fp-stage"><div class="fp-cover" id="fpCover"></div><div class="fp-ly" id="fpLy"></div></div>
    <div class="fp-info"><b id="fpTitle"></b><span id="fpArtist"></span></div>
    <div class="fp-prog"><input type="range" id="fpR" min="0" max="1000" value="0" oninput="_islSeek(this.value)"><div><span id="fpT">0:00</span><span id="fpD">0:00</span></div></div>
    <div class="fp-ctl"><button onclick="_islStep(-1)">${_MM_ICO.prev}</button><button class="fp-pp" id="fpPP" onclick="_islToggle()"></button><button onclick="_islStep(1)">${_MM_ICO.next}</button></div>
    <div class="fp-row"><button class="fp-ib big" id="fpDl" onclick="_fpDl()"></button><button class="fp-ib big" id="fpLyB" onclick="_fpLyToggle()" title="Текст">${_MM_ICO.lyr}</button></div>`;
  document.body.appendChild(w);
  _fpLyOn=false;_fpKey='';_fpPaint();
  $('mmMini')?.classList.add('hid');
  requestAnimationFrame(()=>requestAnimationFrame(()=>w.classList.add('show')));
  _fpSwipe(w);
}
function _fpClose(){
  const w=$('mmFp');if(!w)return;
  w.style.transform='';w.classList.remove('show');$('mmMini')?.classList.remove('hid');
  setTimeout(()=>{if(!w.classList.contains('show'))w.remove();},480);
}
// свайп вниз — свернуть
function _fpSwipe(w){
  let y0=null,dy=0;
  w.addEventListener('touchstart',e=>{if(e.target.closest('input,.fp-ly'))return;y0=e.touches[0].clientY;dy=0;w.classList.add('drag');},{passive:true});
  w.addEventListener('touchmove',e=>{if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);w.style.transform='translateY('+dy+'px)';},{passive:true});
  w.addEventListener('touchend',()=>{if(y0==null)return;y0=null;w.classList.remove('drag');if(dy>110)_fpClose();else w.style.transform='';});
}
function _fpPaint(){
  const w=$('mmFp'),t=_islTr;if(!w||!t)return;
  const key=String(t.id);
  if(_fpKey!==key){
    _fpKey=key;_fpLines=null;_fpIdx=-2;
    $('fpCover').innerHTML=t.cover?`<img src="${esc(t.cover)}" alt="">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`;
    $('fpTitle').textContent=t.title||'';$('fpArtist').textContent=t.artist||'';
    $('fpBg').style.background='';w.style.setProperty('--kara','#ffffff');
    if(t.cover)_covColor(t.cover).then(c=>{
      if(_fpKey!==key||!c)return;const m=c.match(/hsl\((\d+) (\d+)%/);if(!m)return;const h=m[1],sa=Math.min(80,+m[2]);
      $('fpBg').style.background=`radial-gradient(120% 70% at 50% 18%,hsl(${h} ${sa}% 38%) 0%,hsl(${h} ${sa}% 20%) 45%,hsl(${h} ${Math.round(sa/2)}% 8%) 100%)`;
      w.style.setProperty('--kara',c);
    });
    if(_fpLyOn)_fpLyLoad();
  }
  const pp=$('fpPP'),pl=_pxAudio&&!_pxAudio.paused;
  if(pp&&pp.dataset.pl!==String(pl)){pp.dataset.pl=String(pl);pp.innerHTML=pl?_MM_ICO.pause:_MM_ICO.play;}
  _fpDlPaint();_fpProg();
}
// «Скачать» / «Удалить»: трек из моей музыки — на устройство и обратно; трек из чата — в мою музыку
function _fpDlKind(){
  const t=_islTr;if(!t)return null;
  if(t.mm){const it=_mmFind(t.mm);if(!it||it.friend)return null;return {it,local:!!it.local};}
  if(String(t.id).startsWith('ct_'))return {chat:true};
  return null;
}
function _fpDlPaint(){
  const b=$('fpDl');if(!b)return;const k=_fpDlKind();
  b.style.visibility=k?'':'hidden';if(!k)return;
  const st=k.chat?'dl':k.local?'del':'dl';
  if(b.dataset.st!==st){b.dataset.st=st;b.innerHTML=st==='del'?_FP_ICO.del:_FP_ICO.dl;b.title=st==='del'?'Удалить с устройства':'Скачать';}
}
async function _fpDl(){
  const k=_fpDlKind(),b=$('fpDl');if(!k||!b||b.classList.contains('busy'))return;
  b.classList.add('busy');
  try{
    if(k.chat){
      const t=_islTr,blob=await (await fetch(t.url)).blob();await _mmLoad();await _mmAddBlob(blob,(t.artist?t.artist+' - ':'')+(t.title||'track')+'.mp3');
      b.innerHTML=_FP_ICO.ok;b.dataset.st='ok';toast('Трек в «Моей музыке»');
    }else if(k.local){
      const it=k.it;
      if(!it.cid){if(!confirm('Этот трек есть только на этом устройстве. Удалить его совсем?'))throw 0;await _mmDelete(it.id);}
      else{await _mmDelRec(it.id).catch(()=>{});it.local=false;it.url=it.url||_mm.base&&(_mm.base+it.cid)||'';
        if(!it.url){await _mmLoad(true);}toast('Удалено с устройства — осталось в облаке');}
    }else{toast('Скачиваем…');await _mmCache(k.it);toast(k.it.local?'Скачано на устройство':'Не удалось скачать');}
  }catch(e){if(e)toast(e.message||'Не получилось');}
  b.classList.remove('busy');_fpDlPaint();_mmPaint();
}
function _fpProg(){
  const w=$('mmFp');if(!w||!_pxAudio)return;const d=_pxAudio.duration,t=_pxAudio.currentTime;
  const r=$('fpR');if(r&&!r.matches(':active')&&isFinite(d)&&d){r.value=Math.round(t/d*1000);r.style.setProperty('--p',(r.value/10)+'%');}
  const a=$('fpT');if(a)a.textContent=_rcFmt(t*1000);const b=$('fpD');if(b)b.textContent=isFinite(d)?_rcFmt(d*1000):'';
  if(_fpLyOn)_fpLyTick();
}
// ── текст на месте обложки ──
function _fpLyToggle(){
  const w=$('mmFp');if(!w)return;
  _fpLyOn=!_fpLyOn;w.classList.toggle('ly',_fpLyOn);$('fpLyB')?.classList.toggle('on',_fpLyOn);
  if(_fpLyOn)_fpLyLoop();
  if(_fpLyOn){if(!_fpLines)_fpLyLoad();else{_fpIdx=-2;_fpLyTick(true);}}
}
function _fpOff(){   // сдвиг: полный трек — 0, отрывок — если подстраивали в караоке
  const t=_islTr;if(!t)return null;if(t.src==='file'&&!String(t.url||'').includes('dzcdn'))return 0;
  try{const v=localStorage.getItem('sl_kofs_'+(t.dz||t.id));return v==null?null:+v;}catch(e){return null;}
}
async function _fpLyLoad(){
  const box=$('fpLy'),t=_islTr,key=_fpKey;if(!box||!t)return;
  box.innerHTML='<div class="fp-ly-msg">Ищем текст…</div>';
  const hit=await _lrcFind(t).catch(()=>null);
  if(_fpKey!==key||!$('fpLy'))return;
  if(!hit){box.innerHTML='<div class="fp-ly-msg">Текст не найден</div>';_fpLines=[];return;}
  if(hit.syncedLyrics){_fpLines=_lrcParse(hit.syncedLyrics);
    box.innerHTML='<div class="fp-ly-pad"></div>'+_fpLines.map((l,i)=>`<div class="fp-kl${l.text?'':' gap'}" data-i="${i}" onclick="_fpLine(${i})">${l.text?esc(l.text):'♪'}</div>`).join('')+'<div class="fp-ly-pad"></div>';}
  else{_fpLines=[];box.innerHTML=String(hit.plainLyrics||'').split('\n').map(l=>`<div class="fp-kl plain">${esc(l)||'&nbsp;'}</div>`).join('');}
  _fpIdx=-2;_fpLyTick(true);
}
function _fpLyTick(jump){
  const box=$('fpLy');if(!box||!_fpLines||!_fpLines.length||!_pxAudio)return;
  const off=_fpOff();if(off==null)return;
  const tl=_pxAudio.currentTime+off,L=_fpLines;let i=-1;
  for(let k=0;k<L.length;k++){if(L[k].t<=tl)i=k;else break;}
  if(i!==_fpIdx){
    _fpIdx=i;
    box.querySelectorAll('.fp-kl').forEach(el=>{const n=+el.dataset.i;el.classList.toggle('past',n<i);el.classList.toggle('cur',n===i);});
    const cur=box.querySelector('.fp-kl.cur')||box.querySelector('.fp-kl');
    if(cur&&!(box._u&&Date.now()-box._u<3000))box.scrollTo({top:cur.offsetTop-box.clientHeight*0.36,behavior:jump?'instant':'smooth'});
  }
  if(i>=0){const cur=box.querySelector('.fp-kl.cur');if(cur){const nx=(L[i+1]?.t)??(L[i].t+4);cur.style.setProperty('--kp',(Math.max(0,Math.min(1,(tl-L[i].t)/Math.max(.3,nx-L[i].t)))*100).toFixed(1)+'%');}}
}
function _fpLine(i){
  if(!_fpLines||!_fpLines[i]||!_pxAudio)return;
  const off=_fpOff();
  if(off===0){_pxAudio.currentTime=_fpLines[i].t;}
  else{const t=_islTr;const v=_fpLines[i].t-_pxAudio.currentTime;try{localStorage.setItem('sl_kofs_'+(t.dz||t.id),v.toFixed(2));}catch(e){}}
  _fpIdx=-2;_fpLyTick();
}
document.addEventListener('touchmove',e=>{const b=e.target.closest&&e.target.closest('#fpLy');if(b)b._u=Date.now();},{passive:true});
document.addEventListener('wheel',e=>{const b=e.target.closest&&e.target.closest('#fpLy');if(b)b._u=Date.now();},{passive:true});

// ════════ Android: системный плеер (шторка, экран блокировки) через SlonMedia (APK 1.6.4+) ════════
const _NM=()=>typeof IS_NATIVE!=='undefined'&&IS_NATIVE&&window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.SlonMedia;
let _nmKey='',_nmLis=false;
async function _nmCoverOf(src){
  if(!src)return '';if(/^(https?:|data:)/.test(src))return src;
  try{const b=await (await fetch(src)).blob();return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.onerror=()=>r('');f.readAsDataURL(b);});}catch(e){return '';}
}
async function _nmSync(){
  const P=_NM();if(!P)return;
  if(!_nmLis){_nmLis=true;
    try{P.addListener('media',e=>{const a=e&&e.action;
      if(a==='play')_pxAudio&&_pxAudio.play().catch(()=>{});else if(a==='pause')_pxAudio&&_pxAudio.pause();
      else if(a==='next')_islStep(1);else if(a==='prev')_islStep(-1);
      else if(a==='seek'&&_pxAudio)_pxAudio.currentTime=(e.pos||0)/1000;else if(a==='stop')_islClose();});}catch(e){}}
  const t=_islTr;
  if(!t||!_pxAudio||String(_pxAudioId)!==String(t.id)){if(_nmKey){_nmKey='';P.stop().catch(()=>{});}return;}
  const k=String(t.id);let cover;
  if(k!==_nmKey){_nmKey=k;cover=await _nmCoverOf(t.cover);}
  const d=_pxAudio.duration;
  P.update(Object.assign({title:t.title||'',artist:t.artist||'',playing:!_pxAudio.paused,pos:Math.round((_pxAudio.currentTime||0)*1000),dur:isFinite(d)?Math.round(d*1000):0},cover!==undefined?{cover}:{})).catch(()=>{});
}

// ════════ Android: музыка играет нативным плеером (Media3/ExoPlayer, APK 1.6.7+) ════════
// Весь интерфейс (остров, плеер снизу, полноэкранный, текст) работает с _pxAudio — подставляем ему
// «нативную обёртку» с тем же поведением (play/pause/currentTime/duration/события), а звук и очередь
// плейлиста живут в системном плеере Android: его видят шторка, экран блокировки и острова оболочек
// (ColorOS, HyperOS, OriginOS, MagicOS, HarmonyOS); следующий трек включается сам при погашенном экране.
// Треки, которых ещё нет в облаке (только на этом устройстве), и треки из чатов играют как раньше.
const _NPL=()=>typeof IS_NATIVE!=='undefined'&&IS_NATIVE&&window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.SlonPlayer;
let _webAudio=null,_npLis=false;const _npBad=new Set();
const _npa={
  _on:{},_st:{playing:false,want:false,pos:0,dur:0,id:''},_stT:Date.now(),_ids:[],
  onplay:null,onpause:null,onended:null,playbackRate:1,volume:1,muted:false,src:'native',
  get paused(){return !this._st.want;},
  get currentTime(){return (this._st.pos+(this._st.playing?Date.now()-this._stT:0))/1000;},
  set currentTime(v){const P=_NPL();if(P)P.seek({pos:Math.max(0,Math.round(v*1000))}).catch(()=>{});this._st.pos=v*1000;this._stT=Date.now();this._fire('seeked');this._fire('timeupdate');},
  get duration(){return this._st.dur?this._st.dur/1000:(_mm.cur&&_mm.cur.dur)||NaN;},
  play(){const P=_NPL();if(P)P.play().catch(()=>{});this._st.want=true;this._fire('play');return Promise.resolve();},
  pause(){const P=_NPL();if(P)P.pause().catch(()=>{});this._st.want=false;this._fire('pause');},
  addEventListener(e,f){(this._on[e]=this._on[e]||[]).push(f);},
  removeEventListener(e,f){this._on[e]=(this._on[e]||[]).filter(x=>x!==f);},
  _fire(e){for(const f of this._on[e]||[])try{f({type:e});}catch(x){}const h=this['on'+e];if(typeof h==='function')try{h({type:e});}catch(x){}}
};
_npa.onplay=_npa.onpause=_npa.onended=()=>{try{_pxBtns();}catch(e){}};
// ссылка на трек для нативного плеера: облако (своё или друга) — да; только на устройстве — нет
function _npUrl(it){
  if(!it||_npBad.has(it.id))return null;
  if(it.url&&/^https?:/.test(it.url))return it.url;
  if(it.cid&&_mm.base)return _mm.base+it.cid;
  return null;
}
function _npCover(it){
  if(!it)return '';
  if(/^https?:/.test(it.coverUrl||''))return it.coverUrl;
  return _npCovC[it.id]||'';
}
const _npCovC={};
// обложки с устройства (blob:) → маленький JPEG 256px в data: (Media3 берёт картинку прямо из данных трека)
async function _npCoversPrep(items){
  await Promise.all(items.map(async it=>{
    if(!it||_npCovC[it.id]||!it.coverUrl||/^https?:/.test(it.coverUrl))return;
    try{
      const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=it.coverUrl;});
      const k=256/Math.max(img.naturalWidth,img.naturalHeight,1),c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(img.naturalWidth*Math.min(1,k)));c.height=Math.max(1,Math.round(img.naturalHeight*Math.min(1,k)));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);_npCovC[it.id]=c.toDataURL('image/jpeg',.82);
    }catch(e){}
  }));
}
function _npListen(){
  const P=_NPL();if(!P||_npLis)return;_npLis=true;
  P.addListener('state',st=>{
    const was=_npa._st,idCh=st.id&&st.id!==was.id;
    const pred=_npa.currentTime*1000;
    if(!idCh&&st.playing&&was.playing&&Math.abs(pred-st.pos)<600)st=Object.assign({},st,{pos:pred+(st.pos-pred)*0.25});
    _npa._st=st;_npa._stT=Date.now();
    if(_pxAudio!==_npa)return;
    if(idCh){                                           // натив сам перешёл к другому треку
      const it=_mmFind(st.id);
      if(it){const tr=_mmTr(it);tr.url=_npUrl(it)||'';_mm.cur=tr;_islTr=tr;_pxAudioId=tr.id;_mm.qi=_mm.queue.indexOf(it.id);
        _npa._fire('loadedmetadata');_isl();_mmPaint();
        if($('pxKara')&&typeof _kr!=='undefined'&&_kr&&_kr.tr&&_kr.tr.mm!==it.id)_pxLyrics(tr);}
    }
    if(!!st.want!==!!was.want)_npa._fire(st.want?'play':'pause');
    if(st.ended&&!was.ended)_npa._fire('ended');
    _npa._fire('timeupdate');
  });
  P.addListener('error',e=>{                             // нет сети и трек не скачан — пробуем с устройства
    const it=e&&_mmFind(e.id);if(!it)return;
    _npBad.add(it.id);
    if(it.local){toast('Нет сети — включаю с устройства');_mmPlay(it.id,_mm.queue);}
    else toast('Трек не скачан на устройство — нужна сеть');
  });
  P.addListener('cached',e=>{
    if(!e||!e.ok)return;const it=_mm.list.find(x=>_npUrl(x)===e.url);if(it&&!it.ncached){it.ncached=true;_mm._npDone=(_mm._npDone||0)+1;_npSayProg();_mmPaint();}
  });
}
// запуск списка (плейлист, моя музыка, фонотека друга)
{const f=_mmPlay;_mmPlay=async function(id,list){
  const P=_NPL();
  const ids=list||(_mm.queue.includes(id)?_mm.queue:_mmFiltered().map(x=>x.id));
  const items=P?ids.map(x=>_mmFind(x)).filter(Boolean):[];
  const ok=P&&items.length&&items.every(x=>_npUrl(x));
  if(!ok){
    if(_pxAudio===_npa){try{P&&P.pause();}catch(e){}_pxAudio=_webAudio;}
    return f.apply(this,arguments);
  }
  _npListen();
  const it=_mmFind(id);if(!it)return;
  if(!_mm.fromHist&&_mm.cur&&_mm.cur.mm&&_mm.cur.mm!==id){_mm.hist.push(_mm.cur.mm);if(_mm.hist.length>200)_mm.hist.shift();}
  _mm.fromHist=false;
  if(list&&_mm.src==null)_mm.src='lib';
  _mm.queue=ids;_mm.qi=ids.indexOf(id);
  if(_pxAudio===_npa&&_npa._st.id===it.id&&_npa._ids.join()===ids.join()){if(_npa.paused)_npa.play();else _npa.pause();return;}
  if(_pxAudio&&_pxAudio!==_npa){try{_pxAudio.pause();}catch(e){}_webAudio=_pxAudio;}
  _pxAudio=_npa;_mmHook();
  const tr=_mmTr(it);tr.url=_npUrl(it);_mm.cur=tr;_islTr=tr;_pxAudioId=tr.id;
  _npa._ids=ids;_npa._st=Object.assign({},_npa._st,{id:it.id,pos:0,dur:(it.dur||0)*1000,want:true,playing:false});_npa._stT=Date.now();
  if($('pxKara')){const lp=_pxLyrics(tr);$('pxKara')?.classList.add('swap');await Promise.race([lp,new Promise(r=>setTimeout(r,12000))]);}
  await _npCoversPrep(items);
  await P.setQueue({items:items.map(x=>({id:x.id,url:_npUrl(x),title:x.title||'',artist:x.artist||'',cover:_npCover(x)})),
    index:ids.indexOf(id),pos:0,play:true,shuffle:!!_mm.shuffle,repeat:'off'}).catch(e=>toast('Плеер: '+(e.message||e)));
  _npa._fire('play');_isl();_mmBar();_mmPaint();
};}
// назад / вперёд / перемешивание / стоп — командами нативному плееру
{const f=_mmStep;_mmStep=function(d){
  const P=_NPL();
  if(P&&_pxAudio===_npa){
    (d>0?P.next():P.prev()).then(()=>P.play()).catch(()=>{});
    _npa._st=Object.assign({},_npa._st,{want:true});_npa._fire('play');
    return;
  }
  return f.apply(this,arguments);
};}
{const f=_mmShufToggle;_mmShufToggle=function(){const r=f.apply(this,arguments);const P=_NPL();if(P&&_pxAudio===_npa)P.setShuffle({on:!!_mm.shuffle}).catch(()=>{});return r;};}
{const f=_islClose;_islClose=function(){const P=_NPL();if(P&&_pxAudio===_npa){P.stop().catch(()=>{});_pxAudio=_webAudio;}return f.apply(this,arguments);};}
// другой звук (трек из чата, отрывок в профиле) — нативный плеер на паузу, дальше играет браузер
{const f=_pxPlay;_pxPlay=async function(){
  const P=_NPL();
  if(P&&_pxAudio===_npa){try{P.pause();}catch(e){}_pxAudio=_webAudio;}
  return f.apply(this,arguments);
};}
// старое «зеркало» плеера в шторке не нужно, когда играет настоящий нативный плеер
{const f=_nmSync;_nmSync=async function(){
  if(_NPL()&&_pxAudio===_npa){const M=_NM();if(M&&_nmKey){_nmKey='';M.stop().catch(()=>{});}return;}
  return f.apply(this,arguments);
};}
// без сети: в приложении треки скачиваются в кеш нативного плеера (а не в IndexedDB — без дублей на телефоне)
function _npSayProg(){const n=_mm._npTodo||0,d=_mm._npDone||0;_mmSay(n&&d<n?'Скачиваем музыку на устройство: '+d+' из '+n:'');}
{const f=_mmSyncAll;_mmSyncAll=async function(){
  const P=_NPL();if(!P)return f.apply(this,arguments);
  _npListen();
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
  const urls=_mm.list.filter(x=>!x.friend).map(_npUrl).filter(Boolean);if(!urls.length)return;
  let have=[];try{have=(await P.cached({urls})).urls||[];}catch(e){}
  const hs=new Set(have);for(const it of _mm.list)if(hs.has(_npUrl(it)))it.ncached=true;
  const todo=urls.filter(u=>!hs.has(u));_mm._npTodo=todo.length;_mm._npDone=0;
  if(todo.length){toast('Скачиваем на устройство треков: '+todo.length);_npSayProg();P.cache({urls:todo}).catch(()=>{});}
  _mmPaint();
};}
{const f=_mmStatus;_mmStatus=function(it){
  if(_NPL()&&it&&it.ncached&&_mm.up[it.id]==null)return `<span class="mm-st ok" title="На устройстве">${_MM_ICO.cloud}</span>`;
  return f.apply(this,arguments);
};}

// текст в полноэкранном плеере обновляется каждый кадр — заливка строки плавная, строки не запаздывают
let _fpRaf=0;
function _fpLyLoop(){
  cancelAnimationFrame(_fpRaf);
  const step=()=>{if(!_fpLyOn||!$('mmFp'))return;try{_fpLyTick();}catch(e){}_fpRaf=requestAnimationFrame(step);};
  _fpRaf=requestAnimationFrame(step);
}
