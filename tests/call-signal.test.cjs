// Проверки маршрутизации сигналов вызова, без WebRTC и серверов.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/firebase-core.js','utf8');
const start=source.indexOf('function onData(pid,data){'),end=source.indexOf('function _fbOnce(',start);
assert(start>=0&&end>start);
let closed=0,rings=0;const incoming={classList:{remove(){rings++}}};
const ctx={console,activeCall:{peerId:'bob',callId:'new'},pendingCall:null,_lastIncomingCallId:null,
  stopRingSound(){rings++},_closeCallNotif(){},$:()=>incoming,endCallCleanup(){closed++},toast(){},_showPeerMute(){},
  _sigRun:fn=>fn(),_callPC:{signalingState:'stable'},_pendingIceCandidates:[],_pendingRemoteOffer:null};
vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
ctx.onData('bob',{type:'call_end',callId:'old'});assert.equal(closed,0);assert.equal(rings,0);
ctx.onData('mallory',{type:'call_cancel',callId:'new'});assert.equal(closed,0);assert.equal(rings,0);
ctx.onData('bob',{type:'call_end',callId:'new'});assert.equal(closed,1);
ctx.activeCall={peerId:'bob',callId:'new'};ctx.onData('bob',{type:'call_answer',callId:'old',sdp:{}});assert.equal(closed,1);
ctx.onData('bob',{type:'call_offer',callId:'old',sdp:{type:'offer'}});assert.equal(ctx._pendingRemoteOffer,null);
ctx.onData('mallory',{type:'call_ice',callId:'new',candidate:{candidate:'candidate'}});assert.equal(ctx._pendingIceCandidates.length,0);
console.log('OK: stale or unrelated call signals do not close another call');
