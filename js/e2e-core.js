// ════════════════════════════════════════
// ── СКВОЗНОЕ ШИФРОВАНИЕ: протокол Signal (X3DH + Double Ratchet) ──
// Реализация по публичным спецификациям Signal:
//   https://signal.org/docs/specifications/x3dh/
//   https://signal.org/docs/specifications/doubleratchet/
// Криптография — только встроенный WebCrypto: X25519 (обмен ключами),
// Ed25519 (подпись подписанного предключа), HKDF/HMAC-SHA-256, AES-256-GCM.
// Отличие от Signal: identity-ключ устройства — пара (Ed25519 для подписи +
// X25519 для DH) вместо одного ключа с XEdDSA; стойкость та же.
// Файл без DOM — работает и в браузере, и в Node (тесты).
// ════════════════════════════════════════
const E2E=(()=>{
  const C=globalThis.crypto.subtle;
  const te=new TextEncoder(),td=new TextDecoder();
  const MAX_SKIP=1000;            // сколько пропущенных ключей сообщений храним на цепочку
  const INFO_X3DH=te.encode('SLON_X3DH_v1'),INFO_RK=te.encode('SLON_Ratchet_v1'),INFO_MK=te.encode('SLON_MsgKeys_v1');

  // ── байты ↔ base64 ──
  const b64=u=>{let s='';const a=new Uint8Array(u);for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s);};
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const cat=(...a)=>{const n=a.reduce((x,y)=>x+y.length,0),o=new Uint8Array(n);let p=0;for(const x of a){o.set(x,p);p+=x.length;}return o;};
  const eq=(a,b)=>{if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a[i]^b[i];return r===0;};

  // ── ключи ──
  async function genDH(){
    const k=await C.generateKey({name:'X25519'},true,['deriveBits']);
    return {pub:new Uint8Array(await C.exportKey('raw',k.publicKey)),priv:await C.exportKey('jwk',k.privateKey)};
  }
  async function genSign(){
    const k=await C.generateKey({name:'Ed25519'},true,['sign','verify']);
    return {pub:new Uint8Array(await C.exportKey('raw',k.publicKey)),priv:await C.exportKey('jwk',k.privateKey)};
  }
  async function dh(privJwk,pubRaw){
    const priv=await C.importKey('jwk',privJwk,{name:'X25519'},false,['deriveBits']);
    const pub=await C.importKey('raw',pubRaw,{name:'X25519'},false,[]);
    return new Uint8Array(await C.deriveBits({name:'X25519',public:pub},priv,256));
  }
  async function sign(privJwk,data){
    const k=await C.importKey('jwk',privJwk,{name:'Ed25519'},false,['sign']);
    return new Uint8Array(await C.sign({name:'Ed25519'},k,data));
  }
  async function verify(pubRaw,sig,data){
    const k=await C.importKey('raw',pubRaw,{name:'Ed25519'},false,['verify']);
    return C.verify({name:'Ed25519'},k,sig,data);
  }
  async function hkdf(ikm,salt,info,len){
    const k=await C.importKey('raw',ikm,'HKDF',false,['deriveBits']);
    return new Uint8Array(await C.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},k,len*8));
  }
  async function hmac(key,data){
    const k=await C.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);
    return new Uint8Array(await C.sign('HMAC',k,data));
  }
  // KDF_RK: новый корневой ключ + ключ цепочки
  async function kdfRK(rk,dhOut){const o=await hkdf(dhOut,rk,INFO_RK,64);return [o.slice(0,32),o.slice(32)];}
  // KDF_CK: ключ сообщения + следующий ключ цепочки
  async function kdfCK(ck){return [await hmac(ck,new Uint8Array([1])),await hmac(ck,new Uint8Array([2]))];}
  async function aead(mk,plain,ad,decrypt){
    const o=await hkdf(mk,new Uint8Array(32),INFO_MK,44);
    const k=await C.importKey('raw',o.slice(0,32),'AES-GCM',false,[decrypt?'decrypt':'encrypt']);
    const p={name:'AES-GCM',iv:o.slice(32,44),additionalData:ad};
    return new Uint8Array(decrypt?await C.decrypt(p,k,plain):await C.encrypt(p,k,plain));
  }
  const hdrBytes=h=>te.encode(JSON.stringify([h.dh,h.pn,h.n]));

  // ── Устройство: identity + подписанный предключ + одноразовые предключи ──
  async function newIdentity(){return {sign:await genSign(),dh:await genDH()};}
  async function newSignedPreKey(identity,id){
    const k=await genDH();
    return {id,pub:k.pub,priv:k.priv,sig:await sign(identity.sign.priv,k.pub),ts:Date.now()};
  }
  async function newPreKeys(startId,count){
    const out=[];for(let i=0;i<count;i++){const k=await genDH();out.push({id:startId+i,pub:k.pub,priv:k.priv});}
    return out;
  }
  // Публичная часть для сервера
  function bundleOf(identity,spk,opks){
    return {ik:b64(identity.sign.pub),ikd:b64(identity.dh.pub),spk:{id:spk.id,pub:b64(spk.pub),sig:b64(spk.sig)},
      opks:(opks||[]).map(k=>({id:k.id,pub:b64(k.pub)}))};
  }

  // ── X3DH: инициатор (мы пишем первыми) ──
  async function initiate(identity,bundle){
    const ikB=unb64(bundle.ik),ikdB=unb64(bundle.ikd),spkB=unb64(bundle.spk.pub);
    if(!await verify(ikB,unb64(bundle.spk.sig),spkB))throw new Error('bad_spk_signature');
    const ek=await genDH();
    const dh1=await dh(identity.dh.priv,spkB),dh2=await dh(ek.priv,ikdB),dh3=await dh(ek.priv,spkB);
    let dhs=[dh1,dh2,dh3],opkId=null;
    if(bundle.opk){dhs.push(await dh(ek.priv,unb64(bundle.opk.pub)));opkId=bundle.opk.id;}
    const sk=await hkdf(cat(new Uint8Array(32).fill(0xff),...dhs),new Uint8Array(32),INFO_X3DH,32);
    const ad=cat(identity.sign.pub,identity.dh.pub,ikB,ikdB);
    // Double Ratchet (сторона A)
    const ratchet=await genDH();
    const [rk,cks]=await kdfRK(sk,await dh(ratchet.priv,spkB));
    return {
      v:1,ad:b64(ad),remoteIk:bundle.ik,remoteIkd:bundle.ikd,
      dhs:{pub:b64(ratchet.pub),priv:ratchet.priv},dhr:bundle.spk.pub,
      rk:b64(rk),cks:b64(cks),ckr:null,ns:0,nr:0,pn:0,skipped:{},
      // пока собеседник не ответил — прикладываем данные X3DH к каждому сообщению
      pending:{ik:b64(identity.sign.pub),ikd:b64(identity.dh.pub),ek:b64(ek.pub),spk:bundle.spk.id,opk:opkId},
    };
  }
  // ── X3DH: отвечающий (к нам пришло первое сообщение) ──
  async function respond(identity,spk,opk,init){
    const ikA=unb64(init.ik),ikdA=unb64(init.ikd),ekA=unb64(init.ek);
    const dh1=await dh(spk.priv,ikdA),dh2=await dh(identity.dh.priv,ekA),dh3=await dh(spk.priv,ekA);
    const dhs=[dh1,dh2,dh3];
    if(opk)dhs.push(await dh(opk.priv,ekA));
    const sk=await hkdf(cat(new Uint8Array(32).fill(0xff),...dhs),new Uint8Array(32),INFO_X3DH,32);
    const ad=cat(ikA,ikdA,identity.sign.pub,identity.dh.pub);
    return {v:1,ad:b64(ad),remoteIk:init.ik,remoteIkd:init.ikd,
      dhs:{pub:b64(spk.pub),priv:spk.priv},dhr:null,rk:b64(sk),cks:null,ckr:null,ns:0,nr:0,pn:0,skipped:{},pending:null};
  }

  // ── Double Ratchet: шифрование ──
  async function encrypt(st,plainBytes){
    if(!st.cks)throw new Error('no_sending_chain');
    const [mk,ck]=await kdfCK(unb64(st.cks));
    st.cks=b64(ck);
    const h={dh:st.dhs.pub,pn:st.pn,n:st.ns};st.ns++;
    const ct=await aead(mk,plainBytes,cat(unb64(st.ad),hdrBytes(h)),false);
    const msg={h,c:b64(ct)};
    if(st.pending)msg.x=st.pending;          // PreKey-сообщение
    return msg;
  }
  async function skipKeys(st,until){
    if(!st.ckr)return;
    if(until-st.nr>MAX_SKIP)throw new Error('too_many_skipped');
    let ck=unb64(st.ckr);
    while(st.nr<until){
      const [mk,next]=await kdfCK(ck);ck=next;
      st.skipped[st.dhr+':'+st.nr]=b64(mk);st.nr++;
    }
    st.ckr=b64(ck);
    const keys=Object.keys(st.skipped);          // не даём разрастись бесконечно
    if(keys.length>MAX_SKIP*2)for(const k of keys.slice(0,keys.length-MAX_SKIP*2))delete st.skipped[k];
  }
  // ── Double Ratchet: расшифровка (st меняется только при успехе — работаем с копией) ──
  async function decrypt(st0,msg){
    const st=JSON.parse(JSON.stringify(st0));
    const h=msg.h,ad=cat(unb64(st.ad),hdrBytes(h)),ct=unb64(msg.c);
    const sk=st.skipped[h.dh+':'+h.n];
    if(sk){delete st.skipped[h.dh+':'+h.n];return {st,plain:await aead(unb64(sk),ct,ad,true)};}
    if(h.dh!==st.dhr){
      await skipKeys(st,h.pn);
      // шаг DH-храповика
      st.pn=st.ns;st.ns=0;st.nr=0;st.dhr=h.dh;
      let [rk,ckr]=await kdfRK(unb64(st.rk),await dh(st.dhs.priv,unb64(h.dh)));
      st.ckr=b64(ckr);
      const next=await genDH();
      st.dhs={pub:b64(next.pub),priv:next.priv};
      const [rk2,cks]=await kdfRK(rk,await dh(next.priv,unb64(h.dh)));
      st.rk=b64(rk2);st.cks=b64(cks);
    }
    await skipKeys(st,h.n);
    const [mk,ck]=await kdfCK(unb64(st.ckr));
    st.ckr=b64(ck);st.nr++;
    const plain=await aead(mk,ct,ad,true);
    st.pending=null;                               // собеседник ответил — X3DH больше не прикладываем
    return {st,plain};
  }

  // ── Отпечаток безопасности (сравнить ключи с собеседником, как «код безопасности» в Signal) ──
  async function fingerprint(ikA,ikB){
    const [x,y]=[ikA,ikB].sort();
    const d=new Uint8Array(await C.digest('SHA-256',cat(unb64(x),unb64(y))));
    let s='';for(let i=0;i<30;i++)s+=String(d[i]%10);
    return s.match(/.{5}/g).join(' ');
  }

  // ── Симметричное шифрование (медиа, бэкап истории) ──
  async function randomKey(){return b64(globalThis.crypto.getRandomValues(new Uint8Array(32)));}
  async function sealBytes(keyB64,bytes,adStr){
    const iv=globalThis.crypto.getRandomValues(new Uint8Array(12));
    const k=await C.importKey('raw',unb64(keyB64),'AES-GCM',false,['encrypt']);
    const ct=new Uint8Array(await C.encrypt({name:'AES-GCM',iv,additionalData:te.encode(adStr||'')},k,bytes));
    return cat(iv,ct);
  }
  async function openBytes(keyB64,sealed,adStr){
    const k=await C.importKey('raw',unb64(keyB64),'AES-GCM',false,['decrypt']);
    return new Uint8Array(await C.decrypt({name:'AES-GCM',iv:sealed.slice(0,12),additionalData:te.encode(adStr||'')},k,sealed.slice(12)));
  }
  // ключ из пароля (для ключа бэкапа истории): PBKDF2-SHA-256, 310 000 итераций
  async function passwordKey(password,username){
    const k=await C.importKey('raw',te.encode(password),'PBKDF2',false,['deriveBits']);
    return b64(new Uint8Array(await C.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:te.encode('slon-vault-v1:'+username),iterations:310000},k,256)));
  }

  return {b64,unb64,te,td,eq,newIdentity,newSignedPreKey,newPreKeys,bundleOf,initiate,respond,encrypt,decrypt,
    fingerprint,randomKey,sealBytes,openBytes,passwordKey};
})();
if(typeof module!=='undefined')module.exports=E2E;
