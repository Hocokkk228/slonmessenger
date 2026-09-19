function showModal(html){$('mbox').innerHTML=html;$('modal').classList.add('show');}

function closeModal(){$('modal').classList.remove('show');}

function showAddContact(){
  showModal(`
    <div class="m-title">➕ Добавить контакт</div>
    <div class="m-info">Введи юзернейм собеседника (без @). Например: <b>ivan_petrov</b></div>
    <input class="m-inp" id="addPidInp" placeholder="юзернейм" maxlength="20"
      autocomplete="off" autocapitalize="none" spellcheck="false"
      oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'')"
      onkeydown="if(event.key==='Enter')doAddContact()">
    <input class="m-inp" id="addNickInp" placeholder="Псевдоним (необязательно)" maxlength="32" onkeydown="if(event.key==='Enter')doAddContact()">
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-ok" onclick="doAddContact()">Подключиться</button>
    </div>
  `);
  setTimeout(()=>$('addPidInp')?.focus(),100);
}

function doAddContact(){
  const pid=($('addPidInp')?.value||'').trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const nick=($('addNickInp')?.value||'').trim();
  if(!pid){toast('Введи юзернейм');return;}
  closeModal();
  connectTo(pid,nick);
}

function openWizard(type){
  closeFabMenu();
  _wizType=type;
  _wizStep=1;
  _wizData={members:[],name:'',desc:'',avatar:null};
  $('wizardBackdrop').classList.add('show');
  $('wizardOverlay').classList.add('show');
  _wizRenderStep(1);
}

function closeWizard(){
  $('wizardBackdrop').classList.remove('show');
  $('wizardOverlay').classList.remove('show');
}

function wizardBack(){
  if(_wizType==='group'&&_wizStep===2){
    _wizStep=1;
    _wizRenderStep(-1);
    return;
  }
  closeWizard();
}

function wizardNext(){
  if(_wizType==='group'){
    if(_wizStep===1){
      const checked=[...document.querySelectorAll('#wizMemberList input[type=checkbox]:checked')].map(el=>el.value);
      _wizData.members=checked;
      _wizStep=2;
      _wizRenderStep(1);
    }else{
      const name=($('wizNameInp')?.value||'').trim();
      if(!name){toast('Введи название группы');return;}
      _wizData.name=name;
      _wizData.desc=($('wizDescInp')?.value||'').trim();
      closeWizard();
      createGroup(_wizData.name,_wizData.members,_wizData.avatar,_wizData.desc);
    }
  }else if(_wizType==='channel'){
    const username=($('wizChUsernameInp')?.value||'').trim();
    const name=($('wizNameInp')?.value||'').trim();
    const desc=($('wizDescInp')?.value||'').trim();
    if(!username){toast('Введи юзернейм канала');return;}
    if(username.length<3){toast('Юзернейм минимум 3 символа');return;}
    if(!name){toast('Введи название канала');return;}
    const avatar=_wizData.avatar;
    closeWizard();
    _doCreateChannelWizard(username,name,desc,avatar);
  }
}

function _wizRenderStep(dir){
  if(_wizType==='group'){
    $('wizardTitle').textContent=_wizStep===1?'Добавить участников':'Новая группа';
    $('wizardBack').style.visibility=_wizStep===1?'visible':'visible';
    if(_wizStep===1)_wizRenderMembersStep(dir);
    else _wizRenderGroupInfoStep(dir);
  }else if(_wizType==='channel'){
    $('wizardTitle').textContent='Новый канал';
    _wizRenderChannelStep(dir);
  }
}

function _wizSetBody(html,dir){
  const body=$('wizardBody');
  body.innerHTML='';
  const wrap=document.createElement('div');
  wrap.className='wiz-step';
  wrap.innerHTML=html;
  wrap.style.animation=(dir>=0?'wizSlideInR':'wizSlideInL')+' .3s cubic-bezier(.32,.72,0,1) both';
  body.appendChild(wrap);
}

function _wizRenderMembersStep(dir){
  const allContacts=Object.keys(peerNames).filter(pid=>
    pid&&pid!==myUsername&&!pid.startsWith('g_')&&pid!==SLON_CHANNEL_ID&&!pid.startsWith('ch_')
  );
  const rows=allContacts.map(pid=>{
    const isOnline=!!(_fbConns[pid]||conns[pid]?.open);
    const av=peerAvatars[pid];
    const checked=_wizData.members.includes(pid)?'checked':'';
    return `<label class="wiz-member-row" data-name="${esc((peerNames[pid]||pid).toLowerCase())}">
      <input type="checkbox" value="${pid}" ${checked}>
      <div class="wiz-member-av">${av?`<img src="${av}">`:icoSvg('i-person')}</div>
      <div class="wiz-member-info">
        <div class="wiz-member-name">${esc(peerNames[pid]||('@'+pid))}</div>
        <div class="wiz-member-sub">${isOnline?'в сети':'не в сети'}</div>
      </div>
    </label>`;
  }).join('')||'<div class="sb-global-empty">Нет контактов — сначала найди кого-то через поиск</div>';
  const html=`
    <div class="wiz-search-wrap">
      <svg class="sb-search-ico" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <input class="wiz-search-inp" placeholder="Поиск" oninput="_wizFilterMembers(this.value)">
    </div>
    <div class="wiz-member-list" id="wizMemberList">${rows}</div>`;
  _wizSetBody(html,dir);
}

function _wizFilterMembers(q){
  q=q.trim().toLowerCase();
  document.querySelectorAll('#wizMemberList .wiz-member-row').forEach(el=>{
    el.style.display=(!q||el.dataset.name.includes(q))?'':'none';
  });
}

function _wizMembersPreviewHtml(){
  const me=`<div class="wiz-member-row" style="cursor:default">
      <div class="wiz-member-av">${myAvatar?`<img src="${myAvatar}">`:icoSvg('i-person')}</div>
      <div class="wiz-member-info"><div class="wiz-member-name">${esc(myNick||('@'+myUsername))} (ты)</div></div>
    </div>`;
  const others=_wizData.members.map(pid=>{
    const av=peerAvatars[pid];
    return `<div class="wiz-member-row" style="cursor:default">
      <div class="wiz-member-av">${av?`<img src="${av}">`:icoSvg('i-person')}</div>
      <div class="wiz-member-info"><div class="wiz-member-name">${esc(peerNames[pid]||('@'+pid))}</div></div>
    </div>`;
  }).join('');
  return me+others;
}

function _wizRenderGroupInfoStep(dir){
  const html=`
    <div class="wiz-avatar-wrap">
      <div class="wiz-avatar" id="wizAvPreview" onclick="_wizPickAvatar()">${_wizData.avatar?`<img src="${_wizData.avatar}">`:_wizCameraSvg}</div>
      <input type="file" id="wizAvInput" accept="image/*" style="display:none" onchange="_wizAvatarChange(this)">
    </div>
    <input class="wiz-inp" id="wizNameInp" placeholder="Название группы" maxlength="40" value="${esc(_wizData.name||'')}">
    <textarea class="wiz-ta" id="wizDescInp" placeholder="Описание (необязательно)" maxlength="200">${esc(_wizData.desc||'')}</textarea>
    <div class="wiz-members-hdr">${_wizData.members.length+1} участник${_wizData.members.length?'а':''}</div>
    <div class="wiz-members-preview">${_wizMembersPreviewHtml()}</div>`;
  _wizSetBody(html,dir);
  setTimeout(()=>$('wizNameInp')?.focus(),150);
}

function _wizRenderChannelStep(dir){
  const html=`
    <div class="wiz-avatar-wrap">
      <div class="wiz-avatar" id="wizAvPreview" onclick="_wizPickAvatar()">${_wizData.avatar?`<img src="${_wizData.avatar}">`:_wizCameraSvg}</div>
      <input type="file" id="wizAvInput" accept="image/*" style="display:none" onchange="_wizAvatarChange(this)">
    </div>
    <input class="wiz-inp" id="wizChUsernameInp" placeholder="Юзернейм канала (a-z0-9_)" maxlength="20"
      autocapitalize="none" spellcheck="false"
      oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'')" value="${esc(_wizData.username||'')}">
    <input class="wiz-inp" id="wizNameInp" placeholder="Название канала" maxlength="40" value="${esc(_wizData.name||'')}">
    <textarea class="wiz-ta" id="wizDescInp" placeholder="Описание (необязательно)" maxlength="200">${esc(_wizData.desc||'')}</textarea>
    <div class="wiz-hint">Можно добавить описание — расскажи о чём канал. Это необязательно.</div>`;
  _wizSetBody(html,dir);
  setTimeout(()=>$('wizChUsernameInp')?.focus(),150);
}

function _wizPickAvatar(){document.getElementById('wizAvInput')?.click();}

function _wizAvatarChange(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=120;canvas.height=120;
      const ctx=canvas.getContext('2d');
      const s=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,120,120);
      _wizData.avatar=canvas.toDataURL('image/jpeg',0.85);
      const prev=$('wizAvPreview');
      if(prev)prev.innerHTML=`<img src="${_wizData.avatar}">`;
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
