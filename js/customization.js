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
  {id:'catears',  name:'Кошачьи ушки',       prem:false, kind:'fx'},
  {id:'bunny',    name:'Зайка',              prem:true,  kind:'fx'},
  {id:'halo',     name:'Ангел',              prem:true,  kind:'fx'},
  {id:'devil',    name:'Чертёнок',           prem:true,  kind:'fx'},
  {id:'crown',    name:'Корона',             prem:true,  kind:'fx'},
  {id:'wings',    name:'Крылья',             prem:true,  kind:'fx'},
  {id:'sparkle',  name:'Звёздная пыль',      prem:true,  kind:'fx'},
  {id:'hearts',   name:'Влюблён(а)',         prem:false, kind:'fx'},
  {id:'snow',     name:'Снежок',             prem:true,  kind:'fx'},
  {id:'bday',     name:'День рождения',      prem:true,  kind:'fx'},
  {id:'shark',    name:'Акульи челюсти',     prem:true,  kind:'fx'},
  {id:'raven',    name:'Ворон',              prem:true,  kind:'fx'},
];
const AV_FRAME_MAP=Object.fromEntries(AV_FRAMES.map(f=>[f.id,f]));
// Цветная «шапка» карточки в сетке выбора — как в референсе (розовая карточка «Мяу-мяу» и т.д.)
const AV_FRAME_CARD_BG={
  cobweb:'linear-gradient(160deg,#3a3a42,#101012)',
  blood:'linear-gradient(160deg,#7a1620,#1a0508)',
  ironman:'linear-gradient(160deg,#e8352b,#3a0d08)',
  catears:'linear-gradient(160deg,#ffd66b,#ff9dc0)',
  bunny:'linear-gradient(160deg,#ffe3ef,#ffb6cf)',
  halo:'linear-gradient(160deg,#fff6d8,#ffe27a)',
  devil:'linear-gradient(160deg,#ff6a52,#5c0e08)',
  crown:'linear-gradient(160deg,#ffe9a8,#d99a14)',
  wings:'linear-gradient(160deg,#d8c9ff,#5a3fc0)',
  sparkle:'linear-gradient(160deg,#c9b6ff,#6a4fe0)',
  hearts:'linear-gradient(160deg,#ffc2d6,#ff6a92)',
  snow:'linear-gradient(160deg,#e3f4ff,#8fc4ea)',
  bday:'linear-gradient(160deg,#ffd9ec,#a6d8ff)',
  shark:'linear-gradient(160deg,#1e5a78,#03121c)',
  raven:'linear-gradient(160deg,#3a3a42,#0a0a0c)',
};
const AV_CONTOUR_DEFAULT='#3390ec';
// avFrame может нести цвет для контура: "contour|#ff0000"
function _avFrameParse(val){const [id,color]=String(val||'').split('|');return {id:id||'',color:color||''};}

// Внутренняя разметка эффекта (для ring-рамок пусто — они рисуются через CSS)
function _avFrameInner(id){
  switch(id){
    case 'blood':  return '<i></i><i></i>'; // 2 капли стекают в левом нижнем углу
    case 'snow':   return Array.from({length:9},()=>'<i></i>').join('');
    case 'hearts': return '<i>❤️</i><i>💜</i><i>❤️</i>';
    case 'catears':return '<i class="ring"></i><i class="l"></i><i class="r"></i><i class="nose">🐾</i>';
    case 'bunny':  return '<i class="l"></i><i class="r"></i>';
    case 'halo':   return '<i class="ring"></i><i class="spark">✨</i>';
    case 'devil':  return '<i class="l"></i><i class="r"></i><i class="tail"></i>';
    case 'crown':  return '<i class="cr">👑</i><i class="sp1">✨</i><i class="sp2">✨</i>';
    case 'wings':  return '<i class="l"></i><i class="r"></i>';
    case 'sparkle':return Array.from({length:7},(_,i)=>`<i style="--n:${i}">✨</i>`).join('');
    case 'bday':   return '<i class="cake">🎂</i><i class="b1">🎈</i><i class="b2">🎈</i>';
    case 'shark':{
      // Программно строим два ряда острых зубов (верхний/нижний), чтобы не накосячить в координатах руками
      const teeth=(baseY,peakY,n)=>{const step=100/n;let d=`M0,${baseY}`;
        for(let i=0;i<n;i++){const x0=i*step,xm=x0+step/2,x1=x0+step;d+=` L${x0},${baseY} L${xm},${peakY} L${x1},${baseY}`;}
        return d;};
      const upper=teeth(2,26,7)+' L100,2 Z';
      const lower=teeth(58,34,7)+' L100,58 Z';
      return `<svg class="avf-shark-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width="100" height="60" fill="#0a0a0c"/>
        <path fill="#f4f4ef" d="${upper}"/>
        <path fill="#f4f4ef" d="${lower}"/>
      </svg>`;
    }
    case 'raven':  return `<svg class="avf-raven-svg" viewBox="0 0 100 100" aria-hidden="true">
        <defs><linearGradient id="wpRavenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a4a54"/><stop offset="1" stop-color="#0a0a0d"/>
        </linearGradient></defs>
        <g fill="url(#wpRavenGrad)">
          <ellipse cx="52" cy="60" rx="26" ry="20"/>
          <circle cx="30" cy="38" r="16"/>
          <path d="M14 36l-14 4 14 5z"/>
          <path d="M46 42c14-4 30 2 34 16-10 6-24 8-34 0-4-6-4-12 0-16z"/>
        </g>
        <circle cx="24" cy="34" r="2.6" fill="#ffd75e"/>
      </svg>`;
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
    const card=f.id&&AV_FRAME_CARD_BG[f.id];
    return `<button class="avf-cell${cur.id===f.id?' sel':''}${locked?' locked':''}${card?' has-card':''}" data-f="${f.id}" onclick="_spPickFrame('${f.id}')" title="${esc(f.name)}${locked?' · Premium':''}"${card?` style="background:${card}"`:''}>
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

// ════════════════════════════════════════
// ── ОБОИ ПРОФИЛЯ: большой анимированный баннер за аватаркой ──
// Синхронизируется как поле profileWallpaper (см. _myHelloFor / _myPublicProfile).
// Применяется к .sp-hero-wp (свой профиль) и .pp-hero-wp (профиль собеседника).
// ════════════════════════════════════════
const PROFILE_WALLPAPERS=[
  {id:'',       name:'Нет',            prem:false},
  {id:'skull',  name:'Черепа',         prem:true},
  {id:'sakura', name:'Сакура',         prem:true},
  {id:'stars',  name:'Звёздное небо',  prem:true},
];
const PROFILE_WALLPAPER_MAP=Object.fromEntries(PROFILE_WALLPAPERS.map(w=>[w.id,w]));

function _wallpaperInner(id){
  switch(id){
    case 'skull':
      return `<div class="wp-skull-glow"></div>
        <svg class="wp-skull-svg" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <defs>
            <linearGradient id="wpBoneGrad" x1="0" y1="0" x2=".7" y2="1">
              <stop offset="0" stop-color="#fdfdff"/><stop offset=".55" stop-color="#e2e4ee"/><stop offset="1" stop-color="#aeb2c2"/>
            </linearGradient>
            <radialGradient id="wpEyeGrad" cx="50%" cy="35%" r="75%">
              <stop offset="0" stop-color="#fff2f2"/><stop offset=".4" stop-color="#ff4560"/><stop offset="1" stop-color="#6e0016"/>
            </radialGradient>
          </defs>
          <g class="wp-skull-main">
            <path fill="url(#wpBoneGrad)" stroke="#7d7f8c" stroke-width="1" d="M50 3C29 3 15 17 13 37c-2 15 3 26 12 34l2 13c0 6 5 10 11 10h24c6 0 11-4 11-10l2-13c9-8 14-19 12-34C85 17 71 3 50 3z"/>
            <path fill="#8b8ea0" opacity=".35" d="M18 26c-3 8-4 16-2 24 1-9 3-17 7-24z"/>
            <path fill="#8b8ea0" opacity=".35" d="M82 26c3 8 4 16 2 24-1-9-3-17-7-24z"/>
            <path class="wp-skull-eye" d="M27 41l19-3 2 15-16 6-11-9z"/>
            <path class="wp-skull-eye" d="M73 41l-19-3-2 15 16 6 11-9z"/>
            <path fill="#7d7f8c" opacity=".85" d="M47 56h6l3 12-6 8-6-8z"/>
            <path fill="url(#wpBoneGrad)" stroke="#7d7f8c" stroke-width="1" d="M34 78h32l-2 10c-1 4-4 6-8 6H44c-4 0-7-2-8-6z"/>
            <path stroke="#7d7f8c" stroke-width="1" d="M40 78v14M46 78v16M50 78v17M54 78v16M60 78v14"/>
            <path stroke="#9296a6" stroke-width="1" opacity=".5" fill="none" d="M18 20l9 15M83 17l-10 16"/>
          </g>
        </svg>
        <i class="wp-ember" style="--x:12%;--d:0s"></i><i class="wp-ember" style="--x:28%;--d:1.1s"></i>
        <i class="wp-ember" style="--x:60%;--d:.5s"></i><i class="wp-ember" style="--x:78%;--d:1.8s"></i>
        <i class="wp-ember" style="--x:90%;--d:2.4s"></i>`;
    case 'sakura':
      return `<div class="wp-sakura-sky"></div>
        ${Array.from({length:10},(_,i)=>`<i class="wp-petal" style="--x:${(i*97)%100}%;--d:${(i*0.9)%6}s;--sp:${5+(i%4)}s"></i>`).join('')}`;
    case 'stars':
      return `<div class="wp-night-sky"></div>
        ${Array.from({length:16},(_,i)=>`<i class="wp-star" style="--x:${(i*61)%100}%;--y:${(i*37)%75}%;--d:${(i*0.4)%3}s"></i>`).join('')}
        <i class="wp-shoot"></i>`;
    default: return '';
  }
}
// Применить обои к контейнеру (host — #spHeroWp / #peerProfWp)
function _wallpaperApply(host,id){
  if(!host)return;
  host.className=host.className.replace(/\bwp-bg-\S+/g,'').trim();
  if(!id||!PROFILE_WALLPAPER_MAP[id]){host.innerHTML='';host.classList.remove('active');return;}
  host.classList.add('active','wp-bg-'+id);
  host.innerHTML=_wallpaperInner(id);
}

// ── Секция выбора обоев в странице кастомизации ──
function _spWallpaperSection(){
  const cur=(typeof _spDraft==='object'&&_spDraft)?(_spDraft.profileWallpaper||''):(myProfileWallpaper||'');
  const cell=w=>{
    const locked=w.prem&&!myPremium;
    return `<button class="wp-cell${cur===w.id?' sel':''}${locked?' locked':''}" data-w="${w.id}" onclick="_spPickWallpaper('${w.id}')" title="${esc(w.name)}${locked?' · Premium':''}">
      <span class="wp-demo${w.id?' active wp-bg-'+w.id:''}">${w.id?_wallpaperInner(w.id):''}</span>
      <span class="wp-cell-nm">${w.id?esc(w.name):'Нет'}</span>
      ${locked?'<span class="avf-lock">🔒</span>':''}
    </button>`;
  };
  return _spSec('Обои профиля'+(myPremium?'':' <span class="sp-lock">часть ⭐ Premium</span>'))
    +`<div class="sp-card sp-pad"><div class="wp-grid">${PROFILE_WALLPAPERS.map(cell).join('')}</div></div>`
    +_spHint('Большой анимированный фон за аватаркой — его видят все, кто открывает твой профиль.');
}
function _spPickWallpaper(id){
  const w=PROFILE_WALLPAPER_MAP[id];if(!w)return;
  if(w.prem&&!myPremium){toast('⭐ Эти обои — в SLON Premium');return;}
  if(_spDraft)_spDraft.profileWallpaper=id;
  document.querySelectorAll('.wp-grid .wp-cell').forEach(b=>b.classList.toggle('sel',b.dataset.w===id));
  _wallpaperApply($('spCustPrevWp'),id);
  $('custSave')?.classList.add('show');
}
