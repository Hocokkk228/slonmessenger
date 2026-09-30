// ════════ Телефон: док «жидкое стекло» ════════
// Один док на всех экранах, кроме открытого чата. Две страницы, как ярлыки в ОС:
//  • основная — Чаты / Контакты / Музыка / Настройки;
//  • музыка — Главная / Поиск / Медиатека (появляется, когда открыта музыка).
// Выбранная вкладка — «капля», которая перетекает между кнопками с растяжением.
// Свайп по доку влево/вправо — на другую страницу (из музыки — обратно к чатам).
(function(){
  const mob=()=>window.innerWidth<=640;
  const ICO={
    chats:'<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>',
    contacts:'<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
    music:'<svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><path d="M19.14 12.94a7.14 7.14 0 0 0 0-1.88l2.03-1.58-1.92-3.32-2.39.96a7 7 0 0 0-1.63-.94L14.9 3.5h-3.8l-.37 2.68c-.59.24-1.13.55-1.63.94l-2.39-.96-1.92 3.32 2.03 1.58a7.14 7.14 0 0 0 0 1.88L4.79 14.5l1.92 3.32 2.39-.96c.5.39 1.04.7 1.63.94l.37 2.7h3.8l.37-2.7c.59-.24 1.13-.55 1.63-.94l2.39.96 1.92-3.32zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>',
    home:'<svg viewBox="0 0 24 24"><path d="M12 3 3 10.5V21h6.5v-6h5v6H21V10.5z"/></svg>',
    search:'<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
    lib:'<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>'
  };
  const PAGES={
    main:[['chats','Чаты'],['contacts','Контакты'],['music','Музыка'],['settings','Настройки']],
    music:[['home','Главная'],['search','Поиск'],['lib','Медиатека']]
  };
  let dock=null,page='main',active='chats';
  function build(){
    dock=document.createElement('nav');dock.id='sDock';dock.className='sdock';
    dock.innerHTML='<div class="sdock-glass"></div><div class="sdock-ind"></div>'+
      Object.entries(PAGES).map(([p,tabs])=>`<div class="sdock-page" data-p="${p}">${tabs.map(([k,t])=>
        `<button data-k="${k}" onclick="_dockTap('${p}','${k}')"><span class="sdk-ico${k==='settings'?' sdk-av':''}">${ICO[k]}${k==='chats'?'<b class="sdk-badge"></b>':''}</span><span class="sdk-lbl">${t}</span></button>`).join('')}</div>`).join('');
    document.body.appendChild(dock);
    swipe();
    setTimeout(()=>moveInd(true),60);
  }
  // капля: переезжает под кнопку с растяжением (как жидкость)
  function moveInd(instant){
    const pg=dock.querySelector(`.sdock-page[data-p="${page}"]`),b=pg&&pg.querySelector(`button[data-k="${active}"]`),ind=dock.querySelector('.sdock-ind');
    if(!ind)return;
    if(!b){ind.style.opacity='0';return;}
    // по раскладке (offsetLeft), а не по экрану — страница дока может ещё въезжать с трансформацией
    const x=b.offsetLeft+pg.offsetLeft+4,w=b.offsetWidth-8,prev=parseFloat(ind.dataset.x||x);
    ind.style.opacity='1';
    if(instant){ind.style.transition='none';}
    else{ind.style.transition='';ind.classList.remove('flow');void ind.offsetWidth;if(Math.abs(prev-x)>2)ind.classList.add('flow');}
    ind.style.transform=`translateX(${x}px)`;ind.style.width=w+'px';ind.dataset.x=x;
    if(instant)requestAnimationFrame(()=>{ind.style.transition='';});
    dock.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
  }
  // смена страницы дока: старая «растекается», новая вылетает
  function setPage(p){
    if(p===page)return;
    const dir=p==='music'?1:-1;page=p;
    dock.classList.remove('melt-l','melt-r');void dock.offsetWidth;dock.classList.add(dir>0?'melt-l':'melt-r');
    dock.dataset.p=p;
    setTimeout(()=>moveInd(false),60);
  }
  window._dockTap=function(p,k){
    if(p==='main'){active=k;if(typeof _tabGo==='function')_tabGo(k);}
    else{active=k;if(typeof _mxTab==='function')_mxTab(k);}
    moveInd(false);
  };
  // что сейчас на экране → страница и вкладка
  function state(){
    const sb=document.getElementById('sidebar');
    if(!sb||!sb.classList.contains('open'))return null;                       // открыт чат — дока нет
    if(document.querySelector('#mmFp,#pxKara'))return null;
    const sp=document.getElementById('spPanel'),top=sp&&sp.classList.contains('open')?[...sp.querySelectorAll('.sp-page')].pop():null;
    if(top&&(top.classList.contains('mx-page')||top.querySelector('#mmPlPage,#mxLiked,#mxGroup,#mmOfList'))){
      return {p:'music',k:top.classList.contains('mx-page')&&typeof _mxS!=='undefined'?_mxS.tab:''};}
    if(sp&&sp.classList.contains('open'))return {p:'main',k:top?'':'settings'};
    if(document.getElementById('contactsPanel')?.classList.contains('show'))return {p:'main',k:'contacts'};
    return {p:'main',k:'chats'};
  }
  function sync(){
    if(!mob()){if(dock)dock.classList.add('off');return;}
    if(!dock)build();
    const st=state();
    const was=dock.classList.contains('off');
    dock.classList.toggle('off',!st);
    if(!st)return;
    if(was)setTimeout(()=>moveInd(true),30);   // док снова показался — капля сразу на месте
    if(st.p!==page)setPage(st.p);
    if(st.k!==active){active=st.k;moveInd(false);}
    // счётчик и аватарка
    let n=0;document.querySelectorAll('[id^="badge-"]').forEach(e=>{const v=parseInt(e.textContent,10);if(v>0)n+=v;});
    const bd=dock.querySelector('.sdk-badge'),s=n>99?'99+':n?String(n):'';if(bd&&bd.textContent!==s)bd.textContent=s;
    const av=dock.querySelector('.sdk-av');
    if(av&&typeof myAvatar!=='undefined'&&myAvatar&&av.dataset.src!==myAvatar){av.dataset.src=myAvatar;av.innerHTML='<img src="'+myAvatar+'" alt="">';}
  }
  setInterval(sync,350);
  addEventListener('resize',()=>{if(dock)moveInd(true);});
  // свайп по доку: в музыке вправо → к чатам; на основной влево → в музыку
  function swipe(){
    let x0=0,y0=0,go=false;
    dock.addEventListener('touchstart',e=>{const t=e.touches[0];x0=t.clientX;y0=t.clientY;go=true;},{passive:true});
    dock.addEventListener('touchmove',e=>{if(!go)return;const t=e.touches[0],dx=t.clientX-x0;if(Math.abs(t.clientY-y0)>30){go=false;return;}
      dock.style.setProperty('--sd-drag',Math.max(-40,Math.min(40,dx*.35))+'px');},{passive:true});
    dock.addEventListener('touchend',e=>{
      if(!go)return;go=false;const dx=(e.changedTouches[0]||{}).clientX-x0;dock.style.removeProperty('--sd-drag');
      if(Math.abs(dx)<60)return;
      if(page==='music'&&dx>0){closeMyProfilePanel();active='chats';setPage('main');}
      else if(page==='main'&&dx<0){_dockTap('main','music');}
    },{passive:true});
  }
})();
