// ════════════════════════════════════════
// ── КОСМЕТИКА 2: симбиот (эффект профиля и фон строки), рамки «Чернильный взрыв»,
//    «Облака и луна», «Пузырь». Всё своё, векторами; анимация симбиота — рывками 15 к/с
//    (steps), в полукомиксном стиле: толстый контур, блики, растровые точки.
// ════════════════════════════════════════

// ── Рамки ──
AV_FRAMES.push(
  {id:'inkburst',     name:'Чернильный взрыв', prem:true,  kind:'fx'},
  {id:'venom',        name:'Веном',            prem:true,  kind:'fx'},
  {id:'cloudmoon',    name:'Облака и луна',    prem:true,  kind:'fx'},
  {id:'bubble',       name:'Пузырь',           prem:false, kind:'fx'},
  {id:'cutecat',      name:'Милый котик',      prem:false, kind:'fx'},
  {id:'sakura',       name:'Цветущая сакура',  prem:false, kind:'fx'},
  {id:'bunny',        name:'Зайка с бантиком', prem:true,  kind:'fx'},
  {id:'heartsparkle', name:'Нежные сердечки',  prem:false, kind:'fx'},
  {id:'angelic',      name:'Ангелочек',        prem:true,  kind:'fx'},
);
for(const f of AV_FRAMES)AV_FRAME_MAP[f.id]=f;
Object.assign(AV_FRAME_CARD_BG,{
  venom:'#0a0a12',inkburst:'#101018',cloudmoon:'#0c1430',bubble:'#07203a',
  cutecat:'#2d1624',sakura:'#2c1424',bunny:'#25162c',heartsparkle:'#2a1222',angelic:'#152233',blood:'#2a0408'
});

function _cosInkBurst(){
  const R=_cosRnd(77);let spikes='',drops='',glints='';
  for(let i=0;i<72;i++){
    const a=i*(360/64)+(R()-.5)*4,len=8+R()*R()*42,w=2.4+R()*4.6,r0=47;
    const [bx1,by1]=_cosP(r0,a-w/2),[bx2,by2]=_cosP(r0,a+w/2),[tx,ty]=_cosP(r0+len,a+(R()-.5)*6),[cx,cy]=_cosP(r0+len*.55,a);
    spikes+=`M${_cosF(bx1)},${_cosF(by1)}Q${_cosF(cx)},${_cosF(cy)} ${_cosF(tx)},${_cosF(ty)}Q${_cosF(cx)},${_cosF(cy)} ${_cosF(bx2)},${_cosF(by2)}Z`;
    if(R()>.72){const [dx,dy]=_cosP(r0+len+3+R()*6,a),rr=.8+R()*1.8;drops+=`M${_cosF(dx-rr)},${_cosF(dy)}a${rr},${rr} 0 1,0 ${_cosF(2*rr)},0a${rr},${rr} 0 1,0 ${_cosF(-2*rr)},0Z`;}
    if(R()>.8){const [g1x,g1y]=_cosP(r0+2,a),[g2x,g2y]=_cosP(r0+len*.6,a+1);glints+=`M${_cosF(g1x)},${_cosF(g1y)}L${_cosF(g2x)},${_cosF(g2y)}`;}
  }
  return _cosSvg('avf-ink',[-32,-32,164,164],`
    <g class="ink-g"><path d="${spikes}${drops}" fill="#050507"/>
    <path d="${glints}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".85" fill="none"/></g>
    <circle cx="50" cy="50" r="48.3" fill="none" stroke="#fff" stroke-width="2.6"/>
    <circle cx="50" cy="50" r="46.6" fill="none" stroke="#050507" stroke-width="1.4"/>`);
}
function _cosCloudMoon(){
  const cloud=(x,y,s,cls)=>`<g class="cm-cloud ${cls}" transform="translate(${x},${y}) scale(${s})">
      <path d="M-22,6C-30,6 -32,-4 -25,-8C-26,-17 -15,-21 -9,-15C-6,-25 9,-26 12,-15C19,-19 29,-13 26,-5C33,-3 32,7 24,7Z" fill="url(#cmCloud)" stroke="#dfe8ff" stroke-width=".6"/>
      <path d="M-18,0C-14,-3 -9,-3 -6,0M4,-6C8,-9 13,-8 15,-4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
  const star=(x,y,s,d)=>`<path class="cm-star" style="animation-delay:${d}s" transform="translate(${x},${y}) scale(${s})" d="M0,-4L1,-1L4,0L1,1L0,4L-1,1L-4,0L-1,-1Z" fill="#fff"/>`;
  return _cosSvg('avf-cm',[-22,-22,144,144],`
    <defs><radialGradient id="cmCloud" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#d9e4ff"/><stop offset="1" stop-color="#8fa6e8"/></radialGradient>
      <radialGradient id="cmGlow" cx="50" cy="50" r="62" gradientUnits="userSpaceOnUse"><stop offset=".78" stop-color="#bcd4ff" stop-opacity=".0"/><stop offset=".82" stop-color="#e6efff" stop-opacity=".9"/><stop offset="1" stop-color="#7aa2ff" stop-opacity="0"/></radialGradient></defs>
    <circle cx="50" cy="50" r="62" fill="url(#cmGlow)"/>
    <circle cx="50" cy="50" r="49" fill="none" stroke="#fff" stroke-width="2.4"/>
    ${star(-6,20,1,0)}${star(104,58,.8,.7)}${star(96,-4,1.1,1.3)}${star(8,-6,.7,1.9)}${star(110,92,.9,.4)}
    <path class="cm-moon" d="M58,93A12,12 0 1,0 70,79A9,9 0 1,1 58,93Z" fill="#fff8d6" stroke="#ffe9a0" stroke-width=".6"/>
    ${cloud(10,86,1.25,'a')}${cloud(92,16,1,'b')}${cloud(-4,60,.8,'c')}`);
}
function _cosBubble(){
  const star=(x,y,s,d)=>`<path class="bb-star" style="animation-delay:${d}s" transform="translate(${x},${y}) scale(${s})" d="M0,-5C.6,-1.2 1.2,-.6 5,0C1.2,.6 .6,1.2 0,5C-.6,1.2 -1.2,.6 -5,0C-1.2,-.6 -.6,-1.2 0,-5Z" fill="#ffe7a3"/>`;
  return _cosSvg('avf-bb',[-16,-16,132,132],`
    <defs><radialGradient id="bbBody" cx="50" cy="50" r="51" gradientUnits="userSpaceOnUse"><stop offset=".62" stop-color="#5ec8ff" stop-opacity="0"/><stop offset=".9" stop-color="#3aa8ff" stop-opacity=".45"/><stop offset="1" stop-color="#1f7fe0" stop-opacity=".85"/></radialGradient>
      <linearGradient id="bbWave" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff4ff" stop-opacity="0"/><stop offset=".5" stop-color="#7ff0ff" stop-opacity=".85"/><stop offset="1" stop-color="#bff4ff" stop-opacity="0"/></linearGradient></defs>
    <circle cx="50" cy="50" r="51" fill="url(#bbBody)" stroke="#aee8ff" stroke-width="1.6"/>
    <g class="bb-swirl"><path d="M8,62C24,40 44,78 62,52S88,30 96,44" stroke="url(#bbWave)" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M14,72C30,56 48,86 66,62S86,46 92,56" stroke="url(#bbWave)" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></g>
    <path d="M20,30A36,36 0 0,1 46,10" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".75"/>
    <circle cx="16" cy="40" r="2" fill="#fff" opacity=".8"/>
    ${star(-6,86,1,0)}${star(8,100,.6,.8)}${star(104,8,.8,1.4)}${star(96,-2,.5,.3)}`);
}
{const f=_avFrameInner;_avFrameInner=function(id){
  if(id==='inkburst')return _cosInkBurst();
  if(id==='venom')return _cosInkBurst().replace('</svg>','<g class="vn-sign" transform="translate(50,92) scale(1.25)"><circle r="15" fill="#050507"/>'+_venomSign()+'</g></svg>');
  if(id==='cloudmoon')return _cosCloudMoon();
  if(id==='bubble')return _cosBubble();
  if(id==='blood')return _cosBloodRealistic();
  if(id==='cutecat')return _cosCuteCat();
  if(id==='sakura')return _cosSakura();
  if(id==='bunny')return _cosBunny();
  if(id==='heartsparkle')return _cosHeartSparkle();
  if(id==='angelic')return _cosAngelic();
  return f.apply(this,arguments);
};}

// ════════ Настоящий векторный ассет крови: капли СНИЗУ без перекрытия аватара ════════
function _cosBloodRealistic(){
  return _cosSvg('avf-blood-wrap',[-10,-10,120,135],`
    <defs>
      <radialGradient id="blDrop" cx="35%" cy="25%" r="70%">
        <stop offset="0%" stop-color="#ff4a58"/>
        <stop offset="40%" stop-color="#bd0014"/>
        <stop offset="90%" stop-color="#610009"/>
        <stop offset="100%" stop-color="#2a0003"/>
      </radialGradient>
      <linearGradient id="blRimLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#80000a" stop-opacity="0"/>
        <stop offset="25%" stop-color="#bd0014" stop-opacity="0.9"/>
        <stop offset="50%" stop-color="#ff2e3b" stop-opacity="1"/>
        <stop offset="75%" stop-color="#bd0014" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#80000a" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- Тонкий ободок с каплями СТРОГО по внешнему нижнему краю круга (лицо 100% открыто) -->
    <path d="M16,74 C24,88 36,96 50,96 C64,96 76,88 84,74" fill="none" stroke="url(#blRimLine)" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M22,82 C30,92 40,97 50,97 C60,97 70,92 78,82" fill="none" stroke="#ff4a58" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
    <!-- Стекающая капля слева (чистая плавная форма капли без углов) -->
    <g class="avf-blood-drop avf-blood-drop-1" transform="translate(28, 92)">
      <path fill="url(#blDrop)" d="M0,0 C-1,2 -2.5,5 -2,8 C-1.5,12 1.5,12 2,8 C2.5,5 1,2 0,0 Z"/>
      <ellipse cx="-0.6" cy="7" rx="0.6" ry="1.4" fill="#ffffff" opacity="0.65"/>
    </g>
    <!-- Стекающая капля справа -->
    <g class="avf-blood-drop avf-blood-drop-2" transform="translate(72, 90)">
      <path fill="url(#blDrop)" d="M0,0 C-0.8,1.8 -2,4 -1.6,6.5 C-1.2,10 1.2,10 1.6,6.5 C2,4 0.8,1.8 0,0 Z"/>
      <ellipse cx="-0.5" cy="5.5" rx="0.5" ry="1.2" fill="#ffffff" opacity="0.65"/>
    </g>
    <!-- Основная капля по центру снизу с физикой каплепадения -->
    <g class="avf-blood-drop avf-blood-drop-3" transform="translate(50, 96)">
      <path fill="url(#blDrop)" d="M0,0 C-1.2,2.5 -3,6 -2.4,10 C-1.6,15 1.6,15 2.4,10 C3,6 1.2,2.5 0,0 Z"/>
      <ellipse cx="-0.8" cy="9" rx="0.8" ry="1.8" fill="#ffffff" opacity="0.7"/>
    </g>
    <!-- Небольшие брызги-бусины по внешнему ободку -->
    <circle cx="18" cy="80" r="1.6" fill="url(#blDrop)"/>
    <circle cx="14" cy="87" r="1" fill="url(#blDrop)"/>
    <circle cx="82" cy="79" r="1.4" fill="url(#blDrop)"/>
    <circle cx="86" cy="85" r="0.9" fill="url(#blDrop)"/>
  `);
}

// ════════ МИЛЫЕ РАМОЧКИ ════════
function _cosCuteCat(){
  return _cosSvg('avf-cutecat',[-20,-20,140,140],`
    <defs>
      <linearGradient id="ccEarOut" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#ffb8cc"/>
        <stop offset="100%" stop-color="#fff0f5"/>
      </linearGradient>
      <linearGradient id="ccEarIn" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#ff6b8b"/>
        <stop offset="100%" stop-color="#ff9ebb"/>
      </linearGradient>
      <radialGradient id="ccPaw" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#ffe4ed"/>
      </radialGradient>
    </defs>
    <!-- Контурное свечение вокруг аватара -->
    <circle cx="50" cy="50" r="49.5" fill="none" stroke="#ffb8cc" stroke-width="2.5" opacity="0.85"/>
    <circle cx="50" cy="50" r="51.5" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/>
    <!-- Левое ушко котика -->
    <g class="avf-cat-ear-l">
      <path d="M12,32 C8,18 16,-2 28,6 C34,14 36,24 38,32 Z" fill="url(#ccEarOut)" stroke="#ff9ebb" stroke-width="1.2"/>
      <path d="M17,28 C15,18 20,6 26,12 C30,17 31,23 32,28 Z" fill="url(#ccEarIn)"/>
      <path d="M15,18 C18,20 22,17 24,19" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
    </g>
    <!-- Правое ушко котика -->
    <g class="avf-cat-ear-r">
      <path d="M88,32 C92,18 84,-2 72,6 C66,14 64,24 62,32 Z" fill="url(#ccEarOut)" stroke="#ff9ebb" stroke-width="1.2"/>
      <path d="M83,28 C85,18 80,6 74,12 C70,17 69,23 68,28 Z" fill="url(#ccEarIn)"/>
      <path d="M85,18 C82,20 78,17 76,19" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
    </g>
    <!-- Лапки снизу держат аватарку -->
    <g class="avf-cat-paw" transform="translate(18, 86)">
      <ellipse cx="6" cy="6" rx="8" ry="6.5" fill="url(#ccPaw)" stroke="#ffb8cc" stroke-width="0.8"/>
      <ellipse cx="6" cy="6.5" rx="4" ry="3" fill="#ff85a2"/>
      <circle cx="2" cy="1.5" r="1.6" fill="#ff85a2"/>
      <circle cx="6" cy="0" r="1.6" fill="#ff85a2"/>
      <circle cx="10" cy="1.5" r="1.6" fill="#ff85a2"/>
    </g>
    <g class="avf-cat-paw" transform="translate(68, 86)">
      <ellipse cx="6" cy="6" rx="8" ry="6.5" fill="url(#ccPaw)" stroke="#ffb8cc" stroke-width="0.8"/>
      <ellipse cx="6" cy="6.5" rx="4" ry="3" fill="#ff85a2"/>
      <circle cx="2" cy="1.5" r="1.6" fill="#ff85a2"/>
      <circle cx="6" cy="0" r="1.6" fill="#ff85a2"/>
      <circle cx="10" cy="1.5" r="1.6" fill="#ff85a2"/>
    </g>
    <!-- Милые искорки-звездочки -->
    <g class="avf-sparkle" transform="translate(8, 52)"><path d="M0,-4L1,-1L4,0L1,1L0,4L-1,1L-4,0L-1,-1Z" fill="#fff"/></g>
    <g class="avf-sparkle" transform="translate(94, 46)"><path d="M0,-5L1.2,-1.2L5,0L1.2,1.2L0,5L-1.2,1.2L-5,0L-1.2,-1.2Z" fill="#ffcee0"/></g>
    <g class="avf-sparkle" transform="translate(50, -4)"><path d="M0,-4L1,-1L4,0L1,1L0,4L-1,1L-4,0L-1,-1Z" fill="#fff"/></g>
  `);
}

function _cosSakura(){
  const petal=(cx,cy,r,rot)=>`<path class="avf-sakura-petal" d="M${cx},${cy-r} C${cx+r*0.8},${cy-r*0.6} ${cx+r},${cy} ${cx},${cy+r} C${cx-r},${cy} ${cx-r*0.8},${cy-r*0.6} ${cx},${cy-r} Z" fill="url(#skPetal)" stroke="#ffb3c6" stroke-width="0.5" transform="rotate(${rot} ${cx} ${cy})"/>`;
  const flower=(cx,cy,s)=>`
    <g transform="translate(${cx},${cy}) scale(${s})">
      ${[0,72,144,216,288].map(a=>`<path d="M0,0 C-4,-8 -5,-14 0,-16 C5,-14 4,-8 0,0 Z" fill="url(#skPetal)" stroke="#ffb3c6" stroke-width="0.5" transform="rotate(${a})"/>`).join('')}
      <circle cx="0" cy="0" r="2.5" fill="#ff4d79"/>
      <circle cx="0" cy="0" r="1" fill="#fff"/>
    </g>`;
  return _cosSvg('avf-sakura',[-18,-18,136,136],`
    <defs>
      <linearGradient id="skPetal" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#ffccd7"/>
        <stop offset="60%" stop-color="#ffeef2"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49" fill="none" stroke="#ffccd7" stroke-width="2" opacity="0.7"/>
    ${flower(14, 22, 0.95)}
    ${flower(84, 18, 1.1)}
    ${flower(92, 42, 0.75)}
    ${flower(20, 84, 0.85)}
    <g class="avf-sakura-fall1">${petal(76, 70, 5, 25)}</g>
    <g class="avf-sakura-fall2">${petal(34, 14, 4.5, -40)}</g>
    <circle cx="48" cy="2" r="1.5" fill="#fff" opacity="0.8"/>
    <circle cx="88" cy="80" r="1.2" fill="#fff" opacity="0.8"/>
  `);
}

function _cosBunny(){
  return _cosSvg('avf-bunny',[-20,-28,140,156],`
    <defs>
      <linearGradient id="bnEarOut" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#f5e6ff"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
      <linearGradient id="bnEarIn" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#ff8fab"/>
        <stop offset="100%" stop-color="#ffc2d1"/>
      </linearGradient>
      <linearGradient id="bnBow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff758f"/>
        <stop offset="100%" stop-color="#c9184a"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49" fill="none" stroke="#e0b1cb" stroke-width="2.5" opacity="0.75"/>
    <g class="avf-bunny-ear-l">
      <path d="M22,34 C16,14 14,-14 26,-22 C36,-14 34,14 34,34 Z" fill="url(#bnEarOut)" stroke="#d8bbff" stroke-width="1.2"/>
      <path d="M24,30 C20,14 19,-8 26,-15 C32,-8 30,14 30,30 Z" fill="url(#bnEarIn)"/>
    </g>
    <g class="avf-bunny-ear-r">
      <path d="M78,34 C76,14 74,-8 82,-16 C90,-12 86,2 88,14 C90,24 88,34 86,34 Z" fill="url(#bnEarOut)" stroke="#d8bbff" stroke-width="1.2"/>
      <path d="M80,30 C78,14 77,-3 82,-9 C86,-5 83,6 84,14 C85,22 84,30 83,30 Z" fill="url(#bnEarIn)"/>
    </g>
    <g class="avf-bow" transform="translate(50, 94)">
      <path d="M0,-2 C-8,-10 -18,-8 -16,0 C-14,8 -6,6 0,0 Z" fill="url(#bnBow)" stroke="#a4133c" stroke-width="0.8"/>
      <path d="M0,-2 C8,-10 18,-8 16,0 C14,8 6,6 0,0 Z" fill="url(#bnBow)" stroke="#a4133c" stroke-width="0.8"/>
      <path d="M-2,2 C-6,8 -10,14 -12,18 C-8,17 -4,15 -1,10 Z" fill="url(#bnBow)"/>
      <path d="M2,2 C6,8 10,14 12,18 C8,17 4,15 1,10 Z" fill="url(#bnBow)"/>
      <path d="M0,2 C-3,-2 -6,-2 -4,-5 C-2,-7 0,-4 0,-4 C0,-4 2,-7 4,-5 C6,-2 3,-2 0,2 Z" fill="#fff" stroke="#ff758f" stroke-width="0.6"/>
    </g>
    <g class="avf-sparkle" transform="translate(10, 60)"><path d="M0,-3L0.8,-0.8L3,0L0.8,0.8L0,3L-0.8,0.8L-3,0L-0.8,-0.8Z" fill="#ffc2d1"/></g>
    <g class="avf-sparkle" transform="translate(90, 64)"><path d="M0,-3L0.8,-0.8L3,0L0.8,0.8L0,3L-0.8,0.8L-3,0L-0.8,-0.8Z" fill="#fff"/></g>
  `);
}

function _cosHeartSparkle(){
  const heart=(cx,cy,s,rot,cls)=>`
    <g class="${cls||''}" transform="translate(${cx},${cy}) scale(${s}) rotate(${rot})">
      <path d="M0,6 C-7,0 -12,-4 -10,-10 C-8,-14 -2,-13 0,-8 C2,-13 8,-14 10,-10 C12,-4 7,0 0,6 Z" fill="url(#hsHeart)" stroke="#ff70a6" stroke-width="0.8"/>
      <ellipse cx="-4" cy="-8" rx="2" ry="1.2" fill="#fff" opacity="0.65" transform="rotate(-30 -4 -8)"/>
    </g>`;
  return _cosSvg('avf-heartsparkle',[-18,-18,136,136],`
    <defs>
      <linearGradient id="hsHeart" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff70a6"/>
        <stop offset="100%" stop-color="#ff007f"/>
      </linearGradient>
      <linearGradient id="hsRing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff99c8"/>
        <stop offset="50%" stop-color="#fcf6bd"/>
        <stop offset="100%" stop-color="#d0f4de"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49" fill="none" stroke="url(#hsRing)" stroke-width="2.6" opacity="0.85"/>
    <circle cx="50" cy="50" r="51.5" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/>
    ${heart(86, 16, 0.95, 18, 'avf-heart-float1')}
    ${heart(14, 28, 0.75, -22, 'avf-heart-float2')}
    ${heart(88, 76, 0.65, 12, 'avf-heart-float3')}
    ${heart(18, 82, 0.8, -14, 'avf-heart-float1')}
    <g class="avf-sparkle" transform="translate(50, -4)"><path d="M0,-5L1.2,-1.2L5,0L1.2,1.2L0,5L-1.2,1.2L-5,0L-1.2,-1.2Z" fill="#fff"/></g>
    <g class="avf-sparkle" transform="translate(96, 46)"><path d="M0,-4L1,-1L4,0L1,1L0,4L-1,1L-4,0L-1,-1Z" fill="#fcf6bd"/></g>
    <g class="avf-sparkle" transform="translate(6, 56)"><path d="M0,-4L1,-1L4,0L1,1L0,4L-1,1L-4,0L-1,-1Z" fill="#ff99c8"/></g>
    <g class="avf-sparkle" transform="translate(52, 102)"><path d="M0,-3L0.8,-0.8L3,0L0.8,0.8L0,3L-0.8,0.8L-3,0L-0.8,-0.8Z" fill="#fff"/></g>
  `);
}

function _cosAngelic(){
  const wing=(cls,flip)=>`
    <g class="${cls}" transform="scale(${flip?-1:1}, 1)">
      <path d="M-48,46 C-54,26 -70,6 -92,8 C-86,22 -82,34 -72,42 C-80,44 -86,52 -80,62 C-76,58 -70,54 -64,52 C-70,58 -72,68 -64,74 C-60,70 -56,64 -52,58 Z" fill="url(#agWing)" stroke="#dbe7ff" stroke-width="1"/>
      <path d="M-60,30 C-70,18 -82,14 -88,12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
    </g>`;
  return _cosSvg('avf-angelic',[-50,-24,200,148],`
    <defs>
      <linearGradient id="agWing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="#f0f5ff"/>
        <stop offset="100%" stop-color="#cddcf5"/>
      </linearGradient>
      <linearGradient id="agHalo" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffe066"/>
        <stop offset="50%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#ffd13b"/>
      </linearGradient>
    </defs>
    <g class="avf-halo" transform="translate(50, -4)">
      <ellipse cx="0" cy="0" rx="26" ry="6.5" fill="none" stroke="url(#agHalo)" stroke-width="3" opacity="0.95"/>
      <ellipse cx="0" cy="0" rx="26" ry="6.5" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.75"/>
    </g>
    <g transform="translate(50, 0)">
      ${wing('avf-angel-wing-l', false)}
      ${wing('avf-angel-wing-r', true)}
    </g>
    <circle cx="50" cy="50" r="49" fill="none" stroke="#e3edff" stroke-width="2.2" opacity="0.8"/>
    <g class="avf-sparkle" transform="translate(30, 0)"><path d="M0,-3L0.8,-0.8L3,0L0.8,0.8L0,3L-0.8,0.8L-3,0L-0.8,-0.8Z" fill="#fff"/></g>
    <g class="avf-sparkle" transform="translate(70, 0)"><path d="M0,-3L0.8,-0.8L3,0L0.8,0.8L0,3L-0.8,0.8L-3,0L-0.8,-0.8Z" fill="#ffe066"/></g>
  `);
}

// эмблема: белый паук — толстое тело-капля и 8 загнутых лап-когтей
function _venomSign(){
  const leg=(sx,d)=>`<path fill="#fff" d="${d}" transform="scale(${sx},1)"/>`;
  const L=['M3,-6C9,-12 16,-16 22,-26C19,-17 14,-9 5,-3Z','M4,-2C12,-6 20,-6 27,-12C23,-5 16,-1 5,1Z',
    'M4,2C12,3 19,8 25,14C18,11 12,8 4,5Z','M3,5C8,10 11,17 13,26C8,19 5,13 1,8Z'];
  return '<path fill="#fff" d="M0,-13C5,-13 6,-6 5,-1C4,4 5,9 0,16C-5,9 -4,4 -5,-1C-6,-6 -5,-13 0,-13Z"/>'
    +L.map(d=>leg(1,d)+leg(-1,d)).join('');
}
// Эффект профиля «Веном» убран по решению владельца; у кого был выбран — просто не показывается.

// ── Симбиот: фон строки в списке чатов ──
NAME_PLATES.push({id:'symbiote',name:'Веном',prem:true});
{const f=_npInner;_npInner=function(id){
  if(id!=='symbiote')return f.apply(this,arguments);
  const R=_cosRnd(31);let d='',g='';
  for(let i=0;i<38;i++){
    const a=90+R()*180,len=6+R()*R()*44,w=2+R()*5,cx=172,cy=50;
    const t=a*Math.PI/180,b1=[cx+18*Math.cos(t-w/24),cy+18*Math.sin(t-w/24)],b2=[cx+18*Math.cos(t+w/24),cy+18*Math.sin(t+w/24)],tp=[cx+(18+len)*Math.cos(t),cy+(18+len)*Math.sin(t)];
    d+=`M${_cosF(b1[0])},${_cosF(b1[1])}L${_cosF(tp[0])},${_cosF(tp[1])}L${_cosF(b2[0])},${_cosF(b2[1])}Z`;
    if(R()>.7)g+=`M${_cosF(cx+20*Math.cos(t))},${_cosF(cy+20*Math.sin(t))}L${_cosF(cx+(18+len*.7)*Math.cos(t))},${_cosF(cy+(18+len*.7)*Math.sin(t))}`;
  }
  return `<svg class="np-sym" viewBox="0 0 200 100" preserveAspectRatio="xMaxYMid slice">
    <circle cx="172" cy="50" r="20" fill="#050507"/><path d="${d}" fill="#050507"/>
    <path d="${g}" stroke="#fff" stroke-width=".8" opacity=".8" fill="none"/>
    
    <g transform="translate(172,50) scale(.95)" class="np-sym-sign">${_venomSign()}</g><path class="np-sym-drip" d="M166,70Q167,80 166,88" stroke="#050507" stroke-width="4" stroke-linecap="round"/></svg>`;
};}
