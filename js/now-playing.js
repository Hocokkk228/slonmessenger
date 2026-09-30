// ════════ «Сейчас слушает» — статус как в Discord ════════
// Что играет в SLON (моя музыка, плейлисты, треки из чатов) видно друзьям: в шапке чата и в профиле.
// Только по согласию: при первом треке спрашиваем, дальше — переключатель в медиатеке.
// На сервер уходит только название, исполнитель и ссылка на обложку (если она публичная), не чаще раза на трек.
const _NP_ICO='<svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';
const _npKeyLS=()=>'sl_np_share_'+myUsername;
function _npShare(){try{return localStorage.getItem(_npKeyLS());}catch(e){return null;}}
function _npSetShare(v){
  try{localStorage.setItem(_npKeyLS(),v?'1':'0');}catch(e){}
  _npSentKey='';if(!v)_npClear();else _npTick();
  toast(v?'Друзья видят, что ты слушаешь':'Больше не показываем, что ты слушаешь');
  document.querySelectorAll('.np-share-sw').forEach(x=>x.classList.toggle('on',!!v));
}
function _npAsk(){
  if(document.getElementById('pxSheet'))return;
  _pxSheet(`<div class="np-ask">${_NP_ICO}<b>Показывать друзьям, что ты слушаешь?</b>
    <span>Как в Discord: в чате и в профиле будет видно «Слушает: трек — исполнитель». Можно выключить в любой момент в медиатеке.</span>
    <div class="np-ask-b"><button class="lm-btn" onclick="_pxSheetClose();_npSetShare(false)">Не показывать</button>
      <button class="lm-btn primary" onclick="_pxSheetClose();_npSetShare(true)">Показывать</button></div></div>`);
}
// что играет сейчас
function _npNow(){
  const t=typeof _islTr!=='undefined'?_islTr:null;
  if(!t||!t.title||!_pxAudio||_pxAudio.paused||String(_pxAudioId)!==String(t.id))return null;
  let c=/^https:\/\//.test(t.cover||'')?t.cover:'';
  if(!c&&t.mm&&typeof _npCover==='function'){const it=_mmFind(t.mm);const x=it&&_npCover(it);if(/^https:\/\//.test(x||''))c=x;}
  const d=_pxAudio.duration,left=isFinite(d)&&d?Math.max(30,d-_pxAudio.currentTime):240;
  return {t:String(t.title),a:String(t.artist||''),c,left:Math.round(left)};
}
let _npSentKey='',_npSentAt=0,_npStopAt=0,_npAsked=false;
async function _npTick(){
  if(!myUsername||typeof api!=='function')return;
  const now=_npNow(),share=_npShare();
  if(now&&share==null&&!_npAsked){_npAsked=true;setTimeout(_npAsk,1500);return;}
  if(share!=='1')return;
  if(now){
    _npStopAt=0;
    const key=now.t+'|'+now.a;
    if(key!==_npSentKey||Date.now()-_npSentAt>240000){
      _npSentKey=key;_npSentAt=Date.now();
      api('/np',now).catch(()=>{_npSentKey='';});
    }
  }else if(_npSentKey){
    if(!_npStopAt)_npStopAt=Date.now();
    else if(Date.now()-_npStopAt>20000){_npClear();}
  }
}
function _npClear(){_npSentKey='';_npStopAt=0;if(typeof api==='function'&&myUsername)api('/np',{clear:true}).catch(()=>{});}
setInterval(_npTick,5000);
addEventListener('beforeunload',()=>{if(_npSentKey&&_npShare()==='1'&&typeof _apiToken==='function'){try{fetch(_apiUrl('/np'),{method:'POST',keepalive:true,headers:Object.assign({'Content-Type':'application/json'},_authHeader(_apiToken())),body:'{"clear":true}'});}catch(e){}}});

// ── показ у собеседника ──
const _npOf=pid=>{const p=typeof _hubPres!=='undefined'&&_hubPres[pid];return p&&p.online&&p.np&&p.np.t?p.np:null;};
function _npStatusHtml(np){return `<span class="np-st">${_NP_ICO}<span>Слушает: <b>${esc(np.t)}</b>${np.a?' — '+esc(np.a):''}</span></span>`;}
{const f=updateChatHeader;updateChatHeader=function(){
  const r=f.apply(this,arguments);
  try{const pid=activeChat,np=pid&&!pid.startsWith('g_')&&_npOf(pid),st=$('chStatus');
    if(np&&st){st.innerHTML=_npStatusHtml(np);st.className='ch-status on np';}}catch(e){}
  return r;
};}
// статус «слушает» поменялся — обновляем шапку (сам статус «в сети» по-прежнему перерисовывает её только при смене)
const _npLast={};
{const f=_presApply;_presApply=function(pid){
  const r=f.apply(this,arguments);
  const np=_npOf(pid),k=np?np.t+'|'+np.a:'';
  if(_npLast[pid]!==k){_npLast[pid]=k;if(activeChat===pid)updateChatHeader();}
  return r;
};}
// профиль собеседника — карточка «Сейчас слушает»
{const f=_ppRender;_ppRender=function(pid){
  const r=f.apply(this,arguments);
  try{const np=_npOf(pid),st=$('peerProfStatus');
    document.getElementById('ppNp')?.remove();
    if(np&&st)st.insertAdjacentHTML('afterend',`<div class="np-card" id="ppNp">${np.c?`<img src="${esc(np.c)}" alt="">`:`<span class="mm-cv-none">${_NP_ICO}</span>`}
      <div><span>Сейчас слушает</span><b>${esc(np.t)}</b><i>${esc(np.a||'')}</i></div><span class="np-eq"><i></i><i></i><i></i></span></div>`);
  }catch(e){}
  return r;
};}
// переключатель в медиатеке (вкладка «Все»)
{const f=_mxLib;_mxLib=function(){
  let h=f.apply(this,arguments);
  if(_mxS.chip==='all'){const on=_npShare()==='1';
    h+=`<div class="mx-card np-share" onclick="_npSetShare(_npShare()!=='1')"><span class="mm-cv-none">${_NP_ICO}</span>
      <div class="mx-card-t"><b>Показывать, что я слушаю</b><span>Друзья видят трек в чате и профиле</span></div><span class="np-share-sw${on?' on':''}"><i></i></span></div>`;}
  return h;
};}
