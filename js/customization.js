// ════════════════════════════════════════
// ── КАСТОМИЗАЦИЯ: рамки и эффекты аватара ──
// Синхронизируется как поле avFrame профиля (см. _myHelloFor / _myPublicProfile).
// Применяется к аватаркам профиля: своей (spAv) и собеседника (peerProfAv).
// ════════════════════════════════════════
const AV_FRAMES=[
  {id:'',         name:'Без рамки',          prem:false, kind:'none'},
  {id:'contour',  name:'Контур',             prem:false, kind:'contour'},
  {id:'vortex',   name:'Вихрь',              prem:true,  kind:'ring'},
  {id:'neon',     name:'Неон',               prem:true,  kind:'ring'},
  {id:'avengers', name:'Мстители',           prem:true,  kind:'ring'},
  {id:'fire',     name:'Пламя',              prem:true,  kind:'ring'},
  {id:'matrix',   name:'Матрица',            prem:true,  kind:'ring'},
  {id:'thunder',  name:'Молния',             prem:true,  kind:'ring'},
  {id:'blood',    name:'Кровь',              prem:true,  kind:'fx'},
  {id:'cobweb',   name:'Паутина',            prem:true,  kind:'fx'},
  {id:'ironman',  name:'Железный человек',   prem:true,  kind:'fx'},
  {id:'hearts',   name:'Сердечки',           prem:true,  kind:'fx'},
  {id:'snow',     name:'Снег',               prem:true,  kind:'fx'},
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
            <linearGradient id="avfGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe38a"/><stop offset=".5" stop-color="#f4c23c"/><stop offset="1" stop-color="#c9962a"/></linearGradient>
            <linearGradient id="avfRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8352b"/><stop offset="1" stop-color="#8f120c"/></linearGradient>
          </defs>
          <path class="avf-shell" fill="url(#avfRed)" d="M50 4c-19 0-33 12-33 33 0 16 6 33 12 44 4 8 12 13 21 13s17-5 21-13c6-11 12-28 12-44C83 16 69 4 50 4z"/>
          <path class="avf-cheek" fill="url(#avfRed)" d="M22 40c-3 10-2 24 4 36l7-3c-5-11-7-24-6-34z M78 40c3 10 2 24-4 36l-7-3c5-11 7-24 6-34z"/>
          <g class="avf-plate">
            <path fill="url(#avfGold)" d="M50 8c-16 0-27 10-28 25-1 9 1 19 5 28 3 6 12 9 23 9s20-3 23-9c4-9 6-19 5-28C77 18 66 8 50 8z"/>
            <path fill="#b9832063" d="M50 8c-16 0-27 10-28 25h56C77 18 66 8 50 8z" opacity=".4"/>
            <path class="avf-eye" d="M30 40 L45 37 L45 45 L31 47 Z"/>
            <path class="avf-eye" d="M70 40 L55 37 L55 45 L69 47 Z"/>
            <path fill="#a9761b" d="M46 52h8l-2 12h-4z"/>
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
