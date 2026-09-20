// ════════════════════════════════════════
// ── ИСТОРИИ: лента, публикация, редактор, просмотр ──
// Firebase: stories/{user}/{id} = {ts,cap,thumb} · story_media/{user}/{id} = картинка
//           story_views/{user}/{id}/{viewer} = ts
// ════════════════════════════════════════
const ST_TTL=24*3600*1000, ST_DUR=6000;
let _stAll={};            // {user:[{id,ts,cap,thumb}]}, по возрастанию времени
let _stMediaCache={};     // {user/id: dataURL}
let _stPollT=0;

function _stSeenMap(){ return LS.get('sl_u_'+myUsername+'_stSeen',{}); }
function _stMarkSeen(u,id){ const m=_stSeenMap();m[u+'/'+id]=Date.now();
  // чистим старое
  const lim=Date.now()-ST_TTL*2;Object.keys(m).forEach(k=>{if(m[k]<lim)delete m[k];});
  LS.set('sl_u_'+myUsername+'_stSeen',m); }
function _stUserSeen(u){ const m=_stSeenMap();return (_stAll[u]||[]).every(s=>m[u+'/'+s.id]); }
function _stIsMob(){ return window.innerWidth<=640||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
function _stName(u){ return u===myUsername?'Моя история':(peerNames[u]||u); }
function _stAvSrc(u){ return u===myUsername?myAvatar:(peerAvatars?.[u]||null); }
function _stAgo(ts){ const d=Math.max(0,Date.now()-ts)/60000;
  if(d<1)return 'только что'; if(d<60)return Math.floor(d)+' мин назад'; return Math.floor(d/60)+' ч назад'; }

// Контакты, чьи истории показываем
function _stContacts(){
  return Object.keys(peerNames||{}).filter(p=>p&&p!==myUsername&&p!=='slon_channel'&&!myChannels?.[p]&&!groups?.[p]&&!/^(g_|ch_|vr_)/.test(p)&&/^[a-z0-9_]{3,20}$/i.test(p));
}
async function _stLoadUser(u){
  const snap=await _fbOnce('stories/'+u,6000);
  const v=snap&&snap.val?snap.val():null;
  const now=Date.now(),list=[];
  if(v)Object.keys(v).forEach(id=>{const s=v[id];if(!s||!s.ts)return;
    if(now-s.ts<ST_TTL)list.push({id,ts:s.ts,cap:s.cap||'',thumb:s.thumb||''});
    else if(u===myUsername){ // своё просроченное — удаляем
      window._fbRemove?.(window._fbRef(window._fbDb,'stories/'+u+'/'+id));
      window._fbRemove?.(window._fbRef(window._fbDb,'story_media/'+u+'/'+id));
      window._fbRemove?.(window._fbRef(window._fbDb,'story_views/'+u+'/'+id)); }
  });
  list.sort((a,b)=>a.ts-b.ts);
  if(list.length)_stAll[u]=list;else delete _stAll[u];
}
async function _stLoad(){
  if(!myUsername||!window._fbDb)return;
  await Promise.all([myUsername,..._stContacts()].map(u=>_stLoadUser(u).catch(()=>{})));
  _stRender();
}
function _stStartPoll(){ clearInterval(_stPollT);_stLoad();_stPollT=setInterval(_stLoad,90000); }

// ── Лента историй над списком чатов ──
function _stRender(){
  const strip=$('stStrip');if(!strip)return;
  const users=_stContacts().filter(u=>_stAll[u]);
  // непросмотренные — первыми, дальше по свежести
  users.sort((a,b)=>(_stUserSeen(a)-_stUserSeen(b))||(_stAll[b].at(-1).ts-_stAll[a].at(-1).ts));
  const mine=_stAll[myUsername];
  const item=(u,own)=>{
    const has=!!_stAll[u],seen=has&&_stUserSeen(u);
    const ring=has?(seen?'seen':'new'):'none';
    return `<div class="st-item" onclick="${own&&!has?'_stAdd()':`_stOpen('${u}')`}">
      <div class="st-ring ${ring}">${_spAvatarHtml(_stAvSrc(u),own?(myNick||myUsername):_stName(u),'st-av',u)}
        ${own?`<span class="st-plus" onclick="event.stopPropagation();_stAdd()"><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></span>`:''}</div>
      <div class="st-nm">${esc(own?'Моя история':_stName(u))}</div></div>`;
  };
  strip.innerHTML=item(myUsername,true)+users.map(u=>item(u,false)).join('');
  strip.classList.toggle('has',users.length>0||!!mine);
  // Кружок в шапке: первая непросмотренная история контакта
  const ringEl=$('sbStoryRing'),av=$('sbStoryAv');
  if(ringEl&&av){
    const u=users[0];
    if(u){av.classList.remove('sb-story-empty');av.innerHTML=_spAvatarHtml(_stAvSrc(u),_stName(u),'st-mini',u);}
    else{av.classList.add('sb-story-empty');av.innerHTML='<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:var(--text2)"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';}
    ringEl.classList.toggle('seen',!u||_stUserSeen(u));
    ringEl.classList.toggle('has',!!u);
  }
}
// Клик по кружку в шапке
function _onStoryRingClick(){
  const u=_stContacts().filter(x=>_stAll[x]).sort((a,b)=>_stUserSeen(a)-_stUserSeen(b))[0];
  if(u)_stOpen(u);else _stAdd();
}
function _updateStoryAvatar(){ _stRender(); }

// ── Публикация: камера/галерея на телефоне, выбор файла на ПК ──
function _stPick(camera){
  const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  if(camera)inp.setAttribute('capture','environment');
  inp.onchange=()=>{const f=inp.files&&inp.files[0];if(f)_stEdOpen(f);};
  inp.click();
}
function _stAdd(){
  if(!_stIsMob()){_stPick(false);return;}
  // Нижняя шторка: камера / галерея
  let sh=$('stSheet');
  if(!sh){sh=document.createElement('div');sh.id='stSheet';sh.className='st-sheet';
    sh.innerHTML=`<div class="st-sheet-bd" onclick="_stSheetClose()"></div>
      <div class="st-sheet-card">
        <div class="st-sheet-t">Новая история</div>
        <button onclick="_stSheetClose();_stPick(true)"><svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>Камера</button>
        <button onclick="_stSheetClose();_stPick(false)"><svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>Галерея</button>
        <button class="st-sheet-cancel" onclick="_stSheetClose()">Отмена</button>
      </div>`;
    document.body.appendChild(sh);}
  requestAnimationFrame(()=>sh.classList.add('show'));
}
function _stSheetClose(){ $('stSheet')?.classList.remove('show'); }

// ── Редактор ──
let _stEd=null; // {img, url, items:[{el,x,y,text,size,color,mode,emoji}], editing}
const ST_COLORS=['#ffffff','#000000','#3390ec','#34c759','#ffcc00','#ff9500','#ff3b30','#af52de'];
const ST_EMOJI='😀 😂 🥰 😍 😎 🤩 🥳 😭 😡 🤯 😴 🤔 🙃 😇 🤗 🫶 👍 👎 👏 🙏 💪 🔥 ✨ ⭐ 🌈 ☀️ 🌙 ❄️ 🌊 🌸 🍀 🍕 🍔 🍩 🍺 ☕ 🎉 🎂 🎁 🎮 🎧 🎵 📸 ✈️ 🚗 🏖️ 🏔️ ❤️ 🧡 💛 💚 💙 💜 🖤 💯 ✅ ❌ ⚡ 💥 🐘 🐶 🐱 🦊 🐼 🦄'.split(' ');

function _stEdOpen(file){
  if(!/^image\//.test(file.type)){toast('Пока можно выложить только фото');return;}
  const url=URL.createObjectURL(file);
  const img=new Image();
  img.onload=()=>{
    _stEdClose(true);
    const ov=document.createElement('div');ov.className='st-ed';ov.id='stEd';
    ov.innerHTML=`<div class="st-ed-box">
      <div class="st-stage" id="stStage"><img class="st-bg" src="${url}" alt="" draggable="false"><img class="st-fg" src="${url}" alt="" draggable="false"><div class="st-layer" id="stLayer"></div>
        <div class="st-trash" id="stTrash"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></div></div>
      <div class="st-ed-top">
        <button class="st-ib" onclick="_stEdClose()" title="Закрыть"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
        <div class="st-ed-title">Новая история</div>
        <button class="st-ib" onclick="_stTextAdd()" title="Текст"><b class="st-aa">Aa</b></button>
        <button class="st-ib" onclick="_stEmojiToggle()" title="Эмодзи"><svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg></button>
      </div>
      <div class="st-emoji" id="stEmoji">${ST_EMOJI.map(e=>`<span onclick="_stEmojiAdd('${e}')">${e}</span>`).join('')}</div>
      <div class="st-txbar" id="stTxbar">
        <button class="st-ib st-mode" id="stModeBtn" onclick="_stTextMode()" title="Фон текста"><b>A</b></button>
        <div class="st-cols">${ST_COLORS.map(c=>`<span style="background:${c}" onclick="_stTextColor('${c}')"></span>`).join('')}</div>
        <button class="st-done" onclick="_stTextDone()">Готово</button>
      </div>
      <div class="st-ed-bot">
        <input class="st-cap" id="stCap" placeholder="Добавить подпись…" maxlength="200" onkeydown="if(event.key==='Enter')_stPublish()">
        <button class="st-send" id="stSend" onclick="_stPublish()" title="Опубликовать"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
      </div></div>`;
    document.body.appendChild(ov);
    _stEd={img,url,items:[],editing:null};
    requestAnimationFrame(()=>ov.classList.add('show'));
  };
  img.onerror=()=>{URL.revokeObjectURL(url);toast('Не удалось открыть картинку');};
  img.src=url;
}
function _stEdClose(instant){
  const ov=$('stEd');if(!ov)return;
  const url=_stEd?.url;_stEd=null;
  if(instant){ov.remove();if(url)URL.revokeObjectURL(url);return;}
  ov.classList.remove('show');
  setTimeout(()=>{ov.remove();if(url)URL.revokeObjectURL(url);},320);
}

// ── Элементы поверх фото: текст и эмодзи ──
function _stLum(hex){const n=parseInt(hex.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;return (r*.299+g*.587+b*.114)/255;}
function _stHexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}
// Цвет текста и фона для режима: 0 — без фона, 1 — сплошной, 2 — полупрозрачный
function _stColors(it){
  if(it.emoji||it.mode===0)return {fg:it.color,bg:''};
  if(it.mode===1)return {fg:_stLum(it.color)>.6?'#000':'#fff',bg:it.color};
  return {fg:_stLum(it.color)>.6?'#000':'#fff',bg:_stHexA(it.color,.5)};
}
function _stStyle(it){
  const el=it.el,tx=el.firstChild,c=_stColors(it);
  el.style.left=(it.x*100)+'%';el.style.top=(it.y*100)+'%';
  el.style.fontSize=(it.size*100)+'cqw';
  tx.style.color=c.fg;tx.style.background=c.bg;
  el.classList.toggle('st-shadow',!it.emoji&&it.mode===0);
  const mb=$('stModeBtn');if(mb&&_stEd?.editing===it)mb.dataset.mode=it.mode;
}
function _stNewItem(o){
  const it=Object.assign({x:.5,y:.4,text:'',size:.08,color:'#ffffff',mode:1,emoji:false},o);
  const el=document.createElement('div');el.className='st-it'+(it.emoji?' st-emo':'');
  el.innerHTML='<span class="st-tx"></span>';el.firstChild.textContent=it.text;
  it.el=el;$('stLayer').appendChild(el);_stStyle(it);_stBindDrag(it);
  _stEd.items.push(it);
  requestAnimationFrame(()=>el.classList.add('in'));
  return it;
}
function _stTextAdd(){ if(!_stEd)return; _stEmojiToggle(false);
  const it=_stNewItem({y:.42});_stTextEdit(it); }
function _stTextEdit(it){
  const ov=$('stEd');_stEd.editing=it;ov.classList.add('editing');it.el.classList.add('edit');
  const tx=it.el.firstChild;tx.contentEditable='plaintext-only';
  if(tx.contentEditable!=='plaintext-only')tx.contentEditable='true';
  tx.onpaste=e=>{e.preventDefault();document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text'));};
  tx.onkeydown=e=>{if(e.key==='Escape')_stTextDone();};
  _stStyle(it);setTimeout(()=>{tx.focus();const r=document.createRange();r.selectNodeContents(tx);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r);},30);
}
function _stTextDone(){
  const it=_stEd?.editing;if(!it)return;
  const tx=it.el.firstChild;it.text=tx.innerText.replace(/\n$/,'').trim();
  tx.contentEditable='false';tx.blur();it.el.classList.remove('edit');
  $('stEd').classList.remove('editing');_stEd.editing=null;
  if(!it.text)_stRemoveItem(it);
}
function _stTextMode(){ const it=_stEd?.editing;if(!it)return;it.mode=(it.mode+1)%3;_stStyle(it);it.el.firstChild.focus(); }
function _stTextColor(c){ const it=_stEd?.editing;if(!it)return;it.color=c;_stStyle(it);it.el.firstChild.focus(); }
function _stEmojiToggle(force){
  const p=$('stEmoji');if(!p)return;
  p.classList.toggle('show',force===undefined?!p.classList.contains('show'):force);
}
function _stEmojiAdd(e){
  _stEmojiToggle(false);
  const n=_stEd.items.length;
  _stNewItem({text:e,emoji:true,size:.16,x:.5+((n%3)-1)*.08,y:.5+((n%4)-1.5)*.05});
}
function _stRemoveItem(it){
  it.el.classList.add('out');setTimeout(()=>it.el.remove(),220);
  _stEd.items=_stEd.items.filter(x=>x!==it);
}
// Перетаскивание, щипок для масштаба, колесо на ПК, удаление в корзину
function _stBindDrag(it){
  const el=it.el,pts=new Map();let start=null,moved=false,pinch=null;
  const stage=()=>$('stStage').getBoundingClientRect();
  const overTrash=(x,y)=>{const r=$('stTrash').getBoundingClientRect();return x>r.left-20&&x<r.right+20&&y>r.top-20&&y<r.bottom+20;};
  el.addEventListener('pointerdown',e=>{
    if(_stEd?.editing)return;
    e.preventDefault();el.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){start={x:e.clientX,y:e.clientY,ix:it.x,iy:it.y};moved=false;}
    if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:it.size};}
    el.classList.add('drag');
  });
  el.addEventListener('pointermove',e=>{
    if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size>=2&&pinch){const [a,b]=[...pts.values()];
      it.size=Math.max(.03,Math.min(.5,pinch.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));moved=true;_stStyle(it);return;}
    if(!start)return;
    const dx=e.clientX-start.x,dy=e.clientY-start.y;
    if(!moved&&Math.hypot(dx,dy)<5)return;
    if(!moved){moved=true;$('stEd').classList.add('dragging');}
    const r=stage();
    it.x=Math.max(0,Math.min(1,start.ix+dx/r.width));it.y=Math.max(0,Math.min(1,start.iy+dy/r.height));
    _stStyle(it);
    const ot=overTrash(e.clientX,e.clientY);$('stTrash').classList.toggle('hot',ot);el.classList.toggle('del',ot);
  });
  const up=e=>{
    if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);
    if(pts.size===1){pinch=null;const p=[...pts.values()][0];start={x:p.x,y:p.y,ix:it.x,iy:it.y};return;}
    if(pts.size)return;
    el.classList.remove('drag');$('stEd')?.classList.remove('dragging');$('stTrash')?.classList.remove('hot');
    if(moved&&e.type==='pointerup'&&overTrash(e.clientX,e.clientY)){_stRemoveItem(it);return;}
    el.classList.remove('del');
    if(!moved&&!it.emoji)_stTextEdit(it);
    start=null;pinch=null;
  };
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('wheel',e=>{if(_stEd?.editing)return;e.preventDefault();
    it.size=Math.max(.03,Math.min(.5,it.size*(e.deltaY<0?1.08:1/1.08)));_stStyle(it);},{passive:false});
}

// ── Сборка картинки 1080×1920 и публикация ──
function _stRenderCanvas(){
  const W=1080,H=1920,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d'),img=_stEd.img;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  const iw0=img.naturalWidth,ih0=img.naturalHeight;
  // Фон — фото «cover» с размытием, чтобы не было чёрных полос
  const kc=Math.max(W/iw0,H/ih0);
  ctx.save();ctx.filter='blur(28px)';ctx.globalAlpha=.9;
  ctx.drawImage(img,(W-iw0*kc)/2,(H-ih0*kc)/2,iw0*kc,ih0*kc);
  ctx.restore();
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(0,0,W,H);
  // Само фото — «contain», целиком помещается в кадр (горизонтальные не обрезаются)
  const kf=Math.min(W/iw0,H/ih0),iw=iw0*kf,ih=ih0*kf;
  ctx.drawImage(img,(W-iw)/2,(H-ih)/2,iw,ih);
  _stEd.items.forEach(it=>{
    const px=it.size*W,lh=px*1.25,lines=it.text.split('\n'),c=_stColors(it);
    ctx.font=`${it.emoji?400:600} ${px}px Roboto, "Segoe UI", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    const cx=it.x*W,top=it.y*H-lines.length*lh/2,padX=px*.35,rad=px*.28;
    lines.forEach((ln,i)=>{
      const cy=top+lh*i+lh/2;
      if(c.bg&&ln.trim()){const w=ctx.measureText(ln).width;
        ctx.fillStyle=c.bg;ctx.beginPath();
        const x0=cx-w/2-padX,y0=cy-lh/2-px*.06,bw=w+padX*2,bh=lh+px*.12;
        if(ctx.roundRect)ctx.roundRect(x0,y0,bw,bh,rad);else ctx.rect(x0,y0,bw,bh);
        ctx.fill();}
      ctx.save();
      if(!it.emoji&&it.mode===0){ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=px*.25;ctx.shadowOffsetY=px*.04;}
      ctx.fillStyle=c.fg;ctx.fillText(ln,cx,cy);ctx.restore();
    });
  });
  return cv;
}
async function _stPublish(){
  if(!_stEd||_stEd.busy)return;
  if(_stEd.editing)_stTextDone();
  if(!window._fbDb||!myUsername){toast('Нет подключения');return;}
  _stEd.busy=true;const btn=$('stSend');btn.classList.add('busy');
  try{
    const cv=_stRenderCanvas();
    let q=.85,full=cv.toDataURL('image/jpeg',q);
    while(full.length>1500000&&q>.4){q-=.12;full=cv.toDataURL('image/jpeg',q);}
    const tc=document.createElement('canvas');tc.width=180;tc.height=320;
    tc.getContext('2d').drawImage(cv,0,0,180,320);
    const thumb=tc.toDataURL('image/jpeg',.7);
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const cap=($('stCap').value||'').trim().slice(0,200);
    await window._fbSet(window._fbRef(window._fbDb,'story_media/'+myUsername+'/'+id),full);
    await window._fbSet(window._fbRef(window._fbDb,'stories/'+myUsername+'/'+id),{ts:Date.now(),cap,thumb});
    _stMediaCache[myUsername+'/'+id]=full;
    (_stAll[myUsername]=_stAll[myUsername]||[]).push({id,ts:Date.now(),cap,thumb});
    _stMarkSeen(myUsername,id);
    _stEdClose();_stRender();
    toast('История опубликована');
  }catch(e){
    console.warn('[SLON] Ошибка публикации истории:',e);
    toast('Не удалось опубликовать историю');
    if(_stEd){_stEd.busy=false;btn.classList.remove('busy');}
  }
}

// ── Просмотр историй ──
let _stV=null; // {users,ui,si,el,elapsed,last,paused,loaded,raf}
function _stOpen(u){
  if(!_stAll[u])return;
  const others=u===myUsername?[]:_stContacts().filter(x=>_stAll[x]&&x!==u)
    .sort((a,b)=>(_stUserSeen(a)-_stUserSeen(b))||(_stAll[b].at(-1).ts-_stAll[a].at(-1).ts));
  const users=[u,...others];
  const v=document.createElement('div');v.className='st-view';v.id='stView';
  v.innerHTML=`<div class="st-v-bd" onclick="_stClose()"></div>
    <button class="st-v-nav prev" onclick="_stPrevUser()"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
    <div class="st-v-card" id="stVCard">
      <div class="st-v-media"><img class="st-v-blur" id="stVBlur" alt=""><img class="st-v-img" id="stVImg" alt=""></div>
      <div class="st-v-shade"></div>
      <div class="st-v-bars" id="stVBars"></div>
      <div class="st-v-hdr"><div id="stVAv"></div><div class="st-v-who"><b id="stVName"></b><span id="stVTime"></span></div>
        <button class="st-ib" id="stVDel" onclick="event.stopPropagation();_stDelete()" title="Удалить"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        <button class="st-ib" onclick="event.stopPropagation();_stClose()" title="Закрыть"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
      <div class="st-v-cap" id="stVCap"></div>
      <div class="st-v-views" id="stVViews"></div>
    </div>
    <button class="st-v-nav next" onclick="_stNextUser()"><svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></button>`;
  document.body.appendChild(v);
  const first=_stAll[u].findIndex(s=>!_stSeenMap()[u+'/'+s.id]);
  _stV={users,ui:0,si:first<0?0:first,el:v,elapsed:0,last:performance.now(),paused:false,loaded:false,raf:0};
  _stBindView();_stShow();
  requestAnimationFrame(()=>v.classList.add('show'));
  _stV.raf=requestAnimationFrame(_stTick);
}
function _stCur(){ const u=_stV.users[_stV.ui];return {u,s:(_stAll[u]||[])[_stV.si]}; }
function _stShow(dir){
  const {u,s}=_stCur();if(!s){_stClose();return;}
  const list=_stAll[u];
  $('stVBars').innerHTML=list.map((_,i)=>`<i><b style="transform:scaleX(${i<_stV.si?1:0})"></b></i>`).join('');
  $('stVAv').innerHTML=_spAvatarHtml(_stAvSrc(u),u===myUsername?(myNick||myUsername):_stName(u),'st-v-av',u);
  $('stVName').textContent=u===myUsername?'Моя история':_stName(u);
  $('stVTime').textContent=_stAgo(s.ts);
  $('stVCap').textContent=s.cap||'';$('stVCap').style.display=s.cap?'':'none';
  $('stVDel').style.display=u===myUsername?'':'none';
  const vw=$('stVViews');vw.style.display=u===myUsername?'':'none';vw.textContent='';
  if(dir){const c=$('stVCard');c.classList.remove('sl-l','sl-r');void c.offsetWidth;c.classList.add(dir>0?'sl-r':'sl-l');}
  _stV.elapsed=0;_stV.loaded=false;
  const img=$('stVImg'),blur=$('stVBlur'),key=u+'/'+s.id;
  blur.src=s.thumb||'';img.classList.remove('ok');img.removeAttribute('src');
  const put=src=>{ if(!_stV||_stCur().s!==s)return; img.onload=()=>{img.classList.add('ok');if(_stV)_stV.loaded=true;}; img.src=src; };
  if(_stMediaCache[key])put(_stMediaCache[key]);
  else _fbOnce('story_media/'+key,15000).then(sn=>{const d=sn&&sn.val&&sn.val();if(d){_stMediaCache[key]=d;put(d);}else if(_stV&&_stCur().s===s){put(s.thumb);}});
  _stMarkSeen(u,s.id);
  if(u!==myUsername)window._fbSet?.(window._fbRef(window._fbDb,'story_views/'+key+'/'+myUsername),Date.now());
  else _fbOnce('story_views/'+key).then(sn=>{if(!_stV||_stCur().s!==s)return;const n=sn&&sn.exists&&sn.exists()?sn.numChildren():0;
    vw.innerHTML=`<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>${n?n+' '+_stPlural(n):'Пока никто не смотрел'}`;});
  $('stView').querySelector('.prev').style.visibility=_stV.ui>0?'':'hidden';
  $('stView').querySelector('.next').style.visibility=_stV.ui<_stV.users.length-1?'':'hidden';
}
function _stPlural(n){const a=n%10,b=n%100;return a===1&&b!==11?'просмотр':a>=2&&a<=4&&(b<10||b>=20)?'просмотра':'просмотров';}
function _stTick(now){
  if(!_stV)return;
  const dt=now-_stV.last;_stV.last=now;
  if(!_stV.paused&&_stV.loaded&&!document.hidden){
    _stV.elapsed+=dt;
    const bar=$('stVBars')?.children[_stV.si]?.firstChild;
    if(bar)bar.style.transform=`scaleX(${Math.min(1,_stV.elapsed/ST_DUR)})`;
    if(_stV.elapsed>=ST_DUR)_stNext();
  }
  if(_stV)_stV.raf=requestAnimationFrame(_stTick);
}
function _stNext(){ if(!_stV)return;
  if(_stV.si<(_stAll[_stV.users[_stV.ui]]||[]).length-1){_stV.si++;_stShow();}else _stNextUser(); }
function _stPrev(){ if(!_stV)return;
  if(_stV.si>0){_stV.si--;_stShow();}else if(_stV.ui>0)_stPrevUser(true);else{_stV.elapsed=0;} }
function _stNextUser(){ if(!_stV)return; if(_stV.ui>=_stV.users.length-1){_stClose();return;}
  _stV.ui++;const l=_stAll[_stV.users[_stV.ui]]||[];const f=l.findIndex(s=>!_stSeenMap()[_stV.users[_stV.ui]+'/'+s.id]);
  _stV.si=f<0?0:f;_stShow(1); }
function _stPrevUser(toLast){ if(!_stV||_stV.ui<=0)return; _stV.ui--;
  _stV.si=toLast?(_stAll[_stV.users[_stV.ui]]||[1]).length-1:0;_stShow(-1); }
function _stClose(){
  if(!_stV)return;const v=_stV.el;cancelAnimationFrame(_stV.raf);_stV=null;
  document.removeEventListener('keydown',_stKey);
  v.classList.remove('show');setTimeout(()=>v.remove(),300);_stRender();
}
function _stKey(e){ if(!_stV)return;
  if(e.key==='Escape')_stClose();else if(e.key==='ArrowRight')_stNext();else if(e.key==='ArrowLeft')_stPrev();
  else if(e.key===' '){e.preventDefault();_stV.paused=!_stV.paused;} }
// Касания: слева/справа — листать, удержание — пауза, свайп вниз — закрыть
function _stBindView(){
  const card=$('stVCard');let p=null,holdT=0;
  document.addEventListener('keydown',_stKey);
  card.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    p={x:e.clientX,y:e.clientY,t:performance.now(),dy:0};
    holdT=setTimeout(()=>{if(_stV){_stV.paused=true;card.classList.add('held');}},180);
  });
  card.addEventListener('pointermove',e=>{
    if(!p)return;const dy=e.clientY-p.y;
    if(dy>10&&Math.abs(dy)>Math.abs(e.clientX-p.x)){p.dy=dy;card.style.transition='none';
      card.style.transform=`translateY(${dy}px) scale(${1-Math.min(dy,400)/2000})`;}
  });
  const end=e=>{
    if(!p)return;clearTimeout(holdT);card.classList.remove('held');
    const held=_stV?.paused&&performance.now()-p.t>180,dy=p.dy;p=null;
    card.style.transition='';card.style.transform='';
    if(!_stV)return;_stV.paused=false;
    if(dy>110){_stClose();return;}
    if(dy>10||held||e.type==='pointercancel')return;
    const r=card.getBoundingClientRect();
    if(e.clientX-r.left<r.width*.33)_stPrev();else _stNext();
  };
  card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);
}
async function _stDelete(){
  const {u,s}=_stCur();if(u!==myUsername||!s)return;
  _stV.paused=true;
  if(!confirm('Удалить эту историю?')){if(_stV)_stV.paused=false;return;}
  ['stories','story_media','story_views'].forEach(k=>window._fbRemove?.(window._fbRef(window._fbDb,k+'/'+u+'/'+s.id)));
  _stAll[u]=_stAll[u].filter(x=>x!==s);if(!_stAll[u].length)delete _stAll[u];
  toast('История удалена');
  if(!_stAll[u]){_stClose();return;}
  _stV.si=Math.min(_stV.si,_stAll[u].length-1);_stV.paused=false;_stShow();
}

// ── Запуск: лента над чатами, загрузка после входа ──
document.addEventListener('DOMContentLoaded',()=>{
  const list=$('sbList');
  if(list&&!$('stStrip')){const s=document.createElement('div');s.className='st-strip';s.id='stStrip';list.parentNode.insertBefore(s,list);}
  $('sbStoryBtn')?.addEventListener('click',_onStoryRingClick);
  $('sbStoryBtn')?.setAttribute('title','Истории');
  const t=setInterval(()=>{if(myUsername&&window._fbDb){clearInterval(t);_stRender();_stStartPoll();}},1500);
});
