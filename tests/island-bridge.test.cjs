const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 let tick,sent=[],now=100000,closed=0;
 const c={navigator:{platform:'Linux x86_64',userAgent:'Firefox'},setInterval:f=>tick=f,
  _islTr:{title:'Song',artist:'Artist',cover:'blob:private-cover'},_pxAudio:{currentTime:12,duration:200,playbackRate:1,paused:false},
  _lrcKey:t=>t.title,_lrcGet:async()=>({syncedLyrics:'[00:12]From Slon'}),Date:{now:()=>now},AbortSignal,
  createImageBitmap:async()=>({close:()=>closed++}),document:{createElement:()=>({getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,AAAA'})},
  fetch:async(url,o)=>{if(url==='blob:private-cover')return {ok:true,blob:async()=>({size:100})};sent.push(JSON.parse(o.body));return {ok:true}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('js/island-bridge.js','utf8'),c);
 await tick();await new Promise(setImmediate);await tick();
 assert.equal(sent[1].synced,'[00:12]From Slon');assert.equal(sent[1].position,12);
 assert.equal(sent[1].cover,'data:image/jpeg;base64,AAAA');assert.equal(closed,1);
 await tick();assert.equal(sent[2].synced,undefined);assert.equal(sent[2].cover,undefined);
 now+=6000;await tick();assert.equal(sent[3].synced,'[00:12]From Slon');assert.ok(sent[3].cover,'replay cover after widget restart');
 c._islTr={title:'Other'};await tick();assert.equal(sent[4].key,'Other');assert.equal(sent[4].synced,'');assert.equal(sent[4].cover,undefined);
 let actions=[];c._islToggle=()=>actions.push('pause');c._mmStep=d=>actions.push(d);
 let reply=[{id:1,key:'Other',action:'play-pause'},{id:2,key:'Other',action:'next'}];
 c.fetch=async()=>({ok:true,status:200,json:async()=>({commands:reply})});
 await tick();await tick();assert.deepEqual(actions,['pause',1],'commands execute exactly once');
 reply=[{id:3,key:'old song',action:'previous'}];await tick();assert.deepEqual(actions,['pause',1],'stale track command ignored');
 console.log('OK: Slon lyrics, position, blob cover conversion, replay after widget restart, track isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
