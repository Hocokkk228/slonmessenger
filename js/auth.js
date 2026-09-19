async function hashPassword(pass){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pass));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function showAuthLogin(){
  $('authLogin').style.display='';
  $('authRegister').style.display='none';
  $('authSetPassword').style.display='none';
  setTimeout(()=>$('loginUsernameInp')?.focus(),100);
}

function showAuthRegister(){
  $('authLogin').style.display='none';
  $('authRegister').style.display='';
  $('authSetPassword').style.display='none';
  setTimeout(()=>$('regUsernameInp')?.focus(),100);
}

function showSetPassword(username){
  $('authLogin').style.display='none';
  $('authRegister').style.display='none';
  $('authSetPassword').style.display='';
  $('authSetPassUsername').textContent='@'+username;
  setTimeout(()=>$('setPassInp')?.focus(),100);
}

async function _fbGetPasswordHash(username){
  // Сначала проверяем локальный кэш (для скорости)
  const cached=LS.get('sl_pass_'+username,'');
  if(cached)return cached;
  // Запрашиваем из Firebase
  if(!_fbReady()||!window._fbDb)return null;
  try{
    const snap=await new Promise((res,rej)=>{
      window._fbOnValue(
        window._fbRef(window._fbDb,'auth/'+username+'/hash'),
        s=>res(s),{onlyOnce:true}
      );
    });
    return snap?.val()||null;
  }catch(e){return null;}
}

async function _fbSetPasswordHash(username,hash){
  // Сохраняем в Firebase и локально
  LS.set('sl_pass_'+username,hash);
  if(!_fbReady()||!window._fbDb)return;
  try{
    await window._fbSet(
      window._fbRef(window._fbDb,'auth/'+username),
      {hash,updatedAt:Date.now()}
    );
  }catch(e){console.warn('fbSetPass error:',e);}
}

async function _fbAccountExists(username){
  if(!_fbReady()||!window._fbDb)return false;
  try{
    const snap=await new Promise(res=>{
      window._fbOnValue(
        window._fbRef(window._fbDb,'auth/'+username+'/hash'),
        s=>res(s),{onlyOnce:true}
      );
    });
    return !!(snap?.val());
  }catch(e){return false;}
}

function _clearLocalForNewAccount(){
  // Удаляем все данные чатов/профиля текущего локального аккаунта
  // (они привязаны к старому username)
  const keysToKeep=['sl_theme','sl_device_id'];
  const allKeys=Object.keys(localStorage);
  allKeys.forEach(k=>{
    if(!keysToKeep.includes(k)&&k!=='sl_iid'){
      // sl_iid (internal id устройства) сохраняем
      localStorage.removeItem(k);
    }
  });
  // Сбрасываем state
  chatHist={ai:[]};grpHist={};groups={};
  peerNames={};peerAvatars={};peerIids={};peerProfileBgs={};
  myNick='';myBio='';myAvatar=null;myProfileBg='bg0';
  archivedChats={};hasElephantBadge=false;
}

async function doLogin(){
  const raw=($('loginUsernameInp')?.value||'').trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const pass=($('loginPassInp')?.value||'').trim();
  const errEl=$('loginError');
  errEl.style.display='none';

  if(raw.length<3){errEl.textContent='Юзернейм минимум 3 символа';errEl.style.display='block';return;}
  if(!pass){errEl.textContent='Введи пароль';errEl.style.display='block';return;}

  // Показываем загрузку
  const btn=$('usernameOverlay').querySelector('#authLogin .username-btn');
  const origText=btn?.textContent||'';
  if(btn){btn.textContent='Проверяем…';btn.disabled=true;}

  try{
    // Получаем хэш из Firebase
    const storedHash=await _fbGetPasswordHash(raw);
    if(!storedHash){
      errEl.textContent='Аккаунт не найден — зарегистрируйся!';
      errEl.style.display='block';return;
    }
    const inputHash=await hashPassword(pass);
    if(inputHash!==storedHash){
      errEl.textContent='Неверный пароль';errEl.style.display='block';return;
    }

    // Вход успешен
    const prevUsername=myUsername;
    myUsername=raw;myPassword=storedHash;
    LS.set('sl_username',raw);
    LS.set('sl_pass_'+raw,storedHash);
    const sess={username:raw,verified:true,ts:Date.now()};
    LS.set('sl_session_'+raw,sess);
    LS.set('sl_session',sess);

    // Если был другой аккаунт — сбрасываем Firebase соединение
    if(prevUsername&&prevUsername!==raw&&_fbMode){
      _fbMode=false;
      try{
        if(window._fbDb&&window._fbRef)
          window._fbSet(window._fbRef(window._fbDb,'presence/'+prevUsername),{online:false,ts:Date.now()});
      }catch(e){}
    }

    // Загружаем данные нового аккаунта (с его prefix sl_u_raw_*)
    loadStorage();

    $('usernameOverlay').classList.remove('show');

    // Сбрасываем UI полностью
    activeChat='ai';
    setMyLabel();updateProfileDisplay();
    rebuildSidebar();
    openChat('ai');

    initFirebaseMode();
    // Подгружаем актуальный профиль с Firebase (ник/аватарка могут быть другими)
    setTimeout(()=>_fetchAndApplyMyProfile(),500);
  }finally{
    if(btn){btn.textContent=origText;btn.disabled=false;}
  }
}

async function doRegister(){
  const raw=($('regUsernameInp')?.value||'').trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const pass=($('regPassInp')?.value||'');
  const conf=($('regPassConfInp')?.value||'');
  const errEl=$('regError');
  errEl.style.display='none';

  if(raw.length<3){errEl.textContent='Юзернейм минимум 3 символа';errEl.style.display='block';return;}
  if(raw.length>20){errEl.textContent='Юзернейм максимум 20 символов';errEl.style.display='block';return;}
  if(pass.length<6){errEl.textContent='Пароль минимум 6 символов';errEl.style.display='block';return;}
  if(pass!==conf){errEl.textContent='Пароли не совпадают';errEl.style.display='block';return;}

  const btn=$('usernameOverlay').querySelector('#authRegister .username-btn');
  const origText=btn?.textContent||'';
  if(btn){btn.textContent='Создаём аккаунт…';btn.disabled=true;}

  try{
    // Проверяем занятость юзернейма через Firebase
    const exists=await _fbAccountExists(raw);
    if(exists){
      errEl.textContent='Юзернейм занят — выбери другой или войди';
      errEl.style.display='block';return;
    }

    const hash=await hashPassword(pass);
    myUsername=raw;myPassword=hash;
    // Новый аккаунт — генерируем уникальный internal ID для ЭТОГО аккаунта
    myInternalId='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
    LS.set('sl_iid_'+raw,myInternalId);
    LS.set('sl_username',raw);
    const sess={username:raw,verified:true,ts:Date.now()};
    LS.set('sl_session_'+raw,sess);
    LS.set('sl_session',sess);
    // Сохраняем пароль
    await _fbSetPasswordHash(raw,hash);

    loadStorage(); // читает пустые данные для нового username
    $('usernameOverlay').classList.remove('show');
    activeChat='ai';
    setMyLabel();updateProfileDisplay();
    rebuildSidebar();
    openChat('ai');
    initFirebaseMode();
    toast('Добро пожаловать в SLON, @'+raw+' 🐘');
  }finally{
    if(btn){btn.textContent=origText;btn.disabled=false;}
  }
}

async function doSetPassword(){
  const pass=($('setPassInp')?.value||'');
  const conf=($('setPassConfInp')?.value||'');
  const errEl=$('setPassError');
  errEl.style.display='none';
  if(pass.length<6){errEl.textContent='Пароль минимум 6 символов';errEl.style.display='block';return;}
  if(pass!==conf){errEl.textContent='Пароли не совпадают';errEl.style.display='block';return;}

  const btn=$('usernameOverlay').querySelector('#authSetPassword .username-btn');
  if(btn){btn.textContent='Сохраняем…';btn.disabled=true;}

  try{
    const hash=await hashPassword(pass);
    myPassword=hash;
    await _fbSetPasswordHash(myUsername,hash);
    const sess={username:myUsername,verified:true,ts:Date.now()};
    LS.set('sl_session_'+myUsername,sess);
    LS.set('sl_session',sess);
    $('usernameOverlay').classList.remove('show');
    toast('Пароль установлен 🔒');
    initFirebaseMode();
  }finally{
    if(btn){btn.textContent='Установить пароль';btn.disabled=false;}
  }
}

function skipSetPassword(){
  const sess={username:myUsername,verified:true,ts:Date.now()};
  LS.set('sl_session_'+myUsername,sess);
  LS.set('sl_session',sess);
  $('usernameOverlay').classList.remove('show');
  initFirebaseMode();
}

async function showChangePassword(){
  showModal(`
    <div class="m-title">🔑 Сменить пароль</div>
    <input class="m-inp" id="cpOldInp" type="password" placeholder="текущий пароль" autocomplete="current-password">
    <input class="m-inp" id="cpNewInp" type="password" placeholder="новый пароль (мин. 6 символов)" autocomplete="new-password" style="margin-top:8px">
    <input class="m-inp" id="cpConfInp" type="password" placeholder="повтори новый пароль" autocomplete="new-password" style="margin-top:8px">
    <div class="m-err" id="cpErr" style="display:none"></div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doChangePassword()">Сохранить</button>
    </div>
  `);
}

async function doChangePassword(){
  const old=$('cpOldInp')?.value||'';
  const nw=$('cpNewInp')?.value||'';
  const conf=$('cpConfInp')?.value||'';
  const errEl=$('cpErr');errEl.style.display='none';
  if(myPassword){
    const oldHash=await hashPassword(old);
    if(oldHash!==myPassword){errEl.textContent='Неверный текущий пароль';errEl.style.display='block';return;}
  }
  if(nw.length<6){errEl.textContent='Новый пароль минимум 6 символов';errEl.style.display='block';return;}
  if(nw!==conf){errEl.textContent='Пароли не совпадают';errEl.style.display='block';return;}
  const newHash=await hashPassword(nw);
  myPassword=newHash;
  await _fbSetPasswordHash(myUsername,newHash);
  const sess={username:myUsername,verified:true,ts:Date.now()};
  LS.set('sl_session_'+myUsername,sess);
  LS.set('sl_session',sess);
  closeModal();toast('Пароль изменён 🔒');
}

function logout(){
  showModal(`
    <div class="m-title">Выйти из аккаунта?</div>
    <div class="m-info">Ты выйдешь из <b>@${esc(myUsername)}</b>. При следующем входе потребуется пароль.</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-danger" onclick="doLogout()">Выйти</button>
    </div>
  `);
}

function doLogout(){
  closeModal();
  LS.del('sl_session');
  LS.del('sl_username');
  myUsername='';myPassword='';
  if(_fbMode){_fbMode=false;}
  location.reload();
}

function showUsernameOverlay(){
  $('usernameOverlay').classList.add('show');
  const savedUser=LS.get('sl_username','');
  if(savedUser){
    showAuthLogin();
    const inp=$('loginUsernameInp');
    if(inp)inp.value=savedUser;
  }else{
    showAuthRegister();
  }
}

async function _fetchAndApplyMyProfile(){
  // Ждём Firebase только если ещё не готов
  if(!_fbReady()){
    await new Promise(res=>window.addEventListener('firebaseReady',res,{once:true}));
  }
  if(!window._fbDb||!myUsername)return;
  try{
    const snap=await new Promise(res=>{
      window._fbOnValue(window._fbRef(window._fbDb,'profiles/'+myUsername),s=>res(s),{onlyOnce:true});
    });
    const d=snap?.val();
    if(!d)return;
    let changed=false;
    // Применяем ВСЕ поля из Firebase (не проверяем на непустоту — Firebase хранит актуальное)
    if(d.nick!==undefined&&d.nick!==myNick){myNick=d.nick;changed=true;}
    if(d.avatar!==undefined&&d.avatar!==myAvatar){myAvatar=d.avatar;changed=true;}
    if(d.bio!==undefined&&d.bio!==myBio){myBio=d.bio;changed=true;}
    if(d.profileBg&&d.profileBg!==myProfileBg){myProfileBg=d.profileBg;changed=true;}
    if(changed){
      updateProfileDisplay();
      setMyLabel();
      // Обновляем аватарки в сайдбаре у нашего элемента
      const bnAv=$('bnProfAv');
      if(bnAv){
        bnAv.innerHTML='';
        if(myAvatar){const i=document.createElement('img');i.src=myAvatar;i.style.cssText='width:100%;height:100%;border-radius:50%;object-fit:cover';bnAv.appendChild(i);}
        else bnAv.innerHTML=_avHtml(myUsername,myNick||myUsername);
      }
      saveAll();
      toast('Профиль синхронизирован 🔄');
    }
  }catch(e){console.warn('fetchMyProfile:',e);}
}

function sanitizeUsernameInput(inp){
  const pos=inp.selectionStart;
  const v=inp.value.toLowerCase().replace(/[^a-z0-9_]/g,'');
  inp.value=v;
  try{inp.setSelectionRange(pos,pos);}catch(e){}
}

function saveUsername(){
  const raw=$('usernameInp').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const errEl=$('usernameError');
  const takenEl=$('usernameTakenHint');
  errEl.style.display='none'; takenEl.style.display='none';
  $('usernameInp').classList.remove('err');

  if(raw.length<3){
    errEl.textContent='Минимум 3 символа';
    errEl.style.display='block';
    $('usernameInp').classList.add('err');
    return;
  }
  if(raw.length>20){
    errEl.textContent='Максимум 20 символов';
    errEl.style.display='block';
    $('usernameInp').classList.add('err');
    return;
  }

  // Тот же username — просто переподключаемся без сброса
  if(raw===myUsername){
    $('usernameOverlay').classList.remove('show');
    if(!peer?.open)initPeer();
    return;
  }

  const oldUsername=myUsername;
  const isFirstRegistration=!oldUsername;
  myUsername=raw;
  LS.set('sl_username',raw);
  $('usernameOverlay').classList.remove('show');
  setMyLabel();
  updateProfileDisplay();

  // Если Firebase готов — сразу инициализируем
  if(_fbReady()){
    if(_fbMode){
      // Уже подключены — обновляем username
      if(oldUsername&&oldUsername!==myUsername){
        try{_fbStopListen(oldUsername);}catch(e){}
      }
      _fbListen(myUsername);
      _startMyPresence();
      _publishMyProfile(oldUsername||undefined);
      Object.keys(peerNames).forEach(pid=>{
        _fbSend(pid,{..._myHelloFor(pid),oldUsername:oldUsername||undefined});
      });
      if(!isFirstRegistration)toast('Юзернейм изменён: @'+myUsername);
    }else{
      // Первая инициализация
      initFirebaseMode();
    }
    return;
  }

  // Firebase ещё не загрузился — polling
  setNet(false,'Подключение…');
  let _fbPoll=setInterval(()=>{
    if(_fbReady()){clearInterval(_fbPoll);if(myUsername&&!_fbMode)initFirebaseMode();}
  },100);
  setTimeout(()=>clearInterval(_fbPoll),10000);
}

function changeUsernameFromProfile(){
  showModal(`
    <div class="m-title">Сменить юзернейм</div>
    <div class="m-info">Юзернейм — это твой постоянный ID в сети SLON. Смена приведёт к переподключению.<br><br>Все контакты смогут найти тебя только по новому юзернейму.</div>
    <input class="m-inp" id="newUsernameInp" placeholder="новый_юзернейм" value="${esc(myUsername)}" maxlength="20" autocomplete="off" spellcheck="false">
    <div class="m-err" id="newUsernameErr" style="display:none"></div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="applyUsernameChange()">Сменить</button>
    </div>
  `);
  setTimeout(()=>{
    const inp=document.getElementById('newUsernameInp');
    if(inp){inp.focus();inp.select();}
  },100);
}

function applyUsernameChange(){
  const inp=document.getElementById('newUsernameInp');
  const errEl=document.getElementById('newUsernameErr');
  if(!inp)return;
  const raw=inp.value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  if(raw.length<3){errEl.textContent='Минимум 3 символа';errEl.style.display='block';return;}
  if(raw.length>20){errEl.textContent='Максимум 20 символов';errEl.style.display='block';return;}
  closeModal();
  if(raw===myUsername){toast('Юзернейм не изменился');return;}
  myUsername=raw;
  LS.set('sl_username',raw);
  updateProfileDisplay();
  // Переподключаемся с новым ID
  if(peer&&!peer.destroyed){try{peer.destroy();}catch(e){}}
  peer=null;
  initPeer._retries=0;
  initPeer();
  toast('Юзернейм изменён на @'+raw);
}
