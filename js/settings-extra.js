// ════════════════════════════════════════════════════════
// ── НАСТРОЙКИ: Premium (3D-слон), папки, устройства,
//    звук и камера, стикеры, анимации ──
// Подключается после settings-panel.js
// ════════════════════════════════════════════════════════

Object.assign(_SP_ICONS,{
  bolt:'M7 2v11h3v9l7-12h-4l4-8z',
  palette:'M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
  x2:'M3 6h2.2l2.3 3.6L9.8 6H12l-3.4 5 3.6 5H10l-2.5-3.8L5 16H2.8l3.6-5zm11.2 10v-1.6l3.3-3.2c.9-.9 1.3-1.5 1.3-2.1 0-.7-.5-1.2-1.3-1.2-.8 0-1.4.5-1.5 1.3H14.2c.1-1.8 1.4-3 3.4-3s3.2 1.1 3.2 2.8c0 1.1-.6 2-1.9 3.2l-1.8 1.7H21V16z',
  android:'M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.5 11.5 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z',
  apple:'M16.37 12.46c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.71-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76a4.27 4.27 0 0 0-3.6 2.19c-1.54 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.24 2.74 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.14.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.51zM14.2 5.99c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.08 1.96-.49 2.56-1.21z',
  web:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.6 15.6 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.3a16.5 16.5 0 0 0 0 4H4.3zm.8 2H8c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.3 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.3a8.2 8.2 0 0 1 0 4h-3.3z',
  refresh:'M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  smile:'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
  layers:'M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z',
  blur:'M6 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm4 5c-.83 0-1.5.67-1.5 1.5S9.17 17 10 17s1.5-.67 1.5-1.5S10.83 14 10 14zm0-4c-.83 0-1.5.67-1.5 1.5S9.17 13 10 13s1.5-.67 1.5-1.5S10.83 10 10 10zm4 4c-.83 0-1.5.67-1.5 1.5S13.17 17 14 17s1.5-.67 1.5-1.5S14.83 14 14 14zm0-4c-.83 0-1.5.67-1.5 1.5S13.17 13 14 13s1.5-.67 1.5-1.5S14.83 10 14 10zm4 3c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM10 6c-.83 0-1.5.67-1.5 1.5S9.17 9 10 9s1.5-.67 1.5-1.5S10.83 6 10 6zm4 0c-.83 0-1.5.67-1.5 1.5S13.17 9 14 9s1.5-.67 1.5-1.5S14.83 6 14 6z',
  scroll:'M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z',
  dotsV:'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'
});

// ════════════════════════════════════════
// ── SLON PREMIUM: 3D-слон + искры ──
// ════════════════════════════════════════
let _threeLoading=null;
// Два CDN: если один недоступен (бывает у провайдеров), пробуем второй
const _THREE_URLS=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'];
function _loadThree(){
  if(window.THREE)return Promise.resolve(window.THREE);
  if(_threeLoading)return _threeLoading;
  const tryUrl=i=>new Promise((res,rej)=>{
    if(i>=_THREE_URLS.length){rej(new Error('three.js не загрузился'));return;}
    const s=document.createElement('script');s.src=_THREE_URLS[i];
    s.onload=()=>window.THREE?res(window.THREE):tryUrl(i+1).then(res,rej);
    s.onerror=()=>{s.remove();tryUrl(i+1).then(res,rej);};
    document.head.appendChild(s);
  });
  _threeLoading=tryUrl(0).catch(e=>{_threeLoading=null;throw e;});
  return _threeLoading;
}

// Фишки Premium — только то, что реально есть в SLON
const _PREM_FEATURES=[
  ['palette','10 эксклюзивных тем','Оформление, которого нет у остальных: неон, галактика, вишня и другие'],
  ['x2','До 10 каналов','Вместо 3 — веди сразу несколько своих каналов'],
  ['brush','Свой градиент профиля','Любые два цвета фона профиля, как у тебя в голове'],
  ['heart','Узоры на фоне профиля','Слоны, бегемоты, жирафы и орлы вокруг твоей аватарки'],
  ['layers','Цвет и узор групп','Оформи свои группы так же, как профиль'],
  ['image','Обои для чатов','Узорные фоны переписки в цвет темы'],
  ['star','Значок ⭐ у имени','Все видят, что ты поддерживаешь SLON']
];
// Цвет иконок плавно идёт от оранжевого к фиолетовому, как в Telegram
const _PREM_COLORS=['#ff9500','#ff7a2e','#f7594a','#ec4a6e','#d84a95','#b653c4','#8e5ef0'];

function _spPremiumInfo(){
  const feats=_PREM_FEATURES.map(([ico,t,s],i)=>`<div class="sp-row sp-row-static pf-row" style="--d:${i*55}ms">
      <div class="sp-ico" style="background:${_PREM_COLORS[i%_PREM_COLORS.length]}">${_spSvg(ico)}</div>
      <div class="sp-row-txt"><div class="sp-row-title">${t}</div><div class="sp-row-sub">${s}</div></div></div>`).join('');
  const page=_spPush('SLON Premium',`
    <div class="prem-stage" id="premStage">
      <canvas class="prem-sparks" id="premSparks"></canvas>
      <div class="prem-3d" id="prem3d"><div class="prem-fallback">🐘</div></div>
      <div class="prem-hint">Покрути слона 👆</div>
    </div>
    <div class="prem-title">${myPremium?'Ты с нами! 💜':'SLON Premium'}</div>
    <div class="prem-sub">${myPremium?'Спасибо, что поддерживаешь <b>SLON</b>. Вот что тебе открыто:':'Больше возможностей для <b>SLON</b>. Вот что входит в подписку:'}</div>
    <div class="sp-card pf-card">${feats}</div>`);
  const stopSparks=_premSparks($('premSparks'));
  let stop3d=()=>{};
  _loadThree().then(THREE=>{if(page.isConnected)stop3d=_premElephant(THREE,$('prem3d'));})
    .catch(()=>{/* нет сети — остаётся эмодзи-слон */});
  page._onClose=()=>{stopSparks();stop3d();};
}

// Искры-звёздочки вокруг слона (canvas 2D)
function _premSparks(cv){
  if(!cv)return ()=>{};
  const ctx=cv.getContext('2d');let raf=0,alive=true;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const resize=()=>{cv.width=cv.clientWidth*dpr;cv.height=cv.clientHeight*dpr;};
  resize();
  const cols=['#a78bfa','#818cf8','#c084fc','#93c5fd','#f0abfc'];
  const P=Array.from({length:46},()=>({a:Math.random()*Math.PI*2,r:.28+Math.random()*.5,s:2+Math.random()*4.5,
    ph:Math.random()*6.28,sp:.6+Math.random()*1.6,c:cols[Math.floor(Math.random()*cols.length)],dr:(Math.random()-.5)*.0012}));
  const star=(x,y,s,al,c)=>{
    ctx.globalAlpha=al;ctx.fillStyle=c;ctx.beginPath();
    ctx.moveTo(x,y-s);ctx.quadraticCurveTo(x,y,x+s,y);ctx.quadraticCurveTo(x,y,x,y+s);
    ctx.quadraticCurveTo(x,y,x-s,y);ctx.quadraticCurveTo(x,y,x,y-s);ctx.fill();
  };
  const tick=t=>{
    if(!alive)return;
    const w=cv.width,h=cv.height,cx=w/2,cy=h/2,R=Math.min(w,h*1.4)/2;
    ctx.clearRect(0,0,w,h);
    P.forEach(p=>{
      p.a+=p.dr;
      const tw=.5+.5*Math.sin(t/1000*p.sp+p.ph);
      star(cx+Math.cos(p.a)*p.r*R*1.25,cy+Math.sin(p.a)*p.r*R*.72,p.s*dpr*(.6+tw*.6),.25+tw*.75,p.c);
    });
    ctx.globalAlpha=1;
    raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  window.addEventListener('resize',resize);
  return ()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
}

// 3D-слон из примитивов Three.js: крутится мышью/пальцем,
// через ~2 с после отпускания плавно возвращается в исходную позу
function _premElephant(THREE,host){
  if(!host)return ()=>{};
  // Эмодзи-заглушку не удаляем — она спрячется, когда отрисуется первый кадр
  const W=host.clientWidth||260,H=host.clientHeight||200;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}
  catch(e){console.warn('[SLON] WebGL недоступен:',e);return ()=>{};} // остаётся эмодзи-слон
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(W,H);
  renderer.outputEncoding=THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(32,W/H,.1,100);
  cam.position.set(0,.35,7.4);

  // Свет: холодный слева, розовый справа — даёт «премиум»-градиент как у звезды Telegram
  scene.add(new THREE.AmbientLight(0x8a7cff,.55));
  const l1=new THREE.DirectionalLight(0x7aa2ff,1.15);l1.position.set(-4,3,5);scene.add(l1);
  const l2=new THREE.PointLight(0xff7ad9,1.4,20);l2.position.set(4,1,3);scene.add(l2);
  const l3=new THREE.DirectionalLight(0xffffff,.45);l3.position.set(0,5,2);scene.add(l3);

  const mat=new THREE.MeshPhysicalMaterial({color:0x8f7bff,roughness:.32,metalness:.08,clearcoat:.9,clearcoatRoughness:.25});
  const matDark=new THREE.MeshStandardMaterial({color:0x6b58e6,roughness:.45});
  const matTusk=new THREE.MeshPhysicalMaterial({color:0xfdf4ff,roughness:.25,clearcoat:1});
  const matEye=new THREE.MeshStandardMaterial({color:0x1b1238,roughness:.2});

  const g=new THREE.Group();
  const add=(geo,m,pos,scale,rot)=>{const o=new THREE.Mesh(geo,m);o.position.set(...pos);if(scale)o.scale.set(...scale);if(rot)o.rotation.set(...rot);g.add(o);return o;};
  const S=(r,w=32,h=24)=>new THREE.SphereGeometry(r,w,h);
  // Тело и голова
  add(S(1),mat,[0,0,0],[1.35,1.02,1.05]);
  add(S(.72),mat,[1.25,.42,0]);
  // Уши — сплюснутые сферы
  add(S(.62),matDark,[1.02,.5,.62],[.18,.95,.78],[0,-.5,.15]);
  add(S(.62),matDark,[1.02,.5,-.62],[.18,.95,.78],[0,.5,.15]);
  // Хобот — трубка по кривой, закрученная вверх
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.78,.35,0),new THREE.Vector3(2.12,-.1,0),new THREE.Vector3(2.2,-.62,0),
    new THREE.Vector3(2.02,-.98,0),new THREE.Vector3(1.8,-.92,0),new THREE.Vector3(1.78,-.72,0)]);
  const trunkGeo=new THREE.TubeGeometry(curve,48,.17,16,false);
  // Хобот сужается к кончику
  const pa=trunkGeo.attributes.position;const tmp=new THREE.Vector3();
  for(let i=0;i<pa.count;i++){
    const seg=Math.floor(i/17)/48;const pt=curve.getPoint(Math.min(seg,1));
    tmp.fromBufferAttribute(pa,i).sub(pt).multiplyScalar(1-seg*.45).add(pt);pa.setXYZ(i,tmp.x,tmp.y,tmp.z);
  }
  trunkGeo.computeVertexNormals();
  add(trunkGeo,mat,[0,0,0]);
  // Бивни
  add(new THREE.ConeGeometry(.07,.42,16),matTusk,[1.78,.02,.26],null,[0,0,-2.3]);
  add(new THREE.ConeGeometry(.07,.42,16),matTusk,[1.78,.02,-.26],null,[0,0,-2.3]);
  // Глаза
  add(S(.075,16,12),matEye,[1.72,.62,.3]);
  add(S(.075,16,12),matEye,[1.72,.62,-.3]);
  // Ноги
  [[.72,.5],[.72,-.5],[-.72,.5],[-.72,-.5]].forEach(([x,z])=>add(new THREE.CylinderGeometry(.28,.3,.9,20),mat,[x,-1.05,z]));
  // Хвост
  add(new THREE.CylinderGeometry(.04,.06,.6,10),matDark,[-1.42,.05,0],null,[0,0,-.6]);
  g.position.set(-.35,.12,0);
  g.scale.setScalar(.95);
  scene.add(g);

  // Исходная поза — чуть в три четверти, как «иконка»
  const REST={x:.12,y:-.55};
  let rx=REST.x,ry=REST.y,vx=0,vy=0,dragging=false,lastX=0,lastY=0,lastMove=0;
  const el=renderer.domElement;el.style.touchAction='none';el.style.cursor='grab';
  const down=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;el.setPointerCapture?.(e.pointerId);el.style.cursor='grabbing';host.parentElement?.classList.add('touched');};
  const move=e=>{
    if(!dragging)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
    vy=dx*.012;vx=dy*.008;ry+=vy;rx=Math.max(-.7,Math.min(.9,rx+vx));lastMove=performance.now();
  };
  const up=()=>{dragging=false;lastMove=performance.now();el.style.cursor='grab';};
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);

  let raf=0,alive=true;const t0=performance.now();
  const tick=now=>{
    if(!alive)return;
    const t=(now-t0)/1000;
    if(!dragging){
      // Инерция после броска
      ry+=vy;rx=Math.max(-.7,Math.min(.9,rx+vx));vy*=.92;vx*=.9;
      // Через 2 с покоя — плавно домой (кратчайшим путём по кругу)
      if(now-lastMove>2000){
        let d=((REST.y-ry)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;
        ry+=d*.06;rx+=(REST.x-rx)*.06;
      }
    }
    g.rotation.y=ry;g.rotation.x=rx;
    g.position.y=.12+Math.sin(t*1.6)*.06; // лёгкое «парение»
    try{
      renderer.render(scene,cam);
      // Эмодзи-заглушку прячем только после первого удачного кадра
      if(!host.classList.contains('ready'))host.classList.add('ready');
    }catch(e){console.warn('[SLON] Ошибка рендера слона:',e);alive=false;renderer.domElement.remove();return;}
    raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return ()=>{
    alive=false;cancelAnimationFrame(raf);
    el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);
    el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
    renderer.dispose();scene.traverse(o=>{o.geometry?.dispose?.();});
  };
}

// ════════════════════════════════════════
// ── ПАПКИ С ЧАТАМИ ──
// ════════════════════════════════════════
// Папка: {id,name,types:{contacts,nonContacts,groups,channels,unread},chats:[id],exclude:[id]}
let myFolders=[],myFolderCfg={tags:false,view:'top'},_activeFolder='all';
const _FOLDER_TYPES=[
  ['contacts','Контакты','person','blue'],['nonContacts','Не контакты','account','cyan'],
  ['groups','Группы','layers','green'],['channels','Каналы','bell','orange'],['unread','Непрочитанные','chat','red']
];

function _foldersLoad(){
  const p=_getAccountPrefix(myUsername);
  myFolders=LS.get(p+'folders',[])||[];
  myFolderCfg=Object.assign({tags:false,view:'top'},LS.get(p+'folderCfg',{})||{});
}
function _foldersSave(){
  const p=_getAccountPrefix(myUsername);
  LS.set(p+'folders',myFolders);LS.set(p+'folderCfg',myFolderCfg);
  _renderFolderTabs();_applyFolderFilter();
}

function _chatKind(id){
  if(id.startsWith('g_'))return 'groups';
  if(_isChannelId(id))return 'channels';
  if(id==='ai'||id==='saved')return 'service';
  return _isContact(id)?'contacts':'nonContacts';
}
function _chatUnread(id){const b=$('badge-'+id);return !!(b&&b.textContent.trim());}
function _folderHas(f,id){
  if(f.exclude?.includes(id))return false;
  if(f.chats?.includes(id))return true;
  const k=_chatKind(id);
  if(k!=='service'&&f.types?.[k])return true;
  if(f.types?.unread&&_chatUnread(id))return true;
  return false;
}

// Вкладки папок в сайдбаре (сверху или слева)
function _renderFolderTabs(){
  const sb=$('sidebar');if(!sb)return;
  let bar=$('sbFolders');
  if(!myFolders.length){bar?.remove();sb.classList.remove('folders-left');_activeFolder='all';return;}
  if(!bar){
    bar=document.createElement('div');bar.id='sbFolders';bar.className='sb-folders';
    const anchor=sb.querySelector('.sb-search');anchor?.after(bar);
  }
  sb.classList.toggle('folders-left',myFolderCfg.view==='left');
  if(!myFolders.some(f=>f.id===_activeFolder))_activeFolder='all';
  const tab=(id,name,emoji)=>`<button class="sb-ftab${_activeFolder===id?' sel':''}" data-f="${id}" onclick="_setFolder('${id}')">
      ${myFolderCfg.view==='left'?`<span class="sb-ftab-ico">${emoji||'📁'}</span>`:''}<span class="sb-ftab-name">${esc(name)}</span></button>`;
  bar.innerHTML=tab('all','Все чаты','💬')+myFolders.map(f=>tab(f.id,f.name,f.emoji)).join('')+'<span class="sb-ftab-ink"></span>';
  requestAnimationFrame(_moveFolderInk);
}
function _moveFolderInk(){
  const bar=$('sbFolders');if(!bar)return;
  const sel=bar.querySelector('.sb-ftab.sel'),ink=bar.querySelector('.sb-ftab-ink');if(!sel||!ink)return;
  if(myFolderCfg.view==='left'){ink.style.cssText=`top:${sel.offsetTop}px;height:${sel.offsetHeight}px;left:0;width:3px`;}
  else{ink.style.cssText=`left:${sel.offsetLeft+10}px;width:${sel.offsetWidth-20}px;bottom:0;height:3px`;}
}
function _setFolder(id){
  _activeFolder=id;
  document.querySelectorAll('#sbFolders .sb-ftab').forEach(b=>b.classList.toggle('sel',b.dataset.f===id));
  _moveFolderInk();
  const list=$('sbList');list?.classList.remove('sb-fswitch');void list?.offsetWidth;list?.classList.add('sb-fswitch');
  _applyFolderFilter();
}

function _applyFolderFilter(){
  const list=$('sbList');if(!list)return;
  const f=myFolders.find(x=>x.id===_activeFolder);
  list.querySelectorAll('.sb-item').forEach(el=>{
    const id=el.id.replace(/^si-/,'');
    el.classList.toggle('sb-fhidden',!!f&&!_folderHas(f,id));
    // Метки папок у чата
    let tags=el.querySelector('.sb-ftags');
    if(myFolderCfg.tags&&myFolders.length){
      const names=myFolders.filter(x=>_folderHas(x,id)).map(x=>x.name);
      if(!tags){tags=document.createElement('div');tags.className='sb-ftags';el.querySelector('.sb-info')?.appendChild(tags);}
      // Пишем в DOM только при изменении — иначе MutationObserver списка зациклится
      const html=names.slice(0,3).map(n=>`<span>${esc(n)}</span>`).join('');
      if(tags.innerHTML!==html)tags.innerHTML=html;
    }else tags?.remove();
  });
}

// Иллюстрация: папки поднимаются одна за другой и утрамбовываются
function _folderArt(){
  const f=(c1,c2,i)=>`<svg class="fa-f fa-f${i}" viewBox="0 0 120 84"><path d="M6 14a8 8 0 0 1 8-8h26l10 9h56a8 8 0 0 1 8 8v47a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8z" fill="#c98b4e"/>
    <rect x="${18+i*20}" y="2" width="26" height="16" rx="4" fill="${c1}"/><rect x="${18+i*20}" y="2" width="26" height="6" rx="3" fill="${c2}"/>
    <path d="M6 26a8 8 0 0 1 8-8h92a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8z" fill="url(#faG)"/></svg>`;
  return `<div class="fa-wrap" onclick="this.classList.remove('play');void this.offsetWidth;this.classList.add('play')">
    <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="faG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3c796"/><stop offset="1" stop-color="#e2a86c"/></linearGradient></defs></svg>
    ${f('#ff9f43','#ffc27a',0)}${f('#4f6bff','#7d93ff',1)}${f('#ff4d5e','#ff8a95',2)}</div>`;
}

function _spFolders(){
  const rows=myFolders.map(fo=>`<div class="sp-row" onclick="_spFolderEdit('${fo.id}')">
      <div class="sp-row-txt"><div class="sp-row-title">${fo.emoji?fo.emoji+' ':''}${esc(fo.name)}</div><div class="sp-row-sub">${_folderSummary(fo)}</div></div>
      <button class="sp-dots" onclick="event.stopPropagation();_spFolderMenu('${fo.id}',this)">${_spSvg('dotsV')}</button></div>`).join('');
  const has=t=>myFolders.some(f=>f.rec===t);
  const rec=[['unread','Непрочитанные','Новые сообщения из всех чатов'],['personal','Личные','Только сообщения из личных чатов']]
    .filter(([k])=>!has(k))
    .map(([k,t,s])=>`<div class="sp-row sp-row-static"><div class="sp-row-txt"><div class="sp-row-title">${t}</div><div class="sp-row-sub">${s}</div></div>
      <button class="sp-add-btn" onclick="_spAddRecFolder('${k}')">Добавить</button></div>`).join('');
  const page=_spPush('Папки с чатами',`
    ${_folderArt()}
    <div class="fa-txt">Создавай папки для разных групп чатов и быстро переключайся между ними.</div>
    <button class="sp-pill-btn" onclick="_spFolderEdit()">＋ Создать папку</button>
    ${_spSec('Папки')}
    ${_spCard(`<div class="sp-row sp-row-static"><div class="sp-row-txt"><div class="sp-row-title">Все чаты</div><div class="sp-row-sub">Все неархивные чаты</div></div></div>`+rows)}
    ${rec?_spSec('Рекомендуемые папки')+_spCard(rec):''}
    ${_spCard(_spCheckRow(myFolderCfg.tags,'Показывать метки папок','Названия папок у каждого чата в списке',"_spFolderCfg('tags',this)"))}
    ${_spSec('Вид вкладок')}
    <div class="sp-card sp-pad">
      <div class="sp-pick${myFolderCfg.view==='left'?' sel':''}" onclick="_spFolderView('left',this)"><div class="sp-pick-txt">Вкладки слева</div><div class="sp-pick-radio"></div></div>
      <div class="sp-pick${myFolderCfg.view!=='left'?' sel':''}" onclick="_spFolderView('top',this)"><div class="sp-pick-txt">Вкладки сверху</div><div class="sp-pick-radio"></div></div>
    </div>`);
  setTimeout(()=>page.querySelector('.fa-wrap')?.classList.add('play'),260);
}

function _folderSummary(f){
  const parts=_FOLDER_TYPES.filter(([k])=>f.types?.[k]).map(([,l])=>l);
  if(f.chats?.length)parts.push(f.chats.length+' '+_spPlural(f.chats.length,'чат','чата','чатов'));
  return parts.join(', ')||'Пусто';
}
function _spFolderCfg(k,row){myFolderCfg[k]=!myFolderCfg[k];row.querySelector('.sp-check').classList.toggle('on',myFolderCfg[k]);_foldersSave();}
function _spFolderView(v,el){myFolderCfg.view=v;el.parentElement.querySelectorAll('.sp-pick').forEach(x=>x.classList.toggle('sel',x===el));_foldersSave();}
function _spAddRecFolder(k){
  const f=k==='unread'
    ?{id:'f'+Date.now(),name:'Непрочитанные',emoji:'🔵',rec:'unread',types:{unread:true},chats:[],exclude:[]}
    :{id:'f'+Date.now(),name:'Личные',emoji:'👤',rec:'personal',types:{contacts:true,nonContacts:true},chats:[],exclude:[]};
  myFolders.push(f);_foldersSave();_spPop(true);_spFolders();toast('Папка «'+f.name+'» добавлена');
}
function _spFolderMenu(id,btn){
  const m=document.createElement('div');m.className='sp-menu show sp-float-menu';
  const r=btn.getBoundingClientRect(),pr=$('spPanel').getBoundingClientRect(),z=_zoomOf($('spPanel'));
  m.style.cssText=`top:${(r.bottom-pr.top)/z}px;right:${(pr.right-r.right)/z}px`;
  m.innerHTML=`<button class="sp-menu-item" onclick="this.parentElement.remove();_spFolderEdit('${id}')">${_spSvg('pencil')}<span>Изменить</span></button>
    <button class="sp-menu-item danger" onclick="this.parentElement.remove();_spFolderDelete('${id}')">${_spSvg('trash')}<span>Удалить</span></button>`;
  $('spPanel').appendChild(m);
  setTimeout(()=>document.addEventListener('click',()=>m.remove(),{once:true}),0);
}
function _spFolderDelete(id){
  myFolders=myFolders.filter(f=>f.id!==id);_foldersSave();
  if(_spTopPage()?.dataset.page==='folderEdit')_spPop(true);
  _spPop(true);_spFolders();toast('Папка удалена');
}

let _fDraft=null;
function _spFolderEdit(id){
  const src=myFolders.find(f=>f.id===id);
  _fDraft=src?JSON.parse(JSON.stringify(src)):{id:'f'+Date.now(),name:'',emoji:'📁',types:{},chats:[],exclude:[]};
  const emojis=['📁','💼','👤','👥','📢','⭐','🔵','🎮','🎵','🐘','❤️','🔥'];
  const typeRows=_FOLDER_TYPES.map(([k,l,ico,c])=>`<div class="sp-row" onclick="_fdType('${k}',this)">${_spIco(c,ico)}
      <div class="sp-row-txt"><div class="sp-row-title">${l}</div></div><div class="sp-check${_fDraft.types[k]?' on':''}">${_spSvg('check')}</div></div>`).join('');
  const page=_spPush(src?'Изменить папку':'Новая папка',`
    ${_folderArt()}
    <div class="sp-card sp-pad">
      <label class="sp-field"><input id="fdName" maxlength="24" value="${esc(_fDraft.name)}" placeholder=" " oninput="_fDraft.name=this.value;_fdDirty()"><span>Название папки</span></label>
      <div class="fd-emojis">${emojis.map(e=>`<button class="fd-emo${_fDraft.emoji===e?' sel':''}" onclick="_fDraft.emoji='${e}';this.parentElement.querySelectorAll('.fd-emo').forEach(x=>x.classList.toggle('sel',x===this));_fdDirty()">${e}</button>`).join('')}</div>
    </div>
    ${_spSec('Типы чатов')}${_spCard(typeRows)}
    ${_spSec('Отдельные чаты',`<a class="sp-sec-link" onclick="_fdPickChats()">＋ добавить</a>`)}
    <div class="sp-card" id="fdChats">${_fdChatsHtml()}</div>
    ${_spHint('В папке будут все чаты выбранных типов плюс отдельно добавленные.')}
    ${src?_spCard(_spRow({ico:'trash',color:'red',title:'Удалить папку',onclick:`_spFolderDelete('${src.id}')`,cls:'sp-row-danger'})):''}
    <div style="height:70px"></div>`,
    {fab:`<button class="sp-fab" id="fdSave" onclick="_fdSave()" title="Сохранить">${_spSvg('check')}</button>`});
  page.dataset.page='folderEdit';
  setTimeout(()=>page.querySelector('.fa-wrap')?.classList.add('play'),260);
}
function _fdDirty(){$('fdSave')?.classList.add('show');}
function _fdType(k,row){_fDraft.types[k]=!_fDraft.types[k];row.querySelector('.sp-check').classList.toggle('on',_fDraft.types[k]);_fdDirty();}
function _fdChatsHtml(){
  if(!_fDraft.chats.length)return '<div class="ci-empty">Отдельных чатов нет</div>';
  return _fDraft.chats.map(id=>`<div class="sp-pick">${_spAvatarHtml(peerAvatars[id],_chatTitle(id),'sp-pick-av')}
      <div class="sp-pick-txt">${esc(_chatTitle(id))}</div>
      <button class="sp-btn-sm" onclick="_fDraft.chats=_fDraft.chats.filter(x=>x!=='${id}');$('fdChats').innerHTML=_fdChatsHtml();_fdDirty()">Убрать</button></div>`).join('');
}
function _chatTitle(id){
  if(id==='ai')return 'СЛОН AI';if(id==='saved')return 'Избранное';
  return (groups?.[id]?.name)||peerNames[id]||('@'+id);
}
function _fdPickChats(){
  const ids=[...document.querySelectorAll('#sbList .sb-item, #archiveList .sb-item')].map(el=>el.id.replace(/^si-/,''));
  const rows=ids.map(id=>`<div class="sp-row" onclick="_fdToggleChat('${id}',this)">${_spAvatarHtml(peerAvatars[id]||groups?.[id]?.avatar,_chatTitle(id),'sp-pick-av')}
      <div class="sp-row-txt"><div class="sp-row-title">${esc(_chatTitle(id))}</div></div>
      <div class="sp-check${_fDraft.chats.includes(id)?' on':''}">${_spSvg('check')}</div></div>`).join('');
  const page=_spPush('Добавить чаты',_spCard(rows||'<div class="ci-empty">Чатов пока нет</div>'));
  page._onClose=()=>{$('fdChats')&&($('fdChats').innerHTML=_fdChatsHtml());};
}
function _fdToggleChat(id,row){
  const on=!_fDraft.chats.includes(id);
  _fDraft.chats=on?[..._fDraft.chats,id]:_fDraft.chats.filter(x=>x!==id);
  row.querySelector('.sp-check').classList.toggle('on',on);_fdDirty();
}
function _fdSave(){
  const name=(_fDraft.name||'').trim();
  if(!name){toast('Введи название папки');$('fdName')?.focus();return;}
  if(!Object.values(_fDraft.types).some(Boolean)&&!_fDraft.chats.length){toast('Выбери типы чатов или добавь чаты');return;}
  _fDraft.name=name.slice(0,24);
  const i=myFolders.findIndex(f=>f.id===_fDraft.id);
  if(i>=0)myFolders[i]=_fDraft;else myFolders.push(_fDraft);
  _foldersSave();
  _spPop(true);_spPop(true);_spFolders();
  toast('Папка сохранена 📁');
}

// ════════════════════════════════════════
// ── УСТРОЙСТВА (активные сеансы) ──
// sessions/{username}/{deviceId} = {app,browser,os,ts,created,terminate?}
// ════════════════════════════════════════
function _uaInfo(){
  const ua=navigator.userAgent;let browser='Браузер',os='Неизвестно';
  const m=(re)=>{const r=ua.match(re);return r?r[1].split('.')[0]:'';};
  if(/YaBrowser/.test(ua))browser='Yandex '+m(/YaBrowser\/([\d.]+)/);
  else if(/Edg\//.test(ua))browser='Edge '+m(/Edg\/([\d.]+)/);
  else if(/OPR\//.test(ua))browser='Opera '+m(/OPR\/([\d.]+)/);
  else if(/Firefox\//.test(ua))browser='Firefox '+m(/Firefox\/([\d.]+)/);
  else if(/Chrome\//.test(ua))browser='Chrome '+m(/Chrome\/([\d.]+)/);
  else if(/Safari\//.test(ua))browser='Safari '+m(/Version\/([\d.]+)/);
  if(/Android/.test(ua))os='Android '+(ua.match(/Android ([\d.]+)/)?.[1]||'');
  else if(/iPhone|iPad|iPod/.test(ua))os='iOS';
  else if(/Windows/.test(ua))os='Windows';
  else if(/Mac OS X/.test(ua))os='macOS';
  else if(/Linux/.test(ua))os='Linux';
  return {browser:browser.trim(),os:os.trim(),app:'SLON Web'};
}
let _sessStarted=false;
function _sessStart(){
  if(_sessStarted||!window._fbDb||!myUsername||!_fbMode)return;
  _sessStarted=true;
  const path='sessions/'+myUsername+'/'+_myDeviceId;
  const info=_uaInfo();
  _fbOnce(path).then(s=>{
    const prev=s?.val()||{};
    window._fbSet(window._fbRef(window._fbDb,path),{...info,ts:Date.now(),created:prev.created||Date.now()});
  });
  setInterval(()=>{if(_fbMode&&myUsername)window._fbSet(window._fbRef(window._fbDb,path+'/ts'),Date.now());},120000);
  // Удалённое завершение сеанса с другого устройства
  window._fbOnValue(window._fbRef(window._fbDb,path+'/terminate'),snap=>{
    if(snap.val()===true){
      window._fbRemove(window._fbRef(window._fbDb,path)).catch(()=>{});
      toast('Сеанс завершён с другого устройства',4000);
      setTimeout(()=>doLogout(),1200);
    }
  });
}

function _sessIcon(s){
  const os=(s.os||'').toLowerCase();
  if(os.startsWith('android'))return _spIco('green','android');
  if(os==='ios'||os==='macos')return _spIco('gray','apple');
  return _spIco('violet','web');
}
function _sessRow(id,s,me){
  return `<div class="sp-row${me?' sp-row-static':''}" ${me?'':`onclick="_sessTerminate('${id}')"`}>${_sessIcon(s)}
    <div class="sp-row-txt"><div class="sp-row-title">${esc(s.browser||'Браузер')}</div>
      <div class="sp-row-sub">${esc(s.app||'SLON Web')}, ${esc(s.os||'')}</div></div>
    ${me?'':`<div class="sp-row-val sess-time">${s.ts?_spShortDate(s.ts):''}</div>`}</div>`;
}
async function _spSessions(){
  const page=_spPush('Устройства',`<div class="ci-empty">Загрузка сеансов…</div>`);
  const me=_uaInfo();
  const snap=await _fbOnce('sessions/'+myUsername);
  if(!page.isConnected)return;
  const all=snap?.val()||{};
  const others=Object.entries(all).filter(([id,s])=>id!==_myDeviceId&&s&&!s.terminate&&Date.now()-(s.ts||0)<90*864e5)
    .sort((a,b)=>(b[1].ts||0)-(a[1].ts||0));
  const body=page.querySelector('.sp-page-body');
  body.innerHTML=_spSec('Это устройство')
    +_spCard(_sessRow(_myDeviceId,{...me,ts:Date.now()},true)
      +(others.length?`<div class="sp-row sp-row-danger" onclick="_sessTerminateAll()"><div class="pp-ico">${_spSvg('block')}</div>
        <div class="sp-row-txt"><div class="sp-row-title">Завершить все другие сеансы</div></div></div>`:''))
    +(others.length?_spSec('Активные сеансы')+_spCard(others.map(([id,s])=>_sessRow(id,s,false)).join(''))
      +_spHint('Нажми на сеанс, чтобы завершить его. На том устройстве произойдёт выход из аккаунта.')
      :_spHint(snap?'Других активных сеансов нет.':'Не удалось загрузить сеансы — проверь подключение.'));
}
function _sessTerminate(id){
  showModal(`<div class="m-title">Завершить сеанс?</div><div class="m-info">На этом устройстве произойдёт выход из SLON.</div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Отмена</button>
    <button class="btn-ok" onclick="closeModal();_sessDoTerminate(['${id}'])">Завершить</button></div>`);
}
async function _sessTerminateAll(){
  const snap=await _fbOnce('sessions/'+myUsername);
  const ids=Object.keys(snap?.val()||{}).filter(id=>id!==_myDeviceId);
  showModal(`<div class="m-title">Завершить все другие сеансы?</div><div class="m-info">На остальных устройствах (${ids.length}) произойдёт выход из SLON.</div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Отмена</button>
    <button class="btn-ok" onclick="closeModal();_sessDoTerminate(${JSON.stringify(ids).replace(/"/g,"'")})">Завершить</button></div>`);
}
function _sessDoTerminate(ids){
  ids.forEach(id=>window._fbSet(window._fbRef(window._fbDb,'sessions/'+myUsername+'/'+id+'/terminate'),true));
  toast(ids.length>1?'Сеансы завершены':'Сеанс завершён');
  setTimeout(()=>{_spPop(true);_spSessions();},600);
}

// ════════════════════════════════════════
// ── ЗВУК И КАМЕРА ──
// ════════════════════════════════════════
async function _spAV(){
  const page=_spPush('Звук и камера',`<div class="ci-empty">Ищем устройства…</div>`);
  let micStream=null,camStream=null,raf=0,ac=null;
  page._onClose=()=>{cancelAnimationFrame(raf);micStream?.getTracks().forEach(t=>t.stop());camStream?.getTracks().forEach(t=>t.stop());ac?.close?.();};
  if(!hasMediaDevices){page.querySelector('.sp-page-body').innerHTML='<div class="ci-empty">Браузер не поддерживает доступ к устройствам</div>';return;}
  let devices=[];
  try{
    const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());
    devices=await navigator.mediaDevices.enumerateDevices();
  }catch(e){
    page.querySelector('.sp-page-body').innerHTML=_spCard(`<div class="sp-empty">🎙<div>Нет доступа к микрофону.<br>Разреши его в настройках сайта.</div>
      <button class="sp-btn" onclick="_spPop(true);_spAV()">Попробовать снова</button></div>`);
    return;
  }
  if(!page.isConnected)return;
  const mics=devices.filter(d=>d.kind==='audioinput'),spks=devices.filter(d=>d.kind==='audiooutput'),cams=devices.filter(d=>d.kind==='videoinput');
  const hasSink=typeof HTMLMediaElement.prototype.setSinkId==='function';
  const isSel=(d,sel,list)=>sel&&sel!=='default'?d.deviceId===sel:(d.deviceId==='default'||list.indexOf(d)===0);
  const opts=(list,type,sel)=>list.map(d=>`<div class="sp-pick dev-card${isSel(d,sel,list)?' sel':''}" onclick="_avSelect('${type}','${d.deviceId}',this)">
      <div class="sp-pick-txt"><div>${esc(d.label||'Устройство')}</div>${d.deviceId==='default'?'<div class="sp-row-sub">По умолчанию</div>':''}</div><div class="sp-pick-radio"></div></div>`).join('');
  page.querySelector('.sp-page-body').innerHTML=
    _spSec('Микрофон')
    +`<div class="sp-card sp-pad"><div class="dev-list">${opts(mics,'mic',selMic)||'<div class="ci-empty">Микрофоны не найдены</div>'}</div>
       <div class="av-meter"><div class="av-meter-lbl">Уровень</div><div class="av-bars" id="avBars">${'<i></i>'.repeat(20)}</div></div></div>`
    +_spHint('Скажи что-нибудь — полоски покажут громкость микрофона.')
    +_spSec('Динамики')
    +`<div class="sp-card sp-pad">${hasSink?`<div class="dev-list">${opts(spks,'spk',selSpk)||'<div class="ci-empty">Динамики не найдены</div>'}</div>`:'<div class="ci-empty">Браузер не умеет выбирать динамик — звук идёт в системный</div>'}
       <button class="sp-btn av-test" onclick="_avTestSound(this)">🔊 Проверить звук</button></div>`
    +_spSec('Камера')
    +`<div class="sp-card sp-pad">${cams.length?`<div class="av-cam"><video id="avCam" autoplay playsinline muted></video><div class="av-cam-ph">📷</div></div>
       <div class="dev-list">${opts(cams,'cam',selCam)}</div>`:'<div class="ci-empty">Камеры не найдены</div>'}</div>`
    +(activeCall?_spHint('Идёт звонок — смена устройства применится сразу.'):'');

  // Индикатор уровня микрофона
  const startMic=async()=>{
    micStream?.getTracks().forEach(t=>t.stop());cancelAnimationFrame(raf);
    try{
      micStream=await navigator.mediaDevices.getUserMedia({audio:selMic&&selMic!=='default'?{deviceId:{exact:selMic}}:true});
      ac=ac||new(window.AudioContext||window.webkitAudioContext)();
      const an=ac.createAnalyser();an.fftSize=256;ac.createMediaStreamSource(micStream).connect(an);
      const data=new Uint8Array(an.frequencyBinCount);const bars=[...page.querySelectorAll('#avBars i')];
      const loop=()=>{an.getByteTimeDomainData(data);let peak=0;for(const v of data)peak=Math.max(peak,Math.abs(v-128));
        const lvl=Math.min(1,peak/64);bars.forEach((b,i)=>b.classList.toggle('on',i/bars.length<lvl));raf=requestAnimationFrame(loop);};
      loop();
    }catch(e){}
  };
  const startCam=async()=>{
    const v=page.querySelector('#avCam');if(!v)return;
    camStream?.getTracks().forEach(t=>t.stop());v.classList.remove('on');
    try{
      camStream=await navigator.mediaDevices.getUserMedia({video:selCam&&selCam!=='default'?{deviceId:{exact:selCam}}:true});
      if(!page.isConnected){camStream.getTracks().forEach(t=>t.stop());return;}
      v.srcObject=camStream;v.onloadeddata=()=>v.classList.add('on');
    }catch(e){page.querySelector('.av-cam-ph').textContent='🚫';}
  };
  page._restartMic=startMic;page._restartCam=startCam;
  startMic();startCam();
}
async function _avSelect(type,id,el){
  await selectDev(type,id,el); // переиспользуем логику переключения (в т.ч. в активном звонке)
  const page=_spTopPage();
  if(type==='mic')page?._restartMic?.();
  if(type==='cam')page?._restartCam?.();
}
function _avTestSound(btn){
  // Короткая мелодия через выбранный динамик
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const dest=ctx.createMediaStreamDestination();const a=new Audio();a.srcObject=dest.stream;
    if(selSpk&&typeof a.setSinkId==='function')a.setSinkId(selSpk).catch(()=>{});
    a.play().catch(()=>{});
    [523,659,784].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;o.type='sine';
      g.gain.setValueAtTime(0,ctx.currentTime+i*.16);g.gain.linearRampToValueAtTime(.25,ctx.currentTime+i*.16+.02);
      g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.16+.3);o.connect(g);g.connect(dest);o.start(ctx.currentTime+i*.16);o.stop(ctx.currentTime+i*.16+.32);});
    btn.classList.add('playing');setTimeout(()=>{btn.classList.remove('playing');ctx.close();},900);
  }catch(e){toast('Не удалось проиграть звук');}
}

// ════════════════════════════════════════
// ── СТИКЕРЫ И ЭМОДЗИ ──
// ════════════════════════════════════════
let myStickerCfg={};
function _spStickers(){
  const c=myStickerCfg;
  const packs=PREMIUM_BG_PATTERNS.map(p=>`<div class="sp-pick sp-row-static"><div class="sp-pick-av sp-wp-ico">${p.emoji}</div>
      <div class="sp-pick-txt"><div>${esc(p.label)}</div><div class="sp-row-sub">Узор профиля${myPremium?'':' · ⭐ Premium'}</div></div></div>`).join('');
  _spPush('Стикеры и эмодзи',
    _spCard(_spCheckRow(c.suggest!==false,'Подсказывать стикеры по эмодзи','',"_stkFlag('suggest',this)")
      +_spRow({ico:'smile',color:'orange',title:'Эмодзи-паки',val:PREMIUM_BG_PATTERNS.length,cls:'sp-row-static'}))
    +_spSec('Динамический порядок паков')
    +_spCard(_spCheckRow(c.dynamic!==false,'Динамический порядок паков','',"_stkFlag('dynamic',this)"))
    +_spHint('Недавно использованные наборы будут показываться выше остальных.')
    +_spSec('Мои наборы')+_spCard(packs,'sp-pad')
    +_spHint('Свои паки стикеров и эмодзи — слоны, бегемоты и другие — скоро появятся в SLON 🐘'));
}
function _stkFlag(k,row){
  myStickerCfg[k]=myStickerCfg[k]===false;LS.set(_getAccountPrefix(myUsername)+'stickerCfg',myStickerCfg);
  row.querySelector('.sp-check').classList.toggle('on',myStickerCfg[k]!==false);
}

// ════════════════════════════════════════
// ── АНИМАЦИИ И ПРОИЗВОДИТЕЛЬНОСТЬ ──
// ════════════════════════════════════════
// level: 0 — экономия, 1 — плавно и быстро, 2 — максимум
let myPerf={level:2,ui:true,blur:true,smooth:true};
function _perfLoad(){myPerf=Object.assign({level:2,ui:true,blur:true,smooth:true},LS.get('sl_perf',{})||{});_perfApply();}
function _perfApply(){
  const b=document.body.classList;
  b.toggle('perf-noanim',myPerf.level===0||!myPerf.ui);
  b.toggle('perf-fast',myPerf.level===1&&myPerf.ui);
  b.toggle('perf-noblur',myPerf.level===0||!myPerf.blur);
  b.toggle('perf-nosmooth',!myPerf.smooth);
}
function _spAnimations(){
  const items=[
    ['ui','Анимации интерфейса','layers','Переходы между экранами, появление карточек, пузыри сообщений'],
    ['blur','Размытие и прозрачность','blur','Эффект матового стекла у меню. Выключи, если телефон тормозит'],
    ['smooth','Плавная прокрутка','scroll','Плавная прокрутка чатов и настроек']
  ];
  const rows=items.map(([k,t,ico,d])=>`<div class="perf-item">
      <div class="sp-row" onclick="_perfFlag('${k}',this)"><div class="sp-check${myPerf[k]?' on':''}">${_spSvg('check')}</div>
        <div class="sp-row-txt"><div class="sp-row-title">${t}</div></div>
        <button class="perf-exp" onclick="event.stopPropagation();this.closest('.perf-item').classList.toggle('open')">${_spSvg('expand')}</button></div>
      <div class="bh-list"><div class="bh-inner perf-desc">${d}</div></div></div>`).join('');
  _spPush('Анимации и производительность',
    _spSec('Уровень анимаций')
    +`<div class="sp-card sp-pad"><div class="perf-slider">
        <input type="range" min="0" max="2" step="1" value="${myPerf.level}" id="perfLvl" oninput="_perfLevel(this.value)">
        <div class="perf-lbls"><span data-l="0">Экономия энергии</span><span data-l="1">Плавно и быстро</span><span data-l="2">Максимум</span></div>
      </div></div>`
    +_spHint('Выбери, сколько анимаций тебе нужно.')
    +_spSec('Ресурсоёмкие процессы')+_spCard(rows));
  _perfPaint();
}
function _perfPaint(){
  const el=$('perfLvl');if(!el)return;
  el.style.setProperty('--p',(el.value/2*100)+'%');
  document.querySelectorAll('.perf-lbls span').forEach(s=>s.classList.toggle('sel',s.dataset.l===String(myPerf.level)));
}
function _perfLevel(v){myPerf.level=+v;LS.set('sl_perf',myPerf);_perfApply();_perfPaint();}
function _perfFlag(k,row){myPerf[k]=!myPerf[k];LS.set('sl_perf',myPerf);row.querySelector('.sp-check').classList.toggle('on',myPerf[k]);_perfApply();}

// ════════════════════════════════════════
// ── ЭМОДЗИ В ПОЛЕ ВВОДА + КНОПКА «ВНИЗ» ──
// ════════════════════════════════════════
const _EMOJIS='😀😃😄😁😆😅😂🤣🙂🙃😉😊😇🥰😍🤩😘😗😚😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬😮‍💨🤥😌😔😪🤤😴😷🤒🤕🤢🤮🥵🥶🥴😵🤯🤠🥳😎🤓🧐😕😟🙁😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀☠️💩🤡👻👽👾🤖😺😸😹😻😼😽🙀😿😾🙈🙉🙊💋💌💘💝💖💗💓💞💕❤️🧡💛💚💙💜🤎🖤🤍💯💢💥💫💦💨🕳️💬👋🤚🖐️✋🖖👌🤌🤏✌️🤞🤟🤘🤙👈👉👆🖕👇☝️👍👎✊👊🤛🤜👏🙌👐🤲🤝🙏💪🦾🐘🦛🦒🦅🔥✨⭐🌟🎉🎊🎁🏆⚡🌈☀️🌙❄️🍕🍔🍟🌭🍿🥤☕🍺🎮🎧🎵📱💻📸🚀✈️🚗';
function _toggleEmojiPanel(e){
  e?.stopPropagation();
  const p=$('emojiPanel');if(!p)return;
  if(!p.dataset.ready){
    // Режем строку на эмодзи с учётом составных (❤️, 😮‍💨)
    const list=typeof Intl.Segmenter==='function'
      ?[...new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(_EMOJIS)].map(x=>x.segment)
      :[..._EMOJIS];
    p.innerHTML=list.map(em=>`<button onclick="_insertEmoji('${em}')">${em}</button>`).join('');
    p.dataset.ready='1';
  }
  p.classList.toggle('show');
}
function _insertEmoji(em){
  const inp=$('msgInp');if(!inp)return;
  const a=inp.selectionStart??inp.value.length,b=inp.selectionEnd??a;
  inp.value=inp.value.slice(0,a)+em+inp.value.slice(b);
  inp.focus();inp.selectionStart=inp.selectionEnd=a+em.length;
  onTyping(inp);
}
document.addEventListener('click',e=>{if(!e.target.closest?.('#emojiPanel,#emojiBtn'))$('emojiPanel')?.classList.remove('show');});

// ════════════════════════════════════════
// ── ПКМ ПО ЧАТУ → «ДОБАВИТЬ В ПАПКУ» ──
// ════════════════════════════════════════
function _ctxFolderMenu(id){
  const menu=$('chatCtxMenu');if(!menu)return;
  const check='<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  const rows=myFolders.map(f=>`<div class="ctx-item ctx-folder${_folderHas(f,id)?' on':''}" onclick="event.stopPropagation();_ctxFolderToggle('${f.id}','${id}',this)">
      <span class="ctx-f-emo">${f.emoji||'📁'}</span><span style="flex:1">${esc(f.name)}</span><span class="ctx-f-chk">${check}</span></div>`).join('');
  menu.innerHTML=`<div class="ctx-item ctx-back" onclick="event.stopPropagation();showChatCtxMenuAgain()"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg><span>Добавить в папку</span></div>
    <div class="ctx-sep"></div>${rows||'<div class="ctx-empty">Папок пока нет</div>'}
    <div class="ctx-sep"></div>
    <div class="ctx-item" onclick="_ctxNewFolderWith('${id}')"><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg><span>Новая папка</span></div>`;
  [...menu.children].forEach((el,i)=>{el.style.animationDelay=(i*0.02)+'s';});
  // Меню не должно вылезать за экран после смены содержимого
  const r=menu.getBoundingClientRect();
  if(r.bottom>window.innerHeight-8)menu.style.top=Math.max(8,window.innerHeight-r.height-8)+'px';
}
// «Назад» из подменю: заново открываем основное меню на том же месте
function showChatCtxMenuAgain(){
  const m=$('chatCtxMenu');const r=m.getBoundingClientRect();
  showChatCtxMenu({preventDefault(){},stopPropagation(){},clientX:r.left,clientY:r.top},ctxTargetId);
}
function _ctxFolderToggle(fid,id,row){
  const f=myFolders.find(x=>x.id===fid);if(!f)return;
  f.chats=f.chats||[];f.exclude=f.exclude||[];
  if(_folderHas(f,id)){
    f.chats=f.chats.filter(x=>x!==id);
    if(_folderHas(f,id))f.exclude.push(id); // попадает по типу — исключаем явно
  }else{
    f.exclude=f.exclude.filter(x=>x!==id);
    if(!_folderHas(f,id))f.chats.push(id);
  }
  _foldersSave();
  row.classList.toggle('on',_folderHas(f,id));
}
function _ctxNewFolderWith(id){
  $('chatCtxMenu')?.classList.remove('show');
  openMyProfilePanel();
  setTimeout(()=>{_spFolders();setTimeout(()=>{_spFolderEdit();_fDraft.chats=[id];$('fdChats').innerHTML=_fdChatsHtml();},420);},250);
}

// ════════════════════════════════════════
// ── АРХИВ: вытягивается сверху списка, открывается своей панелью ──
// ════════════════════════════════════════
const _ARC_SVG=`<svg class="arc-ico" viewBox="0 0 24 24"><path class="arc-box" d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.81.97H5.44l.8-.97zM5 19V8h14v11H5z"/><path class="arc-arrow" d="M13.45 10h-2.9v3H8l4 4 4-4h-2.55z"/></svg>`;
let _arcShown=false;
function _arcCount(){return $('archiveList')?.querySelectorAll('.sb-item').length||0;}
function _arcInit(){
  const list=$('sbList'),arcList=$('archiveList');if(!list||!arcList)return;
  // Строка «Архив» — всегда первая в списке чатов
  let row=$('arcRow');
  if(!row){
    row=document.createElement('div');row.id='arcRow';row.className='arc-row';
    row.innerHTML=`<div class="arc-row-in" onclick="_arcOpen()" oncontextmenu="event.preventDefault();_arcHide()">
        <div class="arc-av">${_ARC_SVG}</div>
        <div class="sb-info"><div class="sb-row1"><div class="arc-title">Архив</div></div>
        <div class="sb-row2"><div class="arc-prev" id="arcPrev"></div></div></div></div>`;
    list.prepend(row);
  }
  // Старый список архива переезжает в панель архива
  $('arcBody')?.appendChild(arcList);arcList.classList.add('open');
  _arcShown=LS.get('sl_arcShown',false);
  _arcUpdate(true);
  _arcGestures(list);
}
function _arcUpdate(instant){
  const row=$('arcRow');if(!row)return;
  const n=_arcCount();
  const names=[...$('archiveList').querySelectorAll('.sb-name')].map(e=>e.textContent.trim()).filter(Boolean);
  const prev=$('arcPrev');if(prev)prev.textContent=names.slice(0,4).join(', ')||'Пусто';
  if(instant)row.style.transition='none';
  row.classList.toggle('show',_arcShown);
  if(instant){void row.offsetHeight;row.style.transition='';}
}
function _arcReveal(){
  if(_arcShown)return;
  _arcShown=true;LS.set('sl_arcShown',true);
  const row=$('arcRow');row.style.maxHeight='';row.style.opacity='';row.classList.add('show','pop');
  setTimeout(()=>row.classList.remove('pop'),700);
}
function _arcHide(){_arcShown=false;LS.set('sl_arcShown',false);$('arcRow')?.classList.remove('show');toast('Архив скрыт — потяни список вниз, чтобы вернуть');}
// Жест: тянешь список вниз, находясь в самом верху → архив вытягивается
function _arcGestures(list){
  let startY=null,pull=0,pulling=false;
  const row=$('arcRow');
  const reset=()=>{startY=null;pulling=false;row.style.transition='';row.style.opacity='';};
  list.addEventListener('touchstart',e=>{
    startY=(list.scrollTop<=0&&!_arcShown)?e.touches[0].clientY:null;pull=0;pulling=false;
  },{passive:true});
  // Не пассивный: пока тянем архив, гасим нативный «потяни чтобы обновить»,
  // иначе браузер забирает жест себе и присылает touchcancel
  list.addEventListener('touchmove',e=>{
    if(startY==null)return;
    const dy=e.touches[0].clientY-startY;
    if(!pulling&&(dy<=4||list.scrollTop>0)){if(dy<0)startY=null;return;}
    pulling=true;
    if(e.cancelable)e.preventDefault();
    pull=Math.max(0,dy);
    row.style.transition='none';row.style.maxHeight=Math.min(72,pull*.6)+'px';row.style.opacity=Math.min(1,pull/110);
  },{passive:false});
  list.addEventListener('touchend',()=>{
    if(startY==null)return;
    const ok=pulling&&pull*.6>40;reset();
    if(ok)_arcReveal();else row.style.maxHeight='';
  });
  list.addEventListener('touchcancel',()=>{if(startY==null)return;reset();row.style.maxHeight='';});
  // Колесо мыши вверх, когда список уже в самом верху
  let acc=0,t=null;
  list.addEventListener('wheel',e=>{
    if(_arcShown||list.scrollTop>0||e.deltaY>=0){acc=0;return;}
    acc+=-e.deltaY;clearTimeout(t);t=setTimeout(()=>acc=0,400);
    if(acc>160){acc=0;_arcReveal();}
  },{passive:true});
}
function _arcOpen(){
  const p=$('arcPanel');if(!p)return;
  p.classList.remove('open');void p.offsetWidth;p.classList.add('open');
  $('sidebar').classList.add('arc-open');
  [...$('archiveList').querySelectorAll('.sb-item')].forEach((el,i)=>{el.style.animation='none';void el.offsetWidth;el.style.animation=`arcItemIn .45s cubic-bezier(.32,.72,0,1) both ${120+i*40}ms`;});
}
function _arcClose(){$('arcPanel')?.classList.remove('open');$('sidebar')?.classList.remove('arc-open');}

// ════════════════════════════════════════
// ── ОСТРОВОК ЗВОНКА (жидкое стекло) ──
// Маленький, перетаскивается; тап — разворачивается с кнопками;
// «на экран» — окно звонка «высасывается» из островка.
// ════════════════════════════════════════
function _islandPos(){
  const el=$('miniCall');if(!el)return;
  const p=LS.get('sl_islandPos',null);
  const w=el.offsetWidth||124,h=el.offsetHeight||56;
  let x=p?.x??(window.innerWidth-w-20),y=p?.y??(window.innerHeight-h-100);
  x=Math.max(8,Math.min(window.innerWidth-w-8,x));y=Math.max(8,Math.min(window.innerHeight-h-8,y));
  el.style.left=x+'px';el.style.top=y+'px';
}
function _islandInit(){
  const el=$('miniCall');if(!el||el.dataset.ready)return;el.dataset.ready='1';
  let sx=0,sy=0,ox=0,oy=0,moved=false,down=false;
  el.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    down=true;moved=false;sx=e.clientX;sy=e.clientY;ox=el.offsetLeft;oy=el.offsetTop;
    el.setPointerCapture(e.pointerId);el.classList.add('grab');
  });
  el.addEventListener('pointermove',e=>{
    if(!down)return;
    const dx=e.clientX-sx,dy=e.clientY-sy;
    if(!moved&&Math.hypot(dx,dy)<5)return;
    moved=true;
    const x=Math.max(8,Math.min(window.innerWidth-el.offsetWidth-8,ox+dx));
    const y=Math.max(8,Math.min(window.innerHeight-el.offsetHeight-8,oy+dy));
    el.style.left=x+'px';el.style.top=y+'px';
  });
  const up=()=>{
    if(!down)return;down=false;el.classList.remove('grab');
    if(moved){LS.set('sl_islandPos',{x:el.offsetLeft,y:el.offsetTop});return;}
    _islandToggle(); // просто тап — разворачиваем/сворачиваем
  };
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  window.addEventListener('resize',()=>{if(el.classList.contains('show'))_islandPos();});
}
function _islandToggle(force){
  const el=$('miniCall');if(!el)return;
  const open=force??!el.classList.contains('open');
  el.classList.toggle('open',open);
  // После изменения ширины островок не должен вылезти за край экрана
  setTimeout(_islandPos,20);setTimeout(_islandPos,300);
}
// Нажатие на кнопку островка — «пружинка»
function _islandBtn(btn){btn.classList.remove('tap');void btn.offsetWidth;btn.classList.add('tap');}

// Свернуть звонок в островок: карточка звонка сжимается в точку островка
function _callMinimizeAnimated(){
  const scr=$('callScreen'),card=$('callCard'),isl=$('miniCall');
  _islandInit();
  isl.classList.remove('open');
  isl.classList.add('show','hidden-pre');_islandPos();
  const cr=card.getBoundingClientRect(),ir=isl.getBoundingClientRect();
  const dx=(ir.left+ir.width/2)-(cr.left+cr.width/2),dy=(ir.top+ir.height/2)-(cr.top+cr.height/2);
  const s=Math.max(ir.width/cr.width,.06);
  card.animate([{transform:'none',opacity:1,borderRadius:getComputedStyle(card).borderRadius},
    {transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:.15,borderRadius:'50%'}],{duration:280,easing:'cubic-bezier(.5,0,.3,1)'});
  scr.animate([{backgroundColor:getComputedStyle(scr).backgroundColor},{backgroundColor:'rgba(0,0,0,0)'}],{duration:280,easing:'ease'});
  setTimeout(()=>{
    scr.classList.remove('show');
    isl.classList.remove('hidden-pre');isl.classList.add('pop');
    setTimeout(()=>isl.classList.remove('pop'),400);
  },265);
}
// Вернуть звонок на экран: карточка «высасывается» из островка
function _callMaximizeAnimated(){
  const scr=$('callScreen'),card=$('callCard'),isl=$('miniCall');
  const ir=isl.getBoundingClientRect();
  scr.classList.add('show');
  const cr=card.getBoundingClientRect();
  const dx=(ir.left+ir.width/2)-(cr.left+cr.width/2),dy=(ir.top+ir.height/2)-(cr.top+cr.height/2);
  const s=Math.max(ir.width/cr.width,.06);
  card.animate([{transform:`translate(${dx}px,${dy}px) scale(${s},${Math.max(ir.height/cr.height,.04)})`,opacity:.3,borderRadius:'40px',filter:'blur(6px)'},
    {transform:'translate(0,0) scale(1.02)',opacity:1,borderRadius:getComputedStyle(card).borderRadius,filter:'blur(0)',offset:.8},
    {transform:'none',opacity:1,borderRadius:getComputedStyle(card).borderRadius,filter:'blur(0)'}],{duration:340,easing:'cubic-bezier(.2,.8,.2,1)'});
  scr.animate([{backgroundColor:'rgba(0,0,0,0)'},{backgroundColor:getComputedStyle(scr).backgroundColor}],{duration:280,easing:'ease'});
  isl.animate([{transform:'scale(1)',opacity:1},{transform:'scale(.6)',opacity:0}],{duration:180,easing:'ease-in'});
  setTimeout(()=>isl.classList.remove('show','open'),170);
}

// Значок «микрофон выключен» у собеседника (на аватарке и поверх его видео)
function _showPeerMute(on){
  ['callPeerMute','callPeerMuteVid'].forEach(id=>{
    const el=$(id);if(!el)return;
    if(on){el.classList.remove('hide');el.classList.add('show');}
    else if(el.classList.contains('show')){el.classList.add('hide');setTimeout(()=>el.classList.remove('show','hide'),280);}
  });
}

// ════════════════════════════════════════
// ── ИНФОРМАЦИЯ О ГРУППЕ (правая колонка, как у каналов) ──
// ════════════════════════════════════════
Object.assign(_SP_ICONS,{
  download:'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  pin:'M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z',
  bookmark:'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z',
  personAdd:'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  crown:'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z',
  group:'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  megaphone:'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z'
});

function _grpMembersText(n){return n+' '+_spPlural(n,'участник','участника','участников');}

function showGroupPanel(gid){
  const g=groups[gid];if(!g){toast('Группа не найдена');return;}
  const ov=$('chInfoOverlay');if(!ov)return;
  const isOwner=g.admin===myUsername;
  const canInvite=isOwner||!!(g.canInvite&&g.canInvite[myUsername]);
  const mems=g.members||[];
  const online=mems.filter(p=>p!==myUsername&&(_fbMode?_fbConns[p]:conns[p]?.open)).length;
  const memRow=pid=>{
    const isAdm=pid===g.admin,inv=g.canInvite&&g.canInvite[pid];
    const role=isAdm?'владелец':inv?'может приглашать':'';
    const me=pid===myUsername;
    const st=me?'это ты':_lastSeenText(pid);
    return `<div class="sp-row gp-mem" onclick="${me?'':`closePeerProfile();showPeerProfile('${pid}')`}">
      ${_spAvatarHtml(peerAvatars[pid]||(me?myAvatar:null),me?(_myFullName().trim()||myUsername):(peerNames[pid]||pid),'sp-pick-av',pid)}
      <div class="sp-row-txt"><div class="sp-row-title">${esc(me?(_myFullName().trim()||'@'+myUsername):(peerNames[pid]||'@'+pid))}</div>
        <div class="sp-row-sub${st==='в сети'?' gp-on':''}">${esc(st)}</div></div>
      ${role?`<div class="gp-role">${role}</div>`:''}
      ${isOwner&&!me?`<button class="sp-dots" onclick="event.stopPropagation();_grpMemMenu('${gid}','${pid}',this)">${_spSvg('dotsV')}</button>`:''}</div>`;
  };
  const muteRow=`<div class="sp-row" onclick="_ciToggleMute('${gid}')">${_spIco('red','bell')}
      <div class="sp-row-txt"><div class="sp-row-title">Уведомления</div></div>
      <div class="sp-switch${mutedChats[gid]?'':' on'}" id="ciMuteSw"></div></div>`;
  ov.innerHTML=`
    <div class="ci-hdr">
      <button class="sp-tb-btn" onclick="closePeerProfile()" title="Закрыть">${_spSvg('close')}</button>
      <div class="ci-title">Информация о группе</div>
      ${isOwner?`<button class="sp-tb-btn" onclick="_grpEdit('${gid}')" title="Изменить">${_spSvg('pencil')}</button>`:''}
    </div>
    <div class="ci-top">
      ${_spAvatarHtml(g.avatar,g.name||'Группа','ci-av',gid)}
      <div class="ci-name">${esc(g.name||'Группа')}</div>
      <div class="ci-subs">${_grpMembersText(mems.length)}${online?`, ${online} в сети`:''}</div>
    </div>
    <div class="sp-card">
      ${g.desc?_spRow({ico:'info',color:'gray',title:esc(g.desc).replace(/\n/g,'<br>'),sub:'Описание',cls:'sp-row-multi sp-row-static'}):''}
      ${muteRow}
    </div>
    ${_spSec('Участники',_grpMembersText(mems.length))}
    <div class="sp-card">
      ${canInvite?_spRow({ico:'personAdd',color:'blue',title:'Добавить участников',onclick:`showAddGroupMember('${gid}')`}):''}
      ${mems.map(memRow).join('')}
    </div>
    <div class="ci-tabs-wrap">${_ciTabsHtml(gid,true)}</div>`;
  _ciRenderTab(gid,ov.querySelector('.ci-tabs-wrap'));
  $('peerProfOverlay')?.classList.remove('show');
  $('peerProfBackdrop')?.classList.add('show');
  ov.scrollTop=0;ov.classList.add('show');
  _rpDock(true);
}

function _grpMemMenu(gid,pid,btn){
  const g=groups[gid];if(!g)return;
  const inv=g.canInvite&&g.canInvite[pid];
  const m=document.createElement('div');m.className='sp-menu show sp-float-menu';
  const ov=$('chInfoOverlay'),r=btn.getBoundingClientRect(),or=ov.getBoundingClientRect(),z=_zoomOf(ov);
  m.style.cssText=`position:absolute;top:${(r.bottom-or.top)/z+ov.scrollTop}px;right:${(or.right-r.right)/z}px`;
  m.innerHTML=`<button class="sp-menu-item" onclick="this.parentElement.remove();grpToggleInvite('${gid}','${pid}');setTimeout(()=>showGroupPanel('${gid}'),150)">${_spSvg('personAdd')}<span>${inv?'Запретить приглашать':'Разрешить приглашать'}</span></button>
    <button class="sp-menu-item danger" onclick="this.parentElement.remove();grpKick('${gid}','${pid}')">${_spSvg('block')}<span>Удалить из группы</span></button>`;
  ov.appendChild(m);
  setTimeout(()=>document.addEventListener('click',()=>m.remove(),{once:true}),0);
}

// Редактирование группы — прямо в правой колонке
function _grpEdit(gid){
  const g=groups[gid];if(!g||g.admin!==myUsername)return;
  const ov=$('chInfoOverlay');
  const cur=g.bgColor||'#3390ec';
  ov.innerHTML=`
    <div class="ci-hdr">
      <button class="sp-tb-btn" onclick="showGroupPanel('${gid}')" title="Назад">${_spSvg('back')}</button>
      <div class="ci-title">Изменить группу</div>
    </div>
    <div class="ep-av-wrap"><div class="ep-av" onclick="$('grpAvFileInput').click()">
      <div id="grpAvPrev" style="width:100%;height:100%">${g.avatar?`<img src="${g.avatar}" alt="" style="width:100%;height:100%;object-fit:cover">`:_avHtml(gid,g.name||'Группа')}</div>
      <div class="ep-av-cam">${_spSvg('camera')}</div></div>
      <input type="file" id="grpAvFileInput" accept="image/*" style="display:none" onchange="grpLoadAvatar('${gid}',this)"></div>
    <div class="sp-card sp-pad">
      <label class="sp-field"><input id="grpEditName" maxlength="40" value="${esc(g.name||'')}" placeholder=" "><span>Название группы</span></label>
      <label class="sp-field sp-field-ta"><textarea id="grpEditDesc" maxlength="300" placeholder=" ">${esc(g.desc||'')}</textarea><span>Описание (необязательно)</span></label>
    </div>
    ${myPremium?`${_spSec('Фон профиля')}<div class="sp-card sp-pad">
      <div class="sp-cust-colors"><label>Цвет<input type="color" id="grpColorPicker" value="${cur}"></label></div>
      <div id="grpColorPreview" style="display:none"></div>
      <div class="sp-patterns" style="margin-top:10px">
        <button class="sp-pat${!g.bgPattern?' sel':''}" id="grpPat_">Нет</button>
        ${PREMIUM_BG_PATTERNS.map(p=>`<button class="sp-pat${g.bgPattern===p.id?' sel':''}" id="grpPat_${p.id}">${p.emoji} ${p.label}</button>`).join('')}
      </div></div>`:_spHint('Цвет и узор фона группы — в SLON Premium')}
    <div style="padding:6px 12px 16px"><button class="sp-btn" onclick="saveGroupProfile('${gid}');setTimeout(()=>showGroupPanel('${gid}'),120)">Сохранить</button></div>`;
  ['', ...PREMIUM_BG_PATTERNS.map(p=>p.id)].forEach(pid=>{
    const btn=$('grpPat_'+pid);
    if(btn)btn.onclick=()=>{groups[gid].bgPattern=pid;document.querySelectorAll('[id^="grpPat_"]').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');};
  });
  ov.scrollTop=0;
}

// Иконки вместо эмодзи в меню сообщения («📋 Копировать» → значок + текст)
const _MENU_EMOJI_ICONS={'⬇️':'download','📋':'copy','⭐':'bookmark','✏️':'pencil','🗑':'trash','📌':'pin'};
function _menuLabelHtml(label){
  const m=String(label).match(/^(\S+)\s+(.+)$/);
  const ico=m&&_MENU_EMOJI_ICONS[m[1]];
  return ico?`${_spSvg(ico)}<span>${esc(m[2])}</span>`:`<span>${esc(label)}</span>`;
}

// Во сколько раз элемент увеличен CSS-зумом (для перевода координат экрана в его px)
function _zoomOf(el){return el&&el.offsetWidth?el.getBoundingClientRect().width/el.offsetWidth:1;}

// ════════════════════════════════════════
// ── УДАЛЕНИЕ ЧАТА: насовсем, без «воскрешения» после перезагрузки ──
// ════════════════════════════════════════
function _deleteChatFull(id){
  if(!id||id==='ai'||id==='saved'||id===SLON_CHANNEL_ID)return;
  // Свой канал удалить нельзя (он вернётся из Firebase) — только скрыть в архив
  if(id.startsWith('ch_')&&myChannels[id]&&(!myChannels[id].owner||myChannels[id].owner===myUsername)){
    toast('Свой канал нельзя удалить — можно убрать его в архив');return;
  }
  const db=window._fbDb;
  if(id.startsWith('g_')){
    delete groups[id];delete grpHist[id];
    try{_grpMsgListeners?.[id]?.();delete _grpMsgListeners[id];}catch(e){}
    // Иначе группа приедет обратно из синхронизации между устройствами
    if(db&&myUsername)window._fbRemove(window._fbRef(db,'user_groups/'+myUsername+'/'+id)).catch(()=>{});
  }else if(id.startsWith('ch_')){
    const u=id.slice(3);
    delete subscribedChannels[id];delete chatHist[id];
    try{_myChannelListeners?.[id]?.();delete _myChannelListeners[id];}catch(e){}
    if(db&&myUsername){
      window._fbRemove(window._fbRef(db,'channel_subs/'+u+'/'+myUsername)).catch(()=>{});
      window._fbRemove(window._fbRef(db,'channel_subs_by_user/'+myUsername+'/'+u)).catch(()=>{});
    }
  }else{
    delete chatHist[id];
    try{_profileWatchers?.[id]?.();delete _profileWatchers[id];}catch(e){}
    try{_presenceWatchers?.[id]?.();delete _presenceWatchers[id];}catch(e){}
  }
  delete peerNames[id];delete peerAvatars[id];
  delete archivedChats[id];delete pinnedChats[id];delete mutedChats[id];
  // Убираем и из папок
  (myFolders||[]).forEach(f=>{f.chats=(f.chats||[]).filter(x=>x!==id);f.exclude=(f.exclude||[]).filter(x=>x!==id);});
  if(typeof _foldersSave==='function'&&myFolders?.length)_foldersSave();
  const el=$('si-'+id);
  if(el){el.style.transition='opacity .22s,transform .22s';el.style.opacity='0';el.style.transform='translateX(-24px)';setTimeout(()=>el.remove(),220);}
  if(activeChat===id)openChat('ai');
  closePeerProfile?.();
  saveAll();
  if(typeof _arcUpdate==='function')setTimeout(_arcUpdate,240);
  toast('Чат удалён');
}

// Сообщения, которые МОГУТ создать новый чат (настоящее сообщение/звонок/приглашение).
// Служебные (hello, typing, read, мьют…) от незнакомого/удалённого — игнорируем,
// иначе удалённый чат воскресает, когда собеседник просто заходит в сеть.
const _CHAT_CREATING_TYPES=new Set(['msg','media_start','media_url','media_rtdb','file_start','call_incoming','call_offer','group_invite','group_add']);
function _mayCreateChat(payload){return !!payload&&_CHAT_CREATING_TYPES.has(payload.type);}

// Сторож видео звонка: если видео собеседника «показывается», но кадров нет — пересобираем поток
setInterval(()=>{
  if(typeof activeCall==='undefined'||!activeCall)return;
  const rv=$('remoteVideo'),w=$('callVidWrap');
  if(!rv||!w||!w.classList.contains('show'))return;
  if(rv.readyState<2||rv.videoWidth===0){
    rv._stall=(rv._stall||0)+1;
    if(rv._stall>=2){rv._stall=0;rv._needRefresh=true;try{_updateRemoteVideoUI();}catch(e){}}
  }else rv._stall=0;
},1500);

// ── ЗАПУСК ──
document.addEventListener('DOMContentLoaded',()=>{
  _perfLoad();
  // Кнопка «вниз» появляется, когда прокрутил историю вверх
  const msgs=$('msgs'),sdb=$('scrollDownBtn');
  if(msgs&&sdb)msgs.addEventListener('scroll',()=>sdb.classList.toggle('show',msgs.scrollHeight-msgs.scrollTop-msgs.clientHeight>300),{passive:true});
  if(!myUsername)return;
  _foldersLoad();
  myStickerCfg=LS.get(_getAccountPrefix(myUsername)+'stickerCfg',{})||{};
  _renderFolderTabs();_applyFolderFilter();
  _arcInit();
  _islandInit();
  // Старые сохранённые названия каналов были с эмодзи «📢 »/«🐘 » — чистим
  Object.keys(peerNames).forEach(id=>{
    if(!_isChannelId(id))return;
    const clean=String(peerNames[id]).replace(/^(📢|🐘)\s*/u,'');
    if(clean!==peerNames[id]){peerNames[id]=clean;updateSbName(id);}
  });
  // Новые/перерисованные чаты в списке — снова применяем фильтр папки
  const list=$('sbList');
  if(list){let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(_applyFolderFilter,60);}).observe(list,{childList:true,subtree:true,characterData:true});}
  // Сеанс устройства регистрируем, когда Firebase подключится
  const w=setInterval(()=>{if(_fbMode){clearInterval(w);_sessStart();}},1000);
});
