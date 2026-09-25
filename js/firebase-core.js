function _fbStopListen(username){
  if(_fbListeners[username]){
    try{_fbListeners[username]();}catch(e){}
    delete _fbListeners[username];
  }
}

function initPeer(){
  if(!myUsername){showUsernameOverlay();return;}
  myId=myUsername;
  setMyLabel();
  updateProfileDisplay();
  if(_fbReady()){
    initFirebaseMode();
  } else {
    setNet(false,'Подключение…');
    // Polling — ждём Firebase каждые 100мс (надёжнее чем событие)
    let attempts=0;
    const poll=setInterval(()=>{
      attempts++;
      if(_fbReady()){
        clearInterval(poll);
        if(!_fbMode)initFirebaseMode();
      }else if(attempts>80){ // 8 секунд
        clearInterval(poll);
        setNet(false,'⚠ Firebase не загрузился — проверь интернет');
      }
    },100);
  }
}

function _fbReady(){return !!window._firebaseReady;}

function initFirebaseMode(){
  if(_fbMode)return;
  if(!_fbReady()){
    let p=setInterval(()=>{if(_fbReady()){clearInterval(p);initFirebaseMode();}},100);
    return;
  }
  _fbMode=true;
  setNet(true,'@'+myUsername);
  _checkFirebaseRules();
  _fbListen(myUsername);
  _startMyPresence();
  Object.keys(peerNames).forEach(pid=>{_watchPresence(pid);_fetchProfile(pid);});
  setTimeout(()=>{
    Object.keys(peerNames).forEach(pid=>_fbSilentConnect(pid));
    _initSlonChannel();
  },800);
  _fbListenSent(myUsername);
  // Звонок взят/отклонён на другом нашем устройстве — гасим здесь
  if(typeof _listenCallSync==='function')_listenCallSync();
  // Синхронизация групп между устройствами одного аккаунта
  _fbListenMyGroups();
  // Запускаем Firebase-слушатели групповых сообщений
  setTimeout(_fbListenAllGrpMsgs, 1500);
  // Проверяем бан-статус текущего пользователя
  _checkBanStatus();
  _loadAdminsFromFirebase();
  setTimeout(()=>{
    _loadMyChannels();
    // Перезапускаем слушателей каналов (Firebase мог не быть готов при rebuildSidebar)
    Object.entries(myChannels).forEach(([cid,meta])=>{ if(meta.username)_listenUserChannel(cid,meta.username); });
    Object.entries(subscribedChannels).forEach(([cid,meta])=>{ if(meta.username)_listenUserChannel(cid,meta.username); });
  },2000);
  // Загружаем список забаненных для admins
  if(CHANNEL_ADMINS.has(myUsername)&&window._fbDb){
    window._fbOnValue(window._fbRef(window._fbDb,"bans"),snap=>{
      const d=snap.val()||{};
      bannedUsers={};
      Object.entries(d).forEach(([pid,info])=>{if(info&&info.until>Date.now())bannedUsers[pid]=info;});
    },{onlyOnce:false});
  }
  // Проверяем слонгалочку через Firebase
  setTimeout(()=>{
    _checkElephantBadgeFirebase();
    _checkPremiumStatus();
    if(myUsername==='vadimslonik67')_grantElephantBadge('vadimslonik67');
    _fetchPeerElephantBadges();
    _fetchPeerPremiums();
  },1500);
}

function _initSlonChannel(){
  if(!peerNames[SLON_CHANNEL_ID]){
    peerNames[SLON_CHANNEL_ID]='SLON Новости';
    peerAvatars[SLON_CHANNEL_ID]=null;
    if(!chatHist[SLON_CHANNEL_ID])chatHist[SLON_CHANNEL_ID]=[];
    const already=chatHist[SLON_CHANNEL_ID].some(m=>m.text&&m.text.includes('SLON v0.9'));
    if(!already){
      const cid='ch_'+Date.now();const ts=Date.now();
      chatHist[SLON_CHANNEL_ID].push({id:cid,sender:'inc',name:'🐘 SLON',ts,time:fmtTime(ts),text:SLON_CHANGELOG});
    }
    if(!$('si-'+SLON_CHANNEL_ID))addSbItem(SLON_CHANNEL_ID);
    saveAll();
    toast('📢 Новости SLON — проверь канал!',4000);
  }
  if(!window._fbDb)return;
  try{
    // Слушаем список постов (slon_channel/posts/{id})
    window._fbOnChildAdded(window._fbRef(window._fbDb,'slon_channel/posts'),snap=>{
      const d=snap.val();if(!d||!d.text)return;
      const already=(chatHist[SLON_CHANNEL_ID]||[]).some(m=>m.id===d.id);
      if(already)return;
      if(!chatHist[SLON_CHANNEL_ID])chatHist[SLON_CHANNEL_ID]=[];
      const ts=d.ts||Date.now();
      chatHist[SLON_CHANNEL_ID].push({id:d.id,sender:'inc',name:'🐘 SLON',ts,time:fmtTime(ts),text:d.text,channelPostId:snap.key});
      if(activeChat===SLON_CHANNEL_ID){renderChat(SLON_CHANNEL_ID);scrollDown();}
      else{addUnread(SLON_CHANNEL_ID);toast('📢 Новое в SLON-канале!',4000);}
      saveAll();
    });
    // Слушаем удаления постов
    window._fbOnChildAdded(window._fbRef(window._fbDb,'slon_channel/deleted'),snap=>{
      const deletedId=snap.key;
      if(!deletedId)return;
      // Убираем из локальной истории (и при перезагрузке тоже)
      if(chatHist[SLON_CHANNEL_ID]){
        const before=chatHist[SLON_CHANNEL_ID].length;
        chatHist[SLON_CHANNEL_ID]=chatHist[SLON_CHANNEL_ID].filter(
          m=>m.id!==deletedId&&m.channelPostId!==deletedId
        );
        if(chatHist[SLON_CHANNEL_ID].length!==before){
          if(activeChat===SLON_CHANNEL_ID)renderChat(SLON_CHANNEL_ID);
          saveAll();
        }
      }
    });
    // Слушаем удаления из posts-ноды (для onChildRemoved на живых сессиях)
    window._fbOnChildRemoved(window._fbRef(window._fbDb,'slon_channel/posts'),snap=>{
      if(!chatHist[SLON_CHANNEL_ID])return;
      const key=snap.key;
      chatHist[SLON_CHANNEL_ID]=chatHist[SLON_CHANNEL_ID].filter(m=>m.channelPostId!==key&&m.id!==key);
      if(activeChat===SLON_CHANNEL_ID)renderChat(SLON_CHANNEL_ID);
      saveAll();
    });
    // Слушаем legacy latest (обратная совместимость)
    window._fbOnValue(window._fbRef(window._fbDb,'slon_channel/latest'),snap=>{
      const d=snap.val();if(!d||!d.text)return;
      const already=(chatHist[SLON_CHANNEL_ID]||[]).some(m=>m.id===d.id);
      if(already)return;
      if(!chatHist[SLON_CHANNEL_ID])chatHist[SLON_CHANNEL_ID]=[];
      const ts=d.ts||Date.now();
      chatHist[SLON_CHANNEL_ID].push({id:d.id,sender:'inc',name:'🐘 SLON',ts,time:fmtTime(ts),text:d.text});
      if(activeChat===SLON_CHANNEL_ID){renderChat(SLON_CHANNEL_ID);scrollDown();}
      else{addUnread(SLON_CHANNEL_ID);toast('📢 Новое в SLON-канале!',4000);}
      saveAll();
    },{onlyOnce:false});
  }catch(e){console.warn('_initSlonChannel:',e);}
}

function _fbListenSent(username){
  if(!_fbReady()||!window._fbDb)return;
  const db=window._fbDb;
  const sentRef=window._fbRef(db,'sent/'+username);
  // Слушаем только новые записи (после старта)
  if(_sentListener){try{_sentListener();}catch(e){}}
  _sentListener=window._fbOnChildAdded(sentRef,snap=>{
    const data=snap.val();
    if(!data||!data.ts)return;
    if(data.ts<=_lastSyncTs)return; // игнорируем старые
    if(data._device===_myDeviceId)return; // наше собственное — уже есть
    // Это сообщение отправлено с другого устройства
    const pid=data.to;
    if(!pid)return;
    if(!chatHist[pid])chatHist[pid]=[];
    if(chatHist[pid].some(m=>m.id===data.id))return; // дедупликация
    const msg={id:data.id,sender:'me',text:data.text,ts:data.ts,time:fmtTime(data.ts),status:'sent'};
    chatHist[pid].push(msg);
    chatHist[pid].sort((a,b)=>(a.ts||0)-(b.ts||0));
    if(activeChat===pid){appendMsg(msg);scrollDown();}
    updatePreview(pid,'Вы: '+( data.text||'').slice(0,28));
    saveAll();
    // Удаляем из Firebase (уже синхронизировано)
    window._fbRemove(snap.ref).catch(()=>{});
  });
}

function _syncSentMsg(toPid,mid,text,ts){
  if(!_fbMode||!window._fbDb)return;
  try{
    const db=window._fbDb;
    const ref=window._fbRef(db,'sent/'+myUsername);
    window._fbPush(ref,{id:mid,to:toPid,text,ts,_device:_myDeviceId});
  }catch(e){}
}

function _fbListen(username){
  if(!_fbReady())return;
  const db=window._fbDb;
  const inbox=window._fbRef(db,'inbox/'+username);
  window._fbOnChildAdded(inbox,snap=>{
    const data=snap.val();
    if(!data)return;
    // Удаляем сообщение из inbox после прочтения
    window._fbRemove(snap.ref).catch(()=>{});
    const pid=data.from;
    if(!pid)return;
    if(pid===myUsername){
      if(data.payload?.type==='call_self_sync'){
        onData(myUsername,data.payload);
      }
      return;
    }
    // Игнорируем сообщения от заблокированных пользователей
    if(blockedUsers[pid])return;
    // Настройки конфиденциальности: кто может писать/звонить/добавлять в группы
    if(data.payload&&!_privacyGate(pid,data.payload))return;
    // Новый чат от незнакомца — в архив и без звука (если включено)
    if(!peerNames[pid]&&myPrivacy.archiveUnknown){archivedChats[pid]=true;mutedChats[pid]=true;}
    // Незнакомый/удалённый чат не воскрешаем служебными сообщениями (hello, typing…)
    if(!peerNames[pid]&&!_mayCreateChat(data.payload))return;
    // Авто-добавляем в контакты если новый
    if(!peerNames[pid]){
      peerNames[pid]='@'+pid;
      if(!chatHist[pid])chatHist[pid]=[];
      if(!$('si-'+pid))addSbItem(pid);
      saveAll();
    }
    // Помечаем как онлайн и следим за присутствием
    _fbConns[pid]=true;
    setSbStatus(pid,true);
    _watchPresence(pid);
    if(activeChat===pid){updateChatHeader();updateReconBanner();}
    // Обрабатываем данные
    if(data.payload&&typeof data.payload==='object'){
      onData(pid,data.payload);
    }
  });
}

function _watchPresence(pid){
  if(_presenceWatchers[pid]||!window._fbDb)return;
  const r=window._fbRef(window._fbDb,'presence/'+pid);
  const unsub=window._fbOnValue(r,snap=>{
    const data=snap.val();
    const rawOnline=!!(data&&data.online&&(Date.now()-data.ts)<60000);
    // Если пользователь забанен — не показываем онлайн
    const isBanned=bannedUsers[pid]&&bannedUsers[pid].until>Date.now();
    const online=rawOnline&&!isBanned;
    peerLastSeen[pid]=data&&data.ls?data.ls:0;
    _fbConns[pid]=online;
    setSbStatus(pid,online);
    if(activeChat===pid){updateChatHeader();updateReconBanner();}
  });
  _presenceWatchers[pid]=unsub;
}

function _checkFirebaseRules(){
  // Пишем тестовую запись — если RTDB правила запрещают, покажем предупреждение
  if(!window._fbDb)return;
  const testRef=window._fbRef(window._fbDb,'_slon_test/'+myUsername);
  window._fbSet(testRef,{ts:Date.now()})
    .then(()=>{window._fbRemove(testRef).catch(()=>{});})
    .catch(e=>{
      console.error('Firebase RTDB rules error:',e);
      setTimeout(()=>{
        toast('⚠ Firebase: нет прав на запись. Открой консоль Firebase → Realtime Database → Rules и установи: {"rules":{".read":true,".write":true}}',8000);
      },1000);
    });
}

async function _startMyPresence(){
  if(!window._fbDb||!myUsername)return;
  const presRef=window._fbRef(window._fbDb,'presence/'+myUsername);
  // ls — время последнего захода для других (0, если скрыто в конфиденциальности)
  const pres=online=>{const ts=Date.now();return {online,ts,ls:myPrivacy.lastSeen==='nobody'?0:ts};};
  window._fbSet(presRef,pres(true));
  setInterval(()=>{
    if(myUsername&&window._fbDb)
      window._fbSet(window._fbRef(window._fbDb,'presence/'+myUsername),pres(true));
  },25000);
  window.addEventListener('beforeunload',()=>{
    // Не удаляем запись, а помечаем офлайн — чтобы у других было «был(а) в …»
    window._fbSet(window._fbRef(window._fbDb,'presence/'+myUsername),pres(false));
  });
  // Сначала тянем профиль из Firebase, потом публикуем (с актуальными данными)
  _fetchAndApplyMyProfile().then(()=>_publishMyProfile()).catch(()=>_publishMyProfile());
}

async function _publishMyProfile(oldUsername){
  if(!window._fbDb||!myUsername)return;
  try{
    // Читаем текущий профиль из Firebase
    const snap=await new Promise(res=>{
      window._fbOnValue(window._fbRef(window._fbDb,'profiles/'+myUsername),s=>res(s),{onlyOnce:true});
    });
    const existing=snap?.val()||{};

    // Мержим: локальные данные перезаписывают Firebase только если они НЕ пустые
    // Если локальный ник пустой — берём из Firebase (чтобы не затереть с другого устройства)
    const nick=myNick||existing.nick||'';
    const avatar=myAvatar||existing.avatar||null;
    const bio=myBio||existing.bio||'';
    const profileBg=myProfileBg||existing.profileBg||'bg0';

    // Применяем Firebase данные локально если наши пустые
    let localChanged=false;
    if(!myNick&&existing.nick){myNick=existing.nick;localChanged=true;}
    if(!myAvatar&&existing.avatar){myAvatar=existing.avatar;localChanged=true;}
    if(!myBio&&existing.bio){myBio=existing.bio;localChanged=true;}
    if(!myProfileBg&&existing.profileBg){myProfileBg=existing.profileBg;localChanged=true;}
    if(localChanged){updateProfileDisplay();setMyLabel();saveAll();}

    const data=_myPublicProfile({nick,avatar,bio,profileBg});
    window._fbSet(window._fbRef(window._fbDb,'profiles/'+myUsername),data);

    if(oldUsername&&oldUsername!==myUsername){
      window._fbSet(window._fbRef(window._fbDb,'profiles/'+oldUsername),
        {redirectTo:myUsername,username:myUsername,ts:Date.now()});
    }
  }catch(e){
    // Если читать не удалось — пишем то что есть локально
    const data=_myPublicProfile({nick:myNick||'',avatar:myAvatar||null,bio:myBio||'',profileBg:myProfileBg||'bg0'});
    window._fbSet(window._fbRef(window._fbDb,'profiles/'+myUsername),data);
  }
}

function _fbSilentConnect(pid){
  if(!_fbReady()||!pid||pid===myUsername)return;
  // Отправляем hello через Firebase
  _fbSend(pid,_myHelloFor(pid));
  // Сразу читаем публичный профиль собеседника
  _fetchProfile(pid);
}

function _fetchProfile(pid){
  if(!window._fbDb||!pid)return;
  // Отписываемся от старой подписки если есть
  if(_profileWatchers[pid])_profileWatchers[pid]();
  const r=window._fbRef(window._fbDb,'profiles/'+pid);
  const unsub=window._fbOnValue(r,snap=>{
    const d=snap.val();
    if(!d)return;
    // Если профиль содержит redirect — следуем за ним
    if(d.redirectTo&&d.redirectTo!==pid){_fetchProfile(d.redirectTo);return;}
    // Если контакт сменил username — iid поможет его найти
    const newUsername=d.username||pid;
    const newName=d.nick&&d.nick!==''?d.nick:'@'+newUsername;
    peerNames[pid]=newName;
    if(d.avatar!==undefined){peerAvatars[pid]=d.avatar||null;updateSbAvatar(pid);}
    if(d.bio!==undefined)peerBios[pid]=d.bio||'';
    if(d.profileBg)peerProfileBgs[pid]=d.profileBg;
    if(d.bgColor!==undefined)peerProfileBgColors[pid]=d.bgColor||'';
    if(d.bgPattern!==undefined)peerProfilePatterns[pid]=d.bgPattern||'';
    if(d.avFrame!==undefined)peerAvFrames[pid]=d.avFrame||'';
    if(d.profileWallpaper!==undefined)peerProfileWallpapers[pid]=d.profileWallpaper||'';
    if(d.profileTheme!==undefined)peerProfileThemes[pid]=d.profileTheme||'';
    peerLinkedChannels[pid]=d.linkedChannel||'';
    _applyExtraProfile(pid,d);
    // Если username изменился — следим и за новым профилем
    if(newUsername!==pid&&!_profileWatchers[newUsername]){
      _watchPresence(newUsername);
      _fetchProfile(newUsername);
    }
    if(d.iid){peerIids[pid]=d.iid;mergeByInternalId(pid,d.iid);}
    updateSbName(pid);
    if(activeChat===pid)updateChatHeader();
    saveAll();
  });
  _profileWatchers[pid]=unsub;
}

function _fbSend(pid,data){
  if(!_fbReady()||!window._fbDb)return false;
  try{
    const db=window._fbDb;
    const inboxRef=window._fbRef(db,'inbox/'+pid);
    window._fbPush(inboxRef,{from:myUsername,payload:data,ts:Date.now()});
    // Помечаем как доставлено если это обычное сообщение
    if(data.type==='msg'&&data.id){
      const hist=chatHist[pid];
      if(hist){
        const m=hist.find(x=>x.id===data.id);
        if(m&&m.status==='sent'){m.status='delivered';_updateMsgStatus(data.id,'delivered');}
      }
    }
    return true;
  }catch(e){console.warn('Firebase send error:',e);return false;}
}

function silentConnect(pid){
  if(pid===myUsername)return;
  if(conns[pid]?.open)return;
  if(_fbMode){_fbSilentConnect(pid);return;}
  if(!peer?.open)return;
  try{
    const c=peer.connect(pid,{reliable:true,serialization:'json'});
    setupConn(c,true);
  }catch(e){}
}

function setupConn(conn,silent=false){
  const pid=conn.peer;
  if(conns[pid]&&conns[pid]!==conn){
    try{conns[pid].close();}catch(e){}
  }
  conns[pid]=conn;
  if(!chatHist[pid])chatHist[pid]=[];
  // Дефолтное имя — юзернейм (@ + id)
  if(!peerNames[pid])peerNames[pid]='@'+pid;
  if(!$('si-'+pid))addSbItem(pid);

  const onOpen=()=>{
    if(conns[pid]!==conn)return;
    setSbStatus(pid,true);
    sendData(conn,_myHelloFor(pid));
    if(!silent)sysMsg(pid,'Соединение установлено');
    if(activeChat===pid){updateChatHeader();updateReconBanner();}
    saveAll();
  };

  if(conn.open){onOpen();}
  else{conn.on('open',onOpen);}

  conn.on('data',raw=>{
    if(conns[pid]!==conn)return;
    let d;
    try{d=typeof raw==='string'?JSON.parse(raw):raw;}catch(e){d=raw;}
    if(d&&typeof d==='object')onData(pid,d);
  });

  conn.on('close',()=>{
    if(conns[pid]!==conn)return;
    delete conns[pid];
    setSbStatus(pid,false);
    if(!silent)sysMsg(pid,'Собеседник отключился');
    if(activeChat===pid){updateChatHeader();updateReconBanner();}
  });

  conn.on('error',e=>{
    if(conns[pid]!==conn)return;
    console.warn('conn err:',pid,e.message||e);
  });
}

function connectTo(pid,nick){
  pid=pid.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  if(!pid)return toast('Введи юзернейм');
  if(pid===myUsername)return toast('Это твой юзернейм!');
  if(!peerNames[pid])peerNames[pid]=nick||('@'+pid);
  else if(nick)peerNames[pid]=nick;
  if(!chatHist[pid])chatHist[pid]=[];
  if(!$('si-'+pid))addSbItem(pid);
  saveAll();
  openChat(pid);

  // Firebase режим
  if(_fbMode){
    _fbSilentConnect(pid);
    sysMsg(pid,'Подключение к @'+pid+' через Firebase…');
    return;
  }

  if(!peer?.open)return toast('P2P не готов');
  if(conns[pid]?.open)return;
  try{
    const c=peer.connect(pid,{reliable:true,serialization:'json'});
    setupConn(c,false);
    sysMsg(pid,'Подключение к @'+pid+'…');
  }catch(e){toast('Ошибка подключения: '+e.message);}
}

function sendData(conn,data){
  if(_fbMode){
    const pid=typeof conn==='string'?conn:(conn?.peer||conn?.pid||null);
    if(pid)_fbSend(pid,data);
    return;
  }
  try{if(conn?.open){conn.send(data);}}catch(e){}
}

function onData(pid,data){
  switch(data.type){
    case 'hello':
      // Применяем профиль собеседника — источник правды Firebase
      // Если есть непустой ник — используем его, иначе @ + username
      if(data.nick!=null&&data.nick!==''){
        peerNames[pid]=data.nick;
      }else if(!peerNames[pid]||peerNames[pid]==='@'+pid){
        peerNames[pid]=data.username?'@'+data.username:'@'+pid;
      }
      // Аватарку берём всегда если она пришла (null тоже применяем — значит убрали)
      if(data.avatar!==undefined){peerAvatars[pid]=data.avatar;updateSbAvatar(pid);}
      if(data.profileBg){peerProfileBgs[pid]=data.profileBg;}
      if(data.bgColor!==undefined){peerProfileBgColors[pid]=data.bgColor||'';}
      if(data.bgPattern!==undefined){peerProfilePatterns[pid]=data.bgPattern||'';}
      if(data.avFrame!==undefined){peerAvFrames[pid]=data.avFrame||'';}
      if(data.profileWallpaper!==undefined){peerProfileWallpapers[pid]=data.profileWallpaper||'';}
      if(data.profileTheme!==undefined){peerProfileThemes[pid]=data.profileTheme||'';}
      if(data.bio!==undefined){peerBios[pid]=data.bio;}
      _applyExtraProfile(pid,data);
      // Миграция по oldUsername
      if(data.oldUsername&&data.oldUsername!==pid){
        if(chatHist[data.oldUsername]&&!chatHist[pid]){
          chatHist[pid]=chatHist[data.oldUsername];delete chatHist[data.oldUsername];
        } else if(chatHist[data.oldUsername]){
          const existIds=new Set((chatHist[pid]||[]).map(m=>m.id));
          (chatHist[data.oldUsername]||[]).forEach(m=>{if(!existIds.has(m.id))chatHist[pid].push(m);});
          chatHist[pid].sort((a,b)=>(a.ts||0)-(b.ts||0));
          delete chatHist[data.oldUsername];
        }
        document.getElementById('si-'+data.oldUsername)?.remove();
        delete peerNames[data.oldUsername];delete peerAvatars[data.oldUsername];
        if(activeChat===data.oldUsername){activeChat=pid;renderChat(pid);}
      }
      if(data.iid){peerIids[pid]=data.iid;mergeByInternalId(pid,data.iid);}
      else if(data.username){mergeByUsername(pid,data.username);}
      updateSbName(pid);
      if(activeChat===pid)updateChatHeader();
      // Отвечаем своим профилем (если это не ответ)
      if(!data._reply){
        _fbSend(pid,{..._myHelloFor(pid),_reply:true});
      }
      saveAll();
      break;
    case 'msg':
      recvMsg(pid,data.text,data.nick,data.avatar,data.id,data.ts);
      break;
    case 'read':
      // Собеседник прочитал наши сообщения
      if(Array.isArray(data.ids)){
        data.ids.forEach(mid=>{
          const hist=chatHist[pid];
          if(!hist)return;
          const m=hist.find(x=>x.id===mid&&x.sender==='me');
          if(m&&m.status!=='read'){m.status='read';_updateMsgStatus(mid,'read');}
        });
        saveAll();
      }
      break;
    case 'msg_delete':
      _handleMsgDelete(pid,data);
      break;
    case 'msg_edit':
      _handleMsgEdit(pid,data);
      break;
    case 'msg_pin':
      _handleMsgPin(pid,data);
      break;
    case 'chat_delete':
      _handleChatDelete(pid,data);
      break;
    case 'typing':
      showRemoteTyping(pid);
      break;
    case 'call_cancel':
    case 'call_reject':
      // Скрываем входящий звонок — проверяем и по callId и по pid
      // (сообщение могло прийти до call_incoming при оффлайн-доставке)
      {
        const isForUs=pendingCall?.peerId===pid||
          (data.callId&&_lastIncomingCallId===data.callId);
        stopRingSound();
        if(typeof _closeCallNotif==='function')_closeCallNotif();
        $('incoming').classList.remove('show');
        if(isForUs||!pendingCall){
          // Отмена звонка — убираем pending независимо от состояния
          if(pendingCall?.peerId===pid&&data.type==='call_cancel'&&typeof _logCallMessage==='function')
            _logCallMessage(pid,{outgoing:false,outcome:'missed',isVideo:pendingCall.isVideo});
          pendingCall=null;
          _lastIncomingCallId=null;
        }
        if(activeCall?.peerId===pid){
          if(data.type==='call_reject')activeCall._rejected=true; // собеседник отклонил мой звонок
          endCallCleanup();
        }
        if(isForUs||!activeCall)
          toast(data.type==='call_reject'?'Звонок отклонён':'Звонок отменён');
      }
      break;
    case 'grp_call_incoming':
      _handleGrpCallMsg(pid,data);
      break;
    case 'call_mute':
      // Собеседник выключил/включил микрофон — показываем значок
      if(activeCall?.peerId===pid)_showPeerMute(!!data.muted);
      break;
    case 'call_end':
      stopRingSound();
      if(typeof _closeCallNotif==='function')_closeCallNotif();
      $('incoming').classList.remove('show');
      if(pendingCall?.peerId===pid){
        if(typeof _logCallMessage==='function')_logCallMessage(pid,{outgoing:false,outcome:'missed',isVideo:pendingCall.isVideo});
        pendingCall=null;_lastIncomingCallId=null;
      }
      if(activeCall?.peerId===pid){endCallCleanup();}
      break;
    case 'call_incoming':
      // Входящий звонок — показываем UI, ждём offer
      if(activeCall)break; // уже в звонке
      // Проверяем что это не старый звонок (callId должен отличаться от последнего отменённого)
      if(data.callId&&_cancelledCallIds?.has(data.callId))break;
      if(data.callId&&typeof _callKey==='function'&&_cancelledCallIds?.has(_callKey(data.callId)))break;
      _pendingIceCandidates=[];
      _lastIncomingCallId=data.callId||null;
      pendingCall={peerId:pid,isVideo:!!data.isVideo,sdp:null,callId:data.callId};
      if(_pendingRemoteOffer?.peerId===pid){
        pendingCall.sdp=_pendingRemoteOffer.sdp;
      }
      {const av=peerAvatars[pid],el=$('icAv');el.innerHTML='';
      if(av){const i=document.createElement('img');i.src=av;i.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%';el.appendChild(i);}
      else el.innerHTML=_avHtml(pid,data.nick||peerNames[pid]||pid);
      $('icName').textContent=data.nick||peerNames[pid]||('@'+pid);
      $('icType').textContent=data.isVideo?'Видеозвонок':'Голосовой звонок';
      $('incoming').classList.add('show');startRingSound();
      // Уведомление с кнопками «Ответить»/«Отклонить» (когда приложение свёрнуто)
      if(document.visibilityState!=='visible')
        showDesktopNotif(data.nick||peerNames[pid]||('@'+pid),data.isVideo?'📹 Входящий видеозвонок':'📞 Входящий звонок',peerAvatars[pid]||null,'call',
          {kind:'call',callId:data.callId||'',peerId:pid,isVideo:!!data.isVideo});
      if(typeof _naTryAnswer==='function')_naTryAnswer(pid,data.callId);
      if(navigator.vibrate)navigator.vibrate([300,100,300,100,300]);}
      break;
    case 'call_offer':
      // SDP offer от звонящего
      (async()=>{
        // Сохраняем SDP в pendingCall если он есть (UI входящего звонка показан)
        if(pendingCall?.peerId===pid){pendingCall.sdp=data.sdp;}
        // На случай если offer пришёл РАНЬШЕ call_incoming — кэшируем
        _pendingRemoteOffer={peerId:pid,sdp:data.sdp,isVideo:data.isVideo};
        // Если уже нажали "принять" до прихода offer — отвечаем сразу.
        // Защита от повторной/устаревшей доставки: применяем оффер этого звонка
        // только один раз (иначе задвоенный call_offer ломает согласование —
        // именно это давало «не доходит»/чёрный экран у собеседника).
        if(activeCall?.peerId===pid&&_callPC&&!activeCall._offerHandled&&
           (!data.callId||!activeCall.callId||data.callId===activeCall.callId)){
          activeCall._offerHandled=true;
          try{
            await _callPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await _flushPendingIce();
            const answer=await _callPC.createAnswer();
            await _callPC.setLocalDescription(answer);
            _callSend(pid,{type:'call_answer',sdp:_callPC.localDescription.toJSON()});
          }catch(e){console.warn('late offer handle:',e);}
        }
      })();
      break;
    case 'call_answer':
      (async()=>{
        if(!activeCall||activeCall.peerId!==pid||!_callPC)return;
        try{
          await _callPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await _flushPendingIce();
        }catch(e){console.warn('set answer error:',e);}
      })();
      break;
    case 'call_ice':
      (async()=>{
        if(!data.candidate)return;
        // Если PC ещё не создан или remoteDescription не установлен — буферизуем
        if(!_callPC||!_callPC.remoteDescription||!_callPC.remoteDescription.type){
          _pendingIceCandidates.push(data.candidate);
          return;
        }
        try{await _callPC.addIceCandidate(new RTCIceCandidate(data.candidate));}
        catch(e){console.warn('ice candidate error:',e);}
      })();
      break;
    case 'system_premium':
      myPremium=true;saveAll();buildThemeGrids();updateProfileDisplay();
      break;
    case 'system_admin_granted':
      CHANNEL_ADMINS.add(myUsername);
      toast('🛡 Тебе выданы права администратора SLON!');
      const ar=$('adminConsoleRow');if(ar)ar.style.display='';
      break;
    case 'system_pass_reset':
      // Админ сбросил нам пароль — выкидываем на экран установки нового
      try{localStorage.removeItem('sl_pass_'+myUsername);}catch(e){}
      myPassword='';
      toast('🔑 Твой пароль сброшен — задай новый',5000);
      setTimeout(()=>{ if(typeof showSetPassword==='function'){ $('usernameOverlay')?.classList.add('show'); showSetPassword(myUsername);} },1500);
      break;
    case 'voice_join':
    case 'voice_leave':
      _handleVoiceMsg(pid,data);
      break;
      // Сообщение от другого нашего устройства о состоянии звонка
      if(data._device===_myDeviceId)break; // наше собственное — игнорируем
      if(data.action==='answered'||data.action==='rejected'){
        // На другом устройстве ответили или отклонили — скрываем incoming UI
        if(pendingCall?.callId===data.callId||pendingCall?.peerId===data.peerId){
          stopRingSound();
          $('incoming').classList.remove('show');
          pendingCall=null;
          _lastIncomingCallId=null;
          if(data.action==='answered')toast('Отвечено на другом устройстве 📱');
        }
      }
      break;
    case 'webrtc_offer':
      // Renegotiation offer (camera/screen added or removed mid-call)
      (async()=>{
        if(!_callPC||!data.sdp)return;
        try{
          // Коллизия офферов: если мы сами ждём ответ — откатываем свой,
          // иначе setRemoteDescription упадёт и демонстрация не дойдёт
          if(_callPC.signalingState!=='stable'){
            try{await _callPC.setLocalDescription({type:'rollback'});}catch(e){}
          }
          await _callPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await _flushPendingIce();
          const answer=await _callPC.createAnswer();
          await _callPC.setLocalDescription(answer);
          _callSend(pid,{type:'webrtc_answer',sdp:_callPC.localDescription.toJSON()});
          // Обновляем UI — несколько попыток т.к. currentDirection обновляется асинхронно
          setTimeout(()=>{_updateRemoteVideoUI();_tryPlayRemote();},200);
          setTimeout(()=>{_updateRemoteVideoUI();_tryPlayRemote();},700);
          setTimeout(()=>{_updateRemoteVideoUI();},1500);
        }catch(e){console.warn('webrtc_offer renegotiate error:',e);}
      })();
      break;
    case 'webrtc_answer':
      // Renegotiation answer
      (async()=>{
        if(!_callPC||!data.sdp)return;
        try{
          await _callPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await _flushPendingIce();
          setTimeout(()=>_updateRemoteVideoUI(),200);
          setTimeout(()=>{_updateRemoteVideoUI();_tryPlayRemote();},700);
        }catch(e){console.warn('webrtc_answer renegotiate error:',e);}
      })();
      break;
    case 'group_invite':
      recvGrpInvite(data);
      break;
    case 'group_msg':
      recvGrpMsg(data);
      break;
    case 'group_add':
      // Нас добавили в группу
      if(!groups[data.gid]){
        groups[data.gid]={name:data.name||'Группа',members:data.members||[myUsername],admin:pid};
        if(!grpHist[data.gid])grpHist[data.gid]=[];
        addSbGroup(data.gid);
        sysMsg(data.gid,'@'+pid+' добавил тебя в группу');
        saveAll();
        _fbListenGrpMsgsForNew(data.gid);
        if(activeChat===data.gid)updateChatHeader();
        toast('👥 Тебя добавили в «'+(data.name||'группу')+'»');
      }
      break;
    case 'group_update':
      if(groups[data.gid]){
        if(data.members)groups[data.gid].members=data.members;
        if(data.canInvite)groups[data.gid].canInvite=data.canInvite;
        saveAll();
        if(activeChat===data.gid)updateChatHeader();
      }
      break;
    case 'group_profile_update':
      if(groups[data.gid]){
        const grp=groups[data.gid];
        if(data.name)grp.name=data.name;
        if(data.desc!==undefined)grp.desc=data.desc;
        if(data.avatar!==undefined)grp.avatar=data.avatar;
        if(data.bgColor!==undefined)grp.bgColor=data.bgColor;
        if(data.bgPattern!==undefined)grp.bgPattern=data.bgPattern;
        saveAll();
        if(activeChat===data.gid)updateChatHeader();
      }
      break;
    case 'group_kick':
      if(groups[data.gid]){
        // Нас выгнали
        delete groups[data.gid];delete grpHist[data.gid];
        $('si-'+data.gid)?.remove();
        saveAll();
        if(activeChat===data.gid){openChat('ai');}
        toast('👥 Тебя удалили из группы');
      }
      break;
    case 'media_start':{
      inMediaBufs[data.id]={kind:data.kind,dur:data.dur||0,mime:data.mime||'',
        total:data.chunks,parts:[],nick:data.nick||('@'+pid),avatar:data.avatar||peerAvatars[pid]||null,pid,ts:data.ts};
      break;}
    case 'media_chunk':{
      const buf=inMediaBufs[data.id];if(buf)buf.parts[data.i]=data.d;
      break;}
    case 'media_url':{
      // Firebase Storage URL — сразу рендерим
      const spid2=pid;
      const dn=data.nick||(peerNames[spid2]||('@'+spid2));
      const dav=data.avatar||peerAvatars[spid2]||null;
      const mts=data.ts||Date.now();
      if(data.kind==='voice'){
        const mv={id:data.id,sender:'inc',name:dn,avatar:dav,ts:mts,time:fmtTime(mts),voiceData:data.url,voiceDur:data.dur,isUrl:true};
        if(!chatHist[spid2])chatHist[spid2]=[];chatHist[spid2].push(mv);
        if(activeChat===spid2){appendMsg(mv);scrollDown();}
        else{addUnread(spid2);toast('🎙️ '+(peerNames[spid2]||('@'+spid2))+': голосовое');}
        updatePreview(spid2,'🎙️ Голосовое');
      }else if(data.kind==='slon'){
        const ms={id:data.id,sender:'inc',name:dn,avatar:dav,ts:mts,time:fmtTime(mts),slonData:data.url,slonDur:data.dur,isUrl:true};
        if(!chatHist[spid2])chatHist[spid2]=[];chatHist[spid2].push(ms);
        if(activeChat===spid2){appendMsg(ms);scrollDown();}
        else{addUnread(spid2);toast('🐘 '+(peerNames[spid2]||('@'+spid2))+': слонкружок');}
        updatePreview(spid2,'🐘 Слонкружок');
      }
      saveAll();break;}
    case 'media_rtdb':{
      // Собираем медиа из RTDB chunks
      (async()=>{
        if(!window._fbDb)return;
        const spid=pid;
        const dn=data.nick||(peerNames[spid]||('@'+spid));
        const dav=data.avatar||peerAvatars[spid]||null;
        const mts=data.ts||Date.now();
        try{
          const base='media_transfer/'+myUsername+'/'+data.id;
          const parts=[];
          for(let i=0;i<data.total;i++){
            await new Promise(res=>{
              window._fbOnValue(window._fbRef(window._fbDb,base+'/chunks/'+i),snap=>{
                parts[i]=snap.val()||'';res();
              },{onlyOnce:true});
            });
          }
          const fullData=parts.join('');
          window._fbRemove(window._fbRef(window._fbDb,base)).catch(()=>{});
          if(data.kind==='voice'){
            const msg={id:data.id,sender:'inc',name:dn,avatar:dav,ts:mts,time:fmtTime(mts),voiceData:'idb:'+data.id+':voice',voiceDur:data.dur};
            await _saveMediaToIdb(data.id,'voice',fullData); // сначала в IDB, потом рендер — иначе «видео недоступно»
            if(!chatHist[spid])chatHist[spid]=[];chatHist[spid].push(msg);
            if(activeChat===spid){appendMsg(msg);scrollDown();}
            else{addUnread(spid);toast('🎙️ '+(peerNames[spid]||('@'+spid))+': голосовое');}
            updatePreview(spid,'🎙️ Голосовое');
          }else if(data.kind==='slon'){
            const msg={id:data.id,sender:'inc',name:dn,avatar:dav,ts:mts,time:fmtTime(mts),slonData:'idb:'+data.id+':slon',slonDur:data.dur};
            await _saveMediaToIdb(data.id,'slon',fullData); // сначала в IDB, потом рендер — иначе «видео недоступно»
            if(!chatHist[spid])chatHist[spid]=[];chatHist[spid].push(msg);
            if(activeChat===spid){appendMsg(msg);scrollDown();}
            else{addUnread(spid);toast('🐘 '+(peerNames[spid]||('@'+spid))+': слонкружок');}
            updatePreview(spid,'🐘 Слонкружок');
          }
          saveAll();
        }catch(e){console.warn('media_rtdb recv error:',e);}
      })();
      break;}
    case 'media_end':{
      const buf=inMediaBufs[data.id];if(!buf)break;
      for(let i=0;i<buf.total;i++)if(buf.parts[i]==null){delete inMediaBufs[data.id];break;}
      const fullData=buf.parts.join('');
      delete inMediaBufs[data.id];
      const spid=buf.pid;
      const mts=buf.ts||Date.now();
      if(buf.kind==='voice'){
        _saveMediaToIdb(data.id,'voice',fullData);
        const msg2={id:data.id,sender:'inc',name:buf.nick,avatar:buf.avatar,ts:mts,time:fmtTime(mts),voiceData:'idb:'+data.id+':voice',voiceDur:buf.dur};
        if(!chatHist[spid])chatHist[spid]=[];chatHist[spid].push(msg2);
        if(activeChat===spid){appendMsg(msg2);scrollDown();}
        else{addUnread(spid);toast('🎙️ '+(peerNames[spid]||('@'+spid))+': голосовое');}
        updatePreview(spid,'🎙️ Голосовое');
      }else if(buf.kind==='slon'){
        _saveMediaToIdb(data.id,'slon',fullData);
        const msg3={id:data.id,sender:'inc',name:buf.nick,avatar:buf.avatar,ts:mts,time:fmtTime(mts),slonData:'idb:'+data.id+':slon',slonDur:buf.dur};
        if(!chatHist[spid])chatHist[spid]=[];chatHist[spid].push(msg3);
        if(activeChat===spid){appendMsg(msg3);scrollDown();}
        else{addUnread(spid);toast('🐘 '+(peerNames[spid]||('@'+spid))+': слонкружок');}
        updatePreview(spid,'🐘 Слонкружок');
      }
      saveAll();break;}
    case 'file_start':
      inFiles[data.id]={name:data.name,mime:data.mime,total:data.chunks,parts:[],isImg:data.isImg,ts:data.ts};
      // Показываем уведомление об отправке (для прогресса)
      _showIncomingFileProgress(pid,data.id,data.name,data.chunks);
      break;
    case 'file_chunk':
      if(inFiles[data.id]){
        inFiles[data.id].parts[data.i]=data.d;
        // Считаем сколько уже получено
        let recv=0;
        for(const p of inFiles[data.id].parts)if(p!=null)recv++;
        _updateIncomingFileProgress(data.id,recv,inFiles[data.id].total);
      }
      break;
    case 'file_end':
      _hideIncomingFileProgress(data.id);
      finishFile(data.id,pid);
      break;
  }
}

function _fbOnce(path,timeoutMs=5000){
  return new Promise(res=>{
    if(!window._fbDb){res(null);return;}
    const ref=window._fbRef(window._fbDb,path);
    const t=setTimeout(()=>res(null),timeoutMs);
    ref.once('value').then(s=>{clearTimeout(t);res(s);}).catch(()=>{clearTimeout(t);res(null);});
  });
}

function mergeByUsername(canonPid, username){
  // Ищем дубли везде: peerNames, chatHist, по совпадению pid===username
  const allPids=new Set([
    ...Object.keys(peerNames),
    ...Object.keys(chatHist).filter(k=>k!=='ai'&&k!=='saved'&&!k.startsWith('g_'))
  ]);

  const dupPids=[...allPids].filter(pid=>{
    if(pid===canonPid)return false;
    const storedName=peerNames[pid]||'';
    // Дубль если: pid совпадает с username, или имя совпадает, или pid это старый username
    return pid===username
      || storedName==='@'+username
      || storedName===username;
  });

  if(dupPids.length===0)return;

  let merged=false;
  dupPids.forEach(dupPid=>{
    const dupHist=chatHist[dupPid]||[];
    if(dupHist.length>0){
      if(!chatHist[canonPid])chatHist[canonPid]=[];
      const existIds=new Set((chatHist[canonPid]||[]).map(m=>m.id));
      dupHist.forEach(m=>{if(!existIds.has(m.id))chatHist[canonPid].push(m);});
      chatHist[canonPid].sort((a,b)=>(a.time||'').localeCompare(b.time||''));
      delete chatHist[dupPid];
      merged=true;
    }
    const el=document.getElementById('si-'+dupPid);
    if(el)el.remove();
    delete peerNames[dupPid];
    delete peerAvatars[dupPid];
    delete archivedChats[dupPid];
    if(activeChat===dupPid){activeChat=canonPid;renderChat(canonPid);}
  });

  if(merged)toast('Объединили дублирующийся чат с @'+username);
  saveAll();
}

function getAC(){if(!_audioCtx)_audioCtx=new(window.AudioContext||window.webkitAudioContext)();return _audioCtx;}

function mergeByInternalId(canonPid, iid){
  if(!iid)return;
  // Ищем дубли с тем же iid
  const dupPids=Object.keys(peerIids).filter(pid=>pid!==canonPid&&peerIids[pid]===iid);
  if(!dupPids.length)return;

  // НЕ сливаем автоматически — это может быть другой аккаунт на том же устройстве.
  // Сливаем ТОЛЬКО если старый контакт явно указал oldUsername при смене юзернейма.
  // Это обрабатывается в hello-handler через data.oldUsername.
  // Здесь только обновляем iid-маппинг.
  dupPids.forEach(dupPid=>{
    peerIids[dupPid]=iid; // обновляем на всякий случай
  });
}
