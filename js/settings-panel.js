// ════════════════════════════════════════════════════════
// ── МОЙ ПРОФИЛЬ + НАСТРОЙКИ (панель в сайдбаре, как в Telegram) ──
// Открывается поверх списка чатов, открытый чат справа остаётся.
// Также: карточка привязанного канала, кастомизация фона профиля,
// окно «Информация о канале».
// ════════════════════════════════════════════════════════

// Иконки настроек (белые глифы на цветных скруглённых квадратах)
const _SP_ICONS={
  bell:'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  data:'M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z',
  key:'M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  gear:'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',
  folder:'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  heart:'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  speaker:'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  devices:'M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z',
  globe:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
  keyboard:'M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z',
  star:'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  gift:'M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-5.5-1.65l-.5.67-.5-.68A3 3 0 0 0 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4 15.38 12 17 10.83 14.92 8H20v6z',
  brush:'M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 0 0 0-1.41z',
  at:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  info:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  person:'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  link:'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  plus:'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  logout:'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  shield:'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z',
  camera:'M12 15.2A3.2 3.2 0 1 1 15.2 12 3.2 3.2 0 0 1 12 15.2zm7.2-10.4h-2.136l-1.664-2H8.6l-1.664 2H4.8A2.4 2.4 0 0 0 2.4 7.2v10.4A2.4 2.4 0 0 0 4.8 20h14.4a2.4 2.4 0 0 0 2.4-2.4V7.2a2.4 2.4 0 0 0-2.4-2.4z',
  pencil:'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  trash:'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  close:'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  dots:'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  copy:'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  chevron:'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z'
};

// Готовые градиенты фона профиля (центр → края), как в Telegram
const SP_PROFILE_GRADS=[
  ['#f2a65a','#d9793a'],['#7cb8ff','#3b6fe0'],['#8fdc79','#3c9e55'],['#ff9ab8','#d9477f'],
  ['#c3a6ff','#7b4fd6'],['#5fd9e8','#11869a'],['#ffc861','#e3801b'],['#a3b3c2','#56657a'],
  ['#ff8a80','#c62f3c'],['#9ee6c2','#2f9e7a'],['#b0a4ff','#4b3bbd'],['#3a3f4b','#16181d']
];

let _spChMetaCache={};  // username канала -> meta (для чужих каналов)
let _spChSubsCache={};  // username канала -> кол-во подписчиков

function _spSvg(name){return `<svg viewBox="0 0 24 24"><path d="${_SP_ICONS[name]||''}"/></svg>`;}
function _spIco(color,name){return `<div class="sp-ico sp-c-${color}">${_spSvg(name)}</div>`;}

// Строка карточки: иконка, заголовок, подпись снизу, значение справа
function _spRow(o){
  return `<div class="sp-row${o.cls?' '+o.cls:''}" onclick="${o.onclick||''}">
    ${o.ico?_spIco(o.color||'gray',o.ico):'<div class="sp-ico-pad"></div>'}
    <div class="sp-row-txt">
      <div class="sp-row-title">${o.title}</div>
      ${o.sub?`<div class="sp-row-sub">${o.sub}</div>`:''}
    </div>
    ${o.val!=null&&o.val!==''?`<div class="sp-row-val">${o.val}</div>`:''}
  </div>`;
}

function _isChannelId(id){return !!id&&(id===SLON_CHANNEL_ID||id.startsWith('ch_'));}

function _spPlural(n,one,few,many){
  const m10=n%10,m100=n%100;
  if(m10===1&&m100!==11)return one;
  if(m10>=2&&m10<=4&&(m100<12||m100>14))return few;
  return many;
}
function _spSubsText(n){return n+' '+_spPlural(n,'подписчик','подписчика','подписчиков');}

// ── Аватарки без фото: буквы имени и фамилии на цветах Telegram ──
const _AV_COLORS=[['#ff885e','#ff516a'],['#ffcd6a','#ffa85c'],['#82b1ff','#665fff'],['#a0de7e','#54cb68'],['#53edd6','#28c9b7'],['#72d5fd','#2a9ef1'],['#e0a2f3','#d669ed']];
function _avColor(id){
  let h=0;for(const c of String(id||'?'))h=(h*31+c.codePointAt(0))|0;
  const [a,b]=_AV_COLORS[Math.abs(h)%_AV_COLORS.length];
  return `linear-gradient(180deg,${a},${b})`;
}
// «Иван Петров» → «ИП», «ivan» → «I», «📢 Канал» → «К»
function _initials(name){
  const w=String(name||'').replace(/@/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').trim().split(/\s+/).filter(Boolean);
  if(!w.length)return '?';
  return ([...w[0]][0]+(w[1]?[...w[1]][0]:'')).toUpperCase();
}
function _avHtml(id,name){
  return `<span class="av-l" style="background:${_avColor(id)}"><b>${esc(_initials(name))}</b></span>`;
}
// Аватарка-кружок: картинка или буквы
function _spAvatarHtml(src,name,cls,id){
  if(src)return `<div class="${cls}"><img src="${src}" alt=""></div>`;
  return `<div class="${cls}">${_avHtml(id||name,name)}</div>`;
}

// Дополнительные иконки
Object.assign(_SP_ICONS,{
  cake:'M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12C21 10.34 19.66 9 18 9z',
  clock:'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  lock:'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  block:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z',
  shieldCheck:'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
  account:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88a9.95 9.95 0 0 1 12.28 0C16.43 19.18 14.03 20 12 20z',
  calendar:'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z',
  chat:'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
  phone:'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  video:'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
  check:'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  image:'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  mic:'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  expand:'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z'
});

// ════════════════════════════════════════
// ── НАВИГАЦИЯ ВНУТРИ САЙДБАРА (стек страниц) ──
// Каждая страница настроек выезжает справа, «назад» — уезжает обратно.
// ════════════════════════════════════════
let _spStack=[];

function _spPush(title,bodyHtml,opts={}){
  const panel=$('spPanel');
  const page=document.createElement('div');
  page.className='sp-page';
  page.innerHTML=`<div class="sp-page-hdr">
      <button class="sp-tb-btn" onclick="_spPop()" title="Назад">${_spSvg('back')}</button>
      <div class="sp-tb-title">${title}</div>${opts.right||''}
    </div>
    <div class="sp-page-body">${bodyHtml}</div>${opts.fab||''}`;
  // Предыдущий экран уезжает влево и темнеет
  (_spStack[_spStack.length-1]||$('spBase')).classList.add('sp-behind');
  panel.appendChild(page);
  _spStack.push(page);
  void page.offsetWidth;
  page.classList.add('in');
  return page;
}

function _spPop(instant){
  const page=_spStack.pop();if(!page)return;
  // Страница может держать ресурсы (камера, микрофон, анимация) — освобождаем
  try{page._onClose?.();}catch(e){}
  const under=_spStack[_spStack.length-1]||$('spBase');
  under.classList.remove('sp-behind');
  if(instant){page.remove();return;}
  page.classList.remove('in');
  setTimeout(()=>page.remove(),420);
  // Базовый экран мог устареть (имя, фон и т.п.)
  if(!_spStack.length)_spRender(true);
}

function _spPopAll(){while(_spStack.length)_spPop(true);$('spBase')?.classList.remove('sp-behind');}
function _spTopPage(){return _spStack[_spStack.length-1]||null;}

// Заголовок секции над карточкой (как «Privacy», «Channel» в Telegram)
function _spSec(title,right){return `<div class="sp-sec">${title}${right?`<span>${right}</span>`:''}</div>`;}
function _spCard(inner,extra){return `<div class="sp-card${extra?' '+extra:''}">${inner}</div>`;}
function _spHint(t){return `<div class="sp-hint">${t}</div>`;}
// Строка с чекбоксом
function _spCheckRow(on,title,sub,onclick,disabled){
  return `<div class="sp-row sp-check-row${disabled?' disabled':''}" onclick="${disabled?'':onclick}">
    <div class="sp-check${on?' on':''}">${_spSvg('check')}</div>
    <div class="sp-row-txt"><div class="sp-row-title">${title}</div>${sub?`<div class="sp-row-sub">${sub}</div>`:''}</div></div>`;
}
Object.assign(_SP_ICONS,{back:'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'});

// ── ОТКРЫТИЕ / ЗАКРЫТИЕ ПАНЕЛИ ──
function openMyProfilePanel(){
  const panel=$('spPanel');if(!panel)return;
  _spPopAll();
  _spRender();
  $('spScroll').scrollTop=0;
  $('spTopbar').classList.remove('solid');
  // На мобильном сайдбар — выезжающая шторка: сначала показываем её
  if(window.innerWidth<=640&&!$('sidebar').classList.contains('open'))toggleSidebar();
  // Перезапуск анимации появления карточек при каждом открытии
  panel.classList.remove('open');void panel.offsetWidth;
  panel.classList.add('open');panel.setAttribute('aria-hidden','false');
  $('sidebar').classList.add('sp-open');
  $('bn-profile')?.classList.add('active');$('bn-chats')?.classList.remove('active');
}

function closeMyProfilePanel(){
  const panel=$('spPanel');if(!panel||!panel.classList.contains('open'))return;
  panel.classList.remove('open');panel.setAttribute('aria-hidden','true');
  $('sidebar').classList.remove('sp-open');
  _spCloseMenu();
  setTimeout(_spPopAll,420);
  $('bn-chats')?.classList.add('active');$('bn-profile')?.classList.remove('active');
}

function _spRefresh(){if($('spPanel')?.classList.contains('open'))_spRender(true);}

function _myFullName(){return (myNick||'')+(myLastName?' '+myLastName:'');}

// ── ГЛАВНЫЙ ЭКРАН ПРОФИЛЯ ──
function _spRender(quiet){
  $('spHeroBg').style.background=_getProfileBgStyle(myProfileBg,myProfileBgColor,myProfilePattern);
  const displayName=_myFullName().trim()||('@'+myUsername);
  $('spAv').innerHTML=(myAvatar?`<img src="${myAvatar}" alt="">`:_avHtml(myUsername,_myFullName().trim()||myUsername))
    +`<div class="sp-av-cam">${_spSvg('camera')}</div>`;
  $('spName').innerHTML=esc(displayName)
    +(hasElephantBadge?' <span class="sp-badge" title="Слонгалочка">🐘</span>':'')
    +(myPremium?' <span class="sp-badge" title="SLON Premium">⭐</span>':'');
  $('spStatus').innerHTML=_fbMode
    ?'<span class="sp-dot on"></span>в сети'
    :'<span class="sp-dot"></span>подключение…';

  let i=0;const card=(html,extra)=>`<div class="sp-card${extra?' '+extra:''}" style="--i:${i++}">${html}</div>`;
  let h='';

  // Канал, привязанный к профилю: заголовок над карточкой, как в Telegram
  if(myLinkedChannel){
    h+=`<div class="sp-anim" style="--i:${i++}">${_spChannelBlock(myLinkedChannel,true)}</div>`;
  }else{
    h+=card(_spRow({ico:'plus',color:'blue',title:'Добавить канал в профиль',sub:'Его увидят все, кто откроет твой профиль',onclick:'_spPickChannel()'}));
  }

  // Инфо
  h+=card(
    _spRow({ico:'at',color:'cyan',title:'@'+esc(myUsername),sub:'Юзернейм',onclick:'copyMyId()'})
   +_spRow({ico:'info',color:'gray',title:myBio?esc(myBio).replace(/\n/g,'<br>'):'<span class="sp-muted">Расскажи о себе</span>',sub:'О себе',onclick:'_spEditProfile()',cls:'sp-row-multi'})
   +(myBirthday?_spRow({ico:'cake',color:'violet',title:_bdText(myBirthday),sub:'День рождения',onclick:'_spEditProfile()'}):'')
   +(myBusinessHours?.enabled?_bhRow({...myBusinessHours,tz:_myTz()},'sp',true):'')
  );

  // Аккаунт и общие
  h+=card(
    _spRow({ico:'account',color:'blue',title:'Аккаунт',sub:'Имя, юзернейм, о себе, день рождения',onclick:'_spEditProfile()'})
   +_spRow({ico:'gear',color:'orange',title:'Общие настройки',sub:'Тема, обои, кастомизация профиля',onclick:'_spGeneral()'})
  );

  // Основные настройки
  h+=card(
    _spRow({ico:'bell',color:'red',title:'Уведомления и звуки',onclick:'_spNotifications()'})
   +_spRow({ico:'data',color:'green',title:'Данные и память',onclick:'_spDataStorage()'})
   +_spRow({ico:'key',color:'steel',title:'Конфиденциальность',onclick:'_spPrivacy()'})
   +_spRow({ico:'brush',color:'purple',title:'Кастомизация профиля',onclick:'_spCustomize()'})
   +_spRow({ico:'clock',color:'orange',title:'Часы работы',val:myBusinessHours?.enabled?'Вкл':'',onclick:'_bhEditor()'})
   +_spRow({ico:'folder',color:'blue',title:'Папки с чатами',onclick:'_spFolders()'})
   +_spRow({ico:'heart',color:'pink',title:'Стикеры и эмодзи',onclick:'_spStickers()'})
   +_spRow({ico:'speaker',color:'green',title:'Звук и камера',onclick:'_spAV()'})
   +_spRow({ico:'bolt',color:'violet',title:'Анимации и производительность',onclick:'_spAnimations()'})
   +_spRow({ico:'devices',color:'blue',title:'Устройства',onclick:'_spSessions()'})
   +_spRow({ico:'globe',color:'violet',title:'Язык',val:_langName(),onclick:'_spLanguage()'})
   +_spRow({ico:'keyboard',color:'orange',title:'Горячие клавиши',onclick:'_spSoon()'})
  );

  // Premium
  h+=card(
    _spRow({ico:'star',color:'premium',title:'SLON Premium',val:myPremium?'Активна':'',onclick:'_spPremiumInfo()'})
   +_spRow({ico:'gift',color:'orange',title:'Подарить Premium',onclick:'_spSoon()'})
  );

  if(CHANNEL_ADMINS.has(myUsername)){
    h+=card(_spRow({ico:'shield',color:'blue',title:'Консоль администратора',sub:'Пользователи и канал SLON',onclick:'showAdminConsolePage()'}));
  }

  h+=card(_spRow({ico:'logout',color:'red',title:'Выйти из аккаунта',sub:'@'+esc(myUsername),onclick:'logout()',cls:'sp-row-danger'}));
  h+='<div class="sp-footer">SLON Messenger 🐘</div>';
  const body=$('spBody');
  body.innerHTML=h;
  body.classList.toggle('sp-quiet',!!quiet);
  if(myLinkedChannel)_spLoadChannelData(myLinkedChannel);
}

function _spSoon(){toast('Скоро 🐘');}

function _spOnScroll(){
  const sc=$('spScroll'),tb=$('spTopbar');if(!sc||!tb)return;
  // Сплошной до того, как имя доедет до заголовка
  tb.classList.toggle('solid',sc.scrollTop>$('spHero').offsetHeight-130);
}

// ── МЕНЮ «ТРИ ТОЧКИ» ──
function _spToggleMenu(e){
  e?.stopPropagation();
  const m=$('spMenu');
  if(m.classList.contains('show')){_spCloseMenu();return;}
  const it=(ico,txt,fn,danger)=>`<button class="sp-menu-item${danger?' danger':''}" onclick="_spCloseMenu();${fn}">${_spSvg(ico)}<span>${txt}</span></button>`;
  m.innerHTML=it('pencil','Изменить профиль','_spEditProfile()')
    +it('camera','Сменить фото',"$('avIn').click()")
    +(myAvatar?it('trash','Удалить фото','removeAvatar()',true):'')
    +it('brush','Кастомизация профиля','_spCustomize()')
    +(myPasscode?it('lock','Заблокировать SLON','_pcLockNow()'):'')
    +it('logout','Выйти','logout()',true);
  m.classList.add('show');
}
function _spCloseMenu(){$('spMenu')?.classList.remove('show');$('ppMenu')?.classList.remove('show');}
document.addEventListener('click',e=>{if(!e.target.closest?.('#spMenu,#ppMenu'))_spCloseMenu();});

// ════════════════════════════════════════
// ── КАНАЛ В ПРОФИЛЕ ──
// ════════════════════════════════════════
function _spChannelMeta(username){
  const id='ch_'+username;
  return myChannels[id]||subscribedChannels[id]||_spChMetaCache[username]||null;
}

// Заголовок «Канал · N подписчиков» + карточка
function _spChannelBlock(username,isMine){
  const subs=_spChSubsCache[username];
  return `<div class="sp-ch-wrap" data-u="${esc(username)}" data-mine="${isMine?1:''}">
    ${_spSec('Канал'+(isMine?` <a class="sp-sec-link" onclick="_spPickChannel()">изменить</a>`:''),subs!=null?_spSubsText(subs):'')}
    <div class="sp-card">${_spChannelCardInner(username)}</div></div>`;
}

function _spChannelCardInner(username){
  const id='ch_'+username;
  const meta=_spChannelMeta(username)||{};
  const name=meta.name||('@'+username);
  const hist=chatHist[id]||[];
  const last=hist[hist.length-1];
  const preview=last?(last.text||(last.photoId?'🖼 Фото':last.fileInfo?'📎 Файл':'Пост')):(meta.desc||'Канал');
  const time=last?.ts?_spShortDate(last.ts):'';
  return `<div class="sp-ch-row" onclick="_spOpenChannel('${esc(username)}')">
      ${_spAvatarHtml(meta.avatar||peerAvatars[id],name,'sp-ch-av')}
      <div class="sp-ch-txt">
        <div class="sp-ch-top"><span class="sp-ch-name">${esc(name)}</span><span class="sp-ch-time">${time}</span></div>
        <div class="sp-ch-prev">${esc(String(preview).slice(0,80))}</div>
      </div>
    </div>`;
}

function _spShortDate(ts){
  const d=new Date(ts),now=new Date();
  if(d.toDateString()===now.toDateString())return fmtTime(ts);
  if(now-d<6*864e5)return d.toLocaleDateString('ru',{weekday:'short'});
  return d.toLocaleDateString('ru',{day:'numeric',month:'short'});
}

async function _spLoadChannelData(username){
  let changed=false;
  if(!_spChannelMeta(username)){
    const s=await _fbOnce('user_channels/'+username+'/meta');
    const m=s?.val();if(m){_spChMetaCache[username]=m;changed=true;}
  }
  if(_spChSubsCache[username]==null){
    const s=await _fbOnce('channel_subs/'+username);
    // null = таймаут/нет сети — число не показываем, чем показывать неправду
    if(s){const v=s.val();_spChSubsCache[username]=v?Object.keys(v).length:0;changed=true;}
  }
  if(!changed)return;
  document.querySelectorAll('.sp-ch-wrap').forEach(el=>{
    if(el.dataset.u===username)el.outerHTML=_spChannelBlock(username,!!el.dataset.mine);
  });
}

function _spOpenChannel(username){
  const id='ch_'+username;
  if($('si-'+id)||myChannels[id]||subscribedChannels[id]){
    closeMyProfilePanel();closePeerProfile();openChat(id);return;
  }
  closePeerProfile();
  showSubscribeChannel();
  setTimeout(()=>{const inp=$('subChInp');if(inp)inp.value=username;},30);
}

function _spPickChannel(){
  const mine=Object.entries(myChannels).filter(([,c])=>!c.owner||c.owner===myUsername);
  if(!mine.length){
    _spPush('Канал в профиле',
      _spCard(`<div class="sp-empty">📢<div>У тебя пока нет своего канала.<br>Создай его — и он появится в профиле.</div>
        <button class="sp-btn" onclick="closeMyProfilePanel();openWizard('channel')">Создать канал</button></div>`));
    return;
  }
  const opt=(u,title,sub,avHtml)=>`<div class="sp-pick${myLinkedChannel===u?' sel':''}" onclick="_spSetLinkedChannel('${esc(u)}')">
      ${avHtml}<div class="sp-pick-txt"><div>${title}</div>${sub?`<div class="sp-row-sub">${sub}</div>`:''}</div>
      <div class="sp-pick-radio"></div></div>`;
  const list=mine.map(([id,c])=>{
    const u=c.username||id.replace(/^ch_/,'');
    return opt(u,esc(c.name||'@'+u),'@'+esc(u),_spAvatarHtml(c.avatar,c.name||u,'sp-pick-av'));
  }).join('');
  _spPush('Канал в профиле',
    _spHint('Выбранный канал увидят все, кто откроет твой профиль')
    +_spCard(list+opt('','Не показывать','','<div class="sp-pick-av sp-av-letter">✕</div>'),'sp-pad'));
}

function _spSetLinkedChannel(u){
  myLinkedChannel=u;saveAll();
  if(_fbMode)_publishMyProfile();
  _spPop();
  toast(u?'Канал добавлен в профиль 📢':'Канал убран из профиля');
}

// ════════════════════════════════════════
// ── РЕДАКТИРОВАНИЕ ПРОФИЛЯ (Edit profile) ──
// ════════════════════════════════════════
function _spEditProfile(){
  _spCloseMenu();
  const bd=myBirthday?`${myBirthday.y||2000}-${String(myBirthday.m).padStart(2,'0')}-${String(myBirthday.d).padStart(2,'0')}`:'';
  const page=_spPush('Изменить профиль',`
    <div class="ep-av-wrap"><div class="ep-av" onclick="$('avIn').click()">
      ${myAvatar?`<img src="${myAvatar}" alt="">`:_avHtml(myUsername,_myFullName().trim()||myUsername)}
      <div class="ep-av-cam">${_spSvg('camera')}</div></div></div>
    <div class="sp-card sp-pad">
      <label class="sp-field"><input id="epFirst" maxlength="32" value="${esc(myNick)}" placeholder=" " oninput="_epDirty()"><span>Имя (обязательно)</span></label>
      <label class="sp-field"><input id="epLast" maxlength="32" value="${esc(myLastName)}" placeholder=" " oninput="_epDirty()"><span>Фамилия (необязательно)</span></label>
      <label class="sp-field sp-field-ta"><textarea id="epBio" maxlength="200" placeholder=" " oninput="_epDirty()">${esc(myBio)}</textarea><span>О себе</span><em id="epBioCnt">${200-(myBio||'').length}</em></label>
    </div>
    ${_spHint('Любые подробности: возраст, чем занимаешься или город. Например: 23 года, дизайнер из Казани')}
    <div class="sp-card">
      <label class="sp-row ep-bd-row">${_spIco('violet','cake')}
        <div class="sp-row-txt"><div class="sp-row-title">День рождения</div><div class="sp-row-sub" id="epBdTxt">${myBirthday?_bdText(myBirthday):'Не указан'}</div></div>
        <input type="date" id="epBd" value="${bd}" max="${new Date().toISOString().slice(0,10)}" onchange="_epDirty()">
      </label>
      ${myBirthday?`<div class="sp-row" onclick="$('epBd').value='';_epDirty()">${'<div class="sp-ico-pad"></div>'}<div class="sp-row-txt"><div class="sp-row-title sp-danger">Убрать день рождения</div></div></div>`:''}
    </div>
    ${_spHint('Кто видит твой день рождения — в <a onclick="_spPrivacy()">Конфиденциальности ›</a>')}
    ${_spSec('Юзернейм')}
    <div class="sp-card sp-pad">
      <label class="sp-field"><input id="newUsernameInp" maxlength="20" value="${esc(myUsername)}" placeholder=" " autocomplete="off" spellcheck="false"
        oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'');_epDirty()"><span>Юзернейм</span></label>
      <div class="m-err" id="newUsernameErr" style="display:none"></div>
    </div>
    ${_spHint('По юзернейму тебя найдут в SLON через «➕ Контакт».<br><br>Можно использовать <b>a–z</b>, <b>0–9</b> и подчёркивание. Минимум 3 символа.')}
    <div class="sp-card">${_spRow({ico:'clock',color:'orange',title:'Часы работы',sub:myBusinessHours?.enabled?'Показываются в профиле':'Выключены',onclick:'_bhEditor()'})}</div>
    <div style="height:70px"></div>`,
    {fab:`<button class="sp-fab" id="epSave" onclick="_epSave()" title="Сохранить">${_spSvg('check')}</button>`});
  page.querySelector('#epBio').addEventListener('input',e=>{$('epBioCnt').textContent=200-e.target.value.length;});
}

function _epDirty(){
  $('epSave')?.classList.add('show');
  const v=$('epBd')?.value;
  const t=$('epBdTxt');if(t)t.textContent=v?_bdText(_bdParse(v)):'Не указан';
}

function _bdParse(v){if(!v)return null;const [y,m,d]=v.split('-').map(Number);return {d,m,y};}

async function _epSave(){
  const first=($('epFirst').value||'').trim().slice(0,32);
  if(!first){toast('Имя обязательно');$('epFirst').focus();return;}
  myNick=first;
  myLastName=($('epLast').value||'').trim().slice(0,32);
  myBio=($('epBio').value||'').trim().slice(0,200);
  myBirthday=_bdParse($('epBd').value);
  const newU=($('newUsernameInp').value||'').trim();
  saveAll();updateProfileDisplay();_broadcastHello();
  if(newU&&newU!==myUsername){
    applyUsernameChange(); // читает #newUsernameInp / #newUsernameErr
    if($('newUsernameErr')?.style.display==='block')return;
  }
  _spPop();
  toast('Профиль сохранён ✓');
}

// ── ДЕНЬ РОЖДЕНИЯ ──
const _BD_MONTHS=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
function _bdText(b){
  if(!b||!b.d||!b.m)return '';
  let t=b.d+' '+_BD_MONTHS[b.m-1];
  if(b.y&&b.y>1900){
    const now=new Date();let age=now.getFullYear()-b.y;
    if(now.getMonth()+1<b.m||(now.getMonth()+1===b.m&&now.getDate()<b.d))age--;
    t+=` ${b.y} (${age} ${_spPlural(age,'год','года','лет')})`;
  }
  return t;
}

// ════════════════════════════════════════
// ── ЧАСЫ РАБОТЫ (Business hours) ──
// ════════════════════════════════════════
const _BH_DAYS=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
function _myTz(){return -new Date().getTimezoneOffset();}
function _bhDefault(){return {enabled:false,days:_BH_DAYS.map((_,i)=>({mode:i<5?'custom':'closed',from:'10:00',to:'20:00'}))};}
function _hm(s){const [h,m]=(s||'0:0').split(':').map(Number);return h*60+(m||0);}

// Открыто ли сейчас — по часовому поясу владельца
function _bhStatus(bh){
  const tz=bh.tz??_myTz();
  const d=new Date(Date.now()+tz*60000);
  const dow=(d.getUTCDay()+6)%7, mins=d.getUTCHours()*60+d.getUTCMinutes();
  const day=bh.days?.[dow];
  let open=false;
  if(day?.mode==='open24')open=true;
  else if(day?.mode==='custom'){
    const f=_hm(day.from),t=_hm(day.to);
    open=t>f?(mins>=f&&mins<t):(mins>=f||mins<t); // через полночь
  }
  return {open,dow};
}
function _bhDayText(day){
  if(!day||day.mode==='closed')return 'Выходной';
  if(day.mode==='open24')return 'Круглосуточно';
  return `${day.from} – ${day.to}`;
}

// Строка «Часы работы · Открыто» с разворачиванием по дням
function _bhRow(bh,prefix,mine){
  const st=_bhStatus(bh);
  const uid='bh_'+prefix+'_'+Math.random().toString(36).slice(2,7);
  const list=_BH_DAYS.map((n,i)=>`<div class="bh-day${i===st.dow?' today':''}"><b>${n}</b><span>${_bhDayText(bh.days?.[i])}</span></div>`).join('');
  return `<div class="sp-row bh-row" onclick="document.getElementById('${uid}').classList.toggle('open');this.classList.toggle('open')">
      ${prefix==='pp'?`<div class="pp-ico">${_spSvg('clock')}</div>`:_spIco('orange','clock')}
      <div class="sp-row-txt"><div class="sp-row-title">Часы работы</div>
        <div class="sp-row-sub ${st.open?'bh-open':'bh-closed'}">${st.open?'Открыто':'Закрыто'}</div></div>
      <div class="bh-chev">${_spSvg('expand')}</div>
    </div>
    <div class="bh-list" id="${uid}"><div class="bh-inner">${list}
      ${mine?`<div class="bh-edit" onclick="_bhEditor()">Изменить часы работы ›</div>`:''}</div></div>`;
}

function _bhEditor(){
  if(!myBusinessHours)myBusinessHours=_bhDefault();
  const bh=myBusinessHours;
  const rows=_BH_DAYS.map((n,i)=>{
    const d=bh.days[i];
    return `<div class="bhe-day" data-i="${i}">
      <div class="bhe-top"><b>${n}</b>
        <select onchange="_bhSet(${i},'mode',this.value)">
          <option value="custom"${d.mode==='custom'?' selected':''}>Часы</option>
          <option value="open24"${d.mode==='open24'?' selected':''}>Круглосуточно</option>
          <option value="closed"${d.mode==='closed'?' selected':''}>Выходной</option>
        </select></div>
      <div class="bhe-times${d.mode==='custom'?'':' hidden'}">
        <input type="time" value="${d.from}" onchange="_bhSet(${i},'from',this.value)"><span>—</span>
        <input type="time" value="${d.to}" onchange="_bhSet(${i},'to',this.value)">
      </div></div>`;
  }).join('');
  _spPush('Часы работы',
    _spCard(`<div class="sp-row" onclick="_bhToggle()"><div class="sp-row-txt"><div class="sp-row-title">Показывать часы работы</div>
      <div class="sp-row-sub">В профиле будет видно, открыт ты сейчас или нет</div></div>
      <div class="sp-switch${bh.enabled?' on':''}" id="bhSw"></div></div>`)
    +_spSec('Расписание')
    +`<div class="sp-card sp-pad" id="bhDays">${rows}</div>`
    +_spHint('Время указывается по твоему часовому поясу. Собеседники увидят статус «Открыто/Закрыто» по твоему времени.'));
}

function _bhToggle(){
  myBusinessHours.enabled=!myBusinessHours.enabled;
  $('bhSw')?.classList.toggle('on',myBusinessHours.enabled);
  _bhSave();
}
function _bhSet(i,k,v){
  myBusinessHours.days[i][k]=v;
  if(k==='mode')document.querySelector(`.bhe-day[data-i="${i}"] .bhe-times`)?.classList.toggle('hidden',v!=='custom');
  _bhSave();
}
let _bhSaveT=null;
function _bhSave(){
  saveAll();
  clearTimeout(_bhSaveT);_bhSaveT=setTimeout(_broadcastHello,800);
}

// ════════════════════════════════════════
// ── КОНФИДЕНЦИАЛЬНОСТЬ ──
// ════════════════════════════════════════
const _PRIV_DEF={lastSeen:'all',photo:'all',bio:'all',birthday:'contacts',calls:'all',voice:'all',messages:'all',groups:'all'};
const _PRIV_LBL={all:'Все',contacts:'Мои контакты',nobody:'Никто'};
const _PRIV_ITEMS=[
  ['lastSeen','Время последнего захода','Кто видит, когда ты был(а) в сети',['all','nobody']],
  ['photo','Фото профиля','Кто видит твою аватарку'],
  ['bio','О себе','Кто видит текст «О себе»'],
  ['birthday','День рождения','Кто видит твой день рождения'],
  ['calls','Звонки','Кто может мне звонить'],
  ['voice','Голосовые и слонкружки','Кто может присылать мне голосовые и слонкружки'],
  ['messages','Сообщения','Кто может мне писать'],
  ['groups','Группы','Кто может добавлять меня в группы']
];
function _priv(k){return myPrivacy[k]||_PRIV_DEF[k]||'all';}
// «Мои контакты» — те, кому ты сам хоть раз написал
function _isContact(pid){return (chatHist[pid]||[]).some(m=>m.sender==='me');}
function _privAllowed(k,pid){const v=_priv(k);return v==='all'||(v==='contacts'&&_isContact(pid));}

// Проверка входящих данных на стороне получателя
function _privacyGate(pid,p){
  const t=p?.type;if(!t)return true;
  if((t==='call_incoming'||t==='call_offer')&&!_privAllowed('calls',pid)){
    if(t==='call_incoming')try{_fbSend(pid,{type:'call_reject',callId:p.callId});}catch(e){}
    return false;
  }
  const isMedia=t==='media_start'||t==='media_url'||t==='media_rtdb';
  if(isMedia&&(p.kind==='voice'||p.kind==='slon')&&!_privAllowed('voice',pid))return false;
  if((t==='msg'||t==='file_start'||isMedia)&&!_privAllowed('messages',pid))return false;
  if((t==='group_invite'||t==='group_add')&&!_privAllowed('groups',pid))return false;
  return true;
}

function _spPrivacy(){
  const blockedN=Object.keys(blockedUsers||{}).length;
  const rows=_PRIV_ITEMS.map(([k,title,,])=>`<div class="sp-row sp-row-plain" onclick="_spPrivOption('${k}')">
      <div class="sp-row-txt"><div class="sp-row-title">${title}</div><div class="sp-row-sub" id="privVal_${k}">${_PRIV_LBL[_priv(k)]}</div></div></div>`).join('');
  _spPush('Конфиденциальность',
    _spCard(
      _spRow({ico:'block',color:'red',title:'Заблокированные',val:blockedN||'',onclick:'_spBlocked()'})
     +_spRow({ico:'lock',color:'blue',title:'Код-пароль',sub:myPasscode?'Включён':'Выключен',onclick:'_spPasscode()'})
     +_spRow({ico:'shieldCheck',color:'green',title:'Пароль аккаунта',sub:'Вход с других устройств',onclick:'_spChangePassword()'})
     +_spRow({ico:'globe',color:'violet',title:'Устройства',onclick:'_spSessions()'})
    )
    +_spSec('Конфиденциальность')+_spCard(rows)
    +_spSec('Новые чаты от незнакомых')
    +_spCard(_spCheckRow(!!myPrivacy.archiveUnknown,'Архивировать и заглушать','Новые чаты от тех, кому ты не писал(а), сразу попадут в архив без звука',"_spPrivFlag('archiveUnknown',this)"))
    +_spSec('Заголовок окна')
    +_spCard(_spCheckRow(myPrivacy.titleChatName!==false,'Показывать название чата','',"_spPrivFlag('titleChatName',this,true)")));
}

function _spPrivFlag(k,row,defTrue){
  const cur=defTrue?myPrivacy[k]!==false:!!myPrivacy[k];
  myPrivacy[k]=!cur;saveAll();
  row.querySelector('.sp-check')?.classList.toggle('on',!cur);
  if(k==='titleChatName')_updateWindowTitle();
}

function _spPrivOption(k){
  const item=_PRIV_ITEMS.find(x=>x[0]===k);if(!item)return;
  const opts=item[3]||['all','contacts','nobody'];
  const list=opts.map(o=>`<div class="sp-pick${_priv(k)===o?' sel':''}" onclick="_spSetPriv('${k}','${o}',this)">
      <div class="sp-pick-txt">${_PRIV_LBL[o]}</div><div class="sp-pick-radio"></div></div>`).join('');
  const note={
    lastSeen:'Если скрыть время захода, собеседники увидят «был(а) недавно».',
    messages:'«Мои контакты» — люди, которым ты сам(а) хоть раз написал(а). Остальные не смогут начать с тобой чат.',
    calls:'Звонки от остальных будут отклоняться автоматически.',
    photo:'«Мои контакты» — люди, которым ты хоть раз написал(а).',
    bio:'«Мои контакты» — люди, которым ты хоть раз написал(а).',
    birthday:'«Мои контакты» — люди, которым ты хоть раз написал(а).'
  }[k]||'';
  _spPush(item[1],_spSec(item[2])+_spCard(list,'sp-pad')+(note?_spHint(note):''));
}

function _spSetPriv(k,v,el){
  myPrivacy[k]=v;saveAll();
  el.parentElement.querySelectorAll('.sp-pick').forEach(x=>x.classList.toggle('sel',x===el));
  // Обновляем подпись на предыдущей странице
  document.querySelectorAll('#privVal_'+k).forEach(x=>x.textContent=_PRIV_LBL[v]);
  // Публичный профиль и присутствие должны сразу учесть изменения
  if(['photo','bio','birthday'].includes(k))_broadcastHello();
  if(k==='lastSeen'&&window._fbDb&&myUsername){
    const ts=Date.now();
    window._fbSet(window._fbRef(window._fbDb,'presence/'+myUsername),{online:true,ts,ls:v==='nobody'?0:ts});
  }
}

function _spBlocked(){
  const ids=Object.keys(blockedUsers||{});
  const list=ids.length?ids.map(pid=>`<div class="sp-pick" id="blk_${esc(pid)}">
      ${_spAvatarHtml(peerAvatars[pid],peerNames[pid]||pid,'sp-pick-av')}
      <div class="sp-pick-txt"><div>${esc(peerNames[pid]||'@'+pid)}</div><div class="sp-row-sub">@${esc(pid)}</div></div>
      <button class="sp-btn-sm" onclick="event.stopPropagation();_spUnblock('${esc(pid)}')">Разблокировать</button></div>`).join('')
    :'<div class="ci-empty">Ты никого не блокировал(а)</div>';
  _spPush('Заблокированные',_spCard(list,'sp-pad')+_spHint('Заблокированные не смогут писать и звонить тебе.'));
}
function _spUnblock(pid){
  delete blockedUsers[pid];saveAll();
  const el=document.getElementById('blk_'+pid);
  if(el){el.style.transition='opacity .25s,transform .25s';el.style.opacity='0';el.style.transform='translateX(20px)';setTimeout(()=>el.remove(),250);}
  toast('Пользователь разблокирован');
}

function _spChangePassword(){
  _spPush('Пароль аккаунта',
    _spCard(`<label class="sp-field"><input id="cpOldInp" type="password" placeholder=" " autocomplete="current-password"><span>Текущий пароль</span></label>
      <label class="sp-field"><input id="cpNewInp" type="password" placeholder=" " autocomplete="new-password"><span>Новый пароль (мин. 6 символов)</span></label>
      <label class="sp-field"><input id="cpConfInp" type="password" placeholder=" " autocomplete="new-password"><span>Повтори новый пароль</span></label>
      <div class="m-err" id="cpErr" style="display:none"></div>
      <button class="sp-btn" onclick="_spDoChangePassword()">Сохранить</button>`,'sp-pad')
    +_spHint('Пароль нужен для входа в аккаунт с других устройств.'));
}
async function _spDoChangePassword(){
  await doChangePassword();
  if($('cpErr')?.style.display!=='block')_spPop();
}

// ── КОД-ПАРОЛЬ (локальная блокировка приложения) ──
function _spPasscode(){
  if(!myPasscode){
    _spPush('Код-пароль',
      `<div class="sp-empty-top">🔒</div>`
      +_spHint('Код-пароль блокирует SLON на этом устройстве: при запуске нужно будет его ввести. Код хранится только здесь.')
      +_spCard(`<label class="sp-field"><input id="pcNew" type="password" inputmode="numeric" maxlength="12" placeholder=" "><span>Новый код (от 4 цифр)</span></label>
        <label class="sp-field"><input id="pcRep" type="password" inputmode="numeric" maxlength="12" placeholder=" "><span>Повтори код</span></label>
        <div class="m-err" id="pcErr" style="display:none"></div>
        <button class="sp-btn" onclick="_pcEnable()">Включить код-пароль</button>`,'sp-pad'));
  }else{
    _spPush('Код-пароль',
      _spCard(_spRow({ico:'lock',color:'blue',title:'Заблокировать сейчас',onclick:'_pcLockNow()'})
       +_spRow({ico:'trash',color:'red',title:'Выключить код-пароль',onclick:'_pcDisable()',cls:'sp-row-danger'}))
      +_spHint('Если забудешь код — придётся выйти из аккаунта на этом устройстве и войти заново по паролю.'));
  }
}
async function _pcEnable(){
  const a=$('pcNew').value,b=$('pcRep').value,err=$('pcErr');
  err.style.display='none';
  if(!/^\d{4,12}$/.test(a)){err.textContent='Код — от 4 до 12 цифр';err.style.display='block';return;}
  if(a!==b){err.textContent='Коды не совпадают';err.style.display='block';return;}
  myPasscode=await hashPassword('pc:'+a);saveAll();
  _spPop();toast('Код-пароль включён 🔒');
}
function _pcDisable(){myPasscode='';saveAll();_spPop();toast('Код-пароль выключен');}

function _pcLockNow(){
  if(!myPasscode)return;
  closeMyProfilePanel();
  let ov=$('pcLock');
  if(!ov){ov=document.createElement('div');ov.id='pcLock';ov.className='pc-lock';document.body.appendChild(ov);}
  ov.innerHTML=`<div class="pc-box">
      ${_spAvatarHtml(myAvatar,myNick||myUsername,'pc-av')}
      <div class="pc-title">Введи код-пароль</div>
      <input id="pcInp" type="password" inputmode="numeric" maxlength="12" autocomplete="off" onkeydown="if(event.key==='Enter')_pcTry()">
      <button class="sp-btn" onclick="_pcTry()">Разблокировать</button>
      <a class="pc-forgot" onclick="_pcForgot()">Забыл(а) код?</a></div>`;
  // не rAF: в фоновой вкладке он не срабатывает, и экран остался бы прозрачным
  setTimeout(()=>ov.classList.add('show'),20);
  setTimeout(()=>$('pcInp')?.focus(),200);
}
async function _pcTry(){
  const inp=$('pcInp');if(!inp)return;
  const h=await hashPassword('pc:'+inp.value);
  if(h===myPasscode){
    const ov=$('pcLock');ov.classList.remove('show');setTimeout(()=>ov.remove(),300);
  }else{
    inp.value='';inp.classList.remove('shake');void inp.offsetWidth;inp.classList.add('shake');
  }
}
function _pcForgot(){
  showModal(`<div class="m-title">Забыл(а) код-пароль?</div>
    <div class="m-info">Можно выйти из аккаунта на этом устройстве и войти заново по паролю аккаунта. Код-пароль сбросится.</div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Отмена</button>
    <button class="btn-ok" onclick="closeModal();myPasscode='';saveAll();$('pcLock')?.remove();doLogout()">Выйти</button></div>`);
}

// ════════════════════════════════════════
// ── УВЕДОМЛЕНИЯ ──
// ════════════════════════════════════════
function _notifOn(kind){return myNotif[kind]!==false;}
function _notifText(kind,text){return myNotif[kind+'Preview']===false?'Новое сообщение':text;}

function _spNotifications(){
  const perm=('Notification' in window)?Notification.permission:'unsupported';
  const webOn=myNotif.web!==false&&perm==='granted';
  const vol=myNotif.volume??5;
  const grp=(k,title)=>_spSec(title)+_spCard(
    _spCheckRow(_notifOn(k),'Уведомления: '+title.toLowerCase(),_notifOn(k)?'Включены':'Выключены',`_spNotifFlag('${k}',this)`)
   +_spCheckRow(myNotif[k+'Preview']!==false,'Превью сообщений',myNotif[k+'Preview']!==false?'Включено':'Выключено',`_spNotifFlag('${k}Preview',this)`,!_notifOn(k)),
   'sp-notif-'+k);
  _spPush('Уведомления и звуки',
    _spSec('Веб-уведомления')
    +_spCard(
      _spCheckRow(webOn,'Веб-уведомления',perm==='denied'?'Запрещены в браузере — разреши в настройках сайта':webOn?'Включены':'Выключены','_spNotifWeb(this)')
     +`<div class="sp-slider-row"><div class="sp-slider-top"><span>Громкость звука</span><b id="nVolVal">${vol}</b></div>
        <input type="range" min="0" max="10" step="1" value="${vol}" id="nVol" oninput="_spNotifVol(this.value)" onchange="playNotifSound()"></div>`)
    +grp('private','Личные чаты')+grp('groups','Группы')+grp('channels','Каналы')
    +_spHint('Заглушить отдельный чат можно в его меню или в профиле собеседника.'));
  _spPaintSlider($('nVol'));
}
function _spPaintSlider(el){if(el)el.style.setProperty('--p',(el.value/el.max*100)+'%');}
function _spNotifVol(v){myNotif.volume=+v;saveAll();$('nVolVal').textContent=v;_spPaintSlider($('nVol'));}
function _spNotifFlag(k,row){
  const cur=myNotif[k]!==false;myNotif[k]=!cur;saveAll();
  row.querySelector('.sp-check').classList.toggle('on',!cur);
  const sub=row.querySelector('.sp-row-sub');
  if(sub)sub.textContent=k.endsWith('Preview')?(!cur?'Включено':'Выключено'):(!cur?'Включены':'Выключены');
  // Превью неактивно, если выключены сами уведомления
  if(!k.endsWith('Preview')){
    const card=row.closest('.sp-card');const pr=card?.querySelectorAll('.sp-check-row')[1];
    if(pr){pr.classList.toggle('disabled',cur);pr.setAttribute('onclick',cur?'':`_spNotifFlag('${k}Preview',this)`);}
  }
}
function _spNotifWeb(row){
  const perm=('Notification' in window)?Notification.permission:'unsupported';
  if(perm==='unsupported'){toast('Браузер не поддерживает уведомления');return;}
  const cur=myNotif.web!==false&&perm==='granted';
  if(!cur&&perm!=='granted'){
    Notification.requestPermission().then(p=>{
      if(p==='granted'){myNotif.web=true;saveAll();row.querySelector('.sp-check').classList.add('on');row.querySelector('.sp-row-sub').textContent='Включены';}
      else toast('Уведомления запрещены в браузере');
    });
    return;
  }
  myNotif.web=!cur;saveAll();
  row.querySelector('.sp-check').classList.toggle('on',!cur);
  row.querySelector('.sp-row-sub').textContent=!cur?'Включены':'Выключены';
}

// ════════════════════════════════════════
// ── ДАННЫЕ, ОБЩИЕ, PREMIUM, КАСТОМИЗАЦИЯ ──
// ════════════════════════════════════════
function _spDataStorage(){
  let used=0;
  try{for(let k in localStorage)if(localStorage.hasOwnProperty(k))used+=(localStorage[k].length+k.length)*2;}catch(e){}
  _spPush('Данные и память',
    _spSec('Хранилище')
    +_spCard(_spRow({ico:'data',color:'green',title:'Локальные данные',val:fmtSz(used),cls:'sp-row-static'}))
    +_spHint('Фото, голосовые и слонкружки хранятся в IndexedDB браузера.')
    +_spCard(_spRow({ico:'folder',color:'blue',title:'Экспорт данных',sub:'Скачать историю чатов файлом',onclick:'exportData()'})
      +_spRow({ico:'trash',color:'red',title:'Очистить все данные',onclick:'confirmClearAll()',cls:'sp-row-danger'})));
}

function _spGeneral(){
  const wp=Object.entries(CHAT_WALLPAPERS).map(([id,w])=>`<div class="sp-pick${myChatWallpaper===id?' sel':''}" onclick="_spSetWallpaper('${id}',this)">
      <div class="sp-pick-av sp-wp-ico">${w.emoji||'⬜'}</div><div class="sp-pick-txt">${esc(w.label)}</div><div class="sp-pick-radio"></div></div>`).join('');
  _spPush('Общие настройки',
    _spSec('Тема оформления')+`<div class="sp-card sp-pad"><div class="tp-grid-wrap" id="profThemeGrid"></div></div>`
    +_spCard(_spRow({ico:'brush',color:'purple',title:'Кастомизация профиля',sub:'Фон, градиент и узор',onclick:'_spCustomize()'}))
    +_spSec('Обои чатов'+(myPremium?'':' <span class="sp-lock">⭐ Premium</span>'))+_spCard(wp,'sp-pad'));
  buildThemeGrids();
}
function _spSetWallpaper(id,el){
  if(!myPremium){toast('⭐ Обои — в SLON Premium');return;}
  myChatWallpaper=id;saveAll();_applyChatWallpaper();
  el.parentElement.querySelectorAll('.sp-pick').forEach(x=>x.classList.toggle('sel',x===el));
}

// Страница SLON Premium — в settings-extra.js (3D-слон)

let _spDraft=null;
function _spCustomize(){
  _spCloseMenu();
  _spDraft={bg:myProfileBg||'bg0',color:myProfileBgColor||'',pattern:myProfilePattern||''};
  const cur=(_spDraft.color&&_spDraft.color.includes('|'))?_spDraft.color.split('|'):['#7cb8ff','#3b6fe0'];
  const lock=myPremium?'':' <span class="sp-lock">⭐ Premium</span>';
  _spPush('Кастомизация профиля',`
    <div class="sp-cust-prev" id="spCustPrev">
      <div class="sp-cust-av">${myAvatar?`<img src="${myAvatar}" alt="">`:esc(((myNick||myUsername)[0]||'?').toUpperCase())}</div>
      <div class="sp-cust-name">${esc(_myFullName().trim()||'@'+myUsername)}</div>
      <div class="sp-cust-st">в сети</div>
    </div>
    ${_spSec('Цвет фона')}
    <div class="sp-card sp-pad"><div class="sp-swatches" id="spSwatches">
      ${SP_PROFILE_GRADS.map(([a,b])=>`<button class="sp-sw" data-c="${a}|${b}" style="background:radial-gradient(circle at 50% 38%,${a},${b} 85%)" onclick="_spPickGrad('${a}|${b}')"></button>`).join('')}
    </div></div>
    ${_spSec('Свои цвета'+lock)}
    <div class="sp-card sp-pad"><div class="sp-cust-colors">
      <label>Центр<input type="color" id="spC1" value="${cur[0]}" oninput="_spCustomColors()"></label>
      <label>Края<input type="color" id="spC2" value="${cur[1]}" oninput="_spCustomColors()"></label>
    </div></div>
    ${_spSec('Узор'+lock)}
    <div class="sp-card sp-pad"><div class="sp-patterns" id="spPatterns">
      <button class="sp-pat" data-p="" onclick="_spPickPattern('')">Нет</button>
      ${PREMIUM_BG_PATTERNS.map(p=>`<button class="sp-pat" data-p="${p.id}" onclick="_spPickPattern('${p.id}')">${p.emoji} ${p.label}</button>`).join('')}
    </div></div>
    <div style="height:70px"></div>`,
    {fab:`<button class="sp-fab" id="custSave" onclick="_spSaveCustom()" title="Сохранить">${_spSvg('check')}</button>`});
  _spUpdateCustPrev();
}
function _spPickGrad(c){_spDraft.color=c;_spUpdateCustPrev(true);}
function _spCustomColors(){
  if(!myPremium){toast('⭐ Свои цвета — в SLON Premium');return;}
  _spDraft.color=$('spC1').value+'|'+$('spC2').value;_spUpdateCustPrev(true);
}
function _spPickPattern(p){
  if(p&&!myPremium){toast('⭐ Узоры — в SLON Premium');return;}
  _spDraft.pattern=p;_spUpdateCustPrev(true);
}
function _spUpdateCustPrev(dirty){
  const pr=$('spCustPrev');if(!pr||!_spDraft)return;
  pr.style.background=_getProfileBgStyle(_spDraft.bg,_spDraft.color,_spDraft.pattern);
  document.querySelectorAll('#spSwatches .sp-sw').forEach(b=>b.classList.toggle('sel',b.dataset.c===_spDraft.color));
  document.querySelectorAll('#spPatterns .sp-pat').forEach(b=>b.classList.toggle('sel',b.dataset.p===_spDraft.pattern));
  if(dirty)$('custSave')?.classList.add('show');
}
function _spSaveCustom(){
  if(!_spDraft)return;
  myProfileBg=_spDraft.bg;myProfileBgColor=_spDraft.color;myProfilePattern=_spDraft.pattern;
  saveAll();updateProfileDisplay();
  if(_fbMode)_publishMyProfile();
  _spPop();
  toast('Профиль обновлён 🎨');
}

// ════════════════════════════════════════
// ── ПРОФИЛЬ: РАССЫЛКА С УЧЁТОМ КОНФИДЕНЦИАЛЬНОСТИ ──
// ════════════════════════════════════════
// hello конкретному собеседнику — фото/о себе/ДР только если ему разрешено
function _myHelloFor(pid){
  return {type:'hello',nick:myNick||'',lastName:myLastName||'',
    avatar:_privAllowed('photo',pid)?(myAvatar||null):null,
    bio:_privAllowed('bio',pid)?(myBio||''):'',
    birthday:_privAllowed('birthday',pid)?(myBirthday||null):null,
    businessHours:myBusinessHours?.enabled?{...myBusinessHours,tz:_myTz()}:null,
    username:myUsername,iid:myInternalId,profileBg:myProfileBg||'bg0',
    bgColor:myProfileBgColor||'',bgPattern:myProfilePattern||'',linkedChannel:myLinkedChannel||''};
}

// Публичный профиль в Firebase — его видят все, поэтому скрытое не кладём.
// «Мои контакты» получают скрытые поля через hello.
function _myPublicProfile(base){
  const data={nick:base.nick,lastName:myLastName||'',username:myUsername,iid:myInternalId,profileBg:base.profileBg,
    bgColor:myProfileBgColor||'',bgPattern:myProfilePattern||'',linkedChannel:myLinkedChannel||'',
    businessHours:myBusinessHours?.enabled?{...myBusinessHours,tz:_myTz()}:null,ts:Date.now()};
  const put=(k,key,val,empty)=>{const v=_priv(k);if(v==='all')data[key]=val;else if(v==='nobody')data[key]=empty;};
  put('photo','avatar',base.avatar||null,null);
  put('bio','bio',base.bio||'','');
  put('birthday','birthday',myBirthday||null,null);
  return data;
}

function _broadcastHello(){
  Object.keys(peerNames).forEach(pid=>{
    if(!pid||pid==='ai'||pid==='saved'||pid.startsWith('g_')||_isChannelId(pid))return;
    if(_fbMode||conns[pid]?.open)sendData(conns[pid]||pid,_myHelloFor(pid));
  });
  if(_fbMode)_publishMyProfile();
}

// Доп. поля профиля собеседника (из hello и из публичного профиля)
function _applyExtraProfile(pid,d){
  if(!d)return;
  if(d.lastName!==undefined)peerLastNames[pid]=d.lastName||'';
  if(d.nick)peerNames[pid]=d.nick+(peerLastNames[pid]?' '+peerLastNames[pid]:'');
  if('birthday' in d)peerBirthdays[pid]=d.birthday||null;
  if('businessHours' in d)peerBusinessHours[pid]=d.businessHours||null;
  if(d.linkedChannel!==undefined)peerLinkedChannels[pid]=d.linkedChannel||'';
}

function _updateWindowTitle(){
  const base='SLON Messenger';
  if(myPrivacy.titleChatName===false||!activeChat){document.title=base;return;}
  const n=activeChat==='ai'?'СЛОН AI':activeChat==='saved'?'Избранное':(peerNames[activeChat]||groups?.[activeChat]?.name||'');
  document.title=n?`${n} — SLON`:base;
}

// ════════════════════════════════════════
// ── ПРАВАЯ КОЛОНКА: профиль собеседника / инфо канала ──
// На широком экране встаёт колонкой справа, чат сужается (как в Telegram).
// ════════════════════════════════════════
function _rpDock(on){
  document.body.classList.toggle('rp-docked',!!on&&window.innerWidth>=1100);
}
window.addEventListener('resize',()=>{
  const open=$('peerProfOverlay')?.classList.contains('show')||$('chInfoOverlay')?.classList.contains('show');
  _rpDock(open);
});

function _lastSeenText(pid){
  if(_fbMode?!!_fbConns[pid]:conns[pid]?.open)return 'в сети';
  const ts=peerLastSeen[pid];
  if(!ts)return 'был(а) недавно';
  const d=new Date(ts),now=new Date(),diff=now-d;
  if(diff<60000)return 'был(а) только что';
  if(diff<3600000)return `был(а) ${Math.floor(diff/60000)} мин. назад`;
  if(d.toDateString()===now.toDateString())return 'был(а) сегодня в '+fmtTime(ts);
  const y=new Date(now);y.setDate(now.getDate()-1);
  if(d.toDateString()===y.toDateString())return 'был(а) вчера в '+fmtTime(ts);
  return 'был(а) '+d.toLocaleDateString('ru',{day:'numeric',month:'long'});
}

function _ppRender(pid){
  const name=peerNames[pid]||('@'+pid);
  const av=peerAvatars[pid];
  const isBlocked=!!blockedUsers[pid];
  const hasElephant=!!peerElephantBadges[pid];
  const hasPrem=!!peerPremium[pid];
  const isBanned=bannedUsers[pid]&&bannedUsers[pid].until>Date.now();
  const bgColor=peerProfileBgColors[pid]||'',pattern=peerProfilePatterns[pid]||'';
  const custom=!!(bgColor||pattern);
  _spPeerOpenId=pid;

  // Шапка: цветная, если собеседник настроил фон; иначе как в Telegram — простая
  const hero=$('peerProfHero');
  hero.classList.toggle('pp-custom',custom);
  $('peerProfBg').style.background=custom?_getProfileBgStyle(peerProfileBgs[pid]||'bg0',bgColor,pattern):'';
  $('peerProfAv').innerHTML=av?`<img src="${av}" alt="">`:_avHtml(pid,name);
  $('peerProfAv').onclick=av?()=>{$('photoImg').src=av;$('photoView').classList.add('show');}:null;
  $('peerProfName').innerHTML=(isBanned?'❄️ ':'')+esc(name)
    +(hasElephant?' <span class="sp-badge" title="Слонгалочка">🐘</span>':'')
    +(hasPrem?` <span class="sp-badge" title="SLON Premium" style="cursor:pointer" onclick="toast('У ${esc(name).replace(/'/g,'')} подписка SLON Premium ⭐')">⭐</span>`:'');
  const st=$('peerProfStatus');
  if(isBlocked)st.innerHTML='<span class="pp-st-bad">🚫 Заблокирован(а) тобой</span>';
  else if(isBanned){
    const u=bannedUsers[pid].until===9999999999999?'навсегда':new Date(bannedUsers[pid].until).toLocaleDateString('ru');
    st.textContent='❄️ Заморожен(а) до '+u;
  }else{
    const t=_lastSeenText(pid);
    st.innerHTML=t==='в сети'?'<span class="pp-online">в сети</span>':esc(t);
  }

  // Быстрые действия
  const act=(ico,txt,fn)=>`<button class="pp-act" onclick="${fn}"><div class="pp-act-ico">${_spSvg(ico)}</div><span>${txt}</span></button>`;
  $('peerProfActions').innerHTML=act('chat','Написать',`closePeerProfile();openChat('${pid}')`)
    +act('phone','Звонок',`closePeerProfile();startCallWithPerm('${pid}',false)`)
    +act('video','Видео',`closePeerProfile();startCallWithPerm('${pid}',true)`)
    +act(mutedChats[pid]?'speaker':'bell',mutedChats[pid]?'Вкл. звук':'Без звука',`_ppToggleMute('${pid}')`);

  // Канал + инфо-карточка (иконки контурные, как в User Info у Telegram)
  const row=(ico,title,sub,onclick,extra)=>`<div class="sp-row${onclick?'':' sp-row-static'}${extra?' '+extra:''}" ${onclick?`onclick="${onclick}"`:''}>
      <div class="pp-ico">${_spSvg(ico)}</div>
      <div class="sp-row-txt"><div class="sp-row-title">${title}</div>${sub?`<div class="sp-row-sub">${sub}</div>`:''}</div></div>`;
  const bio=peerBios[pid]||'',bd=peerBirthdays[pid],bh=peerBusinessHours[pid];
  let info='';
  if(peerLinkedChannels[pid])info+=_spChannelBlock(peerLinkedChannels[pid],false);
  info+=`<div class="sp-card">
    ${row('at','@'+esc(pid),'Юзернейм',`navigator.clipboard?.writeText('@${pid}').then(()=>toast('Юзернейм скопирован'))`)}
    ${bio?row('info',esc(bio).replace(/\n/g,'<br>'),'О себе','','sp-row-multi'):''}
    ${bd?row('calendar',_bdText(bd),'День рождения'):''}
    ${bh?_bhRow(bh,'pp',false):''}
    <div class="sp-row" onclick="_ppToggleMute('${pid}')"><div class="pp-ico">${_spSvg('bell')}</div>
      <div class="sp-row-txt"><div class="sp-row-title">Уведомления</div></div>
      <div class="sp-switch${mutedChats[pid]?'':' on'}" id="ppMuteSw"></div></div>
  </div>
  <div class="sp-card">${row('block',isBlocked?'Разблокировать':'Заблокировать','',`toggleBlockUser('${pid}');setTimeout(()=>showPeerProfile('${pid}'),300)`,'sp-row-danger')}</div>`;
  $('peerProfInfo').innerHTML=info;
  if(peerLinkedChannels[pid])_spLoadChannelData(peerLinkedChannels[pid]);

  // Меню «три точки»
  const more=$('peerProfMoreBtn');
  more.onclick=e=>{
    e.stopPropagation();
    let m=$('ppMenu');
    if(!m){m=document.createElement('div');m.id='ppMenu';m.className='sp-menu';more.parentElement.appendChild(m);}
    if(m.classList.contains('show')){m.classList.remove('show');return;}
    const it=(ico,txt,fn,danger)=>`<button class="sp-menu-item${danger?' danger':''}" onclick="_spCloseMenu();${fn}">${_spSvg(ico)}<span>${txt}</span></button>`;
    m.innerHTML=it('copy','Скопировать юзернейм',`navigator.clipboard?.writeText('@${pid}').then(()=>toast('Скопировано'))`)
      +it('chat','Открыть чат',`closePeerProfile();openChat('${pid}')`)
      +it('block',isBlocked?'Разблокировать':'Заблокировать',`toggleBlockUser('${pid}');setTimeout(()=>showPeerProfile('${pid}'),300)`,true);
    m.classList.add('show');
  };

  // Вкладки общих материалов
  $('peerProfTabs').innerHTML=_ciTabsHtml(pid,true);
  _ciRenderTab(pid,$('peerProfTabs'));
}

function _ppToggleMute(pid){
  if(mutedChats[pid])delete mutedChats[pid];else mutedChats[pid]=true;
  saveAll();
  if(typeof _updateSbMuteIcon==='function')_updateSbMuteIcon(pid);
  $('ppMuteSw')?.classList.toggle('on',!mutedChats[pid]);
  const btns=document.querySelectorAll('#peerProfActions .pp-act');
  const b=btns[3];if(b)b.outerHTML=`<button class="pp-act" onclick="_ppToggleMute('${pid}')"><div class="pp-act-ico">${_spSvg(mutedChats[pid]?'speaker':'bell')}</div><span>${mutedChats[pid]?'Вкл. звук':'Без звука'}</span></button>`;
  toast(mutedChats[pid]?'🔕 Уведомления выключены':'🔔 Уведомления включены');
}

// ════════════════════════════════════════
// ── ИНФОРМАЦИЯ О КАНАЛЕ (как Channel Info в Telegram) ──
// ════════════════════════════════════════
function showChannelInfo(id){
  const ov=$('chInfoOverlay');if(!ov)return;
  const isSlon=id===SLON_CHANNEL_ID;
  const username=isSlon?'':id.replace(/^ch_/,'');
  const meta=isSlon?{}:(_spChannelMeta(username)||{});
  const name=meta.name||(peerNames[id]||'').replace(/^📢\s*/,'')||(isSlon?'SLON':'@'+username);
  const avatar=meta.avatar||peerAvatars[id]||null;
  const desc=isSlon?'Официальный канал SLON — новости и обновления 🐘':(meta.desc||'');
  const isOwner=!isSlon&&myChannels[id]&&(!myChannels[id].owner||myChannels[id].owner===myUsername);
  const subs=_spChSubsCache[username];

  const linkify=t=>esc(t).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,'<br>');
  let rows='';
  if(desc)rows+=_spRow({ico:'info',color:'gray',title:linkify(desc),sub:'Описание',cls:'sp-row-multi sp-row-static'});
  if(username)rows+=`<div class="sp-row" onclick="navigator.clipboard?.writeText('@${esc(username)}').then(()=>toast('Ссылка скопирована'))">
      ${_spIco('orange','link')}
      <div class="sp-row-txt"><div class="sp-row-title">@${esc(username)}</div><div class="sp-row-sub">Ссылка</div></div>
      <div class="sp-row-act">${_spSvg('copy')}</div></div>`;
  rows+=`<div class="sp-row" onclick="_ciToggleMute('${id}')">
      ${_spIco('red','bell')}
      <div class="sp-row-txt"><div class="sp-row-title">Уведомления</div></div>
      <div class="sp-switch${mutedChats[id]?'':' on'}" id="ciMuteSw"></div></div>`;

  ov.innerHTML=`
    <div class="ci-hdr">
      <button class="sp-tb-btn" onclick="closePeerProfile()" title="Закрыть">${_spSvg('close')}</button>
      <div class="ci-title">Информация о канале</div>
      ${isOwner?`<button class="sp-tb-btn" onclick="closePeerProfile();showChannelSettings('${id}')" title="Настройки канала">${_spSvg('pencil')}</button>`:''}
    </div>
    <div class="ci-top">
      ${_spAvatarHtml(avatar,name,'ci-av')}
      <div class="ci-name">${esc(name)}</div>
      <div class="ci-subs" id="ciSubs">${subs!=null?_spSubsText(subs):(isSlon?'официальный канал':'канал')}</div>
    </div>
    <div class="sp-card">${rows}</div>
    <div class="ci-tabs-wrap">${_ciTabsHtml(id,false)}</div>`;
  _ciRenderTab(id,ov.querySelector('.ci-tabs-wrap'));
  $('peerProfOverlay')?.classList.remove('show');
  $('peerProfBackdrop')?.classList.add('show');
  ov.scrollTop=0;
  ov.classList.add('show');
  _rpDock(true);
  if(username&&subs==null){
    _fbOnce('channel_subs/'+username).then(s=>{
      if(!s)return;
      const v=s.val();_spChSubsCache[username]=v?Object.keys(v).length:0;
      const el=$('ciSubs');if(el)el.textContent=_spSubsText(_spChSubsCache[username]);
    });
  }
}

function _ciToggleMute(id){
  if(mutedChats[id])delete mutedChats[id];else mutedChats[id]=true;
  saveAll();
  $('ciMuteSw')?.classList.toggle('on',!mutedChats[id]);
  if(typeof _updateSbMuteIcon==='function')_updateSbMuteIcon(id);
  if(activeChat===id&&typeof _renderChannelMuteBtn==='function')_renderChannelMuteBtn(id);
}

// Вкладки общих материалов (для канала и для собеседника)
function _ciTabsHtml(id,withVoice){
  const tabs=[['media','Медиа'],['files','Файлы'],['links','Ссылки']];
  if(withVoice)tabs.push(['voice','Голосовые']);
  return `<div class="ci-tabs">${tabs.map(([k,l],i)=>`<button class="ci-tab${i?'':' sel'}" data-t="${k}" onclick="_ciSetTab('${id}','${k}',this)">${l}</button>`).join('')}</div>
    <div class="ci-content" data-tab="media"></div>`;
}

function _ciSetTab(id,t,btn){
  const root=btn.closest('.ci-tabs').parentElement;
  root.querySelectorAll('.ci-tab').forEach(b=>b.classList.toggle('sel',b.dataset.t===t));
  root.querySelector('.ci-content').dataset.tab=t;
  _ciRenderTab(id,root);
}

function _ciRenderTab(id,root){
  const box=root?.querySelector('.ci-content');if(!box)return;
  const tab=box.dataset.tab||'media';
  const hist=chatHist[id]||[];
  box.classList.remove('ci-fade');void box.offsetWidth;box.classList.add('ci-fade');
  if(tab==='media'){
    const photos=hist.filter(m=>m.photoId).reverse();
    if(!photos.length){box.innerHTML='<div class="ci-empty">Пока нет фото</div>';return;}
    box.innerHTML='<div class="ci-grid">'+photos.map(m=>`<div class="ci-cell" onclick="openPhoto('${m.photoId}')"><img data-pid="${m.photoId}" src="${m.photoThumb||''}" alt="" loading="lazy"></div>`).join('')+'</div>';
    box.querySelectorAll('img[data-pid]').forEach(img=>{
      _resolvePhotoSrc(img.dataset.pid).then(src=>{if(src)img.src=src;}).catch(()=>{});
    });
  }else if(tab==='files'){
    const files=hist.filter(m=>m.fileInfo).reverse();
    box.innerHTML=files.length?files.map(m=>`<div class="sp-row" onclick="dlFile('${m.fileDataId}','${esc(m.fileInfo.name).replace(/'/g,'&#39;')}')">
        ${_spIco('blue','folder')}<div class="sp-row-txt"><div class="sp-row-title">${esc(m.fileInfo.name)}</div><div class="sp-row-sub">${esc(m.fileInfo.size||'')} · ${m.ts?_spShortDate(m.ts):''}</div></div></div>`).join('')
      :'<div class="ci-empty">Пока нет файлов</div>';
  }else if(tab==='voice'){
    const vs=hist.filter(m=>m.voiceData||m.slonData).reverse();
    box.innerHTML=vs.length?vs.map(m=>`<div class="sp-row sp-row-static">
        ${_spIco(m.slonData?'purple':'green',m.slonData?'video':'mic')}<div class="sp-row-txt"><div class="sp-row-title">${m.slonData?'Слонкружок':'Голосовое'} · ${m.sender==='me'?'ты':esc(m.name||'')}</div><div class="sp-row-sub">${m.ts?_spShortDate(m.ts):''}</div></div></div>`).join('')
      :'<div class="ci-empty">Пока нет голосовых</div>';
  }else{
    const links=[];
    hist.forEach(m=>{(String(m.text||'').match(/https?:\/\/[^\s<]+/g)||[]).forEach(u=>links.push({u,ts:m.ts}));});
    links.reverse();
    box.innerHTML=links.length?links.map(l=>`<a class="sp-row ci-link" href="${esc(l.u)}" target="_blank" rel="noopener">
        ${_spIco('orange','link')}<div class="sp-row-txt"><div class="sp-row-title">${esc(l.u)}</div><div class="sp-row-sub">${l.ts?_spShortDate(l.ts):''}</div></div></a>`).join('')
      :'<div class="ci-empty">Пока нет ссылок</div>';
  }
}

let _spPeerOpenId='';

// ── ЗАПУСК ──
document.addEventListener('DOMContentLoaded',()=>{
  $('spScroll')?.addEventListener('scroll',_spOnScroll,{passive:true});
  // Код-пароль: блокируем приложение при запуске
  if(myUsername&&myPasscode)_pcLockNow();
  _updateWindowTitle();
});
