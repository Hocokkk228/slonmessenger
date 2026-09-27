// ════════════════════════════════════════
// ── КОСМЕТИКА: рамки аватара, эффекты профиля, фоны в списке чатов ──
// Всё рисуется векторами (SVG) — своё, без чужих картинок.
// Хранится в том же поле профиля avFrame, что и раньше: "рамка|цвет|эффект|фон"
// — так новое синхронизируется между людьми и устройствами без изменений протокола.
// Старые версии приложения читают только первую часть (рамку).
// ════════════════════════════════════════

// ── avFrame = "id|color|fx|np" ──
function _avFrameParse(val){const [id,color,fx,np]=String(val||'').split('|');return {id:id||'',color:color||'',fx:fx||'',np:np||''};}
function _cosJoin(o){const s=[o.id||'',o.color||'',o.fx||'',o.np||''].join('|').replace(/\|+$/,'');return s;}
function _cosDraft(){return (typeof _spDraft==='object'&&_spDraft)?_avFrameParse(_spDraft.avFrame||''):_avFrameParse(myAvFrame||'');}
function _cosSetDraft(patch){
  if(!_spDraft)return;
  _spDraft.avFrame=_cosJoin({..._avFrameParse(_spDraft.avFrame||''),...patch});
  $('custSave')?.classList.add('show');
}

// Детерминированный «случай» — узор меха/искр одинаковый у всех
function _cosRnd(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const _cosP=(r,a,cx=50,cy=50)=>{const t=a*Math.PI/180;return [cx+r*Math.cos(t),cy+r*Math.sin(t)];};
const _cosF=n=>n.toFixed(1);

// SVG рамки поверх аватарки: box = [x,y,w,h] в координатах, где аватарка — 0..100
function _cosSvg(cls,box,body){
  const [x,y,w,h]=box;
  return `<svg class="avf-svg ${cls}" viewBox="${x} ${y} ${w} ${h}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%" aria-hidden="true">${body}</svg>`;
}

// ════════ Рамки ════════
const AV_FRAMES_NEW=[
  {id:'',         name:'Без рамки',        prem:false, kind:'none'},
  {id:'megalodon',name:'Мегалодон',        prem:true,  kind:'fx'},
  {id:'cathood',  name:'Голодный котик',   prem:true,  kind:'fx'},
  {id:'nerd',     name:'Умник',            prem:false, kind:'fx'},
  {id:'soulfire', name:'Синее пламя',      prem:true,  kind:'fx'},
  {id:'cobweb',   name:'Паутина',          prem:true,  kind:'fx'},
  {id:'blood',    name:'Кровь',            prem:true,  kind:'fx'},
];
AV_FRAMES.splice(0,AV_FRAMES.length,...AV_FRAMES_NEW);
for(const k of Object.keys(AV_FRAME_MAP))delete AV_FRAME_MAP[k];
for(const f of AV_FRAMES)AV_FRAME_MAP[f.id]=f;
AV_FRAME_MAP.shark=AV_FRAME_MAP.megalodon;              // у кого стояли «Акульи челюсти» — теперь мегалодон
Object.assign(AV_FRAME_CARD_BG,{
  megalodon:'#0e2433',cathood:'#3a2416',nerd:'#2a2440',soulfire:'#07202c',cobweb:'#1c1c22',blood:'#2a070b',
});
for(const k of ['ironman','catears','wings','shark'])delete AV_FRAME_CARD_BG[k];

// ── Мегалодон: огромная пасть вокруг аватарки ──
// Голова спереди, спинной плавник за ней, светлое брюхо с волнистой границей,
// два ряда зазубренных треугольных зубов с объёмом, тень внутри пасти, периодический «укус».
function _cosMegalodon(){
  const R=_cosRnd(7);
  const circ=(r,cx=50,cy=50)=>`M${cx-r},${cy}A${r},${r} 0 1,0 ${cx+r},${cy}A${r},${r} 0 1,0 ${cx-r},${cy}Z`;
  const head='M-30,58C-33,8 -4,-40 50,-44C104,-40 133,8 130,58C128,98 98,130 50,134C2,130 -28,98 -30,58Z';
  const belly='M-29,70Q-14,84 4,78T34,88T66,88T96,78T129,70C127,100 97,130 50,134C3,130 -27,100 -29,70Z';
  // зуб: широкий треугольник с выпуклыми краями и лёгким изгибом, кончик к центру
  const pts=(a,w,rb,rt,bend)=>{
    const b1=_cosP(rb,a-w/2),b2=_cosP(rb,a+w/2),t=_cosP(rt,a+bend),m=_cosP(rb+1.5,a);
    const c1=_cosP(rb-(rb-rt)*.45,a-w/2.4+bend*.4),c2=_cosP(rb-(rb-rt)*.45,a+w/2.4+bend*.4);
    return {b1,b2,t,m,c1,c2};
  };
  const F=p=>_cosF(p[0])+','+_cosF(p[1]);
  const row=(from,to,n,rb,len0,wk,cls,short)=>{
    let t='',s='',h='';const st=(to-from)/n;
    for(let i=0;i<n;i++){
      const a=from+st*(i+.5)+(R()-.5)*st*.12,mid=Math.abs(i-(n-1)/2)/((n-1)/2||1);
      const len=len0*(1-mid*short)*(.9+R()*.18),w=st*wk*(.92+R()*.14),bend=(R()-.5)*5;
      const P=pts(a,w,rb,rb-len,bend);
      t+=`M${F(P.b1)}Q${F(P.c1)} ${F(P.t)}Q${F(P.c2)} ${F(P.b2)}Q${F(P.m)} ${F(P.b1)}Z`;
      s+=`M${F(P.t)}Q${F(P.c2)} ${F(P.b2)}Q${F(_cosP(rb+1,a+w*.2))} ${F(_cosP(rb,a+w*.05))}Z`;       // теневая сторона
      h+=`M${F(_cosP(rb-1.5,a-w*.28))}Q${F(_cosP(rb-len*.5,a-w*.16))} ${F(_cosP(rb-len*.82,a+bend*.7))}`; // блик по ребру
    }
    return `<g class="${cls}"><path class="mg-t" d="${t}"/><path class="mg-ts" d="${s}"/><path class="mg-th" d="${h}"/></g>`;
  };
  let spots='';for(let i=0;i<110;i++){const a=R()*360,rr=58+R()*62,[x,y]=_cosP(rr,a,50,44);if(y>74)continue;const r=.25+R()*.8;spots+=`M${_cosF(x-r)},${_cosF(y)}a${r},${r} 0 1,0 ${_cosF(2*r)},0a${r},${r} 0 1,0 ${_cosF(-2*r)},0Z`;}
  let scars='';for(let i=0;i<7;i++){const x=-12+R()*124,y=-30+R()*44;scars+=`M${_cosF(x)},${_cosF(y)}l${_cosF(3+R()*7)},${_cosF((R()-.5)*4)}`;}
  const eye=(x,y,fl)=>`<g transform="translate(${x},${y})">
      <ellipse rx="6.2" ry="4.6" fill="#0b1014" stroke="#56697a" stroke-width=".8"/>
      <ellipse rx="4.6" ry="3.6" fill="url(#mgEye)"/>
      <circle cx="${fl?1.5:-1.5}" cy="-1.4" r="1.3" fill="#fff" opacity=".9"/><circle cx="${fl?-1.8:1.8}" cy="1.2" r=".5" fill="#fff" opacity=".6"/>
      <path d="M-6.5,-3.2Q0,-6.4 6.5,-3.2" stroke="#1a232b" stroke-width="1.2" fill="none"/></g>`;
  const gills=(x,dir)=>{let d='';for(let i=0;i<5;i++)d+=`M${_cosF(x+dir*i*2.6)},${60+i*5.5}q${-dir*3.5},4.6 ${-dir*.4},9.5`;return d;};
  let folds='';for(let i=0;i<22;i++){const a=i*(360/22)+(R()-.5)*6,p1=_cosP(55,a),p2=_cosP(50.5,a+3);folds+=`M${F(p1)}Q${F(_cosP(53,a+4))} ${F(p2)}`;}
  return _cosSvg('avf-mg',[-36,-82,172,222],`
    <defs>
      <linearGradient id="mgSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2631"/><stop offset=".3" stop-color="#2f4353"/><stop offset=".55" stop-color="#4c6577"/><stop offset=".8" stop-color="#6a8394"/><stop offset="1" stop-color="#8aa0af"/></linearGradient>
      <linearGradient id="mgFin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46607a"/><stop offset="1" stop-color="#1a2530"/></linearGradient>
      <linearGradient id="mgBelly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7d2d9"/><stop offset=".5" stop-color="#e9eef1"/><stop offset="1" stop-color="#b8c4cc"/></linearGradient>
      <radialGradient id="mgSheen" cx=".42" cy=".1" r=".5"><stop offset="0" stop-color="#e8f4ff" stop-opacity=".32"/><stop offset="1" stop-color="#e8f4ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="mgGum" cx="50" cy="50" r="58" gradientUnits="userSpaceOnUse"><stop offset=".76" stop-color="#d0606c"/><stop offset=".88" stop-color="#96303e"/><stop offset="1" stop-color="#4a0b14"/></radialGradient>
      <radialGradient id="mgThroat" cx="50" cy="50" r="47" gradientUnits="userSpaceOnUse"><stop offset=".62" stop-color="#1a0205" stop-opacity="0"/><stop offset=".86" stop-color="#2a0409" stop-opacity=".45"/><stop offset="1" stop-color="#1a0205" stop-opacity=".85"/></radialGradient>
      <linearGradient id="mgTooth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffef8"/><stop offset=".5" stop-color="#f3ebd2"/><stop offset="1" stop-color="#d2c294"/></linearGradient>
      <clipPath id="mgNoHole"><path d="${head}${circ(56)}" clip-rule="evenodd"/></clipPath>
      <radialGradient id="mgEye" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#2a3640"/><stop offset=".6" stop-color="#070a0d"/><stop offset="1" stop-color="#000"/></radialGradient>
    </defs>
    <path d="M66,-38C76,-62 92,-76 114,-80C108,-62 106,-44 111,-26Z" fill="url(#mgFin)" stroke="#0c131a" stroke-width="1"/>
    <path d="M70,-40C80,-58 94,-70 108,-74" stroke="#7d97ac" stroke-width="1" fill="none" opacity=".5"/>
    <path d="${head}${circ(56)}" fill="url(#mgSkin)" fill-rule="evenodd" stroke="#0b1116" stroke-width="1.3"/>
    <path d="${belly}" fill="url(#mgBelly)" clip-path="url(#mgNoHole)"/>
    <path d="M-29,70Q-14,84 4,78T34,88T66,88T96,78T129,70" stroke="#5f7686" stroke-width="1" fill="none" opacity=".55"/>
    <path d="${head}${circ(56)}" fill="url(#mgSheen)" fill-rule="evenodd"/>
    <path d="${spots}" fill="#0a1217" opacity=".32"/>
    <path d="${scars}" stroke="#d6e2e9" stroke-width=".7" stroke-linecap="round" opacity=".5" fill="none"/>
    <path d="${gills(-21,1)}${gills(121,-1)}" stroke="#152029" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M36,-28q4,-3 8,0M56,-28q4,-3 8,0" stroke="#070b0e" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${eye(-6,6,false)}${eye(106,6,true)}
    <path d="${circ(56)}${circ(46)}" fill="url(#mgGum)" fill-rule="evenodd"/>
    <path d="${folds}" stroke="#6f1a26" stroke-width=".7" fill="none" opacity=".7"/>
    <circle cx="50" cy="50" r="46.3" fill="url(#mgThroat)"/>
    <g class="mg-up">${row(186,354,10,52,20,.95,'mg-back',.5)}${row(182,358,11,57,27,1.02,'mg-front',.55)}</g>
    <g class="mg-lo">${row(12,168,9,52,17,.95,'mg-back',.5)}${row(8,172,10,57,23,1.02,'mg-front',.55)}</g>`);
}

// ── Голодный котик: рыжая голова, аватарка — в раскрытой пасти ──
function _cosCatHood(){
  const R=_cosRnd(21);
  const head='M50,-44C106,-44 130,-6 128,44C126,94 100,120 50,122C0,120 -26,94 -28,44C-30,-6 -6,-44 50,-44Z';
  const hole='M3,50A47,47 0 1,0 97,50A47,47 0 1,0 3,50Z';
  // шерсть: короткие штрихи по контуру и по лбу
  let fur='',furL='';
  for(let i=0;i<120;i++){
    const a=R()*360,rr=.86+R()*.14,[x,y]=[50+78*rr*Math.cos(a*Math.PI/180),39+82*rr*Math.sin(a*Math.PI/180)];
    const l=3+R()*4,dx=Math.cos(a*Math.PI/180)*l,dy=Math.sin(a*Math.PI/180)*l;
    const st=`M${_cosF(x)},${_cosF(y)}q${_cosF(dx*.5+(R()-.5)*2)},${_cosF(dy*.5+(R()-.5)*2)} ${_cosF(dx)},${_cosF(dy)}`;
    if(R()>.5)fur+=st;else furL+=st;
  }
  let furIn='';for(let i=0;i<60;i++){const x=-10+R()*120,y=-40+R()*26;furIn+=`M${_cosF(x)},${_cosF(y)}l${_cosF((R()-.5)*3)},${_cosF(-2-R()*3)}`;}
  let chin='';for(let i=0;i<46;i++){const a=10+R()*160,[x,y]=_cosP(49+R()*14,a);chin+=`M${_cosF(x)},${_cosF(y)}l${_cosF((R()-.5)*2)},${_cosF(2+R()*3)}`;}
  const stripes='M50,-42q-3,10 0,18M38,-40q-2,9 3,16M62,-40q2,9 -3,16M27,-35q0,8 6,13M73,-35q0,8 -6,13M-20,16q10,2 16,-2M-24,30q11,1 17,-3M120,16q-10,2 -16,-2M124,30q-11,1 -17,-3';
  const eye=(cx,flip)=>`<g class="ch-eye" transform="translate(${cx},-11)">
      <path d="M-15,0C-11,-10 11,-10 15,0C11,10 -11,10 -15,0Z" fill="#2a1608"/>
      <circle r="10.2" fill="url(#chIris)"/>
      <ellipse rx="3.2" ry="8.6" fill="#050302"/>
      <circle cx="${flip?3.4:-3.4}" cy="-4" r="2.6" fill="#fff"/><circle cx="${flip?-3:3}" cy="3.6" r="1.1" fill="#fff" opacity=".8"/>
      <path class="ch-lid" d="M-16,-11H16V1C11,-8 -11,-8 -16,1Z" fill="url(#chFur)"/>
    </g>`;
  const whisk='M24,2q-22,-4 -40,2M24,6q-22,2 -38,10M76,2q22,-4 40,2M76,6q22,2 38,10';
  return _cosSvg('avf-ch',[-36,-70,172,196],`
    <defs>
      <radialGradient id="chFur" cx="50" cy="0" r="88" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffc27a"/><stop offset=".5" stop-color="#ec8a3a"/><stop offset=".85" stop-color="#c2601f"/><stop offset="1" stop-color="#8e3f12"/></radialGradient>
      <radialGradient id="chWhite" cx="50" cy="70" r="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset=".8" stop-color="#f1e7dc"/><stop offset="1" stop-color="#d9c7b5"/></radialGradient>
      <radialGradient id="chIris" cx="-2" cy="-3" r="12" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d4f56a"/><stop offset=".55" stop-color="#7cbf2e"/><stop offset="1" stop-color="#2f6415"/></radialGradient>
      <linearGradient id="chEarIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e98c8f"/><stop offset="1" stop-color="#f7c0bd"/></linearGradient>
    </defs>
    <g class="ch-ear l"><path d="M-22,-8C-24,-38 -16,-60 -8,-64C6,-54 20,-42 28,-28Z" fill="url(#chFur)" stroke="#7a3510" stroke-width="1"/><path d="M-14,-16C-15,-36 -10,-50 -6,-53C2,-45 10,-37 15,-29Z" fill="url(#chEarIn)"/></g>
    <g class="ch-ear r"><path d="M122,-8C124,-38 116,-60 108,-64C94,-54 80,-42 72,-28Z" fill="url(#chFur)" stroke="#7a3510" stroke-width="1"/><path d="M114,-16C115,-36 110,-50 106,-53C98,-45 90,-37 85,-29Z" fill="url(#chEarIn)"/></g>
    <path d="${head}${hole}" fill="url(#chFur)" fill-rule="evenodd" stroke="#7a3510" stroke-width="1.1"/>
    <path d="${stripes}" stroke="#a24a14" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".75"/>
    <path d="${fur}" stroke="#9b4513" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".75"/>
    <path d="${furL}" stroke="#ffd29a" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".8"/>
    <path d="${furIn}" stroke="#ffcf94" stroke-width=".7" stroke-linecap="round" fill="none" opacity=".55"/>
    <path d="M-6,48C-8,86 14,114 50,116C86,114 108,86 106,48C100,56 97,60 97,50A47,47 0 1,1 3,50C3,60 0,56 -6,48Z" fill="url(#chWhite)"/>
    <path d="${chin}" stroke="#cdb9a5" stroke-width=".7" stroke-linecap="round" fill="none" opacity=".8"/>
    <ellipse cx="37" cy="2" rx="14" ry="8" fill="url(#chWhite)"/><ellipse cx="63" cy="2" rx="14" ry="8" fill="url(#chWhite)"/>
    ${eye(17,false)}${eye(83,true)}
    <path d="M44.5,-4Q50,-7 55.5,-4Q54,1.5 50,3.5Q46,1.5 44.5,-4Z" fill="#e5818a" stroke="#a24d56" stroke-width=".8"/>
    <path d="M50,3.5v2" stroke="#8a3a2a" stroke-width="1"/>
    <path class="ch-whisk" d="${whisk}" stroke="#fff" stroke-width=".8" stroke-linecap="round" fill="none" opacity=".85"/>
    <circle cx="50" cy="50" r="47.6" fill="none" stroke="#6e1418" stroke-width="3"/>
    <path d="M36,4l2.4,9 2.4,-9ZM59.2,4l2.4,9 2.4,-9Z" fill="#fffaf0" stroke="#d8cbb4" stroke-width=".5"/>`);
}

// ── Умник: очки, которые поправляют пальцем ──
function _cosNerd(){
  const lens=(x)=>`<rect x="${x}" y="33" width="38" height="25" rx="10" class="nd-lens"/>
    <path d="M${x+6},38q7,-3 12,0" class="nd-glint"/>`;
  return _cosSvg('avf-nd',[-12,-12,124,126],`
    <defs>
      <linearGradient id="ndFrame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbbff5"/><stop offset=".5" stop-color="#a494e6"/><stop offset="1" stop-color="#7563c4"/></linearGradient>
      <linearGradient id="ndSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd764"/><stop offset=".6" stop-color="#ffc83a"/><stop offset="1" stop-color="#e5a318"/></linearGradient>
      <clipPath id="ndClip"><rect x="-12" y="-12" width="124" height="128"/></clipPath>
    </defs>
    <g class="nd-glasses">
      <path d="M-4,43H6M94,43h10" stroke="#5a4b99" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M44,41q6,-5 12,0" stroke="url(#ndFrame)" stroke-width="4.2" fill="none" stroke-linecap="round"/>
      ${lens(6)}${lens(56)}
    </g>
    <g clip-path="url(#ndClip)"><g class="nd-hand">
      <path d="M45,48C45,44 55,44 55,48V84H45Z" fill="url(#ndSkin)" stroke="#b07409" stroke-width="1.3"/>
      <path d="M46.6,49.5c0,-2.4 6.8,-2.4 6.8,0v4.4h-6.8z" fill="#fff3c9" opacity=".75"/>
      <path d="M31,82C31,74 38,72 45,74H59C66,72 72,76 70,84L68,104C67,110 62,114 55,114H43C35,114 30,108 30,100Z" fill="url(#ndSkin)" stroke="#b07409" stroke-width="1.3"/>
      <path d="M36,90h28M37,98h26" stroke="#c98d12" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
      <path d="M31,86C24,88 22,97 27,101C31,104 36,101 37,96" fill="url(#ndSkin)" stroke="#b07409" stroke-width="1.3"/>
    </g></g>`);
}

// ── Синее пламя с черепами ──
// Огонь «живой»: фрактальный шум искажает языки пламени (как настоящий огонь),
// задний слой — за аватаркой (лицо не закрывает), передний — невысокие языки у низа и черепа.
function _cosSoulFire(){
  const R=_cosRnd(33);
  const tongue=(bx,by,len,w,lean)=>{
    const tx=bx+lean,ty=by-len;
    return `M${_cosF(bx-w)},${_cosF(by)}C${_cosF(bx-w*1.1)},${_cosF(by-len*.45)} ${_cosF(tx-w*.35)},${_cosF(ty+len*.35)} ${_cosF(tx)},${_cosF(ty)}C${_cosF(tx+w*.45)},${_cosF(ty+len*.4)} ${_cosF(bx+w*1.15)},${_cosF(by-len*.4)} ${_cosF(bx+w)},${_cosF(by)}Z`;
  };
  let back='',backHot='',front='';
  // языки по контуру аватарки: от низа вверх по бокам, у низа — выше
  for(let i=0;i<30;i++){
    const a=-25+i*(230/29)+(R()-.5)*5;           // -25..205 — бока и низ
    const [bx,by]=_cosP(44+R()*4,a);
    const side=Math.abs(Math.cos(a*Math.PI/180));   // 1 — сбоку, 0 — снизу
    const len=26+R()*22+side*14,w=6+R()*4,lean=(bx<50?-1:1)*(4+side*10)+(R()-.5)*6;
    const d=tongue(bx,by+4,len,w,lean);
    if(i%3===1)backHot+=d;else back+=d;
  }
  for(let i=0;i<14;i++){const a=25+i*(130/13)+(R()-.5)*6,[bx,by]=_cosP(49,a);front+=tongue(bx,by+3,9+R()*9,3.4+R()*2,(bx<50?-2:2)+(R()-.5)*4);}
  const skull=(x,y,s)=>`<g transform="translate(${x},${y}) scale(${s})">
      <path d="M-9,2C-10,-8 -5,-13 0,-13S10,-8 9,2C9,5 7,6 6,7V10H-6V7C-7,6 -9,5 -9,2Z" fill="url(#sfBone)" stroke="#34495c" stroke-width=".8"/>
      <path d="M-7,-6C-5,-10 -1,-11.5 2,-11" stroke="#fff" stroke-width=".8" fill="none" opacity=".55" stroke-linecap="round"/>
      <ellipse cx="-3.6" cy="-1" rx="2.8" ry="3.1" fill="#07121b"/><ellipse cx="3.6" cy="-1" rx="2.8" ry="3.1" fill="#07121b"/>
      <circle class="sf-eye" cx="-3.6" cy="-.6" r="1.2"/><circle class="sf-eye" cx="3.6" cy="-.6" r="1.2"/>
      <path d="M0,2.5l-1.3,2.4h2.6Z" fill="#07121b"/><path d="M-4,8.4V10M-1.3,8.4V10M1.3,8.4V10M4,8.4V10" stroke="#34495c" stroke-width=".7"/>
    </g>`;
  const defs=`<defs>
      <linearGradient id="sfFire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f4feff"/><stop offset=".22" stop-color="#9ff1ff"/><stop offset=".55" stop-color="#34b4ec" stop-opacity=".9"/><stop offset=".85" stop-color="#1768b8" stop-opacity=".35"/><stop offset="1" stop-color="#0c3f8a" stop-opacity="0"/></linearGradient>
      <linearGradient id="sfHot" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#c8f8ff"/><stop offset="1" stop-color="#58d3ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="sfBone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f0f8"/><stop offset=".6" stop-color="#a5b9cb"/><stop offset="1" stop-color="#667d93"/></linearGradient>
      <filter id="sfWarp" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.045 0.11" numOctaves="2" seed="2" result="n">
          <animate attributeName="seed" values="1;2;3;4;5;6;7;8;9;10" dur="1.1s" repeatCount="indefinite"/>
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
        <feGaussianBlur stdDeviation=".7"/>
      </filter>
    </defs>`;
  const box=[-34,-40,168,176];
  // два слоя: позади аватарки и перед ней (см. .avf-soulfire в style.css)
  return _cosSvg('avf-sf avf-sf-back',box,`${defs}
      <g filter="url(#sfWarp)"><path class="sf-fl" d="${back}" fill="url(#sfFire)"/><path class="sf-fl sf-hot" d="${backHot}" fill="url(#sfHot)"/></g>`)
    +_cosSvg('avf-sf avf-sf-front',box,`
      <g filter="url(#sfWarp)"><path class="sf-fl" d="${front}" fill="url(#sfFire)"/></g>
      <ellipse cx="50" cy="112" rx="46" ry="9" fill="#5fe3ff" opacity=".22"/>
      <g class="sf-skulls">${skull(10,103,1.15)}${skull(30,111,1.3)}${skull(50,115,1.45)}${skull(70,111,1.3)}${skull(90,103,1.15)}</g>`);
}

// ── Подменяем разметку рамок: новые — здесь, остальное — как было ──
const _avFrameInner0=_avFrameInner;
_avFrameInner=function(id){
  switch(id){
    case 'megalodon':case 'shark':return _cosMegalodon();
    case 'cathood':return _cosCatHood();
    case 'nerd':return _cosNerd();
    case 'soulfire':return _cosSoulFire();
    case 'cobweb':return _avFrameInner0(id).replace('<span class="avf-spider">🕷️</span>',`<svg class="avf-spider" viewBox="0 0 40 40">${_cosSpiderBody()}</svg>`);
    default:return _avFrameInner0(id);
  }
};
function _cosSpiderBody(red){
  const legs='M20,20L6,10L2,2M20,20L4,17L0,12M20,21L5,25L1,32M20,22L8,31L6,39M20,20L34,10L38,2M20,20L36,17L40,12M20,21L35,25L39,32M20,22L32,31L34,39';
  return `<path d="${legs}" stroke="#111" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="20" cy="25" rx="6.4" ry="8" fill="${red?'#c3121c':'#1a1a1d'}" stroke="#000" stroke-width=".8"/>
    <circle cx="20" cy="15.5" r="4.2" fill="${red?'#9a0d15':'#232327'}" stroke="#000" stroke-width=".8"/>
    <path d="M20,19v12M15,22l10,6M25,22l-10,6" stroke="${red?'#1a0304':'#3a3a40'}" stroke-width=".6" opacity=".8"/>
    <circle cx="18.4" cy="14.6" r=".9" fill="#fff" opacity=".7"/><circle cx="21.6" cy="14.6" r=".9" fill="#fff" opacity=".7"/>`;
}

// выбор рамки/контура — не теряем эффект и фон (они в том же поле)
_spPickFrame=function(id){
  const f=AV_FRAME_MAP[id];if(!f)return;
  if(f.prem&&!myPremium){toast('Эта рамка — в SLON Premium');return;}
  _cosSetDraft({id,color:''});
  document.querySelectorAll('.avf-grid .avf-cell').forEach(b=>b.classList.toggle('sel',b.dataset.f===id));
  const prevAv=document.querySelector('#spCustPrev .sp-cust-av');
  _avFrameApply(prevAv,_spDraft.avFrame);_avFrameReveal(prevAv);
};

// ════════ Эффект профиля: по краям всего окна профиля ════════
const PROFILE_FX=[
  {id:'',     name:'Нет',          prem:false},
  {id:'web',  name:'Паутина',      prem:true},
  {id:'frost',name:'Ледяное пламя',prem:true},
];
function _fxInner(id){
  const R=_cosRnd(id==='web'?5:9);
  if(id==='web'){
    // паутина: угловые сети сверху (радиальные нити + провисающие дуги), тонкие нити по бокам, паук на нити
    const corner=()=>{
      let d='';const N=7,ang=i=>i*(90/(N-1));
      for(let i=0;i<N;i++){const a=ang(i)*Math.PI/180;d+=`M0,0L${_cosF(150*Math.cos(a))},${_cosF(150*Math.sin(a))}`;}
      for(let r=22;r<=140;r+=19+R()*6){
        for(let i=0;i<N-1;i++){
          const a1=ang(i)*Math.PI/180,a2=ang(i+1)*Math.PI/180,am=(a1+a2)/2,rr=r*(.97+R()*.06);
          const p1=[rr*Math.cos(a1),rr*Math.sin(a1)],p2=[rr*Math.cos(a2),rr*Math.sin(a2)],c=[(rr-7)*Math.cos(am),(rr-7)*Math.sin(am)];
          d+=`M${_cosF(p1[0])},${_cosF(p1[1])}Q${_cosF(c[0])},${_cosF(c[1])} ${_cosF(p2[0])},${_cosF(p2[1])}`;
        }
      }
      return d;
    };
    const cw=corner();
    let side='';for(let i=0;i<4;i++){const y=40+i*95+R()*30;side+=`M0,${_cosF(y)}Q${_cosF(8+R()*6)},${_cosF(y+30)} 0,${_cosF(y+70+R()*20)}`;}
    return `<svg class="fx-web-c l" viewBox="0 0 150 150"><path d="${cw}"/></svg>
      <svg class="fx-web-c r" viewBox="0 0 150 150"><path d="${cw}"/></svg>
      <svg class="fx-web-side l" viewBox="0 0 20 440" preserveAspectRatio="none"><path d="${side}"/></svg>
      <svg class="fx-web-side r" viewBox="0 0 20 440" preserveAspectRatio="none"><path d="${side}"/></svg>
      <div class="fx-spider"><i></i><svg viewBox="0 0 40 40">${_cosSpiderBody()}</svg></div>`;
  }
  if(id==='frost'){
    const row=(n,cls)=>{let s='';for(let i=0;i<n;i++){const x=(i+.5)*(100/n)+(R()-.5)*3,h=40+R()*60,w=3+R()*3;
      s+=`<i class="${cls}" style="left:${_cosF(x)}%;height:${_cosF(h)}%;width:${_cosF(w)}%;animation-delay:-${(R()*2).toFixed(2)}s;animation-duration:${(0.9+R()*.9).toFixed(2)}s"></i>`;}return s;};
    return `<div class="fx-flames top">${row(26,'fl')}</div><div class="fx-flames bot">${row(26,'fl')}</div>`;
  }
  return '';
}
function _fxApply(host,val){
  if(!host)return;
  host.querySelector(':scope > .pfx')?.remove();
  const {fx}=_avFrameParse(val);
  if(!fx||!PROFILE_FX.some(f=>f.id===fx&&fx))return;
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  const d=document.createElement('div');d.className='pfx pfx-'+fx;d.innerHTML=_fxInner(fx);
  host.appendChild(d);
}

// ════════ Фон в списке чатов (у всех, у кого ты в списке) ════════
const NAME_PLATES=[
  {id:'',       name:'Нет',          prem:false},
  {id:'spider', name:'Паутина',      prem:true},
  {id:'shards', name:'Осколки',      prem:true},
  {id:'frost',  name:'Ледяное пламя',prem:true},
];
function _npInner(id){
  const R=_cosRnd(id.length*13);
  if(id==='spider'){
    let web='';
    for(let i=0;i<9;i++){const a=180+i*(90/8),[x,y]=[140+130*Math.cos(a*Math.PI/180),100+130*Math.sin(a*Math.PI/180)];web+=`M140,100L${_cosF(x)},${_cosF(y)}`;}
    for(let r=22;r<130;r+=20){let d='';for(let i=0;i<=8;i++){const a=180+i*(90/8),rr=r+(R()-.5)*6,[x,y]=[140+rr*Math.cos(a*Math.PI/180),100+rr*Math.sin(a*Math.PI/180)];d+=(i?'Q'+_cosF(140+(rr-4)*Math.cos((a-5.6)*Math.PI/180))+','+_cosF(100+(rr-4)*Math.sin((a-5.6)*Math.PI/180))+' ':'M')+_cosF(x)+','+_cosF(y);}web+=d;}
    return `<svg class="np-web" viewBox="0 0 140 100" preserveAspectRatio="xMaxYMid slice"><path d="${web}"/></svg>
      <div class="np-spd"><i></i><svg viewBox="0 0 40 40">${_cosSpiderBody(true)}</svg></div>`;
  }
  if(id==='shards'){
    let s='';for(let i=0;i<14;i++)s+=`<i style="left:${_cosF(30+R()*70)}%;top:${_cosF(R()*100)}%;--r:${Math.round(R()*180)}deg;--s:${(.6+R()*.9).toFixed(2)};animation-delay:-${(R()*6).toFixed(2)}s;animation-duration:${(4+R()*4).toFixed(2)}s"></i>`;
    let d='';for(let i=0;i<18;i++)d+=`<b style="left:${_cosF(25+R()*75)}%;top:${_cosF(R()*100)}%;animation-delay:-${(R()*3).toFixed(2)}s"></b>`;
    return `<div class="np-shards">${s}${d}</div>`;
  }
  if(id==='frost'){
    let s='';for(let i=0;i<22;i++)s+=`<i class="fl" style="left:${_cosF((i+.5)*(100/22))}%;height:${_cosF(35+R()*55)}%;width:${_cosF(4+R()*3)}%;animation-delay:-${(R()*2).toFixed(2)}s;animation-duration:${(0.9+R()*.9).toFixed(2)}s"></i>`;
    return `<div class="fx-flames bot np-fl">${s}</div>`;
  }
  return '';
}
function _npApply(el,val){
  if(!el)return;
  const {np}=_avFrameParse(val);
  const cur=el.dataset.np||'';
  if(cur===np)return;
  el.querySelector(':scope > .np')?.remove();
  el.classList.remove('np-host');delete el.dataset.np;
  if(!np||!NAME_PLATES.some(p=>p.id===np))return;
  const d=document.createElement('div');d.className='np np-'+np;d.innerHTML=_npInner(np);
  el.classList.add('np-host');el.dataset.np=np;el.prepend(d);
}
function _npPaint(pid){try{_npApply($('si-'+pid),peerAvFrames[pid]||'');}catch(e){}}
for(const fn of ['updateSbName','addSbItem']){
  if(typeof window[fn]!=='function')continue;
  const f=window[fn];
  window[fn]=function(pid){const r=f.apply(this,arguments);_npPaint(pid);return r;};
}
// профили собеседников обновляются — перекрашиваем их строки в списке
setInterval(()=>{if(document.visibilityState==='visible')for(const pid of Object.keys(peerAvFrames||{}))_npPaint(pid);},5000);

// ════════ Секции выбора в «Кастомизации профиля» ════════
function _cosPickSection(title,list,cur,kind,demo,hint){
  const cell=x=>{
    const locked=x.prem&&!myPremium;
    return `<button class="cos-cell${cur===x.id?' sel':''}${locked?' locked':''}" data-${kind}="${x.id}" onclick="_cosPick('${kind}','${x.id}')">
      <span class="cos-demo cos-demo-${kind}">${x.id?demo(x.id):'<span class="cos-none">Нет</span>'}</span>
      <span class="avf-cell-nm">${esc(x.name)}</span>${locked?'<span class="avf-lock">'+_ico('lock')+'</span>':''}</button>`;
  };
  return _spSec(title+(myPremium?'':' <span class="sp-lock">часть Premium</span>'))
    +`<div class="sp-card sp-pad"><div class="cos-grid cos-grid-${kind}">${list.map(cell).join('')}</div></div>`+_spHint(hint);
}
function _cosPick(kind,id){
  const list=kind==='fx'?PROFILE_FX:NAME_PLATES,x=list.find(v=>v.id===id);if(!x)return;
  if(x.prem&&!myPremium){toast('Это — в SLON Premium');return;}
  _cosSetDraft({[kind]:id});
  document.querySelectorAll(`.cos-grid-${kind} .cos-cell`).forEach(b=>b.classList.toggle('sel',b.dataset[kind]===id));
  if(kind==='fx')_fxApply($('spCustThemeBox'),_spDraft.avFrame);
  else _npApply($('cosNpPrev'),_spDraft.avFrame);
}
const _spAvFramesSection0=_spAvFramesSection;
_spAvFramesSection=function(){
  const c=_cosDraft();
  const nick=esc(_myFullName?.().trim()||myNick||('@'+myUsername));
  const av=myAvatar?`<img src="${myAvatar}" alt="">`:_avHtml(myUsername,myNick||myUsername);
  return _spAvFramesSection0()
    +_cosPickSection('Эффект профиля',PROFILE_FX,c.fx,'fx',id=>`<span class="cos-fx-mini pfx-host">${_fxInnerMini(id)}</span>`,'Анимация по краям окна профиля — её видят все, кто открывает твой профиль.')
    +_spSec('Фон в списке чатов')
    +`<div class="sp-card sp-pad"><div class="sb-item cos-np-prev" id="cosNpPrev"><div class="sb-av"><div class="sb-av-inner">${av}</div></div><div class="sb-info"><div class="sb-row1"><div class="sb-name">${nick}</div></div><div class="sb-prev">Привет!</div></div></div></div>`
    +_cosPickSection('',NAME_PLATES,c.np,'np',id=>`<span class="np np-${id}">${_npInner(id)}</span>`,'Так твой чат выглядит в списке чатов у собеседников.');
};
function _fxInnerMini(id){return id==='web'?`<svg viewBox="0 0 40 40">${_cosSpiderBody()}</svg>`:'<i class="cos-fx-fl"></i><i class="cos-fx-fl"></i><i class="cos-fx-fl"></i>';}

// превью кастомизации: эффект профиля и фон строки
const _spUpdateCustPrev0=_spUpdateCustPrev;
_spUpdateCustPrev=function(){const r=_spUpdateCustPrev0.apply(this,arguments);try{_fxApply($('spCustThemeBox'),_spDraft?.avFrame||'');_npApply($('cosNpPrev'),_spDraft?.avFrame||'');}catch(e){}return r;};
// свой профиль и профиль собеседника
if(typeof _ppRender==='function'){const f=_ppRender;_ppRender=function(pid){const r=f.apply(this,arguments);try{_fxApply($('peerProfOverlay'),peerAvFrames[pid]||'');}catch(e){}return r;};}
if(typeof _spRender==='function'){const f=_spRender;_spRender=function(){const r=f.apply(this,arguments);try{_fxApply($('spHero'),myAvFrame||'');}catch(e){}return r;};}

// ════════ Обои профиля: без «Звёздного неба» ════════
{const i=PROFILE_WALLPAPERS.findIndex(w=>w.id==='stars');if(i>=0){PROFILE_WALLPAPERS.splice(i,1);delete PROFILE_WALLPAPER_MAP.stars;}}

// ════════ Узоры: маленькая плашка → мини-окно со слониками, W и ХАХА ════════
for(const p of PREMIUM_BG_PATTERNS)if(/^pat_(elephant|hippo|giraffe|eagle)$/.test(p.id))p.hidden=true;
function _cosPatLabel(id){const p=PREMIUM_BG_PATTERNS.find(x=>x.id===id);return p?p.label:'Нет';}
function _cosPatIcon(id){const p=PREMIUM_BG_PATTERNS.find(x=>x.id===id);return p&&!p.hidden?p.emoji:_ico('image');}
const _spCustomize0=_spCustomize;
_spCustomize=function(){
  const r=_spCustomize0.apply(this,arguments);
  const box=$('spPatterns');
  if(box){
    const card=box.parentElement;
    card.innerHTML=`<button class="cos-pat-tile" id="cosPatTile" onclick="_cosPatOpen(event)">
      <span class="cos-pat-ico">${_cosPatIcon(_spDraft?.pattern||'')}</span><span class="cos-pat-nm">${esc(_cosPatLabel(_spDraft?.pattern||''))}</span>
      <svg class="cos-pat-chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></button>
      <div class="sp-patterns" id="spPatterns" hidden></div>`;
  }
  return r;
};
function _cosPatOpen(e){
  e?.stopPropagation();
  document.getElementById('cosPatPop')?.remove();
  const tile=$('cosPatTile');if(!tile)return;
  const cur=_spDraft?.pattern||'';
  const items=[{id:'',emoji:'<span class="cos-none">Нет</span>',label:'Нет'},...PREMIUM_BG_PATTERNS.filter(p=>!p.hidden)];
  const pop=document.createElement('div');pop.id='cosPatPop';pop.className='cos-pat-pop';
  pop.innerHTML=`<div class="cos-pat-grid">${items.map(p=>`<button class="sp-pat cos-pat-it${p.id===cur?' sel':''}" data-p="${p.id}" title="${esc(p.label)}" onclick="_cosPatPick('${p.id}')">${p.emoji}</button>`).join('')}</div>`;
  document.body.appendChild(pop);
  const r=tile.getBoundingClientRect(),W=Math.min(340,window.innerWidth-16);
  pop.style.width=W+'px';
  pop.style.left=Math.max(8,Math.min(window.innerWidth-W-8,r.left))+'px';
  const below=window.innerHeight-r.bottom>300;
  pop.style.top=(below?r.bottom+6:Math.max(8,r.top-306))+'px';
  pop.style.transformOrigin=below?'top left':'bottom left';
  requestAnimationFrame(()=>pop.classList.add('show'));
  setTimeout(()=>document.addEventListener('click',_cosPatClose,{once:true}),0);
  tile.closest('.sp-page-body')?.addEventListener('scroll',()=>_cosPatClose(),{once:true,passive:true});
}
function _cosPatClose(e){const p=$('cosPatPop');if(!p)return;if(e&&e.target.closest?.('#cosPatPop')){document.addEventListener('click',_cosPatClose,{once:true});return;}p.classList.remove('show');setTimeout(()=>p.remove(),200);}
function _cosPatPick(id){
  _spPickPattern(id);
  if(id&&!myPremium)return;
  const t=$('cosPatTile');if(t){t.querySelector('.cos-pat-ico').innerHTML=_cosPatIcon(id);t.querySelector('.cos-pat-nm').textContent=_cosPatLabel(id);}
  document.querySelectorAll('#cosPatPop .cos-pat-it').forEach(b=>b.classList.toggle('sel',b.dataset.p===id));
  _cosPatClose();
}

// ════════ Слоники в панели эмодзи + в тексте сообщений ════════
// В тексте слоник — метка «:e-id:», в пузыре рисуется анимированным. Одни слоники без текста — крупно.
const _EL_TOKEN=/:e-([a-z0-9_]+):/g;
function _elTokensHtml(html){
  return html.replace(_EL_TOKEN,(m,id)=>(typeof RX_CUSTOM!=='undefined'&&RX_CUSTOM['e:'+id])?rxHtml('e:'+id):m);
}
const _linkify0=linkify;
linkify=function(text){
  const out=_linkify0(text);
  if(!text||text.indexOf(':e-')<0)return out;
  const only=/^\s*(:e-[a-z0-9_]+:\s*){1,3}$/.test(text);
  const h=_elTokensHtml(out);
  return only?`<span class="el-big">${h}</span>`:h;
};
const _updatePreview0=updatePreview;
updatePreview=function(id,txt,ts){return _updatePreview0.call(this,id,typeof txt==='string'?txt.replace(_EL_TOKEN,'Слоник'):txt,ts);};
const _toggleEmojiPanel0=_toggleEmojiPanel;
_toggleEmojiPanel=function(e){
  const p=$('emojiPanel');
  if(p&&!p.dataset.ready){
    _toggleEmojiPanel0(e);                                 // обычные эмодзи
    if(typeof ELEPHANTS!=='undefined'){
      const els=ELEPHANTS.map(x=>`<button class="ep-el" title="${esc(x[1].split(' ')[0])}" onclick="_insertEmoji(':e-${x[0]}:')">${rxHtml('e:'+x[0])}</button>`).join('');
      p.insertAdjacentHTML('afterbegin',`<div class="ep-sec">Слоники</div><div class="ep-els">${els}</div><div class="ep-sec">Эмодзи</div>`);
    }
    return;
  }
  return _toggleEmojiPanel0(e);
};
