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
  try{
    const s=JSON.stringify(o);
    // шлюз Яндекса пропускает сообщения до ~128 КБ — крупное отправляем тем же протоколом по HTTP
    if(SRV_KIND==='yc'&&s.length>100000){api('/hub',{m:o}).then(d=>{if(d&&d.reply)_hubDispatch(d.reply);}).catch(e=>console.warn('hub http:',e));return true;}
    _hubWs.send(s);return true;
  }catch(e){return false;}
}
// ── «Обновление…» сверху списка чатов: пока догоняем пропущенное (как Updating… в Telegram) ──
let _updOn=false,_updT=null,_updSince=0;
function _updShow(on){
  const el=document.getElementById('sbUpd');if(!el)return;
  clearTimeout(_updT);
  if(on){
    if(_updOn)return;
    _updT=setTimeout(()=>{_updOn=true;_updSince=Date.now();el.classList.remove('done');el.classList.add('on');},350);   // быстро догнали — не мигаем
  }else{
    if(!_updOn)return;
    _updT=setTimeout(()=>{
      _updOn=false;el.classList.add('done');                // галочка, потом плавно сворачивается
      _updT=setTimeout(()=>{el.classList.remove('on');setTimeout(()=>el.classList.remove('done'),450);},550);
    },Math.max(0,700-(Date.now()-_updSince)));
  }
}
// ── Пачка из журнала — сохраняем один раз в конце, а не после каждого сообщения ──
let _hubHold=0,_hubHoldDirty=false;
const _hubSave0=saveAll;
saveAll=function(){if(_hubHold){_hubHoldDirty=true;return;}return _hubSave0.apply(this,arguments);};
async function _hubBatch(fn){
  _hubHold++;
  try{await fn();}
  finally{if(!--_hubHold&&_hubHoldDirty){_hubHoldDirty=false;_hubSave0();}}
}
function _hubConnect(){
  if(!myUsername||typeof _apiToken!=='function'||!_apiToken())return;
  if(_hubWs&&(_hubWs.readyState===0||_hubWs.readyState===1)&&_hubUser===myUsername)return;
  _updShow(true);
  try{_hubWs?.close();}catch(e){}
  _hubUser=myUsername;
  const ls=(typeof myPrivacy!=='undefined'&&myPrivacy.lastSeen==='nobody')?'0':'1';
  const url=_wsUrl()+'?token='+encodeURIComponent(_apiToken())+'&dev='+encodeURIComponent(_myDeviceId||'')+'&ls='+ls;
  const ws=new WebSocket(url);
  _hubWs=ws;
  ws.onopen=()=>{
    if(_hubWs!==ws)return;
    _hubUp=true;_hubRetry=0;
    setTimeout(()=>{try{_sendRead(activeChat,true);}catch(e){}},1500);
    setTimeout(()=>{try{if(typeof _obDrain==='function')_obDrain();}catch(e){}},1200);
    // догоняем журнал сообщений с последней синхронизации
    // при шифровании сначала забираем сейф истории — чтобы журнал сразу расшифровался
    if(typeof _e2eOn!=='undefined'&&_e2eOn){_hubAwaitVault=true;_hubSend({t:'vault_sync',since:+(localStorage.getItem(_e2eK('vsince'))||0)});}
    else _hubSend({t:'ml_sync',since:+(localStorage.getItem(_hubMlKey())||0)});
    // у Яндекса каждое сообщение — вызов функции: пингуем раз в 8 минут (шлюз рвёт после 10 минут тишины)
    clearInterval(_hubPing);_hubPing=setInterval(()=>_hubSend({t:'ping'}),SRV_KIND==='yc'?480000:25000);
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
    case 'pres':for(const [pid,p] of Object.entries(m.presence||{})){_hubPres[pid]=p;_presApply(pid);}break;
    case 'reauth':try{_hubWs?.close();}catch(e){}break;        // сервер потерял соединение — переподключимся
    case 'pong':break;
    case 'batch':await _hubBatch(async()=>{for(const i of m.items||[])_handleIncoming(i.from,i.payload);});break;
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
      await _hubBatch(async()=>{
        for(const it of m.items||[]){
          if(it.rec?.del||it.rec?.gone)_mlOnChange(it.key,it.rec);
          else{await _mlOnAdd(it.key,it.rec);_mlOnChange(it.key,it.rec);}
          _hubMlUpd(it.upd);
        }
      });
      // сервер отдаёт до 1000 записей — если упёрлись, догоняем дальше
      if(m.more||(!m.full&&(m.items||[]).length>=1000)){_hubSend({t:'ml_sync',since:+(localStorage.getItem(_hubMlKey())||0)});break;}
      _updShow(false);
      break;
    case 'vault':await _e2eOnVault([m]);break;
    case 'vault_batch':
      await _hubBatch(()=>_e2eOnVault(m.items));
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
  if(SRV_KIND==='yc'){
    // у Яндекса статусы — через сокет (бесплатно), а не HTTP-запросами
    const ids=Object.keys(peerNames).filter(p=>p&&/^[a-z0-9_]{3,20}$/.test(p)&&!p.startsWith('g_'));
    for(let i=0;i<ids.length;i+=200)_hubSend({t:'pres_q',u:ids.slice(i,i+200)});
    return;
  }
  const ids=Object.keys(peerNames).filter(p=>p&&p!=='ai'&&p!=='saved'&&!p.startsWith('g_')&&!(typeof _isChannelId==='function'&&_isChannelId(p))&&/^[a-z0-9_]{3,20}$/.test(p));
  for(let i=0;i<ids.length;i+=100){
    try{
      const d=await api('/presence?u='+ids.slice(i,i+100).join(','));
      for(const [pid,p] of Object.entries(d.presence||{})){_hubPres[pid]=p;_presApply(pid);}
    }catch(e){}
  }
}
setInterval(()=>{if(_hubUp&&document.visibilityState==='visible')_hubPollPresence();},SRV_KIND==='yc'?60000:25000);

// Переподключение: вернулись в приложение, появилась сеть, сменился аккаунт
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){_hubConnect();if(_hubUp)_hubPollPresence();}});
window.addEventListener('online',()=>{_hubRetry=0;_hubConnect();});
setInterval(()=>{if(_fbMode&&myUsername&&(!_hubWs||_hubUser!==myUsername))_hubConnect();},3000);
