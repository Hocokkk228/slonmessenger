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
  // Аккаунт «существует» если есть узел auth/{username} целиком —
  // даже без пароля (сброшенный админом), чтобы юзернейм нельзя было переоформить
  if(!_fbReady()||!window._fbDb)return false;
  try{
    const snap=await new Promise(res=>{
      window._fbOnValue(
        window._fbRef(window._fbDb,'auth/'+username),
        s=>res(s),{onlyOnce:true}
      );
    });
    return !!(snap&&snap.exists&&snap.exists());
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

let _resetRt=null; // одноразовый токен установки пароля после сброса

// Общий финал входа: сессия, данные аккаунта, запуск
function _authEnter(u,token,isNew){
  const prevUsername=myUsername;
  myUsername=u;myPassword='';
  _apiSetToken(u,token);
  try{localStorage.removeItem('sl_pass_'+u);}catch(e){}   // хеш пароля на устройстве больше не храним
  LS.set('sl_username',u);
  const sess={username:u,verified:true,ts:Date.now()};
  LS.set('sl_session_'+u,sess);
  LS.set('sl_session',sess);
  if(prevUsername&&prevUsername!==u&&_fbMode){
    _fbMode=false;
    try{if(window._fbDb&&window._fbRef)window._fbSet(window._fbRef(window._fbDb,'presence/'+prevUsername),{online:false,ts:Date.now()});}catch(e){}
  }
  if(isNew){
    myInternalId='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
    LS.set('sl_iid_'+u,myInternalId);
  }
  loadStorage();
  $('usernameOverlay').classList.remove('show');
  activeChat='ai';
  setMyLabel();updateProfileDisplay();
  rebuildSidebar();
  openChat('ai');
  initFirebaseMode();
  if(!isNew)setTimeout(()=>_fetchAndApplyMyProfile(),500);
}

async function doLogin(){
  const raw=($('loginUsernameInp')?.value||'').trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const pass=($('loginPassInp')?.value||'').trim();
  const errEl=$('loginError');
  errEl.style.display='none';
  if(raw.length<3){errEl.textContent='Юзернейм минимум 3 символа';errEl.style.display='block';return;}
  if(!pass){errEl.textContent='Введи пароль';errEl.style.display='block';return;}
  const btn=$('usernameOverlay').querySelector('#authLogin .username-btn');
  const origText=btn?.textContent||'';
  if(btn){btn.textContent='Проверяем…';btn.disabled=true;}
  try{
    // Пароль проверяет сервер — хеш никому не отдаётся
    const d=await api('/auth/login',{u:raw,h:await hashPassword(pass),device:_apiDevice()},{token:''});
    if(d.status==='set_password'){
      // Админ сбросил пароль — задаём новый
      _resetRt=d.rt;myUsername=raw;LS.set('sl_username',raw);loadStorage();
      showSetPassword(raw);return;
    }
    _authEnter(raw,d.token,false);
    if(typeof _e2eOnPassword==='function')_e2eOnPassword(pass);   // ключ бэкапа истории
  }catch(e){
    errEl.textContent=e.message;errEl.style.display='block';
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
    const d=await api('/auth/register',{u:raw,h:await hashPassword(pass),device:_apiDevice()},{token:''});
    _authEnter(raw,d.token,true);
    if(typeof _e2eOnPassword==='function')_e2eOnPassword(pass);
    toast('Добро пожаловать в SLON, @'+raw+' 🐘');
  }catch(e){
    errEl.textContent=e.message;errEl.style.display='block';
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
  if(!_resetRt){showAuthLogin();const i=$('loginUsernameInp');if(i)i.value=myUsername;return;}
  const btn=$('usernameOverlay').querySelector('#authSetPassword .username-btn');
  if(btn){btn.textContent='Сохраняем…';btn.disabled=true;}
  try{
    const d=await api('/auth/set-password',{u:myUsername,rt:_resetRt,h:await hashPassword(pass),device:_apiDevice()},{token:''});
    _resetRt=null;
    _authEnter(myUsername,d.token,false);
    if(typeof _e2eOnPassword==='function')_e2eOnPassword(pass);
    toast('Пароль установлен 🔒');
  }catch(e){
    errEl.textContent=e.message;errEl.style.display='block';
    if(e.code==='expired'){_resetRt=null;setTimeout(()=>{showAuthLogin();const i=$('loginUsernameInp');if(i)i.value=myUsername;},1500);}
  }finally{
    if(btn){btn.textContent='Установить пароль';btn.disabled=false;}
  }
}

// Раньше можно было войти без пароля — теперь пароль обязателен
function skipSetPassword(){
  _resetRt=null;
  showAuthLogin();const i=$('loginUsernameInp');if(i)i.value=myUsername;
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
  if(nw.length<6){errEl.textContent='Новый пароль минимум 6 символов';errEl.style.display='block';return;}
  if(nw!==conf){errEl.textContent='Пароли не совпадают';errEl.style.display='block';return;}
  try{
    const d=await api('/auth/change-password',{old:await hashPassword(old),h:await hashPassword(nw),device:_apiDevice()});
    _apiSetToken(myUsername,d.token);
    if(typeof _e2eOnPasswordChange==='function')await _e2eOnPasswordChange(nw);
    closeModal();toast('Пароль изменён 🔒 — на других устройствах нужно войти заново');
  }catch(e){errEl.textContent=e.message;errEl.style.display='block';}
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

async function doLogout(){
  closeModal();
  // Отписываем ЭТО устройство от пушей аккаунта — иначе разлогиненный браузер
  // продолжает получать уведомления чужого/старого аккаунта
  try{if(typeof _pushUnsubscribe==='function')await Promise.race([_pushUnsubscribe(),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
  try{if(typeof _nativeBgStop==='function')_nativeBgStop();}catch(e){}
  try{if(typeof _e2eLogout==='function')await Promise.race([_e2eLogout(),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
  // отзываем токен на сервере (не ждём ответа)
  try{const t=_apiToken();if(t)fetch(API_URL+'/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+t},keepalive:true}).catch(()=>{});}catch(e){}
  _apiSetToken(myUsername,'');
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
  setNet(false,'Загрузка…');
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
