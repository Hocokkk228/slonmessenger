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
// ── Веном: эффект профиля (иллюстрация слоями) ──
// Голова в профиль из правого края: череп с синим отливом и комиксными бликами, ухмылка до затылка,
// зубы-иглы цвета слоновой кости, толстый S-образный язык, слюна; затем голова бьётся на осколки.
function _cosSymbiote(){
  const R=_cosRnd(13);
  const bz=(p0,p1,p2,p3,t)=>{const u=1-t;return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]];};
  // зуб-игла: основание на губе, кончик — вдоль dir, лёгкий изгиб назад
  const needle=(x,y,len,w,dir,bend)=>`M${_cosF(x-w)},${_cosF(y)}C${_cosF(x-w*.6)},${_cosF(y+dir*len*.45)} ${_cosF(x+bend*.6)},${_cosF(y+dir*len*.85)} ${_cosF(x+bend)},${_cosF(y+dir*len)}C${_cosF(x+w*.3+bend*.4)},${_cosF(y+dir*len*.6)} ${_cosF(x+w*.8)},${_cosF(y+dir*len*.3)} ${_cosF(x+w)},${_cosF(y)}Z`;
  const UL=[[118,112],[160,122],[214,128],[262,128]], LL=[[126,150],[170,168],[222,160],[262,138]];
  let upT='',loT='',upG='',loG='';
  for(let i=0;i<14;i++){const t=.03+i*(.92/13),[x,y]=bz(...UL,t),k=t;const len=(i%3===1?34:i%3===2?24:28)*(1-k*.62)+R()*4;upT+=needle(x,y-1,len,3.6-k*1.6,1,4+k*6);}
  for(let i=0;i<12;i++){const t=.05+i*(.88/11),[x,y]=bz(...LL,t),k=t;const len=(i%2?20:27)*(1-k*.6)+R()*4;loT+=needle(x,y+1,len,3.2-k*1.3,-1,3+k*5);}
  upG=`M118,112C160,122 214,128 262,128L262,132C214,133 160,127 118,117Z`;
  loG=`M126,150C170,168 222,160 262,138L262,143C222,165 170,173 126,155Z`;
  // прожилки жижи на черепе
  let veins='';for(let i=0;i<7;i++){const x=190+R()*100,y=10+R()*60;veins+=`M${_cosF(x)},${_cosF(y)}c${_cosF(-8-R()*14)},${_cosF(4+R()*8)} ${_cosF(-14-R()*18)},${_cosF(12+R()*10)} ${_cosF(-26-R()*20)},${_cosF(14+R()*16)}`;}
  let dots='';for(let i=0;i<170;i++){const x=120+R()*180,y=0+R()*200,r=.5+R()*1.05;dots+=`M${_cosF(x-r)},${_cosF(y)}a${r},${r} 0 1,0 ${_cosF(2*r)},0a${r},${r} 0 1,0 ${_cosF(-2*r)},0Z`;}
  // осколки для «разбитого стекла»
  let shards='';for(let i=0;i<28;i++){const x=120+R()*175,y=6+R()*190,sz=6+R()*17,pts=[];for(let k=0;k<3+Math.floor(R()*2);k++){const a=k*2.1+R();pts.push(_cosF(x+Math.cos(a)*sz*(.5+R()*.6))+','+_cosF(y+Math.sin(a)*sz*(.5+R()*.6)));}
    shards+=`<path class="sym-shard" style="--dx:${-(90+R()*220).toFixed(0)}px;--dy:${(-60+R()*50).toFixed(0)}px;--r:${(-200+R()*400).toFixed(0)}deg" d="M${pts.join('L')}Z" fill="${R()>.82?'#e6ecff':R()>.5?'#1b2233':'#050507'}" stroke="#000" stroke-width="1"/>`;}
  return `<svg class="sym-svg" viewBox="0 0 300 240" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
    <defs>
      <radialGradient id="vnSkin" cx="210" cy="40" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3b4a66"/><stop offset=".25" stop-color="#161c2a"/><stop offset=".6" stop-color="#07090e"/><stop offset="1" stop-color="#010102"/></radialGradient>
      <radialGradient id="vnJaw" cx="200" cy="200" r="120" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1a2233"/><stop offset=".6" stop-color="#06080c"/><stop offset="1" stop-color="#010102"/></radialGradient>
      <linearGradient id="vnTooth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe9"/><stop offset=".55" stop-color="#eed9a4"/><stop offset="1" stop-color="#b8904c"/></linearGradient>
      <linearGradient id="vnToothLo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffbe9"/><stop offset=".55" stop-color="#eed9a4"/><stop offset="1" stop-color="#b8904c"/></linearGradient>
      <radialGradient id="vnMouth" cx="190" cy="140" r="90" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6e0a1f"/><stop offset=".5" stop-color="#2c0410"/><stop offset="1" stop-color="#0a0105"/></radialGradient>
      <linearGradient id="vnTongue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a97"/><stop offset=".45" stop-color="#e2294f"/><stop offset="1" stop-color="#7a0820"/></linearGradient>
      <linearGradient id="vnEye" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef3fb"/><stop offset="1" stop-color="#c9d4e6"/></linearGradient>
    </defs>
    <g class="sym-shards">${shards}</g>
    <g class="sym"><g class="sym-head">
      <!-- шея: жижа уходит вниз за край -->
      <path d="M300,168V240H232C240,222 256,198 300,168Z" fill="url(#vnJaw)" stroke="#000" stroke-width="3"/>
      <!-- пасть изнутри -->
      <path class="sym-throat" d="M118,112C160,122 214,128 262,128L262,138C222,160 170,168 126,150C122,138 118,124 118,112Z" fill="url(#vnMouth)"/>
      <!-- нижняя челюсть: дёсны и зубы -->
      <g class="sym-jaw">
        <path d="M126,150C170,168 222,160 262,138L300,132V176C262,196 200,204 160,194C140,188 128,172 126,150Z" fill="url(#vnJaw)" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
        <path d="M156,192C196,200 244,188 292,162" stroke="#7d94c6" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="${loG}" fill="#8e1830"/>
        <path d="${loT}" fill="url(#vnToothLo)" stroke="#3a2408" stroke-width=".8"/>
      </g>
      <!-- язык: толстый, S-образный -->
      <g class="sym-tongue">
        <path d="M214,140C176,146 150,150 126,164C104,177 94,198 106,214C116,227 138,224 142,208C145,196 134,188 126,194C128,184 150,170 176,162C194,156 206,152 216,148Z" fill="url(#vnTongue)" stroke="#12000a" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M196,148C172,152 150,158 132,170C116,181 106,196 112,208" stroke="#ffc2d1" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M188,152C170,156 156,162 142,172M168,158C156,163 146,170 138,178" stroke="#8a0c26" stroke-width="1.2" fill="none" opacity=".7"/>
      </g>
      <!-- слюна -->
      <path class="sym-drool" d="M150,122C152,138 148,152 151,164M176,126C174,140 178,150 175,160M204,128C206,140 202,148 205,156M134,118C132,132 137,146 134,156" stroke="#e6f6ff" stroke-width="1.4" fill="none" opacity=".6"/>
      <!-- череп и верхняя челюсть -->
      <path d="M300,8C262,-6 206,0 172,22C146,38 128,62 122,84C119,96 116,104 118,112C160,122 214,128 262,128C276,122 290,108 300,96Z" fill="url(#vnSkin)" stroke="#000" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="${veins}" stroke="#26324d" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="${upG}" fill="#8e1830"/>
      <path d="${upT}" fill="url(#vnTooth)" stroke="#3a2408" stroke-width=".8"/>
      <!-- глаза -->
      <path class="sym-eye" d="M176,56C196,34 240,24 278,32C272,52 248,68 218,72C198,74 184,68 176,56Z" fill="url(#vnEye)" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="M190,54C210,40 240,34 262,36" stroke="#fff" stroke-width="2" fill="none" opacity=".9"/>
      <path class="sym-eye" d="M138,86C144,72 156,62 170,60C166,72 156,82 144,88Z" fill="url(#vnEye)" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
      <!-- комиксные блики -->
      <path d="M204,8C232,0 266,2 294,12C270,8 240,8 214,14Z" fill="#dfe8ff" opacity=".85"/>
      <path d="M150,34C160,24 172,18 184,14C172,22 162,30 156,40Z" fill="#cfdaf5" opacity=".7"/>
      <path d="M130,100C140,92 152,88 166,88C154,92 142,98 134,106Z" fill="#b7c6ea" opacity=".55"/>
      <path d="M268,110C282,102 292,92 298,82" stroke="#7d94c6" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="${dots}" fill="#9aa6c8" opacity=".12"/>
    </g></g></svg>`;
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
