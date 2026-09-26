// ════════════════════════════════════════
// ── SLON API (Cloudflare Workers + D1) ──
// Переезд с Firebase, этап 1: аккаунты и вход. Пароль проверяет сервер,
// устройство хранит только токен сессии (sl_tok_{username}).
// ════════════════════════════════════════
// Адрес сервера. По умолчанию — Cloudflare. Но:
//  • если приложение открыто С САМОГО сервера SLON (свой хостинг раздаёт и сайт, и API
//    на одном адресе) — берём этот же адрес автоматически;
//  • можно жёстко задать: localStorage['sl_api']='https://мой-сервер' (работает и в APK).
// ── Сервер в Yandex Cloud (доступен в России без VPN; бесплатный уровень) ──
// Функция отвечает на HTTP (маршрут в ?p=), шлюз держит WebSocket, медиа лежат в Object Storage.
const SLON_YC={
  api:'https://functions.yandexcloud.net/d4ep3gski8r58v9am28r',
  gw:'https://d5ddipguuif2klnc52cm.fovt0b64.apigw.yandexcloud.net',
  media:'https://storage.yandexcloud.net/slon-media-86ea6642/m/'
};
// Какой сервер: 'yc' (Яндекс) или 'cf' (Cloudflare). Можно задать вручную: localStorage['sl_srv']='"yc"'.
const SRV_KIND=(()=>{
  try{const o=JSON.parse(localStorage.getItem('sl_srv')||'null');if(o==='yc'||o==='cf')return o;}catch(e){}
  if(window.SLON_SRV==='yc'||window.SLON_SRV==='cf')return window.SLON_SRV;   // копия сайта задаёт сама
  return 'yc';                     // основной сервер — Яндекс (работает в РФ без VPN); Cloudflare — только вручную
})();
const API_URL=(()=>{
  if(SRV_KIND==='yc')return SLON_YC.api;
  try{const o=localStorage.getItem('sl_api');if(o)return String(JSON.parse(o)||o).replace(/\/+$/,'');}catch(e){}
  try{
    const h=location.hostname;
    if(location.protocol!=='file:'&&h&&!/(^|\.)github\.io$/i.test(h)&&!/^(localhost|127\.|\[?::1)/i.test(h))
      return location.origin;      // свой сервер: и сайт, и API тут же
  }catch(e){}
  return 'https://slon-api.hopasup789.workers.dev';
})();

// Адреса под выбранный сервер
function _apiUrl(path){return SRV_KIND==='yc'?API_URL+'?p='+encodeURIComponent(path):API_URL+path;}
function _wsUrl(){return (SRV_KIND==='yc'?SLON_YC.gw:API_URL).replace(/^http/,'ws')+'/ws';}
function _mediaUrl(id){return SRV_KIND==='yc'?SLON_YC.media+id:API_URL+'/media/'+id;}
// фоновой службе Android нужен адрес, у которого есть /ws и /push/fcm — у Яндекса это шлюз
const _BG_API=SRV_KIND==='yc'?SLON_YC.gw:API_URL;

function _apiToken(u){try{return JSON.parse(localStorage.getItem('sl_tok_'+(u||myUsername)))||'';}catch(e){return '';}}
function _apiSetToken(u,t){try{if(t)localStorage.setItem('sl_tok_'+u,JSON.stringify(t));else localStorage.removeItem('sl_tok_'+u);}catch(e){}}

// Запрос к API. Ошибки бросаются как Error с .code и понятным .message
// Сбои сервера/сети — повторяем (все наши запросы безопасно повторять)
async function api(path,body,opts={}){
  for(let i=0;;i++){
    try{return await _apiOnce(path,body,opts);}
    catch(e){
      const retry=(e.code==='network'||(e.status>=500&&e.status<600))&&i<2;
      if(!retry)throw e;
      await new Promise(r=>setTimeout(r,600*(i+1)));
    }
  }
}
async function _apiOnce(path,body,opts={}){
  const headers={'Content-Type':'application/json'};
  const tok=opts.token!==undefined?opts.token:_apiToken();
  if(tok)headers.Authorization='Bearer '+tok;
  let r;
  try{
    r=await fetch(_apiUrl(path),{method:body!==undefined?'POST':'GET',headers,body:body!==undefined?JSON.stringify(body):undefined});
  }catch(e){const x=new Error('Нет интернета — проверь соединение');x.code='network';throw x;}
  let d={};try{d=await r.json();}catch(e){}
  if(!r.ok||d.ok===false){const x=new Error(d.message||('Ошибка сервера ('+r.status+')'));x.code=d.error||('http_'+r.status);x.status=r.status;throw x;}
  return d;
}
function _apiDevice(){return (typeof _myDeviceId!=='undefined'&&_myDeviceId)||'';}

// Устройства, вошедшие ещё до переезда, получают токен сами — без повторного входа
// (по сохранённому на устройстве хешу пароля, после этого он удаляется)
async function _apiEnsureToken(){
  if(!myUsername||_apiToken())return;
  const cached=(()=>{try{return JSON.parse(localStorage.getItem('sl_pass_'+myUsername))||'';}catch(e){return '';}})();
  if(!/^[0-9a-f]{64}$/.test(cached))return;
  try{
    const d=await api('/auth/login',{u:myUsername,h:cached,device:_apiDevice()},{token:''});
    if(d.status==='ok'&&d.token){_apiSetToken(myUsername,d.token);try{localStorage.removeItem('sl_pass_'+myUsername);}catch(e){}}
  }catch(e){
    if(e.code==='wrong_password'){toast('Пароль изменён — войди снова',5000);setTimeout(()=>doLogout(),2000);}
  }
}
// Токен отозван (сменили пароль / сброс админом / выход на другом устройстве)
async function _apiCheckSession(){
  if(!myUsername)return;
  if(!_apiToken()){await _apiEnsureToken();return;}
  try{await api('/auth/me');}
  catch(e){
    if(e.status===401){_apiSetToken(myUsername,'');toast('Сессия завершена — войди снова',5000);setTimeout(()=>doLogout(),2000);}
  }
}

// Свой TURN Cloudflare для звонков: подменяем список ICE-серверов «на месте»
// (ICE_SERVERS — общий массив, его читают все звонки). Нет ключа — остаётся старый.
async function _apiLoadTurn(){
  if(!_apiToken())return;
  try{
    const d=await api('/turn');
    const list=(d.iceServers||[]).filter(s=>s&&s.urls);
    if(list.length){ICE_SERVERS.splice(0,ICE_SERVERS.length,{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:'stun:stun.nextcloud.com:3478'},{urls:'stun:stun.zadarma.com:3478'},...list);}
  }catch(e){}
}
setTimeout(_apiLoadTurn,4000);
setInterval(_apiLoadTurn,12*3600e3);
