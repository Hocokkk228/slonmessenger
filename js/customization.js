// ════════════════════════════════════════
// ── КАСТОМИЗАЦИЯ: рамки и эффекты аватара ──
// Синхронизируется как поле avFrame профиля (см. _myHelloFor / _myPublicProfile).
// Применяется к аватаркам профиля: своей (spAv) и собеседника (peerProfAv).
// ════════════════════════════════════════
const AV_FRAMES=[
  {id:'',         name:'Без рамки',          prem:false, kind:'none'},
  {id:'ring-blue',name:'Синий контур',       prem:false, kind:'ring'},
  {id:'ring-gold',name:'Золотой контур',     prem:false, kind:'ring'},
  {id:'ring-mint',name:'Мятный контур',      prem:false, kind:'ring'},
  {id:'vortex',   name:'Вихрь',              prem:true,  kind:'ring'},
  {id:'neon',     name:'Неон',               prem:true,  kind:'ring'},
  {id:'rainbow',  name:'Радуга',             prem:true,  kind:'ring'},
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

// Внутренняя разметка эффекта (для ring-рамок пусто — они рисуются через CSS)
function _avFrameInner(id){
  switch(id){
    case 'blood':  return '<i></i><i></i><i></i><i></i><i></i>';
    case 'snow':   return Array.from({length:9},()=>'<i></i>').join('');
    case 'hearts': return '<i>❤️</i><i>💙</i><i>💜</i><i>🧡</i>';
    case 'cobweb': return `<svg class="avf-web" viewBox="0 0 100 100" aria-hidden="true">
        <g fill="none" stroke="rgba(255,255,255,.8)" stroke-width="1">
          <path d="M2 2 L34 34 M2 20 Q22 22 34 34 M20 2 Q22 22 34 34"/>
          <path d="M6 12 Q20 14 30 26 M12 6 Q16 18 26 30"/>
          <path d="M98 2 L66 34 M98 20 Q78 22 66 34 M80 2 Q78 22 66 34"/>
        </g></svg><span class="avf-spider">🕷️</span>`;
    case 'ironman':return `<span class="avf-iron">
        <span class="avf-plate avf-top"><b class="avf-eye"></b><b class="avf-eye"></b></span>
        <span class="avf-plate avf-bot"></span></span>`;
    default:       return '';
  }
}

// Применить рамку к контейнеру аватара (host — .sp-av / #peerProfAv / .sp-cust-av ...)
function _avFrameApply(host,id){
  if(!host)return;
  host.querySelector(':scope > .avf')?.remove();
  const f=id&&AV_FRAME_MAP[id];
  if(!f||f.kind==='none'){host.removeAttribute('data-avframe');host.classList.remove('avf-host');return;}
  host.classList.add('avf-host');
  host.dataset.avframe=id;
  const ov=document.createElement('span');
  ov.className='avf avf-'+id+(f.kind==='ring'?' avf-ring':'');
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
  const cur=(typeof _spDraft==='object'&&_spDraft)?(_spDraft.avFrame||''):(myAvFrame||'');
  const cell=f=>{
    const locked=f.prem&&!myPremium;
    return `<button class="avf-cell${cur===f.id?' sel':''}${locked?' locked':''}" data-f="${f.id}" onclick="_spPickFrame('${f.id}')" title="${esc(f.name)}${locked?' · Premium':''}">
      <span class="avf-demo avf-host"${f.id?` data-avframe="${f.id}"`:''}>
        <span class="avf-demo-face">${esc(((myNick||myUsername)[0]||'🐘').toUpperCase())}</span>
        ${f.id?`<span class="avf avf-${f.id}${f.kind==='ring'?' avf-ring':''}">${_avFrameInner(f.id)}</span>`:''}
      </span>
      <span class="avf-cell-nm">${f.id?esc(f.name):'Нет'}</span>
      ${locked?'<span class="avf-lock">🔒</span>':''}
    </button>`;
  };
  return _spSec('Рамка аватара'+(myPremium?'':' <span class="sp-lock">часть ⭐ Premium</span>'))
    +`<div class="sp-card sp-pad"><div class="avf-grid">${AV_FRAMES.map(cell).join('')}</div></div>`
    +_spHint('Рамку и эффект видят все, кто открывает твой профиль.');
}
function _spPickFrame(id){
  const f=AV_FRAME_MAP[id];if(!f)return;
  if(f.prem&&!myPremium){toast('⭐ Эта рамка — в SLON Premium');return;}
  if(_spDraft)_spDraft.avFrame=id;
  document.querySelectorAll('.avf-grid .avf-cell').forEach(b=>b.classList.toggle('sel',b.dataset.f===id));
  // Живое превью на большой аватарке
  const prevAv=document.querySelector('#spCustPrev .sp-cust-av');
  _avFrameApply(prevAv,id);_avFrameReveal(prevAv);
  $('custSave')?.classList.add('show');
}
