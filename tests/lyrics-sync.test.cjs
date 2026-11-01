// Два изолированных устройства и фиктивный сервер; внешние сети/Firebase не используются.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const code=fs.readFileSync('js/lyrics-sync.js','utf8'),remote=new Map(),devices=[];
function device(user){
  const ls=new Map(),db=new Map(),lyrics=new Map(),timers=[],timeouts=[];let now=100000;
  const ctx={console,crypto:webcrypto,TextEncoder,Uint8Array,Date:{now:()=>now},JSON,Set,Map,Array,Promise,
    myUsername:user,_e2eVk:'vault-key',_hubUp:true,_hubAwaitVault:false,SRV_KIND:'yc',_mm:{list:[]},_pxMe:()=>({playlist:[]}),
    localStorage:{getItem:k=>ls.get(k)||null,setItem:(k,v)=>ls.set(k,String(v))},
    _idb:{_ready:false,async put(k,v){db.set(k,v);return true}},_e2eK:k=>'e2e:'+ctx.myUsername+':'+k,
    _e2eEnc:o=>new TextEncoder().encode(JSON.stringify(o)),
    E2E:{async sealBytes(k,b){assert.equal(k,'vault-key');return b},b64:b=>Buffer.from(b).toString('base64'),unb64:()=>new Uint8Array(32).fill(7)},
    _lrcKey:t=>(t.artist+'|'+t.title).toLowerCase(),_lrcGet:async k=>lyrics.get(k)||null,_lrcPut:async(k,v)=>{lyrics.set(k,v)},
    _mmLoad:async()=>[],_mmCloudRefresh:async()=>{},_hubSend:()=>true,
    _e2eVaultGet:async key=>{const blob=db.get(ctx._e2eK('v:'+key));return blob?JSON.parse(Buffer.from(blob,'base64').toString()):null},
    _e2eOnVault:async items=>{for(const x of items)db.set(ctx._e2eK('v:'+x.key),x.blob)},
    api:async(_path,{m})=>{remote.set(m.key,m.blob);for(const d of devices)if(d.myUsername===ctx.myUsername)await d._e2eOnVault([{key:m.key,blob:m.blob}]);return {ok:true}},
    window:{addEventListener(){}},setInterval(fn){timers.push(fn)},setTimeout(fn){timeouts.push(fn)},IDBKeyRange:{bound(){}}};
  vm.createContext(ctx);vm.runInContext(code,ctx);ctx.lyrics=lyrics;ctx.timers=timers;ctx.timeouts=timeouts;ctx.advance=()=>{now+=6000};devices.push(ctx);return ctx;
}
async function flush(){for(let i=0;i<30;i++)await new Promise(r=>setImmediate(r));}
(async()=>{
  const a=device('alice'),b=device('alice'),other=device('bob');
  b._e2eVk=null;
  const lyric={syncedLyrics:'[00:01.00]Первая строка\n[00:04.00]Вторая строка',plainLyrics:'Первая строка\nВторая строка',duration:10};
  await a._lrcPut('artist|song',lyric);a.timers[0]();await flush();
  assert.equal(remote.size,1);assert.equal(b.lyrics.size,0);assert.equal(other.lyrics.size,0);
  b._e2eVk='vault-key';b.timers[0]();await flush();assert.equal(b.lyrics.get('artist|song').syncedLyrics,lyric.syncedLyrics);
  b.timers[0]();await flush();assert.equal(remote.size,1,'receiver must not resend identical lyrics');
  const userKeys=JSON.parse(a.localStorage.getItem('sl_u_alice_lyrics_sync_queue')||'[]');assert.equal(userKeys.length,0,'confirmed upload clears queue');
  // Старый уже скачанный текст тоже ставится в очередь при открытии медиатеки.
  a._mm.list=[{artist:'old',title:'track'}];a.lyrics.set('old|track',lyric);
  await a._mmLoad();a.timeouts.at(-1)();await flush();a.advance();a.timers[0]();await flush();
  assert.equal(b.lyrics.get('old|track').syncedLyrics,lyric.syncedLyrics);
  const c=device('charlie');c.SRV_KIND='cf';
  let cKey='';c._hubSend=msg=>{if(msg.t==='vault_put'){cKey=msg.key;remote.set(msg.key,msg.blob);}else if(msg.t==='vault_sync'&&cKey)c._e2eOnVault([{key:cKey,blob:remote.get(cKey)}]);return true;};
  await c._lrcPut('other|track',lyric);c.timers[0]();await flush();assert.equal(JSON.parse(c.localStorage.getItem('sl_u_charlie_lyrics_sync_queue')).length,1);
  c.timeouts.at(-1)();await flush();assert.equal(JSON.parse(c.localStorage.getItem('sl_u_charlie_lyrics_sync_queue')).length,0,'backup waits for vault echo');
  console.log('OK: same-account sync, delayed key, account isolation and backup confirmation');
})().catch(e=>{console.error(e);process.exitCode=1});
