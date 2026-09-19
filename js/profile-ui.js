function buildThemeGrids(){
  const cur=LS.get('sl_theme','dark');
  const hasPremium=!!myPremium;
  [$('mainThemeGrid'),$('profThemeGrid'),$('themeOverlayGrid')].forEach(grid=>{
    if(!grid)return;grid.innerHTML='';
    // Бесплатные
    const freeSection=document.createElement('div');
    freeSection.innerHTML='<div class="tp-section-hdr free">БЕСПЛАТНЫЕ</div>';
    const freeRow=document.createElement('div');freeRow.className='tp-grid';freeRow.style.marginBottom='14px';
    THEMES.filter(t=>!t.premium).forEach(t=>{
      const d=document.createElement('div');d.className='tp-opt'+(t.id===cur?' sel':'');
      d.innerHTML=`<div class="tp-prev" style="background:${t.grad}"></div><div class="tp-lbl">${esc(t.lbl)}</div>`;
      d.onclick=()=>setTheme(t.id);freeRow.appendChild(d);
    });
    freeSection.appendChild(freeRow);grid.appendChild(freeSection);
    // Premium
    const premSection=document.createElement('div');
    premSection.innerHTML=`<div class="tp-section-hdr premium">${_tpStarSvg}<span>SLON PREMIUM</span></div>`;
    const premRow=document.createElement('div');premRow.className='tp-grid';
    THEMES.filter(t=>t.premium).forEach(t=>{
      const locked=!hasPremium;
      const d=document.createElement('div');d.className='tp-opt'+(t.id===cur?' sel':'')+(locked?' prem-locked':'');
      d.innerHTML=`<div class="tp-prev" style="background:${t.grad}">${locked?`<div class="tp-lock-badge">${_tpLockSvg}</div>`:''}</div><div class="tp-lbl">${esc(t.lbl)}</div>`;
      d.onclick=()=>hasPremium?setTheme(t.id):toast('Нужна подписка SLON PREMIUM');
      premRow.appendChild(d);
    });
    premSection.appendChild(premRow);grid.appendChild(premSection);
  });
}

function applyTheme(t,save=true){
  document.body.setAttribute('data-theme',t);
  if(save){LS.set('sl_theme',t);toast('Тема: '+(THEMES.find(x=>x.id===t)?.lbl||t));}
  buildThemeGrids();$('themePanel').classList.remove('show');
}

function setTheme(t){applyTheme(t,true);}

function toggleThemePanel(){$('themePanel').classList.toggle('show');}

// Мой профиль теперь открывается панелью в сайдбаре (settings-panel.js),
// открытый чат справа остаётся на месте
function openProfile(){openMyProfilePanel();}

// Старый профиль во всю область чата — оставлен на всякий случай, нигде не вызывается
function _openProfileLegacy(){
  currentView='profile';
  document.querySelectorAll('.sb-item').forEach(el=>el.classList.remove('active'));
  showChatElements(false);$('profilePage').style.display='flex';
  const chAvEl=$('chAv');chAvEl.innerHTML='';
  if(myAvatar){const i=document.createElement('img');i.src=myAvatar;chAvEl.appendChild(i);}else chAvEl.innerHTML='👤';
  $('chName').textContent='Мой профиль';$('chStatus').textContent='Настройки';
  $('chStatus').className='ch-status';
  // НЕ трогаем innerHTML chActs — это уничтожит search/call/dropdown/post/settings
  // кнопки навсегда, что ломает открытие чатов после посещения профиля.
  // Просто скрываем всё содержимое ch-acts на время просмотра профиля.
  $('chSearchBtn').style.display='none';$('chCallBtn').style.display='none';
  $('chPostBtn').style.display='none';$('chChSettingsBtn').style.display='none';
  $('chMoreBtn').closest('.ch-more-wrap').style.display='none';
  $('reconBanner').classList.remove('show');$('mobCallBar').style.display='none';
  updateProfileDisplay();
  if(window.innerWidth<=640)closeSidebar();
  $('bn-profile')?.classList.add('active');$('bn-chats')?.classList.remove('active');
}

function closeProfilePage(){$('profilePage').style.display='none';showChatElements(true);}

function showPeerProfile(pid){
  if(_isChannelId(pid)){showChannelInfo(pid);return;}
  const hasPremiumPeer=!!peerPremium[pid];
  const isAdmin=CHANNEL_ADMINS.has(myUsername);

  // Шапка, быстрые действия, инфо-карточки и вкладки — settings-panel.js
  _ppRender(pid);

  // Консоль администратора
  const adminSec=$('peerAdminSection');
  if(isAdmin&&pid!==myUsername){
    adminSec.style.display='';
    $('adminGrantBadgeBtn').onclick=()=>adminGrantBadge(pid);
    $('adminRevokeBadgeBtn').onclick=()=>adminRevokeBadge(pid);
    // Premium кнопки
    if(hasPremiumPeer){
      $('adminGrantPremBtn').style.display='none';
      $('adminRevokePremBtn').style.display='';
      $('adminRevokePremBtn').onclick=()=>adminRevokePremium(pid);
    }else{
      $('adminGrantPremBtn').style.display='';
      $('adminRevokePremBtn').style.display='none';
      $('adminGrantPremBtn').onclick=()=>adminGrantPremium(pid);
    }
    // Кнопка выдачи прав администратора
    const isAlreadyAdmin=CHANNEL_ADMINS.has(pid);
    $('adminGrantAdminBtn').textContent='';
    $('adminGrantAdminBtn').innerHTML=`<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;flex-shrink:0"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z"/></svg><span>${isAlreadyAdmin?'Убрать права администратора':'Выдать права администратора'}</span>`;
    $('adminGrantAdminBtn').className='admin-row'+(isAlreadyAdmin?' danger':'');
    $('adminGrantAdminBtn').onclick=()=>isAlreadyAdmin?adminRevokeAdmin(pid):adminGrantAdmin(pid);
    // Обновляем лейбл бана
    const banInfo=bannedUsers[pid];
    if(banInfo&&banInfo.until>Date.now()){
      $('adminBanBtnLabel').textContent='Разбанить пользователя';
      $('adminBanBtn').onclick=()=>adminUnbanUser(pid);
    }else{
      $('adminBanBtnLabel').textContent='Заблокировать пользователя';
      $('adminBanBtn').onclick=()=>adminBanUser(pid);
    }
  }else{
    adminSec.style.display='none';
  }

  $('chInfoOverlay')?.classList.remove('show');
  $('peerProfBackdrop')?.classList.add('show');
  $('peerProfOverlay').scrollTop=0;
  $('peerProfOverlay').classList.add('show');
  _rpDock(true);
}

function closePeerProfile(){
  $('peerProfOverlay')?.classList.remove('show');
  $('chInfoOverlay')?.classList.remove('show');
  $('peerProfBackdrop')?.classList.remove('show');
  _rpDock(false);
}

function _applyChatWallpaper(){
  const msgs=$('msgs');if(!msgs)return;
  if(!myPremium||myChatWallpaper==='none'){
    msgs.style.backgroundImage='';msgs.style.backgroundColor='';return;
  }
  const wp=CHAT_WALLPAPERS[myChatWallpaper];
  if(!wp||!wp.path)return;
  const theme=LS.get('sl_theme','dark');
  const col=THEME_WALLPAPER_COLOR[theme]||'#3b82f6';
  const path=WALLPAPER_PATHS[wp.path]||'';
  if(!path)return;
  // Создаём тайл 120×120 с 4 фигурами под разными углами — монохромные, одного цвета
  const rotations=[[-15,20,20],[ 20,75,25],[ 5,25,75],[-25,72,72]];
  let shapes='';
  rotations.forEach(([deg,cx,cy])=>{
    shapes+=`<g transform="translate(${cx},${cy}) rotate(${deg}) scale(0.7) translate(-12,-12)">
      <path d="${path}" fill="${col}" opacity="0.18"/>
    </g>`;
  });
  // Микро-текстура: сетка точек того же цвета
  const dots=`<circle cx="0"  cy="0"  r="1" fill="${col}" opacity="0.08"/>
              <circle cx="60" cy="0"  r="1" fill="${col}" opacity="0.08"/>
              <circle cx="0"  cy="60" r="1" fill="${col}" opacity="0.08"/>
              <circle cx="60" cy="60" r="1" fill="${col}" opacity="0.08"/>
              <circle cx="30" cy="30" r="1" fill="${col}" opacity="0.08"/>`;
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>${dots}${shapes}</svg>`;
  const url=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  msgs.style.backgroundImage=url;
  msgs.style.backgroundSize='120px 120px';
  msgs.style.backgroundColor='transparent';
}

function showWallpaperPicker(){
  if(!myPremium){toast('⭐ Нужна подписка SLON PREMIUM');return;}
  const opts=Object.entries(CHAT_WALLPAPERS).map(([id,w])=>
    `<button class="admin-row${myChatWallpaper===id?' sel':''}" onclick="setChatWallpaper('${id}')">
      <span style="font-size:22px">${w.emoji||'⬜'}</span> ${w.label}
    </button>`
  ).join('');
  showModal(`<div class="m-title">🖼 Обои чата</div><div style="display:flex;flex-direction:column;gap:8px">${opts}</div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Закрыть</button></div>`);
}

function setChatWallpaper(id){
  myChatWallpaper=id;saveAll();closeModal();_applyChatWallpaper();toast('Обои установлены');
}

function showRgbProfilePicker(){
  if(!myPremium){toast('⭐ Нужна подписка SLON PREMIUM');return;}
  showModal(`
    <div class="m-title">🎨 Цвет профиля</div>
    <input type="color" id="rgbPicker" value="${myProfileBgColor||'#1d4ed8'}"
      style="width:100%;height:60px;border:none;border-radius:12px;cursor:pointer;margin-bottom:8px">
    <div id="rgbPreview" style="height:60px;border-radius:12px;margin-bottom:8px;background:${myProfileBgColor||'linear-gradient(135deg,#1d4ed8,#7c3aed)'}"></div>
    <div class="admin-console-title" style="margin:8px 0 6px">Паттерн профиля</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="admin-row${!myProfilePattern?' sel':''}" style="padding:8px 14px" onclick="setProfilePattern('')">Нет</button>
      ${PREMIUM_BG_PATTERNS.map(p=>`<button class="admin-row${myProfilePattern===p.id?' sel':''}" style="padding:8px 14px" onclick="setProfilePattern('${p.id}')">${p.emoji} ${p.label}</button>`).join('')}
    </div>
    <div class="m-btns" style="margin-top:12px">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="applyRgbProfile()">Применить</button>
    </div>
  `);
  $('rgbPicker').addEventListener('input',e=>{
    $('rgbPreview').style.background=e.target.value;
  });
}

function setProfilePattern(id){
  myProfilePattern=id;
  document.querySelectorAll('#modalBox .admin-row').forEach(b=>{
    b.classList.toggle('sel',b.onclick?.toString().includes("'"+id+"'"));
  });
}

function applyRgbProfile(){
  myProfileBgColor=$('rgbPicker')?.value||'';
  saveAll();closeModal();updateProfileDisplay();
  _publishMyProfile();
  toast('Цвет профиля обновлён 🎨');
}

function _getProfileBgStyle(bgId,bgColor,pattern){
  let baseGrad;
  if(bgColor&&bgColor.includes('|')){
    // Двухцветный градиент как в Telegram: светлее в центре (за аватаркой), темнее к краям
    const [c1,c2]=bgColor.split('|');
    baseGrad=`radial-gradient(circle at 50% 38%,${c1} 0%,${c2} 85%)`;
  }else if(bgColor){
    // RGB цвет — делаем градиент из него
    baseGrad=`linear-gradient(135deg,${bgColor},${bgColor}cc)`;
  }else{
    const bg=BG_COLORS.find(b=>b.id===bgId)||BG_COLORS[0];
    baseGrad=bg.grad;
  }
  if(!pattern)return baseGrad;
  // Паттерн поверх
  const pat=PREMIUM_BG_PATTERNS.find(p=>p.id===pattern);
  if(!pat)return baseGrad;
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><text y='38' font-size='24' opacity='0.18'>${pat.emoji}</text></svg>`;
  const url=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return url+', '+baseGrad;
}

function setMyLabel(){
  const el=$('myIdLabel');
  if(el)el.textContent=(myNick?myNick+' · ':'')+'@'+myUsername+(hasElephantBadge?' 🐘':'');
}

function updateProfileDisplay(){
  _updateStoryAvatar();
  const bg=BG_COLORS.find(b=>b.id===myProfileBg)||BG_COLORS[0];
  const bgEl=$('profHeroBg');if(bgEl)bgEl.style.background=bg.grad;
  const avEl=$('profAvEl');
  if(avEl){
    avEl.innerHTML='';
    if(myAvatar){const i=document.createElement('img');i.src=myAvatar;avEl.appendChild(i);}
    else avEl.innerHTML=_avHtml(myUsername,(typeof _myFullName==='function'?_myFullName().trim():'')||myNick||myUsername);
  }
  const nameEl=$('profNameEl');
  if(nameEl){
    nameEl.innerHTML='';
    nameEl.textContent=myNick||('@'+myUsername);
    if(hasElephantBadge){const sp=document.createElement('span');sp.className='elephant-badge earned';sp.textContent='🐘';nameEl.appendChild(sp);}
  }
  const bioEl=$('profBioEl');
  if(bioEl){bioEl.textContent=myBio||'';bioEl.style.display=myBio?'':'none';}
  const pill=$('profIdPill');if(pill)pill.textContent='@'+myUsername;
  const nv=$('profNickVal');if(nv)nv.textContent=myNick||'Задать имя';
  const bv=$('profBioVal');if(bv)bv.textContent=myBio||'Не задано';
  const iv=$('profIdVal');if(iv)iv.textContent='@'+myUsername;
  const lu=$('profileLogoutUser');if(lu)lu.textContent=myUsername;
  // Консоль администратора — только для admins
  const adminRow=$('adminConsoleRow');
  if(adminRow)adminRow.style.display=CHANNEL_ADMINS.has(myUsername)?'':'none';
  // Hero bg — с поддержкой premium паттерна и RGB
  const bgStyle2=_getProfileBgStyle(myProfileBg,myProfileBgColor,myProfilePattern);
  const bgEl2=$('profHeroBg');if(bgEl2)bgEl2.style.background=bgStyle2;
  const hbg=$('profHero2');
  if(hbg){const bgEl3=hbg.querySelector('.prof-hero2-bg');if(bgEl3)bgEl3.style.background=bgStyle2;}
  // Avatar
  const av2=$('profAvEl');
  if(av2){av2.innerHTML='';if(myAvatar){const i=document.createElement('img');i.src=myAvatar;av2.appendChild(i);}else{av2.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';}}
  const remRow=$('removeAvRow');if(remRow)remRow.style.display=myAvatar?'':'none';
  // Имя + бейджи
  const nameEl2=$('profNameEl');
  if(nameEl2){
    nameEl2.innerHTML='';nameEl2.textContent=myNick||('@'+myUsername);
    if(hasElephantBadge){const sp=document.createElement('span');sp.className='elephant-badge earned';sp.textContent='🐘';nameEl2.appendChild(sp);}
    if(myPremium){const sp2=document.createElement('span');sp2.style.cssText='cursor:default;margin-left:2px';sp2.textContent='⭐';sp2.title='SLON Premium';nameEl2.appendChild(sp2);}
  }
  // Profile button
  const btn2=$('profBtn');
  if(btn2){
    btn2.innerHTML='';
    if(myAvatar){const img=document.createElement('img');img.src=myAvatar;img.style.cssText='width:34px;height:34px;object-fit:cover;border-radius:7px';btn2.appendChild(img);}
    else btn2.innerHTML=_avHtml(myUsername,(typeof _myFullName==='function'?_myFullName().trim():'')||myNick||myUsername);
  }
  // Bottom nav avatar
  const bnAv=$('bnProfAv');
  if(bnAv){bnAv.innerHTML='';if(myAvatar){const i=document.createElement('img');i.src=myAvatar;bnAv.appendChild(i);}else bnAv.innerHTML=_avHtml(myUsername,(typeof _myFullName==='function'?_myFullName().trim():'')||myNick||myUsername);}
  // Profile colors / premium picker
  const pc=$('profColors');
  if(pc){
    pc.innerHTML='';
    if(myPremium){
      const rgbBtn=document.createElement('div');
      rgbBtn.className='prof-color';rgbBtn.style.cssText='background:conic-gradient(red,yellow,green,cyan,blue,magenta,red);cursor:pointer';
      rgbBtn.title='RGB цвет (Premium)';rgbBtn.onclick=()=>showRgbProfilePicker();pc.appendChild(rgbBtn);
      const wallBtn=document.createElement('div');
      wallBtn.className='prof-color';
      wallBtn.style.cssText='background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:18px';
      wallBtn.textContent='🖼';wallBtn.title='Обои чата';wallBtn.onclick=()=>showWallpaperPicker();pc.appendChild(wallBtn);
    }else{
      const lockEl=document.createElement('div');
      lockEl.style.cssText='font-size:12px;color:var(--text2);display:flex;align-items:center;gap:6px;padding:4px 0';
      lockEl.innerHTML='🔒 Кастомизация профиля — <b style="color:#fbbf24">SLON Premium</b>';
      pc.appendChild(lockEl);
    }
  }
  const bv2=$('profBioVal2');if(bv2)bv2.textContent=myBio||'Добавить описание…';
  setMyLabel();
  // Панель профиля в сайдбаре — перерисовываем, если открыта
  if(typeof _spRefresh==='function')_spRefresh();
}

function setProfileBg(id){
  myProfileBg=id;saveAll();updateProfileDisplay();toast('Фон профиля изменён');
}

function editNick(){
  showModal(`
    <div class="m-title">✏️ Изменить имя</div>
    <input class="m-inp" id="nickInp" placeholder="Твоё имя" maxlength="32" value="${esc(myNick)}" onkeydown="if(event.key==='Enter')saveNick()">
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="saveNick()">Сохранить</button>
    </div>
  `);
  setTimeout(()=>$('nickInp')?.focus(),100);
}

function saveNick(){
  const v=($('nickInp')?.value||'').trim().slice(0,32);
  myNick=v;saveAll();updateProfileDisplay();
  _broadcastHello();
  closeModal();toast('Имя обновлено');
}

function editBio(){
  showModal(`
    <div class="m-title">📝 Биография</div>
    <textarea class="m-ta" id="bioInp" placeholder="Расскажи о себе…" maxlength="200">${esc(myBio)}</textarea>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="saveBio()">Сохранить</button>
    </div>
  `);
  setTimeout(()=>$('bioInp')?.focus(),100);
}

function saveBio(){
  myBio=($('bioInp')?.value||'').trim().slice(0,200);
  saveAll();updateProfileDisplay();
  _broadcastHello();
  closeModal();toast('Биография обновлена');
}

async function handleAvatarUpload(inp){
  const file=inp.files[0];if(!file)return;inp.value='';
  if(file.size>5*1024*1024){toast('Фото > 5 МБ');return;}
  const reader=new FileReader();
  reader.onload=async e=>{
    const thumb=await makeThumb(e.target.result,200,0.8);
    myAvatar=thumb||e.target.result;
    saveAll();updateProfileDisplay();
    _broadcastHello();
    toast('Фото профиля обновлено');
  };
  reader.readAsDataURL(file);
}

function removeAvatar(){
  myAvatar=null;saveAll();updateProfileDisplay();
  _broadcastHello();
  toast('Фото удалено');
}

function showMyId(){
  if(!myUsername){toast('Сначала выбери юзернейм');return;}
  showModal(`
    <div class="m-title">🐘 Мой юзернейм</div>
    <div class="m-info">Поделись этим юзернеймом с друзьями — они найдут тебя через «➕ Контакт»</div>
    <div class="m-idbox">
      <div class="m-id">@${esc(myUsername)}</div>
      <button class="btn-copy" onclick="copyMyId()">Копировать</button>
    </div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Закрыть</button></div>
  `);
}

function copyMyId(){
  navigator.clipboard?.writeText('@'+myUsername).then(()=>toast('Юзернейм скопирован!')).catch(()=>toast('@'+myUsername));
  closeModal();
}

function _updateHbProfileRow(){
  const av=$('hbProfileAv'),nm=$('hbProfileName');
  if(av){av.innerHTML='';if(myAvatar){const i=document.createElement('img');i.src=myAvatar;av.appendChild(i);}else av.innerHTML=_avHtml(myUsername,(typeof _myFullName==='function'?_myFullName().trim():'')||myNick||myUsername);}
  if(nm)nm.textContent=myNick||('@'+myUsername);
}

function openThemeOverlay(){
  buildThemeGrids();
  $('themeOvBackdrop').classList.add('show');
  $('themeOvOverlay').classList.add('show');
}

function closeThemeOverlay(){
  $('themeOvBackdrop')?.classList.remove('show');
  $('themeOvOverlay')?.classList.remove('show');
}

// _onStoryRingClick и _updateStoryAvatar — в stories.js
