// Найденные тексты между устройствами одного аккаунта: только через зашифрованный сейф.
(function(){
  if(typeof _lrcPut!=='function'||typeof _e2eOnVault!=='function')return;
  const rawPut=_lrcPut,rawVault=_e2eOnVault,rawLoad=_mmLoad,rawRefresh=_mmCloudRefresh;
  const PREFIX='lrc1_';let running=false,receiving=false,scanning=false,lastScan=0,lastScanUser='',scanTimer=0,lastSend=0,backfillUser='';
  const storageKey=(u,k)=>'sl_u_'+u+'_lyrics_sync_'+k;
  function read(u,k,fallback){try{const v=JSON.parse(localStorage.getItem(storageKey(u,k))||'null');return v&&typeof v==='object'?v:fallback;}catch(e){return fallback;}}
  function write(u,k,v){try{localStorage.setItem(storageKey(u,k),JSON.stringify(v));return true;}catch(e){console.warn('[lyrics sync] storage',e);return false;}}
  async function hash(s){const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');}
  async function vaultHash(s){
    const key=await crypto.subtle.importKey('raw',E2E.unb64(_e2eVk),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const b=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(s)));
    return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
  }
  function clean(v){
    if(!v||typeof v!=='object')return null;
    const syncedLyrics=typeof v.syncedLyrics==='string'?v.syncedLyrics:'',plainLyrics=typeof v.plainLyrics==='string'?v.plainLyrics:'';
    if((!syncedLyrics&&!plainLyrics)||syncedLyrics.length+plainLyrics.length>40000)return null;
    return {syncedLyrics,plainLyrics,duration:Number(v.duration)||0};
  }
  function rank(v){return v?((v.syncedLyrics?100000:0)+(v.syncedLyrics||v.plainLyrics||'').length):0;}
  function enqueue(u,k){if(!u||!k)return;const q=read(u,'queue',[]);if(!Array.isArray(q))return;if(!q.includes(k)){q.push(k);write(u,'queue',q);}}
  function deferScan(delay=2500){if(scanTimer)clearTimeout(scanTimer);scanTimer=setTimeout(()=>{scanTimer=0;scan().catch(e=>console.warn('[lyrics sync] scan',e));},delay);}
  _lrcPut=async function(k,v){const u=myUsername;const result=await rawPut.apply(this,arguments);if(u&&u===myUsername&&clean(v))enqueue(u,k);return result;};
  _mmLoad=async function(){const result=await rawLoad.apply(this,arguments);deferScan();return result;};
  _mmCloudRefresh=function(){const result=rawRefresh.apply(this,arguments);Promise.resolve(result).then(deferScan,()=>{});return result;};
  async function scan(){
    const u=myUsername;if(!u)return;
    if(lastScanUser!==u){lastScanUser=u;lastScan=0;}
    if(scanning){deferScan(5000);return;}
    const elapsed=Date.now()-lastScan;if(lastScan&&elapsed<30000){deferScan(30000-elapsed);return;}
    scanning=true;lastScan=Date.now();
    try{
      const tracks=[...(_mm.list||[]),...((_pxMe().playlist)||[])],keys=new Set();
      for(const t of tracks)if(t&&t.title)keys.add(_lrcKey(t));
      const sent=read(u,'sent',{});let i=0;
      for(const k of keys){
        if(myUsername!==u)break;
        const v=clean(await _lrcGet(k));if(v&&await hash(JSON.stringify(v))!==sent[k])enqueue(u,k);
        if(++i%15===0)await new Promise(r=>setTimeout(r,0));
      }
    }finally{scanning=false;}
  }
  async function findCachedVault(u){
    if(backfillUser===u||!_idb._ready||!_idb._db)return;
    backfillUser=u;
    const prefix='e2e:'+u+':v:'+PREFIX,keys=[];
    try{await new Promise((resolve,reject)=>{
      const tx=_idb._db.transaction('media','readonly');
      const req=tx.objectStore('media').openKeyCursor(IDBKeyRange.bound(prefix,prefix+'\uffff'));
      req.onsuccess=()=>{const cur=req.result;if(!cur)return;keys.push(String(cur.key).slice(('e2e:'+u+':v:').length));cur.continue();};
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });}catch(e){backfillUser='';return;}
    if(myUsername!==u)return;
    const p=read(u,'incoming',[]);if(!Array.isArray(p))return;
    for(const k of keys)if(!p.includes(k))p.push(k);
    write(u,'incoming',p);
  }
  async function accept(u,key){
    const box=await _e2eVaultGet(key),payload=box&&box.p;
    if(!payload||payload.kind!=='lyrics-v1'||!Array.isArray(payload.entries)||payload.entries.length>20)return false;
    for(const entry of payload.entries){
      if(myUsername!==u)return false;
      const k=entry&&entry.k,v=clean(entry&&entry.v);if(typeof k!=='string'||k.length>500||!v)continue;
      const existing=clean(await _lrcGet(k)),incomingHash=await hash(JSON.stringify(v));
      if(!existing||rank(v)>rank(existing))await rawPut(k,v);
      const current=clean(await _lrcGet(k)),currentHash=current?await hash(JSON.stringify(current)):'';
      // Очередь могли пополнить во время чтения IDB: перечитываем прямо перед записью.
      const sent=read(u,'sent',{}),queue=read(u,'queue',[]);sent[k]=incomingHash;
      if(currentHash===incomingHash){const i=queue.indexOf(k);if(i>=0)queue.splice(i,1);}
      else if(current&&!queue.includes(k))queue.push(k);
      if(!write(u,'sent',sent)||!write(u,'queue',queue))return false;
    }
    return true;
  }
  async function receive(){
    const u=myUsername;if(!u||receiving||!_e2eVk)return;receiving=true;
    try{
      const keys=read(u,'incoming',[]);if(!Array.isArray(keys))return;
      for(const key of keys.slice(0,20)){
        if(myUsername!==u)break;
        if(await accept(u,key)){const pending=read(u,'incoming',[]);write(u,'incoming',pending.filter(x=>x!==key));}
      }
    }finally{receiving=false;}
  }
  _e2eOnVault=async function(items){
    const u=myUsername,result=await rawVault.apply(this,arguments);
    if(u&&u===myUsername){const p=read(u,'incoming',[]);if(Array.isArray(p)){for(const it of items||[])if(typeof it.key==='string'&&it.key.startsWith(PREFIX)&&!p.includes(it.key))p.push(it.key);write(u,'incoming',p);receive().catch(()=>{});}}
    return result;
  };
  async function send(){
    const u=myUsername;if(!u||running||!_e2eVk||typeof _hubUp==='undefined'||!_hubUp||_hubAwaitVault||Date.now()-lastSend<4000)return;
    running=true;
    try{
      const q=read(u,'queue',[]),sent=read(u,'sent',{}),entries=[];let size=0;
      if(!Array.isArray(q)||!q.length)return;
      for(const k of q){
        if(myUsername!==u)break;
        const v=clean(await _lrcGet(k));if(!v)continue;
        const sig=await hash(JSON.stringify(v));if(sig===sent[k])continue;
        const e={k,v},n=JSON.stringify(e).length;if(entries.length&&size+n>40000)break;
        entries.push(e);size+=n;if(entries.length>=20)break;
      }
      if(!entries.length)return;
      const payload={kind:'lyrics-v1',entries},key=PREFIX+await vaultHash(JSON.stringify(payload));
      const blob=E2E.b64(await E2E.sealBytes(_e2eVk,_e2eEnc({ev:0,p:payload}),'vault:'+u+':'+key));
      if(myUsername!==u)return;
      lastSend=Date.now();
      if(typeof SRV_KIND!=='undefined'&&SRV_KIND==='yc'){
        await api('/hub',{m:{t:'vault_put',key,blob}});
        if(myUsername!==u)return;
        await _idb.put(_e2eK('v:'+key),blob);await accept(u,key);
      }else if(_hubSend({t:'vault_put',key,blob})){
        // На резерве сервер не присылает подтверждение отправителю: запрашиваем записи обратно.
        setTimeout(()=>{if(myUsername!==u||!_hubUp)return;const cursor=+(localStorage.getItem(_e2eK('vsince'))||0);_hubSend({t:'vault_sync',since:Math.max(0,cursor-1)});},2000);
      }
    }catch(e){console.warn('[lyrics sync] send:',e);}
    finally{running=false;}
  }
  async function tick(){const u=myUsername;if(!u)return;await findCachedVault(u);await receive();await send();}
  window.addEventListener('online',()=>setTimeout(()=>tick().catch(()=>{}),1500));
  setInterval(()=>tick().catch(()=>{}),5000);
  setTimeout(()=>{deferScan();tick().catch(()=>{});},5000);
})();
