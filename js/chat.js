function fmtDateSeparator(ts){
  const d=new Date(ts), now=new Date();
  const isSameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  const yesterday=new Date(now); yesterday.setDate(now.getDate()-1);
  if(isSameDay(d,now))return 'Сегодня';
  if(isSameDay(d,yesterday))return 'Вчера';
  const months=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const sameYear=d.getFullYear()===now.getFullYear();
  return d.getDate()+' '+months[d.getMonth()]+(sameYear?'':' '+d.getFullYear());
}

function linkify(text){
  if(!text)return '';
  const urlRegex=/(\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+)/gi;
  let lastIndex=0, out='';
  text.replace(urlRegex,(match,_g,idx)=>{
    out+=esc(text.slice(lastIndex,idx));
    let url=match;
    if(/^www\./i.test(url))url='https://'+url;
    // отрезаем хвостовые знаки препинания
    let tail='';
    while(/[.,!?;:)\]}'"]$/.test(match)){
      tail=match.slice(-1)+tail;
      match=match.slice(0,-1);
      url=url.slice(0,-1);
    }
    out+='<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" class="msg-link" onclick="event.stopPropagation()">'+esc(match)+'</a>'+esc(tail);
    lastIndex=idx+(match.length+tail.length);
    return match;
  });
  out+=esc(text.slice(lastIndex));
  return out;
}

function storePhoto(d){if(!d)return null;const id='ph_'+(++_pid);photoStore[id]=d;return id;}

async function openPhoto(id){
  const src=await _resolvePhotoSrc(id);
  if(!src){toast('Фото недоступно');return;}
  $('photoImg').src=src;$('photoView').classList.add('show');
}

async function _resolvePhotoSrc(id){
  if(!id)return null;
  if(id.startsWith('idb:')){
    const parts=id.split(':');
    return await _loadMediaFromIdb(parts[1],parts[2]||'photo');
  }
  return photoStore[id]||null;
}

function closePhoto(){$('photoView').classList.remove('show');setTimeout(()=>{$('photoImg').src='';},300);}

async function makeThumb(dataUrl,maxPx=400,q=0.75){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const r=Math.min(maxPx/img.naturalWidth,maxPx/img.naturalHeight,1);
        const c=document.createElement('canvas');
        c.width=Math.round(img.naturalWidth*r);c.height=Math.round(img.naturalHeight*r);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        res(c.toDataURL('image/jpeg',q));
      }catch(e){res(null);}
    };
    img.onerror=()=>res(null);img.src=dataUrl;
  });
}

function sendMsg(){
  const inp=$('msgInp'),txt=inp.value.trim();if(!txt)return;
  // SLON-канал
  if(activeChat===SLON_CHANNEL_ID){
    if(CHANNEL_ADMINS.has(myUsername)){showChannelPublish();inp.value='';}
    else{toast('📢 Это канал — сюда нельзя писать');inp.value='';}
    return;
  }
  // Пользовательский канал
  if(activeChat.startsWith('ch_')){
    const chMeta=myChannels[activeChat]||subscribedChannels[activeChat]||{};
    if(chMeta.owner===myUsername){
      // Владелец — публикуем пост напрямую
      const postId='post_'+Date.now();const ts=Date.now();
      if(window._fbDb&&chMeta.username){
        window._fbSet(window._fbRef(window._fbDb,'user_channels/'+chMeta.username+'/posts/'+postId),
          {id:postId,text:txt,ts,author:myUsername}).catch(()=>{});
      }
      // Firebase onChildAdded сам добавит сообщение — не дублируем вручную
      inp.value='';resizeInp(inp);
    }else{toast('📢 Только владелец может публиковать посты');inp.value='';}
    return;
  }
  // Режим редактирования
  if(inp.dataset.editId){
    const mid=inp.dataset.editId;
    const found=_getMsgFromHist(mid);
    if(found){
      found.m.text=txt;found.m.edited=true;
      const bub=document.querySelector('[data-msg-id="'+mid+'"] .msg-bub');
      if(bub)bub.innerHTML=linkify(txt)+'<span style="font-size:10px;opacity:.5;margin-left:4px">ред.</span>';
      saveAll();
      if(activeChat&&activeChat!=='ai'&&activeChat!=='saved'&&!found.m._e2e)
        sendData(conns[activeChat]||activeChat,{type:'msg_edit',id:mid,text:txt});
      if(typeof _mlEdit==='function')_mlEdit(found.pid,mid,{text:txt,edited:true});
    }
    cancelEdit();
    return;
  }
  inp.value='';resizeInp(inp);
  if(activeChat.startsWith('g_')){sendGrpMsg(activeChat,txt);return;}
  const mid='m'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  const ts=Date.now();
  const msg={id:mid,sender:'me',text:txt,ts,time:fmtTime(ts),status:'sent'};
  if(!chatHist[activeChat])chatHist[activeChat]=[];
  chatHist[activeChat].push(msg);appendMsg(msg);scrollDown();
  updatePreview(activeChat,'Вы: '+txt.slice(0,28));saveAll();
  if(activeChat==='ai'){
    $('typing').classList.add('show');scrollDown();
    const delay=300+Math.random()*300; // короткая задержка + реальное время ответа API
    setTimeout(async()=>{
      const replyText=await aiReply(txt); // ждём реальный ответ от Hugging Face (с фолбэком)
      $('typing').classList.remove('show');
      const rts=Date.now();
      const r={id:'m'+Date.now(),sender:'inc',name:'🐘 СЛОН',text:replyText,ts:rts,time:fmtTime(rts)};
      chatHist.ai.push(r);appendMsg(r);scrollDown();saveAll();
      updatePreview('ai','🐘: '+r.text.slice(0,25));
    },delay);
  }else if(activeChat==='saved'){
    // Избранное — личный блокнот: только на свои устройства
    if(typeof _mlPost==='function')_mlPost('saved',{id:mid,k:'text',text:txt,ts});
  }else{
    const c=conns[activeChat];
    if(_fbMode||c?.open){
      // при шифровании открытый текст не шлём: сообщение идёт зашифрованным в журнале
      if(!(typeof _e2eOn!=='undefined'&&_e2eOn&&typeof _hubUp!=='undefined'&&_hubUp))
        sendData(c||activeChat,{type:'msg',id:mid,text:txt,ts,nick:myNick||('@'+myUsername),avatar:myAvatar||null});
      // Журнал: доставка офлайн-собеседнику и синк на все устройства (sync.js)
      if(typeof _mlPost==='function')_mlPost(activeChat,{id:mid,k:'text',text:txt,ts});
    }
    else toast('Нет интернета — сообщение не отправлено');
  }
}

function recvMsg(pid,text,nick,avatar,mid,ts){
  if(!chatHist[pid])chatHist[pid]=[];
  if(nick&&nick!=='')peerNames[pid]=nick;
  if(avatar!==undefined){peerAvatars[pid]=avatar;updateSbAvatar(pid);}
  const msgId=mid||('m'+Date.now());
  // Дедупликация
  if(mid&&chatHist[pid].some(m=>m.id===mid))return;
  // Время сообщения — оригинальный ts отправителя, иначе текущее
  const msgTs=ts||Date.now();
  const msg={id:msgId,sender:'inc',senderId:pid,name:peerNames[pid]||('@'+pid),avatar:avatar||peerAvatars[pid]||null,text,ts:msgTs,time:fmtTime(msgTs)};
  chatHist[pid].push(msg);
  // Отправляем read receipt если чат открыт
  if(activeChat===pid&&document.visibilityState==='visible'){
    sendData(conns[pid]||pid,{type:'read',ids:[msgId]});
  }
  if(activeChat===pid){
    appendMsg(msg);scrollDown();
    if(document.visibilityState!=='visible'&&_notifOn('private')){
      playNotifSound();
      showDesktopNotif(peerNames[pid]||('@'+pid),_notifText('private',text).slice(0,60),peerAvatars[pid]||null,'msg:'+pid,{kind:'msg',chat:pid});
    }
  }
  else{addUnread(pid);if(!mutedChats[pid]&&_notifOn('private')){playNotifSound();showDesktopNotif(peerNames[pid]||('@'+pid),_notifText('private',text).slice(0,60),peerAvatars[pid]||null,'msg:'+pid,{kind:'msg',chat:pid});}}
  saveAll();
}

function appendMsg(msg,container){
  const c=container||$('msgs');
  // старые служебные «Подключение к @… через Firebase…» больше не показываем
  if(msg.sender==='system'&&/^(Подключение|Соединение установлено|Собеседник отключился)/.test(msg.text||''))return;
  if(msg.sender==='system'){const d=document.createElement('div');d.className='sys';d.textContent=msg.text;c.appendChild(d);return;}
  // Date separator: вставляем разделитель если это сообщение нового дня
  if(msg.ts){
    // Берём ts последнего СООБЩЕНИЯ через data-атрибут на контейнере
    // (не через querySelector который ломается на date-separator div'ах)
    const prevTs=parseInt(c.dataset.lastMsgTs||'0',10)||0;
    const newDate=new Date(msg.ts);
    const prevDate=prevTs?new Date(prevTs):null;
    const isNewDay=!prevDate||
      prevDate.getFullYear()!==newDate.getFullYear()||
      prevDate.getMonth()!==newDate.getMonth()||
      prevDate.getDate()!==newDate.getDate();
    if(isNewDay){
      const sep=document.createElement('div');
      sep.className='date-separator';
      sep.innerHTML='<span>'+esc(fmtDateSeparator(msg.ts))+'</span>';
      c.appendChild(sep);
    }
    // Обновляем ts последнего сообщения на контейнере
    c.dataset.lastMsgTs=String(msg.ts);
  }
  const isOut=msg.sender==='me';
  const wrap=document.createElement('div');wrap.className='msg '+(isOut?'out':'inc');
  const av=document.createElement('div');av.className='msg-av';
  if(isOut){
    if(myAvatar){const i=document.createElement('img');i.src=myAvatar;av.appendChild(i);}
    else av.textContent='😎';
  }else{
    const src=msg.avatar||peerAvatars[msg.senderId]||null;
    if(src){const i=document.createElement('img');i.src=src;av.appendChild(i);}
    else av.innerHTML=_avHtml(msg.senderId||msg.name,msg.name||'?');
  }
  const body=document.createElement('div');body.className='msg-body';
  if(!isOut&&msg.name){
    const w=document.createElement('div');w.className='msg-who';
    const hasPrem=msg.senderId&&peerPremium[msg.senderId];
    // ⭐ значок Premium + верифицированный SLON канал
    const badge=hasPrem?' <span style="font-size:10px;vertical-align:middle;opacity:.9" title="SLON Premium">⭐</span>':'';
    const elephantBadge=(msg.senderId&&peerElephantBadges[msg.senderId])?' <span style="font-size:10px;vertical-align:middle;opacity:.85" title="Слонгалочка">🐘</span>':'';
    w.innerHTML=esc(msg.name)+elephantBadge+badge;
    body.appendChild(w);
  }
  if(msg.type==='call'){
    const out=!!msg.callOutgoing, oc=msg.callOutcome, vid=!!msg.isVideo;
    const kind=vid?'видеозвонок':'звонок', Kind=vid?'Видеозвонок':'Звонок';
    const label = oc==='answered' ? (out?'Исходящий ':'Входящий ')+kind
      : oc==='missed' ? 'Пропущенный '+kind
      : oc==='declined' ? Kind+' отклонён'
      : oc==='cancelled' ? Kind+' отменён'
      : Kind;
    const bad = (oc==='missed'||oc==='declined'||oc==='cancelled');
    const dur = (oc==='answered'&&msg.callSecs) ? _fmtCallDur(msg.callSecs) : '';
    const icoPath = vid
      ? 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z'
      : 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';
    const arrow = out
      ? '<svg viewBox="0 0 24 24"><path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M19 17.59L17.59 19 6 7.41V14H4V4h10v2H7.41z"/></svg>';
    const bub=document.createElement('div');
    bub.className='msg-bub call-bub'+(bad?' call-bad':'');
    bub.innerHTML=`<span class="call-ico"><svg viewBox="0 0 24 24"><path d="${icoPath}"/></svg></span>
      <span class="call-info"><span class="call-title">${esc(label)}</span>
      <span class="call-sub"><span class="call-arrow">${arrow}</span>${esc(msg.time||fmtTime(msg.ts||Date.now()))}${dur?' · '+esc(dur):''}</span></span>`;
    body.appendChild(bub);
  }else if(msg.photoId){
    const bub=document.createElement('div');bub.className='photo-bub';
    const pid2=msg.photoId;bub.onclick=()=>openPhoto(pid2);
    const img=document.createElement('img');img.loading='lazy';
    // Показываем маленький thumb сразу (если есть), полноразмерное фото подгружаем асинхронно (может лежать в IndexedDB после перезагрузки)
    if(msg.photoThumb)img.src=msg.photoThumb;
    _resolvePhotoSrc(pid2).then(src=>{if(src)img.src=src;});
    bub.appendChild(img);
    // Прогресс отправки
    const prog=document.createElement('div');prog.className='upload-progress';
    if(msg.uploadProgress!=null&&msg.uploadProgress<100){_renderProgressRing(prog,msg.uploadProgress);}
    else{prog.style.display='none';}
    bub.appendChild(prog);
    body.appendChild(bub);
  }else if(msg.fileInfo){
    const bub=document.createElement('div');bub.className='file-bub';
    const fid=msg.fileDataId;bub.onclick=()=>{if(fid)dlFile(fid,msg.fileInfo.name);};
    bub.innerHTML=`<div class="file-ico">${icoSvg('i-attach')}</div><div style="flex:1;min-width:0"><div class="file-name">${esc(msg.fileInfo.name)}</div><div class="file-sz">${msg.fileInfo.size||''}</div></div>`;
    // Прогресс отправки
    const prog=document.createElement('div');prog.className='upload-progress';
    if(msg.uploadProgress!=null&&msg.uploadProgress<100){_renderProgressRing(prog,msg.uploadProgress);}
    else{prog.style.display='none';}
    bub.appendChild(prog);
    body.appendChild(bub);
  }else{
    const bub=document.createElement('div');bub.className='msg-bub';
    // Линки: кликабельные, текст эскейпим внутри linkify
    bub.innerHTML=linkify(msg.text||'');
    if(msg.edited){
      const ed=document.createElement('span');ed.style.cssText='font-size:10px;opacity:.5;margin-left:4px';ed.textContent='ред.';
      bub.appendChild(ed);
    }
    body.appendChild(bub);
  }
  const t=document.createElement('div');t.className='msg-time';
  let statusIcon='';
  if(isOut){
    if(msg.status==='read') statusIcon=' <span class="ticks read">✓✓</span>';
    else if(msg.status==='delivered') statusIcon=' <span class="ticks">✓✓</span>';
    else statusIcon=' <span class="ticks sent">✓</span>';
  }
  t.innerHTML=esc(msg.time||fmtTime(msg.ts||Date.now()))+statusIcon;
  // Кнопка меню сообщения
  const menuBtn=document.createElement('button');
  menuBtn.className='msg-menu-btn';menuBtn.innerHTML='&#8942;';
  menuBtn.title='Действия';
  menuBtn.onclick=e=>{e.stopPropagation();showMsgMenu(e,msg,isOut);};
  body.appendChild(t);
  if(msg.pinned){const pin=document.createElement('div');pin.className='msg-pin-badge';pin.innerHTML='<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>';body.insertBefore(pin,body.firstChild);}
  wrap.dataset.msgId=msg.id;
  wrap.appendChild(av);wrap.appendChild(body);wrap.appendChild(menuBtn);c.appendChild(wrap);
}

function sysMsg(id,text){
  const h=id.startsWith('g_')?grpHist:chatHist;
  if(!h[id])h[id]=[];
  h[id].push({sender:'system',text});
  if(activeChat===id){
    const d=document.createElement('div');d.className='sys';d.textContent=text;
    $('msgs').appendChild(d);scrollDown();
  }
}

function showMsgMenu(e,msg,isOut){
  closeMsgMenu();
  const div=document.createElement('div');
  div.className='msg-menu-popup';
  const items=[];
  // Скачать — для фото и файлов
  if(msg.photoId){
    items.push(['⬇️ Скачать фото',()=>_downloadPhoto(msg)]);
  } else if(msg.fileInfo&&msg.fileDataId){
    items.push(['⬇️ Скачать файл',()=>dlFile(msg.fileDataId,msg.fileInfo.name)]);
  } else if(msg.voiceData){
    items.push(['⬇️ Скачать аудио',()=>_downloadVoice(msg)]);
  } else if(msg.slonData){
    items.push(['⬇️ Скачать слонкружок',()=>_downloadSlon(msg)]);
  }
  if(msg.text){
    items.push(['📋 Копировать',()=>{navigator.clipboard.writeText(msg.text);toast('Скопировано');}]);
  }
  // Сохранить в Избранное — для всех сообщений кроме тех, что уже там
  if(activeChat!=='saved'){
    items.push(['⭐ Сохранить',()=>_saveMsgToSaved(msg)]);
  }
  // Для SLON-канала: admins могут удалять и редактировать посты
  if(activeChat===SLON_CHANNEL_ID&&CHANNEL_ADMINS.has(myUsername)){
    if(msg.text)items.push(['✏️ Редактировать пост',()=>adminEditChannelPost(msg)]);
    items.push(['🗑 Удалить пост у всех',()=>adminDeleteChannelPost(msg),'danger']);
    items.push(['🗑 Удалить у себя',()=>deleteMsg(msg,false)]);
  } else {
    if(isOut&&msg.text)items.push(['✏️ Редактировать',()=>startEditMsg(msg)]);
    items.push(['📌 '+(msg.pinned?'Открепить':'Закрепить'),()=>togglePinMsg(msg)]);
    items.push(['🗑 Удалить у себя',()=>deleteMsg(msg,false)]);
    if(isOut){
      items.push(['🗑 Удалить у всех',()=>deleteMsg(msg,true),'danger']);
    }
  }
  items.forEach(([label,fn,cls])=>{
    const btn=document.createElement('button');
    btn.innerHTML=_menuLabelHtml(label);if(cls)btn.className=cls; // значок вместо эмодзи
    btn.onclick=()=>{fn();closeMsgMenu();};
    div.appendChild(btn);
  });
  document.body.appendChild(div);
  _msgMenuEl=div;
  const r=e.target.getBoundingClientRect();
  let top=r.bottom+4,left=r.left-160;
  if(left<8)left=8;
  if(top+div.offsetHeight>window.innerHeight)top=r.top-div.offsetHeight-4;
  div.style.cssText='top:'+top+'px;left:'+left+'px;';
  setTimeout(()=>document.addEventListener('click',closeMsgMenu,{once:true}),10);
}

async function _downloadPhoto(msg){
  const src=await _resolvePhotoSrc(msg.photoId);
  if(!src){toast('Фото недоступно');return;}
  const a=document.createElement('a');
  a.href=src;
  a.download=msg.fileName||('photo_'+msg.id+'.jpg');
  document.body.appendChild(a);a.click();a.remove();
}

function _downloadVoice(msg){
  if(!msg.voiceData){toast('Аудио недоступно');return;}
  const a=document.createElement('a');
  a.href=msg.voiceData;
  a.download='voice_'+msg.id+'.webm';
  document.body.appendChild(a);a.click();a.remove();
}

function _downloadSlon(msg){
  if(!msg.slonData){toast('Слонкружок недоступен');return;}
  const a=document.createElement('a');
  a.href=msg.slonData;
  a.download='slon_'+msg.id+'.webm';
  document.body.appendChild(a);a.click();a.remove();
}

function closeMsgMenu(){if(_msgMenuEl){_msgMenuEl.remove();_msgMenuEl=null;}}

function _getMsgFromHist(mid){
  for(const hist of [chatHist,grpHist]){
    for(const pid of Object.keys(hist||{})){
      const m=hist[pid].find(x=>x.id===mid);
      if(m)return{m,pid,hist};
    }
  }
  return null;
}

function _updateMsgStatus(mid,status){
  const el=document.querySelector('[data-msg-id="'+mid+'"] .ticks');
  if(el){
    if(status==='read'){el.textContent='✓✓';el.className='ticks read';}
    else if(status==='delivered'){el.textContent='✓✓';el.className='ticks';}
    else{el.textContent='✓';el.className='ticks sent';}
  }
}

function deleteMsg(msg,forAll){
  const mid=msg.id;
  // Удаляем из локальной истории
  const found=_getMsgFromHist(mid);
  if(found&&found.hist===chatHist&&typeof _mlDelete==='function')_mlDelete(found.pid,found.m,forAll);
  if(found){
    found.hist[found.pid]=found.hist[found.pid].filter(m=>m.id!==mid);
    // Удаляем из DOM
    const el=document.querySelector('[data-msg-id="'+mid+'"]');
    if(el)el.remove();
    saveAll();
  }
  if(forAll&&activeChat&&activeChat!=='ai'&&activeChat!=='saved'){
    sendData(conns[activeChat]||activeChat,{type:'msg_delete',id:mid,forAll:true});
  }
  toast(forAll?'Удалено у всех':'Удалено у себя');
}

function _handleMsgDelete(pid,data){
  if(!data.forAll)return;
  const mid=data.id;
  // Удаляем из истории полностью (любые сообщения — и своё и собеседника)
  if(chatHist[pid]){
    chatHist[pid]=chatHist[pid].filter(m=>m.id!==mid);
  }
  // Удаляем из DOM
  const el=document.querySelector('[data-msg-id="'+mid+'"]');
  if(el)el.remove();
  saveAll();
}

function startEditMsg(msg){
  const inp=$('msgInp');
  inp.value=msg.text||'';inp.focus();
  inp.dataset.editId=msg.id;
  const hint=document.createElement('div');
  hint.id='editHint';hint.style.cssText='padding:4px 12px;font-size:12px;color:var(--text2);background:var(--bg2);border-top:1px solid var(--border);';
  hint.innerHTML='✏️ Редактирование · <button onclick="cancelEdit()" style="background:none;border:none;color:var(--accent);cursor:pointer;">Отмена</button>';
  const bar=$('editHint');if(bar)bar.remove();
  inp.parentNode.insertBefore(hint,inp);
}

function cancelEdit(){
  const inp=$('msgInp');
  delete inp.dataset.editId;
  const hint=$('editHint');if(hint)hint.remove();
  inp.value='';
}

function _handleMsgEdit(pid,data){
  if(!data.id||!data.text)return;
  const hist=chatHist[pid];if(!hist)return;
  const m=hist.find(x=>x.id===data.id);
  if(m){
    m.text=data.text;m.edited=true;
    const bub=document.querySelector('[data-msg-id="'+data.id+'"] .msg-bub');
    if(bub)bub.innerHTML=esc(data.text)+'<span style="font-size:10px;opacity:.5;margin-left:4px">ред.</span>';
    saveAll();
  }
}

function togglePinMsg(msg){
  msg.pinned=!msg.pinned;
  // Обновляем DOM
  const wrap=document.querySelector('[data-msg-id="'+msg.id+'"]');
  if(wrap){
    const old=wrap.querySelector('.msg-pin-badge');if(old)old.remove();
    if(msg.pinned){const pin=document.createElement('div');pin.className='msg-pin-badge';pin.innerHTML='<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>';wrap.querySelector('.msg-body').insertBefore(pin,wrap.querySelector('.msg-body').firstChild);}
  }
  _updatePinnedBar();
  saveAll();
  // Сообщаем собеседнику
  if(activeChat&&activeChat!=='ai'&&activeChat!=='saved'){
    sendData(conns[activeChat]||activeChat,{type:'msg_pin',id:msg.id,pinned:msg.pinned,text:msg.text?.slice(0,60)||''});
  }
}

function _handleMsgPin(pid,data){
  const hist=chatHist[pid];if(!hist)return;
  const m=hist.find(x=>x.id===data.id);
  if(m){
    m.pinned=data.pinned;
    const wrap=document.querySelector('[data-msg-id="'+data.id+'"]');
    if(wrap){
      const old=wrap.querySelector('.msg-pin-badge');if(old)old.remove();
      if(data.pinned){const pin=document.createElement('div');pin.className='msg-pin-badge';pin.innerHTML='<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>';wrap.querySelector('.msg-body').insertBefore(pin,wrap.querySelector('.msg-body').firstChild);}
    }
    _updatePinnedBar();saveAll();
  }
}

function _updatePinnedBar(){
  if(!activeChat)return;
  const hist=chatHist[activeChat]||grpHist[activeChat]||[];
  const pinned=hist.filter(m=>m.pinned);
  const bar=$('pinnedBar');const txt=$('pinnedText');
  if(!bar||!txt)return;
  if(pinned.length>0){
    bar.classList.add('show');
    txt.textContent=(pinned[pinned.length-1].text||'Медиа').slice(0,50);
    const lbl=$('pinnedLbl');if(lbl)lbl.textContent='Закреплённое сообщение'+(pinned.length>1?' #'+pinned.length:'');
  }else{
    bar.classList.remove('show');
  }
}

function scrollToPinned(){
  if(!activeChat)return;
  const hist=chatHist[activeChat]||grpHist[activeChat]||[];
  const pinned=hist.filter(m=>m.pinned);
  if(!pinned.length)return;
  const last=pinned[pinned.length-1];
  const el=document.querySelector('[data-msg-id="'+last.id+'"]');
  if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
}

function deleteChatFor(forAll){
  if(!activeChat||activeChat==='ai')return;
  if(forAll){
    // Чистим у обоих
    chatHist[activeChat]=[];
    renderChat(activeChat);
    sendData(conns[activeChat]||activeChat,{type:'chat_delete',forAll:true});
    toast('Чат удалён у всех');
  }else{
    // Только у себя — удаляем чат насовсем
    if(typeof _deleteChatFull==='function'){_deleteChatFull(activeChat);return;}
    delete chatHist[activeChat];
    delete peerNames[activeChat];
    delete peerAvatars[activeChat];
    const si=$('si-'+activeChat);if(si)si.remove();
    $('chatPanel').classList.remove('open');
    activeChat=null;
    saveAll();
    toast('Чат удалён');
  }
}

function _handleChatDelete(pid,data){
  if(!data.forAll)return;
  chatHist[pid]=[];
  if(activeChat===pid)renderChat(pid);
  saveAll();
  toast((peerNames[pid]||('@'+pid))+' удалил историю чата');
}

function renderChat(id){
  const c=$('msgs');c.innerHTML='<div class="sys">Начало чата</div>';
  c.dataset.lastMsgTs='0'; // сброс для date-separator
  const hist=id.startsWith('g_')?grpHist[id]:chatHist[id];
  if(hist?.length)hist.forEach(m=>appendMsg(m,c));
  scrollDown();
  _updatePinnedBar();
  // Send read receipts for unread incoming messages
  if(id!=='ai'&&id!=='saved'&&!id.startsWith('g_')){
    const unreadIds=(chatHist[id]||[]).filter(m=>m.sender==='inc'&&!m.readSent).map(m=>m.id);
    if(unreadIds.length){
      sendData(conns[id]||id,{type:'read',ids:unreadIds});
      (chatHist[id]||[]).forEach(m=>{if(m.sender==='inc')m.readSent=true;});
    }
  }
}

function clearChat(){
  if(activeChat.startsWith('g_'))grpHist[activeChat]=[];else chatHist[activeChat]=[];
  renderChat(activeChat);saveAll();toast('Чат очищен');
}

function showChatDeleteMenu(){
  if(!activeChat||activeChat==='ai')return;
  if(confirm('Удалить чат у всех участников?')){
    deleteChatFor(true);
  }else if(confirm('Удалить только у себя?')){
    deleteChatFor(false);
  }
}

function showRemoteTyping(pid){
  if(activeChat!==pid)return;
  $('typing').classList.add('show');scrollDown();
  clearTimeout(typingTimers[pid]);
  typingTimers[pid]=setTimeout(()=>$('typing').classList.remove('show'),2800);
}

// Поле ввода: есть текст → круглая кнопка «отправить», пусто → «микрофон»
function _syncInpState(){
  const inp=$('msgInp');$('inpWrap')?.classList.toggle('has-text',!!inp?.value.trim());
}

function onTyping(el){
  resizeInp(el);
  _syncInpState();
  if(activeChat!=='ai'&&activeChat!=='saved'&&!activeChat.startsWith('g_')&&(_fbMode||conns[activeChat]?.open))
    sendData(conns[activeChat]||activeChat,{type:'typing'});
}

function handleFile(inp){
  const file=inp.files[0];if(!file)return;
  if(file.size>500*1024*1024){toast('Файл > 500 МБ');inp.value='';return;}
  inp.value='';const isImg=file.type.startsWith('image/');
  const reader=new FileReader();
  reader.onload=async e=>{
    const data=e.target.result,fid='f'+Date.now();
    const ts=Date.now();
    if(isImg){
      const photoId=storePhoto(data),thumb=await makeThumb(data);
      const msg={id:fid,sender:'me',ts,time:fmtTime(ts),photoId,photoThumb:thumb||data,fileName:file.name,uploadProgress:0};
      pushMsg(msg);sendFileTo(fid,file.name,file.type,true,data,ts);
    }else{
      const fdid='fd_'+fid;fileStore[fdid]=data;
      const msg={id:fid,sender:'me',ts,time:fmtTime(ts),fileInfo:{name:file.name,size:fmtSz(file.size)},fileDataId:fdid,uploadProgress:0};
      pushMsg(msg);sendFileTo(fid,file.name,file.type,false,data,ts);
    }
  };
  reader.readAsDataURL(file);
}

function pushMsg(msg){
  const h=activeChat.startsWith('g_')?grpHist:chatHist;
  if(!h[activeChat])h[activeChat]=[];
  h[activeChat].push(msg);appendMsg(msg);scrollDown();
  updatePreview(activeChat,'Вы: 📎 '+(msg.fileName||'Файл').slice(0,20));saveAll();
}

async function sendFileTo(fid,name,mime,isImg,data,ts){
  // В Firebase-режиме используем большие chunks (~100KB) чтобы меньше RTDB вызовов,
  // но ниже лимита 256KB на один RTDB child
  const chunkSize=_fbMode?100000:CHUNK;
  const chunks=[];
  for(let i=0;i<data.length;i+=chunkSize)chunks.push(data.slice(i,i+chunkSize));
  const total=chunks.length;

  const doSend=async (conn,pid)=>{
    sendData(conn,{type:'file_start',id:fid,name,mime,chunks:total,isImg,ts});
    for(let i=0;i<total;i++){
      sendData(conn,{type:'file_chunk',id:fid,i,d:chunks[i]});
      // Обновляем прогресс на каждые 5%, чтобы не перерисовывать слишком часто
      const pct=Math.round(((i+1)/total)*100);
      _setMsgUploadProgress(fid,pct);
      // В Firebase-режиме делаем yield в event loop чтобы не блокировать UI
      if(_fbMode&&i%3===0)await new Promise(r=>setTimeout(r,0));
    }
    sendData(conn,{type:'file_end',id:fid});
    _setMsgUploadProgress(fid,100);
    setTimeout(()=>_setMsgUploadProgress(fid,null),500); // убрать индикатор
  };

  if(activeChat.startsWith('g_')){
    const gid=activeChat;
    const g=groups[gid]||{};
    const promises=[];
    g.members?.forEach(pid=>{
      if(pid!==myUsername&&(_fbMode||conns[pid]?.open))promises.push(doSend(conns[pid]||pid,pid));
    });
    await Promise.all(promises);
    // Публикуем в grp_msgs чтобы участники онлайн позже тоже видели
    if(window._fbDb&&_fbMode){
      window._fbSet(window._fbRef(window._fbDb,'grp_msgs/'+gid+'/'+fid),{
        id:fid,type:'file',gid,sid:myUsername,nick:myNick||('@'+myUsername),
        avatar:myAvatar||null,fileName:name,fileMime:mime,fileIsImg:isImg,ts:ts||Date.now()
      }).catch(()=>{});
    }
  }else if(activeChat!=='ai'&&(activeChat==='saved'||_fbMode||conns[activeChat]?.open)){
    const chat=activeChat;
    // Через журнал: дойдёт, даже если собеседник офлайн, и появится на всех устройствах
    if(typeof _mlSendMedia==='function'&&_mlOn()){
      const m=(chatHist[chat]||[]).find(x=>x.id===fid);
      const ok=await _mlSendMedia(chat,fid,isImg?'photo':'file',data,{name,mime,ts,size:m?.fileInfo?.size||''},
        pct=>_setMsgUploadProgress(fid,Math.min(99,pct)));
      _setMsgUploadProgress(fid,100);setTimeout(()=>_setMsgUploadProgress(fid,null),500);
      if(ok)return;
    }
    if(chat!=='saved')await doSend(conns[chat]||chat,chat);
  }
}

function _setMsgUploadProgress(fid,pct){
  // Найти сообщение в любом активном чате
  for(const hist of Object.values(chatHist)){
    if(!hist)continue;
    const m=hist.find(x=>x.id===fid);
    if(m){m.uploadProgress=pct; break;}
  }
  const el=document.querySelector('[data-msg-id="'+fid+'"] .upload-progress');
  if(el){
    if(pct==null||pct>=100){el.style.display='none';}
    else{el.style.display='';el.dataset.pct=pct;_renderProgressRing(el,pct);}
  }
}

function _renderProgressRing(el,pct){
  const r=14, c=2*Math.PI*r;
  const dash=(pct/100)*c;
  el.innerHTML=
    '<svg width="36" height="36" viewBox="0 0 36 36" style="transform:rotate(-90deg)">'+
      '<circle cx="18" cy="18" r="'+r+'" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>'+
      '<circle cx="18" cy="18" r="'+r+'" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" '+
        'stroke-dasharray="'+dash+' '+c+'" style="transition:stroke-dasharray .15s"/>'+
    '</svg>'+
    '<div class="upload-pct">'+pct+'%</div>';
}

function _showIncomingFileProgress(pid,fid,name,totalChunks){
  // Прогресс показываем в превью чата (опционально); просто toast при больших файлах
  if(totalChunks>5){
  }
}

function _updateIncomingFileProgress(fid,recv,total){
  // Можно дополнительно показывать; для минимализма пока пропускаем
}

function _hideIncomingFileProgress(fid){
  delete _incFileProgress[fid];
}

async function finishFile(fid,pid){
  const f=inFiles[fid];if(!f)return;
  for(let i=0;i<f.total;i++)if(f.parts[i]==null){toast('Файл неполный');delete inFiles[fid];return;}
  const fullData=f.parts.join('');
  const isImg=f.mime?.startsWith('image/')||f.isImg;
  delete inFiles[fid];
  const msgTs=f.ts||Date.now();
  let msg;
  if(isImg){
    const photoId=storePhoto(fullData),thumb=await makeThumb(fullData);
    msg={id:fid,sender:'inc',name:peerNames[pid]||('@'+pid),avatar:peerAvatars[pid]||null,ts:msgTs,time:fmtTime(msgTs),photoId,photoThumb:thumb||fullData,fileName:f.name};
  }else{
    const fdid='fd_'+fid;
    try{
      const b64=fullData.includes(',')?fullData.split(',')[1]:fullData;
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      fileStore[fdid]=URL.createObjectURL(new Blob([arr],{type:f.mime||'application/octet-stream'}));
    }catch(e){fileStore[fdid]=null;}
    msg={id:fid,sender:'inc',name:peerNames[pid]||('@'+pid),avatar:peerAvatars[pid]||null,ts:msgTs,time:fmtTime(msgTs),fileInfo:{name:f.name,size:''},fileDataId:fdid};
  }
  if(!chatHist[pid])chatHist[pid]=[];
  chatHist[pid].push(msg);
  if(activeChat===pid){appendMsg(msg);scrollDown();}
  else addUnread(pid);
  saveAll();
}

async function dlFile(fdid,name){
  const src=await _resolveFileSrc(fdid);
  if(!src){toast('Файл недоступен');return;}
  const a=document.createElement('a');a.href=src;a.download=name;a.click();
}

async function _resolveFileSrc(fdid){
  if(!fdid)return null;
  if(fdid.startsWith('idb:')){
    const parts=fdid.split(':');
    return await _loadMediaFromIdb(parts[1],parts[2]||'file');
  }
  return fileStore[fdid]||null;
}

function scrollDown(){
  const m=$('msgs');if(m)requestAnimationFrame(()=>{m.scrollTop=m.scrollHeight;});
}

function resizeInp(el){
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,100)+'px';
  if(el.id==='msgInp')_syncInpState();
}

function handleKey(e){
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}
}

function showChatCtxMenu(e,id){
  e.preventDefault();e.stopPropagation();
  ctxTargetId=id;
  const menu=$('chatCtxMenu');
  const isArch=!!archivedChats[id];
  const isPinned=!!pinnedChats[id];
  const isMuted=!!mutedChats[id];
  const isChannel=id===SLON_CHANNEL_ID;
  const isSpecial=id==='ai'||id==='saved'; // нет пина/мьюта/архива для этих

  const item=(svgPath,label,fn,danger)=>`<div class="ctx-item${danger?' danger':''}" onclick="${fn}">
      <svg viewBox="0 0 24 24"><path d="${svgPath}"/></svg><span>${label}</span></div>`;

  let html='';
  if(!isSpecial){
    html+=item('M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z',
      'Просмотр','_ctxPreview()');
    html+=item('M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
      'Отметить как непрочитанное','_ctxMarkUnread()');
    html+='<div class="ctx-item" onclick="event.stopPropagation();_ctxAddToFolder()"><svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg><span style="flex:1">Добавить в папку</span><svg style="width:13px;height:13px;fill:var(--text2)"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none"/></svg></div>';
    html+='<div class="ctx-sep"></div>';
    html+=item(isPinned?'M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z':'M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z',
      isPinned?'Открепить':'Закрепить чат','ctxPinToggle()');
    html+=item(isMuted?'M18 16.08c.67-.06 1.27-.35 1.73-.81L21 14c.49-.49.49-1.28 0-1.77l-4.24-4.24-4.24-4.24L4.27 1.49 3 2.77l4.5 4.5C6.61 8.24 6 9.56 6 11v4c0 1.1-.9 2-2 2v1h9.05l2.86 2.86 1.27-1.27L18 16.08zM7.58 9.35L17 18.76V19H5v-8c0-1.17.45-2.23 1.17-3.02l1.41 1.37zM11 21c1.1 0 2-.9 2-2H9c0 1.1.9 2 2 2zm1.5-14h-1V5.73L15 9.23V11h-2.5z':'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
      isMuted?'Включить уведомления':'Выключить уведомления','ctxMuteToggle()');
    if(!isChannel){
      html+=item('M20 4H4v2h16V4zm1 4H3v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8zm-9 9l-5-5h3V9h4v3h3l-5 5z',
        isArch?'Из архива':'В архив','ctxArchiveToggle()');
    }
    html+='<div class="ctx-sep"></div>';
    html+=item('M6 13h12v-2H6v2zm-4 6h20v-2H2v2zM2 5v2h20V5H2z','Очистить историю','ctxClearHistory()');
  }
  html+=item('M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    'Удалить чат','ctxDeleteChat()',true);

  // Строим с stagger-анимацией
  menu.innerHTML=html;
  [...menu.children].forEach((el,i)=>{el.style.animationDelay=(i*0.02)+'s';});

  menu.style.left=Math.min(e.clientX,window.innerWidth-206)+'px';
  menu.style.top=Math.min(e.clientY,window.innerHeight-menu.children.length*42-10)+'px';
  menu.classList.add('show');
}

function _ctxPreview(){
  $('chatCtxMenu').classList.remove('show');
  if(!ctxTargetId)return;
  toast('Предпросмотр скоро появится 👁');
}

function _ctxMarkUnread(){
  $('chatCtxMenu').classList.remove('show');
  if(!ctxTargetId)return;
  addUnread(ctxTargetId);
  toast('Отмечено как непрочитанное');
}

function _ctxAddToFolder(){
  if(!ctxTargetId)return;
  _ctxFolderMenu(ctxTargetId); // подменю с папками — settings-extra.js
}

function ctxClearHistory(){
  $('chatCtxMenu').classList.remove('show');
  if(!ctxTargetId)return;
  const id=ctxTargetId;
  showModal(`
    <div class="m-title">Очистить историю?</div>
    <div class="m-info">Все сообщения в чате с <b>${esc(peerNames[id]||('@'+id))}</b> будут удалены. Сам чат и контакт останутся.</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-danger" onclick="_doClearHistory('${id}')">Очистить</button>
    </div>
  `);
}

function _doClearHistory(id){
  closeModal();
  if(id.startsWith('g_'))grpHist[id]=[];else chatHist[id]=[];
  if(activeChat===id)renderChat(id);
  updatePreview(id,'');
  saveAll();
  toast('История очищена');
}

function ctxPinToggle(){
  $('chatCtxMenu').classList.remove('show');
  if(!ctxTargetId)return;
  const id=ctxTargetId;
  if(pinnedChats[id]){
    delete pinnedChats[id];
    toast('Чат откреплён');
  }else{
    pinnedChats[id]=true;
    toast('Чат закреплён 📌');
  }
  saveAll();
  rebuildSidebar(); // Перестраиваем сайдбар чтобы закреплённые были сверху
}

function ctxMuteToggle(){
  $('chatCtxMenu').classList.remove('show');
  if(!ctxTargetId)return;
  const id=ctxTargetId;
  if(mutedChats[id]){
    delete mutedChats[id];
  }else{
    mutedChats[id]=true;
  }
  saveAll();
  // Обновляем иконку в сайдбаре
  _updateSbMuteIcon(id);
}

function _updateSbMuteIcon(id){
  const el=$('si-'+id);if(!el)return;
  let muteEl=el.querySelector('.sb-mute');
  if(mutedChats[id]){
    if(!muteEl){
      muteEl=document.createElement('span');
      muteEl.className='sb-mute';
      muteEl.textContent='🔕';
      muteEl.style.cssText='font-size:10px;position:absolute;top:4px;right:4px;opacity:.6';
      el.style.position='relative';
      el.appendChild(muteEl);
    }
  }else{
    muteEl?.remove();
  }
}

function ctxArchiveToggle(){
  $('chatCtxMenu').classList.remove('show');
  if(!ctxTargetId)return;
  if(archivedChats[ctxTargetId]){
    delete archivedChats[ctxTargetId];
    // Move from archive back to main list
    const el=$('si-'+ctxTargetId);
    if(el){el.classList.remove('archived');$('sbList').appendChild(el);}
    toast('Чат возвращён из архива');
  }else{
    archivedChats[ctxTargetId]=true;
    // Move to archive list
    const el=$('si-'+ctxTargetId);
    if(el){el.classList.add('archived');$('archiveList').appendChild(el);}
    updateArchiveHeader();
    toast('Чат перемещён в архив 📦');
    if(activeChat===ctxTargetId)openChat('ai');
  }
  saveAll();
  updateArchiveHeader();
}

function ctxDeleteChat(){
  $('chatCtxMenu').classList.remove('show');
  if(!ctxTargetId)return;
  const id=ctxTargetId;
  showModal(`
    <div class="m-title">Удалить чат?</div>
    <div class="m-info">История переписки с <b>${esc(peerNames[id]||('@'+id))}</b> исчезнет из списка чатов. Если человек напишет снова — чат появится.</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-danger" onclick="doDeleteChat('${id}')">Удалить</button>
    </div>
  `);
}

function doDeleteChat(id){
  closeModal();
  if(typeof _deleteChatFull==='function'){_deleteChatFull(id);return;} // полное удаление (settings-extra.js)
  if(id.startsWith('g_')){delete grpHist[id];}
  else{chatHist[id]=[];}
  delete archivedChats[id];
  const el=$('si-'+id);if(el)el.remove();
  if(activeChat===id)openChat('ai');
  updatePreview('ai','');
  saveAll();
  toast('Чат удалён');
}

function updateArchiveHeader(){
  const hdr=$('archiveHdr');
  const hasArchived=$('archiveList').children.length>0;
  hdr.style.display=hasArchived?'flex':'none';
  if(typeof _arcUpdate==='function')_arcUpdate(); // новый архив (settings-extra.js)
}

function toggleArchiveSection(){
  const list=$('archiveList');
  const arrow=$('archiveArrow');
  list.classList.toggle('open');
  arrow.textContent=list.classList.contains('open')?'▾':'▸';
}
