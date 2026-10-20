// ════════ Музыка: новый интерфейс (медиатека, поиск, главная, плейлист, плеер) ════════
// Раскладка по мотивам современных музыкальных приложений: снизу — Главная / Поиск / Медиатека,
// в медиатеке чипсы «Все / Плейлисты / Исполнители / Альбомы / Треки», любимые треки, исполнители и альбомы
// собираются из тегов своих треков. Логика (плеер, облако, плейлисты) — в music.js.

const _MX_ICO={
  home:'<svg viewBox="0 0 24 24"><path d="M12 3 3 10.5V21h6.5v-6h5v6H21V10.5z"/></svg>',
  search:'<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
  lib:'<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>',
  heartO:'<svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>',
  dl:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm1-12h-2v5H8l4 4 4-4h-3z"/></svg>',
  dlOk:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8z"/></svg>',
  repeat:'<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z"/></svg>',
  repeat1:'<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2zm-4-2V9h-1l-2 1v1h1.5v4z"/></svg>',
  queue:'<svg viewBox="0 0 24 24"><path d="M3 6h12v2H3zm0 4h12v2H3zm0 4h8v2H3zm14-4v6.18A3 3 0 1 0 19 19V12h3v-2z"/></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75zm17.7-10.2a1 1 0 0 0 0-1.42l-2.33-2.33a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75z"/></svg>',
  lyrics:'<svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-5 14H7v-2h7zm3-4H7v-2h10zm0-4H7V7h10z"/></svg>',
  imp:'<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7zM5 18v2h14v-2z"/></svg>'
};
const _mxS={tab:'lib',chip:'all',q:'',edit:false};

// ── любимые, недавние, повтор ──
const _mxLikes=()=>{const p=_pxMe();return p.mmLikes=p.mmLikes||[];};
const _mxKey=it=>it?(it.cid||it.id):'';
const _mxLiked=it=>!!it&&_mxLikes().some(k=>k===it.cid||k===it.id);
function _mxLike(id){
  const it=_mmFind(id);if(!it)return;const k=_mxKey(it),L=_mxLikes();
  const i=L.findIndex(x=>x===it.cid||x===it.id);
  if(i>=0){L.splice(i,1);toast('Убрано из любимых');}else{L.unshift(k);toast('Добавлено в любимые');}
  _pxSave(true);_mxRefresh();_fpExtraPaint();
  if(window._fbDb&&typeof window._fbSet==='function'&&myUsername){
    try{window._fbSet(window._fbRef(window._fbDb,'user_music_likes/'+myUsername),L);}catch(e){}
  }
}
function _mxLikedItems(){return _mxLikes().map(k=>_mm.list.find(x=>x.id===k||x.cid===k)).filter(Boolean);}
const _mxRecentGet=()=>{try{return JSON.parse(localStorage.getItem('sl_mm_recent_'+myUsername)||'[]');}catch(e){return [];}};
function _mxRecentAdd(it){
  if(!it)return;const k=_mxKey(it);let r=_mxRecentGet().filter(x=>x!==k);r.unshift(k);r=r.slice(0,24);
  try{localStorage.setItem('sl_mm_recent_'+myUsername,JSON.stringify(r));}catch(e){}
  if(window._fbDb&&typeof window._fbSet==='function'&&myUsername){
    try{window._fbSet(window._fbRef(window._fbDb,'user_music_recent/'+myUsername),r);}catch(e){}
  }
}
function _mxSyncRecentFb(){
  if(!window._fbDb||typeof window._fbOnValue!=='function'||!myUsername)return;
  window._fbOnValue(window._fbRef(window._fbDb,'user_music_recent/'+myUsername),snap=>{
    const val=snap.val();
    if(Array.isArray(val)&&val.length){
      try{localStorage.setItem('sl_mm_recent_'+myUsername,JSON.stringify(val));}catch(e){}
      if(typeof _mxS!=='undefined'&&_mxS.tab==='home'&&$('mxBody'))_mxRefresh();
    }
  });
  window._fbOnValue(window._fbRef(window._fbDb,'user_music_likes/'+myUsername),snap=>{
    const val=snap.val();
    if(Array.isArray(val)){
      const p=_pxMe();if(p){p.mmLikes=val;_pxSave(false);if(typeof _mxS!=='undefined'&&_mxS.tab==='home'&&$('mxBody'))_mxRefresh();}
    }
  });
}
setTimeout(_mxSyncRecentFb,2500);
_mm.repeat=(()=>{try{return localStorage.getItem('sl_mm_rep')||'off';}catch(e){return 'off';}})();
function _mxRepeat(){
  _mm.repeat=_mm.repeat==='off'?'all':_mm.repeat==='all'?'one':'off';
  try{localStorage.setItem('sl_mm_rep',_mm.repeat);}catch(e){}
  const P=typeof _NPL==='function'&&_NPL();if(P&&_pxAudio===_npa)P.setRepeat({mode:_mm.repeat}).catch(()=>{});
  toast(_mm.repeat==='off'?'Повтор выключен':_mm.repeat==='all'?'Повтор списка':'Повтор трека');_fpExtraPaint();
}
{const f=_mmStep;_mmStep=function(d){
  const nat=typeof _NPL==='function'&&_NPL()&&_pxAudio===_npa;
  if(!nat&&d>0&&_pxAudio){
    if(_mm.repeat==='one'&&_pxAudio.ended){_pxAudio.currentTime=0;_pxAudio.play().catch(()=>{});return;}
    if(_mm.repeat==='all'&&!_mm.shuffle&&_mm.qi>=_mm.queue.length-1&&_mm.queue.length){_mmPlay(_mm.queue[0],_mm.queue);return;}
  }
  return f.apply(this,arguments);
};}
{const f=_mmPlay;_mmPlay=async function(id){_mxRecentAdd(_mmFind(id));const r=await f.apply(this,arguments);
  const P=typeof _NPL==='function'&&_NPL();if(P&&_pxAudio===_npa&&_mm.repeat!=='off')P.setRepeat({mode:_mm.repeat}).catch(()=>{});
  _fpExtraPaint();return r;};}

// ── исполнители и альбомы — из тегов своих треков ──
const _mxArtistOf=it=>String(it.artist||'').split(/\s*(?:,|&|\/|;|\bfeat\.?|\bft\.?|\bx\b)\s*/i)[0].trim()||'Неизвестный исполнитель';
// ключ группы: одно и то же имя в тегах бывает записано по-разному — невидимые символы, неразрывный пробел,
// латинская X вместо кириллической Х, регистр («королевский XVII» ×2) — сводим к одному виду
const _MX_LOOK={а:'a',в:'b',е:'e',ё:'e',к:'k',м:'m',н:'h',о:'o',р:'p',с:'c',т:'t',у:'y',х:'x'};
const _mxGKey=s=>String(s||'').normalize('NFKC').replace(/[​-‏⁠﻿­]/g,'').replace(/\s+/g,' ').trim().toLowerCase().replace(/[авеёкмнорстух]/g,c=>_MX_LOOK[c]);
function _mxGroups(kind){
  const m=new Map();
  for(const it of _mm.list){if(it.friend)continue;
    const name=(kind==='artist'?_mxArtistOf(it):String(it.album||'')).replace(/[​-‏⁠﻿­]/g,'').replace(/\s+/g,' ').trim();if(!name)continue;
    const k=_mxGKey(name);
    if(!m.has(k))m.set(k,{names:{},items:[]});const g=m.get(k);g.items.push(it);g.names[name]=(g.names[name]||0)+1;}
  // показываем самое частое написание
  return [...m.values()].map(g=>{const name=Object.entries(g.names).sort((a,b)=>b[1]-a[1])[0][0];
    return {name,items:g.items,cover:(g.items.find(x=>x.coverUrl)||{}).coverUrl||''};}).sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name));
}
const _mxCv=(url,cls)=>url?`<img class="${cls||''}" src="${esc(url)}" alt="" loading="lazy">`:`<span class="mm-cv-none ${cls||''}">${_MM_ICO.note}</span>`;
const _mxN=n=>n+' '+_mmPlural(n);

// ── страница «Медиатека» с нижней навигацией ──
_spMusic=function(){
  const page=_spPush('Музыка',`<div class="mx" id="mxRoot"><div class="mx-body" id="mxBody"></div>
    <nav class="mx-nav">${[['home','Главная'],['search','Поиск'],['lib','Медиатека']].map(([k,t])=>`<button data-t="${k}" onclick="_mxTab('${k}')">${_MX_ICO[k]}<span>${t}</span></button>`).join('')}</nav></div>`,
    {right:`<button class="sp-tb-btn" onclick="_mmPlNew()" title="Создать плейлист">${_MM_ICO.plus}</button>`});
  page.classList.add('mx-page');
  _mxS.edit=false;_mxTab('home');
  _mmFamLoad();
  _mmLoad(true).then(()=>_mxRefresh()).catch(()=>{});
  return page;
};
function _mxTab(t){
  _mxS.tab=t;
  document.querySelectorAll('.mx-nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  const hd=$('mxRoot')?.closest('.sp-page')?.querySelector('.sp-tb-title');
  if(hd)hd.textContent=t==='home'?'Главная':t==='search'?'Поиск':'Медиатека';
  _mxRefresh();
  $('mxBody')?.scrollTo(0,0);
}
function _mxRefresh(){
  const b=$('mxBody');if(!b)return;
  if(_mxS.tab==='home')b.innerHTML=_mxHome();
  else if(_mxS.tab==='search'){if(!b.querySelector('#mxQ')){b.innerHTML=_mxSearchHtml();}_mxSearchRun();}
  else b.innerHTML=_mxLib();
  if(_mxS.tab==='lib'&&_mxS.chip==='tracks'){_mmPaint();_mmFamPaint();}
  _mmPaintPlay();_mmPlayBtns&&_mmPlayBtns();
}
// карточки
const _mxCard=(on,cv,title,sub,extra)=>`<div class="mx-card" onclick="${on}">${cv}<div class="mx-card-t"><b>${esc(title)}</b><span>${sub}</span></div>${extra||''}</div>`;
function _mxLib(){
  const chips=[['all','Все'],['pl','Плейлисты'],['art','Исполнители'],['alb','Альбомы'],['tracks','Треки']];
  let h=`<div class="mx-chips">${chips.map(([k,t])=>`<button class="${_mxS.chip===k?'on':''}" onclick="_mxChipGo('${k}')">${t}</button>`).join('')}</div>`;
  const c=_mxS.chip;
  if(c==='all'||c==='pl'){
    if(c==='all')h+=`<div class="mx-imp" onclick="_mxImport()"><div><b>Импортировать треки</b><span>Свои файлы и плейлист списком из Спотифая или Яндекс Музыки</span></div>${_MX_ICO.imp}</div>`;
    h+=`<div class="mx-card mx-liked" onclick="_mxOpenLiked()"><div class="mx-card-t"><b>Любимые треки</b><span>${_mxN(_mxLikedItems().length)}</span></div><span class="mx-liked-cv">${_MX_ICO.heart}</span></div>`;
    if(c==='pl')h+=_mxCard('_mmPlNew()',`<span class="mm-cv-none mm-pl-new">${_MM_ICO.plus}</span>`,'Создать плейлист','Можно сразу из списка песен');
    h+=_mmPls().map(p=>_mxCard(`_spMusicPl('${esc(p.id)}')`,_mmPlCover(p),p.name,'Плейлист · '+_mxN(_mmPlItems(p).length))).join('');
  }
  if(c==='all'||c==='art'){
    const A=_mxGroups('artist');
    h+=A.slice(0,c==='all'?12:500).map(g=>_mxCard(`_mxOpenGroup('artist',${esc(JSON.stringify(g.name)).replace(/"/g,'&quot;')})`,_mxArtCv(g),g.name,'Исполнитель · '+_mxN(g.items.length))).join('');
  }
  if(c==='alb'){
    const A=_mxGroups('album');
    h+=A.length?A.map(g=>_mxCard(`_mxOpenGroup('album',${esc(JSON.stringify(g.name)).replace(/"/g,'&quot;')})`,_mxCv(g.cover),g.name,'Альбом · '+esc(_mxArtistOf(g.items[0])))).join(''):'<div class="px-empty">Альбомы берутся из тегов треков — у твоих треков их пока нет</div>';
  }
  if(c==='tracks'){
    h+=`<div class="mm-top"><button class="wal-btn" onclick="_mmPick()">${_MM_ICO.plus} Добавить треки</button>
        <button class="mm-ib mm-shuf${_mm.shuffle?' on':''}" onclick="_mmShufToggle()" title="Перемешивание">${_MM_ICO.shuffle}</button></div>
      <div class="mm-say" id="mmSay" style="display:none"></div>
      <input class="lm-inp mm-q" id="mmQ" placeholder="Поиск по моей музыке" value="${esc(_mm.q||'')}" oninput="_mm.q=this.value;_mmPaint()">
      <div class="mm-cloud" id="mmCloud"></div>
      <div class="sp-card mm-list" id="mmList"></div>
      <div class="sp-sec mm-fam-h">Семейный доступ</div>
      <div class="sp-card sp-pad" id="mmFam"></div>
      <div class="sp-hint">Близкие друзья (до 20 человек) могут слушать всю твою музыку целиком.</div>`;
  }
  if(!_mm.list.length&&c!=='tracks')h+=`<div class="mx-empty">${_MM_ICO.note}<b>Здесь будет твоя музыка</b><span>Добавь свои треки — они будут на всех твоих устройствах, с текстом и без интернета.</span><button class="wal-btn" onclick="_mmPick()">${_MM_ICO.plus} Добавить треки</button></div>`;
  return h;
}
function _mxImport(){
  _pxSheet(`<div class="px-sh-t">Импорт музыки</div><div class="mm-acts">
    <button onclick="_pxSheetClose();_mmPick()">Добавить файлы с устройства</button>
    <button onclick="_pxSheetClose();_mmPlNew()">Плейлист списком (из Спотифая, Яндекс Музыки)</button></div>
    <div class="mm-imp-h" style="margin-top:10px">Скопируй список песен «Исполнитель — Название» — SLON соберёт плейлист в том же порядке из твоих треков, а недостающие подтянутся, когда добавишь файлы.</div>`);
}
// ── главная ──
function _mxHome(){
  const rec=_mxRecentGet().map(k=>_mm.list.find(x=>x.id===k||x.cid===k)).filter(Boolean);
  const h0=new Date().getHours(),hi=h0<5?'Доброй ночи':h0<12?'Доброе утро':h0<18?'Добрый день':'Добрый вечер';
  let h=`<div class="mx-hi">${hi}</div>`;
  if(!_mm.list.length)return h+`<div class="mx-empty">${_MM_ICO.note}<b>Добавь свою музыку</b><span>Файлы с устройства — с текстом, обложками и без интернета.</span><button class="wal-btn" onclick="_mmPick()">${_MM_ICO.plus} Добавить треки</button></div>`;
  const pls=_mmPls();
  h+=`<div class="mx-grid">`+[{on:'_mxOpenLiked()',cv:`<span class="mx-liked-cv sm">${_MX_ICO.heart}</span>`,t:'Любимые треки'},
    ...pls.slice(0,5).map(p=>({on:`_spMusicPl('${esc(p.id)}')`,cv:_mmPlCover(p),t:p.name}))]
    .map(x=>`<div class="mx-tile" onclick="${x.on}">${x.cv}<b>${esc(x.t)}</b></div>`).join('')+`</div>`;
  h+=_slonWaveHomeCard();
  if(rec.length)h+=`<div class="mx-h2">Недавно слушал</div><div class="mx-row">${rec.slice(0,12).map(it=>`<div class="mx-sq" onclick="_mm.src='lib';_mmPlay('${esc(it.id)}',_mxRecentGet().map(k=>(_mm.list.find(x=>x.id===k||x.cid===k)||{}).id).filter(Boolean))">${_mxCv(it.coverUrl)}<b>${esc(it.title)}</b><span>${esc(it.artist)}</span></div>`).join('')}</div>`;
  const A=_mxGroups('artist');
  if(A.length)h+=`<div class="mx-h2">Твои исполнители</div><div class="mx-row">${A.slice(0,12).map(g=>`<div class="mx-sq art" onclick="_mxOpenGroup('artist',${esc(JSON.stringify(g.name)).replace(/"/g,'&quot;')})">${_mxArtCv(g)}<b>${esc(g.name)}</b></div>`).join('')}</div>`;
  const fresh=_mm.list.slice(0,12);
  h+=`<div class="mx-h2">Недавно добавлены</div><div class="mx-row">${fresh.map(it=>`<div class="mx-sq" onclick="_mm.src='lib';_mmPlay('${esc(it.id)}',_mm.list.map(x=>x.id))">${_mxCv(it.coverUrl)}<b>${esc(it.title)}</b><span>${esc(it.artist)}</span></div>`).join('')}</div>`;
  return h;
}
// ── поиск ──
const _mxRq=()=>{try{return JSON.parse(localStorage.getItem('sl_mm_rq')||'[]');}catch(e){return [];}};
function _mxSearchHtml(){return `<div class="mx-sbox">${_MX_ICO.search}<input id="mxQ" placeholder="Треки, исполнители, плейлисты" value="${esc(_mxS.q)}" oninput="_mxS.q=this.value;clearTimeout(_mxS.t);_mxS.t=setTimeout(_mxSearchRun,250)"></div><div id="mxRes"></div>`;}
async function _mxSearchRun(){
  const box=$('mxRes');if(!box)return;const q=_mxS.q.trim().toLowerCase();
  if(!q){const r=_mxRq();box.innerHTML=r.length?`<div class="mx-h2">Недавно искали</div>`+r.map((x,i)=>`<div class="mm-tr" onclick="_mxS.q=${esc(JSON.stringify(x)).replace(/"/g,'&quot;')};$('mxQ').value=_mxS.q;_mxSearchRun()">${_mxCv('')}<div class="mm-tr-t"><b>${esc(x)}</b><span>Запрос</span></div><button class="px-mini" onclick="event.stopPropagation();_mxRqDel(${i})">${_MM_ICO.x}</button></div>`).join(''):'<div class="px-empty">Ищи по своей музыке и по каталогу</div>';return;}
  const tr=_mm.list.filter(x=>(x.title+' '+x.artist+' '+x.album).toLowerCase().includes(q)).slice(0,40);
  const ar=_mxGroups('artist').filter(g=>g.name.toLowerCase().includes(q)).slice(0,8);
  const pl=_mmPls().filter(p=>p.name.toLowerCase().includes(q));
  let h='';
  if(ar.length){
    const topAr=ar[0];
    const topTracks=topAr.items.map(x=>x.id);
    const topTracksJ=esc(JSON.stringify(topTracks)).replace(/"/g,'&quot;');
    h+=`<div class="mx-h2">Исполнитель</div>
      <div class="mx-art-card-featured" onclick="_mxRqAdd();_mxOpenGroup('artist',${esc(JSON.stringify(topAr.name)).replace(/"/g,'&quot;')})">
        <div class="mx-art-feat-av">${_mxArtCv(topAr)}</div>
        <div class="mx-art-feat-info">
          <div class="mx-art-feat-badge">Исполнитель</div>
          <div class="mx-art-feat-name">${esc(topAr.name)}</div>
          <div class="mx-art-feat-meta">${_mxN(topAr.items.length)} в медиатеке · нажми для профиля</div>
        </div>
        <button class="mx-art-feat-play" onclick="event.stopPropagation();_mxRqAdd();_mm.src='artist:${esc(topAr.name)}';_mmPlay('${esc(topAr.items[0].id)}',${topTracksJ})" title="Слушать">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        </button>
      </div>`;
    if(ar.length>1){
      h+=`<div class="mx-h2" style="font-size:13px;opacity:0.8;margin-top:4px">Другие исполнители</div>`+ar.slice(1).map(g=>_mxCard(`_mxRqAdd();_mxOpenGroup('artist',${esc(JSON.stringify(g.name)).replace(/"/g,'&quot;')})`,_mxArtCv(g),g.name,'Исполнитель · '+_mxN(g.items.length))).join('');
    }
  }
  if(pl.length)h+=`<div class="mx-h2">Плейлисты</div>`+pl.map(p=>_mxCard(`_mxRqAdd();_spMusicPl('${esc(p.id)}')`,_mmPlCover(p),p.name,'Плейлист · '+_mxN(_mmPlItems(p).length))).join('');
  if(tr.length)h+=`<div class="mx-h2">Мои треки</div>`+tr.map(it=>_mxTrRow(it,`_mxRqAdd();_mm.src='lib';_mmPlay('${esc(it.id)}',${esc(JSON.stringify(tr.map(x=>x.id))).replace(/"/g,'&quot;')})`)).join('');
  h+=`<div class="mx-h2">Треки</div><div id="mxHm"><div class="px-empty">Поиск треков…</div></div>`;
  box.innerHTML=h||'<div class="px-empty">Ничего не нашли</div>';
  _mmPaintPlay();
  const my=_mxS.q;

  // Поиск треков: полные треки без цензуры, прослушивание и добавление в медиатеку
  if(typeof _hmSearch==='function'){
    _hmSearch(my).then(tracks=>{
      if(my!==_mxS.q)return;
      window._mxHm=tracks;
      const d=$('mxHm');
      if(d){
        d.innerHTML=tracks.length?tracks.map((t,i)=>{
          const inLib=_mm.list.some(x=>x.title.toLowerCase()===t.title.toLowerCase()&&x.artist.toLowerCase()===t.artist.toLowerCase());
          return `<div class="mm-tr" onclick="_hmPlay(window._mxHm[${i}],this.querySelector('.px-play'))">
            ${_mxCv(t.cover)}
            <div class="mm-tr-t"><b>${esc(t.title)}</b><span>${esc(t.artist)}${t.durStr?' · '+t.durStr:''}</span></div>
            <div class="hm-acts" onclick="event.stopPropagation()">
              <button class="hm-add-btn${inLib?' added':''}" ${inLib?'disabled':''} onclick="_hmAdd(window._mxHm[${i}],this)">${inLib?'✓ В медиатеке':'+ В медиатеку'}</button>
              <button class="px-play" data-trplay="hm_${t.id}" onclick="_hmPlay(window._mxHm[${i}],this)">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
          </div>`;
        }).join(''):'<div class="px-empty">Ничего не найдено</div>';
        _pxBtns();
      }
    }).catch(e=>{
      const d=$('mxHm');if(d)d.innerHTML='<div class="px-empty">Каталог временно недоступен</div>';
    });
  }
}
function _mxRqAdd(){const q=_mxS.q.trim();if(!q)return;let r=_mxRq().filter(x=>x!==q);r.unshift(q);try{localStorage.setItem('sl_mm_rq',JSON.stringify(r.slice(0,15)));}catch(e){}}
function _mxRqDel(i){const r=_mxRq();r.splice(i,1);try{localStorage.setItem('sl_mm_rq',JSON.stringify(r));}catch(e){}_mxSearchRun();}

// ── строка трека (обложка, название, «скачано», ⋯) ──
const _mxOnDev=it=>!!(it&&(it.local||it.ncached));
function _mxTrRow(it,on,extra){
  return `<div class="mm-tr mx-tr${_pxAudioId==='mm_'+it.id?' cur':''}" data-mm="${esc(it.id)}" onclick="${on}">${_mxCv(it.coverUrl)}
    <div class="mm-tr-t"><b>${esc(it.title)}</b><span>${_mxOnDev(it)?`<i class="mx-ok">${_MX_ICO.dlOk}</i>`:''}${esc(it.artist||'Неизвестный исполнитель')}</span></div>
    ${extra||`<button class="px-mini" onclick="event.stopPropagation();_mmMenu('${esc(it.id)}')" title="Ещё">${_MM_ICO.more}</button>`}</div>`;
}

// ── страница списка: плейлист / любимые / исполнитель / альбом ──
function _mxListPage(o){
  // o: {title, cover(url), sub, items, src, pid, owner}
  const ids=o.items.map(x=>x.id),idsJ=esc(JSON.stringify(ids)).replace(/"/g,'&quot;');
  const all=o.items.length&&o.items.every(_mxOnDev);
  return `<div class="mx-hero" style="--hc:${o.hc||'transparent'}">
      <div class="mx-hero-cv${o.round?' round':''}">${o.coverHtml||_mxCv(o.cover)}</div>
      <div class="mx-hero-t">${esc(o.title)}</div>
      <div class="mx-hero-s">${o.owner?`<span class="mx-own">${_wallAv?_wallAv(myUsername):''}${esc(typeof _myFullName==='function'&&_myFullName().trim()||myNick||('@'+myUsername))}</span> · `:''}${_mxN(o.items.length)}</div>
    </div>
    <div class="mx-acts">
      <button class="mx-ib" title="${all?'Всё на устройстве':'Скачать всё на устройство'}" onclick="_mxDlAll(${idsJ})">${all?_MX_ICO.dlOk:_MX_ICO.dl}</button>
      ${o.menu?`<button class="mx-ib" onclick="${o.menu}" title="Ещё">${_MM_ICO.more}</button>`:''}
      <i></i>
      <button class="mx-ib mm-shuf${_mm.shuffle?' on':''}" onclick="_mmShufToggle()" title="Перемешивание">${_MM_ICO.shuffle}</button>
      <button class="mx-play" data-mmsrc="${esc(o.src)}" onclick="_mmSrcPlay('${esc(o.src)}',${idsJ})">${_MM_ICO.play}</button>
    </div>
    ${o.pid?`<div class="mx-edit-row"><button class="mx-pill" onclick="_mxS.edit=!_mxS.edit;_mmPlPagePaint('${esc(o.pid)}')">${_MX_ICO.edit} ${_mxS.edit?'Готово':'Изменить'}</button>${_mxS.edit?`<button class="mx-pill" onclick="_mmPlPickTracks('${esc(o.pid)}')">${_MM_ICO.plus} Добавить треки</button>`:''}</div>`:''}
    ${o.want||''}
    <div class="mx-list">${o.items.length?o.items.map(it=>_mxTrRow(it,`_mm.src='${esc(o.src)}';_mmPlay('${esc(it.id)}',${idsJ})`,
        o.pid&&_mxS.edit?`<button class="px-mini" title="Убрать из плейлиста" onclick="event.stopPropagation();_mmPlRemove('${esc(o.pid)}','${esc(it.cid||it.id)}')">${_MM_ICO.x}</button>`:null)).join('')
      :'<div class="px-empty">Пока пусто</div>'}</div>`;
}
async function _mxDlAll(ids){
  const items=ids.map(id=>_mmFind(id)).filter(x=>x&&!_mxOnDev(x));
  if(!items.length){toast('Всё уже на устройстве');return;}
  const P=typeof _NPL==='function'&&_NPL();
  if(P){const urls=items.map(_npUrl).filter(Boolean);_mm._npTodo=(_mm._npTodo||0)+urls.length;_npListen();P.cache({urls}).catch(()=>{});toast('Скачиваем: '+urls.length);return;}
  toast('Скачиваем: '+items.length);
  let i=0;const w=async()=>{while(i<items.length){const it=items[i++];if(it.url)await _mmCache(it);}};
  await Promise.all([w(),w(),w()]);_mxRefresh();const pp=$('mmPlPage');if(pp)_mmPlPagePaint(pp.dataset.pl);
}
// цвет шапки — по обложке
function _mxHeroColor(url,sel){
  if(!url)return;_covColor(url).then(c=>{if(!c)return;const m=c.match(/hsl\((\d+) (\d+)%/);if(!m)return;
    const el=document.querySelector(sel);if(el)el.style.setProperty('--hc',`hsl(${m[1]} ${Math.min(60,+m[2])}% 30%)`);});
}
// плейлист — новая страница (та же функция, её зовёт остальной код)
_mmPlPagePaint=function(id){
  const box=$('mmPlPage');if(!box||box.dataset.pl!==id)return;
  const p=_mmPlById(id);if(!p){box.innerHTML='<div class="px-empty">Плейлист удалён</div>';return;}
  const l=_mmPlItems(p),last=l[l.length-1];
  box.innerHTML=_mxListPage({title:p.name,cover:last&&last.coverUrl,items:l,src:'pl:'+id,pid:id,owner:true,menu:`_mmPlMenu('${esc(id)}')`,
    want:p.want&&p.want.length?`<button class="mm-fam-add" onclick="_mmPlRefill('${esc(id)}')">${_MM_ICO.plus} Дособрать из списка <span>ждут ${p.want.length}</span></button>`:''});
  _mxHeroColor(last&&last.coverUrl,'#mmPlPage .mx-hero');
  _mmPaintPlay();
};
{const f=_spMusicPl;_spMusicPl=function(id){_mxS.edit=false;const r=f.apply(this,arguments);$('mmPlPage')?.classList.add('mx-pl');return r;};}
function _mxOpenLiked(){
  const page=_spPush('Любимые треки','<div class="mm-page mx-pl" id="mxLiked"></div>');
  const paint=()=>{const b=$('mxLiked');if(!b)return;const l=_mxLikedItems();
    b.innerHTML=_mxListPage({title:'Любимые треки',coverHtml:`<span class="mx-liked-cv big">${_MX_ICO.heart}</span>`,items:l,src:'likes',owner:true});_mmPaintPlay();};
  page._paint=paint;paint();
}
function _mxOpenGroup(kind,name){
  if(kind==='artist'){
    _mxOpenArtistProfile(name);
    return;
  }
  const g=_mxGroups(kind).find(x=>x.name===name);if(!g)return;
  _spPush(esc(name),'<div class="mm-page mx-pl" id="mxGroup"></div>');
  const b=$('mxGroup');
  const cv=g.cover;
  b.innerHTML=_mxListPage({title:name,cover:cv,round:false,items:g.items,src:kind+':'+name});
  _mxHeroColor(cv,'#mxGroup .mx-hero');_mmPaintPlay();
}

function _mxOpenArtistProfile(name){
  const g=_mxGroups('artist').find(x=>x.name===name);if(!g)return;
  _spPush(esc(name),'<div class="mm-page mx-pl" id="mxGroup"></div>');
  const b=$('mxGroup');
  const cv=_mxArtPic(name)||g.cover;

  // Сортировка: самые популярные (лайки, недавние) первыми
  const likes=new Set(_mxLikes());
  const recList=_mxRecentGet();
  const recMap=new Map(recList.map((k,idx)=>[k, recList.length - idx]));
  const sortedItems=[...g.items].sort((a,b)=>{
    const aScore=(likes.has(a.id)||likes.has(a.cid)?1000:0) + (recMap.get(a.id)||recMap.get(a.cid)||0);
    const bScore=(likes.has(b.id)||likes.has(b.cid)?1000:0) + (recMap.get(b.id)||recMap.get(b.cid)||0);
    return bScore - aScore;
  });

  const ids=sortedItems.map(x=>x.id);
  const idsJ=esc(JSON.stringify(ids)).replace(/"/g,'&quot;');
  const all=sortedItems.length&&sortedItems.every(_mxOnDev);

  // Первые 4 трека открыты, остальные — под кнопкой с анимацией
  const topCount=4;
  const firstTracks=sortedItems.slice(0,topCount);
  const moreTracks=sortedItems.slice(topCount);

  // Недавние релизы и альбомы
  const albumGroups={};
  sortedItems.forEach(it=>{
    const alb=it.album||'Синглы';
    if(!albumGroups[alb])albumGroups[alb]=[];
    albumGroups[alb].push(it);
  });
  const releases=Object.entries(albumGroups);

  const allArtistsCount=_mxGroups('artist').length;
  const isWaveArt=_slonWaveGetArtists().some(a=>a.toLowerCase()===name.toLowerCase());

  let h=`<div class="mx-hero" style="--hc:transparent">
      <div class="mx-hero-cv round">${_mxCv(cv)}</div>
      <div class="mx-hero-t">${esc(name)}</div>
      <div class="mx-hero-s">Исполнитель · ${_mxN(sortedItems.length)} в медиатеке</div>
    </div>
    <div class="mx-acts">
      <button class="mx-ib" title="${all?'Всё на устройстве':'Скачать всё на устройство'}" onclick="_mxDlAll(${idsJ})">${all?_MX_ICO.dlOk:_MX_ICO.dl}</button>
      <button class="mx-pill" style="margin-left:8px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;" onclick="_slonWaveToggleArtistQuick(${esc(JSON.stringify(name)).replace(/"/g,'&quot;')},this)">
        🌊 ${isWaveArt?'В SLON Волне':'В SLON Волну'}
      </button>
      <i></i>
      <button class="mx-ib mm-shuf${_mm.shuffle?' on':''}" onclick="_mmShufToggle()" title="Перемешивание">${_MM_ICO.shuffle}</button>
      <button class="mx-play" data-mmsrc="artist:${esc(name)}" onclick="_mmSrcPlay('artist:${esc(name)}',${idsJ})">${_MM_ICO.play}</button>
    </div>

    <!-- Популярные треки -->
    <div class="mx-h2" style="margin-top:16px;">Популярные треки</div>
    <div class="mx-list">
      ${firstTracks.map(it=>_mxTrRow(it,`_mm.src='artist:${esc(name)}';_mmPlay('${esc(it.id)}',${idsJ})`)).join('')}
    </div>
    ${moreTracks.length ? `
      <div class="mx-art-expand-wrap" id="mxArtMoreWrap">
        <div class="mx-list">
          ${moreTracks.map(it=>_mxTrRow(it,`_mm.src='artist:${esc(name)}';_mmPlay('${esc(it.id)}',${idsJ})`)).join('')}
        </div>
      </div>
      <button class="mx-art-more-btn" id="mxArtMoreBtn" data-orig-text="Показать ещё ${moreTracks.length} треков" onclick="_mxToggleArtistTracks(this)">
        <span>Показать ещё ${moreTracks.length} треков</span>
        <svg class="mx-art-chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" fill="currentColor"/></svg>
      </button>
    ` : ''}

    <!-- Недавние релизы -->
    <div class="mx-h2" style="margin-top:20px;">Недавние релизы и альбомы</div>
    <div class="mx-row">
      ${releases.map(([albName, tracks])=>{
        const albCv=tracks[0]?.coverUrl||cv;
        const albIdsJ=esc(JSON.stringify(tracks.map(x=>x.id))).replace(/"/g,'&quot;');
        return `<div class="mx-sq" onclick="_mm.src='album:${esc(albName)}';_mmPlay('${esc(tracks[0].id)}',${albIdsJ})">
          ${_mxCv(albCv)}
          <b>${esc(albName)}</b>
          <span>${_mxN(tracks.length)}</span>
        </div>`;
      }).join('')}
    </div>

    <!-- Переход ко всем исполнителям -->
    <div class="mx-all-artists-banner" onclick="_mxOpenAllArtists()">
      <div class="mx-all-art-ico">
        <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>
      </div>
      <div class="mx-all-art-t">
        <b>Все исполнители</b>
        <span>Открыть вкладку со всеми ${allArtistsCount} артистами в твоей медиатеке</span>
      </div>
      <svg class="mx-arr" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/></svg>
    </div>
  `;

  b.innerHTML=h;
  _mxHeroColor(cv,'#mxGroup .mx-hero');
  _mmPaintPlay();
}

function _mxToggleArtistTracks(btn){
  const wrap=$('mxArtMoreWrap');if(!wrap||!btn)return;
  const isExp=wrap.classList.toggle('expanded');
  btn.classList.toggle('expanded',isExp);
  const span=btn.querySelector('span');
  if(span){
    span.textContent=isExp?'Свернуть':btn.dataset.origText||'Показать ещё';
  }
}

function _slonWaveToggleArtistQuick(name, btn){
  const chosen=new Set(_slonWaveGetArtists().map(x=>x.toLowerCase()));
  const k=name.toLowerCase();
  let nowIn=false;
  if(chosen.has(k)){chosen.delete(k);nowIn=false;}
  else{chosen.add(k);nowIn=true;}
  const allGroups=_mxGroups('artist');
  const names=allGroups.filter(g=>chosen.has(g.name.toLowerCase())).map(g=>g.name);
  _slonWaveSetArtists(names);
  if(btn)btn.innerHTML=`🌊 ${nowIn?'В SLON Волне':'В SLON Волну'}`;
  toast(nowIn?`«${name}» добавлен в SLON Волну`:`«${name}» убран из SLON Волны`);
}

function _mxOpenAllArtists(){
  _mxChipGo('art');
  while(typeof _spPop==='function'&&$('mxGroup'))_spPop();
}

// ════════ SLON Волна: персональный умный микс любимых артистов ════════
const _slonWaveGetArtists=()=>{
  try{
    const v=JSON.parse(localStorage.getItem('sl_wave_artists')||'[]');
    return Array.isArray(v)?v:[];
  }catch(e){return [];}
};
const _slonWaveSetArtists=(arr)=>{
  try{localStorage.setItem('sl_wave_artists',JSON.stringify(arr));}catch(e){}
};

function _slonWaveHomeCard(){
  const chosen=_slonWaveGetArtists();
  const sub=chosen.length?`${chosen.length} выбр. исполнителей · умный микс без повторов`:'Выбери исполнителей для персональной волны треков';
  return `<div class="mx-wave-card" onclick="_slonWaveStart()">
    <div class="mx-wave-bg"></div>
    <div class="mx-wave-icon">
      <span class="mx-wave-slon">🐘</span>
      <span class="mx-wave-bars"><i></i><i></i><i></i><i></i></span>
    </div>
    <div class="mx-wave-info">
      <div class="mx-wave-title">SLON Волна</div>
      <div class="mx-wave-sub">${esc(sub)}</div>
    </div>
    <div class="mx-wave-acts" onclick="event.stopPropagation()">
      <button class="mx-wave-tune-btn" onclick="_slonWaveOpenTune()" title="Выбрать исполнителей">
        <svg viewBox="0 0 24 24"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" fill="currentColor"/></svg>
      </button>
      <button class="mx-wave-play-btn" onclick="_slonWaveStart()" title="Запустить волну">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
      </button>
    </div>
  </div>`;
}

function _slonWavePoolGen(artists){
  let pool=[];
  if(!artists||!artists.length){
    pool=_mm.list.slice();
  }else{
    const artSet=new Set(artists.map(a=>a.toLowerCase().trim()));
    pool=_mm.list.filter(t=>artSet.has((_mxArtistOf(t)||'').toLowerCase().trim()));
  }
  for(let i=pool.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  return pool;
}

function _slonWaveStart(){
  const chosen=_slonWaveGetArtists();
  let pool=_slonWavePoolGen(chosen);
  if(!pool.length){
    if(!_mm.list.length){toast('Сначала добавь треки в медиатеку');return;}
    toast('Выбери исполнителей для SLON Волны');
    _slonWaveOpenTune();
    return;
  }
  _mm.shuffle=true;
  _mm.played=new Set();
  _mm.src='slon_wave';
  const ids=pool.map(x=>x.id);
  _mmPlay(ids[0],ids);
  toast('🐘 Запущена SLON Волна!');
}

function _slonWaveOpenTune(){
  const allGroups=_mxGroups('artist');
  let chosen=new Set(_slonWaveGetArtists().map(x=>x.toLowerCase()));
  if(!chosen.size&&allGroups.length){
    allGroups.slice(0,5).forEach(g=>chosen.add(g.name.toLowerCase()));
  }

  const renderTune=(filter='')=>{
    const f=filter.trim().toLowerCase();
    const list=f?allGroups.filter(g=>g.name.toLowerCase().includes(f)):allGroups;
    return `
      <div class="slon-wave-tune-head">
        <h3>🐘 Настройка SLON Волны</h3>
      </div>
      <input class="slon-wave-search-inp" id="slonWaveQ" placeholder="Поиск исполнителя…" value="${esc(filter)}" oninput="_slonWaveTuneFilter(this.value)">
      <div class="slon-wave-quick-acts">
        <button class="slon-wave-quick-btn" onclick="_slonWaveSelectAll(true)">Выбрать всех</button>
        <button class="slon-wave-quick-btn" onclick="_slonWaveSelectAll(false)">Снять выбор</button>
      </div>
      <div class="slon-wave-art-list" id="slonWaveList">
        ${list.length?list.map(g=>{
          const isSel=chosen.has(g.name.toLowerCase());
          return `<div class="slon-wave-art-item${isSel?' sel':''}" onclick="_slonWaveToggleArt(${esc(JSON.stringify(g.name)).replace(/"/g,'&quot;')})">
            <div class="slon-wave-art-av">${_mxArtCv(g)}</div>
            <div class="slon-wave-art-name">
              ${esc(g.name)}
              <div class="slon-wave-art-meta">${_mxN(g.items.length)}</div>
            </div>
            <div class="slon-wave-check">
              <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
            </div>
          </div>`;
        }).join(''):'<div class="px-empty">Исполнители не найдены</div>'}
      </div>
      <button class="slon-wave-launch-btn" onclick="_slonWaveSaveAndPlay()">Запустить волну (${chosen.size})</button>
    `;
  };

  window._slonWaveChosen=chosen;
  window._slonWaveFilter='';
  _pxSheet(renderTune());
}

function _slonWaveToggleArt(name){
  const k=name.toLowerCase();
  if(window._slonWaveChosen.has(k))window._slonWaveChosen.delete(k);
  else window._slonWaveChosen.add(k);
  _slonWaveTuneUpdateList();
}

function _slonWaveSelectAll(sel){
  const allGroups=_mxGroups('artist');
  if(sel){
    allGroups.forEach(g=>window._slonWaveChosen.add(g.name.toLowerCase()));
  }else{
    window._slonWaveChosen.clear();
  }
  _slonWaveTuneUpdateList();
}

function _slonWaveTuneFilter(q){
  window._slonWaveFilter=q;
  _slonWaveTuneUpdateList();
}

function _slonWaveTuneUpdateList(){
  const f=(window._slonWaveFilter||'').trim().toLowerCase();
  const allGroups=_mxGroups('artist');
  const list=f?allGroups.filter(g=>g.name.toLowerCase().includes(f)):allGroups;
  const box=$('slonWaveList');
  if(box){
    box.innerHTML=list.length?list.map(g=>{
      const isSel=window._slonWaveChosen.has(g.name.toLowerCase());
      return `<div class="slon-wave-art-item${isSel?' sel':''}" onclick="_slonWaveToggleArt(${esc(JSON.stringify(g.name)).replace(/"/g,'&quot;')})">
        <div class="slon-wave-art-av">${_mxArtCv(g)}</div>
        <div class="slon-wave-art-name">
          ${esc(g.name)}
          <div class="slon-wave-art-meta">${_mxN(g.items.length)}</div>
        </div>
        <div class="slon-wave-check">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
        </div>
      </div>`;
    }).join(''):'<div class="px-empty">Исполнители не найдены</div>';
  }
  const btn=document.querySelector('.slon-wave-launch-btn');
  if(btn)btn.textContent=`Запустить волну (${window._slonWaveChosen.size})`;
}

function _slonWaveSaveAndPlay(){
  const allGroups=_mxGroups('artist');
  const names=allGroups.filter(g=>window._slonWaveChosen.has(g.name.toLowerCase())).map(g=>g.name);
  _slonWaveSetArtists(names);
  _pxSheetClose();
  _slonWaveStart();
  if(typeof _mxRefreshSoft==='function')_mxRefreshSoft();
}
// меню трека: + «В любимые»
{const f=_mmMenu;_mmMenu=function(id){
  const r=f.apply(this,arguments);
  const it=_mmFind(id),a=document.querySelector('#pxSheet .mm-acts');
  if(it&&a)a.insertAdjacentHTML('afterbegin',`<button onclick="_pxSheetClose();_mxLike('${esc(id)}')">${_mxLiked(it)?'Убрать из любимых':'В любимые'}</button>`);
  return r;
};}
// перерисовка открытых страниц после изменений
{const f=_mmPaint;_mmPaint=function(){const r=f.apply(this,arguments);if($('mxBody')&&_mxS.tab!=='search'&&!(_mxS.tab==='lib'&&_mxS.chip==='tracks')){clearTimeout(_mxS.rt);_mxS.rt=setTimeout(()=>{if(_mxS.tab!=='search')_mxRefreshSoft();},120);}const lk=$('mxLiked');if(lk){const pg=lk.closest('.sp-page');pg&&pg._paint&&pg._paint();}return r;};}
function _mxRefreshSoft(){const b=$('mxBody');if(!b)return;const y=b.scrollTop;if(_mxS.tab==='home')b.innerHTML=_mxHome();else if(_mxS.tab==='lib'&&_mxS.chip!=='tracks')b.innerHTML=_mxLib();b.scrollTop=y;_mmPaintPlay();}

// ── очередь ──
function _mxQueue(){
  const ids=_mm.queue||[];
  _pxSheet(`<div class="px-sh-t">Очередь</div><div class="mm-pick mm-pick-w">${ids.map((id,i)=>{const it=_mmFind(id);if(!it)return '';
    return _mxTrRow(it,`_mxQueueJump(${i})`,'<span></span>');}).join('')||'<div class="px-empty">Очередь пуста</div>'}</div>`);
  $('pxSheet')?.querySelector('.px-sheet-card')?.classList.add('wide');
  setTimeout(()=>{const c=document.querySelector('#pxSheet .mx-tr.cur');c&&c.scrollIntoView({block:'center'});},50);
  _mmPaintPlay();
}
function _mxQueueJump(i){
  const P=typeof _NPL==='function'&&_NPL();
  if(P&&_pxAudio===_npa)P.jump({index:i}).catch(()=>{});else _mmPlay(_mm.queue[i],_mm.queue);
  _pxSheetClose();
}

// ── полноэкранный плеер: «Воспроизводится из …», кнопки в капсулах, любимое, повтор, очередь ──
function _mxSrcName(){
  const s=_mm.src||'';
  if(s.startsWith('pl:')){const p=_mmPlById(s.slice(3));return p?'Плейлист «'+p.name+'»':'Плейлист';}
  if(s==='likes')return 'Любимые треки';
  if(s.startsWith('fam:'))return 'Музыка '+(peerNames[s.slice(4)]||('@'+s.slice(4)));
  if(s.startsWith('artist:'))return 'Исполнитель '+s.slice(7);
  if(s.startsWith('album:'))return 'Альбом «'+s.slice(6)+'»';
  return 'Моя музыка';
}
_fpOpen=function(){
  if($('mmFp')||!_islTr)return;
  const w=document.createElement('div');w.id='mmFp';w.className='mm-fp mx-fp';
  w.innerHTML=`<div class="fp-bg" id="fpBg"></div>
    <div class="fp-hd"><button class="fp-ib" onclick="_fpClose()" title="Свернуть">${_FP_ICO.down}</button>
      <div class="fp-src"><span>Воспроизводится из</span><b id="fpSrc"></b></div>
      <button class="fp-ib" onclick="_islTr&&_islTr.mm&&_mmMenu(_islTr.mm)" title="Ещё">${_MM_ICO.more}</button></div>
    <div class="fp-stage"><div class="fp-cover" id="fpCover"></div><div class="fp-ly" id="fpLy"></div></div>
    <div class="fp-info2"><div class="fp-info"><b id="fpTitle"></b><span id="fpArtist"></span></div>
      <button class="fp-ib" id="fpLyB" onclick="_fpLyToggle()" title="Текст">${_MX_ICO.lyrics}</button></div>
    <div class="fp-prog"><input type="range" id="fpR" min="0" max="1000" value="0" oninput="_islSeek(this.value)"><div><span id="fpT">0:00</span><span id="fpD">0:00</span></div></div>
    <div class="fp-cap fp-ctl2"><button class="fp-sh" id="fpSh" onclick="_mmShufToggle()">${_MM_ICO.shuffle}</button><button onclick="_islStep(-1)">${_MM_ICO.prev}</button>
      <button class="fp-pp" id="fpPP" onclick="_islToggle()"></button><button onclick="_islStep(1)">${_MM_ICO.next}</button>
      <button class="fp-rp" id="fpRp" onclick="_mxRepeat()">${_MX_ICO.repeat}</button></div>
    <div class="fp-cap fp-row2"><button id="fpLike" onclick="_islTr&&_islTr.mm&&_mxLike(_islTr.mm)">${_MX_ICO.heartO}</button><i></i>
      <button class="fp-ib" id="fpDl" onclick="_fpDl()"></button><button onclick="_mxQueue()" title="Очередь">${_MX_ICO.queue}</button></div>`;
  document.body.appendChild(w);
  _fpLyOn=false;_fpKey='';_fpPaint();_fpExtraPaint();
  $('mmMini')?.classList.add('hid');
  requestAnimationFrame(()=>requestAnimationFrame(()=>w.classList.add('show')));
  _fpSwipe(w);
};
function _fpExtraPaint(){
  if(!$('mmFp'))return;
  const s=$('fpSrc');if(s)s.textContent=_islTr&&_islTr.mm?_mxSrcName():'SLON';
  const it=_islTr&&_islTr.mm?_mmFind(_islTr.mm):null;
  const lk=$('fpLike');if(lk){lk.style.visibility=it?'':'hidden';const on=_mxLiked(it);lk.innerHTML=on?_MX_ICO.heart:_MX_ICO.heartO;lk.classList.toggle('on',on);}
  const sh=$('fpSh');if(sh)sh.classList.toggle('on',!!_mm.shuffle);
  const rp=$('fpRp');if(rp){rp.innerHTML=_mm.repeat==='one'?_MX_ICO.repeat1:_MX_ICO.repeat;rp.classList.toggle('on',_mm.repeat!=='off');}
}
{const f=_fpPaint;_fpPaint=function(){const r=f.apply(this,arguments);_fpExtraPaint();return r;};}
{const f=_mmShufToggle;_mmShufToggle=function(){const r=f.apply(this,arguments);_fpExtraPaint();return r;};}
// большая круглая «Играть» — только значок (▶ / ❚❚)
{const f=_mmPlayBtns;_mmPlayBtns=function(){const r=f.apply(this,arguments);
  document.querySelectorAll('.mx-play[data-mmsrc]').forEach(b=>{const st=b.dataset.st==='p'?'p':'l';if(b._st!==st){b._st=st;b.innerHTML=st==='p'?_MM_ICO.pause:_MM_ICO.play;}});return r;};}

// анимации кнопок плеера: нажатие — «пружинка», назад/вперёд — толчок в сторону, смена ▶/❚❚ — плавная подмена
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest&&e.target.closest('.fp-cap button,.mm-mini-pp,.isl-ctl button,.mx-play,.px-kara-ctl button,.mm-cb-pp');
  if(!b)return;
  const oc=b.getAttribute('onclick')||'';
  const cls=/Step\(1\)|KaraStep\(1\)/.test(oc)?'tap-r':/Step\(-1\)|KaraStep\(-1\)/.test(oc)?'tap-l':'tap';
  b.classList.remove('tap','tap-r','tap-l');void b.offsetWidth;b.classList.add(cls);
  setTimeout(()=>b.classList.remove(cls),420);
},true);

// смена категории в медиатеке: содержимое уезжает в сторону, новое приезжает с другой (как вкладки в ОС)
const _MX_CHIPS=['all','pl','art','alb','tracks'];
function _mxChipGo(k){
  if(k===_mxS.chip)return;
  const dir=_MX_CHIPS.indexOf(k)>_MX_CHIPS.indexOf(_mxS.chip)?1:-1;
  _mxS.chip=k;_mxS.chipDir=dir;_mxRefresh();
  const b=$('mxBody');if(!b)return;
  const chips=b.querySelector('.mx-chips');
  // только ряд чипов (scrollIntoView крутил и сайдбар с overflow:hidden — панель съезжала влево и обрезалась)
  const on=chips&&chips.querySelector('.on');
  if(on)chips.scrollTo({left:on.offsetLeft-(chips.clientWidth-on.offsetWidth)/2,behavior:'smooth'});
  ['sidebar','spPanel'].forEach(id=>{const e=$(id);if(e&&e.scrollLeft)e.scrollLeft=0;});   // если уже успело съехать
  [...b.children].forEach(el=>{if(el===chips)return;el.classList.remove('mx-in-l','mx-in-r');void el.offsetWidth;el.classList.add(dir>0?'mx-in-r':'mx-in-l');});
}


// ════════ Фото исполнителей (картинка артиста из каталога Deezer) вместо обложки альбома ════════
// Кэш в localStorage на 30 дней; берём только точное совпадение имени — чтобы не подсунуть чужое лицо.
// Нет фото у артиста (у Deezer пустая заглушка) — остаётся обложка.
const _ART_K='sl_artpic2',_ART_TTL=30*864e5;
let _artMap=null,_artBusy=0;const _artQ=[],_artNames={},_artWait={};
function _artLoad(){if(!_artMap){try{_artMap=JSON.parse(localStorage.getItem(_ART_K)||'{}')||{};}catch(e){_artMap={};}}return _artMap;}
const _artKey=n=>String(n||'').toLowerCase().replace(/\s+/g,' ').trim();
const _artNorm=n=>_artKey(n).replace(/^the /,'').replace(/[^\p{L}\p{N}]/gu,'');
function _mxArtPic(name){
  const k=_artKey(name);if(!k)return '';
  const v=_artLoad()[k];
  if(!v||Date.now()-v.ts>_ART_TTL)_artFetch(name);
  return v&&v.u||'';
}
function _artFetch(name){
  const k=_artKey(name);if(_artWait[k])return;
  _artWait[k]=1;_artNames[k]=name;_artQ.push(k);_artPump();
}
function _artPump(){
  while(_artBusy<2&&_artQ.length){
    const k=_artQ.shift();_artBusy++;
    (async()=>{
      let u='',ok=false;
      // сначала Яндекс Музыка (у СНГ-артистов там настоящие фото; через наш сервер — браузер напрямую не пускают),
      // нет фото — Deezer
      try{
        const r=await fetch(SLON_YC.api+'?p='+encodeURIComponent('/art?q='+_artNames[k]));
        const j=await r.json();if(j&&j.ok){ok=true;if(j.u&&j.photo)u=j.u;}
      }catch(e){}
      if(!u)try{
        const d=await _dzJsonp('/search/artist?q='+encodeURIComponent(_artNames[k])+'&limit=8');
        const want=_artNorm(_artNames[k]);
        const hit=((d&&d.data)||[]).find(x=>_artNorm(x.name)===want);
        const p=hit&&(hit.picture_xl||hit.picture_big)||'';
        if(p&&!/\/artist\/\//.test(p))u=p;      // у Deezer «нет фото» — ссылка с пустым хешем
        ok=true;
      }catch(e){}
      _artBusy--;delete _artWait[k];
      if(ok){
        _artLoad()[k]={u,ts:Date.now()};
        try{localStorage.setItem(_ART_K,JSON.stringify(_artMap));}catch(e){}
        if(u)document.querySelectorAll('[data-art]').forEach(el=>{
          if(el.dataset.art!==k)return;
          if(el.tagName==='IMG')el.src=u;
          else el.outerHTML='<img class="round" data-art="'+esc(k)+'" src="'+esc(u)+'" alt="" loading="lazy">';
        });
      }
      _artPump();
    })();
  }
}
// кружок исполнителя: фото артиста, пока нет — обложка (подменится, когда фото придёт)
function _mxArtCv(g){
  const k=_artKey(g.name),u=_mxArtPic(g.name)||g.cover;
  return u?'<img class="round" data-art="'+esc(k)+'" src="'+esc(u)+'" alt="" loading="lazy">'
    :'<span class="mm-cv-none round" data-art="'+esc(k)+'">'+_MM_ICO.note+'</span>';
}
