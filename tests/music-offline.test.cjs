// Автономные проверки: сеть и сервисы не вызываются.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const music=fs.readFileSync('js/music.js','utf8'),lyrics=fs.readFileSync('js/profile-extra.js','utf8');
(async()=>{
  const ls=new Map(),store={getItem:k=>ls.get(k)||null,setItem:(k,v)=>ls.set(k,String(v))};
  let resolveCloud;
  const ctx={console,navigator:{onLine:true},localStorage:store,myUsername:'alice',_mm:{list:[],loaded:false,urls:{}},_mmDbP:null,
    _mmGetAll:async()=>[{id:'local',title:'Свой трек',audio:{},ts:1}],_mmItem:r=>({id:r.id,title:r.title,local:true,ts:r.ts}),
    _apiToken:()=> 'token',api:()=>new Promise(r=>resolveCloud=r),_mmCovFill(){},_lrcPrefetchAll(){},_mmSyncAll(){},_plRemap(){},_mmUpload(){},_mmPaint(){},_mxRefresh(){},setTimeout(){},clearTimeout(){}};
  ls.set('sl_u_alice_mm_cloud_catalog',JSON.stringify([{id:'cloud',title:'Скачанный трек',url:'https://example.test/cloud',ts:2}]));
  vm.createContext(ctx);vm.runInContext(music.slice(music.indexOf('let _mmUserLoaded=null'),music.indexOf('function _mmItem(r)')),ctx);
  const list=await Promise.race([vm.runInContext('_mmLoad()',ctx),new Promise((_,reject)=>setTimeout(()=>reject(Error('local load blocked on server')),100))]);
  assert.equal(list.length,2);assert.equal(list[0].id,'cloud');assert.equal(list[0].url,'https://example.test/cloud');
  resolveCloud({tracks:[{id:'new',title:'Новый',url:'https://example.test/new',ts:3}]});await new Promise(r=>setImmediate(r));assert(ctx._mm.list.some(t=>t.id==='new'));
  // Нативный плеер получает тот же URL как ключ своего офлайн-кэша.
  const np={_npBad:new Set(),_mm:{base:''}};vm.createContext(np);
  vm.runInContext(music.slice(music.indexOf('function _npUrl(it)'),music.indexOf('function _npCover(it)')),np);
  assert.equal(np._npUrl(list.find(t=>t.id==='cloud')),'https://example.test/cloud');
  ctx.myUsername='bob';ctx.navigator.onLine=false;const other=await vm.runInContext('_mmLoad(true)',ctx);assert(!other.some(t=>t.id==='cloud'),'catalogue must not cross accounts');
  const lctx={console,navigator:{onLine:false},AbortController,setTimeout,clearTimeout,encodeURIComponent,_lrcGet:async()=>({syncedLyrics:'[00:00.00] cached'}),_lrcPut:async()=>{},_lrcParse:()=>[],fetch:async()=>{throw Error('unexpected network')}};
  vm.createContext(lctx);vm.runInContext(lyrics.slice(lyrics.indexOf('const _lrcKey='),lyrics.indexOf('async function _pxLyrics(')),lctx);
  const cached=await vm.runInContext("_lrcFind({artist:'A',title:'B'})",lctx);assert(cached.syncedLyrics.includes('cached'));
  lctx._lrcGet=async()=>null;await assert.rejects(vm.runInContext("_lrcFind({artist:'A',title:'B'})",lctx),/Нет сети/);
  let requests=0;lctx.navigator.onLine=true;lctx.fetch=async()=>{requests++;throw Error('network')};await assert.rejects(vm.runInContext("_lrcFind({artist:'A',title:'B'})",lctx),/Не удалось подключиться/);assert.equal(requests,2);
  const miss={};let writes=0;
  const pf={navigator:{onLine:true},_mm:{list:[{title:'B',artist:'A'}]},_pxMe:()=>({playlist:[]}),_lrcKey:()=> 'a|b',_lrcGet:async()=>null,_lrcFind:async()=>{throw Error('network')},_lrcMiss:miss,localStorage:{setItem(){writes++}},setTimeout(){},Date};
  vm.createContext(pf);vm.runInContext(music.slice(music.indexOf('let _lrcPfBusy=false'),music.indexOf('const _lrcMiss=')),pf);
  await vm.runInContext('_lrcPrefetchAll()',pf);assert.equal(writes,0);assert.equal(Object.keys(miss).length,0,'network error must not be cached as a missing lyric');
  console.log('OK: local music opens without waiting for server; account isolation; cached lyrics work offline and network errors retry');
})().catch(e=>{console.error(e);process.exitCode=1});
