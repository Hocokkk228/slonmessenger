// ════════════════════════════════════════
// ── ЖИВОЕ СОЕДИНЕНИЕ С НАШИМ СЕРВЕРОМ (Cloudflare, хаб аккаунта) ──
// Одно WebSocket-соединение на устройство: через него идут сообщения,
// «печатает», звонки, синк журнала и профиля. Firebase остаётся запасным
// путём (нет токена / нет соединения) и мостом для старых версий приложения.
// ════════════════════════════════════════
let _hubWs=null,_hubUp=false,_hubUser=null,_hubRetry=0,_hubTimer=null,_hubPing=null,_hubAwaitVault=false;
const _hubPres={};   // pid -> {online,ts,ls} с нашего сервера

function _hubMlKey(){return _getAccountPrefix(myUsername)+'hubMlUpd';}
function _hubSend(o){
  if(!_hubUp||!_hubWs||_hubWs.readyState!==1)return false;
  try{_hubWs.send(JSON.stringify(o));return true;}catch(e){return false;}
}
function _hubConnect(){
  if(!myUsername||typeof _apiToken!=='function'||!_apiToken())return;
  if(_hubWs&&(_hubWs.readyState===0||_hubWs.readyState===1)&&_hubUser===myUsername)return;
  try{_hubWs?.close();}catch(e){}
  _hubUser=myUsername;
  const ls=(typeof myPrivacy!=='undefined'&&myPrivacy.lastSeen==='nobody')?'0':'1';
  const url=API_URL.replace(/^http/,'ws')+'/ws?token='+encodeURIComponent(_apiToken())+'&dev='+encodeURIComponent(_myDeviceId||'')+'&ls='+ls;
  const ws=new WebSocket(url);
  _hubWs=ws;
  ws.onopen=()=>{
    if(_hubWs!==ws)return;
    _hubUp=true;_hubRetry=0;
    // догоняем журнал сообщений с последней синхронизации
    // при шифровании сначала забираем сейф истории — чтобы журнал сразу расшифровался
    if(typeof _e2eOn!=='undefined'&&_e2eOn){_hubAwaitVault=true;_hubSend({t:'vault_sync',since:+(localStorage.getItem(_e2eK('vsince'))||0)});}
    else _hubSend({t:'ml_sync',since:+(localStorage.getItem(_hubMlKey())||0)});
    clearInterval(_hubPing);_hubPing=setInterval(()=>_hubSend({t:'ping'}),25000);
    _hubPollPresence();
  };
  ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(x){return;}_hubDispatch(m);};
  ws.onclose=ev=>{
    if(_hubWs!==ws)return;
    _hubUp=false;clearInterval(_hubPing);
    if(ev.code===1008||ev.code===4401)return;          // токен отозван — переподключаться бессмысленно
    // три неудачи подряд — возможно, сессию отозвали (смена пароля/выход): проверяем
    if(_hubRetry===3&&typeof _apiCheckSession==='function')_apiCheckSession();
    const wait=Math.min(30000,1000*Math.pow(2,_hubRetry++));
    clearTimeout(_hubTimer);_hubTimer=setTimeout(_hubConnect,wait);
  };
  ws.onerror=()=>{};
}
function _hubMlUpd(upd){if(upd>+(localStorage.getItem(_hubMlKey())||0))try{localStorage.setItem(_hubMlKey(),String(upd));}catch(e){}}

async function _hubDispatch(m){
  switch(m.t){
    case 'data':_handleIncoming(m.from,m.payload);break;
    case 'batch':for(const i of m.items||[])_handleIncoming(i.from,i.payload);break;
    case 'self':{
      const p=m.payload||{};
      if(p.type==='profile_sync'){if(typeof _psRemote==='function')_psRemote(p);}
      else if(p.type==='call_sync'){if(typeof _callSyncApply==='function')_callSyncApply(p.key,p);}
      break;}
    case 'ml':
      if(m.rec?.del||m.rec?.gone||m.chg)_mlOnChange(m.key,m.rec);
      else await _mlOnAdd(m.key,m.rec);
      _hubMlUpd(m.upd);break;
    case 'ml_batch':
      for(const it of m.items||[]){
        if(it.rec?.del||it.rec?.gone)_mlOnChange(it.key,it.rec);
        else{await _mlOnAdd(it.key,it.rec);_mlOnChange(it.key,it.rec);}
        _hubMlUpd(it.upd);
      }
      break;
    case 'vault':await _e2eOnVault([m]);break;
    case 'vault_batch':
      await _e2eOnVault(m.items);
      if(m.more){_hubSend({t:'vault_sync',since:+(localStorage.getItem(_e2eK('vsince'))||0)});break;}
      if(_hubAwaitVault){_hubAwaitVault=false;_hubSend({t:'ml_sync',since:+(localStorage.getItem(_hubMlKey())||0)});}
      break;
    case 'ml_ack':{
      for(const [chat,hist] of Object.entries(chatHist)){
        const msg=(hist||[]).find(x=>x&&(x._mk===m.key||(_mlKey(x.ts,x.id)===m.key)));
        if(msg){msg._mk=m.key;if(msg.status==='sent'||!msg.status){msg.status='delivered';_updateMsgStatus(msg.id,'delivered');saveAll();}break;}
      }
      break;}
  }
}

// ── «В сети» / «был(а)»: наш сервер + старые версии через Firebase ──
async function _hubPollPresence(){
  if(!myUsername||!_apiToken())return;
  const ids=Object.keys(peerNames).filter(p=>p&&p!=='ai'&&p!=='saved'&&!p.startsWith('g_')&&!(typeof _isChannelId==='function'&&_isChannelId(p))&&/^[a-z0-9_]{3,20}$/.test(p));
  for(let i=0;i<ids.length;i+=100){
    try{
      const d=await api('/presence?u='+ids.slice(i,i+100).join(','));
      for(const [pid,p] of Object.entries(d.presence||{})){_hubPres[pid]=p;_presApply(pid);}
    }catch(e){}
  }
}
setInterval(()=>{if(_hubUp&&document.visibilityState==='visible')_hubPollPresence();},25000);

// Переподключение: вернулись в приложение, появилась сеть, сменился аккаунт
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){_hubConnect();if(_hubUp)_hubPollPresence();}});
window.addEventListener('online',()=>{_hubRetry=0;_hubConnect();});
setInterval(()=>{if(_fbMode&&myUsername&&(!_hubWs||_hubUser!==myUsername))_hubConnect();},3000);
