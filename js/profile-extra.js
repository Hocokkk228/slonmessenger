// ════════════════════════════════════════
// ── ПРОФИЛЬ+: соцсети, доп. юзернеймы, цвет ника, музыка, дата регистрации,
//    подарки и публикации (архив историй) ──
// Всё лежит в одном поле профиля px и расходится так же, как остальной профиль:
// публичный профиль + hello собеседникам + синхронизация между своими устройствами.
// Музыка — каталог Deezer (обложка, 30-секундный отрывок), тексты — LRCLIB.
// Скачивания треков из каталогов нет: это чужая музыка.
// ════════════════════════════════════════
let myPX={},_pxUser=null;
let peerPX=(()=>{try{return JSON.parse(localStorage.getItem('sl_peerPX')||'{}')||{};}catch(e){return {};}})();
function _pxMe(){
  if(_pxUser!==myUsername){_pxUser=myUsername;try{myPX=JSON.parse(localStorage.getItem('sl_u_'+myUsername+'_px')||'{}')||{};}catch(e){myPX={};}}
  return myPX;
}
function _pxSave(publish){
  try{localStorage.setItem('sl_u_'+myUsername+'_px',JSON.stringify(myPX));}catch(e){}
  if(publish){try{saveAll();}catch(e){} if(_fbMode&&typeof _broadcastHello==='function')_broadcastHello();}
}
function _pxPeerSave(){try{localStorage.setItem('sl_peerPX',JSON.stringify(peerPX));}catch(e){}}
// что видят другие
function _pxPublic(){const p=_pxMe();return {socials:p.socials||[],aliases:p.aliases||[],name:p.name||null,track:p.track||null,playlist:(p.playlist||[]).slice(0,10),reg:p.reg||0};}
const _pxLimitAliases=()=>myPremium?5:1;
const _pxLimitSocials=()=>myPremium?8:3;

// ── синхронизация ──
if(typeof PS_FIELDS==='object')PS_FIELDS.px=[()=>_pxMe(),v=>{if(v&&typeof v==='object'){myPX=v;_pxSave(false);}}];
{const f=_myHelloFor;_myHelloFor=function(pid){const d=f.apply(this,arguments);d.px=_pxPublic();return d;};}
{const f=_myPublicProfile;_myPublicProfile=function(base){const d=f.apply(this,arguments);d.px=_pxPublic();return d;};}
{const f=_applyExtraProfile;_applyExtraProfile=function(pid,d){const r=f.apply(this,arguments);if(d&&d.px&&typeof d.px==='object'){peerPX[pid]=d.px;_pxPeerSave();}return r;};}
// дата регистрации — с сервера, один раз
setTimeout(async function _pxReg(){
  try{
    if(!myUsername||typeof _apiToken!=='function'||!_apiToken()){setTimeout(_pxReg,15000);return;}
    const p=_pxMe();if(p.reg)return;
    const d=await api('/auth/me');
    if(d.created){p.reg=d.created;_pxSave(true);}
  }catch(e){}
},6000);

// ════════ Оформление ника ════════
const NAME_STYLES=[
  {id:'',       name:'Обычный',   prem:false},
  {id:'s:#ff5b6b',name:'Красный', prem:false},{id:'s:#ffa53b',name:'Оранжевый',prem:false},{id:'s:#f7d046',name:'Жёлтый',prem:false},
  {id:'s:#4fd18b',name:'Зелёный', prem:false},{id:'s:#4ab3ff',name:'Голубой', prem:false},{id:'s:#a67bff',name:'Фиолетовый',prem:false},
  {id:'g:#ff4ecd,#6a5cff,#35d7ff',name:'Неон',     prem:true},
  {id:'g:#ffd84a,#ff7a2f,#ff3d6e',name:'Закат',    prem:true},
  {id:'g:#00e5a0,#00b3ff,#7b61ff',name:'Аврора',   prem:true},
  {id:'g:#ffffff,#9fb4c8,#ffffff',name:'Серебро',  prem:true},
  {id:'g:#fff1a8,#e2b33a,#fff1a8',name:'Золото',   prem:true},
  {id:'g:#ff3b3b,#ffe23b,#3bff6b,#3bb2ff,#b43bff',name:'Радуга',prem:true},
];
function _nmStyleAttr(id){
  if(!id)return '';
  if(id.startsWith('s:'))return ` class="nm-st" style="color:${esc(id.slice(2))}"`;
  if(id.startsWith('g:')){const c=id.slice(2).split(',').filter(x=>/^#[0-9a-f]{3,8}$/i.test(x));if(!c.length)return '';
    return ` class="nm-st nm-grad" style="--nm:linear-gradient(90deg,${[...c,c[0]].join(',')})"`;}
  return '';
}
function _nmWrap(html,text,id){
  if(!id||!text)return html;
  const e=esc(text),i=html.indexOf(e);if(i<0)return html;
  return html.slice(0,i)+`<span${_nmStyleAttr(id)}>${e}</span>`+html.slice(i+e.length);
}

// ════════ Соцсети ════════
const SOCIALS=[
  [/(^|\.)t\.me$|telegram/i,'Telegram','#2aabee','tg'],[/vk\.com|vk\.ru/i,'VK','#0077ff','VK'],[/instagram/i,'Instagram','#e1306c','IG'],
  [/tiktok/i,'TikTok','#111','TT'],[/youtu/i,'YouTube','#ff0000','yt'],[/twitch/i,'Twitch','#9146ff','TW'],[/github/i,'GitHub','#24292f','GH'],
  [/discord/i,'Discord','#5865f2','DS'],[/(^|\.)x\.com$|twitter/i,'X','#000','X'],[/soundcloud/i,'SoundCloud','#ff5500','SC'],
  [/spotify/i,'Spotify','#1db954','SP'],[/steam/i,'Steam','#1b2838','ST'],[/pinterest/i,'Pinterest','#e60023','P'],[/reddit/i,'Reddit','#ff4500','R'],
];
function _socInfo(url){
  let host='';try{host=new URL(url).hostname.replace(/^www\./,'');}catch(e){}
  const m=SOCIALS.find(s=>s[0].test(host));
  return {host,name:m?m[1]:host||'Ссылка',color:m?m[2]:'#5b6b7c',tag:m?m[3]:''};
}
function _socIco(url){
  const s=_socInfo(url);
  let g;
  if(s.tag==='tg')g='<svg viewBox="0 0 24 24"><path fill="#fff" d="M20.7 4.3 3.2 11c-1.2.5-1.2 1.2-.2 1.5l4.5 1.4 1.7 5.3c.2.6.4.7.8.7s.6-.2.9-.5l2.2-2.1 4.5 3.3c.8.5 1.4.2 1.6-.8l2.9-13.8c.3-1.2-.4-1.8-1.4-1.4zM8.6 13.1l8.4-5.3c.4-.2.7-.1.4.2l-6.8 6.2-.3 3.1z"/></svg>';
  else if(s.tag==='yt')g='<svg viewBox="0 0 24 24"><path fill="#fff" d="M9.5 8.2v7.6l6.5-3.8z"/></svg>';
  else if(s.tag)g=`<b>${s.tag}</b>`;
  else g='<svg viewBox="0 0 24 24"><path fill="#fff" d="M10.6 13.4a1 1 0 0 0 1.4 0l4-4a3 3 0 0 0-4.2-4.2l-1.5 1.5 1.4 1.4 1.5-1.5a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 0 0 1.4zm2.8-2.8a1 1 0 0 0-1.4 0l-4 4a3 3 0 0 0 4.2 4.2l1.5-1.5-1.4-1.4-1.5 1.5a1 1 0 0 1-1.4-1.4l4-4a1 1 0 0 0 0-1.4z"/></svg>';
  return `<span class="soc-ico" style="background:${s.color}">${g}</span>`;
}
function _socNorm(u){u=String(u||'').trim();if(!u)return '';if(!/^https?:\/\//i.test(u))u='https://'+u;try{const x=new URL(u);return x.protocol==='https:'||x.protocol==='http:'?x.href:'';}catch(e){return '';}}

// ════════ Музыка: Deezer (JSONP — без ключа и без CORS) ════════
function _dzJsonp(path){
  return new Promise((res,rej)=>{
    const cb='_dz'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    const t=setTimeout(()=>{cleanup();rej(new Error('Каталог не отвечает'));},9000);
    function cleanup(){clearTimeout(t);delete window[cb];s.remove();}
    window[cb]=d=>{cleanup();res(d);};
    s.src='https://api.deezer.com'+path+(path.includes('?')?'&':'?')+'output=jsonp&callback='+cb;
    s.onerror=()=>{cleanup();rej(new Error('Каталог недоступен'));};
    document.head.appendChild(s);
  });
}
const _trOf=x=>({id:x.id,title:x.title_short||x.title,artist:x.artist?.name||'',cover:x.album?.cover_medium||x.album?.cover||'',dur:x.duration||0});
async function _dzSearch(q){const d=await _dzJsonp('/search?limit=20&q='+encodeURIComponent(q));return (d.data||[]).map(_trOf);}
// ссылка на отрывок подписана и живёт недолго — берём свежую перед воспроизведением
async function _dzPreview(id){const d=await _dzJsonp('/track/'+encodeURIComponent(id));return d.preview||'';}

let _pxAudio=null,_pxAudioId=null;
async function _pxPlay(tr,btn){
  if(!tr)return;
  if(tr.src==='sc'){_pxAudio?.pause();_pxScSheet(tr);return;}
  if(_pxAudio&&_pxAudioId===tr.id&&!_pxAudio.paused){_pxAudio.pause();_pxBtns();return;}
  try{
    if(!_pxAudio){_pxAudio=new Audio();_pxAudio.onended=_pxAudio.onpause=_pxAudio.onplay=_pxBtns;}
    if(_pxAudioId!==tr.id){_pxAudioId=tr.id;btn?.classList.add('busy');_pxAudio.src=tr.src==='file'?tr.url:tr.src==='au'?await _auStream(tr):await _dzPreview(tr.id);
      if(tr.start){await new Promise(r=>{_pxAudio.onloadedmetadata=r;setTimeout(r,4000);});try{_pxAudio.currentTime=tr.start;}catch(e){}}}
    await _pxAudio.play();
  }catch(e){toast('Не удалось включить отрывок');}
  finally{btn?.classList.remove('busy');_pxBtns();}
}
function _pxBtns(){
  document.querySelectorAll('[data-trplay]').forEach(b=>{
    const on=_pxAudio&&!_pxAudio.paused&&String(_pxAudioId)===b.dataset.trplay;
    b.classList.toggle('on',!!on);
    b.innerHTML=on?'<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  });
}
// текст песни (LRCLIB — открытая база, без ключа)
async function _pxLyrics(tr){
  _pxSheet(`<div class="px-lyr-hd">${tr.cover?`<img src="${esc(tr.cover)}" alt="">`:''}<div><b>${esc(tr.title)}</b><span>${esc(tr.artist)}</span></div></div><div class="px-lyr" id="pxLyr">Ищем текст…</div>`);
  try{
    const r=await fetch('https://lrclib.net/api/search?track_name='+encodeURIComponent(tr.title)+'&artist_name='+encodeURIComponent(tr.artist));
    const j=await r.json();const hit=(j||[]).find(x=>x.plainLyrics)||null;
    const el=$('pxLyr');if(el)el.textContent=hit?hit.plainLyrics:'Текст не найден';
  }catch(e){const el=$('pxLyr');if(el)el.textContent='Не удалось загрузить текст';}
}
function _pxSheet(html){
  document.getElementById('pxSheet')?.remove();
  const w=document.createElement('div');w.id='pxSheet';w.className='px-sheet';
  w.innerHTML=`<div class="px-sheet-bd" onclick="_pxSheetClose()"></div><div class="px-sheet-card"><button class="px-sheet-x" onclick="_pxSheetClose()"><svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>${html}</div>`;
  document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('show'));
}
function _pxSheetClose(){const w=$('pxSheet');if(!w)return;w.classList.remove('show');setTimeout(()=>w.remove(),220);}

// ════════ Блоки профиля (свой и собеседника) ════════
function _pxTrackPill(tr,list,owner){
  if(!tr)return '';
  const more=(list||[]).length>1?`<button class="px-pl-more" onclick="event.stopPropagation();_pxPlaylist('${owner}')">${list.length} в плейлисте</button>`:'';
  return `<div class="px-track" onclick="_pxLyrics(_pxTr('${owner}'))" title="Текст песни">
    ${tr.cover?`<img class="px-cover" src="${esc(tr.cover)}" alt="">`:'<span class="px-cover px-cover-none"></span>'}
    <div class="px-tr-t"><b>${esc(tr.title)}</b><span>${esc(tr.artist)}${_pxSrcTag(tr)}</span></div>${more}${_pxCanDl(tr)?`<button class="px-dl" title="Скачать" onclick="event.stopPropagation();_pxDownload(_pxTr('${owner}'))">${_PX_DL}</button>`:''}
    <button class="px-play" data-trplay="${esc(String(tr.id))}" onclick="event.stopPropagation();_pxPlay(_pxTr('${owner}'),this)"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></div>`;
}
const _PX_DL='<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
const _pxSrcTag=t=>t.src==='sc'?' · SoundCloud':t.src==='file'||t.src==='au'?'':' · отрывок';
const _pxCanDl=t=>t&&(t.src==='file'||(t.src==='au'&&t.dl));
function _pxOf(owner){return owner===myUsername?_pxPublic():(peerPX[owner]||{});}
function _pxTr(owner,i){const p=_pxOf(owner);return i==null?p.track:(p.playlist||[])[i];}
function _pxPlaylist(owner){
  const p=_pxOf(owner),pl=p.playlist||[];
  _pxSheet(`<div class="px-sh-t">Плейлист</div><div class="px-pl">${pl.map((t,i)=>`<div class="px-pl-row">
      ${t.cover?`<img src="${esc(t.cover)}" alt="">`:'<span class="px-cover-none"></span>'}
      <div class="px-tr-t" onclick="_pxLyrics(_pxTr('${owner}',${i}))"><b>${esc(t.title)}</b><span>${esc(t.artist)}${_pxSrcTag(t)}</span></div>${_pxCanDl(t)?`<button class="px-mini" title="Скачать" onclick="_pxDownload(_pxTr('${owner}',${i}))">${_PX_DL}</button>`:''}
      <button class="px-play" data-trplay="${esc(String(t.id))}" onclick="_pxPlay(_pxTr('${owner}',${i}),this)"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></div>`).join('')}</div>`);
  _pxBtns();
}
function _pxAliasLine(p,nm){
  const a=(p.aliases||[]).filter(Boolean);if(!a.length)return '';
  return `<div class="px-aka">а также ${a.map(x=>`<span${_nmStyleAttr(nm)} onclick="event.stopPropagation();navigator.clipboard?.writeText('@${esc(x)}').then(()=>toast('Скопировано'))">@${esc(x)}</span>`).join(', ')}</div>`;
}
function _pxSocialRows(p){
  const s=(p.socials||[]).filter(Boolean);if(!s.length)return '';
  return `<div class="px-socs">${s.map(u=>{const i=_socInfo(u);return `<a class="px-soc" href="${esc(u)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${_socIco(u)}<span class="px-soc-t"><b>${esc(i.name)}</b><span>${esc(u.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,''))}</span></span></a>`;}).join('')}</div>`;
}
const _pxRegText=ts=>ts?('В SLON с '+new Date(ts).toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'})):'';
// «Подарки» / «Публикации» (архив историй)
function _pxGiftsBlock(owner){
  return `<div class="px-gifts" data-owner="${esc(owner)}">
    <div class="px-tabs"><button class="px-tab sel" data-t="gifts" onclick="_pxTab(this)">Подарки</button><button class="px-tab" data-t="posts" onclick="_pxTab(this)">Публикации</button></div>
    <div class="px-tab-body" data-t="gifts"><div class="px-gift-grid"><i></i><i></i><i></i></div><div class="px-gift-hint">${owner===myUsername?'Здесь будут подарки, которые тебе пришлют.':'Подарков пока нет.'}</div></div>
    <div class="px-tab-body" data-t="posts" hidden><div class="px-posts" id="pxPosts_${esc(owner)}"><div class="px-gift-hint">Загрузка…</div></div></div></div>`;
}
function _pxTab(btn){
  const box=btn.closest('.px-gifts'),t=btn.dataset.t;
  box.querySelectorAll('.px-tab').forEach(b=>b.classList.toggle('sel',b===btn));
  box.querySelectorAll('.px-tab-body').forEach(b=>b.hidden=b.dataset.t!==t);
  if(t==='posts')_pxLoadPosts(box.dataset.owner);
}
async function _pxLoadPosts(owner){
  const el=document.getElementById('pxPosts_'+owner);if(!el)return;
  if(typeof _stArchive!=='function'){el.innerHTML='<div class="px-gift-hint">Публикаций пока нет.</div>';return;}
  const list=await _stArchive(owner);
  if(!list.length){el.innerHTML='<div class="px-gift-hint">Публикаций пока нет. Истории попадают сюда через 24 часа.</div>';return;}
  el.innerHTML=list.slice().reverse().map((s,i)=>`<button class="px-post" style="background-image:url('${esc(s.thumb||'')}')" onclick="_stOpenArchive('${esc(owner)}',${list.length-1-i})"><span>${new Date(s.ts).toLocaleDateString('ru',{day:'numeric',month:'short'})}</span></button>`).join('');
}

// профиль собеседника
{const f=_ppRender;_ppRender=function(pid){
  const r=f.apply(this,arguments);
  try{
    const p=peerPX[pid]||{},nm=p.name||'';
    const n=$('peerProfName');if(n&&nm)n.innerHTML=_nmWrap(n.innerHTML,peerNames[pid]||('@'+pid),nm);
    $('peerProfHero')?.querySelector('.px-track')?.remove();
    $('peerProfStatus')?.insertAdjacentHTML('afterend',_pxTrackPill(p.track,p.playlist,pid));
    const info=$('peerProfInfo');
    if(info){
      const urow=[...info.querySelectorAll('.sp-row')].find(x=>x.querySelector('.sp-row-sub')?.textContent==='Юзернейм');
      if(urow){const t=urow.querySelector('.sp-row-title');if(t&&nm)t.innerHTML=`<span${_nmStyleAttr(nm)}>${t.innerHTML}</span>`;urow.querySelector('.sp-row-txt')?.insertAdjacentHTML('beforeend',_pxAliasLine(p,nm));}
      const cards=info.querySelectorAll(':scope > .sp-card');
      const last=cards[cards.length-1];
      const extra=_pxSocialRows(p)+(p.reg?`<div class="px-reg">${_ico('chat')} ${_pxRegText(p.reg)}</div>`:'');
      (last||info).insertAdjacentHTML('beforebegin',(extra?`<div class="sp-card sp-pad px-card">${extra}</div>`:'')+_pxGiftsBlock(pid));
    }
    _pxBtns();
  }catch(e){console.warn('[px] pp',e);}
  return r;
};}
// свой профиль (шапка настроек)
{const f=_spRender;_spRender=function(){
  const r=f.apply(this,arguments);
  try{
    const p=_pxPublic(),nm=p.name||'';
    const n=$('spName');if(n&&nm)n.innerHTML=_nmWrap(n.innerHTML,typeof _myFullName==='function'&&_myFullName().trim()||myNick||('@'+myUsername),nm);
    $('spHero')?.querySelector('.px-track')?.remove();
    $('spStatus')?.insertAdjacentHTML('afterend',_pxTrackPill(p.track,p.playlist,myUsername));
    const body=$('spBody');
    if(body&&!body.querySelector('.px-card')){
      const extra=_pxAliasLine(p,nm)+_pxSocialRows(p)+(p.reg?`<div class="px-reg">${_ico('chat')} ${_pxRegText(p.reg)}</div>`:'');
      const first=body.querySelector('.sp-card');
      if(extra&&first)first.insertAdjacentHTML('afterend',`<div class="sp-card sp-pad px-card">${extra}</div>`);
      const logout=[...body.querySelectorAll('.sp-card')].find(c=>c.querySelector('.sp-row-danger'));
      (logout||body.lastElementChild)?.insertAdjacentHTML('beforebegin',_pxGiftsBlock(myUsername));
    }
    _pxBtns();
  }catch(e){console.warn('[px] sp',e);}
  return r;
};}

// ════════ Редактирование — в «Кастомизации профиля» ════════
let _pxDraft=null;
{const f=_spCustomize;_spCustomize=function(){
  _pxDraft=JSON.parse(JSON.stringify(_pxMe()));
  const r=f.apply(this,arguments);
  try{
    const anchor=document.querySelector('#spPatterns')?.closest('.sp-card');
    anchor?.insertAdjacentHTML('afterend',_pxEditHtml());
    _pxEditPaint();
  }catch(e){console.warn('[px] edit',e);}
  return r;
};}
{const f=_spSaveCustom;_spSaveCustom=function(){
  const d=_pxDraft;_pxDraft=null;
  if(d){const p=_pxMe();p.name=d.name||null;p.socials=d.socials||[];p.track=d.track||null;p.playlist=d.playlist||[];_pxSave(false);}
  return f.apply(this,arguments);
};}
function _pxDirty(){$('custSave')?.classList.add('show');}
function _pxEditHtml(){
  const lock=myPremium?'':' <span class="sp-lock">часть Premium</span>';
  return _spSec('Цвет ника'+lock)+`<div class="sp-card sp-pad"><div class="nm-grid" id="pxNmGrid"></div></div>`
    +_spSec('Музыка в профиле')+`<div class="sp-card sp-pad"><div id="pxMusic"></div>
      <div class="px-src-btns"><button class="lm-btn primary" onclick="_pxPickFile()">Загрузить свой трек</button></div>
      <div class="px-up-st" id="pxUpSt" style="display:none"></div>
      <div class="px-search"><input class="lm-inp" id="pxQ" placeholder="Найти песню или исполнителя" oninput="_pxSearchSoon()"><div class="px-res" id="pxRes"></div></div></div>`
    +_spHint('Свой трек (mp3/m4a до 15 МБ, до 5 штук) играет целиком, его можно скачать и выбрать, с какого места играть. В поиске — 30-секундные отрывки из каталога. Первая песня видна в профиле с обложкой, остальные — в плейлисте (до 10).')
    +_spSec('Ссылки')+`<div class="sp-card sp-pad"><div id="pxSocEd"></div>
      <div class="px-add"><input class="lm-inp" id="pxSocIn" placeholder="t.me/… · vk.com/… · tiktok.com/@…" onkeydown="if(event.key==='Enter')_pxSocAdd()"><button class="lm-btn primary" onclick="_pxSocAdd()">Добавить</button></div></div>`
    +_spHint('Значок соцсети определится сам. Без Premium — до 3 ссылок, с Premium — до 8.')
    +_spSec('Дополнительные юзернеймы')+`<div class="sp-card sp-pad"><div id="pxAlEd"></div>
      <div class="px-add"><input class="lm-inp" id="pxAlIn" placeholder="новый_юзернейм" autocapitalize="none" onkeydown="if(event.key==='Enter')_pxAlAdd()"><button class="lm-btn primary" onclick="_pxAlAdd()">Добавить</button></div></div>`
    +_spHint('По ним тебя тоже найдут — в профиле они показаны как «а также @…». Без Premium — 1, с SLON Premium — до 5. Сохраняются сразу.');
}
function _pxEditPaint(){
  const d=_pxDraft;if(!d)return;
  const g=$('pxNmGrid');
  if(g)g.innerHTML=NAME_STYLES.map(s=>`<button class="nm-cell${(d.name||'')===s.id?' sel':''}${s.prem&&!myPremium?' locked':''}" onclick="_pxPickName('${s.id}')"><span${_nmStyleAttr(s.id)}>${esc(myNick||myUsername)}</span><i>${esc(s.name)}</i></button>`).join('');
  const m=$('pxMusic'),pl=d.playlist||[];
  if(m)m.innerHTML=pl.length?`<div class="px-pl">${pl.map((t,i)=>`<div class="px-pl-row${i===0?' main':''}">
      ${t.cover?`<img src="${esc(t.cover)}" alt="">`:'<span class="px-cover-none"></span>'}
      <div class="px-tr-t"><b>${esc(t.title)}</b><span>${i===0?'В профиле · ':''}${esc(t.artist)}${t.src==='file'?' · свой файл':t.src==='au'?' · целиком':_pxSrcTag(t)}${t.start?' · с '+_rcFmt(t.start*1000):''}</span></div>
      ${(t.src==='file'||t.src==='au')?`<button class="px-mini" title="С какого места играть" onclick="_pxSegOpen(${i})"><svg viewBox="0 0 24 24"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.96 8.96 0 0 0 12 4a9 9 0 1 0 9 9c0-2.12-.74-4.07-1.97-5.61zM12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/></svg></button>`:''}${i?`<button class="px-mini" title="Сделать главной" onclick="_pxMain(${i})"><svg viewBox="0 0 24 24"><path d="M12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.6L12 2 9.2 8.7l-7.2.6 5.4 4.7-1.6 7z"/></svg></button>`:''}
      <button class="px-mini" title="Убрать" onclick="_pxDel(${i})"><svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>`).join('')}</div>`
    :'<div class="px-empty">Песни пока нет — найди её ниже.</div>';
  const se=$('pxSocEd');
  if(se)se.innerHTML=(d.socials||[]).map((u,i)=>`<div class="px-ed-row">${_socIco(u)}<span>${esc(u.replace(/^https?:\/\//,''))}</span><button class="px-mini" onclick="_pxSocDel(${i})"><svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>`).join('');
  const ae=$('pxAlEd'),al=_pxMe().aliases||[];
  if(ae)ae.innerHTML=`<div class="px-ed-row main"><b>@${esc(myUsername)}</b><span>основной</span></div>`+al.map((a,i)=>`<div class="px-ed-row"><b>@${esc(a)}</b><span></span><button class="px-mini" onclick="_pxAlDel(${i})"><svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>`).join('');
}
function _pxPickName(id){
  const s=NAME_STYLES.find(x=>x.id===id);if(!s)return;
  if(s.prem&&!myPremium){toast('Переливающийся ник — в SLON Premium');return;}
  _pxDraft.name=id||null;_pxEditPaint();_pxDirty();
}
let _pxQT=0;
function _pxSearchSoon(){clearTimeout(_pxQT);_pxQT=setTimeout(_pxSearch,350);}
let _pxRes=[];
async function _pxSearch(){
  const q=($('pxQ')?.value||'').trim(),box=$('pxRes');if(!box)return;
  if(q.length<2){box.innerHTML='';return;}
  box.innerHTML='<div class="px-empty">Ищем…</div>';
  try{
    const [au,dz]=await Promise.allSettled([AU_ON?_auSearch(q):Promise.resolve([]),_dzSearch(q)]);
    const A=au.status==='fulfilled'?au.value:[],D=dz.status==='fulfilled'?dz.value:[];
    _pxRes=[...A,...D];
    if(!_pxRes.length&&au.status==='rejected'&&dz.status==='rejected')throw new Error('Каталоги не отвечают');
    box.innerHTML=_pxRes.length?_pxRes.map((t,i)=>(i===0&&A.length?'<div class="px-res-h">Целиком</div>':'')+(i===A.length&&D.length?'<div class="px-res-h">Отрывки 30 секунд</div>':'')+`<div class="px-pl-row" onclick="_pxAdd(${i})">
        ${t.cover?`<img src="${esc(t.cover)}" alt="">`:'<span class="px-cover-none"></span>'}
        <div class="px-tr-t"><b>${esc(t.title)}</b><span>${esc(t.artist)}${t.dur?' · '+_rcFmt(t.dur*1000):''}</span></div>
        <button class="px-play" data-trplay="${t.id}" onclick="event.stopPropagation();_pxPlay(_pxRes[${i}],this)"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></div>`).join(''):'<div class="px-empty">Ничего не нашли</div>';
    _pxBtns();
  }catch(e){box.innerHTML=`<div class="px-empty">${esc(e.message)}</div>`;}
}
function _pxAdd(i){
  const t=_pxRes[i];if(!t)return;
  const pl=_pxDraft.playlist=(_pxDraft.playlist||[]).filter(x=>x.id!==t.id);
  if(pl.length>=10){toast('В плейлисте до 10 песен');return;}
  pl.push(t);_pxDraft.track=pl[0];
  _pxEditPaint();_pxDirty();toast(pl.length===1?'Песня в профиле':'Добавлено в плейлист');
}
function _pxMain(i){const pl=_pxDraft.playlist;const [t]=pl.splice(i,1);pl.unshift(t);_pxDraft.track=pl[0];_pxEditPaint();_pxDirty();}
function _pxDel(i){const pl=_pxDraft.playlist;pl.splice(i,1);_pxDraft.track=pl[0]||null;_pxEditPaint();_pxDirty();}
function _pxSocAdd(){
  const u=_socNorm($('pxSocIn')?.value);if(!u){toast('Вставь ссылку');return;}
  const s=_pxDraft.socials=_pxDraft.socials||[];
  if(s.length>=_pxLimitSocials()){toast(myPremium?'Не больше 8 ссылок':'Без Premium — до 3 ссылок');return;}
  if(!s.includes(u))s.push(u);$('pxSocIn').value='';_pxEditPaint();_pxDirty();
}
function _pxSocDel(i){_pxDraft.socials.splice(i,1);_pxEditPaint();_pxDirty();}
// доп. юзернеймы — сразу на сервер (бронь), переадресация профиля — в Firebase
async function _pxAliasesSave(list){
  const d=await api('/aliases',{aliases:list});
  const p=_pxMe();p.aliases=d.aliases||list;
  if(_pxDraft)_pxDraft.aliases=p.aliases;
  _pxSave(true);
  try{
    for(const a of p.aliases)window._fbSet?.(window._fbRef(window._fbDb,'profiles/'+a),{redirectTo:myUsername,username:myUsername,alias:true,ts:Date.now()});
    for(const a of d.removed||[])window._fbRemove?.(window._fbRef(window._fbDb,'profiles/'+a));
  }catch(e){}
  _pxEditPaint();
}
async function _pxAlAdd(){
  const a=String($('pxAlIn')?.value||'').trim().toLowerCase().replace(/^@/,'');
  if(!/^[a-z0-9_]{3,20}$/.test(a)){toast('3–20 символов: латиница, цифры и _');return;}
  const cur=_pxMe().aliases||[];
  if(cur.includes(a))return;
  if(cur.length>=_pxLimitAliases()){toast(myPremium?'Не больше 5 дополнительных юзернеймов':'Без Premium — 1 дополнительный юзернейм, с SLON Premium — до 5');return;}
  try{await _pxAliasesSave([...cur,a]);$('pxAlIn').value='';toast('@'+a+' — теперь тоже твой');}
  catch(e){toast(e.message||'Не удалось');}
}
async function _pxAlDel(i){
  const cur=(_pxMe().aliases||[]).slice();const [a]=cur.splice(i,1);
  const ok=typeof slonConfirm==='function'?await slonConfirm({title:'Убрать @'+a+'?',text:'Этот юзернейм освободится, и его сможет занять кто угодно.',buttons:[{label:'Убрать',value:true,danger:true},{label:'Отмена',value:null}]}):true;
  if(!ok)return;
  try{await _pxAliasesSave(cur);}catch(e){toast(e.message||'Не удалось');}
}

// ════════ Полные песни: свои файлы (mp3/m4a…) и SoundCloud ════════
// Свой трек: название, исполнитель и обложка берутся из тегов файла (ID3), файл лежит на нашем сервере
// постоянно (до 5 штук по 15 МБ), его можно скачать. SoundCloud — официальный встраиваемый плеер, трек целиком.
function _id3Read(buf){
  const b=new Uint8Array(buf),out={};
  if(b[0]!==0x49||b[1]!==0x44||b[2]!==0x33)return out;          // «ID3»
  const ver=b[3],ss=i=>(b[i]<<21)|(b[i+1]<<14)|(b[i+2]<<7)|b[i+3];
  const end=10+ss(6);let p=10;
  if(b[5]&0x40)p+=ver===4?ss(10):((b[10]<<24)|(b[11]<<16)|(b[12]<<8)|b[13])+4;   // расширенный заголовок
  const txt=(enc,a,z)=>{const s=b.subarray(a,z);
    try{if(enc===0)return new TextDecoder('latin1').decode(s).replace(/\0+$/,'');
      if(enc===3)return new TextDecoder('utf-8').decode(s).replace(/\0+$/,'');
      return new TextDecoder(enc===1?'utf-16':'utf-16be').decode(s).replace(/\0+$/,'');}catch(e){return '';}};
  while(p+10<=end&&p+10<=b.length){
    const id=String.fromCharCode(b[p],b[p+1],b[p+2],b[p+3]);
    const sz=ver===4?ss(p+4):((b[p+4]<<24)|(b[p+5]<<16)|(b[p+6]<<8)|b[p+7]);
    if(!/^[A-Z0-9]{4}$/.test(id)||sz<=0)break;
    const a=p+10,z=Math.min(a+sz,b.length);
    if(id==='TIT2')out.title=txt(b[a],a+1,z).trim();
    else if(id==='TPE1')out.artist=txt(b[a],a+1,z).trim();
    else if(id==='APIC'&&!out.cover){
      const enc=b[a];let i=a+1;while(i<z&&b[i])i++;const mime=new TextDecoder('latin1').decode(b.subarray(a+1,i))||'image/jpeg';
      i+=2;                                                        // 0 + тип картинки
      if(enc===1||enc===2){while(i+1<z&&(b[i]||b[i+1]))i+=2;i+=2;}else{while(i<z&&b[i])i++;i++;}
      out.cover=new Blob([b.slice(i,z)],{type:/image\//.test(mime)?mime:'image/jpeg'});
    }
    p=a+sz;
  }
  return out;
}
// обложку уменьшаем до 300px jpeg — лёгкая и быстрая
function _pxCoverJpeg(blob){
  return new Promise(res=>{
    const img=new Image(),u=URL.createObjectURL(blob);
    img.onload=()=>{const k=Math.min(1,300/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');
      c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(u);c.toBlob(b=>res(b),'image/jpeg',.85);};
    img.onerror=()=>{URL.revokeObjectURL(u);res(null);};img.src=u;
  });
}
function _pxDur(file){return new Promise(res=>{const a=new Audio(),u=URL.createObjectURL(file);a.preload='metadata';
  a.onloadedmetadata=()=>{const d=a.duration;URL.revokeObjectURL(u);res(isFinite(d)?Math.round(d):0);};a.onerror=()=>{URL.revokeObjectURL(u);res(0);};a.src=u;});}
function _pxPut(url,blob,onProg){
  return new Promise((res,rej)=>{const x=new XMLHttpRequest();x.open('PUT',url);
    if(blob.type)x.setRequestHeader('Content-Type',blob.type);
    x.upload.onprogress=e=>{if(e.lengthComputable&&onProg)onProg(Math.round(e.loaded/e.total*100));};
    x.onload=()=>x.status<300?res():rej(new Error('ошибка загрузки '+x.status));x.onerror=()=>rej(new Error('нет интернета'));x.send(blob);});
}
function _pxPickFile(){
  const i=document.createElement('input');i.type='file';i.accept='audio/*,.mp3,.m4a,.ogg,.flac,.wav';
  i.onchange=()=>{const f=i.files&&i.files[0];if(f)_pxUploadFile(f);};i.click();
}
async function _pxUploadFile(file){
  const pl=_pxDraft.playlist=_pxDraft.playlist||[];
  if(pl.length>=10){toast('В плейлисте до 10 песен');return;}
  if(file.size>15*1024*1024){toast('Трек больше 15 МБ');return;}
  const st=$('pxUpSt');const say=t=>{if(st){st.textContent=t;st.style.display=t?'':'none';}};
  try{
    say('Читаем теги…');
    const tags=_id3Read(await file.slice(0,Math.min(file.size,2*1024*1024)).arrayBuffer());
    const base=file.name.replace(/\.[^.]+$/,'');const m=base.split(/\s+[-–—]\s+/);
    const title=(tags.title||(m[1]||base)).slice(0,120),artist=(tags.artist||(m[1]?m[0]:'')).slice(0,80);
    const mime=file.type||(/\.m4a$/i.test(file.name)?'audio/mp4':/\.ogg$/i.test(file.name)?'audio/ogg':'audio/mpeg');
    const d=await api('/pmusic/presign',{size:file.size,mime});
    const dur=await _pxDur(file);
    await _pxPut(d.put,file.type?file:new Blob([file],{type:mime}),p=>say('Загрузка '+p+'%'));
    let cover='';
    if(tags.cover){const c=await _pxCoverJpeg(tags.cover);if(c){try{await _pxPut(d.putCover,c);cover=d.cover;}catch(e){}}}
    pl.push({src:'file',id:d.id,url:d.url,title,artist,cover,dur});_pxDraft.track=pl[0];
    say('');_pxEditPaint();_pxDirty();toast(pl.length===1?'Трек в профиле':'Трек добавлен в плейлист');
  }catch(e){say('');toast(e.message||'Не удалось загрузить');}
}
async function _pxScAdd(){
  const raw=String($('pxScIn')?.value||'').trim();
  if(!/soundcloud\.com\//i.test(raw)){toast('Вставь ссылку на трек SoundCloud');return;}
  const url=_socNorm(raw).split('?')[0];
  const pl=_pxDraft.playlist=_pxDraft.playlist||[];
  if(pl.length>=10){toast('В плейлисте до 10 песен');return;}
  try{
    const r=await fetch('https://soundcloud.com/oembed?format=json&url='+encodeURIComponent(url));
    if(!r.ok)throw new Error('Трек не найден или закрыт для встраивания');
    const j=await r.json();
    const artist=j.author_name||'',title=String(j.title||'').replace(new RegExp('\\s+by\\s+'+artist.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i'),'');
    if(pl.some(x=>x.url===url))return;
    pl.push({src:'sc',id:'sc:'+url,url,title:title.slice(0,120),artist:artist.slice(0,80),cover:j.thumbnail_url||''});_pxDraft.track=pl[0];
    $('pxScIn').value='';_pxEditPaint();_pxDirty();toast('Трек SoundCloud добавлен');
  }catch(e){toast(e.message||'SoundCloud не отвечает');}
}
// SoundCloud играет в своём официальном плеере (целиком)
let _pxSheetTr=null;
function _pxScSheet(tr){
  _pxSheetTr=tr;
  _pxSheet(`<div class="px-sh-t">${esc(tr.title)}</div><iframe class="px-sc" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(tr.url)}&auto_play=true&visual=true&hide_related=true&show_comments=false"></iframe>
    <button class="lm-btn" style="margin-top:10px" onclick="_pxLyrics(_pxSheetTr)">Текст песни</button>`);
}
async function _pxDownload(tr){
  if(!_pxCanDl(tr))return;
  try{
    toast('Скачивается…');
    const b=await (await fetch(tr.src==='au'?await _auDownloadUrl(tr):tr.url)).blob();
    const a=document.createElement('a');a.href=URL.createObjectURL(b);
    a.download=((tr.artist?tr.artist+' - ':'')+tr.title).replace(/[\\/:*?"<>|]+/g,'_')+(/mp4/.test(b.type)?'.m4a':/ogg/.test(b.type)?'.ogg':'.mp3');
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);
  }catch(e){toast('Не удалось скачать');}
}
// при сохранении — свои треки, убранные из плейлиста, удаляем с сервера
{const f=_spSaveCustom;_spSaveCustom=function(){
  try{
    const before=(_pxMe().playlist||[]).filter(t=>t.src==='file').map(t=>t.id);
    const after=new Set(((_pxDraft&&_pxDraft.playlist)||[]).filter(t=>t.src==='file').map(t=>t.id));
    for(const id of before)if(!after.has(id))api('/pmusic/delete',{id}).catch(()=>{});
  }catch(e){}
  return f.apply(this,arguments);
};}

// ════════ Audius: поиск и треки целиком (открытый API, без ключа) ════════
// Выдаются только треки, которые автор открыл для прослушивания; скачать — если автор разрешил.
const AU_APP='SLON';
// звук Audius из РФ недоступен (узлы хранения не отвечают ни с телефона, ни с нашего сервера) — поиск выключен
const AU_ON=false;
let _auHostP=null;
function _auHost(){
  if(!_auHostP)_auHostP=fetch('https://api.audius.co').then(r=>r.json()).then(d=>{const l=d.data||[];return l[Math.floor(Math.random()*l.length)]||'https://api.audius.co';}).catch(()=>{_auHostP=null;return 'https://api.audius.co';});
  return _auHostP;
}
async function _auSearch(q){
  const h=await _auHost();
  const r=await fetch(h+'/v1/tracks/search?app_name='+AU_APP+'&query='+encodeURIComponent(q));
  const j=await r.json();
  return (j.data||[]).filter(t=>t.is_streamable!==false&&!t.is_stream_gated&&!t.is_delete).slice(0,15).map(t=>({
    src:'au',id:'au:'+t.id,au:t.id,title:String(t.title||'').slice(0,120),artist:String(t.user?.name||'').slice(0,80),
    cover:t.artwork?.['480x480']||t.artwork?.['150x150']||'',dur:t.duration||0,dl:!!(t.is_downloadable&&!t.is_download_gated)}));
}
async function _auStream(tr){return (await _auHost())+'/v1/tracks/'+encodeURIComponent(tr.au)+'/stream?app_name='+AU_APP;}
async function _auDownloadUrl(tr){return (await _auHost())+'/v1/tracks/'+encodeURIComponent(tr.au)+'/download?app_name='+AU_APP;}

// ════════ Отрывок: с какого места играть трек в профиле (свои файлы и Audius) ════════
let _pxSegI=-1,_pxSegA=null;
function _pxSegOpen(i){
  const t=_pxDraft?.playlist?.[i];if(!t||!(t.src==='file'||t.src==='au'))return;
  _pxSegI=i;const dur=Math.max(1,t.dur||0),st=Math.min(t.start||0,dur-1);
  _pxSheet(`<div class="px-sh-t">С какого места играть</div>
    <div class="px-lyr-hd">${t.cover?`<img src="${esc(t.cover)}" alt="">`:''}<div><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></div></div>
    <input type="range" class="px-seg" id="pxSeg" min="0" max="${dur-1}" step="1" value="${st}" oninput="_pxSegLbl()">
    <div class="px-seg-row"><span id="pxSegT">${_rcFmt(st*1000)}</span><span>${_rcFmt(dur*1000)}</span></div>
    <div class="px-src-btns"><button class="lm-btn" onclick="_pxSegTry()">Послушать отсюда</button><button class="lm-btn primary" onclick="_pxSegSave()">Сохранить</button></div>`);
}
function _pxSegLbl(){const v=+($('pxSeg')?.value||0);const e=$('pxSegT');if(e)e.textContent=_rcFmt(v*1000);}
async function _pxSegTry(){
  const t=_pxDraft?.playlist?.[_pxSegI];if(!t)return;
  try{
    if(!_pxSegA){_pxSegA=new Audio();}
    const src=t.src==='file'?t.url:await _auStream(t);
    if(_pxSegA.dataset.src!==src){_pxSegA.src=src;_pxSegA.dataset.src=src;await new Promise(r=>{_pxSegA.onloadedmetadata=r;setTimeout(r,4000);});}
    _pxSegA.currentTime=+($('pxSeg')?.value||0);await _pxSegA.play();
  }catch(e){toast('Не удалось включить');}
}
function _pxSegSave(){
  const t=_pxDraft?.playlist?.[_pxSegI];if(!t)return;
  t.start=+($('pxSeg')?.value||0)||0;_pxSegA?.pause();
  _pxSheetClose();_pxEditPaint();_pxDirty();toast('Будет играть с '+_rcFmt(t.start*1000));
}
