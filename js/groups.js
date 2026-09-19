function _fbSyncGroupToSelf(gid){
  if(!_fbMode||!window._fbDb||!myUsername||!groups[gid])return;
  try{
    window._fbSet(
      window._fbRef(window._fbDb,'user_groups/'+myUsername+'/'+gid),
      {name:groups[gid].name,members:groups[gid].members,admin:groups[gid].admin,
       avatar:groups[gid].avatar||null,desc:groups[gid].desc||'',ts:Date.now()}
    );
  }catch(e){console.warn('fbSyncGroup:',e);}
}

function _fbListenMyGroups(){
  if(!_fbReady()||!window._fbDb||!myUsername)return;
  window._fbOnChildAdded(
    window._fbRef(window._fbDb,'user_groups/'+myUsername),
    snap=>{
      const gid=snap.key;
      const d=snap.val();
      if(!gid||!d)return;
      if(groups[gid])return; // уже есть на этом устройстве
      // Новая группа пришла с другого устройства или при первом входе
      groups[gid]={name:d.name,members:d.members,admin:d.admin,avatar:d.avatar||null,desc:d.desc||''};
      if(!grpHist[gid])grpHist[gid]=[];
      if(!$('si-'+gid))addSbGroup(gid);
      saveAll();
      toast('📥 Группа "'+d.name+'" синхронизирована');
    }
  );
}

function createGroup(name,members,avatar,desc){
  const gid='g_'+Date.now();
  groups[gid]={name,members:[myUsername,...members],admin:myUsername,avatar:avatar||null,desc:desc||''};grpHist[gid]=[];
  const inv={type:'group_invite',gid,name,members:groups[gid].members,admin:myUsername,
    adminNick:myNick||('@'+myUsername),adminAvatar:myAvatar||null,avatar:avatar||null,desc:desc||''};
  // Шлём участникам через Firebase
  members.forEach(pid=>{
    if(_fbMode)_fbSend(pid,inv);
    else if(conns[pid]?.open)sendData(conns[pid],inv);
  });
  // Записываем группу в Firebase чтобы наши другие устройства тоже её увидели
  _fbSyncGroupToSelf(gid);
  addSbGroup(gid);openChat(gid);sysMsg(gid,'Группа "'+name+'" создана! Участников: '+(members.length+1));saveAll();
}

function recvGrpInvite(data){
  if(groups[data.gid])return;
  groups[data.gid]={name:data.name,members:data.members,admin:data.admin,avatar:data.avatar||null,desc:data.desc||''};grpHist[data.gid]=[];
  if(!$('si-'+data.gid))addSbGroup(data.gid);
  sysMsg(data.gid,'Тебя добавили в "'+data.name+'"');toast('Добавлен в "'+data.name+'"!');
  // Записываем группу в Firebase чтобы наши другие устройства тоже её увидели
  _fbSyncGroupToSelf(data.gid);
  data.members.forEach(pid=>{if(pid!==myUsername&&!conns[pid]?.open)silentConnect(pid);});saveAll();
}

function sendGrpMsg(gid,text){
  const g=groups[gid];if(!g)return;
  const mid='gm'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
  const ts=Date.now();
  const msg={id:mid,sender:'me',text,time:fmtTime(ts),ts};
  if(!grpHist[gid])grpHist[gid]=[];grpHist[gid].push(msg);appendMsg(msg);scrollDown();
  updatePreview(gid,'Вы: '+text.slice(0,25));saveAll();
  // Пишем в Firebase группы — надёжнее чем индивидуальные inbox
  if(window._fbDb&&_fbMode){
    window._fbSet(window._fbRef(window._fbDb,'grp_msgs/'+gid+'/'+mid),{
      id:mid,text,ts,sid:myUsername,nick:myNick||('@'+myUsername),
      avatar:myAvatar||null,gname:g.name||'Группа'
    }).catch(e=>console.warn('grpMsg write error:',e));
  }else{
    // Fallback: индивидуальные inbox
    const pkt={type:'group_msg',gid,gname:g.name||'Группа',text,nick:myNick||('@'+myUsername),
      avatar:myAvatar||null,sid:myUsername,mid,time:fmtTime(ts),ts};
    g.members.forEach(pid=>{if(pid!==myUsername&&(_fbMode||conns[pid]?.open))sendData(conns[pid]||pid,pkt);});
  }
}

function recvGrpMsg(data){
  if(!data.gid)return;
  // Автосоздание: если получили сообщение в группу которой нет — создаём минимальную запись
  if(!groups[data.gid]){
    groups[data.gid]={name:data.gname||'Группа',members:[myUsername,data.sid||''].filter(Boolean),admin:data.sid||''};
    if(!$('si-'+data.gid))addSbGroup(data.gid);
    saveAll();
  }
  if(!grpHist[data.gid])grpHist[data.gid]=[];
  const msg={id:data.mid,sender:'inc',senderId:data.sid,name:peerNames[data.sid]||data.nick||('@'+data.sid),avatar:data.avatar||peerAvatars[data.sid]||null,text:data.text,ts:data.ts||Date.now(),time:data.time||nowTime()};
  grpHist[data.gid].push(msg);
  if(activeChat===data.gid){appendMsg(msg);scrollDown();}
  else{addUnread(data.gid);toast((groups[data.gid]?.name||'Группа')+': '+msg.name+': '+data.text.slice(0,35));}
  saveAll();
}

function showCreateGroup(){
  const allContacts=Object.keys(peerNames).filter(pid=>
    pid&&pid!==myUsername&&!pid.startsWith('g_')&&pid!==SLON_CHANNEL_ID
  );
  if(!allContacts.length){toast('Сначала добавь хотя бы один контакт');return;}
  const checks=allContacts.map(pid=>{
    const isOnline=!!(_fbConns[pid]||conns[pid]?.open);
    return`<label class="cb-row" style="display:flex;align-items:center;gap:10px;padding:8px 4px;cursor:pointer;border-bottom:1px solid var(--border)">
      <input type="checkbox" value="${pid}" style="width:16px;height:16px;flex-shrink:0">
      <span style="flex:1">${esc(peerNames[pid]||('@'+pid))}</span>
      <span style="font-size:11px;color:${isOnline?'var(--green)':'var(--text2)'}">${isOnline?'● онлайн':'○ оффлайн'}</span>
    </label>`;
  }).join('');
  showModal(`
    <div class="m-title">👥 Создать группу</div>
    <input class="m-inp" id="grpNameInp" placeholder="Название группы" maxlength="40">
    <div style="margin-top:12px;margin-bottom:4px;font-size:12px;color:var(--text2)">Участники — оффлайн получат приглашение при входе:</div>
    <div style="max-height:220px;overflow-y:auto;padding:4px 0">${checks}</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doCreateGroup()">Создать</button>
    </div>
  `);
  setTimeout(()=>$('grpNameInp')?.focus(),100);
}

function doCreateGroup(){
  const name=($('grpNameInp')?.value||'').trim();
  if(!name){toast('Введи название');return;}
  const members=[...document.querySelectorAll('#mbox input[type=checkbox]:checked')].map(el=>el.value);
  if(!members.length){toast('Выбери хотя бы одного участника');return;}
  closeModal();createGroup(name,members);
}

function showGroupInfo(gid){
  if(typeof showGroupPanel==='function')return showGroupPanel(gid); // новая панель справа
  const g=groups[gid];if(!g)return;
  const isOwner=g.admin===myUsername;
  const canInvite=isOwner||(g.canInvite&&g.canInvite[myUsername]);
  const mems=(g.members||[]).map(pid=>{
    const isAdmin=pid===g.admin;
    const hasInvite=g.canInvite&&g.canInvite[pid];
    const actions=isOwner&&pid!==myUsername?`
      <button onclick="grpKick('${gid}','${pid}')" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:11px;padding:2px 6px" title="Удалить">✕</button>
      <button onclick="grpToggleInvite('${gid}','${pid}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:11px;padding:2px 6px" title="${hasInvite?'Убрать право приглашать':'Дать право приглашать'}">${hasInvite?'👥✓':'👥+'}</button>`:'';
    return `<div style="display:flex;align-items:center;padding:8px 0;font-size:13px;border-bottom:1px solid var(--border)">
      <span style="flex:1">${esc(peerNames[pid]||('@'+pid))} ${isAdmin?'👑':''} ${hasInvite&&!isAdmin?'<span style="font-size:10px;color:var(--accent)">+invite</span>':''} ${pid===myUsername?'<span style="opacity:.5">(ты)</span>':''}</span>
      <span style="display:flex;gap:2px">${actions}</span>
    </div>`;
  }).join('');

  const addBtn=(isOwner||canInvite)?`<button class="btn-ok" style="margin-top:10px;width:100%" onclick="showAddGroupMember('${gid}')">➕ Добавить участника</button>`:'';

  showModal(`
    <div class="m-title">👥 ${esc(g.name)}</div>
    <div style="color:var(--text2);font-size:12px;margin-bottom:8px">${g.members?.length||0} участников</div>
    <div style="max-height:280px;overflow-y:auto">${mems}</div>
    ${addBtn}
    <div class="m-btns" style="margin-top:8px">
      <button class="btn-cancel" onclick="closeModal()">Закрыть</button>
    </div>
  `);
}

function showGroupProfile(gid){
  if(typeof showGroupPanel==='function')return showGroupPanel(gid);
  const g=groups[gid];if(!g)return;
  const isOwner=g.admin===myUsername;
  const bgStyle=_getProfileBgStyle(g.bg||'bg0',g.bgColor||'',g.bgPattern||'');
  // Оверлей профиля группы — похож на peerProfOverlay
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:500;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s';
  ov.id='grpProfOv';
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  const av=g.avatar?`<img src="${g.avatar}" style="width:72px;height:72px;object-fit:cover;border-radius:50%">`
    :`<div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:32px">👥</div>`;
  const memPrev=(g.members||[]).slice(0,4).map(pid=>`<span style="font-size:12px;background:rgba(255,255,255,.15);border-radius:20px;padding:2px 8px">${esc(peerNames[pid]||('@'+pid))}</span>`).join(' ');
  const editBtn=isOwner?`<button onclick="showGroupProfileEdit('${gid}')" style="margin-top:10px;width:100%;padding:10px;border-radius:10px;background:rgba(255,255,255,.15);border:none;color:#fff;cursor:pointer;font-size:14px">✏️ Редактировать профиль</button>`:'';
  ov.innerHTML=`
    <div style="width:100%;max-width:480px;border-radius:20px 20px 0 0;overflow:hidden">
      <div style="height:130px;background:${bgStyle};display:flex;align-items:flex-end;padding:14px 18px;gap:14px">
        ${av}
        <div>
          <div style="color:#fff;font-size:20px;font-weight:700">${esc(g.name||'Группа')}</div>
          <div style="color:rgba(255,255,255,.7);font-size:13px">${(g.members||[]).length} участников</div>
        </div>
      </div>
      <div style="background:var(--bg2);padding:16px 18px">
        ${g.desc?`<div style="color:var(--text2);font-size:13px;margin-bottom:12px">${esc(g.desc)}</div>`:''}
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${memPrev}${(g.members||[]).length>4?`<span style="font-size:12px;color:var(--text2)">+${(g.members||[]).length-4} ещё</span>`:''}</div>
        ${editBtn}
        <button onclick="document.getElementById('grpProfOv').remove()" style="margin-top:8px;width:100%;padding:10px;border-radius:10px;background:var(--bg3);border:none;color:var(--text);cursor:pointer;font-size:14px">Закрыть</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
}

function showGroupProfileEdit(gid){
  const g=groups[gid];if(!g||g.admin!==myUsername)return;
  document.getElementById('grpProfOv')?.remove();
  const curColor=g.bgColor||'#1d4ed8';
  showModal(`
    <div class="m-title">✏️ Профиль группы</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div id="grpAvPrev" style="width:52px;height:52px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:26px">${g.avatar?`<img src="${g.avatar}" style="width:100%;height:100%;object-fit:cover">`:'👥'}</div>
      <div style="flex:1">
        <button class="admin-row" style="width:100%" onclick="document.getElementById('grpAvFileInput').click()">📷 Аватарка группы</button>
        <input type="file" id="grpAvFileInput" accept="image/*" style="display:none" onchange="grpLoadAvatar('${gid}',this)">
      </div>
    </div>
    <input class="m-inp" id="grpEditName" placeholder="Название группы" maxlength="40" value="${esc(g.name||'')}">
    <textarea class="m-ta" id="grpEditDesc" placeholder="Описание группы (необязательно)" maxlength="300" style="min-height:60px">${esc(g.desc||'')}</textarea>
    ${myPremium?`
    <div class="admin-console-title" style="margin:10px 0 6px">🎨 Фон профиля (Premium)</div>
    <input type="color" id="grpColorPicker" value="${curColor}" style="width:100%;height:52px;border:none;border-radius:10px;cursor:pointer;margin-bottom:6px">
    <div id="grpColorPreview" style="height:44px;border-radius:10px;margin-bottom:8px;background:${curColor}"></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      <button class="admin-row${!g.bgPattern?' sel':''}" style="padding:6px 10px" id="grpPat_">Нет</button>
      ${PREMIUM_BG_PATTERNS.map(p=>`<button class="admin-row${g.bgPattern===p.id?' sel':''}" style="padding:6px 10px" id="grpPat_${p.id}">${p.emoji} ${p.label}</button>`).join('')}
    </div>`:'<div style="color:var(--text2);font-size:12px;margin:8px 0">⭐ SLON Premium — кастомный фон профиля</div>'}
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="saveGroupProfile('${gid}')">Сохранить</button>
    </div>
  `);
  // Wiring color picker
  const cp=$('grpColorPicker'),cpv=$('grpColorPreview');
  if(cp&&cpv)cp.addEventListener('input',e=>{cpv.style.background=e.target.value;});
  // Pattern buttons
  ['', ...PREMIUM_BG_PATTERNS.map(p=>p.id)].forEach(pid=>{
    const btn=$('grpPat_'+pid);
    if(btn)btn.onclick=()=>{
      if(!groups[gid])return;
      groups[gid].bgPattern=pid;
      document.querySelectorAll('[id^="grpPat_"]').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
    };
  });
}

function grpLoadAvatar(gid,input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
      const ctx=canvas.getContext('2d');
      const s=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,64,64);
      const thumb=canvas.toDataURL('image/jpeg',0.8);
      if(groups[gid])groups[gid].avatar=thumb;
      const prev=$('grpAvPrev');
      if(prev)prev.innerHTML=`<img src="${thumb}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveGroupProfile(gid){
  const g=groups[gid];if(!g||g.admin!==myUsername)return;
  const name=($('grpEditName')?.value||'').trim()||g.name;
  const desc=($('grpEditDesc')?.value||'').trim();
  const bgColor=myPremium?($('grpColorPicker')?.value||g.bgColor||''):(g.bgColor||'');
  const bgPattern=myPremium?(g.bgPattern||''):'';
  g.name=name;g.desc=desc;g.bgColor=bgColor;g.bgPattern=bgPattern;
  closeModal();saveAll();
  // Обновляем шапку
  if(activeChat===gid)updateChatHeader();
  // Оповещаем участников
  (g.members||[]).filter(m=>m!==myUsername).forEach(pid=>{
    _fbSend(pid,{type:'group_profile_update',gid,name,desc,avatar:g.avatar||null,bgColor,bgPattern});
  });
  toast('✅ Профиль группы обновлён');
}

function showAddGroupMember(gid){
  const g=groups[gid];if(!g)return;
  const isOwner=g.admin===myUsername;
  const canInvite=isOwner||(g.canInvite&&g.canInvite[myUsername]);
  if(!canInvite)return toast('Нет прав приглашать');
  // Показываем контакты которых ещё нет в группе
  const existing=new Set(g.members||[]);
  const available=Object.keys(peerNames).filter(pid=>
    !existing.has(pid)&&!pid.startsWith('g_')&&pid!==SLON_CHANNEL_ID&&!pid.startsWith('ch_'));
  if(!available.length)return toast('Нет доступных контактов для добавления');
  const checks=available.map(pid=>`
    <label style="display:flex;align-items:center;gap:8px;padding:8px 0;cursor:pointer;border-bottom:1px solid var(--border)">
      <input type="checkbox" class="add-mem-cb" value="${pid}">
      <span>${esc(peerNames[pid]||('@'+pid))}</span>
    </label>`).join('');
  showModal(`
    <div class="m-title">➕ Добавить в группу</div>
    <div style="max-height:260px;overflow-y:auto">${checks}</div>
    <div class="m-btns" style="margin-top:10px">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doAddGroupMembers('${gid}')">Добавить</button>
    </div>
  `);
}

function doAddGroupMembers(gid){
  const g=groups[gid];if(!g)return;
  const selected=[...document.querySelectorAll('.add-mem-cb:checked')].map(cb=>cb.value);
  if(!selected.length)return toast('Выбери хотя бы одного');
  closeModal();
  selected.forEach(pid=>{
    if(!g.members.includes(pid))g.members.push(pid);
    // Уведомляем нового участника
    _fbSend(pid,{type:'group_add',gid,name:g.name,members:g.members,by:myUsername});
    // Уведомляем текущих участников
    g.members.filter(m=>m!==myUsername&&m!==pid).forEach(m=>{
      _fbSend(m,{type:'group_update',gid,members:g.members});
    });
  });
  saveAll();
  toast('✅ Добавлено '+selected.length+' участн.');
  // Обновляем header
  if(activeChat===gid)updateChatHeader();
}

function grpKick(gid,pid){
  const g=groups[gid];if(!g||g.admin!==myUsername)return;
  showModal(`
    <div class="m-title">Удалить из группы</div>
    <div class="m-info">Удалить @${esc(pid)} из группы «${esc(g.name)}»?</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-danger" onclick="doGrpKick('${gid}','${pid}')">Удалить</button>
    </div>
  `);
}

function doGrpKick(gid,pid){
  closeModal();
  const g=groups[gid];if(!g)return;
  g.members=g.members.filter(m=>m!==pid);
  if(g.canInvite&&g.canInvite[pid])delete g.canInvite[pid];
  _fbSend(pid,{type:'group_kick',gid});
  g.members.forEach(m=>{ if(m!==myUsername) _fbSend(m,{type:'group_update',gid,members:g.members}); });
  saveAll();closeModal();showGroupInfo(gid);
}

function grpToggleInvite(gid,pid){
  const g=groups[gid];if(!g||g.admin!==myUsername)return;
  if(!g.canInvite)g.canInvite={};
  if(g.canInvite[pid]){delete g.canInvite[pid];toast('@'+pid+' больше не может приглашать');}
  else{g.canInvite[pid]=true;toast('@'+pid+' теперь может приглашать');}
  // Уведомляем участников об обновлении
  g.members.forEach(m=>{if(m!==myUsername)_fbSend(m,{type:'group_update',gid,members:g.members,canInvite:g.canInvite});});
  saveAll();showGroupInfo(gid);
}

function _fbListenAllGrpMsgs(){
  if(!window._fbDb)return;
  Object.keys(groups).forEach(gid=>_fbListenGrpMsgs(gid));
}

function _fbListenGrpMsgs(gid){
  if(_grpMsgListeners[gid]||!window._fbDb)return;
  const ref=window._fbRef(window._fbDb,'grp_msgs/'+gid);
  const unsub=window._fbOnChildAdded(ref,snap=>{
    const d=snap.val();
    if(!d||!d.sid||d.sid===myUsername)return; // своё уже добавили
    if(!d.id)return;
    if(!grpHist[gid])grpHist[gid]=[];
    if(grpHist[gid].some(m=>m.id===d.id))return; // дедупликация
    // Медиа-сообщения (voice/slon)
    if(d.type==='voice'||d.type==='slon'||d.type==='file'){
      _recvGrpMedia(gid,d);return;
    }
    if(!groups[gid]){
      groups[gid]={name:d.gname||'Группа',members:[myUsername,d.sid].filter(Boolean),admin:d.sid};
      if(!$('si-'+gid))addSbGroup(gid);saveAll();
    }
    const ts=d.ts||Date.now();
    const msg={id:d.id,sender:'inc',senderId:d.sid,
      name:peerNames[d.sid]||d.nick||('@'+d.sid),
      avatar:d.avatar||peerAvatars[d.sid]||null,
      text:d.text,ts,time:fmtTime(ts)};
    grpHist[gid].push(msg);
    if(activeChat===gid){appendMsg(msg);scrollDown();}
    else{addUnread(gid);if(!mutedChats[gid]&&_notifOn('groups')){playNotifSound();toast((groups[gid]?.name||'Группа')+': '+msg.name+': '+_notifText('groups',d.text).slice(0,35));}}
    saveAll();
    // Удаляем старые сообщения из Firebase (старше 7 дней) чтобы не копить
    if(ts<Date.now()-7*86400000)window._fbRemove(snap.ref).catch(()=>{});
  });
  _grpMsgListeners[gid]=unsub;
}

async function _recvGrpMedia(gid,d){
  if(!groups[gid]){
    groups[gid]={name:d.gname||'Группа',members:[myUsername,d.sid].filter(Boolean),admin:d.sid};
    if(!$('si-'+gid))addSbGroup(gid);saveAll();
  }
  if(!grpHist[gid])grpHist[gid]=[];
  if(grpHist[gid].some(m=>m.id===d.id))return;
  // Загружаем чанки из RTDB
  const ts=d.ts||Date.now();
  const base='grp_media/'+gid+'/'+d.id;
  try{
    const metaSnap=await _fbOnce(base+'/meta');
    const meta=metaSnap?.val();if(!meta)return;
    const parts=[];
    for(let i=0;i<meta.total;i++){
      const cs=await _fbOnce(base+'/chunks/'+i);
      parts.push(cs?.val()||'');
    }
    const dataUrl=parts.join('');
    // Сохраняем в IDB
    await _saveMediaToIdb(d.id,d.type,dataUrl);
    const msg={id:d.id,sender:'inc',senderId:d.sid,
      name:peerNames[d.sid]||d.nick||('@'+d.sid),
      avatar:d.avatar||peerAvatars[d.sid]||null,
      ts,time:fmtTime(ts)};
    if(d.type==='voice'){
      msg.voiceData='idb:'+d.id+':voice';
      msg.voiceDur=meta.dur||0;
    }else{
      msg.slonData='idb:'+d.id+':slon';
      msg.slonDur=meta.dur||0;
    }
    grpHist[gid].push(msg);
    if(activeChat===gid){appendMsg(msg);scrollDown();}
    else{addUnread(gid);if(!mutedChats[gid]&&_notifOn('groups'))toast((groups[gid]?.name||'Группа')+': '+(d.type==='voice'?'🎙️ Голосовое':'🐘 Слонкружок'));}
    saveAll();
  }catch(e){console.warn('_recvGrpMedia error:',e);}
}

function _fbListenGrpMsgsForNew(gid){
  if(!_grpMsgListeners[gid])_fbListenGrpMsgs(gid);
}
