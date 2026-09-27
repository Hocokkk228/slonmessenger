// ════════════════════════════════════════
// ── КОСМЕТИКА 2: симбиот (эффект профиля и фон строки), рамки «Чернильный взрыв»,
//    «Облака и луна», «Пузырь». Всё своё, векторами; анимация симбиота — рывками 15 к/с
//    (steps), в полукомиксном стиле: толстый контур, блики, растровые точки.
// ════════════════════════════════════════

// ── Рамки ──
AV_FRAMES.push(
  {id:'inkburst', name:'Чернильный взрыв', prem:true, kind:'fx'},
  {id:'venom',    name:'Веном',            prem:true, kind:'fx'},
  {id:'cloudmoon',name:'Облака и луна',    prem:true, kind:'fx'},
  {id:'bubble',   name:'Пузырь',           prem:false,kind:'fx'},
);
for(const f of AV_FRAMES)AV_FRAME_MAP[f.id]=f;
Object.assign(AV_FRAME_CARD_BG,{venom:'#0a0a12',inkburst:'#101018',cloudmoon:'#0c1430',bubble:'#07203a'});

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
  return f.apply(this,arguments);
};}

// эмблема: белый паук — толстое тело-капля и 8 загнутых лап-когтей
function _venomSign(){
  const leg=(sx,d)=>`<path fill="#fff" d="${d}" transform="scale(${sx},1)"/>`;
  const L=['M3,-6C9,-12 16,-16 22,-26C19,-17 14,-9 5,-3Z','M4,-2C12,-6 20,-6 27,-12C23,-5 16,-1 5,1Z',
    'M4,2C12,3 19,8 25,14C18,11 12,8 4,5Z','M3,5C8,10 11,17 13,26C8,19 5,13 1,8Z'];
  return '<path fill="#fff" d="M0,-13C5,-13 6,-6 5,-1C4,4 5,9 0,16C-5,9 -4,4 -5,-1C-6,-6 -5,-13 0,-13Z"/>'
    +L.map(d=>leg(1,d)+leg(-1,d)).join('');
}
// ── Веном: эффект профиля на художественной картинке (img/fx/venom-head.webp) + векторная шея ──
// Голова выезжает справа и «живёт» (жидкое шевеление), потом ТАЕТ: края проедаются неровными пятнами,
// голова стекает вниз, с неё срываются и падают капли жижи. Капли по верхнему краю окна — отдельно.
const VENOM_IMG='img/fx/venom-head.webp';
let _vnSeq=0;
function _cosSymbiote(){
  const R=_cosRnd(13),u='_'+(++_vnSeq);   // свои id у каждого экземпляра: иначе фильтры берутся у первого
  const X=92,Y=4,W=190,H=199;                         // картинка 170×178 → в координатах 300×240
  // падающие капли при таянии
  let drops='';for(let i=0;i<16;i++){const x=110+R()*170,y=60+R()*140,r=2+R()*5;
    drops+=`<circle class="ven-drop" cx="${_cosF(x)}" cy="${_cosF(y)}" r="${_cosF(r)}" style="--dx:${(-10-R()*40).toFixed(0)}px;--dy:${(60+R()*110).toFixed(0)}px;animation-delay:${(R()*.25).toFixed(2)}s"/>`;}
  return `<svg class="sym-svg" viewBox="0 0 300 240" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
    <defs>
      <linearGradient id="vnNeck${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b3448"/><stop offset=".4" stop-color="#0c0f16"/><stop offset="1" stop-color="#020203"/></linearGradient>
      <filter id="vnLiquid${u}" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.035" numOctaves="2" seed="3" result="n">
          <animate attributeName="seed" values="1;2;3;4;5;6;7;8" dur="0.55s" repeatCount="indefinite"/>
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <!-- таяние: вытягивание вниз + неровное проедание по шуму -->
      <filter id="vnMelt${u}" x="-10%" y="-10%" width="120%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="3" seed="9" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" result="d">
          <animate attributeName="scale" dur="5.6s" repeatCount="indefinite" keyTimes="0;0.36;0.56;1" values="0;0;46;46"/>
        </feDisplacementMap>
        <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="4" result="m"/>
        <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="ma"/>
        <feComponentTransfer in="ma" result="mask"><feFuncA type="linear" slope="7" intercept="7">
          <animate attributeName="intercept" dur="5.6s" repeatCount="indefinite" keyTimes="0;0.36;0.56;1" values="7;7;-7;-7"/>
        </feFuncA></feComponentTransfer>
        <feComposite in="d" in2="mask" operator="in"/>
      </filter>
    </defs>
    <g class="sym"><g filter="url(#vnMelt${u})"><g class="sym-head">
      <!-- шея: жижа от затылка уходит за правый край и вниз -->
      <path d="M200,142C226,160 252,150 268,128C278,116 290,112 300,112V240H206C218,214 212,184 200,142Z" fill="url(#vnNeck${u})" stroke="#000" stroke-width="2.4"/>
      <path d="M246,146C262,140 276,128 290,122M226,178C232,198 230,216 226,236" stroke="#8ea2c8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/>
      <g filter="url(#vnLiquid${u})"><image href="${VENOM_IMG}" x="${X}" y="${Y}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet"/></g>
    </g></g></g>
    <g class="ven-drops">${drops}</g>
  </svg>`;
}
PROFILE_FX.push({id:'symbiote',name:'Веном',prem:true});
function _cosGooTop(){
  const R=_cosRnd(71);let d='M0,0H400V6';let x=400;
  while(x>0){const w=6+R()*18,len=R()<.35?10+R()*34:2+R()*8;const nx=Math.max(0,x-w);
    d+=`L${_cosF(x-w*.25)},6Q${_cosF(x-w*.5)},${_cosF(6+len)} ${_cosF(x-w*.75)},6L${_cosF(nx)},${_cosF(4+R()*4)}`;x=nx;}
  d+='V0Z';
  let drops='';for(let i=0;i<7;i++){const cx=20+R()*360,cy=18+R()*30,r=1.4+R()*2;drops+=`<circle class="goo-drop" style="animation-delay:-${(R()*3).toFixed(2)}s" cx="${_cosF(cx)}" cy="${_cosF(cy)}" r="${_cosF(r)}"/>`;}
  return `<svg class="goo-top" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="#050507"/>${drops}
    <path d="M0,3H400" stroke="#8d98b8" stroke-width=".8" opacity=".5"/></svg>`;
}
{const f=_fxInner;_fxInner=function(id){if(id==='symbiote')return _cosGooTop()+_cosSymbiote();return f.apply(this,arguments);};}
{const f=_fxInnerMini;_fxInnerMini=function(id){
  if(id==='symbiote')return '<svg viewBox="0 0 40 40" style="position:absolute;inset:4px;width:auto;height:auto"><path d="M40,6C30,4 22,12 20,18C18,24 22,30 40,34Z" fill="#050507"/><path d="M22,16L30,12L28,18Z M31,11L38,11L36,16Z" fill="#fff"/><path d="M22,24C16,28 8,26 4,30" stroke="#ff4d78" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';
  return f.apply(this,arguments);};}

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
