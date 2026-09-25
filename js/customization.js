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
  {id:'wings',    name:'Крылья',             prem:true,  kind:'fx'},
  {id:'shark',    name:'Акульи челюсти',     prem:true,  kind:'fx'},
];
const AV_FRAME_MAP=Object.fromEntries(AV_FRAMES.map(f=>[f.id,f]));
// Цветная «шапка» карточки в сетке выбора — как в референсе (розовая карточка «Мяу-мяу» и т.д.)
const AV_FRAME_CARD_BG={
  cobweb:'linear-gradient(160deg,#3a3a42,#101012)',
  blood:'linear-gradient(160deg,#7a1620,#1a0508)',
  ironman:'linear-gradient(160deg,#e8352b,#3a0d08)',
  catears:'linear-gradient(160deg,#ffd66b,#ff9dc0)',
  wings:'linear-gradient(160deg,#d8c9ff,#5a3fc0)',
  shark:'linear-gradient(160deg,#1e5a78,#03121c)',
};
const AV_CONTOUR_DEFAULT='#3390ec';
// avFrame может нести цвет для контура: "contour|#ff0000"
function _avFrameParse(val){const [id,color]=String(val||'').split('|');return {id:id||'',color:color||''};}

// Внутренняя разметка эффекта (для ring-рамок пусто — они рисуются через CSS)
function _avFrameInner(id){
  switch(id){
    case 'blood':  return '<i></i><i></i>'; // 2 капли стекают в левом нижнем углу
    case 'catears':return '<i class="ring"></i><i class="l"></i><i class="r"></i><i class="nose">🐾</i>';
    case 'wings':  return '<i class="l"></i><i class="r"></i>';
    case 'shark':{
      // Пасть акулы ВОКРУГ аватарки: лицо видно в середине, зубы по кругу
      // сверху и снизу смотрят внутрь, снаружи — кольцо акульей кожи с глазами.
      // Координаты 0..100 = сама аватарка, кольцо выходит за её край.
      const P=(r,a)=>{const t=a*Math.PI/180;return (50+r*Math.cos(t)).toFixed(2)+','+(50+r*Math.sin(t)).toFixed(2);};
      const teeth=(from,to,n,len)=>{let d='';const st=(to-from)/n;
        for(let i=0;i<n;i++){const a0=from+i*st;d+=`M${P(49,a0)}L${P(49-len,a0+st/2)}L${P(49,a0+st)}Z`;}
        return d;};
      const circ=r=>`M${50-r},50A${r},${r} 0 1,0 ${50+r},50A${r},${r} 0 1,0 ${50-r},50Z`;
      return `<svg class="avf-shark-svg" viewBox="-15 -15 130 130" aria-hidden="true">
        <defs><linearGradient id="avfSharkSkin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4f7390"/><stop offset=".55" stop-color="#7f9db3"/><stop offset="1" stop-color="#dfe8ee"/>
        </linearGradient></defs>
        <path fill="url(#avfSharkSkin)" fill-rule="evenodd" d="${circ(62)}${circ(49)}"/>
        <circle cx="50" cy="50" r="49.5" fill="none" stroke="#9e2233" stroke-width="3"/>
        <g class="sh-up"><path fill="#f7f6f0" stroke="#c9c6b8" stroke-width=".6" d="${teeth(200,340,8,15)}"/></g>
        <g class="sh-lo"><path fill="#f7f6f0" stroke="#c9c6b8" stroke-width=".6" d="${teeth(25,155,7,12)}"/></g>
        <circle cx="${(50+56*Math.cos(197*Math.PI/180)).toFixed(1)}" cy="${(50+56*Math.sin(197*Math.PI/180)).toFixed(1)}" r="3" fill="#0b0d10"/>
        <circle cx="${(50+56*Math.cos(343*Math.PI/180)).toFixed(1)}" cy="${(50+56*Math.sin(343*Math.PI/180)).toFixed(1)}" r="3" fill="#0b0d10"/>
      </svg>`;
    }
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
  {id:'skull',  name:'Пленённые души', prem:true},
  {id:'sakura', name:'Сакура',         prem:true},
  {id:'stars',  name:'Звёздное небо',  prem:true},
];
const PROFILE_WALLPAPER_MAP=Object.fromEntries(PROFILE_WALLPAPERS.map(w=>[w.id,w]));

function _wallpaperInner(id){
  switch(id){
    case 'skull':
      // «Пленённые души» — полутоновые лицо-призрак и рука, генерируются один раз на canvas
      _wpSoulsEnsure();
      return '<i class="wp-souls-face"></i><i class="wp-souls-hand"></i><i class="wp-souls-grain"></i>';
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

// ════════════════════════════════════════
// ── ТЕМА ОКНА ПРОФИЛЯ ──
// Любая тема приложения (THEMES), но только для окна профиля: кто бы его ни
// открыл — со светлой, like tg или любой другой темой — увидит его в этих цветах.
// Синхронизируется как поле profileTheme (hello / publicProfile).
// Работает за счёт data-theme на контейнере: CSS-переменные темы
// ([data-theme="id"]{--bg1…}) переопределяются только внутри него.
// ════════════════════════════════════════
function _profThemeApply(el,id){
  if(!el)return;
  const t=id&&THEMES.find(x=>x.id===id);
  if(t){el.setAttribute('data-theme',t.id);el.classList.add('prof-themed');}
  else{el.removeAttribute('data-theme');el.classList.remove('prof-themed');}
}
function _spProfThemeSection(){
  const cur=(typeof _spDraft==='object'&&_spDraft)?(_spDraft.profileTheme||''):(myProfileTheme||'');
  // Карточка-миниатюра сама стоит в этой теме — видно реальные цвета окна
  const cell=t=>{
    const locked=t&&t.premium&&!myPremium;const id=t?t.id:'';
    return `<button class="pth-cell${cur===id?' sel':''}${locked?' locked':''}" data-t="${id}" onclick="_spPickProfTheme('${id}')">
      <span class="pth-demo"${id?` data-theme="${id}"`:''}>${id?'<i class="pth-top"></i><i class="pth-av"></i><i class="pth-l1"></i><i class="pth-l2"></i><i class="pth-btn"></i>':'<span class="pth-none">Как у<br>смотрящего</span>'}</span>
      <span class="wp-cell-nm">${t?esc(t.lbl):'Нет'}</span>
      ${locked?'<span class="avf-lock">🔒</span>':''}
    </button>`;
  };
  return _spSec('Тема окна профиля'+(myPremium?'':' <span class="sp-lock">часть ⭐ Premium</span>'))
    +`<div class="sp-card sp-pad"><div class="wp-grid pth-grid">${cell(null)}${THEMES.map(cell).join('')}</div></div>`
    +_spHint('Окно твоего профиля (описание, юзернейм, кнопки) будет в этой теме у всех, кто его откроет — независимо от их темы приложения.');
}
function _spPickProfTheme(id){
  const t=id&&THEMES.find(x=>x.id===id);
  if(id&&!t)return;
  if(t&&t.premium&&!myPremium){toast('⭐ Эта тема — в SLON Premium');return;}
  if(_spDraft)_spDraft.profileTheme=id;
  document.querySelectorAll('.pth-grid .pth-cell').forEach(b=>b.classList.toggle('sel',b.dataset.t===id));
  _profThemeApply($('spCustThemeBox'),id);
  $('custSave')?.classList.add('show');
}

// ════════════════════════════════════════
// ── «Пленённые души»: сцена в оттенках серого на canvas → полутон (halftone) ──
// Лицо и рука рисуются отдельными слоями (анимируются независимо), затем
// переводятся в белые полутоновые точки на прозрачном фоне — цвет градиента
// профиля остаётся виден между точками. Генерация один раз, blob-URL в CSS-переменные.
// ════════════════════════════════════════
let _wpSoulsState=0,_soulsNoBlur=false; // Safari: у canvas нет filter:blur — мягкие свечения пропускаем
function _soulsEll(g,x,y,rx,ry,rot){g.beginPath();g.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2);g.fill();}
// Палец: сужается к кончику, светотень поперёк (тёмные края, светлая середина)
function _soulsFinger(g,w,len,light){
  const t=w*0.78,gr=g.createLinearGradient(-w/2,0,w/2,0);
  gr.addColorStop(0,'#262626');gr.addColorStop(.3,light);gr.addColorStop(.62,light);gr.addColorStop(1,'#1a1a1a');
  g.fillStyle=gr;g.beginPath();g.moveTo(-w/2,0);g.lineTo(-t/2,-len+t/2);
  g.arc(0,-len+t/2,t/2,Math.PI,0);g.lineTo(w/2,0);g.closePath();g.fill();
}
// Лицо: вытянутый измождённый череп-призрак, асимметричные глазницы, огромный кричащий рот
function _soulsDrawFace(g,W,H){
  g.save();g.translate(W/2,H/2);g.rotate(-0.1);g.translate(-W/2,-H/2);
  const cx=W*0.5;
  if(!_soulsNoBlur){g.filter='blur(22px)';g.fillStyle='rgba(255,255,255,.18)';_soulsEll(g,cx,H*0.48,W*0.38,H*0.44);}
  // голова + отвисшая челюсть (две формы с одной светотенью)
  g.filter='blur(5px)';
  let gr=g.createRadialGradient(cx+W*0.06,H*0.26,W*0.04,cx,H*0.48,W*0.66);
  gr.addColorStop(0,'#ffffff');gr.addColorStop(.42,'#cfcfcf');gr.addColorStop(.78,'#565656');gr.addColorStop(1,'#101010');
  g.fillStyle=gr;_soulsEll(g,cx,H*0.42,W*0.31,H*0.38);_soulsEll(g,cx,H*0.7,W*0.23,H*0.22);
  // впалые виски и щёки
  g.filter='blur(14px)';g.fillStyle='rgba(0,0,0,.72)';
  _soulsEll(g,cx-W*0.25,H*0.44,W*0.08,H*0.2);_soulsEll(g,cx+W*0.25,H*0.44,W*0.08,H*0.2);
  _soulsEll(g,cx-W*0.2,H*0.6,W*0.07,H*0.11);_soulsEll(g,cx+W*0.19,H*0.61,W*0.07,H*0.11);
  // лоб и скулы — блики
  g.filter='blur(10px)';g.fillStyle='rgba(255,255,255,.78)';
  _soulsEll(g,cx+W*0.03,H*0.18,W*0.2,H*0.07);
  _soulsEll(g,cx-W*0.17,H*0.46,W*0.07,H*0.035,-.4);_soulsEll(g,cx+W*0.16,H*0.47,W*0.065,H*0.032,.4);
  // глазницы — асимметричные чёрные провалы
  g.filter='blur(7px)';g.fillStyle='#000';
  _soulsEll(g,cx-W*0.14,H*0.33,W*0.105,H*0.085,-.5);_soulsEll(g,cx+W*0.12,H*0.345,W*0.09,H*0.075,.4);
  g.filter='blur(2px)';
  _soulsEll(g,cx-W*0.14,H*0.335,W*0.064,H*0.05,-.5);_soulsEll(g,cx+W*0.12,H*0.35,W*0.055,H*0.045,.4);
  // потёки из глазниц
  g.filter='blur(3px)';g.fillStyle='rgba(0,0,0,.6)';
  g.beginPath();g.roundRect(cx-W*0.16,H*0.38,W*0.022,H*0.12,W*0.011);g.fill();
  g.beginPath();g.roundRect(cx+W*0.13,H*0.39,W*0.018,H*0.08,W*0.009);g.fill();
  // нос — две щели
  g.filter='blur(3px)';g.fillStyle='#000';
  _soulsEll(g,cx-W*0.03,H*0.445,W*0.018,H*0.03,.3);_soulsEll(g,cx+W*0.03,H*0.445,W*0.018,H*0.03,-.3);
  // рот — огромный провал, чуть перекошен
  g.filter='blur(4px)';_soulsEll(g,cx+W*0.01,H*0.72,W*0.14,H*0.235,.06);
  // светлый край губ вокруг рта
  g.filter='blur(6px)';g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=W*0.035;
  g.beginPath();g.ellipse(cx+W*0.01,H*0.72,W*0.17,H*0.265,.06,Math.PI*0.12,Math.PI*0.88);g.stroke();
  // верхние зубы — рваная кромка
  g.filter='blur(1px)';g.fillStyle='#e8e8e8';
  const tw=W*0.034,ty=H*0.49;
  for(let i=-3;i<=3;i++){const tx=cx+W*0.005+i*tw*1.05;g.beginPath();g.moveTo(tx-tw/2,ty+Math.abs(i)*H*0.004);g.lineTo(tx+tw/2,ty+Math.abs(i)*H*0.004);
    g.lineTo(tx+tw*0.1,ty+H*(0.04+0.022*Math.abs(Math.sin(i*1.7))));g.closePath();g.fill();}
  // нижние зубы — редкие, торчат вверх
  for(const [dx,h] of [[-0.06,0.03],[-0.02,0.022],[0.035,0.028],[0.07,0.02]]){const tx=cx+W*dx,by=H*0.935;
    g.beginPath();g.moveTo(tx-tw*0.45,by);g.lineTo(tx+tw*0.45,by);g.lineTo(tx,by-H*h);g.closePath();g.fill();}
  // внутренняя тьма рта (перекрывает корни зубов)
  g.filter='blur(3px)';g.fillStyle='#000';_soulsEll(g,cx+W*0.01,H*0.73,W*0.115,H*0.17,.06);
  // низ уходит во тьму
  g.filter='none';
  gr=g.createLinearGradient(0,H*0.86,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'#000');
  g.fillStyle=gr;g.fillRect(0,H*0.86,W,H*0.14);
  g.restore();
}
// Рука: раскрытая ладонь, пальцы вверх, тянется к зрителю
function _soulsDrawHand(g,W,H){
  const px=W*0.5,py=H*0.62;
  if(!_soulsNoBlur){g.filter='blur(18px)';g.fillStyle='rgba(255,255,255,.16)';_soulsEll(g,px,py-H*0.1,W*0.38,H*0.38);}
  g.filter='blur(2.5px)';
  // запястье
  let gr=g.createLinearGradient(px-W*0.15,0,px+W*0.15,0);
  gr.addColorStop(0,'#1e1e1e');gr.addColorStop(.5,'#8f8f8f');gr.addColorStop(1,'#161616');
  g.fillStyle=gr;g.beginPath();g.roundRect(px-W*0.14,py,W*0.28,H*0.45,W*0.07);g.fill();
  // ладонь
  gr=g.createRadialGradient(px+W*0.02,py-H*0.04,W*0.03,px,py,W*0.32);
  gr.addColorStop(0,'#fbfbfb');gr.addColorStop(.62,'#b8b8b8');gr.addColorStop(1,'#303030');
  g.fillStyle=gr;g.beginPath();g.roundRect(px-W*0.24,py-H*0.18,W*0.48,H*0.32,W*0.15);g.fill();
  // пальцы: [смещение основания x, угол, длина, толщина, сдвиг основания y]
  const fingers=[[-0.165,-0.17,0.34,0.125,0],[-0.055,-0.05,0.39,0.13,-0.01],[0.058,0.07,0.365,0.125,0],[0.16,0.2,0.28,0.108,0.03]];
  for(const [bx,a,len,w,by] of fingers){
    g.save();g.translate(px+W*bx,py-H*(0.15-by));g.rotate(a);g.translate(0,H*0.05);
    _soulsFinger(g,W*w,H*(len+0.05),'#e8e8e8');
    // суставы — мягкие складки
    g.fillStyle='rgba(0,0,0,.28)';
    g.fillRect(-W*w*0.3,-H*(len+0.05)*0.4,W*w*0.6,H*0.007);g.fillRect(-W*w*0.28,-H*(len+0.05)*0.68,W*w*0.56,H*0.006);
    g.fillStyle='rgba(255,255,255,.45)';_soulsEll(g,0,-H*(len+0.05)*0.88,W*w*0.24,H*0.02);
    g.restore();
  }
  // большой палец — толстый, в сторону и вверх
  g.save();g.translate(px-W*0.2,py+H*0.05);g.rotate(-1.02);_soulsFinger(g,W*0.145,H*0.26,'#dadada');g.restore();
  // мягкие линии ладони
  g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=W*0.008;g.filter='blur(2px)';
  g.beginPath();g.moveTo(px-W*0.17,py-H*0.06);g.quadraticCurveTo(px,py+H*0.01,px+W*0.19,py-H*0.08);g.stroke();
  g.beginPath();g.moveTo(px-W*0.13,py+H*0.08);g.quadraticCurveTo(px-W*0.03,py-H*0.02,px+W*0.02,py-H*0.13);g.stroke();
  // запястье растворяется во тьме
  g.filter='none';
  gr=g.createLinearGradient(0,H*0.74,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'#000');
  g.fillStyle=gr;g.fillRect(0,H*0.74,W,H*0.26);
}
// Края слоя уходят в черноту — на баннере не видно прямоугольника
function _soulsVignette(g,W,H,cy){
  g.save();g.filter='none';g.translate(W/2,H*cy);g.scale(1,H/W);
  const gr=g.createRadialGradient(0,0,W*0.36,0,0,W*0.54);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'#000');
  g.fillStyle=gr;g.fillRect(-W,-W*2,W*2,W*4);g.restore();
}
// Серый рисунок → полутон: белые точки на прозрачном, размер ~ яркость, шум «плёнки» только внутри фигур
function _soulsHalftone(src,W,H,step){
  const d=src.getContext('2d').getImageData(0,0,W,H).data;
  const o=document.createElement('canvas');o.width=W;o.height=H;const og=o.getContext('2d');
  og.fillStyle='#fff';
  let row=0;
  for(let y=0;y<H;y+=step*0.87,row++){
    for(let x=(row&1)?step/2:0;x<W;x+=step){
      const i=((Math.min(H-1,y|0))*W+Math.min(W-1,x|0))*4;
      let l=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)/255;
      l=Math.pow(l,1.15);l+=(Math.random()-.5)*0.22*Math.sqrt(l);
      if(l<0.07)continue;
      og.beginPath();og.arc(x,y,Math.min(step*0.62,Math.sqrt(l)*step*0.6),0,Math.PI*2);og.fill();
    }
  }
  return o;
}
function _soulsRender(W,H,draw,cy){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle='#000';g.fillRect(0,0,W,H);
  _soulsNoBlur=!('filter' in g);
  draw(g,W,H);_soulsVignette(g,W,H,cy);
  return {gray:c,ht:_soulsHalftone(c,W,H,7)};
}
function _soulsLayer(W,H,draw,cy,cssVar){
  const {ht}=_soulsRender(W,H,draw,cy);
  ht.toBlob(b=>{if(b)document.documentElement.style.setProperty(cssVar,`url("${URL.createObjectURL(b)}")`);},'image/png');
}
function _wpSoulsEnsure(){
  if(_wpSoulsState)return;_wpSoulsState=1;
  try{
    _soulsLayer(420,640,_soulsDrawFace,0.5,'--wp-souls-face');
    _soulsLayer(460,560,_soulsDrawHand,0.5,'--wp-souls-hand');
  }catch(e){console.warn('[SLON] souls wallpaper:',e);}
}
