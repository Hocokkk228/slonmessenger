function rebuildSidebar(){
  // Полностью очищаем списки — нужно при смене аккаунта
  const sbList=$('sbList');
  const archList=$('archiveList');
  // Убираем все si-* элементы кроме ai
  sbList.querySelectorAll('.sb-item:not(#si-ai):not(#si-saved)').forEach(el=>el.remove());
  archList.querySelectorAll('.sb-item').forEach(el=>el.remove());

  // Строим заново из текущего state
  // Сначала закреплённые
  const pinned=Object.keys(pinnedChats).filter(id=>peerNames[id]||groups[id]);
  const normal=Object.keys(peerNames).filter(id=>!pinnedChats[id]);
  const grpIds=Object.keys(groups).filter(id=>!pinnedChats[id]);

  pinned.forEach(id=>{
    if(groups[id])addSbGroup(id);
    else addSbItem(id);
  });
  normal.forEach(pid=>{addSbItem(pid);});
  grpIds.forEach(gid=>{addSbGroup(gid);});

  // Значки булавки
  pinned.forEach(id=>{
    const el=$('si-'+id);if(!el)return;
    el.style.position='relative';
    if(!el.querySelector('.sb-pin')){
      const pin=document.createElement('span');
      pin.className='sb-pin';pin.innerHTML='<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>';
      el.appendChild(pin);
    }
  });

  // Мут-иконки
  Object.keys(peerNames).forEach(id=>_updateSbMuteIcon(id));

  // Архивированные
  Object.keys(archivedChats).forEach(id=>{
    const el=$('si-'+id);
    if(el){el.classList.add('archived');archList.appendChild(el);}
  });
  updateArchiveHeader();

  // Восстанавливаем каналы из localStorage и запускаем слушателей
  Object.entries(myChannels).forEach(([cid,meta])=>{
    _addChannelToSidebar(cid,meta);
    if(meta.username&&window._fbDb)setTimeout(()=>_listenUserChannel(cid,meta.username),1000);
  });
  Object.entries(subscribedChannels).forEach(([cid,meta])=>{
    _addChannelToSidebar(cid,meta);
    if(meta.username&&window._fbDb)setTimeout(()=>_listenUserChannel(cid,meta.username),1000);
  });
  // Превью последних сообщений
  for(const[id,hist]of Object.entries(chatHist)){
    if(id==='ai'||!hist?.length)continue;
    const last=hist[hist.length-1];
    if(last)updatePreview(id,last.sender==='me'?'Вы: '+(last.text||'📎').slice(0,28):(last.text||'📎').slice(0,28));
  }
  for(const[id,hist]of Object.entries(grpHist)){
    if(!hist?.length)continue;
    updatePreview(id,(hist[hist.length-1].text||'').slice(0,28));
  }
}

function openChat(id){
  if(currentView==='profile')closeProfilePage();
  activeChat=id;currentView='chat';
  document.querySelectorAll('.sb-item').forEach(el=>el.classList.remove('active'));
  $('si-'+id)?.classList.add('active');
  const bw=$('badge-'+id);if(bw)bw.innerHTML='';
  showChatElements(true);
  // try/finally — гарантирует что sidebar закроется на мобильных даже если
  // где-то внутри рендера чата вылетит ошибка (иначе юзер "застревает" в списке чатов)
  try{
    renderChat(id);
    updateChatHeader();
    _updateWindowTitle();
    _gcRenderBar(); // плашка «Идёт групповой звонок» (group-calls.js)
    // В личных чатах аватарки и имена у сообщений не нужны (как в Telegram)
    $('msgs').classList.toggle('is-group',id.startsWith('g_')||id==='ai');
    _syncInpState();
    updateReconBanner();
    _applyChatWallpaper();
    if(id!=='ai'&&id!=='saved'&&!id.startsWith('g_')&&!conns[id]?.open&&peer?.open)silentConnect(id);
  }catch(e){
    console.error('[openChat] ошибка при открытии чата:',e);
  }finally{
    if(window.innerWidth<=640)closeSidebar();
    $('bn-chats')?.classList.add('active');$('bn-profile')?.classList.remove('active');
    setTimeout(()=>$('msgInp')?.focus(),100);
  }
}

function showChatElements(show){
  $('msgs').style.display=show?'':'none';
  $('inpWrap').style.display=show?'':'none';
  document.querySelector('.typing-wrap').style.display=show?'':'none';
  $('profilePage').style.display=show?'none':'flex';
  if(!show)$('mobCallBar').style.display='none';
}

function onChatHeaderClick(){
  if(activeChat==='ai'||currentView==='profile')return;
  if(activeChat.startsWith('g_')){showGroupPanel(activeChat);return;}
  if(_isChannelId(activeChat)){showChannelInfo(activeChat);return;}
  showPeerProfile(activeChat);
}

function updateChatHeader(){
  const id=activeChat;
  if(currentView==='profile')return;
  const mob=$('mobCallBar');
  // Сбрасываем каналовые кнопки и поле ввода — иначе они "утекают" в другие чаты
  const _pb=$('chPostBtn'),_sb=$('chChSettingsBtn');
  if(_pb)_pb.style.display='none';
  if(_sb)_sb.style.display='none';
  const _iw=$('inpWrap'),_mb=$('channelMuteBar');
  if(_iw)_iw.style.display='';
  if(_mb)_mb.style.display='none';
  const _mw=$('chMoreBtn')?.closest('.ch-more-wrap');
  if(_mw)_mw.style.display='';
  if(id==='ai'){
    $('chAv').innerHTML=_SLON_MARK;$('chAv').style.background='var(--accent)';
    $('chName').textContent='СЛОН AI';$('chStatus').textContent='AI Ассистент';
    $('chStatus').className='ch-status';
    $('chSearchBtn').style.display='none';$('chCallBtn').style.display='none';
    _buildChatDropdown('ai','channel');
    mob.style.display='none';
  }else if(id==='saved'){
    $('chAv').innerHTML='<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#fff"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
    $('chAv').style.background='#3390ec';
    $('chName').textContent='Избранное';$('chStatus').textContent='Только ты видишь эти сообщения';
    $('chStatus').className='ch-status';
    $('chSearchBtn').style.display='none';$('chCallBtn').style.display='none';
    const dd3=$('chDropdown');
    if(dd3)dd3.innerHTML=`<button class="ch-dropdown-item danger" onclick="_clearSavedChat();closeChatDropdown()"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg><span>Очистить Избранное</span></button>`;
    mob.style.display='none';
  }else if(id===SLON_CHANNEL_ID){
    // SLON-канал — особый вид, без статуса "в сети"
    $('chAv').innerHTML=_SLON_MARK;
    $('chAv').style.background='var(--accent)';
    $('chName').textContent='SLON Новости';
    const isAdmin=CHANNEL_ADMINS.has(myUsername);
    $('chStatus').innerHTML=isAdmin
      ?'<span style="font-size:11px">📢 Ты редактор канала</span>'
      :'<span style="font-size:11px">📢 Официальный канал</span>';
    $('chStatus').className='ch-status';
    $('chSearchBtn').style.display='none';$('chCallBtn').style.display='none';
    const dd2=$('chDropdown');
    if(dd2)dd2.innerHTML=isAdmin?`<button class="ch-dropdown-item" onclick="showChannelPublish();closeChatDropdown()"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg><span>📝 Опубликовать пост</span></button>`:'';
    if(isAdmin){_pb.innerHTML='<svg viewBox="0 0 24 24" class="pb-ico"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>Пост';_pb.style.display='';_pb.onclick=()=>showChannelPublish();}
    _applyChannelInputLock(id,isAdmin);
    mob.style.display='none';
  }else if(id.startsWith('ch_')){
    // Пользовательский канал — НИКОГДА не перезаписываем chActs.innerHTML целиком,
    // иначе search/call/dropdown кнопки исчезают из DOM навсегда для всех чатов.
    const chMeta=myChannels[id]||subscribedChannels[id]||{};
    const chAv=chMeta.avatar;
    $('chAv').innerHTML='';
    if(chAv){const i=document.createElement('img');i.src=chAv;i.style.cssText='width:38px;height:38px;object-fit:cover;border-radius:50%';$('chAv').appendChild(i);}
    else{$('chAv').style.background='';$('chAv').innerHTML=_avHtml(id,chMeta.name||chMeta.username||id);}
    $('chName').textContent=chMeta.name||('@'+(chMeta.username||id));
    $('chStatus').textContent=chMeta.desc||'Канал';$('chStatus').className='ch-status';
    const isOwner=chMeta.owner===myUsername;
    $('chSearchBtn').style.display='none';$('chCallBtn').style.display='none';
    if(isOwner){
      _pb.innerHTML='<svg viewBox="0 0 24 24" class="pb-ico"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>Пост';_pb.style.display='';_pb.onclick=()=>showUserChannelPublish(id);
      _sb.innerHTML=icoSvg('i-settings');_sb.style.display='';_sb.onclick=()=>showChannelSettings(id);
    }
    _buildChatDropdown(id,'channel');
    // Скрываем поле ввода для НЕ-владельцев — заменяем на кнопку mute/unmute
    _applyChannelInputLock(id,isOwner);
    mob.style.display='none';
  }else if(id.startsWith('g_')){
    const g=groups[id]||{};
    $('chAv').innerHTML='';$('chAv').style.background='';
    if(g.avatar){const _gi=document.createElement('img');_gi.src=g.avatar;_gi.style.cssText='width:38px;height:38px;object-fit:cover;border-radius:50%';$('chAv').appendChild(_gi);}
    else{$('chAv').style.background='';$('chAv').innerHTML=_avHtml(id,g.name||'Группа');}
    $('chName').textContent=(g.name||'Группа');
    $('chStatus').textContent=_grpMembersText(g.members?.length||0);$('chStatus').className='ch-status off';
    $('chSearchBtn').style.display='none';$('chCallBtn').style.display=''; // групповой звонок
    _buildChatDropdown(id,'group');
    mob.style.display='none';
  }else{
    const ok=_fbMode?!!_fbConns[id]:(conns[id]?.open),av=peerAvatars[id];
    $('chAv').innerHTML='';$('chAv').style.background='';
    if(av){
      const i=document.createElement('img');i.src=av;i.style.cssText='width:38px;height:38px;object-fit:cover;border-radius:50%';
      $('chAv').appendChild(i);
    }else{
      $('chAv').style.background='';
      $('chAv').innerHTML=_avHtml(id,peerNames[id]||id);
    }
    $('chName').textContent=(peerNames[id]||('@'+id))+(peerElephantBadges[id]?' 🐘':'');
    $('chStatus').innerHTML=ok
      ?`<div class="status-dot online" style="width:7px;height:7px"></div> в сети`
      :`<div class="status-dot offline" style="width:7px;height:7px"></div> ${esc(_lastSeenText(id))}`;
    $('chStatus').className='ch-status'+(ok?'':' off');
    // Show search + call buttons, rebuild dropdown
    $('chSearchBtn').style.display='flex';
    $('chCallBtn').style.display='flex';
    _buildChatDropdown(id,'peer');
    if(window.innerWidth<=640)mob.style.display='flex';else mob.style.display='none';
  }
}

function _buildChatDropdown(id, type){
  const dd=$('chDropdown');if(!dd)return;
  const icon=(svg,label,fn,danger)=>`<button class="ch-dropdown-item${danger?' danger':''}" onclick="${fn}">${svg}<span>${label}</span></button>`;
  const sep='<div class="ch-dropdown-sep"></div>';
  const editSvg=`<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
  const vcallSvg=`<svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`;
  const muteSvg=`<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`;
  const selectSvg=`<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
  const blockSvg=`<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.68L5.68 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.68L18.32 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/></svg>`;
  const trashSvg=`<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
  const profileSvg=`<svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`;
  const pinSvg=`<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z"/></svg>`;
  const isMuted=!!mutedChats[id];
  const isPinned=!!pinnedChats[id];
  let html='';
  if(type==='peer'){
    html+=icon(profileSvg,'Профиль',`showPeerProfile('${id}');closeChatDropdown()`);
    html+=icon(editSvg,'Изменить',`toast('Скоро');closeChatDropdown()`);
    html+=icon(vcallSvg,'Видеозвонок',`startCallWithPerm('${id}',true);closeChatDropdown()`);
    html+=icon(muteSvg,isMuted?'Включить звук':'Отключить звук',`ctxTargetId='${id}';ctxMuteToggle();closeChatDropdown()`);
    html+=icon(pinSvg,isPinned?'Открепить':'Закрепить',`ctxTargetId='${id}';ctxPinToggle();closeChatDropdown()`);
    html+=icon(selectSvg,'Выбрать сообщения',`toast('Скоро');closeChatDropdown()`);
    html+=sep;
    html+=icon(blockSvg,'Заблокировать',`toggleBlockUser('${id}');closeChatDropdown()`,'danger');
    html+=icon(trashSvg,'Удалить чат',`ctxTargetId='${id}';ctxDeleteChat();closeChatDropdown()`,'danger');
  }else if(type==='group'){
    html+=icon(editSvg,'Изменить',`toast('Скоро');closeChatDropdown()`);
    html+=icon(muteSvg,isMuted?'Включить звук':'Отключить звук',`ctxTargetId='${id}';ctxMuteToggle();closeChatDropdown()`);
    html+=icon(pinSvg,isPinned?'Открепить':'Закрепить',`ctxTargetId='${id}';ctxPinToggle();closeChatDropdown()`);
    html+=icon(selectSvg,'Выбрать сообщения',`toast('Скоро');closeChatDropdown()`);
    html+=sep;
    html+=icon(trashSvg,'Удалить чат',`ctxTargetId='${id}';ctxDeleteChat();closeChatDropdown()`,'danger');
  }else if(type==='channel'){
    html+=icon(muteSvg,isMuted?'Включить звук':'Отключить звук',`ctxTargetId='${id}';ctxMuteToggle();closeChatDropdown()`);
    html+=icon(pinSvg,isPinned?'Открепить':'Закрепить',`ctxTargetId='${id}';ctxPinToggle();closeChatDropdown()`);
    html+=sep;
    html+=icon(trashSvg,'Удалить чат',`ctxTargetId='${id}';ctxDeleteChat();closeChatDropdown()`,'danger');
  }
  dd.innerHTML=html;
}

function toggleChatDropdown(e){
  e.stopPropagation();
  const dd=$('chDropdown');
  const opening=!dd.classList.contains('show');
  dd.classList.toggle('show');
  if(opening){
    // Stagger animation for items
    [...dd.querySelectorAll('.ch-dropdown-item')].forEach((el,i)=>{
      el.style.animationDelay=(i*0.025)+'s';
    });
    setTimeout(()=>document.addEventListener('click',closeChatDropdown,{once:true}),10);
  }
}

function closeChatDropdown(){
  $('chDropdown')?.classList.remove('show');
}

function updateReconBanner(){
  const id=activeChat;
  if(id==='ai'||id==='saved'||id===SLON_CHANNEL_ID||id.startsWith('g_')||_fbMode||conns[id]?.open||currentView==='profile'){
    $('reconBanner').classList.remove('show');return;
  }
  $('reconWho').textContent='@'+(peerNames[id]||id);
  $('reconBanner').classList.add('show');
}

function reconnectCurrent(){
  if(activeChat!=='ai'&&activeChat!=='saved'&&!activeChat.startsWith('g_')){
    $('reconBanner').classList.remove('show');
    silentConnect(activeChat);
    sysMsg(activeChat,'Подключение…');
  }
}

function addSbItem(pid){
  if($('si-'+pid)){updateSbName(pid);updateSbAvatar(pid);return;}
  if(_fbMode){_watchPresence(pid);_fetchProfile(pid);}
  const av=peerAvatars[pid];
  const d=document.createElement('div');d.className='sb-item';d.id='si-'+pid;d.onclick=()=>openChat(pid);d.oncontextmenu=e=>showChatCtxMenu(e,pid);
  d.innerHTML=`
    <div class="sb-av">
      <div class="sb-av-inner" id="sav-${pid}">${av?`<img src="${av}" style="width:100%;height:100%;object-fit:cover">`:_avHtml(pid,peerNames[pid]||pid)}</div>
      <div class="sb-av-dot" id="dot-${pid}"></div>
    </div>
    <div class="sb-info">
      <div class="sb-row1">
        <div class="sb-name" id="sbn-${pid}">${esc((peerNames[pid]||('@'+pid)).slice(0,20))}</div>
        <div class="sb-time" id="sbt-${pid}"></div>
      </div>
      <div class="sb-row2">
        <div class="sb-prev" id="sbp-${pid}">Ожидание…</div>
        <div id="badge-${pid}"></div>
      </div>
    </div>`;
  $('sbList').appendChild(d);
}

function addSbGroup(gid){
  if($('si-'+gid))return;const g=groups[gid]||{};
  const d=document.createElement('div');d.className='sb-item';d.id='si-'+gid;d.onclick=()=>openChat(gid);d.oncontextmenu=e=>showChatCtxMenu(e,gid);
  d.innerHTML=`
    <div class="sb-av">
      <div class="sb-av-inner" id="sav-${gid}">${g.avatar?`<img src="${g.avatar}" style="width:100%;height:100%;object-fit:cover">`:_avHtml(gid,g.name||'Группа')}</div>
    </div>
    <div class="sb-info">
      <div class="sb-row1">
        <div class="sb-name">${esc((g.name||'Группа').slice(0,20))}</div>
        <div class="sb-time" id="sbt-${gid}"></div>
      </div>
      <div class="sb-row2">
        <div class="sb-prev" id="sbp-${gid}">${g.members?.length||0} уч.</div>
        <div id="badge-${gid}"></div>
      </div>
    </div>`;
  $('sbList').appendChild(d);
}

function setSbStatus(pid,ok){
  const dot=$('dot-'+pid);if(dot)dot.classList.toggle('on',ok);
  if(ok)updatePreview(pid,'В сети');
  if(activeChat===pid){updateChatHeader();updateReconBanner();}
}

function updateSbName(pid){
  const badge=peerElephantBadges[pid]?' 🐘':'';
  const name=(peerNames[pid]||('@'+pid))+badge;
  const el=$('sbn-'+pid);if(el)el.textContent=name.slice(0,20);
  if(!peerAvatars[pid])updateSbAvatar(pid); // буквы на аватарке зависят от имени
  if(activeChat===pid)$('chName').textContent=name;
}

function updateSbAvatar(pid){
  const c=$('sav-'+pid);if(!c)return;const av=peerAvatars[pid];
  if(!av){c.innerHTML=_avHtml(pid,peerNames[pid]||pid);return;}
  let img=c.querySelector('img');
  if(!img){img=document.createElement('img');img.style.cssText='width:100%;height:100%;object-fit:cover';c.innerHTML='';c.appendChild(img);}
  img.src=av;if(activeChat===pid)updateChatHeader();
}

function updatePreview(id,txt,ts){
  const el=$('sbp-'+id);if(el)el.textContent=txt;
  // Update time
  if(ts){
    const te=$('sbt-'+id);
    if(te){
      const d=new Date(ts),now=new Date();
      const sameDay=d.toDateString()===now.toDateString();
      te.textContent=sameDay
        ?(d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0'))
        :(d.getDate()+'.'+(d.getMonth()+1).toString().padStart(2,'0'));
    }
  }
  // Sort sidebar item to top
  const item=$('si-'+id);
  if(item&&id!=='ai'){
    const list=$('sbList');
    const ai=$('si-ai');
    // Insert after ai
    if(ai&&ai.nextSibling!==item)list.insertBefore(item,ai.nextSibling||null);
  }
}

function addUnread(id){
  const w=$('badge-'+id);if(!w)return;
  const ex=w.querySelector('.sb-badge');const n=parseInt(ex?.textContent||'0')+1;
  const isMuted=!!mutedChats[id];
  w.innerHTML=`<span class="sb-badge${isMuted?' muted':''}">${n}</span>`;
}

function filterSb(q){
  q=q.trim().toLowerCase();
  const items=[...document.querySelectorAll('#sbList .sb-item')];
  let visIdx=0,localMatches=0;
  items.forEach(el=>{
    const nm=el.querySelector('.sb-name')?.textContent.toLowerCase()||'';
    const match=!q||nm.includes(q);
    if(match){
      if(q)localMatches++;
      // Показываем с мягким stagger-появлением
      if(el.classList.contains('sb-hidden')){
        el.classList.remove('sb-hidden');
        el.style.animation='none';
        void el.offsetWidth; // reflow чтобы анимация перезапустилась
        el.style.animation='sbFilterIn .28s cubic-bezier(.32,.72,0,1) both';
        el.style.animationDelay=(visIdx*0.02)+'s';
      }
      visIdx++;
    }else{
      if(!el.classList.contains('sb-hidden')){
        el.style.animation='sbFilterOut .16s ease both';
        el.classList.add('sb-hidden');
        setTimeout(()=>{if(el.classList.contains('sb-hidden'))el.style.display='none';},150);
      }
    }
    if(match)el.style.display='';
  });

  // ── Глобальный поиск: показываем только если нет локальных совпадений ──
  const gEl=$('sbGlobal');
  clearTimeout(_globalSearchTimer);
  if(!q||q.length<2||localMatches>0){
    gEl.style.display='none';
    return;
  }
  gEl.style.display='';
  $('sbGlobalBody').innerHTML='<div class="sb-global-loading">Ищем…</div>';
  _globalSearchTimer=setTimeout(()=>_runGlobalSearch(q),400);
}

async function _runGlobalSearch(q){
  const body=$('sbGlobalBody');
  if(!body)return;
  // Актуальность запроса — проверяем что поле поиска не изменилось за время debounce
  const curVal=($('sbSearchInp')?.value||'').trim().toLowerCase();
  if(curVal!==q)return;
  if(!_fbReady()||!window._fbDb){
    body.innerHTML='<div class="sb-global-empty">Нет соединения</div>';
    return;
  }
  const results=[];
  // «@valeryevich» и «valeryevich» — одно и то же
  q=q.replace(/^@/,'');
  if(!q)return;
  try{
    // Ищем человека по юзернейму
    // Профиль читаем всегда: у части юзеров нет узла auth/{username}, но
    // профиль опубликован — такие тоже должны находиться
    let prof=null;
    try{prof=(await _fbOnce('profiles/'+q))?.val()||null;}catch(e){}
    const userExists=!!prof||await _fbAccountExists(q);
    if(userExists&&q!==myUsername){
      results.push({type:'user',id:q,title:prof?.nick||('@'+q),sub:'@'+q,avatar:prof?.avatar||null});
    }
    // Ищем канал по юзернейму
    try{
      const csnap=await _fbOnce('user_channels/'+q+'/meta');
      const cmeta=csnap?.val();
      if(cmeta){
        results.push({type:'channel',id:q,title:(cmeta.name||q),sub:(cmeta.desc||'Канал')+' · @'+q,avatar:cmeta.avatar,meta:cmeta});
      }
    }catch(e){}
  }catch(e){}

  if(!results.length){
    body.innerHTML='<div class="sb-global-empty">Никого не нашли по «'+esc(q)+'»</div>';
    return;
  }
  body.innerHTML=results.map((r,i)=>{
    const avHtml=r.avatar?`<img src="${r.avatar}">`:(r.type==='channel'?'📢':'👤');
    const action=r.type==='user'
      ?`_globalSearchConnect('${r.id}')`
      :`_globalSearchSubscribe('${r.id}')`;
    return `<div class="sb-global-item" style="animation:sbFadeIn .22s ease both;animation-delay:${i*0.03}s" onclick="${action}">
      <div class="sb-global-av">${avHtml}</div>
      <div class="sb-global-info">
        <div class="sb-global-name">${esc(r.title)}</div>
        <div class="sb-global-sub">${esc(r.sub)}</div>
      </div>
    </div>`;
  }).join('');
}

function _globalSearchConnect(username){
  $('sbGlobal').style.display='none';
  $('sbSearchInp').value='';
  filterSb('');
  connectTo(username,'');
}

async function _globalSearchSubscribe(username){
  $('sbGlobal').style.display='none';
  $('sbSearchInp').value='';
  filterSb('');
  toast('Подписываемся…');
  try{
    const snap=await _fbOnce('user_channels/'+username+'/meta');
    const meta=snap?.val();
    if(!meta)return toast('Канал не найден');
    const channelId='ch_'+username;
    subscribedChannels[channelId]=meta;
    if(!chatHist[channelId])chatHist[channelId]=[];
    if(!$('si-'+channelId))_addChannelToSidebar(channelId,meta);
    if(window._fbDb){
      window._fbSet(window._fbRef(window._fbDb,'channel_subs/'+username+'/'+myUsername),true);
    }
    _listenUserChannel(channelId,username);
    saveAll();
    toast('✅ Подписались на @'+username);
    openChat(channelId);
  }catch(e){toast('Ошибка: '+e.message);}
}

function toggleSidebar(){$('sidebar').classList.toggle('open');$('sbOverlay').classList.toggle('show');}

function closeSidebar(){$('sidebar').classList.remove('open');$('sbOverlay').classList.remove('show');}

function backToList(){if(window.innerWidth<=640)toggleSidebar();}

function switchTab
(tab){
  if(tab==='chats'){
    closeMyProfilePanel();
    $('bn-chats').classList.add('active');$('bn-profile').classList.remove('active');
    if(currentView==='profile'){closeProfilePage();openChat(activeChat);}
  }else if(tab==='profile'){
    openProfile();
  }
}

function setNet(ok,txt){
  const dot=$('netDot'),dtxt=$('netTxt');
  const od=$('onlineDot');
  if(dot){dot.className='status-dot '+(ok?'online':'connecting');}
  if(od){od.className='status-dot '+(ok?'online':'connecting');}
  if(dtxt)dtxt.textContent=txt||'';
}

function toggleFabMenu(e){
  e.stopPropagation();
  const btn=$('fabBtn'),menu=$('fabMenu');
  const opening=!menu.classList.contains('show');
  menu.classList.toggle('show');
  btn.classList.toggle('open',opening);
  if(opening)setTimeout(()=>document.addEventListener('click',closeFabMenu,{once:true}),10);
}

function closeFabMenu(){
  $('fabMenu')?.classList.remove('show');
  $('fabBtn')?.classList.remove('open');
}

function toggleHamburgerMenu(e){
  e.stopPropagation();
  const menu=$('hbMenu'),bd=$('hbBackdrop');
  const opening=!menu.classList.contains('show');
  menu.classList.toggle('show');
  bd.classList.toggle('show',opening);
  if(opening){
    _updateHbProfileRow();
    [...menu.querySelectorAll(':scope > .hb-item')].forEach((el,i)=>{el.style.animationDelay=(i*0.025)+'s';});
    setTimeout(()=>document.addEventListener('click',closeHamburgerMenu,{once:true}),10);
  }
}

function closeHamburgerMenu(){
  $('hbMenu')?.classList.remove('show');
  $('hbBackdrop')?.classList.remove('show');
  _hideHbFlyout();
}

function _showHbFlyout(){
  clearTimeout(_hbFlyoutTimer);
  $('hbFlyout')?.classList.add('show');
}

function _hideHbFlyout(){
  clearTimeout(_hbFlyoutTimer);
  _hbFlyoutTimer=setTimeout(()=>$('hbFlyout')?.classList.remove('show'),150);
}

function _toggleHbFlyout(){
  // Тап (мобильные без hover) — переключаем видимость подменю
  const fl=$('hbFlyout');if(!fl)return;
  fl.classList.toggle('show');
}

function _openArchiveFromMenu(){
  const list=$('archiveList');
  if(!list||!list.querySelector('.sb-item')){toast('Архив пуст');return;}
  _arcOpen();
}

function _showContactsList(){
  const contacts=Object.keys(peerNames).filter(pid=>
    pid&&pid!==myUsername&&!pid.startsWith('g_')&&!pid.startsWith('ch_')&&pid!==SLON_CHANNEL_ID
  );
  const body=$('contactsPanelBody');
  if(!contacts.length){
    body.innerHTML=`<div class="sb-global-empty">Пока нет контактов — найди кого-то через поиск</div>`;
  }else{
    body.innerHTML=contacts.map((pid,i)=>{
      const av=peerAvatars[pid];
      const badge=peerElephantBadges[pid]?' 🐘':'';
      return `<div class="wiz-member-row" style="animation:sbFadeIn .22s ease both;animation-delay:${i*0.02}s" onclick="closeContactsPanel();openChat('${pid}')">
        <div class="wiz-member-av">${av?`<img src="${av}">`:_avHtml(pid,peerNames[pid]||pid)}</div>
        <div class="wiz-member-info"><div class="wiz-member-name">${esc(peerNames[pid]||('@'+pid))}${badge}</div></div>
      </div>`;
    }).join('');
  }
  $('contactsPanel').classList.add('show');
}

function closeContactsPanel(){
  $('contactsPanel')?.classList.remove('show');
}

function setupMobile(){
  const isMob=window.innerWidth<=640;
  const mb=$('menuBtn');if(mb)mb.style.display=isMob?'flex':'none';
  if(isMob&&$('sidebar'))$('sidebar').classList.remove('open');
}
