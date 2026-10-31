// Изолированные проверки очередей: без сети, Firebase и продакшн-данных.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const memory=new Map(),db=new Map(),queued=[],sent=[];
const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
const ctx={console:{warn(){},log(){}},localStorage:storage,navigator:{onLine:true},window:{addEventListener(){}},document:{getElementById(){return null},querySelector(){return null},visibilityState:'visible'},
  setInterval(){},setTimeout(){},clearTimeout(){},Blob,URL,Uint8Array,Promise,Math,Date,JSON,Set,
  _fbMode:false,myUsername:'alice',_mlUser:null,_hubUp:true,_e2eOn:true,_apiToken:()=> 'session',_hubSend:m=>{sent.push(m);return true},
  _idb:{async put(k,v){db.set(k,v);return true},async get(k){return db.get(k)||null},async del(k){db.delete(k);return true}},
  _e2eMust:()=>false,_e2ePost:async()=>false,_e2eOutboxAdd:(chat,key,rec)=>queued.push({chat,key,rec}),_isChannelId:()=>false,
  _e2eEncryptMedia:async()=>({mk:'secret',blob:new Blob(['cipher'])}),_srvUploadBlob:async()=>{throw Error('offline')},
  _getAccountPrefix:u=>'sl_u_'+u+'_',saveAll(){},toast(){},fmtTime:()=>'',peerNames:{bob:'Bob'},peerAvatars:{},chatHist:{},blockedUsers:{},
  activeChat:'other',mutedChats:{},_notifOn:()=>false,updatePreview(){},addUnread(){},_sendRead(){},_pushMsg(){},
  myPrivacy:{archiveUnknown:false},archivedChats:{},_myDeviceId:'d',_duParts:()=>({b64:''}),storePhoto:()=> 'photo',makeThumb:async()=>null};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/sync.js','utf8'),ctx);
(async()=>{
  await vm.runInContext("_mlPost('bob',{id:'m1',ts:1,k:'photo',m:'blob',mk:'secret'})",ctx);
  assert.equal(queued.length,1);assert.equal(queued[0].rec.mk,'secret');assert.equal(sent.length,0,'no unencrypted downgrade');
  const failed=await vm.runInContext("_mlSendMedia('bob','p1','photo','data:image/png;base64,AA==',{mime:'image/png',ts:2})",ctx);
  assert.equal(failed,false);assert(db.has('media_outbox:alice:p1'));assert.equal(JSON.parse(memory.get('sl_u_alice_media_outbox')).length,1);
  ctx._srvUploadBlob=async()=> 'media-id';await vm.runInContext('_mediaQueueDrain()',ctx);
  assert.equal(JSON.parse(memory.get('sl_u_alice_media_outbox')).length,0);assert.equal(queued.at(-1).rec.mk,'secret');
  let fail=true;ctx._mlMaterialize=async()=>{if(fail)throw Error('temporary');return{id:'in1',sender:'inc',ts:10,photoId:'photo'};};
  const rec={id:'in1',chat:'bob',ts:10,k:'photo',m:'id'};ctx.rec=rec;
  await vm.runInContext("_mlOnAdd('key1',rec)",ctx);
  assert.deepEqual(JSON.parse(memory.get('sl_u_alice_ml_retry')),['key1']);assert.equal((ctx.chatHist.bob||[]).length,0);
  fail=false;await vm.runInContext('_mlRetryDrain()',ctx);
  assert.equal(ctx.chatHist.bob.length,1);assert.equal(JSON.parse(memory.get('sl_u_alice_ml_retry')).length,0);
  // В истории есть ссылка на удалённый локальный файл: запись скачивается заново.
  ctx.chatHist.bob.push({id:'broken',sender:'me',photoId:'idb:broken:photo',ts:1});
  ctx.rec2={id:'broken',chat:'bob',ts:1,k:'photo',m:'id',out:true};
  ctx._mlMaterialize=async()=>({id:'broken',sender:'me',photoId:'recovered',ts:1});
  await vm.runInContext("_mlOnAdd('key2',rec2)",ctx);
  assert.equal(ctx.chatHist.bob.filter(x=>x.id==='broken').length,1);
  assert.equal(ctx.chatHist.bob.find(x=>x.id==='broken').photoId,'recovered');
  // Новое сообщение, добавленное во время отправки очереди, не исчезает.
  ctx.chatHist.bob.push({id:'q1'},{id:'q2'});
  memory.set('sl_u_alice_outbox',JSON.stringify([{chat:'bob',rec:{id:'q1',k:'text',text:'first',ts:11}}]));
  let release;ctx._e2ePost=()=>new Promise(resolve=>{release=resolve;});
  const draining=vm.runInContext('_obDrain()',ctx);
  await Promise.resolve();
  vm.runInContext("_obAdd('bob',{id:'q2',k:'text',text:'second',ts:12})",ctx);
  release(true);await draining;
  assert.deepEqual(JSON.parse(memory.get('sl_u_alice_outbox')).map(x=>x.rec.id),['q2']);
  console.log('OK: encrypted media does not downgrade; failed uploads and downloads retry offline');
})().catch(e=>{console.error(e);process.exitCode=1});
