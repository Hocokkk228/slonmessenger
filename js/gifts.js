// ════════════════════════════════════════
// ── ПОДАРКИ и МИНИ-СЛОНИКИ ──
// Валюта — мини-слоники (100 = 20 ₽). Баланс и цены — на сервере (/wallet, /gift/send).
// Подарить: профиль человека → ⋮ → «Отправить подарок» → выбор → подтверждение.
// В чат уходит сообщение-подарок (k:'gift'), у получателя подарок появляется в профиле:
// вкладка «Подарки» видна, только когда есть хотя бы один подарок.
// ════════════════════════════════════════
let _wal={bal:null,log:[],gifts:{plush:{price:50,title:'Плюшевый слоник'}}};

// ── Значок мини-слоника (валюта) ──
function _msIco(cls){
  return `<svg class="ms-ico${cls?' '+cls:''}" viewBox="0 0 24 24" aria-hidden="true">
    <defs><linearGradient id="msG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".55" stop-color="#ffb627"/><stop offset="1" stop-color="#e5861a"/></linearGradient></defs>
    <path d="M6.2 9.6C4 8.6 2.4 10.4 3 12.6c.5 1.8 2.3 2.4 3.6 1.8M17.8 9.6c2.2-1 3.8.8 3.2 3-.5 1.8-2.3 2.4-3.6 1.8" fill="url(#msG)" stroke="#b86a10" stroke-width=".9"/>
    <path d="M12 4.6c-4 0-6.4 2.8-6.4 6.3 0 2.6 1.4 4.4 3.3 5.2.6 1.6.3 3 1.4 3.6 1 .6 2-.2 2.2-1.4.1-.8-.3-1.5-.3-2.1 3.1-.4 6.2-2.4 6.2-5.3 0-3.5-2.4-6.3-6.4-6.3z" fill="url(#msG)" stroke="#b86a10" stroke-width=".9"/>
    <circle cx="9.6" cy="10.4" r="1" fill="#5a2c05"/><circle cx="14.4" cy="10.4" r="1" fill="#5a2c05"/>
    <path d="M8.6 7.2c1-1 2.2-1.4 3.4-1.4" stroke="#fff6cc" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/></svg>`;
}

// ── Плюшевый слоник (подарок) — рисунок и анимация ──
function _giftSvg(id,cls){
  if(id!=='plush')return '';
  return `<svg class="gift-svg gp${cls?' '+cls:''}" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <radialGradient id="gpB" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#c3cbea"/><stop offset=".6" stop-color="#9ea9d4"/><stop offset="1" stop-color="#7580b4"/></radialGradient>
      <radialGradient id="gpE" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#ffc4d0"/><stop offset="1" stop-color="#f08aa2"/></radialGradient>
    </defs>
    <ellipse class="gp-shadow" cx="60" cy="110" rx="30" ry="5" fill="#000" opacity=".22"/>
    <g class="gp-all">
      <!-- туловище и лапы -->
      <path d="M36,98C30,76 40,58 60,58S90,76 84,98C80,108 40,108 36,98Z" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.4"/>
      <path d="M50,70C56,76 64,76 70,70" stroke="#6f7aa8" stroke-width="1" stroke-dasharray="2.2 2" fill="none"/>
      <ellipse cx="60" cy="86" rx="14" ry="12" fill="#b8c1e6" opacity=".7"/>
      <g class="gp-arm l"><path d="M40,70C30,74 28,86 34,90C38,92 42,86 44,80Z" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.2"/></g>
      <g class="gp-arm r"><path d="M80,70C90,74 92,86 86,90C82,92 78,86 76,80Z" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.2"/></g>
      <ellipse cx="46" cy="102" rx="10" ry="7.5" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.2"/><ellipse cx="74" cy="102" rx="10" ry="7.5" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.2"/>
      <ellipse cx="46" cy="103" rx="5.5" ry="4.2" fill="#f4a9b8"/><ellipse cx="74" cy="103" rx="5.5" ry="4.2" fill="#f4a9b8"/>
      <!-- уши -->
      <g class="gp-ear l"><path d="M34,40C16,32 8,50 16,62C22,70 32,66 38,58Z" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.3"/><path d="M31,44C20,40 15,52 20,59C24,64 30,61 34,55Z" fill="url(#gpE)"/></g>
      <g class="gp-ear r"><path d="M86,40C104,32 112,50 104,62C98,70 88,66 82,58Z" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.3"/><path d="M89,44C100,40 105,52 100,59C96,64 90,61 86,55Z" fill="url(#gpE)"/></g>
      <!-- голова -->
      <circle cx="60" cy="44" r="25" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.4"/>
      <path d="M60,19C58,26 58,32 60,38" stroke="#6f7aa8" stroke-width="1" stroke-dasharray="2.2 2" fill="none"/>
      <!-- хобот -->
      <g class="gp-trunk"><path d="M54,52C52,62 52,70 56,74C60,78 66,76 67,70C68,66 64,64 62,67C61,62 62,57 64,52Z" fill="url(#gpB)" stroke="#6f7aa8" stroke-width="1.3"/>
        <path d="M55,60h7M55,65h6" stroke="#6f7aa8" stroke-width=".9" opacity=".7"/></g>
      <!-- глаза и щёки -->
      <g class="gp-eyes"><ellipse cx="50" cy="42" rx="3.2" ry="3.8" fill="#1d2033"/><ellipse cx="70" cy="42" rx="3.2" ry="3.8" fill="#1d2033"/>
        <circle cx="51.2" cy="40.6" r="1.2" fill="#fff"/><circle cx="71.2" cy="40.6" r="1.2" fill="#fff"/></g>
      <ellipse cx="43" cy="51" rx="4.5" ry="3" fill="#f59bb0" opacity=".75"/><ellipse cx="77" cy="51" rx="4.5" ry="3" fill="#f59bb0" opacity=".75"/>
      <!-- бантик -->
      <g class="gp-bow"><path d="M60,62L50,56L50,68ZM60,62L70,56L70,68Z" fill="#ff5d8f" stroke="#c23466" stroke-width="1"/><circle cx="60" cy="62" r="3" fill="#ff86aa" stroke="#c23466" stroke-width="1"/></g>
    </g>
    <g class="gp-hearts"><path class="gp-h a" d="M20,30c-2-3-6-1-4,2l4,4 4-4c2-3-2-5-4-2z" fill="#ff7aa2"/><path class="gp-h b" d="M100,24c-2-3-6-1-4,2l4,4 4-4c2-3-2-5-4-2z" fill="#ff9ab8"/></g>
  </svg>`;
}
const _giftTitle=id=>(_wal.gifts[id]||{}).title||'Подарок';
const _giftPrice=id=>(_wal.gifts[id]||{}).price||0;

// ── Кошелёк ──
async function _walLoad(){
  try{const d=await api('/wallet');_wal.bal=d.bal||0;_wal.log=d.log||[];if(d.gifts)_wal.gifts=d.gifts;}catch(e){}
  document.querySelectorAll('.wal-bal-v').forEach(el=>el.textContent=_wal.bal==null?'…':_wal.bal);
  return _wal;
}
// строка «Мини-слоники» в настройках
{const f=_spRender;_spRender=function(){
  const r=f.apply(this,arguments);
  try{
    const body=$('spBody');
    if(body&&!body.querySelector('.wal-row')){
      const first=body.querySelector('.sp-card');
      first?.insertAdjacentHTML('afterend',`<div class="sp-card"><div class="sp-row wal-row" onclick="_spWallet()">
        <div class="sp-ico wal-row-ico">${_msIco()}</div>
        <div class="sp-row-txt"><div class="sp-row-title">Мини-слоники</div></div>
        <div class="sp-row-val"><span class="wal-bal-v">${_wal.bal==null?'…':_wal.bal}</span></div></div></div>`);
      _walLoad();
    }
  }catch(e){console.warn('[gifts] sp',e);}
  return r;
};}
function _spWallet(){
  _spPush('Мини-слоники',`<div class="wal-page">
    <div class="wal-hero"><div class="wal-spark">${Array.from({length:18},(_,i)=>`<i style="--x:${(i*53)%100}%;--y:${(i*37)%100}%;--d:${(i*.23)%2.4}s"></i>`).join('')}</div>${_msIco('wal-big')}</div>
    <div class="wal-t">Мини-слоники</div>
    <div class="wal-sub">Мини-слоники нужны, чтобы дарить подарки. 100 мини-слоников — 20 ₽.</div>
    <div class="sp-card wal-card"><div class="wal-bal">${_msIco()}<span class="wal-bal-v">${_wal.bal==null?'…':_wal.bal}</span></div><div class="wal-bal-k">Ваш баланс</div>
      <div class="wal-btns"><button class="wal-btn" onclick="toast('Пополнение появится вместе с оплатой — скоро')"><svg class="ico" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4z"/></svg> Пополнить</button>
        <button class="wal-btn" onclick="_walHistScroll()">История</button></div>
      <div class="wal-admin" id="walAdmin"></div></div>
    <div class="sp-card wal-hist" id="walHist"><div class="px-tabs"><button class="px-tab sel" data-f="all" onclick="_walTab(this)">Все операции</button><button class="px-tab" data-f="in" onclick="_walTab(this)">Зачисления</button><button class="px-tab" data-f="out" onclick="_walTab(this)">Списания</button></div><div id="walList"></div></div>
  </div>`);
  _walLoad().then(()=>_walList('all'));
  if(typeof CHANNEL_ADMINS!=='undefined'&&CHANNEL_ADMINS.has(myUsername))
    $('walAdmin').innerHTML='<button class="wal-link" onclick="_walAdminGrant()">Начислить мини-слоников (админ)</button>';
}
function _walHistScroll(){$('walHist')?.scrollIntoView({behavior:'smooth',block:'start'});}
function _walTab(b){b.parentElement.querySelectorAll('.px-tab').forEach(x=>x.classList.toggle('sel',x===b));_walList(b.dataset.f);}
function _walList(f){
  const el=$('walList');if(!el)return;
  const l=_wal.log.filter(x=>f==='all'||(f==='in'?x.delta>0:x.delta<0));
  if(!l.length){el.innerHTML='<div class="px-gift-hint">Операций пока нет</div>';return;}
  el.innerHTML=l.map(x=>{const who=x.peer?(peerNames[x.peer]||('@'+x.peer)):'SLON';
    const what=x.kind==='gift_out'?'Подарок для '+who:x.kind==='gift_in'?'Подарок от '+who:x.kind==='admin'?'Начисление':(x.note||'Операция');
    return `<div class="wal-op"><div class="wal-op-ico">${x.kind==='gift_out'?_giftSvg('plush','mini'):_msIco()}</div>
      <div class="wal-op-t"><b>${esc(what)}</b><span>${new Date(x.ts).toLocaleString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>
      <div class="wal-op-v ${x.delta>0?'in':'out'}">${x.delta>0?'+':''}${x.delta} ${_msIco()}</div></div>`;}).join('');
}
async function _walAdminGrant(){
  const u=prompt('Кому начислить? (юзернейм)',myUsername);if(!u)return;
  const n=+prompt('Сколько мини-слоников? (минус — списать)','500');if(!n)return;
  try{const d=await api('/admin/wallet',{u,delta:n});toast('Готово, у @'+u.replace(/^@/,'')+' теперь '+d.bal);_walLoad().then(()=>_walList('all'));}catch(e){toast(e.message);}
}

// ── «Отправить подарок» в меню профиля собеседника ──
{const f=_ppRender;_ppRender=function(pid){
  const r=f.apply(this,arguments);
  try{
    const more=$('peerProfMoreBtn'),orig=more&&more.onclick;
    if(more&&orig)more.onclick=e=>{orig(e);const m=$('ppMenu');
      if(m&&m.classList.contains('show')&&!m.querySelector('.gift-mi'))
        m.insertAdjacentHTML('afterbegin',`<button class="sp-menu-item gift-mi" onclick="_spCloseMenu();_giftPicker('${pid}')"><span class="gift-mi-ico">${_giftSvg('plush','mini')}</span><span>Отправить подарок</span></button>`);};
  }catch(e){}
  return r;
};}

// ── Окно выбора подарка ──
function _giftPicker(pid){
  document.getElementById('giftSheet')?.remove();
  const name=peerNames[pid]||('@'+pid),av=peerAvatars[pid];
  const w=document.createElement('div');w.id='giftSheet';w.className='gift-sheet';
  w.innerHTML=`<div class="gift-bd" onclick="_giftClose()"></div><div class="gift-card">
    <button class="px-sheet-x" onclick="_giftClose()"><svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    <div class="gift-bal">Баланс<br><b>${_msIco()}<span class="wal-bal-v">${_wal.bal==null?'…':_wal.bal}</span></b></div>
    <div class="gift-hd"><div class="wal-spark">${Array.from({length:16},(_,i)=>`<i style="--x:${(i*61)%100}%;--y:${(i*29)%100}%;--d:${(i*.3)%2.4}s"></i>`).join('')}</div>
      <div class="gift-av">${av?`<img src="${av}" alt="">`:_avHtml(pid,name)}</div></div>
    <div class="wal-t">Отправить подарок</div>
    <div class="wal-sub">Дарите ${esc(name)} подарки — они будут видны в профиле.</div>
    <div class="gift-body" id="giftBody"></div></div>`;
  document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('show'));
  _giftGrid(pid);_walLoad();
}
function _giftGrid(pid){
  const b=$('giftBody');if(!b)return;
  b.innerHTML=`<div class="gift-grid">${Object.entries(_wal.gifts).map(([id,g])=>`<button class="gift-cell" onclick="_giftConfirm('${pid}','${id}')">
      ${_giftSvg(id)}<span class="gift-price">${_msIco()}${g.price}</span></button>`).join('')}
    <div class="gift-cell gift-soon"><span>Скоро новые подарки</span></div></div>`;
}
function _giftConfirm(pid,id){
  const b=$('giftBody');if(!b)return;const price=_giftPrice(id),name=peerNames[pid]||('@'+pid);
  b.innerHTML=`<div class="gift-conf">${_giftSvg(id,'big')}
    <div class="gift-conf-t">${esc(_giftTitle(id))}</div>
    <textarea class="lm-inp gift-msg" id="giftMsg" maxlength="200" placeholder="Подпись к подарку (необязательно)"></textarea>
    <button class="gift-send" id="giftSend" onclick="_giftSend('${pid}','${id}')">Подарить за ${_msIco()} ${price}</button>
    <button class="wal-link" onclick="_giftGrid('${pid}')">Назад к подаркам</button>
    <div class="gift-note" id="giftNote"></div></div>`;
  if(_wal.bal!=null&&_wal.bal<price)$('giftNote').textContent='Не хватает мини-слоников: нужно '+price+', у тебя '+_wal.bal+'.';
}
async function _giftSend(pid,id){
  const btn=$('giftSend');if(!btn||btn.disabled)return;
  btn.disabled=true;btn.classList.add('busy');
  const text=($('giftMsg')?.value||'').trim();
  try{
    const d=await api('/gift/send',{to:pid,gift:id,text});
    _wal.bal=d.bal;document.querySelectorAll('.wal-bal-v').forEach(el=>el.textContent=d.bal);
    // сообщение-подарок в чат (у обоих)
    const ts=Date.now(),mid='g'+ts;
    const msg={id:mid,sender:'me',ts,time:fmtTime(ts),status:'sent',gift:{id,gid:d.id,text,price:d.price}};
    (chatHist[pid]=chatHist[pid]||[]).push(msg);
    if(activeChat===pid){appendMsg(msg);scrollDown();}
    updatePreview(pid,'Вы: Подарок',ts);saveAll();
    if(typeof _mlPost==='function')_mlPost(pid,{id:mid,k:'gift',gift:id,gid:d.id,text,price:d.price,ts});
    $('giftBody').innerHTML=`<div class="gift-conf gift-done">${_giftSvg(id,'big')}<div class="gift-conf-t">Подарок отправлен!</div><div class="wal-sub">${esc(peerNames[pid]||('@'+pid))} увидит его в чате и в профиле.</div><button class="gift-send" onclick="_giftClose()">Отлично</button></div>`;
    delete _giftCache[pid];
  }catch(e){toast(e.message||'Не удалось подарить');btn.disabled=false;btn.classList.remove('busy');
    if(/мини-слоник/i.test(e.message||''))$('giftNote').textContent=e.message;}
}
function _giftClose(){const w=$('giftSheet');if(!w)return;w.classList.remove('show');setTimeout(()=>w.remove(),250);}

// ── Сообщение-подарок в чате ──
{const f=appendMsg;appendMsg=function(msg,container){
  if(!msg||!msg.gift)return f.apply(this,arguments);
  const c=container||$('msgs');if(!c)return;
  const isOut=msg.sender==='me';
  const wrap=document.createElement('div');wrap.className='msg '+(isOut?'out':'inc')+' msg-gift';wrap.dataset.msgId=msg.id;
  const peer=isOut?activeChat:(msg.senderId||activeChat);
  const who=isOut?('для '+(peerNames[peer]||('@'+peer))):('от '+(msg.name||peerNames[peer]||('@'+peer)));
  wrap.innerHTML=`<div class="msg-body"><div class="gift-bub" onclick="_giftView(${esc(JSON.stringify({gift:msg.gift.id,from:isOut?myUsername:peer,to:isOut?peer:myUsername,text:msg.gift.text||'',price:msg.gift.price||_giftPrice(msg.gift.id),ts:msg.ts,gid:msg.gift.gid||''})).replace(/"/g,'&quot;')})">
      ${_giftSvg(msg.gift.id)}<div class="gift-bub-t">Подарок</div><div class="gift-bub-s">${esc(_giftTitle(msg.gift.id))} · ${esc(who)}</div>
      ${msg.gift.text?`<div class="gift-bub-m">${esc(msg.gift.text)}</div>`:''}
      <div class="gift-bub-b">Посмотреть</div><div class="msg-time">${esc(msg.time||'')}</div></div></div>`;
  c.appendChild(wrap);
};}

// ── Окно подарка (как в Telegram) ──
function _giftView(g){
  document.getElementById('giftSheet')?.remove();
  const mine=g.to===myUsername,fromName=g.from===myUsername?'Вы':(peerNames[g.from]||('@'+g.from));
  const w=document.createElement('div');w.id='giftSheet';w.className='gift-sheet';
  w.innerHTML=`<div class="gift-bd" onclick="_giftClose()"></div><div class="gift-card">
    <button class="px-sheet-x" onclick="_giftClose()"><svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    <div class="gift-hd tall"><div class="wal-spark">${Array.from({length:16},(_,i)=>`<i style="--x:${(i*61)%100}%;--y:${(i*29)%100}%;--d:${(i*.3)%2.4}s"></i>`).join('')}</div>${_giftSvg(g.gift,'big')}</div>
    <div class="wal-t">${mine?'Подарок вам':'Подарок'}</div>
    <div class="gift-tbl">
      <div><span>От</span><b>${esc(fromName)}</b></div>
      <div><span>Дата</span><b>${new Date(g.ts||Date.now()).toLocaleString('ru',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</b></div>
      <div><span>Стоимость</span><b>${_msIco()} ${g.price||_giftPrice(g.gift)}</b></div>
      ${g.text?`<div class="gift-tbl-m">${esc(g.text)}</div>`:''}
    </div>
    ${mine&&g.gid?`<div class="gift-vis" id="giftVis">Подарок ${g.hidden?'скрыт из':'виден в'} вашем профиле. <a href="#" onclick="_giftHide('${esc(g.gid)}',${g.hidden?0:1});return false">${g.hidden?'Показать':'Скрыть'}</a></div>`:''}
    <button class="gift-send" onclick="_giftClose()">OK</button></div>`;
  document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('show'));
}
async function _giftHide(gid,hide){
  try{await api('/gift/hide',{id:gid,hidden:!!hide});toast(hide?'Подарок скрыт из профиля':'Подарок снова в профиле');delete _giftCache[myUsername];_giftClose();}catch(e){toast(e.message);}
}

// ── Подарки в профиле: вкладка только если есть хотя бы один ──
const _giftCache={};
async function _giftsOf(u){
  const c=_giftCache[u];if(c&&Date.now()-c.t<60000)return c.list;
  try{const d=await api('/gifts?u='+encodeURIComponent(u));_giftCache[u]={t:Date.now(),list:d.gifts||[]};return _giftCache[u].list;}catch(e){return c?c.list:[];}
}
_pxGiftsBlock=function(owner){
  setTimeout(()=>_giftsFill(owner),0);
  return `<div class="px-gifts" data-owner="${esc(owner)}">
    <div class="px-tabs"><button class="px-tab gift-tab" data-t="gifts" onclick="_pxTab(this)" hidden>Подарки</button><button class="px-tab sel" data-t="posts" onclick="_pxTab(this)">Публикации</button></div>
    <div class="px-tab-body" data-t="gifts" hidden><div class="px-gift-grid gift-prof" id="pxGifts_${esc(owner)}"></div></div>
    <div class="px-tab-body" data-t="posts"><div class="px-posts" id="pxPosts_${esc(owner)}"><div class="px-gift-hint">Загрузка…</div></div></div></div>`;
};
async function _giftsFill(owner){
  if(typeof _pxLoadPosts==='function')_pxLoadPosts(owner);
  const list=await _giftsOf(owner);
  const box=document.querySelector(`.px-gifts[data-owner="${CSS.escape(owner)}"]`);if(!box)return;
  const shown=list.filter(g=>owner===myUsername||!g.hidden);
  if(!shown.length)return;                                  // нет подарков — вкладки нет
  const tab=box.querySelector('.gift-tab');tab.hidden=false;tab.textContent='Подарки '+shown.length;
  const grid=box.querySelector('#pxGifts_'+CSS.escape(owner));
  grid.innerHTML=shown.map(g=>`<button class="gift-pcell${g.hidden?' hid':''}" onclick="_giftView(${esc(JSON.stringify({...g,to:owner,gid:g.id})).replace(/"/g,'&quot;')})">${_giftSvg(g.gift)}<span class="gift-pfrom">${esc(peerNames[g.from]||('@'+g.from))}</span></button>`).join('');
  _pxTab(tab);
}
