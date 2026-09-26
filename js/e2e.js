// ════════════════════════════════════════
// ── СКВОЗНОЕ ШИФРОВАНИЕ ЛИЧНЫХ ЧАТОВ (протокол Signal) + СИНК ИСТОРИИ ──
// • У каждого устройства свои ключи (e2e-core.js). Сервер знает только публичные.
// • Сообщение шифруется отдельно для КАЖДОГО устройства собеседника и для
//   других МОИХ устройств (так их видят все мои устройства).
// • Синк истории: расшифрованное сообщение кладётся в «сейф» (vault) на сервере,
//   зашифрованный ключом бэкапа. Ключ бэкапа запечатан паролем — новое
//   устройство после входа по паролю открывает всю историю. Сервер не может.
// • Файлы шифруются своим ключом до загрузки; ключ едет внутри сообщения.
// • Собеседник на старой версии (без ключей) — пишем как раньше, без шифрования.
// ════════════════════════════════════════
let _e2eOn=false;                  // ключи устройства есть и зарегистрированы, ключ бэкапа открыт
let _e2eMe=null;                   // {deviceId, identity, spk, oldSpks, opks, nextOpk}
let _e2eVk=null;                   // ключ бэкапа истории (base64)
let _e2eUser=null,_e2eIniting=false;
const _e2eDevCache={};             // user -> {ts, list:[{d,ik}]}
const _e2eWaiting={};              // ключ журнала -> запись, которую пока нечем расшифровать
let _e2eChain=Promise.resolve();   // все операции с сессиями — строго по очереди (храповик не терпит гонок)
const _e2eQ=fn=>{const p=_e2eChain.then(fn,fn);_e2eChain=p.catch(()=>{});return p;};
const _e2eK=k=>'e2e:'+myUsername+':'+k;
const _e2eAddr=(u,d)=>u+':'+d;
const _e2eEnc=o=>E2E.te.encode(JSON.stringify(o));
const _e2eDec=b=>JSON.parse(E2E.td.decode(b));

// ── Ключи устройства ──
async function _e2eLoad(){return await _idb.get(_e2eK('ident'));}
async function _e2eSave(){if(_e2eMe)await _idb.put(_e2eK('ident'),_e2eMe);}
async function _e2eRegister(){
  const opks=Object.entries(_e2eMe.opks).map(([id,k])=>({id:+id,pub:k.pub,priv:k.priv}));
  const b=E2E.bundleOf(_e2eMe.identity,_e2eMe.spk,opks);
  await api('/e2e/register',{deviceId:_e2eMe.deviceId,ik:b.ik,ikd:b.ikd,spk:b.spk,opks:b.opks});
}
async function _e2eTopUp(){
  const c=await api('/e2e/count?d='+_e2eMe.deviceId);
  if(!c.registered){await _e2eRegister();return;}
  if(c.count>=20)return;
  const fresh=await E2E.newPreKeys(_e2eMe.nextOpk,50);
  _e2eMe.nextOpk+=50;
  for(const k of fresh)_e2eMe.opks[k.id]={pub:k.pub,priv:k.priv};
  await _e2eSave();
  await api('/e2e/prekeys',{deviceId:_e2eMe.deviceId,opks:fresh.map(k=>({id:k.id,pub:E2E.b64(k.pub)}))});
}
// Подписанный предключ меняем раз в неделю (старый держим месяц — для запоздалых первых сообщений)
async function _e2eRotateSpk(){
  if(Date.now()-(_e2eMe.spk.ts||0)<7*864e5)return;
  const spk=await E2E.newSignedPreKey(_e2eMe.identity,_e2eMe.spk.id+1);
  _e2eMe.oldSpks=[_e2eMe.spk,...(_e2eMe.oldSpks||[])].filter(k=>Date.now()-(k.ts||0)<35*864e5).slice(0,5);
  _e2eMe.spk=spk;await _e2eSave();
  await api('/e2e/prekeys',{deviceId:_e2eMe.deviceId,spk:{id:spk.id,pub:E2E.b64(spk.pub),sig:E2E.b64(spk.sig)}});
}
async function _e2eInit(){
  if(_e2eIniting||!myUsername||typeof _apiToken!=='function'||!_apiToken()||typeof E2E==='undefined')return;
  if(_e2eUser===myUsername&&_e2eOn)return;
  _e2eIniting=true;
  try{
    if(_e2eUser!==myUsername){_e2eOn=false;_e2eMe=null;_e2eVk=null;}
    _e2eUser=myUsername;
    try{if(!crypto.subtle)throw 0;await crypto.subtle.generateKey({name:'X25519'},false,['deriveBits']);}
    catch(e){console.warn('[e2e] браузер не умеет X25519 — шифрование недоступно');return;}
    _e2eMe=await _e2eLoad();
    if(!_e2eMe){
      const identity=await E2E.newIdentity();
      const spk=await E2E.newSignedPreKey(identity,1);
      const opks={};for(const k of await E2E.newPreKeys(1,60))opks[k.id]={pub:k.pub,priv:k.priv};
      _e2eMe={deviceId:1+Math.floor(Math.random()*2147483000),identity,spk,oldSpks:[],opks,nextOpk:61};
      await _e2eSave();
      await _e2eRegister();
    }else{
      await _e2eTopUp().catch(()=>{});
      await _e2eRotateSpk().catch(()=>{});
    }
    _e2eVk=await _idb.get(_e2eK('vk'));
    _e2eOn=true;                                   // шифруем сразу; ключ бэкапа — только для сейфа истории
    setTimeout(_e2eRepairPlaceholders,500);
    _e2eNotifSync();
    if(!_e2eVk)_e2eAskVkFromDevices();             // пароля не знаем — ключ пришлёт другое моё устройство
    if(_e2eOn&&typeof _hubUp!=='undefined'&&_hubUp)_hubSend({t:'vault_sync',since:+(localStorage.getItem(_e2eK('vsince'))||0)});
  }catch(e){console.warn('[e2e] init:',e);}
  finally{_e2eIniting=false;}
}

// ── Ключ бэкапа истории: запечатан паролем ──
async function _e2eWrapWith(password){
  const pk=await E2E.passwordKey(password,myUsername);
  return E2E.b64(await E2E.sealBytes(pk,E2E.unb64(_e2eVk),'vk:'+myUsername));
}
async function _e2eUnwrap(password,wrapped){
  const pk=await E2E.passwordKey(password,myUsername);
  return E2E.b64(await E2E.openBytes(pk,E2E.unb64(wrapped),'vk:'+myUsername));
}
// Вход / регистрация / новый пароль после сброса: пароль известен — открываем или создаём ключ
async function _e2eOnPassword(password){
  try{
    const d=await api('/e2e/vaultkey');
    if(d.wrapped){_e2eVk=await _e2eUnwrap(password,d.wrapped);}
    else{
      _e2eVk=await E2E.randomKey();
      const r=await api('/e2e/vaultkey',{wrapped:await _e2eWrapWith(password)});
      if(r.wrapped&&r.wrapped!==(await _e2eWrapWith(password)))_e2eVk=await _e2eUnwrap(password,r.wrapped); // другое устройство успело первым
    }
    await _idb.put(_e2eK('vk'),_e2eVk);
    _e2eOn=false;_e2eUser=null;_e2eInit();
  }catch(e){console.warn('[e2e] vault key:',e);}
}
// ── Ключ бэкапа между своими устройствами (вместо просьбы ввести пароль) ──
// Новое устройство без пароля просит ключ; любое моё устройство с ключом присылает
// его, зашифровав протоколом Signal ТОЛЬКО для этого устройства. Сервер ключ не видит.
function _e2eAskVkFromDevices(){
  if(!_e2eMe||typeof _hubSend!=='function')return;
  _hubSend({t:'send',to:myUsername,payload:{type:'e2e_vk_req',d:_e2eMe.deviceId}});
}
async function _e2eSelfSignal(p){
  if(!_e2eMe)return;
  if(p.type==='e2e_vk_req'&&_e2eVk&&p.d&&p.d!==_e2eMe.deviceId){
    await _e2eQ(async()=>{
      const devs=(await _e2eDevices([myUsername]))[myUsername];
      const dv=devs.find(x=>x.d===p.d);if(!dv)return;
      const msg=await _e2eEncryptTo(myUsername,dv.d,dv.ik,_e2eEnc({vk:_e2eVk}));
      _hubSend({t:'send',to:myUsername,payload:{type:'e2e_vk',to:p.d,from:_e2eMe.deviceId,msg}});
    }).catch(e=>console.warn('[e2e] vk send',e));
  }else if(p.type==='e2e_vk'&&!_e2eVk&&p.to===_e2eMe.deviceId){
    try{
      const plain=await _e2eQ(()=>_e2eDecryptFrom({u:myUsername,d:p.from},p.msg));
      const vk=_e2eDec(plain).vk;if(!vk)return;
      _e2eVk=vk;await _idb.put(_e2eK('vk'),vk);
      // история: забираем сейф заново и перепроверяем «зашифрованные» сообщения
      try{localStorage.removeItem(_e2eK('vsince'));}catch(e){}
      if(typeof _hubUp!=='undefined'&&_hubUp)_hubSend({t:'vault_sync',since:0});
      for(const k of Object.keys(_e2eWaiting))_e2eRetry(k);
    }catch(e){console.warn('[e2e] vk recv',e);}
  }
}

// Смена пароля: тот же ключ бэкапа, запечатанный новым паролем
async function _e2eOnPasswordChange(newPassword){
  try{if(_e2eVk)await api('/e2e/vaultkey',{wrapped:await _e2eWrapWith(newPassword),replace:true});}catch(e){}
}
// ── Устройства собеседника и мои ──
// ── Ключ уведомлений (приложение Android) ──
// Отдельная пара X25519 устройства: собеседник шифрует под неё короткий текст для шторки.
// Приватная половина отдаётся фоновой части приложения (Java) — она показывает текст,
// даже когда приложение закрыто. Сервер и Google видят только шифр.
// Публичная половина подписана identity-ключом устройства — подменить её сервер не может.
const _NK_INFO=new TextEncoder().encode('SLON_Notif_v1');
async function _e2eNotifSync(){
  if(typeof IS_NATIVE==='undefined'||!IS_NATIVE||!_e2eMe||typeof _NP==='undefined'||!_NP.SlonSystem?.setNotifKey)return;
  try{
    const S=crypto.subtle;
    if(!_e2eMe.nk){
      const k=await S.generateKey({name:'X25519'},true,['deriveBits']);
      const pub=new Uint8Array(await S.exportKey('raw',k.publicKey));
      const sk=await S.importKey('jwk',_e2eMe.identity.sign.priv,{name:'Ed25519'},false,['sign']);
      const sig=new Uint8Array(await S.sign({name:'Ed25519'},sk,pub));
      _e2eMe.nk={pub:E2E.b64(pub),sig:E2E.b64(sig),priv:(await S.exportKey('jwk',k.privateKey)).d};
      await _e2eSave();
    }
    const flag=_e2eK('nkreg');
    if(localStorage.getItem(flag)!==_e2eMe.nk.pub){
      await api('/e2e/nk',{deviceId:_e2eMe.deviceId,nk:_e2eMe.nk.pub,sig:_e2eMe.nk.sig});
      localStorage.setItem(flag,_e2eMe.nk.pub);
    }
    await _NP.SlonSystem.setNotifKey({addr:_e2eAddr(myUsername,_e2eMe.deviceId),priv:_e2eMe.nk.priv});
  }catch(e){console.warn('[e2e] nk',e);}
}
const _nkOk={};                    // проверенные подписи ключей уведомлений
async function _e2eSealNotif(x,text){
  if(!x.nk||!x.nks)return null;
  const S=crypto.subtle,u=E2E.unb64,id=x.ik+x.nk;
  if(_nkOk[id]===undefined){
    try{const vk=await S.importKey('raw',u(x.ik),{name:'Ed25519'},false,['verify']);
      _nkOk[id]=await S.verify({name:'Ed25519'},vk,u(x.nks),u(x.nk));}catch(e){_nkOk[id]=false;}
  }
  if(!_nkOk[id])return null;
  const eph=await S.generateKey({name:'X25519'},true,['deriveBits']);
  const pub=await S.importKey('raw',u(x.nk),{name:'X25519'},false,[]);
  const shared=new Uint8Array(await S.deriveBits({name:'X25519',public:pub},eph.privateKey,256));
  const hk=await S.importKey('raw',shared,'HKDF',false,['deriveBits']);
  const key=await S.importKey('raw',await S.deriveBits({name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),info:_NK_INFO},hk,256),'AES-GCM',false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await S.encrypt({name:'AES-GCM',iv},key,E2E.te.encode(String(text).slice(0,150))));
  const ep=new Uint8Array(await S.exportKey('raw',eph.publicKey));
  const out=new Uint8Array(32+12+ct.length);out.set(ep);out.set(iv,32);out.set(ct,44);
  return E2E.b64(out);
}
function _e2ePreviewOf(p){
  const k=p.k||'text';
  if(k==='text')return p.text||'';
  return {photo:'📷 Фото',voice:'🎙️ Голосовое сообщение',slon:'🐘 Слонкружок',file:'📎 '+(p.name||'Файл')}[k]||'Новое сообщение';
}

async function _e2eDevices(users){
  const need=users.filter(u=>!_e2eDevCache[u]||Date.now()-_e2eDevCache[u].ts>60000);
  if(need.length){
    const d=await api('/e2e/devices?u='+need.join(','));
    for(const u of need)_e2eDevCache[u]={ts:Date.now(),list:d.devices?.[u]||[]};
  }
  const out={};for(const u of users)out[u]=_e2eDevCache[u].list;
  return out;
}
async function _e2eSessions(addr){return (await _idb.get(_e2eK('s:'+addr)))||[];}
async function _e2eSetSessions(addr,arr){await _idb.put(_e2eK('s:'+addr),arr.slice(0,5));}

// Зашифровать для одного устройства (сессия есть — продолжаем храповик, нет — X3DH)
async function _e2eEncryptTo(u,d,ik,bytes){
  const addr=_e2eAddr(u,d);
  let arr=await _e2eSessions(addr);
  if(arr.length&&arr[0].remoteIk!==ik)arr=[];      // устройство переустановили — новые ключи
  if(!arr.length){
    const b=await api('/e2e/bundle?u='+encodeURIComponent(u)+'&d='+d);
    if(b.bundle.ik!==ik)throw new Error('ключ устройства изменился');
    arr=[await E2E.initiate(_e2eMe.identity,b.bundle)];
  }
  const msg=await E2E.encrypt(arr[0],bytes);
  await _e2eSetSessions(addr,arr);
  return msg;
}
// Зашифровать сообщение: копии для устройств собеседника (recPeer) и моих других (recSelf)
async function _e2eSeal(chat,payload){
  return _e2eQ(async()=>{
    const users=chat==='saved'?[myUsername]:[chat,myUsername];
    const devs=await _e2eDevices(users);
    if(chat!=='saved'&&!devs[chat].length)return null;       // у собеседника старая версия
    const bytes=_e2eEnc(payload),from={u:myUsername,d:_e2eMe.deviceId};
    const peer={},self={},n={},prev=_e2ePreviewOf(payload);
    if(chat!=='saved')for(const x of devs[chat]){
      try{peer[_e2eAddr(chat,x.d)]=await _e2eEncryptTo(chat,x.d,x.ik,bytes);}catch(e){console.warn('[e2e] to',chat,x.d,e);continue;}
      try{const s=await _e2eSealNotif(x,prev);if(s)n[_e2eAddr(chat,x.d)]=s;}catch(e){}
    }
    for(const x of devs[myUsername]){
      if(x.d===_e2eMe.deviceId)continue;
      try{self[_e2eAddr(myUsername,x.d)]=await _e2eEncryptTo(myUsername,x.d,x.ik,bytes);}catch(e){console.warn('[e2e] self',x.d,e);}
    }
    if(chat!=='saved'&&!Object.keys(peer).length)return null;
    return {self:{from,c:self},peer:{from,c:peer},n};
  });
}

// Расшифровать одну копию (сессия есть — пробуем по очереди; первое сообщение — X3DH)
async function _e2eDecryptFrom(from,msg){
  const addr=_e2eAddr(from.u,from.d);
  const arr=await _e2eSessions(addr);
  for(let i=0;i<arr.length;i++){
    try{
      const r=await E2E.decrypt(arr[i],msg);
      arr.splice(i,1);arr.unshift(r.st);await _e2eSetSessions(addr,arr);
      return r.plain;
    }catch(e){}
  }
  if(!msg.x)throw new Error('нет сессии');
  const x=msg.x;
  const spk=[_e2eMe.spk,...(_e2eMe.oldSpks||[])].find(k=>k.id===x.spk);
  if(!spk)throw new Error('подписанный предключ устарел');
  const opk=x.opk!=null?_e2eMe.opks[x.opk]:null;
  if(x.opk!=null&&!opk)throw new Error('одноразовый предключ уже использован');
  const st=await E2E.respond(_e2eMe.identity,spk,opk,x);
  const r=await E2E.decrypt(st,msg);
  if(x.opk!=null){delete _e2eMe.opks[x.opk];await _e2eSave();_e2eTopUp().catch(()=>{});}
  arr.unshift(r.st);await _e2eSetSessions(addr,arr);
  return r.plain;
}

// ── Сейф истории: расшифрованное — на сервер под ключом бэкапа ──
async function _e2eVaultPut(key,ev,payload){
  if(!_e2eVk)return;
  const blob=E2E.b64(await E2E.sealBytes(_e2eVk,_e2eEnc({ev,p:payload}),'vault:'+myUsername+':'+key));
  await _idb.put(_e2eK('v:'+key),blob);
  if(typeof _hubSend==='function')_hubSend({t:'vault_put',key,blob});
}
async function _e2eVaultGet(key){
  const blob=await _idb.get(_e2eK('v:'+key));
  if(!blob||!_e2eVk)return null;
  try{return _e2eDec(await E2E.openBytes(_e2eVk,E2E.unb64(blob),'vault:'+myUsername+':'+key));}catch(e){return null;}
}
// Пришли записи сейфа (при подключении и живьём с других устройств)
async function _e2eOnVault(items){
  let max=+(localStorage.getItem(_e2eK('vsince'))||0);
  for(const it of items||[]){
    await _idb.put(_e2eK('v:'+it.key),it.blob);
    if(it.upd>max)max=it.upd;
    if(_e2eWaiting[it.key])_e2eRetry(it.key);
  }
  try{localStorage.setItem(_e2eK('vsince'),String(max));}catch(e){}
}
// Починка: сообщения-заглушки «Зашифрованное сообщение…» перерасшифровываем.
// Их шифр на сервере цел — просто когда-то расшифровка не успела начаться.
let _e2eRepairing=false;
function _e2eRepairPlaceholders(){
  if(_e2eRepairing)return;
  for(const k of Object.keys(_e2eWaiting))_e2eRetry(k);
  let has=false;
  for(const hist of Object.values(chatHist))for(const m of hist||[])if(m&&(m._e2eWait||(typeof m.text==='string'&&m.text.startsWith('🔒 Зашифрованное сообщение'))))has=true;
  if(!has||typeof _hubUp==='undefined'||!_hubUp)return;
  _e2eRepairing=true;
  // заново забираем журнал — заглушки заменятся настоящими сообщениями (см. _mlOnAdd)
  _hubSend({t:'ml_sync',since:0});
  setTimeout(()=>{_e2eRepairing=false;},15000);
}

// Сообщение было «недоступно» — ключ появился, перерисовываем
function _e2eRetry(key){
  const rec=_e2eWaiting[key];delete _e2eWaiting[key];
  const hist=chatHist[rec.chat];if(!hist)return;
  const i=hist.findIndex(m=>m._mk===key);
  if(i>=0){hist.splice(i,1);document.querySelector('[data-msg-id="'+rec.id+'"]')?.remove();}
  _mlOnAdd(key,rec);
}

// Открыть запись журнала → расшифрованное содержимое (или null)
// Ключи устройства ещё грузятся — ждём (до ~15 с), иначе сообщение ошибочно станет «недоступным»
async function _e2eWaitReady(){
  for(let i=0;i<75&&!(_e2eMe&&_e2eUser===myUsername);i++){
    if(!_e2eIniting&&!_e2eMe)_e2eInit();
    await new Promise(r=>setTimeout(r,200));
  }
  return !!_e2eMe;
}
async function _e2eOpen(key,rec){
  const ev=rec.ev||0;
  await _e2eWaitReady();
  const cached=await _idb.get(_e2eK('p:'+key+':'+ev));
  if(cached)return cached;
  return _e2eQ(async()=>{
    const again=await _idb.get(_e2eK('p:'+key+':'+ev));if(again)return again;
    const my=_e2eMe&&rec.e?.c?.[_e2eAddr(myUsername,_e2eMe.deviceId)];
    let payload=null;
    if(my){
      try{payload=_e2eDec(await _e2eDecryptFrom(rec.e.from,my));}
      catch(e){console.warn('[e2e] decrypt',key,e.message);}
    }
    if(!payload){
      const v=await _e2eVaultGet(key);
      if(v&&(v.ev||0)>=ev)payload=v.p;
    }
    if(!payload){_e2eWaiting[key]=rec;return null;}
    await _idb.put(_e2eK('p:'+key+':'+ev),payload);
    if(my)_e2eVaultPut(key,ev,payload);         // для будущих устройств
    return payload;
  });
}

// ── Отправка ──
// payload — всё содержимое сообщения; снаружи остаются только id/время/тип «e2e»
async function _e2ePost(chat,key,rec){
  const payload={};
  for(const f of ['k','text','name','mime','size','dur','wave','m','mk','reply'])if(rec[f]!=null)payload[f]=rec[f];
  const sealed=await _e2eSeal(chat,payload).catch(e=>{console.warn('[e2e] seal',e);return null;});
  if(!sealed)return false;
  await _idb.put(_e2eK('p:'+key+':0'),payload);
  _e2eVaultPut(key,0,payload);
  const base={id:rec.id,ts:rec.ts,k:'e2e'};
  const recPeer={...base,e:sealed.peer};if(Object.keys(sealed.n||{}).length)recPeer.n=sealed.n;
  const ok=_hubSend({t:'ml_post',chat,key,rec:{...base,e:sealed.self},recPeer});
  if(!ok)return false;
  // веб-пуш — без текста: сервер и почтальоны пушей не должны видеть переписку
  // (в приложении Android текст приходит зашифрованным под ключ уведомлений — см. выше)
  if(chat!=='saved'&&typeof _pushMsg==='function')_pushMsg(chat,'Новое сообщение');
  const m=(chatHist[chat]||[]).find(x=>x.id===rec.id);if(m){m._e2e=true;m._mk=key;}
  return true;
}
// Правка зашифрованного сообщения: новая зашифрованная версия (ev+1)
async function _e2eEdit(chat,key,msg,text){
  const ev=(msg._ev||0)+1;
  const payload={k:'text',text};
  const sealed=await _e2eSeal(chat,payload).catch(()=>null);
  if(!sealed)return false;
  await _idb.put(_e2eK('p:'+key+':'+ev),payload);
  _e2eVaultPut(key,ev,payload);
  msg._ev=ev;
  return _hubSend({t:'ml_patch',chat,key,patch:{e:sealed.self,ev,edited:true},patchPeer:{e:sealed.peer,ev,edited:true}});
}

// ── Файлы: шифруем до загрузки, ключ — внутрь сообщения ──
async function _e2eEncryptMedia(dataUrl,mime){
  const [,b64]=dataUrl.split(',');
  const bytes=E2E.unb64(b64||'');
  const mk=await E2E.randomKey();
  const sealed=await E2E.sealBytes(mk,bytes,'media');
  return {mk,blob:new Blob([sealed],{type:'application/octet-stream'}),mime};
}
async function _e2eFetchMedia(mid,mk,mime){
  const r=await fetch(_mediaUrl(mid));
  if(!r.ok)throw new Error('медиа не найдено');
  const plain=await E2E.openBytes(mk,new Uint8Array(await r.arrayBuffer()),'media');
  const blob=new Blob([plain],{type:mime||'application/octet-stream'});
  return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(blob);});
}

// Выход: устройство убирается из справочника, ключи стираются
async function _e2eLogout(){
  try{if(_e2eMe)await api('/e2e/remove',{deviceId:_e2eMe.deviceId});}catch(e){}
  try{await _idb.del(_e2eK('ident'));await _idb.del(_e2eK('vk'));}catch(e){}
  _e2eOn=false;_e2eMe=null;_e2eVk=null;_e2eUser=null;
}

// Код безопасности с собеседником (сравнить при встрече — как в Signal)
async function _e2eSafetyCode(peer){
  const devs=(await _e2eDevices([peer]))[peer];
  if(!devs.length||!_e2eMe)return null;
  return E2E.fingerprint(E2E.b64(_e2eMe.identity.sign.pub),devs[0].ik);
}

setInterval(()=>{if(_fbMode&&myUsername&&!_e2eOn)_e2eInit();},5000);
// нет ключа бэкапа — периодически просим у своих устройств (вдруг другое устройство появилось в сети)
setInterval(()=>{if(_e2eOn&&!_e2eVk)_e2eAskVkFromDevices();},60000);
setInterval(()=>{if(_e2eOn){_e2eTopUp().catch(()=>{});_e2eRotateSpk().catch(()=>{});}},6*3600e3);
