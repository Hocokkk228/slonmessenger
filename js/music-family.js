// ════════ Музыкальная семья: приглашение в чат, музыка и плейлисты семьи на главной, «Слушать вместе» ════════
// Пригласить: Музыка → Главная → «Семья» → «Пригласить» (или Медиатека → Треки). Человеку в чат приходит
// приглашение с кнопкой «Принять»; приняв, он видит твою музыку и плейлисты, а ты — его (семья взаимная).

const _FAM_MARK='⁣⁤⁣';                    // невидимая метка в тексте приглашения (старые версии видят просто текст)
const _famOkK=()=>'sl_famok_'+(myUsername||'');
const _famOk=()=>{try{return JSON.parse(localStorage.getItem(_famOkK())||'[]');}catch(e){return [];}};
const _famAv=u=>typeof _mmAv==='function'?_mmAv(u):'';
const _famName=u=>peerNames[u]||('@'+u);

// ── приглашение: доступ открываем сразу, в чат — сообщение с кнопкой ──
function _famSendText(u,text){
  const ts=Date.now(),mid='m'+ts+Math.random().toString(36).slice(2,6);
  const msg={id:mid,sender:'me',text,ts,time:fmtTime(ts),status:'sent'};
  (chatHist[u]=chatHist[u]||[]).push(msg);
  if(activeChat===u){appendMsg(msg);scrollDown();}
  try{updatePreview(u,'Вы: '+text.replace(_FAM_MARK,'').slice(0,40),ts);}catch(e){}
  saveAll();
  if(typeof _mlPost==='function')_mlPost(u,{id:mid,k:'text',text,ts});
}
{const f=_mmFamSet;_mmFamSet=async function(u,on){
  if(!on)return f.apply(this,arguments);
  u=String(u||'').trim().toLowerCase().replace(/^@/,'');if(!u)return;
  if(u===myUsername){toast('Себя пригласить нельзя');return;}
  if(!confirm(`Пригласить ${_famName(u)} в музыкальную семью? Ему придёт приглашение в чат, а после принятия вы будете видеть музыку и плейлисты друг друга.`))return;
  try{
    await api('/mm/share',{friend:u,on:true});
    if(!_mmFam.mine.includes(u))_mmFam.mine.push(u);
    _famSendText(u,'🎵 Приглашаю тебя в музыкальную семью SLON — будем слушать музыку и плейлисты друг друга'+_FAM_MARK);
    _pxSheetClose();_mmFamPaint();toast('Приглашение отправлено в чат');
    _famPlsPush();
  }catch(e){toast(e.message||'Не получилось');}
};}
// приглашение в чате — карточкой
function _famBub(msg,container){
  if(!msg||typeof msg.text!=='string'||!msg.text.includes(_FAM_MARK))return;
  const el=(container||document).querySelector(`[data-msg-id="${CSS.escape(String(msg.id))}"] .msg-bub`);if(!el)return;
  const inc=msg.sender!=='me',from=inc?(msg.senderId||activeChat):null;
  const done=inc&&(_famOk().includes(from)||_mmFam.mine.includes(from));
  el.classList.add('fam-bub');
  el.innerHTML=`<div class="fam-card"><div class="fam-ic">🎵</div><div class="fam-tx"><b>Музыкальная семья</b>
    <span>${inc?esc(_famName(from))+' приглашает тебя: музыка и плейлисты друг друга, слушать вместе':'Ты пригласил(а) в семью: музыка и плейлисты друг друга'}</span></div></div>
    ${inc?(done?'<div class="fam-st">✓ Ты в семье</div>':`<button class="fam-ok" onclick="_famAccept('${esc(from)}',this)">Принять</button>`):''}`;
}
{const f=appendMsg;appendMsg=function(msg,container){const r=f.apply(this,arguments);try{_famBub(msg,container);}catch(e){}return r;};}
async function _famAccept(from,btn){
  if(btn){btn.disabled=true;btn.textContent='…';}
  try{
    await api('/mm/share',{friend:from,on:true});                    // семья взаимная: моя музыка — ему
    const ok=_famOk();if(!ok.includes(from)){ok.push(from);try{localStorage.setItem(_famOkK(),JSON.stringify(ok));}catch(e){}}
    if(!_mmFam.mine.includes(from))_mmFam.mine.push(from);
    await _mmFamLoad();_famPlsPush();
    _famSendText(from,'✅ Принял(а) приглашение в музыкальную семью');
    if(btn)btn.outerHTML='<div class="fam-st">✓ Ты в семье</div>';
    toast('Готово! Музыка семьи — на главной в «Музыке»');
  }catch(e){toast(e.message||'Не получилось');if(btn){btn.disabled=false;btn.textContent='Принять';}}
}

// ── мои плейлисты медиатеки — семье (облачные id треков) ──
let _famPlsT=0;
function _famPlsPush(){
  clearTimeout(_famPlsT);
  _famPlsT=setTimeout(()=>{
    if(typeof _apiToken!=='function'||!_apiToken()||!_mmFam.mine.length)return;
    const list=_mmPls().map(p=>({id:p.id,name:p.name,tr:_mmPlItems(p).map(x=>x.cid).filter(Boolean)})).filter(p=>p.tr.length);
    api('/mm/pls',{list}).catch(()=>{});
  },1500);
}
{const f=_mmPlSave;_mmPlSave=function(){const r=f.apply(this,arguments);_famPlsPush();return r;};}
setTimeout(_famPlsPush,8000);

// ── музыка семьи: загрузка, обложки по каталогу (у владельца они найдены на его устройстве и в облако не попадают) ──
_mmFam.pls=_mmFam.pls||{};const _famAt={};
async function _famLoad(owner,force){
  if(!force&&_mmFam.of[owner]&&Date.now()-(_famAt[owner]||0)<10*60e3)return;
  const d=await api('/mm/of?u='+encodeURIComponent(owner));
  _mmFam.of[owner]=(d.tracks||[]).map(t=>({id:'f_'+t.id,cid:t.id,title:t.title,artist:t.artist,album:t.album,dur:t.dur,size:t.size,mime:t.mime,ts:t.ts,url:t.url,
    coverUrl:t.coverUrl||_famCov(t),local:false,friend:owner}));
  _mmFam.pls[owner]=d.pls||[];_famAt[owner]=Date.now();
  _famCovFill(owner);
}
const _famCovKey=t=>(t.artist+'|'+t.title).toLowerCase();
function _famCov(t){const v=_mmCovMap[_famCovKey(t)];return typeof v==='string'?v:'';}
let _famCovBusy=false;
async function _famCovFill(owner){
  if(_famCovBusy)return;_famCovBusy=true;let ch=false;
  try{
    for(const it of _mmFam.of[owner]||[]){
      if(it.coverUrl)continue;
      const k=_famCovKey(it),v=_mmCovMap[k];
      if(v===undefined||(typeof v==='number'&&Date.now()-v>864e5)){
        const hit=await _plMatch(it.title,it.artist).catch(()=>null);
        _mmCovMap[k]=hit&&hit.cover?hit.cover:Date.now();
        try{localStorage.setItem('sl_mmcov',JSON.stringify(_mmCovMap));}catch(e){}
        await new Promise(r=>setTimeout(r,200));
      }
      if(typeof _mmCovMap[k]==='string'&&_mmCovMap[k]){it.coverUrl=_mmCovMap[k];ch=true;}
    }
  }catch(e){}
  _famCovBusy=false;
  if(ch){if($('mmOfList'))_mmOfPaint(owner);if(typeof _mxS!=='undefined'&&_mxS.tab==='home'&&$('mxBody'))_mxRefresh();}
}
// страница музыки участника — через общую загрузку (обложки, плейлисты)
_spMusicOf=function(owner){
  _spPush('Музыка '+esc(_famName(owner)),`<div class="mm-page">
    <div class="mm-top"><button class="wal-btn" data-mmsrc="fam:${esc(owner)}" onclick="_mmOfPlayAll('${esc(owner)}')">${_MM_ICO.play} Слушать</button>
      <button class="mm-ib mm-shuf${_mm.shuffle?' on':''}" onclick="_mmShufToggle()" title="Перемешивание">${_MM_ICO.shuffle}</button>
      <button class="wal-btn fam-lt" onclick="_ltStart('${esc(owner)}')">🎧 Слушать вместе</button></div>
    <div id="famPlsOf"></div>
    <div class="sp-card mm-list" id="mmOfList"><div class="px-empty">Загрузка…</div></div></div>`);
  _famLoad(owner,true).then(()=>{_mmOfPaint(owner);const p=$('famPlsOf');if(p)p.innerHTML=_famPlsRow(owner);})
    .catch(e=>{const l=$('mmOfList');if(l)l.innerHTML=`<div class="px-empty">${esc(e.message||'Не удалось загрузить')}</div>`;});
};
function _famPlItems(owner,p){const L=_mmFam.of[owner]||[];return (p.tr||[]).map(c=>L.find(x=>x.cid===c)).filter(Boolean);}
function _famPlsRow(owner){
  const P=(_mmFam.pls[owner]||[]).filter(p=>_famPlItems(owner,p).length);if(!P.length)return '';
  return `<div class="mx-h2">Плейлисты</div><div class="mx-row">${P.map(p=>{const it=_famPlItems(owner,p);
    return `<div class="mx-sq" onclick="_famPlOpen('${esc(owner)}','${esc(p.id)}')">${_mxCv((it.find(x=>x.coverUrl)||{}).coverUrl)}<b>${esc(p.name)}</b><span>${_mxN(it.length)}</span></div>`;}).join('')}</div>`;
}
function _famPlOpen(owner,id){
  const p=(_mmFam.pls[owner]||[]).find(x=>x.id===id);if(!p)return;
  const items=_famPlItems(owner,p);
  _spPush(esc(p.name),'<div class="mm-page mx-pl" id="famPl"></div>');
  const b=$('famPl');if(!b)return;
  b.innerHTML=_mxListPage({title:p.name,cover:(items.find(x=>x.coverUrl)||{}).coverUrl,items,src:'fampl:'+owner+':'+id});
  if(typeof _mxHeroColor==='function')_mxHeroColor((items.find(x=>x.coverUrl)||{}).coverUrl,'#famPl .mx-hero');
  _mmPaintPlay();
}

// ── главная: раздел «Семья» ──
function _famHome(){
  const wm=_mmFam.withMe||[],mine=_mmFam.mine||[];
  const ppl=[...new Set([...wm,...mine])];
  let h=`<div class="mx-h2 fam-h">Семья<button class="fam-inv" onclick="_mmFamPick()">${_MM_ICO.plus} Пригласить</button></div>`;
  if(!ppl.length)return h+`<div class="fam-empty" onclick="_mmFamPick()">Позови друзей в семью — будете слушать музыку и плейлисты друг друга и включать треки вместе</div>`;
  h+=`<div class="mx-row fam-row">${ppl.map(u=>{const open=wm.includes(u);
    return `<div class="fam-p${open?'':' wait'}" onclick="${open?`_spMusicOf('${esc(u)}')`:`toast('Ждём, пока ${esc(_famName(u))} примет приглашение')`}"><span class="fam-av">${_famAv(u)}</span><b>${esc(_famName(u))}</b>
      <span>${open?(_mmFam.of[u]?_mxN(_mmFam.of[u].length):'Музыка'):'Приглашён'}</span>${open?`<button class="fam-lt-b" title="Слушать вместе" onclick="event.stopPropagation();_ltStart('${esc(u)}')">🎧</button>`:''}</div>`;}).join('')}</div>`;
  // плейлисты семьи
  const pl=[];for(const u of wm)for(const p of _mmFam.pls[u]||[]){const it=_famPlItems(u,p);if(it.length)pl.push({u,p,it});}
  if(pl.length)h+=`<div class="mx-h2">Плейлисты семьи</div><div class="mx-row">${pl.slice(0,20).map(x=>`<div class="mx-sq" onclick="_famPlOpen('${esc(x.u)}','${esc(x.p.id)}')">${_mxCv((x.it.find(y=>y.coverUrl)||{}).coverUrl)}<b>${esc(x.p.name)}</b><span>${esc(_famName(x.u))}</span></div>`).join('')}</div>`;
  // свежие треки семьи
  const fr=[];for(const u of wm)for(const it of (_mmFam.of[u]||[]).slice(0,8))fr.push(it);
  fr.sort((a,b)=>(b.ts||0)-(a.ts||0));
  if(fr.length)h+=`<div class="mx-h2">Новое у семьи</div><div class="mx-row">${fr.slice(0,12).map(it=>`<div class="mx-sq" onclick="_mm.src='fam:${esc(it.friend)}';_mmPlay('${esc(it.id)}',_mmFam.of['${esc(it.friend)}'].map(x=>x.id))">${_mxCv(it.coverUrl)}<b>${esc(it.title)}</b><span>${esc(_famName(it.friend))}</span></div>`).join('')}</div>`;
  return h;
}
{const f=_mxHome;_mxHome=function(){
  const h=f.apply(this,arguments);
  // подгружаем музыку семьи один раз (потом главная перерисуется)
  const need=(_mmFam.withMe||[]).filter(u=>!_mmFam.of[u]);
  if(need.length&&!_famHome._busy){_famHome._busy=true;Promise.all(need.map(u=>_famLoad(u).catch(()=>{}))).then(()=>{_famHome._busy=false;if(_mxS.tab==='home'&&$('mxBody'))_mxRefresh();});}
  return h+_famHome();
};}
setTimeout(()=>{if(typeof _apiToken==='function'&&_apiToken())_mmFamLoad();},6000);

// ════════ Слушать вместе ════════
// Один включает — у другого тот же трек с того же места; пауза, перемотка, следующий трек — у обоих (управлять могут оба).
// Трек должен быть доступен обоим: своя музыка или музыка семьи.
let _lt=null;   // {sid, peer, role, mute}
const _ltSend=(u,p)=>{if(typeof _fbSend==='function')_fbSend(u,p);};
function _ltCurTr(){
  const t=_mm.cur;if(!t||!t.mm)return null;
  const it=_mmFind(t.mm);if(!it||!it.cid&&!it.friend)return null;
  return {owner:it.friend||myUsername,cid:it.cid||String(it.id).replace(/^f_/,''),title:it.title||'',artist:it.artist||''};
}
function _ltState(){const a=_pxAudio;return {tr:_ltCurTr(),pos:a?a.currentTime:0,playing:!!(a&&!a.paused),at:Date.now()};}
function _ltStart(u){
  if(!_ltCurTr()){toast('Сначала включи трек из своей музыки или музыки семьи — его услышите вместе');return;}
  _lt={sid:Math.random().toString(36).slice(2,10),peer:u,role:'host',mute:0,wait:true};
  _ltSend(u,{type:'lt_inv',sid:_lt.sid,...(_ltState())});
  _ltBadge();toast('Зовём '+_famName(u)+' слушать вместе…');
}
function _ltLeave(silent){
  if(!_lt)return;if(!silent)_ltSend(_lt.peer,{type:'lt_bye',sid:_lt.sid});
  _lt=null;$('ltBadge')?.remove();
}
function _ltBadge(){
  let b=$('ltBadge');
  if(!_lt){b&&b.remove();return;}
  if(!b){b=document.createElement('div');b.id='ltBadge';b.className='lt-badge';document.body.appendChild(b);}
  b.innerHTML=`<span class="lt-av">${_famAv(_lt.peer)}</span><span>${_lt.wait?'Ждём ':'Вместе с '}${esc(_famName(_lt.peer))}</span><button onclick="_ltLeave()" title="Выйти">✕</button>`;
}
// применить состояние собеседника: тот же трек, то же место
async function _ltApply(st){
  if(!_lt||!st||!st.tr)return;
  _lt.mute=Date.now()+1500;
  const t=st.tr;let it=null;
  if(t.owner===myUsername)it=_mm.list.find(x=>x.cid===t.cid||x.id===t.cid);
  else{try{await _famLoad(t.owner);}catch(e){toast('Нет доступа к музыке '+_famName(t.owner)+' — нужна семья');return;}
    it=(_mmFam.of[t.owner]||[]).find(x=>x.cid===t.cid);}
  if(!it){toast('Этого трека у тебя нет: «'+t.title+'»');return;}
  const lag=Math.max(0,Math.min(3,(Date.now()-(st.at||Date.now()))/1000));
  const want=(st.pos||0)+(st.playing?lag:0);
  if(!_mm.cur||_mm.cur.mm!==it.id){
    _mm.src=t.owner===myUsername?'lib':'fam:'+t.owner;
    await _mmPlay(it.id,t.owner===myUsername?_mm.list.map(x=>x.id):(_mmFam.of[t.owner]||[]).map(x=>x.id));
    _lt.mute=Date.now()+2500;
    setTimeout(()=>{try{_pxAudio.currentTime=want+1;if(!st.playing)_pxAudio.pause();}catch(e){}},900);
    return;
  }
  const a=_pxAudio;if(!a)return;
  if(Math.abs(a.currentTime-want)>1.2)a.currentTime=want;
  if(st.playing&&a.paused)a.play().catch(()=>{});else if(!st.playing&&!a.paused)a.pause();
}
// свои действия — собеседнику (кроме тех, что сами пришли от него)
function _ltLocal(){
  if(!_lt||_lt.wait||Date.now()<_lt.mute)return;
  clearTimeout(_ltLocal._t);_ltLocal._t=setTimeout(()=>{if(_lt&&!_lt.wait)_ltSend(_lt.peer,{type:'lt_st',sid:_lt.sid,..._ltState()});},250);
}
const _ltHooked=new WeakSet();
function _ltHook(){
  const a=_pxAudio;if(!a||_ltHooked.has(a))return;_ltHooked.add(a);
  ['play','pause','seeked','loadedmetadata'].forEach(ev=>a.addEventListener(ev,_ltLocal));
}
{const f=_mmHook;_mmHook=function(){const r=f.apply(this,arguments);try{_ltHook();}catch(e){}return r;};}
setInterval(()=>{try{_ltHook();}catch(e){}},2000);
// раз в 10 с ведущий сверяет место (часы, буферизация)
setInterval(()=>{if(_lt&&!_lt.wait&&_lt.role==='host'&&_pxAudio&&!_pxAudio.paused)_ltSend(_lt.peer,{type:'lt_st',sid:_lt.sid,..._ltState(),sync:1});},10000);

{const f=_handleIncoming;_handleIncoming=function(pid,p){
  if(!p||typeof p.type!=='string'||!p.type.startsWith('lt_'))return f.apply(this,arguments);
  if(p.type==='lt_inv'){
    _pxSheet(`<div class="px-sh-t">🎧 Слушать вместе</div><div class="lt-inv"><span class="lt-av big">${_famAv(pid)}</span>
      <div><b>${esc(_famName(pid))}</b> зовёт слушать вместе${p.tr?`<br><span>«${esc(p.tr.title)}» — ${esc(p.tr.artist)}</span>`:''}</div></div>
      <div class="mm-acts"><button onclick="_ltJoin('${esc(pid)}','${esc(p.sid)}')">Присоединиться</button><button onclick="_pxSheetClose();_ltSend('${esc(pid)}',{type:'lt_no',sid:'${esc(p.sid)}'})">Не сейчас</button></div>`);
    _ltJoin._st=p;
    return;
  }
  if(!_lt||p.sid!==_lt.sid)return;
  if(p.type==='lt_join'){_lt.wait=false;_lt.peer=pid;_ltBadge();toast(_famName(pid)+' слушает вместе с тобой');_ltSend(pid,{type:'lt_st',sid:_lt.sid,..._ltState()});return;}
  if(p.type==='lt_no'){toast(_famName(pid)+' сейчас не может');_ltLeave(true);return;}
  if(p.type==='lt_bye'){toast(_famName(pid)+' вышел(а) из совместного прослушивания');_ltLeave(true);return;}
  if(p.type==='lt_st'){
    if(p.sync&&_pxAudio&&p.tr&&_ltCurTr()&&_ltCurTr().cid===p.tr.cid&&Math.abs(_pxAudio.currentTime-(p.pos+(Date.now()-p.at)/1000))<1.5)return;
    _ltApply(p);
  }
};}
function _ltJoin(from,sid){
  _pxSheetClose();
  if(_lt)_ltLeave();
  _lt={sid,peer:from,role:'guest',mute:0,wait:false};
  _ltSend(from,{type:'lt_join',sid});_ltBadge();
  if(_ltJoin._st)_ltApply(_ltJoin._st);
}
