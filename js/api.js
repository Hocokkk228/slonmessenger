// ════════════════════════════════════════
// ── SLON API (Cloudflare Workers + D1) ──
// Переезд с Firebase, этап 1: аккаунты и вход. Пароль проверяет сервер,
// устройство хранит только токен сессии (sl_tok_{username}).
// ════════════════════════════════════════
const API_URL='https://slon-api.hopasup789.workers.dev';

function _apiToken(u){try{return JSON.parse(localStorage.getItem('sl_tok_'+(u||myUsername)))||'';}catch(e){return '';}}
function _apiSetToken(u,t){try{if(t)localStorage.setItem('sl_tok_'+u,JSON.stringify(t));else localStorage.removeItem('sl_tok_'+u);}catch(e){}}

// Запрос к API. Ошибки бросаются как Error с .code и понятным .message
async function api(path,body,opts={}){
  const headers={'Content-Type':'application/json'};
  const tok=opts.token!==undefined?opts.token:_apiToken();
  if(tok)headers.Authorization='Bearer '+tok;
  let r;
  try{
    r=await fetch(API_URL+path,{method:body!==undefined?'POST':'GET',headers,body:body!==undefined?JSON.stringify(body):undefined});
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
    if(list.length){ICE_SERVERS.splice(0,ICE_SERVERS.length,{urls:'stun:stun.cloudflare.com:3478'},...list);}
  }catch(e){}
}
setTimeout(_apiLoadTurn,4000);
setInterval(_apiLoadTurn,12*3600e3);
