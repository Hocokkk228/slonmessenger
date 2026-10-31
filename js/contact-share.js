// Отправка контакта через обычный журнал сообщений и быстрый ответ жестом.
(function(){
  const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 7c0-3.3 3.1-5 7-5s7 1.7 7 5v1H5z"/></svg>';
  const sendIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3 22 12 3 21l2-7 10-2-10-2z"/></svg>';
  let selected=new Set(),contact='',closeTimer=0;
  const oldRender=_ppRender;
  _ppRender=function(pid){
    const result=oldRender.apply(this,arguments),more=$('peerProfMoreBtn'),original=more&&more.onclick;
    if(original)more.onclick=function(e){
      original.call(this,e);
      const menu=$('ppMenu');
      if(!menu||!menu.classList.contains('show')||menu.querySelector('.contact-share-menu'))return;
      const b=document.createElement('button');b.className='sp-menu-item contact-share-menu';
      b.innerHTML=icon+'<span>Поделиться контактом</span>';
      b.onclick=()=>{_spCloseMenu();openShare(pid);};menu.prepend(b);
    };
    return result;
  };
  function openShare(pid){
    clearTimeout(closeTimer);closeTimer=0;
    $('sidebar')?.classList.remove('contact-share-closing');
    contact=pid;selected=new Set();closePeerProfile();
    if(innerWidth<=640&&!$('sidebar').classList.contains('open'))toggleSidebar();
    let panel=$('contactSharePanel');
    if(!panel){panel=document.createElement('section');panel.id='contactSharePanel';panel.className='contact-share';$('sidebar').appendChild(panel);}
    panel.classList.remove('closing');
    panel.innerHTML='<header><button class="contact-share-back" aria-label="Назад">‹</button><b>Поделиться контактом</b></header><input class="contact-share-search" placeholder="Поиск по чатам" aria-label="Поиск по чатам"><div class="contact-share-list"></div><button class="contact-share-send" aria-label="Отправить" disabled>'+sendIcon+'</button>';
    panel.querySelector('.contact-share-back').onclick=closeShare;
    panel.querySelector('.contact-share-search').oninput=paint;
    panel.querySelector('.contact-share-send').onclick=send;
    $('sidebar').classList.add('contact-share-open');
    panel.classList.add('show');paint();
  }
  function closeShare(){
    const panel=$('contactSharePanel');if(!panel||closeTimer)return;
    panel.classList.add('closing');
    $('sidebar')?.classList.add('contact-share-closing');
    closeTimer=setTimeout(()=>{panel.remove();$('sidebar')?.classList.remove('contact-share-open','contact-share-closing');closeTimer=0;},220);
  }
  function paint(){
    const panel=$('contactSharePanel');if(!panel)return;
    const q=panel.querySelector('input').value.trim().toLowerCase();
    const list=panel.querySelector('.contact-share-list');list.replaceChildren();
    const ids=Array.from(document.querySelectorAll('#sbList .sb-item')).map(el=>el.id.slice(3)).filter(id=>id&&id!=='ai'&&!_isChannelId(id));
    ids.forEach(id=>{
      const group=id.startsWith('g_'),name=id==='saved'?'Избранное':group?(groups[id]?.name||'Группа'):(peerNames[id]||'@'+id);
      if(!(name+' '+id).toLowerCase().includes(q))return;
      const b=document.createElement('button');b.className='contact-share-row';b.setAttribute('aria-pressed',String(selected.has(id)));
      const av=document.createElement('span');av.className='contact-share-av';
      const src=group?groups[id]?.avatar:peerAvatars[id];
      if(src){const img=document.createElement('img');img.src=src;img.alt='';av.appendChild(img);}else av.innerHTML=_avHtml(id,name);
      const label=document.createElement('span');label.className='contact-share-name';label.textContent=name;
      const tick=document.createElement('span');tick.className='contact-share-check';tick.innerHTML='<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>';
      b.append(av,label,tick);b.onclick=()=>{selected.has(id)?selected.delete(id):selected.add(id);paint();};list.appendChild(b);
    });
    if(!list.childElementCount){const empty=document.createElement('div');empty.className='contact-share-empty';empty.textContent='Чаты не найдены';list.appendChild(empty);}
    panel.querySelector('.contact-share-send').disabled=!selected.size;
  }
  function send(){
    if(!selected.size)return;
    const name=String(peerNames[contact]||('@'+contact)).replace(/[\r\n]/g,' ').slice(0,100);
    const text='Контакт: '+name+'\n@'+contact+'\n⁣SLON_CONTACT';
    for(const id of selected){
      if(id.startsWith('g_')){sendGrpMsg(id,text);continue;}
      const ts=Date.now(),mid='m'+ts+'_'+Math.random().toString(36).slice(2,9);
      const msg={id:mid,sender:'me',text,ts,time:fmtTime(ts),status:'sent'};
      (chatHist[id]=chatHist[id]||[]).push(msg);
      if(activeChat===id){appendMsg(msg);scrollDown();}
      updatePreview(id,'Вы: Контакт '+name,ts);
      if(id!=='saved'){
        const c=conns[id];
        if((_fbMode||c?.open)&&!(typeof _e2eOn!=='undefined'&&_e2eOn&&typeof _hubUp!=='undefined'&&_hubUp)&&!(typeof _e2eMust==='function'&&_e2eMust(id)))
          sendData(c||id,{type:'msg',id:mid,text,ts,nick:myNick||('@'+myUsername),avatar:myAvatar||null});
      }
      if(typeof _mlPost==='function')_mlPost(id,{id:mid,k:'text',text,ts});
    }
    saveAll();closeShare();toast('Контакт отправлен');
  }
  const oldAppend=appendMsg;
  appendMsg=function(msg,container){
    const result=oldAppend.apply(this,arguments);
    const match=typeof msg.text==='string'&&msg.text.match(/^Контакт: ([^\n]{1,100})\n@([\w.\-]{1,64})\n⁣SLON_CONTACT$/);
    if(!match)return result;
    const root=container||$('msgs'),wrap=Array.from(root.querySelectorAll('.msg[data-msg-id]')).find(el=>el.dataset.msgId===String(msg.id));
    const bub=wrap?.querySelector('.msg-bub');if(!bub)return result;
    const card=document.createElement('button');card.className='contact-card';card.innerHTML=icon;
    const label=document.createElement('span'),name=document.createElement('b'),username=document.createElement('small');
    name.textContent=match[1];username.textContent='@'+match[2];label.append(name,username);card.appendChild(label);
    card.onclick=e=>{e.stopPropagation();if(typeof _fetchProfile==='function')_fetchProfile(match[2]);showPeerProfile(match[2]);};
    bub.replaceChildren(card);return result;
  };
})();

(function(){
  let gesture=null;
  const box=$('msgs');if(!box)return;
  box.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0)||e.target.closest('a,button,input,textarea,video,audio,[contenteditable],.msg-reply'))return;
    if(activeChat==='ai'||_isChannelId(activeChat))return;
    const row=e.target.closest('.msg[data-msg-id]'),body=row?.querySelector('.msg-body');
    if(!row||!body)return;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,row,body,chat:activeChat,drag:false,dx:0};
  });
  box.addEventListener('pointermove',e=>{
    const g=gesture;if(!g||g.id!==e.pointerId)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.drag&&Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
    if(!g.drag&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.4){g.drag=true;g.body.classList.add('swipe-reply-moving');try{box.setPointerCapture(e.pointerId);}catch(_){} }
    if(g.drag){g.dx=dx;g.body.style.transform='translateX('+Math.max(-76,Math.min(76,dx))+'px)';}
  });
  function end(e,cancelled){
    const g=gesture;if(!g||g.id!==e.pointerId)return;gesture=null;
    g.body.classList.remove('swipe-reply-moving');g.body.classList.add('swipe-reply-reset');g.body.style.transform='';
    setTimeout(()=>g.body.classList.remove('swipe-reply-reset'),220);
    if(!cancelled&&g.drag&&Math.abs(g.dx)>=55&&g.chat===activeChat){
      const found=_getMsgFromHist(g.row.dataset.msgId);if(found&&found.pid===activeChat){navigator.vibrate?.(12);startReply(found.m);}
    }
  }
  box.addEventListener('pointerup',e=>end(e,false));box.addEventListener('pointercancel',e=>end(e,true));
})();
