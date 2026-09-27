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

// эмблема: белый паук с длинными изогнутыми лапами
function _venomSign(){return '<path fill="#fff" d="M0,-9C3,-9 4,-5 3,-1C2,2 3,5 0,10C-3,5 -2,2 -3,-1C-4,-5 -3,-9 0,-9Z"/>'
  +'<path fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" d="M2,-5C9,-10 16,-9 22,-16M-2,-5C-9,-10 -16,-9 -22,-16M3,-1C11,-3 17,0 24,-4M-3,-1C-11,-3 -17,0 -24,-4M3,2C10,4 14,10 20,12M-3,2C-10,4 -14,10 -20,12M2,5C7,10 8,16 12,22M-2,5C-7,10 -8,16 -12,22"/>';}
// ── Симбиот (Веном): эффект профиля ──
// Вылезает справа, раскрывает пасть, орёт с высунутым языком, утекает в левый верхний угол. Цикл 7 с.
function _cosSymbiote(){
  const R=_cosRnd(13);
  let dots='';for(let i=0;i<140;i++){const x=40+R()*170,y=10+R()*150,r=.5+R()*1.1;dots+=`M${_cosF(x-r)},${_cosF(y)}a${r},${r} 0 1,0 ${_cosF(2*r)},0a${r},${r} 0 1,0 ${_cosF(-2*r)},0Z`;}
  const teeth=(pts,dir)=>pts.map(([x,y,l,w])=>`M${x-w},${y}L${x},${y+dir*l}L${x+w},${y}Z`).join('');
  const up=teeth([[70,93,9,3],[80,96,12,3.4],[91,98,14,3.6],[103,99,14,3.6],[115,98,12,3.4],[126,95,9,3]],1);
  const lo=teeth([[74,104,-8,2.8],[86,108,-11,3.2],[98,110,-12,3.4],[110,109,-11,3.2],[121,106,-8,2.8]],1);
  return `<svg class="sym-svg" viewBox="0 0 300 240" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
    <defs>
      <linearGradient id="symTongue" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#b3123a"/><stop offset=".5" stop-color="#ff4d78"/><stop offset="1" stop-color="#ff8aa6"/></linearGradient>
      <radialGradient id="symGloss" cx=".35" cy=".25" r=".7"><stop offset="0" stop-color="#3a4252"/><stop offset=".5" stop-color="#101218"/><stop offset="1" stop-color="#030304"/></radialGradient>
    </defs>
    <path class="sym-trail" d="M210,92C170,64 110,34 0,0" stroke="#050507" stroke-width="22" stroke-linecap="round" fill="none"/>
    <g class="sym"><g class="sym-head">
      <path d="M300,40C262,34 236,52 222,70C204,96 214,126 300,150Z" fill="url(#symGloss)" stroke="#000" stroke-width="3"/>
      <path d="M232,58C240,50 256,44 270,44M226,122C236,134 256,140 272,140" stroke="#cfd8ff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="100" cy="104" rx="46" ry="16" fill="#3a0010" class="sym-throat"/>
      <g class="sym-tongue"><path d="M110,106C84,122 54,112 30,128C18,136 24,150 38,144C60,134 86,138 112,114Z" fill="url(#symTongue)" stroke="#000" stroke-width="2.4"/>
        <path d="M100,112C82,122 62,120 44,132" stroke="#ffd0dc" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>
      <path d="M232,76C228,40 186,22 144,30C104,38 70,58 58,88L66,96C104,86 150,86 196,98C214,102 232,98 232,76Z" fill="url(#symGloss)" stroke="#000" stroke-width="3.2"/>
      <path d="${up}" fill="#fff" stroke="#000" stroke-width="1.2"/>
      <path class="sym-eye" d="M78,66C88,42 118,28 146,32C140,52 120,70 98,72C90,72 82,70 78,66Z" fill="#fff" stroke="#000" stroke-width="3.4"/>
      <path class="sym-eye" d="M156,30C178,20 208,24 224,40C212,56 190,62 172,58C162,54 158,42 156,30Z" fill="#fff" stroke="#000" stroke-width="3.4"/>
      <path d="M150,34C170,28 196,30 214,40M80,74C96,62 118,54 140,50" stroke="#dfe6ff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/>
      <path d="${dots}" fill="#9aa6c8" opacity=".16"/>
      <g class="sym-jaw"><path d="M60,100C82,126 150,134 206,112L204,100C150,118 96,114 60,100Z" fill="url(#symGloss)" stroke="#000" stroke-width="3"/>
        <path d="${lo}" fill="#fff" stroke="#000" stroke-width="1.1"/></g>
      <path d="M298,150C288,168 294,190 280,206M262,146C258,160 262,172 254,184" stroke="#050507" stroke-width="7" stroke-linecap="round" fill="none"/>
    </g></g></svg>`;
}
PROFILE_FX.push({id:'symbiote',name:'Веном',prem:true});
{const f=_fxInner;_fxInner=function(id){if(id==='symbiote')return _cosSymbiote();return f.apply(this,arguments);};}
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
