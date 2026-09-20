// ════════════════════════════════════════
// ── КАСТОМИЗАЦИЯ: рамки и эффекты аватара ──
// Синхронизируется как поле avFrame профиля (см. _myHelloFor / _myPublicProfile).
// Применяется к аватаркам профиля: своей (spAv) и собеседника (peerProfAv).
// ════════════════════════════════════════
const AV_FRAMES=[
  {id:'',         name:'Без рамки',          prem:false, kind:'none'},
  {id:'cobweb',   name:'Паутина',            prem:true,  kind:'fx'},
  {id:'blood',    name:'Кровь',              prem:true,  kind:'fx'},
  {id:'ironman',  name:'Железный человек',   prem:true,  kind:'fx'},
];
const AV_FRAME_MAP=Object.fromEntries(AV_FRAMES.map(f=>[f.id,f]));
const AV_CONTOUR_DEFAULT='#3390ec';
// avFrame может нести цвет для контура: "contour|#ff0000"
function _avFrameParse(val){const [id,color]=String(val||'').split('|');return {id:id||'',color:color||''};}

// Внутренняя разметка эффекта (для ring-рамок пусто — они рисуются через CSS)
function _avFrameInner(id){
  switch(id){
    case 'blood':  return '<i></i><i></i>'; // 2 капли стекают в левом нижнем углу
    case 'snow':   return Array.from({length:9},()=>'<i></i>').join('');
    case 'hearts': return '<i>❤️</i><i>💜</i><i>❤️</i>';
    case 'cobweb': // классическая угловая паутина: радиальные нити + дуги
      return `<svg class="avf-web tl" viewBox="0 0 100 100" aria-hidden="true">
          <g fill="none" stroke="#e8ecf2" stroke-width="1.1" stroke-linecap="round">
            <path d="M0 0 L60 0 M0 0 L46 20 M0 0 L30 30 M0 0 L20 46 M0 0 L0 60"/>
            <path d="M52 0 Q30 10 0 52"/><path d="M40 0 Q24 8 0 40"/>
            <path d="M28 0 Q16 6 0 28"/><path d="M16 0 Q9 4 0 16"/>
          </g></svg>
        <svg class="avf-web br" viewBox="0 0 100 100" aria-hidden="true">
          <g fill="none" stroke="#e8ecf2" stroke-width="1.1" stroke-linecap="round" opacity=".85">
            <path d="M100 100 L40 100 M100 100 L100 40 M100 100 L72 72"/>
            <path d="M100 60 Q84 84 60 100"/><path d="M100 76 Q90 90 76 100"/>
          </g></svg>
        <span class="avf-spider">🕷️</span>`;
    case 'ironman':return `<span class="avf-iron">
        <svg class="avf-iron-svg" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="avfGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ffdf6b"/><stop offset=".45" stop-color="#f0b429"/><stop offset="1" stop-color="#c2850e"/>
            </linearGradient>
            <linearGradient id="avfRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#e5303f"/><stop offset="1" stop-color="#96101d"/>
            </linearGradient>
          </defs>
          <g class="avf-shellg">
            <path fill="url(#avfRed)" stroke="#280206" stroke-width="2.4" stroke-linejoin="round"
              d="M50 2C29 2 13 11 9 27 6 42 7 59 12 73c4 12 11 20 20 24 5 3 12 4 18 4s13-1 18-4c9-4 16-12 20-24 5-14 6-31 3-46C87 11 71 2 50 2z"/>
            <path fill="url(#avfRed)" stroke="#280206" stroke-width="2.2" stroke-linejoin="round"
              d="M11 30C6 34 4 44 6 54c2 9 6 15 11 17 2 1 3 0 3-2-3-12-4-26-3-37 0-2-3-3-6-2zM89 30c5 4 7 14 5 24-2 9-6 15-11 17-2 1-3 0-3-2 3-12 4-26 3-37 0-2 3-3 6-2z"/>
            <path fill="#750b16" d="M14 33c-1 12 0 25 3 36-4-3-7-9-8-17-2-9-1-17 2-21zM86 33c1 12 0 25-3 36 4-3 7-9 8-17 2-9 1-17-2-21z"/>
          </g>
          <g class="avf-plate">
            <path fill="url(#avfGold)" stroke="#280206" stroke-width="2.4" stroke-linejoin="round"
              d="M50 8C33 8 23 16 20 28c-3 12-3 26 1 38 3 12 9 21 16 26 4 3 9 4 13 4s9-1 13-4c7-5 13-14 16-26 4-12 4-26 1-38C77 16 67 8 50 8z"/>
            <path fill="#d99a14" d="M24 26c-2 10-2 22 0 33h7c-3-11-4-23-3-33zM76 26c2 10 2 22 0 33h-7c3-11 4-23 3-33z"/>
            <path fill="url(#avfRed)" stroke="#280206" stroke-width="2.2" stroke-linejoin="round"
              d="M38 8c4-3 8-4 12-4s8 1 12 4v16c0 2-1 4-4 4H42c-3 0-4-2-4-4z"/>
            <path fill="#ffe89a" opacity=".4" d="M44 6c-3 1-5 2-6 3v6c2-4 4-7 6-9z"/>
            <path class="avf-eye" d="M22 45l22-5 1 10-22 5z"/>
            <path class="avf-eye" d="M78 45l-22-5-1 10 22 5z"/>
            <path fill="none" stroke="#280206" stroke-width="2.2" stroke-linejoin="round"
              d="M22 45l22-5 1 10-22 5zM78 45l-22-5-1 10 22 5z"/>
            <path fill="#c2850e" stroke="#280206" stroke-width="2" stroke-linejoin="round" d="M36 68h28l-3 9H39z"/>
            <path fill="#280206" d="M39 70.5h22v2H39zM41 74h18v1.8H41z"/>
            <path fill="#280206" d="M49 58h2v8h-2z" opacity=".35"/>
          </g>
        </svg></span>`;
    default:       return '';
  }
}

// Применить рамку к контейнеру аватара (host — .sp-av / #peerProfAv / .sp-cust-av ...)
// val: id рамки, для контура — "contour|#hex"
function _avFrameApply(host,val){
  if(!host)return;
  host.querySelector(':scope > .avf')?.remove();
  const {id,color}=_avFrameParse(val);
  const f=id&&AV_FRAME_MAP[id];
  if(!f||f.kind==='none'){host.removeAttribute('data-avframe');host.classList.remove('avf-host');return;}
  host.classList.add('avf-host');
  host.dataset.avframe=id;
  const ov=document.createElement('span');
  ov.className='avf avf-'+id+((f.kind==='ring'||f.kind==='contour')?' avf-ring':'');
  if(id==='contour')ov.style.setProperty('--avf-col',color||AV_CONTOUR_DEFAULT);
  ov.innerHTML=_avFrameInner(id);
  host.appendChild(ov);
}
// «Раскрытие» — для маски Железного человека при открытии профиля
function _avFrameReveal(host){
  if(!host)return;
  const ov=host.querySelector(':scope > .avf.avf-ironman');
  if(!ov)return;
  ov.classList.remove('open');void ov.offsetWidth;
  setTimeout(()=>ov.classList.add('open'),380);
}

// ── Секция «Рамка аватара» в странице кастомизации профиля ──
// Возвращает HTML; выбор пишет в _spDraft.avFrame и обновляет превью.
function _spAvFramesSection(){
  const raw=(typeof _spDraft==='object'&&_spDraft)?(_spDraft.avFrame||''):(myAvFrame||'');
  const cur=_avFrameParse(raw);
  const face=esc(((myNick||myUsername)[0]||'🐘').toUpperCase());
  const cell=f=>{
    const locked=f.prem&&!myPremium;
    const demoVal=f.id==='contour'?('contour|'+(cur.color||AV_CONTOUR_DEFAULT)):f.id;
    const inner=f.id?`<span class="avf avf-${f.id}${(f.kind==='ring'||f.kind==='contour')?' avf-ring':''}"${f.id==='contour'?` style="--avf-col:${cur.color||AV_CONTOUR_DEFAULT}"`:''}>${_avFrameInner(f.id)}</span>`:'';
    return `<button class="avf-cell${cur.id===f.id?' sel':''}${locked?' locked':''}" data-f="${f.id}" onclick="_spPickFrame('${f.id}')" title="${esc(f.name)}${locked?' · Premium':''}">
      <span class="avf-demo avf-host"${f.id?` data-avframe="${f.id}"`:''}>
        <span class="avf-demo-face">${face}</span>${inner}
      </span>
      <span class="avf-cell-nm">${f.id?esc(f.name):'Нет'}</span>
      ${locked?'<span class="avf-lock">🔒</span>':''}
    </button>`;
  };
  return _spSec('Рамка аватара'+(myPremium?'':' <span class="sp-lock">часть ⭐ Premium</span>'))
    +`<div class="sp-card sp-pad"><div class="avf-grid">${AV_FRAMES.map(cell).join('')}</div>
      <div class="avf-colorrow" id="avfColorRow" style="display:${cur.id==='contour'?'flex':'none'}">
        <span>Цвет контура</span>
        <input type="color" id="avfColor" value="${cur.color||AV_CONTOUR_DEFAULT}" oninput="_spContourColor(this.value)">
      </div></div>`
    +_spHint('Рамку и эффект видят все, кто открывает твой профиль.');
}
function _spPickFrame(id){
  const f=AV_FRAME_MAP[id];if(!f)return;
  if(f.prem&&!myPremium){toast('⭐ Эта рамка — в SLON Premium');return;}
  const color=($('avfColor')&&$('avfColor').value)||AV_CONTOUR_DEFAULT;
  const val=id==='contour'?('contour|'+color):id;
  if(_spDraft)_spDraft.avFrame=val;
  document.querySelectorAll('.avf-grid .avf-cell').forEach(b=>b.classList.toggle('sel',b.dataset.f===id));
  const cr=$('avfColorRow');if(cr)cr.style.display=id==='contour'?'flex':'none';
  const prevAv=document.querySelector('#spCustPrev .sp-cust-av');
  _avFrameApply(prevAv,val);_avFrameReveal(prevAv);
  $('custSave')?.classList.add('show');
}
function _spContourColor(color){
  if(_spDraft)_spDraft.avFrame='contour|'+color;
  // обновляем демо контура в сетке и большое превью
  document.querySelectorAll('.avf-cell[data-f="contour"] .avf-contour').forEach(e=>e.style.setProperty('--avf-col',color));
  const prevAv=document.querySelector('#spCustPrev .sp-cust-av');
  _avFrameApply(prevAv,'contour|'+color);
  $('custSave')?.classList.add('show');
}
