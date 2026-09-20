function closeAdminConsole(){$('adminConsoleOverlay').classList.remove('show');}

function toggleBlockUser(pid){
  if(blockedUsers[pid]){
    delete blockedUsers[pid];
    toast('Пользователь разблокирован');
  }else{
    showModal(`
      <div class="m-title">🚫 Заблокировать @${esc(pid)}?</div>
      <div class="m-info">Ты больше не будешь получать сообщения, звонки и запросы от этого пользователя.</div>
      <div class="m-btns">
        <button class="btn-cancel" onclick="closeModal()">Отмена</button>
        <button class="btn-danger" onclick="doBlockUser('${pid}')">Заблокировать</button>
      </div>
    `);
    return;
  }
  saveAll();
  closePeerProfile();
}

function doBlockUser(pid){
  blockedUsers[pid]=true;
  saveAll();closeModal();closePeerProfile();
  toast('🚫 @'+pid+' заблокирован');
}

async function _fetchPeerElephantBadges(){
  if(!_fbReady()||!window._fbDb)return;
  const pids=Object.keys(peerNames).filter(p=>!p.startsWith('g_')&&p!==SLON_CHANNEL_ID&&p!==myUsername);
  for(const pid of pids){
    try{
      const snap=await new Promise(res=>{
        window._fbOnValue(window._fbRef(window._fbDb,'elephant_badges/'+pid),s=>res(s),{onlyOnce:true});
      });
      if(snap?.val()===true){peerElephantBadges[pid]=true;}
    }catch(e){}
  }
}

async function adminGrantBadge(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  try{
    await window._fbSet(window._fbRef(window._fbDb,'elephant_badges/'+pid),true);
    peerElephantBadges[pid]=true;
    toast('🐘 Слонгалочка выдана @'+pid);
    closePeerProfile();
  }catch(e){toast('Ошибка: '+e.message);}
}

async function adminRevokeBadge(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  try{
    await window._fbRemove(window._fbRef(window._fbDb,'elephant_badges/'+pid));
    delete peerElephantBadges[pid];
    toast('Слонгалочка отозвана у @'+pid);
    closePeerProfile();
  }catch(e){toast('Ошибка: '+e.message);}
}

async function adminBanUser(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  showModal(`
    <div class="m-title">🔨 Забанить @${esc(pid)}</div>
    <div class="m-info">Выбери срок блокировки:</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
      <button class="admin-row" onclick="doAdminBan('${pid}',1)">1 час</button>
      <button class="admin-row" onclick="doAdminBan('${pid}',24)">1 день</button>
      <button class="admin-row" onclick="doAdminBan('${pid}',168)">7 дней</button>
      <button class="admin-row" onclick="doAdminBan('${pid}',720)">30 дней</button>
      <button class="admin-row danger" onclick="doAdminBan('${pid}',-1)">Навсегда</button>
    </div>
    <div class="m-btns" style="margin-top:8px"><button class="btn-cancel" onclick="closeModal()">Отмена</button></div>
  `);
}

async function doAdminBan(pid,hours){
  closeModal();closePeerProfile();
  const until=hours===-1?9999999999999:Date.now()+hours*3600000;
  try{
    await window._fbSet(window._fbRef(window._fbDb,'bans/'+pid),{until,by:myUsername,ts:Date.now()});
    bannedUsers[pid]={until,by:myUsername};
    // Шлём уведомление о бане через inbox
    _fbSend(pid,{type:'system_ban',until,hours});
    toast('🔨 @'+pid+' заблокирован'+(hours===-1?' навсегда':' на '+hours+'ч'));
  }catch(e){toast('Ошибка: '+e.message);}
}

async function adminUnbanUser(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  try{
    await window._fbRemove(window._fbRef(window._fbDb,'bans/'+pid));
    delete bannedUsers[pid];
    closePeerProfile();
    toast('✅ @'+pid+' разбанен');
  }catch(e){toast('Ошибка: '+e.message);}
}

async function _checkBanStatus(){
  if(!_fbReady()||!window._fbDb||!myUsername)return;
  try{
    const snap=await _fbOnce('bans/'+myUsername);
    const d=snap?.val();
    if(d&&d.until>Date.now()){
      // Забанен — блокируем интерфейс
      const until=d.until===9999999999999?'навсегда':new Date(d.until).toLocaleString('ru');
      document.body.innerHTML=`
        <div style="position:fixed;inset:0;background:#0f172a;display:flex;align-items:center;justify-content:center;padding:24px">
          <div style="text-align:center;max-width:340px">
            <div style="font-size:60px;margin-bottom:16px">🔨</div>
            <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px">Аккаунт заблокирован</div>
            <div style="color:rgba(255,255,255,.6);font-size:14px;line-height:1.5">Твой аккаунт <b>@${esc(myUsername)}</b> заблокирован до <b>${until}</b>.<br><br>Если считаешь это ошибкой — обратись к администраторам.</div>
          </div>
        </div>`;
    }
  }catch(e){}
}

function _handleSystemBan(data){
  const until=data.until===9999999999999?'навсегда':new Date(data.until).toLocaleString('ru');
  document.body.innerHTML=`
    <div style="position:fixed;inset:0;background:#0f172a;display:flex;align-items:center;justify-content:center;padding:24px">
      <div style="text-align:center;max-width:340px">
        <div style="font-size:60px;margin-bottom:16px">🔨</div>
        <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px">Аккаунт заблокирован</div>
        <div style="color:rgba(255,255,255,.6);font-size:14px;line-height:1.5">Твой аккаунт заблокирован до <b>${until}</b>.</div>
      </div>
    </div>`;
}

async function _checkPremiumStatus(){
  if(!_fbReady()||!window._fbDb||!myUsername)return;
  try{
    const snap=await _fbOnce('premium/'+myUsername);
    const val=snap?.val();
    const hasPrem=!!(val&&(val===true||(val.until&&val.until>Date.now())));
    if(hasPrem!==myPremium){
      myPremium=hasPrem;saveAll();buildThemeGrids();updateProfileDisplay();
    }
  }catch(e){}
}

async function _fetchPeerPremiums(){
  if(!_fbReady()||!window._fbDb)return;
  const pids=Object.keys(peerNames).filter(p=>!p.startsWith('g_')&&p!==SLON_CHANNEL_ID&&p!==myUsername);
  for(const pid of pids){
    try{
      const snap=await _fbOnce('premium/'+pid);
      const val=snap?.val();
      peerPremium[pid]=!!(val&&(val===true||(val.until&&val.until>Date.now())));
    }catch(e){}
  }
}

async function adminGrantPremium(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  showModal(`
    <div class="m-title">⭐ Выдать Premium @${esc(pid)}</div>
    <div class="m-info">Выбери срок подписки:</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
      <button class="admin-row" onclick="doAdminGrantPremium('${pid}',30)">30 дней</button>
      <button class="admin-row" onclick="doAdminGrantPremium('${pid}',90)">3 месяца</button>
      <button class="admin-row" onclick="doAdminGrantPremium('${pid}',365)">1 год</button>
      <button class="admin-row" style="color:#fbbf24" onclick="doAdminGrantPremium('${pid}',-1)">Навсегда ✨</button>
    </div>
    <div class="m-btns" style="margin-top:8px"><button class="btn-cancel" onclick="closeModal()">Отмена</button></div>
  `);
}

async function doAdminGrantPremium(pid,days){
  closeModal();closePeerProfile();
  const until=days===-1?9999999999999:Date.now()+days*86400000;
  try{
    await window._fbSet(window._fbRef(window._fbDb,'premium/'+pid),{until,by:myUsername,ts:Date.now()});
    peerPremium[pid]=true;
    _fbSend(pid,{type:'system_premium',until});
    toast('⭐ Premium выдан @'+pid+(days===-1?' навсегда':' на '+days+' дн'));
  }catch(e){toast('Ошибка: '+e.message);}
}

async function adminRevokePremium(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  try{
    await window._fbRemove(window._fbRef(window._fbDb,'premium/'+pid));
    peerPremium[pid]=false;closePeerProfile();
    toast('Premium отозван у @'+pid);
  }catch(e){toast('Ошибка: '+e.message);}
}

function showAdminConsolePage(){
  const c=$('adminConsoleContent');
  c.innerHTML=`
    <div class="admin-console-title" style="margin-bottom:4px">Управление каналом</div>
    <button class="admin-row" onclick="showChannelPublish();closeAdminConsole()">
      <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
      Опубликовать пост в канале
    </button>
    <div class="admin-console-title" style="margin-top:12px;margin-bottom:4px">Пользователи</div>
    <div style="color:var(--text2);font-size:13px;padding:8px 4px">Открой профиль пользователя чтобы выдать слонгалочку или заблокировать его.</div>
  `;
  $('adminConsoleOverlay').classList.add('show');
}

function _loadAdminsFromFirebase(){
  if(!window._fbDb)return;
  window._fbOnValue(window._fbRef(window._fbDb,'admins'),snap=>{
    const d=snap.val();
    if(!d)return;
    Object.entries(d).forEach(([uid,v])=>{
      if(v===true)CHANNEL_ADMINS.add(uid);
      else CHANNEL_ADMINS.delete(uid);
    });
    // Обновляем видимость консоли в тулбаре
    const adminRow=$('adminConsoleRow');
    if(adminRow)adminRow.style.display=CHANNEL_ADMINS.has(myUsername)?'':'none';
  });
}

async function adminGrantAdmin(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  showModal(`
    <div class="m-title">🛡 Выдать права администратора</div>
    <div class="m-info">@${esc(pid)} получит доступ к консоли администратора SLON. Это нельзя отменить без прав суперадмина.</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doAdminGrantAdmin('${pid}')">Выдать права</button>
    </div>
  `);
}

async function doAdminGrantAdmin(pid){
  closeModal();closePeerProfile();
  try{
    await window._fbSet(window._fbRef(window._fbDb,'admins/'+pid),true);
    CHANNEL_ADMINS.add(pid);
    _fbSend(pid,{type:'system_admin_granted',by:myUsername});
    toast('🛡 @'+pid+' теперь администратор');
  }catch(e){toast('Ошибка: '+e.message);}
}

async function adminRevokeAdmin(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  showModal(`
    <div class="m-title">🛡 Убрать права администратора</div>
    <div class="m-info">@${esc(pid)} потеряет доступ к консоли администратора.</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-danger" onclick="doAdminRevokeAdmin('${pid}')">Убрать права</button>
    </div>
  `);
}

async function doAdminRevokeAdmin(pid){
  closeModal();closePeerProfile();
  try{
    await window._fbRemove(window._fbRef(window._fbDb,'admins/'+pid));
    CHANNEL_ADMINS.delete(pid);
    toast('🛡 Права администратора у @'+pid+' отозваны');
  }catch(e){toast('Ошибка: '+e.message);}
}

// ── Сброс пароля пользователю (для восстановления доступа) ──
// Убираем хеш, оставляем узел auth/{pid} с меткой reset. При следующем входе
// человек попадёт на экран «Установить пароль» и задаст свой новый — старый пароль
// мы не узнаём и никому не выдаём. Права/премиум/кастом остаются (висят на юзернейме).
async function adminResetPassword(pid){
  if(!CHANNEL_ADMINS.has(myUsername))return;
  showModal(`
    <div class="m-title">🔑 Сбросить пароль</div>
    <div class="m-info">У @${esc(pid)} будет удалён пароль. При следующем входе аккаунт попросит задать <b>новый</b> пароль — попроси владельца зайти и придумать его.<br><br>Права, премиум и кастом останутся. Отменить сброс нельзя.</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doAdminResetPassword('${pid}')">Сбросить пароль</button>
    </div>
  `);
}

async function doAdminResetPassword(pid){
  closeModal();closePeerProfile();
  try{
    await window._fbRemove(window._fbRef(window._fbDb,'auth/'+pid+'/hash'));
    await window._fbSet(window._fbRef(window._fbDb,'auth/'+pid+'/reset'),{by:myUsername,ts:Date.now()});
    _fbSend?.(pid,{type:'system_pass_reset',by:myUsername});
    toast('🔑 Пароль @'+pid+' сброшен — пусть зайдёт и задаст новый');
  }catch(e){toast('Ошибка: '+e.message);}
}

async function _checkElephantBadgeFirebase(){
  if(!_fbReady()||!window._fbDb||!myUsername)return;
  try{
    const snap=await new Promise(res=>{
      window._fbOnValue(window._fbRef(window._fbDb,'elephant_badges/'+myUsername),s=>res(s),{onlyOnce:true});
    });
    if(snap?.val()===true&&!hasElephantBadge){
      hasElephantBadge=true;saveAll();
      showEpicOverlay();
    }
  }catch(e){}
}

async function _grantElephantBadge(username){
  if(!_fbReady()||!window._fbDb)return;
  await window._fbSet(window._fbRef(window._fbDb,'elephant_badges/'+username),true);
}

function checkSecretCode(){
  const inp=$('secretCodeInp'),st=$('secretCodeStatus');
  const code=(inp?.value||'').trim();
  if(!code)return;
  if(code==='SLON_ELEPHANT_2024'||code==='слон'||code==='elephant'){
    if(!hasElephantBadge){
      hasElephantBadge=true;saveAll();
      inp.value='';
      if(st){st.textContent='✅ Значок активирован!';st.style.display='block';st.style.color='var(--online)';}
      showEpicOverlay();
    }else{
      if(st){st.textContent='🐘 Значок уже активирован!';st.style.display='block';}
    }
  }else{
    if(st){st.textContent='❌ Неверный код';st.style.display='block';st.style.color='var(--red)';}
    inp.classList.add('err');setTimeout(()=>inp.classList.remove('err'),800);
  }
}

function showEpicOverlay(){
  const ov=$('epicOverlay');ov.classList.add('show');
  // Stars
  const stars=$('epicStars');stars.innerHTML='';
  for(let i=0;i<60;i++){
    const s=document.createElement('div');s.className='epic-star';
    s.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;width:${2+Math.random()*4}px;height:${2+Math.random()*4}px;animation-delay:${Math.random()*2}s;animation-duration:${0.5+Math.random()}s`;
    stars.appendChild(s);
  }
  // Rays
  const rays=$('epicRays');rays.innerHTML='';
  for(let i=0;i<12;i++){
    const r=document.createElement('div');r.className='epic-ray';
    r.style.transform=`rotate(${i*30}deg)`;rays.appendChild(r);
  }
  // Confetti
  const conf=$('epicConfetti');conf.innerHTML='';
  const colors=['#c084fc','#f0abfc','#818cf8','#38bdf8','#4ade80','#fb923c','#f472b6'];
  for(let i=0;i<40;i++){
    const p=document.createElement('div');p.className='epic-conf-piece';
    p.style.cssText=`left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*2}s;animation-duration:${2+Math.random()*3}s`;
    conf.appendChild(p);
  }
  updateProfileDisplay();
}

function closeEpicOverlay(){
  $('epicOverlay').classList.remove('show');
  updateProfileDisplay();
  toast('🐘 Ты теперь Легенда Слона!',5000);
}
