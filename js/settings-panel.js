// ════════════════════════════════════════════════════════
// ── МОЙ ПРОФИЛЬ + НАСТРОЙКИ (панель в сайдбаре, как в Telegram) ──
// Открывается поверх списка чатов, открытый чат справа остаётся.
// Также: карточка привязанного канала, кастомизация фона профиля,
// окно «Информация о канале».
// ════════════════════════════════════════════════════════

// Иконки настроек (белые глифы на цветных скруглённых квадратах)
const _SP_ICONS={
  bell:'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  data:'M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z',
  key:'M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  gear:'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',
  folder:'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  heart:'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  speaker:'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  devices:'M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z',
  globe:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
  keyboard:'M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z',
  star:'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  gift:'M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-5.5-1.65l-.5.67-.5-.68A3 3 0 0 0 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4 15.38 12 17 10.83 14.92 8H20v6z',
  brush:'M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 0 0 0-1.41z',
  at:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  info:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  person:'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  link:'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  plus:'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  logout:'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  shield:'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z',
  camera:'M12 15.2A3.2 3.2 0 1 1 15.2 12 3.2 3.2 0 0 1 12 15.2zm7.2-10.4h-2.136l-1.664-2H8.6l-1.664 2H4.8A2.4 2.4 0 0 0 2.4 7.2v10.4A2.4 2.4 0 0 0 4.8 20h14.4a2.4 2.4 0 0 0 2.4-2.4V7.2a2.4 2.4 0 0 0-2.4-2.4z',
  pencil:'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  trash:'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  close:'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  dots:'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  copy:'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  chevron:'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z'
};

// Готовые градиенты фона профиля (центр → края), как в Telegram
const SP_PROFILE_GRADS=[
  ['#f2a65a','#d9793a'],['#7cb8ff','#3b6fe0'],['#8fdc79','#3c9e55'],['#ff9ab8','#d9477f'],
  ['#c3a6ff','#7b4fd6'],['#5fd9e8','#11869a'],['#ffc861','#e3801b'],['#a3b3c2','#56657a'],
  ['#ff8a80','#c62f3c'],['#9ee6c2','#2f9e7a'],['#b0a4ff','#4b3bbd'],['#3a3f4b','#16181d']
];

let _spChMetaCache={};  // username канала -> meta (для чужих каналов)
let _spChSubsCache={};  // username канала -> кол-во подписчиков

function _spSvg(name){return `<svg viewBox="0 0 24 24"><path d="${_SP_ICONS[name]||''}"/></svg>`;}
function _spIco(color,name){return `<div class="sp-ico sp-c-${color}">${_spSvg(name)}</div>`;}

// Строка карточки: иконка, заголовок, подпись снизу, значение справа
function _spRow(o){
  return `<div class="sp-row${o.cls?' '+o.cls:''}" onclick="${o.onclick||''}">
    ${o.ico?_spIco(o.color||'gray',o.ico):'<div class="sp-ico-pad"></div>'}
    <div class="sp-row-txt">
      <div class="sp-row-title">${o.title}</div>
      ${o.sub?`<div class="sp-row-sub">${o.sub}</div>`:''}
    </div>
    ${o.val!=null&&o.val!==''?`<div class="sp-row-val">${o.val}</div>`:''}
  </div>`;
}

function _isChannelId(id){return !!id&&(id===SLON_CHANNEL_ID||id.startsWith('ch_'));}

function _spPlural(n,one,few,many){
  const m10=n%10,m100=n%100;
  if(m10===1&&m100!==11)return one;
  if(m10>=2&&m10<=4&&(m100<12||m100>14))return few;
  return many;
}
function _spSubsText(n){return n+' '+_spPlural(n,'подписчик','подписчика','подписчиков');}

// Аватарка-кружок: картинка или первая буква на градиенте
function _spAvatarHtml(src,name,cls){
  if(src)return `<div class="${cls}"><img src="${src}" alt=""></div>`;
  const letter=esc(((name||'?').replace(/^[^\p{L}\p{N}]+/u,'')[0]||'?').toUpperCase());
  return `<div class="${cls} sp-av-letter">${letter}</div>`;
}

// ── ОТКРЫТИЕ / ЗАКРЫТИЕ ПАНЕЛИ ──
function openMyProfilePanel(){
  const panel=$('spPanel');if(!panel)return;
  _spRender();
  $('spScroll').scrollTop=0;
  $('spTopbar').classList.remove('solid');
  // На мобильном сайдбар — выезжающая шторка: сначала показываем её
  if(window.innerWidth<=640&&!$('sidebar').classList.contains('open'))toggleSidebar();
  // Перезапуск анимации появления карточек при каждом открытии
  panel.classList.remove('open');void panel.offsetWidth;
  panel.classList.add('open');panel.setAttribute('aria-hidden','false');
  $('sidebar').classList.add('sp-open');
  $('bn-profile')?.classList.add('active');$('bn-chats')?.classList.remove('active');
}

function closeMyProfilePanel(){
  const panel=$('spPanel');if(!panel||!panel.classList.contains('open'))return;
  panel.classList.remove('open');panel.setAttribute('aria-hidden','true');
  $('sidebar').classList.remove('sp-open');
  _spCloseMenu();
  $('bn-chats')?.classList.add('active');$('bn-profile')?.classList.remove('active');
}

function _spRefresh(){if($('spPanel')?.classList.contains('open'))_spRender();}

// ── ОТРИСОВКА ──
function _spRender(){
  // Шапка: фон, аватар, имя, статус
  $('spHeroBg').style.background=_getProfileBgStyle(myProfileBg,myProfileBgColor,myProfilePattern);
  const displayName=myNick||('@'+myUsername);
  $('spAv').innerHTML=(myAvatar?`<img src="${myAvatar}" alt="">`:`<span class="sp-av-letter">${esc((displayName.replace('@','')[0]||'?').toUpperCase())}</span>`)
    +`<div class="sp-av-cam">${_spSvg('camera')}</div>`;
  $('spName').innerHTML=esc(displayName)
    +(hasElephantBadge?' <span class="sp-badge" title="Слонгалочка">🐘</span>':'')
    +(myPremium?' <span class="sp-badge" title="SLON Premium">⭐</span>':'');
  $('spStatus').innerHTML=_fbMode
    ?'<span class="sp-dot on"></span>в сети'
    :'<span class="sp-dot"></span>подключение…';

  let i=0;const card=(html,extra)=>`<div class="sp-card${extra?' '+extra:''}" style="--i:${i++}">${html}</div>`;
  let h='';

  // Канал, привязанный к профилю
  if(myLinkedChannel){
    h+=card(_spChannelCardInner(myLinkedChannel,true),'sp-ch-card');
  }else{
    h+=card(_spRow({ico:'plus',color:'blue',title:'Добавить канал в профиль',sub:'Его увидят все, кто откроет твой профиль',onclick:'_spPickChannel()'}));
  }

  // Инфо
  h+=card(
    _spRow({ico:'at',color:'cyan',title:esc(myUsername),sub:'Юзернейм',onclick:'copyMyId()'})
   +_spRow({ico:'info',color:'gray',title:myBio?esc(myBio).replace(/\n/g,'<br>'):'<span class="sp-muted">Расскажи о себе</span>',sub:'О себе',onclick:'editBio()',cls:'sp-row-multi'})
   +_spRow({ico:'person',color:'orange',title:esc(myNick||'Задать имя'),sub:'Имя',onclick:'editNick()'})
  );

  // Основные настройки
  h+=card(
    _spRow({ico:'bell',color:'red',title:'Уведомления и звуки',onclick:'requestNotifPermission()'})
   +_spRow({ico:'data',color:'green',title:'Данные и память',onclick:'_spDataStorage()'})
   +_spRow({ico:'key',color:'steel',title:'Конфиденциальность',onclick:'showChangePassword()'})
   +_spRow({ico:'gear',color:'gray',title:'Оформление',val:esc(THEMES.find(t=>t.id===LS.get('sl_theme','dark'))?.lbl||''),onclick:'openThemeOverlay()'})
   +_spRow({ico:'brush',color:'purple',title:'Кастомизация профиля',onclick:'_spCustomize()'})
   +_spRow({ico:'folder',color:'blue',title:'Папки с чатами',onclick:"_spSoon()"})
   +_spRow({ico:'heart',color:'pink',title:'Стикеры и эмодзи',onclick:"_spSoon()"})
   +_spRow({ico:'speaker',color:'green',title:'Звук и камера',onclick:"_spSoon()"})
   +_spRow({ico:'devices',color:'blue',title:'Устройства',onclick:'showDevPanel()'})
   +_spRow({ico:'globe',color:'violet',title:'Язык',val:'Русский',onclick:"toast('Пока только русский 🐘')"})
   +_spRow({ico:'keyboard',color:'orange',title:'Горячие клавиши',onclick:"_spSoon()"})
  );

  // Premium
  h+=card(
    _spRow({ico:'star',color:'premium',title:'SLON Premium',val:myPremium?'Активна':'',onclick:'_spPremiumInfo()'})
   +_spRow({ico:'gift',color:'orange',title:'Подарить Premium',onclick:"_spSoon()"})
  );

  // Админка — только для администраторов
  if(CHANNEL_ADMINS.has(myUsername)){
    h+=card(_spRow({ico:'shield',color:'blue',title:'Консоль администратора',sub:'Пользователи и канал SLON',onclick:'showAdminConsolePage()'}));
  }

  h+=card(_spRow({ico:'logout',color:'red',title:'Выйти из аккаунта',sub:'@'+esc(myUsername),onclick:'logout()',cls:'sp-row-danger'}));
  h+='<div class="sp-footer">SLON Messenger 🐘</div>';
  $('spBody').innerHTML=h;
  if(myLinkedChannel)_spLoadChannelData(myLinkedChannel);
}

function _spSoon(){toast('Скоро 🐘');}

// Шапка становится непрозрачной, когда фон профиля уехал вверх
function _spOnScroll(){
  const sc=$('spScroll'),tb=$('spTopbar');if(!sc||!tb)return;
  const heroH=$('spHero').offsetHeight;
  tb.classList.toggle('solid',sc.scrollTop>heroH-60);
}

// ── МЕНЮ «ТРИ ТОЧКИ» ──
function _spToggleMenu(e){
  e?.stopPropagation();
  const m=$('spMenu');
  if(m.classList.contains('show')){_spCloseMenu();return;}
  const it=(ico,txt,fn,danger)=>`<button class="sp-menu-item${danger?' danger':''}" onclick="_spCloseMenu();${fn}">${_spSvg(ico)}<span>${txt}</span></button>`;
  m.innerHTML=it('pencil','Изменить имя','editNick()')
    +it('camera','Сменить фото',"$('avIn').click()")
    +(myAvatar?it('trash','Удалить фото','removeAvatar()',true):'')
    +it('brush','Кастомизация профиля','_spCustomize()')
    +it('logout','Выйти','logout()',true);
  m.classList.add('show');
}
function _spCloseMenu(){$('spMenu')?.classList.remove('show');}
document.addEventListener('click',e=>{if(!e.target.closest?.('#spMenu'))_spCloseMenu();});

// ── КАРТОЧКА ПРИВЯЗАННОГО КАНАЛА ──
// Используется и в моём профиле, и в профиле собеседника
function _spChannelMeta(username){
  const id='ch_'+username;
  return myChannels[id]||subscribedChannels[id]||_spChMetaCache[username]||null;
}

function _spChannelCardInner(username,isMine){
  const id='ch_'+username;
  const meta=_spChannelMeta(username)||{};
  const name=meta.name||('@'+username);
  const subs=_spChSubsCache[username];
  const hist=chatHist[id]||[];
  const last=hist[hist.length-1];
  const preview=last?(last.text||(last.photoId?'Фото':last.fileInfo?'Файл':'Пост')):(meta.desc||'Канал');
  const time=last?.ts?_spShortDate(last.ts):'';
  return `<div class="sp-ch-hdr" onclick="${isMine?'_spPickChannel()':''}">
      <span class="sp-ch-lbl">Канал</span>
      ${subs!=null?`<span class="sp-ch-subs">${_spSubsText(subs)}</span>`:''}
      ${isMine?`<span class="sp-ch-edit">изменить</span>`:''}
    </div>
    <div class="sp-ch-row" onclick="_spOpenChannel('${esc(username)}')">
      ${_spAvatarHtml(meta.avatar||peerAvatars[id],name,'sp-ch-av')}
      <div class="sp-ch-txt">
        <div class="sp-ch-top"><span class="sp-ch-name">${esc(name)}</span><span class="sp-ch-time">${time}</span></div>
        <div class="sp-ch-prev">${esc(String(preview).slice(0,80))}</div>
      </div>
    </div>`;
}

function _spShortDate(ts){
  const d=new Date(ts),now=new Date();
  if(d.toDateString()===now.toDateString())return fmtTime(ts);
  if(now-d<6*864e5)return d.toLocaleDateString('ru',{weekday:'short'});
  return d.toLocaleDateString('ru',{day:'numeric',month:'short'});
}

// Подгружаем мету и число подписчиков канала, затем перерисовываем карточки
async function _spLoadChannelData(username){
  let changed=false;
  if(!_spChannelMeta(username)){
    const s=await _fbOnce('user_channels/'+username+'/meta');
    const m=s?.val();if(m){_spChMetaCache[username]=m;changed=true;}
  }
  if(_spChSubsCache[username]==null){
    const s=await _fbOnce('channel_subs/'+username);
    // null = таймаут/нет сети — число не показываем, чем показывать неправду
    if(s){const v=s.val();_spChSubsCache[username]=v?Object.keys(v).length:0;changed=true;}
  }
  if(!changed)return;
  document.querySelectorAll('.sp-ch-card,.sp-peer-ch').forEach(el=>{
    const isMine=el.classList.contains('sp-ch-card');
    const u=isMine?myLinkedChannel:peerLinkedChannels[_spPeerOpenId]||'';
    if(u===username)el.innerHTML=_spChannelCardInner(username,isMine);
  });
}

let _spPeerOpenId='';

function _spOpenChannel(username){
  const id='ch_'+username;
  if($('si-'+id)||myChannels[id]||subscribedChannels[id]){
    closeMyProfilePanel();closePeerProfile();openChat(id);return;
  }
  // Не подписан — предлагаем подписаться
  closePeerProfile();
  showSubscribeChannel();
  setTimeout(()=>{const inp=$('subChInp');if(inp)inp.value=username;},30);
}

// Выбор канала для профиля
function _spPickChannel(){
  const mine=Object.entries(myChannels).filter(([,c])=>!c.owner||c.owner===myUsername);
  if(!mine.length){
    showModal(`<div class="m-title">📢 Канал в профиле</div>
      <div class="m-info">У тебя пока нет своего канала. Создай его — и он появится в твоём профиле.</div>
      <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="closeModal();closeMyProfilePanel();openWizard('channel')">Создать канал</button></div>`);
    return;
  }
  const opt=(u,title,sub,avHtml)=>`<div class="sp-pick${myLinkedChannel===u?' sel':''}" onclick="_spSetLinkedChannel('${esc(u)}')">
      ${avHtml}<div class="sp-pick-txt"><div>${title}</div>${sub?`<div class="sp-row-sub">${sub}</div>`:''}</div>
      <div class="sp-pick-radio"></div></div>`;
  const list=mine.map(([id,c])=>{
    const u=c.username||id.replace(/^ch_/,'');
    return opt(u,esc(c.name||'@'+u),'@'+esc(u),_spAvatarHtml(c.avatar,c.name||u,'sp-pick-av'));
  }).join('');
  showModal(`<div class="m-title">📢 Канал в профиле</div>
    <div class="m-info">Выбранный канал увидят все, кто откроет твой профиль</div>
    <div class="sp-pick-list">${list}${opt('','Не показывать','','<div class="sp-pick-av sp-av-letter">✕</div>')}</div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Закрыть</button></div>`);
}

function _spSetLinkedChannel(u){
  myLinkedChannel=u;saveAll();closeModal();
  if(_fbMode)_publishMyProfile();
  _spRefresh();
  toast(u?'Канал добавлен в профиль 📢':'Канал убран из профиля');
}

// ── ДАННЫЕ И ПАМЯТЬ ──
function _spDataStorage(){
  let used=0;
  try{for(let k in localStorage)if(localStorage.hasOwnProperty(k))used+=(localStorage[k].length+k.length)*2;}catch(e){}
  showModal(`<div class="m-title">💾 Данные и память</div>
    <div class="m-info">Локальное хранилище: ${fmtSz(used)}. Фото, голосовые и слонкружки лежат в IndexedDB.</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="admin-row" onclick="closeModal();exportData()">📦 Экспорт данных</button>
      <button class="admin-row danger" onclick="closeModal();confirmClearAll()">🗑 Очистить все данные</button>
    </div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Закрыть</button></div>`);
}

function _spPremiumInfo(){
  showModal(`<div class="m-title">⭐ SLON Premium</div>
    <div class="m-info">${myPremium?'Подписка активна — спасибо! 💜':'Premium открывает эксклюзивные возможности:'}</div>
    <div class="sp-prem-list">
      <div>🎨 10 эксклюзивных тем оформления</div>
      <div>🌈 Свои цвета градиента профиля</div>
      <div>🐘 Узоры из эмодзи на фоне профиля</div>
      <div>🖼 Обои для чатов</div>
      <div>⭐ Значок у имени</div>
    </div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Закрыть</button></div>`);
}

// ── КАСТОМИЗАЦИЯ ПРОФИЛЯ ──
let _spDraft=null;

function _spCustomize(){
  _spDraft={bg:myProfileBg||'bg0',color:myProfileBgColor||'',pattern:myProfilePattern||''};
  const cur=(_spDraft.color&&_spDraft.color.includes('|'))?_spDraft.color.split('|'):['#7cb8ff','#3b6fe0'];
  const lock=myPremium?'':' <span class="sp-lock">⭐ Premium</span>';
  showModal(`<div class="m-title">🎨 Кастомизация профиля</div>
    <div class="sp-cust-prev" id="spCustPrev">
      <div class="sp-cust-av">${myAvatar?`<img src="${myAvatar}" alt="">`:esc(((myNick||myUsername)[0]||'?').toUpperCase())}</div>
      <div class="sp-cust-name">${esc(myNick||'@'+myUsername)}</div>
      <div class="sp-cust-st">в сети</div>
    </div>
    <div class="sp-cust-lbl">Цвет фона</div>
    <div class="sp-swatches" id="spSwatches">
      ${SP_PROFILE_GRADS.map(([a,b])=>`<button class="sp-sw" data-c="${a}|${b}" style="background:radial-gradient(circle at 50% 38%,${a},${b} 85%)" onclick="_spPickGrad('${a}|${b}')"></button>`).join('')}
    </div>
    <div class="sp-cust-lbl">Свои цвета${lock}</div>
    <div class="sp-cust-colors">
      <label>Центр<input type="color" id="spC1" value="${cur[0]}" oninput="_spCustomColors()"></label>
      <label>Края<input type="color" id="spC2" value="${cur[1]}" oninput="_spCustomColors()"></label>
    </div>
    <div class="sp-cust-lbl">Узор${lock}</div>
    <div class="sp-patterns" id="spPatterns">
      <button class="sp-pat" data-p="" onclick="_spPickPattern('')">Нет</button>
      ${PREMIUM_BG_PATTERNS.map(p=>`<button class="sp-pat" data-p="${p.id}" onclick="_spPickPattern('${p.id}')">${p.emoji} ${p.label}</button>`).join('')}
    </div>
    <div class="m-btns"><button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="_spSaveCustom()">Сохранить</button></div>`);
  _spUpdateCustPrev();
}

function _spPickGrad(c){_spDraft.color=c;_spUpdateCustPrev();}
function _spCustomColors(){
  if(!myPremium){toast('⭐ Свои цвета — в SLON Premium');return;}
  _spDraft.color=$('spC1').value+'|'+$('spC2').value;_spUpdateCustPrev();
}
function _spPickPattern(p){
  if(p&&!myPremium){toast('⭐ Узоры — в SLON Premium');return;}
  _spDraft.pattern=p;_spUpdateCustPrev();
}
function _spUpdateCustPrev(){
  const pr=$('spCustPrev');if(!pr||!_spDraft)return;
  pr.style.background=_getProfileBgStyle(_spDraft.bg,_spDraft.color,_spDraft.pattern);
  document.querySelectorAll('#spSwatches .sp-sw').forEach(b=>b.classList.toggle('sel',b.dataset.c===_spDraft.color));
  document.querySelectorAll('#spPatterns .sp-pat').forEach(b=>b.classList.toggle('sel',b.dataset.p===_spDraft.pattern));
}
function _spSaveCustom(){
  if(!_spDraft)return;
  myProfileBg=_spDraft.bg;myProfileBgColor=_spDraft.color;myProfilePattern=_spDraft.pattern;
  saveAll();closeModal();updateProfileDisplay();
  if(_fbMode)_publishMyProfile();
  toast('Профиль обновлён 🎨');
}

// ════════════════════════════════════════
// ── ИНФОРМАЦИЯ О КАНАЛЕ (как Channel Info в Telegram) ──
// ════════════════════════════════════════
let _ciTab='media';

function showChannelInfo(id){
  const ov=$('chInfoOverlay');if(!ov)return;
  const isSlon=id===SLON_CHANNEL_ID;
  const username=isSlon?'':id.replace(/^ch_/,'');
  const meta=isSlon?{}:(_spChannelMeta(username)||{});
  const name=meta.name||(peerNames[id]||'').replace(/^📢\s*/,'')||(isSlon?'SLON':'@'+username);
  const avatar=meta.avatar||peerAvatars[id]||null;
  const desc=isSlon?'Официальный канал SLON — новости и обновления 🐘':(meta.desc||'');
  const isOwner=!isSlon&&myChannels[id]&&(!myChannels[id].owner||myChannels[id].owner===myUsername);
  const subs=_spChSubsCache[username];
  _ciTab='media';

  const linkify=t=>esc(t).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,'<br>');
  let rows='';
  if(desc)rows+=_spRow({ico:'info',color:'gray',title:linkify(desc),sub:'Описание',cls:'sp-row-multi sp-row-static'});
  if(username)rows+=`<div class="sp-row" onclick="navigator.clipboard?.writeText('@${esc(username)}').then(()=>toast('Ссылка скопирована'))">
      ${_spIco('orange','link')}
      <div class="sp-row-txt"><div class="sp-row-title">@${esc(username)}</div><div class="sp-row-sub">Ссылка</div></div>
      <div class="sp-row-act">${_spSvg('copy')}</div></div>`;
  rows+=`<div class="sp-row" onclick="_ciToggleMute('${id}')">
      ${_spIco('red','bell')}
      <div class="sp-row-txt"><div class="sp-row-title">Уведомления</div></div>
      <div class="sp-switch${mutedChats[id]?'':' on'}" id="ciMuteSw"></div></div>`;

  ov.innerHTML=`
    <div class="ci-hdr">
      <button class="sp-tb-btn" onclick="closePeerProfile()" title="Закрыть">${_spSvg('close')}</button>
      <div class="ci-title">Информация о канале</div>
      ${isOwner?`<button class="sp-tb-btn" onclick="closePeerProfile();showChannelSettings('${id}')" title="Настройки канала">${_spSvg('pencil')}</button>`:''}
    </div>
    <div class="ci-top">
      ${_spAvatarHtml(avatar,name,'ci-av')}
      <div class="ci-name">${esc(name)}</div>
      <div class="ci-subs" id="ciSubs">${subs!=null?_spSubsText(subs):(isSlon?'официальный канал':'канал')}</div>
    </div>
    <div class="sp-card">${rows}</div>
    <div class="ci-tabs" id="ciTabs">
      <button class="ci-tab sel" data-t="media" onclick="_ciSetTab('${id}','media')">Медиа</button>
      <button class="ci-tab" data-t="files" onclick="_ciSetTab('${id}','files')">Файлы</button>
      <button class="ci-tab" data-t="links" onclick="_ciSetTab('${id}','links')">Ссылки</button>
    </div>
    <div class="ci-content" id="ciContent"></div>`;
  _ciRenderTab(id);
  $('peerProfOverlay')?.classList.remove('show');
  $('peerProfBackdrop')?.classList.add('show');
  ov.scrollTop=0;
  ov.classList.add('show');
  if(username&&subs==null){
    _fbOnce('channel_subs/'+username).then(s=>{
      if(!s)return;
      const v=s.val();_spChSubsCache[username]=v?Object.keys(v).length:0;
      const el=$('ciSubs');if(el)el.textContent=_spSubsText(_spChSubsCache[username]);
    });
  }
}

function _ciToggleMute(id){
  if(mutedChats[id])delete mutedChats[id];else mutedChats[id]=true;
  saveAll();
  $('ciMuteSw')?.classList.toggle('on',!mutedChats[id]);
  if(typeof _updateSbMuteIcon==='function')_updateSbMuteIcon(id);
  if(activeChat===id&&typeof _renderChannelMuteBtn==='function')_renderChannelMuteBtn(id);
}

function _ciSetTab(id,t){
  _ciTab=t;
  document.querySelectorAll('#ciTabs .ci-tab').forEach(b=>b.classList.toggle('sel',b.dataset.t===t));
  _ciRenderTab(id);
}

function _ciRenderTab(id){
  const box=$('ciContent');if(!box)return;
  const hist=chatHist[id]||[];
  if(_ciTab==='media'){
    const photos=hist.filter(m=>m.photoId).reverse();
    if(!photos.length){box.innerHTML='<div class="ci-empty">Пока нет фото</div>';return;}
    box.innerHTML='<div class="ci-grid">'+photos.map(m=>`<div class="ci-cell" onclick="openPhoto('${m.photoId}')"><img data-pid="${m.photoId}" src="${m.photoThumb||''}" alt="" loading="lazy"></div>`).join('')+'</div>';
    box.querySelectorAll('img[data-pid]').forEach(img=>{
      _resolvePhotoSrc(img.dataset.pid).then(src=>{if(src)img.src=src;}).catch(()=>{});
    });
  }else if(_ciTab==='files'){
    const files=hist.filter(m=>m.fileInfo).reverse();
    box.innerHTML=files.length?files.map(m=>`<div class="sp-row" onclick="dlFile('${m.fileDataId}','${esc(m.fileInfo.name).replace(/'/g,'&#39;')}')">
        ${_spIco('blue','folder')}<div class="sp-row-txt"><div class="sp-row-title">${esc(m.fileInfo.name)}</div><div class="sp-row-sub">${esc(m.fileInfo.size||'')} · ${m.ts?_spShortDate(m.ts):''}</div></div></div>`).join('')
      :'<div class="ci-empty">Пока нет файлов</div>';
  }else{
    const links=[];
    hist.forEach(m=>{(String(m.text||'').match(/https?:\/\/[^\s<]+/g)||[]).forEach(u=>links.push({u,ts:m.ts}));});
    links.reverse();
    box.innerHTML=links.length?links.map(l=>`<a class="sp-row ci-link" href="${esc(l.u)}" target="_blank" rel="noopener">
        ${_spIco('orange','link')}<div class="sp-row-txt"><div class="sp-row-title">${esc(l.u)}</div><div class="sp-row-sub">${l.ts?_spShortDate(l.ts):''}</div></div></a>`).join('')
      :'<div class="ci-empty">Пока нет ссылок</div>';
  }
}

// Прокрутка панели → непрозрачная шапка
document.addEventListener('DOMContentLoaded',()=>{
  $('spScroll')?.addEventListener('scroll',_spOnScroll,{passive:true});
});
