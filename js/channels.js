async function adminDeleteChannelPost(msg){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  const postKey=msg.channelPostId||msg.id;
  try{
    if(window._fbDb){
      // Удаляем из posts
      await window._fbRemove(window._fbRef(window._fbDb,'slon_channel/posts/'+postKey));
      // Пишем в deleted — это постоянный список, все устройства при старте его прочитают
      // и удалят пост из localStorage
      await window._fbSet(window._fbRef(window._fbDb,'slon_channel/deleted/'+postKey),true);
      await window._fbSet(window._fbRef(window._fbDb,'slon_channel/deleted/'+msg.id),true);
    }
    // Локально
    if(chatHist[SLON_CHANNEL_ID]){
      chatHist[SLON_CHANNEL_ID]=chatHist[SLON_CHANNEL_ID].filter(m=>m.id!==msg.id&&m.channelPostId!==postKey);
    }
    if(activeChat===SLON_CHANNEL_ID)renderChat(SLON_CHANNEL_ID);
    saveAll();
    toast('✅ Пост удалён у всех');
  }catch(e){toast('Ошибка: '+e.message);}
}

function adminEditChannelPost(msg){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  showModal(`
    <div class="m-title">✏️ Редактировать пост</div>
    <textarea class="m-ta" id="editChPostTa" maxlength="4000" style="min-height:160px">${esc(msg.text)}</textarea>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="adminSaveChannelPost('${msg.id}','${msg.channelPostId||msg.id}')">Сохранить</button>
    </div>
  `);
  setTimeout(()=>$('editChPostTa')?.focus(),100);
}

async function adminSaveChannelPost(msgId,postKey){
  const text=($('editChPostTa')?.value||'').trim();
  if(!text){toast('Текст не может быть пустым');return;}
  closeModal();
  try{
    if(window._fbDb){
      // Обновляем в Firebase
      const ref=window._fbRef(window._fbDb,'slon_channel/posts/'+postKey+'/text');
      await window._fbSet(ref,text);
    }
    // Локально
    const m=chatHist[SLON_CHANNEL_ID]?.find(x=>x.id===msgId);
    if(m){m.text=text;m.edited=true;}
    if(activeChat===SLON_CHANNEL_ID)renderChat(SLON_CHANNEL_ID);
    saveAll();
    toast('✅ Пост обновлён');
  }catch(e){toast('Ошибка: '+e.message);}
}

async function _doCreateChannelWizard(username,name,desc,avatar){
  const owned=Object.keys(myChannels).length;
  const maxOwned=myPremium?10:3;
  if(owned>=maxOwned)return toast(myPremium?'Максимум 10 каналов':'Максимум 3 канала — с ⭐ Premium можно больше');
  if(!_fbReady()||!window._fbDb)return toast('Нет соединения');
  toast('Проверяем юзернейм…');
  try{
    const snap=await _fbOnce('user_channels/'+username+'/meta');
    if(snap&&snap.val()){return toast('Этот юзернейм уже занят');}
    const channelId='ch_'+username;
    const meta={username,name,desc,owner:myUsername,
      bg:'bg0',bgColor:'',bgPattern:'',avatar:avatar||null,ts:Date.now()};
    await window._fbSet(window._fbRef(window._fbDb,'user_channels/'+username+'/meta'),meta);
    await window._fbSet(window._fbRef(window._fbDb,'channel_subs/'+username+'/'+myUsername),true);
    myChannels[channelId]=meta;
    _indexChannelOwner(username);
    _addChannelToSidebar(channelId,meta);
    _listenUserChannel(channelId,username);
    saveAll();
    toast('📢 Канал @'+username+' создан!');
    openChat(channelId);
  }catch(e){toast('Ошибка: '+e.message);}
}

function _applyChannelInputLock(id,isOwner){
  const inpWrap=$('inpWrap'),muteBar=$('channelMuteBar');
  if(isOwner){
    inpWrap.style.display='';
    muteBar.style.display='none';
  }else{
    inpWrap.style.display='none';
    muteBar.style.display='flex';
    _renderChannelMuteBtn(id);
  }
}

function _renderChannelMuteBtn(id){
  const btn=$('channelMuteBtn'),icon=$('channelMuteIcon'),lbl=$('channelMuteLabel');
  if(!btn)return;
  const isMuted=!!mutedChats[id];
  btn.classList.toggle('muted',isMuted);
  lbl.textContent=isMuted?'Уведомления выключены':'Уведомления включены';
  icon.innerHTML=`
    <svg class="cmb-on" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
    <svg class="cmb-off" viewBox="0 0 24 24"><path d="M18 16.08c.67-.06 1.27-.35 1.73-.81L21 14c.49-.49.49-1.28 0-1.77l-4.24-4.24-4.24-4.24L4.27 1.49 3 2.77l4.5 4.5C6.61 8.24 6 9.56 6 11v4c0 1.1-.9 2-2 2v1h9.05l2.86 2.86 1.27-1.27L18 16.08zM7.58 9.35L17 18.76V19H5v-8c0-1.17.45-2.23 1.17-3.02l1.41 1.37zM11 21c1.1 0 2-.9 2-2H9c0 1.1.9 2 2 2zm1.5-14h-1V5.73L15 9.23V11h-2.5z"/></svg>`;
}

function _toggleChannelMute(){
  const id=activeChat;if(!id)return;
  const btn=$('channelMuteBtn');
  btn.style.transform='scale(.92)';
  setTimeout(()=>{btn.style.transform='';},150);
  if(mutedChats[id])delete mutedChats[id];else mutedChats[id]=true;
  saveAll();
  _renderChannelMuteBtn(id);
  _updateSbMuteIcon(id);
  toast(mutedChats[id]?'🔕 Уведомления выключены':'🔔 Уведомления включены');
}

function showChannelPublish(){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  showModal(`
    <div class="m-title">📝 Новый пост в канале</div>
    <textarea class="m-ta" id="chPostTa" placeholder="Текст поста… Поддерживаются эмодзи 🐘" maxlength="4000" style="min-height:160px"></textarea>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="publishChannelPost()">📢 Опубликовать</button>
    </div>
  `);
  setTimeout(()=>$('chPostTa')?.focus(),100);
}

async function publishChannelPost(){
  const text=($('chPostTa')?.value||'').trim();
  if(!text){toast('Введи текст поста');return;}
  closeModal();
  if(!_fbReady()||!window._fbDb){toast('Нет подключения к Firebase');return;}
  const postId='post_'+Date.now();
  const ts=Date.now();
  try{
    // Пишем в список постов (сохраняется навсегда, можно удалить)
    const postRef=window._fbRef(window._fbDb,'slon_channel/posts/'+postId);
    await window._fbSet(postRef,{id:postId,text,ts,author:myUsername});
    // Тоже пишем в latest для обратной совместимости
    await window._fbSet(window._fbRef(window._fbDb,'slon_channel/latest'),{id:postId,text,ts,author:myUsername});
    toast('✅ Пост опубликован!');
  }catch(e){
    toast('Ошибка: '+e.message);
    console.error('publishChannelPost:',e);
  }
}

function showCreateChannel(){
  if(!myPremium)return toast('⭐ Нужна подписка SLON PREMIUM');
  const owned=Object.keys(myChannels).length;
  if(owned>=3)return toast('Максимум 3 канала на одном аккаунте');
  showModal(`
    <div class="m-title">📢 Создать канал</div>
    <input class="m-inp" id="chUsernameInp" placeholder="Юзернейм канала (без @, только a-z 0-9 _)"
      maxlength="20" autocapitalize="none" spellcheck="false"
      oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'')">
    <input class="m-inp" id="chNameInp" placeholder="Название канала" maxlength="40">
    <textarea class="m-ta" id="chDescInp" placeholder="Описание (необязательно)" maxlength="200" style="min-height:70px"></textarea>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doCreateChannel()">Создать</button>
    </div>
  `);
  setTimeout(()=>$('chUsernameInp')?.focus(),100);
}

async function doCreateChannel(){
  const username=($('chUsernameInp')?.value||'').trim();
  const name=($('chNameInp')?.value||'').trim();
  const desc=($('chDescInp')?.value||'').trim();
  if(!username)return toast('Введи юзернейм канала');
  if(username.length<3)return toast('Юзернейм минимум 3 символа');
  if(!name)return toast('Введи название канала');
  if(!_fbReady()||!window._fbDb)return toast('Нет соединения');

  // Проверяем уникальность
  closeModal();
  toast('Проверяем юзернейм…');
  try{
    const snap=await _fbOnce('user_channels/'+username+'/meta');
    if(snap&&snap.val()){return toast('Этот юзернейм уже занят');}
    const channelId='ch_'+username;
    const meta={username,name,desc,owner:myUsername,
      bg:'bg0',bgColor:'',bgPattern:'',avatar:null,ts:Date.now()};
    await window._fbSet(window._fbRef(window._fbDb,'user_channels/'+username+'/meta'),meta);
    // Подписываем владельца
    await window._fbSet(window._fbRef(window._fbDb,'channel_subs/'+username+'/'+myUsername),true);
    myChannels[channelId]=meta;
    _indexChannelOwner(username);
    // Добавляем в sidebar
    _addChannelToSidebar(channelId,meta);
    _listenUserChannel(channelId,username);
    saveAll();
    toast('📢 Канал @'+username+' создан!');
    // Открываем настройки канала
    setTimeout(()=>showChannelSettings(channelId),400);
  }catch(e){toast('Ошибка: '+e.message);}
}

function showChannelSettings(channelId){
  const ch=myChannels[channelId];if(!ch)return;
  if(ch.owner!==myUsername)return;
  const curColor=ch.bgColor||'#1d4ed8';
  showModal(`
    <div class="m-title">⚙️ Настройки @${esc(ch.username)}</div>
    <input class="m-inp" id="chSetName" placeholder="Название" maxlength="40" value="${esc(ch.name||'')}">
    <textarea class="m-ta" id="chSetDesc" placeholder="Описание" maxlength="200" style="min-height:60px">${esc(ch.desc||'')}</textarea>
    <div class="admin-console-title" style="margin:10px 0 6px">🖼 Аватарка канала</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div id="chAvPreview" style="width:48px;height:48px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:22px">${ch.avatar?`<img src="${ch.avatar}" style="width:100%;height:100%;object-fit:cover">`:'📢'}</div>
      <button class="admin-row" onclick="document.getElementById('chAvInput').click()">📷 Загрузить</button>
      <input type="file" id="chAvInput" accept="image/*" style="display:none" onchange="chLoadAvatar('${channelId}',this)">
    </div>
    <div class="admin-console-title" style="margin:10px 0 6px">🎨 Цвет фона профиля</div>
    <input type="color" id="chColorPicker" value="${curColor}" style="width:100%;height:52px;border:none;border-radius:10px;cursor:pointer;margin-bottom:6px">
    <div id="chColorPreview" style="height:48px;border-radius:10px;margin-bottom:8px;background:${curColor}"></div>
    <div class="admin-console-title" style="margin:8px 0 6px">📌 Паттерн</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      <button class="admin-row${!ch.bgPattern?' sel':''}" style="padding:6px 10px" id="chPat_">Нет</button>
      ${PREMIUM_BG_PATTERNS.map(p=>`<button class="admin-row${ch.bgPattern===p.id?' sel':''}" style="padding:6px 10px" id="chPat_${p.id}">${p.emoji} ${p.label}</button>`).join('')}
    </div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Закрыть</button>
      <button class="btn-ok" onclick="saveChannelSettings('${channelId}')">Сохранить</button>
    </div>
  `);
  // Wiring
  const picker=$('chColorPicker');const prev=$('chColorPreview');
  if(picker&&prev){picker.addEventListener('input',e=>{prev.style.background=e.target.value;});}
  // Pattern buttons
  ['', ...PREMIUM_BG_PATTERNS.map(p=>p.id)].forEach(patId=>{
    const btn=$('chPat_'+patId);
    if(btn)btn.onclick=()=>{
      myChannels[channelId].bgPattern=patId;
      document.querySelectorAll('[id^="chPat_"]').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
    };
  });
}

function chLoadAvatar(channelId,input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const dataUrl=e.target.result;
    // Сжимаем до 64px
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
      const ctx=canvas.getContext('2d');
      const s=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,64,64);
      const thumb=canvas.toDataURL('image/jpeg',0.8);
      if(myChannels[channelId])myChannels[channelId].avatar=thumb;
      const prev=$('chAvPreview');
      if(prev)prev.innerHTML=`<img src="${thumb}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    };
    img.src=dataUrl;
  };
  reader.readAsDataURL(file);
}

async function saveChannelSettings(channelId){
  const ch=myChannels[channelId];if(!ch)return;
  const name=($('chSetName')?.value||'').trim()||ch.name;
  const desc=($('chSetDesc')?.value||'').trim();
  const bgColor=$('chColorPicker')?.value||ch.bgColor||'';
  const bgPattern=ch.bgPattern||'';
  const avatar=ch.avatar||null;
  closeModal();
  const updated={...ch,name,desc,bgColor,bgPattern,avatar};
  myChannels[channelId]=updated;
  // Обновляем в Firebase
  try{
    await window._fbSet(window._fbRef(window._fbDb,'user_channels/'+ch.username+'/meta'),{
      ...updated,ts:Date.now()
    });
    // Обновляем локально и в sidebar
    peerNames[channelId]='📢 '+(updated.name||('@'+ch.username));
    peerAvatars[channelId]=updated.avatar||null;
    peerProfileBgColors[channelId]=updated.bgColor||'';
    peerProfilePatterns[channelId]=updated.bgPattern||'';
    updateSbName(channelId);updateSbAvatar(channelId);
    if(activeChat===channelId)updateChatHeader();
    saveAll();
    toast('✅ Настройки сохранены');
  }catch(e){toast('Ошибка: '+e.message);}
}

function showUserChannelPublish(channelId){
  const ch=myChannels[channelId];
  if(!ch||ch.owner!==myUsername)return;
  showModal(`
    <div class="m-title">📝 Пост в @${esc(ch.username)}</div>
    <textarea class="m-ta" id="userChPostTa" placeholder="Текст поста…" maxlength="4000" style="min-height:160px"></textarea>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="publishUserChannelPost('${channelId}')">📢 Опубликовать</button>
    </div>
  `);
  setTimeout(()=>$('userChPostTa')?.focus(),100);
}

async function publishUserChannelPost(channelId){
  const ch=myChannels[channelId];if(!ch)return;
  const text=($('userChPostTa')?.value||'').trim();
  if(!text)return toast('Введи текст поста');
  closeModal();
  if(!window._fbDb)return toast('Нет соединения');
  const postId='post_'+Date.now();const ts=Date.now();
  try{
    // Пишем в Firebase — onChildAdded сам добавит в UI (нет локального дублирования)
    await window._fbSet(window._fbRef(window._fbDb,'user_channels/'+ch.username+'/posts/'+postId),
      {id:postId,text,ts,author:myUsername});
    toast('✅ Опубликовано');
  }catch(e){toast('Ошибка: '+e.message);}
}

function showSubscribeChannel(){
  showModal(`
    <div class="m-title">📢 Подписаться на канал</div>
    <div class="m-info">Введи юзернейм канала (без @)</div>
    <input class="m-inp" id="subChInp" placeholder="username_канала" maxlength="20"
      autocapitalize="none" spellcheck="false"
      oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'')">
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doSubscribeChannel()">Подписаться</button>
    </div>
  `);
  setTimeout(()=>$('subChInp')?.focus(),100);
}

async function doSubscribeChannel(){
  const username=($('subChInp')?.value||'').trim();
  if(!username)return toast('Введи юзернейм');
  closeModal();
  toast('Ищем канал…');
  try{
    const snap=await _fbOnce('user_channels/'+username+'/meta');
    const meta=snap?.val();
    if(!meta)return toast('Канал @'+username+' не найден');
    const channelId='ch_'+username;
    subscribedChannels[channelId]=meta;
    peerNames[channelId]='📢 '+meta.name;
    peerAvatars[channelId]=meta.avatar||null;
    if(!chatHist[channelId])chatHist[channelId]=[];
    if(!$('si-'+channelId))_addChannelToSidebar(channelId,meta);
    // Подписываемся в Firebase
    if(window._fbDb){
      window._fbSet(window._fbRef(window._fbDb,'channel_subs/'+username+'/'+myUsername),true);
    }
    _listenUserChannel(channelId,username);
    saveAll();
    toast('✅ Подписались на @'+username);
    openChat(channelId);
  }catch(e){toast('Ошибка: '+e.message);}
}

function _addChannelToSidebar(channelId,meta){
  peerNames[channelId]='📢 '+(meta.name||('@'+meta.username));
  peerAvatars[channelId]=meta.avatar||null;
  if(!chatHist[channelId])chatHist[channelId]=[];
  if(!$('si-'+channelId))addSbItem(channelId);
  // Применяем фон профиля канала
  if(meta.bg)peerProfileBgs[channelId]=meta.bg;
  if(meta.bgColor!==undefined)peerProfileBgColors[channelId]=meta.bgColor||'';
  if(meta.bgPattern!==undefined)peerProfilePatterns[channelId]=meta.bgPattern||'';
}

function _listenUserChannel(channelId,username){
  if(!window._fbDb||!username)return;
  if(_myChannelListeners[channelId]){return;} // уже слушаем
  const ref=window._fbRef(window._fbDb,'user_channels/'+username+'/posts');
  const unsub=window._fbOnChildAdded(ref,snap=>{
    const d=snap.val();if(!d||!d.text)return;
    const already=(chatHist[channelId]||[]).some(m=>m.id===d.id);
    if(already)return;
    if(!chatHist[channelId])chatHist[channelId]=[];
    const ts=d.ts||Date.now();
    const meta=myChannels[channelId]||subscribedChannels[channelId]||{};
    const chAvatar=meta.avatar||peerAvatars[channelId]||null;
    const msg={id:d.id,sender:'inc',name:'📢 '+(meta.name||username),avatar:chAvatar,ts,time:fmtTime(ts),text:d.text};
    chatHist[channelId].push(msg);
    if(activeChat===channelId){renderChat(channelId);scrollDown();}
    else{addUnread(channelId);if(!mutedChats[channelId]&&_notifOn('channels'))toast('📢 Новый пост в @'+username+(myNotif.channelsPreview!==false?': '+String(d.text).slice(0,40):'!'),3000);}
    saveAll();
  });
  _myChannelListeners[channelId]=unsub;
  // Также слушаем мета (обновления названия/фона)
  window._fbOnValue(window._fbRef(window._fbDb,'user_channels/'+username+'/meta'),snap=>{
    const d=snap.val();if(!d)return;
    const existing=myChannels[channelId]||subscribedChannels[channelId]||{};
    const updated={...existing,...d};
    if(myChannels[channelId])myChannels[channelId]=updated;
    if(subscribedChannels[channelId])subscribedChannels[channelId]=updated;
    _addChannelToSidebar(channelId,updated);
    updateSbName(channelId);
    if(activeChat===channelId)updateChatHeader();
  });
}

async function _loadMyChannels(){
  if(!window._fbDb||!myUsername)return;
  // Ищем каналы где owner = myUsername
  try{
    const snap=await _fbOnce('user_channels_by_owner/'+myUsername);
    const d=snap?.val();
    if(d){
      Object.keys(d).forEach(username=>{
        const channelId='ch_'+username;
        // load meta
        _fbOnce('user_channels/'+username+'/meta').then(s=>{
          const meta=s?.val();if(!meta)return;
          myChannels[channelId]=meta;
          _addChannelToSidebar(channelId,meta);
          _listenUserChannel(channelId,username);
        });
      });
    }
  }catch(e){}
  // Ищем подписки
  try{
    const snap2=await _fbOnce('channel_subs_by_user/'+myUsername);
    const d2=snap2?.val();
    if(d2){
      Object.keys(d2).forEach(username=>{
        const channelId='ch_'+username;
        if(myChannels[channelId])return; // уже есть как свой
        _fbOnce('user_channels/'+username+'/meta').then(s=>{
          const meta=s?.val();if(!meta)return;
          subscribedChannels[channelId]=meta;
          _addChannelToSidebar(channelId,meta);
          _listenUserChannel(channelId,username);
        });
      });
    }
  }catch(e){}
}

async function _indexChannelOwner(username){
  if(!window._fbDb)return;
  try{
    await window._fbSet(window._fbRef(window._fbDb,'user_channels_by_owner/'+myUsername+'/'+username),true);
    await window._fbSet(window._fbRef(window._fbDb,'channel_subs_by_user/'+myUsername+'/'+username),true);
  }catch(e){}
}
