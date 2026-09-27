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
    const b=await (await fetch(it.url)).blob();
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
  if(list){_mm.queue=list;_mm.qi=list.indexOf(id);}
  else if(!_mm.queue.includes(id)){_mm.queue=_mmFiltered().map(x=>x.id);_mm.qi=_mm.queue.indexOf(id);}
  else _mm.qi=_mm.queue.indexOf(id);
  if(_pxAudio&&_pxAudioId==='mm_'+id){if(_pxAudio.paused)_pxAudio.play().catch(()=>{});else _pxAudio.pause();return;}
  try{const tr=_mmTr(it);tr.url=await _mmSrc(it);_mm.cur=tr;await _pxPlay(tr,null);_mmHook();}
  catch(e){toast(e.message||'Не удалось включить');}
  _mmBar();_mmPaint();
}
function _mmToggle(){if(!_pxAudio||!_mm.cur)return;if(_pxAudio.paused)_pxAudio.play().catch(()=>{});else _pxAudio.pause();}
function _mmStep(d){
  if(!_mm.queue.length)return;
  if(d<0&&_pxAudio&&_pxAudio.currentTime>4){_pxAudio.currentTime=0;return;}
  const i=_mm.qi+d;if(i<0||i>=_mm.queue.length){if(d>0){_pxAudio?.pause();}return;}
  _mmPlay(_mm.queue[i],_mm.queue);
}
function _mmShuffle(){const ids=_mmFiltered().map(x=>x.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}if(ids.length)_mmPlay(ids[0],ids);}
let _mmHooked=null;
function _mmHook(){
  if(!_pxAudio||_mmHooked===_pxAudio)return;_mmHooked=_pxAudio;
  _pxAudio.addEventListener('ended',()=>{if(String(_pxAudioId).startsWith('mm_'))_mmStep(1);});
  ['play','pause','ended'].forEach(ev=>_pxAudio.addEventListener(ev,()=>{_mmBar();_mmPaintPlay();}));
  _pxAudio.addEventListener('timeupdate',_mmBarProg);
  if('mediaSession' in navigator){
    try{navigator.mediaSession.setActionHandler('nexttrack',()=>_mmStep(1));navigator.mediaSession.setActionHandler('previoustrack',()=>_mmStep(-1));}catch(e){}
  }
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
  if(!_pxAudio)return;const d=_pxAudio.duration,t=_pxAudio.currentTime;
  const r=$('islR');if(r&&!r.matches(':active')&&isFinite(d)&&d)r.value=Math.round(t/d*1000);
  const a=$('islT');if(a)a.textContent=_rcFmt(t*1000);const b=$('islD');if(b)b.textContent=isFinite(d)?_rcFmt(d*1000):'';
  const r2=$('islR');if(r2)r2.style.setProperty('--p',(r2.value/10)+'%');
}
function _islSeek(v){if(_pxAudio&&isFinite(_pxAudio.duration)){_pxAudio.currentTime=v/1000*_pxAudio.duration;_islProg();}}
function _islToggle(){if(!_pxAudio)return;if(_pxAudio.paused)_pxAudio.play().catch(()=>{});else _pxAudio.pause();}
function _islStep(d){if(_islQueue())_mmStep(d);else if(_pxAudio){_pxAudio.currentTime=d<0?0:(_pxAudio.duration||0);}}
function _islOutside(e){if(_islOpen&&!e.target.closest('#slIsl,#pxKara')){_islOpen=false;_isl();}}
function _islClose(){_islOpen=false;_pxAudio?.pause();try{_pxAudio.currentTime=0;}catch(e){}_islTr=null;_mm.cur=null;_isl();_mmPaintPlay();_pxBtns();}
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
  }catch(e){console.warn('[mm] sp',e);}
  return r;
};}
function _spMusic(){
  const page=_spPush('Моя музыка',`<div class="mm-page">
    <div class="mm-top">
      <button class="wal-btn" onclick="_mmPick()">${_MM_ICO.plus} Добавить треки</button>
      <button class="mm-ib" onclick="_mmShuffle()" title="Перемешать">${_MM_ICO.shuffle}</button>
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
  box.innerHTML=l.length?l.map(it=>`<div class="mm-tr${_pxAudioId==='mm_'+it.id?' cur':''}" data-mm="${esc(it.id)}" onclick="_mmPlay('${esc(it.id)}')">
      ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="" loading="lazy">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
      <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist||'Неизвестный исполнитель')}${it.dur?' · '+_rcFmt(it.dur*1000):''}</span></div>
      ${_mmStatus(it)}
      <button class="px-mini" onclick="event.stopPropagation();_mmMenu('${esc(it.id)}')" title="Ещё">${_MM_ICO.more}</button></div>`).join('')
    :`<div class="px-empty">${_mm.list.length?'Ничего не нашли':'Здесь пока пусто. Добавь свои mp3 — они будут на всех твоих устройствах.'}</div>`;
  _mmPaintPlay();
}
function _mmRowUp(id){const s=document.querySelector(`.mm-tr[data-mm="${CSS.escape(id)}"] .mm-st`);if(s&&_mm.up[id]!=null)s.textContent=_mm.up[id]+'%';}
function _mmPaintPlay(){document.querySelectorAll('.mm-tr').forEach(r=>r.classList.toggle('cur',_pxAudioId==='mm_'+r.dataset.mm&&_pxAudio&&!_pxAudio.paused));}
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
async function _plMatch(title,artist){
  const norm=s=>String(s||'').toLowerCase().replace(/\(.*?\)|\[.*?\]/g,'').replace(/[^a-zа-яё0-9]+/gi,' ').trim();
  try{
    const r=await _dzSearch((artist?artist+' ':'')+title);
    const nt=norm(title),na=norm(String(artist).split(/,|&| x | feat/i)[0]);
    return r.find(x=>norm(x.title)===nt&&(!na||norm(x.artist).includes(na)))||r.find(x=>norm(x.title).includes(nt)||nt.includes(norm(x.title)))||null;
  }catch(e){return null;}
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
    <div class="mm-top"><button class="wal-btn" onclick="_mmOfPlayAll('${esc(owner)}',false)">${_MM_ICO.play} Слушать</button>
      <button class="mm-ib" onclick="_mmOfPlayAll('${esc(owner)}',true)" title="Перемешать">${_MM_ICO.shuffle}</button></div>
    <div class="sp-card mm-list" id="mmOfList"><div class="px-empty">Загрузка…</div></div></div>`);
  api('/mm/of?u='+encodeURIComponent(owner)).then(d=>{
    _mmFam.of[owner]=(d.tracks||[]).map(t=>({id:'f_'+t.id,cid:'',title:t.title,artist:t.artist,album:t.album,dur:t.dur,size:t.size,mime:t.mime,ts:t.ts,url:t.url,coverUrl:t.coverUrl,local:false,friend:owner}));
    _mmOfPaint(owner);
  }).catch(e=>{const l=$('mmOfList');if(l)l.innerHTML=`<div class="px-empty">${esc(e.message||'Не удалось загрузить')}</div>`;});
}
function _mmOfPaint(owner){
  const box=$('mmOfList');if(!box)return;const l=_mmFam.of[owner]||[];
  box.innerHTML=l.length?l.map(it=>`<div class="mm-tr" data-mm="${esc(it.id)}" onclick="_mmPlay('${esc(it.id)}',_mmFam.of['${esc(owner)}'].map(x=>x.id))">
      ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="" loading="lazy">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
      <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist||'Неизвестный исполнитель')}${it.dur?' · '+_rcFmt(it.dur*1000):''}</span></div>
      <button class="px-mini" title="Ещё" onclick="event.stopPropagation();_mmOfMenu('${esc(it.id)}')">${_MM_ICO.more}</button></div>`).join('')
    :'<div class="px-empty">Здесь пока пусто</div>';
  _mmPaintPlay();
}
function _mmOfPlayAll(owner,shuf){
  const ids=(_mmFam.of[owner]||[]).map(x=>x.id);if(!ids.length)return;
  if(shuf)for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  _mmPlay(ids[0],ids);
}
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
    <div class="mm-top"><button class="wal-btn" onclick="_mmPlPlay('${esc(id)}',false)">${_MM_ICO.play} Слушать</button>
      <button class="mm-ib" onclick="_mmPlPlay('${esc(id)}',true)" title="Перемешать">${_MM_ICO.shuffle}</button>
      <button class="mm-ib" onclick="_mmPlMenu('${esc(id)}')" title="Ещё">${_MM_ICO.more}</button></div>
    <button class="mm-fam-add" onclick="_mmPlPickTracks('${esc(id)}')">${_MM_ICO.plus} Добавить треки</button>
    ${p.want&&p.want.length?`<button class="mm-fam-add" onclick="_mmPlRefill('${esc(id)}')">${_MM_ICO.plus} Дособрать из списка <span>ждут ${p.want.length}</span></button>`:''}
    <div class="sp-card mm-list">${l.length?l.map(it=>`<div class="mm-tr${_pxAudioId==='mm_'+it.id?' cur':''}" data-mm="${esc(it.id)}" onclick="_mmPlay('${esc(it.id)}',_mmPlItems(_mmPlById('${esc(id)}')).map(x=>x.id))">
        ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="" loading="lazy">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
        <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist||'Неизвестный исполнитель')}${it.dur?' · '+_rcFmt(it.dur*1000):''}</span></div>
        <button class="px-mini" title="Убрать из плейлиста" onclick="event.stopPropagation();_mmPlRemove('${esc(id)}','${esc(it.cid||it.id)}')">${_MM_ICO.x}</button></div>`).join('')
      :'<div class="px-empty">Пусто. Добавляй треки через ⋮ → «Добавить в плейлист».</div>'}</div>`;
  _mmPaintPlay();
}
function _mmPlPlay(id,shuf){
  const ids=_mmPlItems(_mmPlById(id)||{}).map(x=>x.id);if(!ids.length)return;
  if(shuf)for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  _mmPlay(ids[0],ids);
}
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
  const have=new Set(p.tr||[]);
  if(!_mm.list.length){toast('В «Моей музыке» пока пусто');return;}
  _pxSheet(`<div class="px-sh-t">Добавить в «${esc(p.name)}»</div>
    <input class="lm-inp mm-q" placeholder="Поиск" oninput="const q=this.value.toLowerCase();document.querySelectorAll('.mm-pick .mm-tr').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none')">
    <div class="mm-pick">${_mm.list.map(it=>{const on=have.has(it.cid)||have.has(it.id);return `<label class="mm-tr"><input type="checkbox" value="${esc(it.id)}"${on?' checked disabled':''}>
      ${it.coverUrl?`<img src="${esc(it.coverUrl)}" alt="">`:`<span class="mm-cv-none">${_MM_ICO.note}</span>`}
      <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist)}</span></div></label>`;}).join('')}</div>
    <div class="mm-pick-bar"><button class="lm-btn" onclick="document.querySelectorAll('.mm-pick input:not(:disabled)').forEach(i=>{if(i.closest('.mm-tr').style.display!=='none')i.checked=true})">Выбрать все</button>
      <button class="lm-btn primary" onclick="_mmPlPickGo('${esc(pid)}')">Добавить</button></div>`);
}
function _mmPlPickGo(pid){
  const p=_mmPlById(pid);if(!p)return;
  const ids=[...document.querySelectorAll('.mm-pick input:checked:not(:disabled)')].map(i=>i.value);
  p.tr=p.tr||[];
  for(const id of ids){const it=_mmFind(id);if(!it)continue;const k=it.cid||it.id;if(!p.tr.includes(k)&&!p.tr.includes(it.id))p.tr.push(k);}
  _mmPlSave();_pxSheetClose();_mmPlPagePaint(pid);_mmPlsPaint();
  if(ids.length)toast('Добавлено: '+ids.length);
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
      if(_mmCovMap[k]===undefined){
        const hit=await _plMatch(it.title,it.artist);
        _mmCovMap[k]=hit&&hit.cover?hit.cover:'';
        try{localStorage.setItem('sl_mmcov',JSON.stringify(_mmCovMap));}catch(e){}
        await new Promise(r=>setTimeout(r,250));
      }
      if(_mmCovMap[k]){it.coverUrl=_mmCovMap[k];ch=true;}
    }
    if(ch){_mmPaint();const pp=$('mmPlPage');if(pp)_mmPlPagePaint(pp.dataset.pl);}
  }catch(e){}
  _mmCovBusy=false;
}
