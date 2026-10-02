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
  // Метки подписей (разделение доменов: подпись одного вида нельзя выдать за другую)
  const L_IKD=te.encode('SLON_IKD_v1'),L_SPK2=te.encode('SLON_SPK_v2');
  // До этой даты принимаем старую подпись предключа (только SPK, без привязки DH-ключа личности):
  // устройства на прошлой версии успеют сменить предключ. Потом — только v2.
  const SPK_V1_UNTIL=Date.UTC(2026,10,1);

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
  async function aead(mk,plain,ad,decrypt,salt){
    const o=await hkdf(mk,salt||new Uint8Array(32),INFO_MK,44);
    const k=await C.importKey('raw',o.slice(0,32),'AES-GCM',false,[decrypt?'decrypt':'encrypt']);
    const p={name:'AES-GCM',iv:o.slice(32,44),additionalData:ad};
    return new Uint8Array(decrypt?await C.decrypt(p,k,plain):await C.encrypt(p,k,plain));
  }
  const hdrBytes=h=>te.encode(JSON.stringify(h.s!=null?[h.dh,h.pn,h.n,h.s]:[h.dh,h.pn,h.n]));
  // Проверка заголовка до любой криптографии (мусор с сервера не должен ронять/портить состояние)
  const isB64=(x,n)=>typeof x==='string'&&x.length<=4*Math.ceil(n/3)+4&&/^[A-Za-z0-9+/]+={0,2}$/.test(x)&&(()=>{try{return unb64(x).length===n;}catch(e){return false;}})();
  const isIdx=x=>Number.isInteger(x)&&x>=0&&x<2**31;
  function checkMsg(msg){
    if(!msg||typeof msg!=='object'||!msg.h||typeof msg.c!=='string')throw new Error('bad_message');
    const h=msg.h;
    if(!isB64(h.dh,32)||!isIdx(h.pn)||!isIdx(h.n)||(h.s!=null&&!isB64(h.s,16)))throw new Error('bad_header');
    if(msg.c.length>64*1024*1024)throw new Error('too_big');
  }
  // Подпись DH-ключа личности ключом подписи — связывает две половины identity
  const ikdSign=(identity)=>sign(identity.sign.priv,cat(L_IKD,identity.dh.pub));
  const ikdVerify=(ik,ikd,sig)=>verify(ik,sig,cat(L_IKD,ikd));

  // ── Устройство: identity + подписанный предключ + одноразовые предключи ──
  async function newIdentity(){return {sign:await genSign(),dh:await genDH()};}
  async function newSignedPreKey(identity,id){
    const k=await genDH();
    // v2: подпись покрывает и DH-ключ личности — сервер не подменит ikd в связке
    return {id,pub:k.pub,priv:k.priv,sig:await sign(identity.sign.priv,cat(L_SPK2,identity.dh.pub,k.pub)),v:2,ts:Date.now()};
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
  // Подпись предключа: v2 (ikd||spk) или — в переходный период — старая (только spk)
  async function spkCheck(bundle,opt){
    const ikB=unb64(bundle.ik),ikdB=unb64(bundle.ikd),spkB=unb64(bundle.spk.pub),sig=unb64(bundle.spk.sig);
    if(ikB.length!==32||ikdB.length!==32||spkB.length!==32||sig.length!==64)throw new Error('bad_bundle');
    if(await verify(ikB,sig,cat(L_SPK2,ikdB,spkB)))return 2;
    const now=(opt&&opt.now)||Date.now();
    if(!(opt&&opt.v2only)&&now<SPK_V1_UNTIL&&await verify(ikB,sig,spkB))return 1;
    throw new Error('bad_spk_signature');
  }
  async function initiate(identity,bundle,opt){
    const ikB=unb64(bundle.ik),ikdB=unb64(bundle.ikd),spkB=unb64(bundle.spk.pub);
    const spkV=await spkCheck(bundle,opt);
    if(bundle.opk&&unb64(bundle.opk.pub).length!==32)throw new Error('bad_bundle');
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
      v:1,spkV,ad:b64(ad),remoteIk:bundle.ik,remoteIkd:bundle.ikd,
      dhs:{pub:b64(ratchet.pub),priv:ratchet.priv},dhr:bundle.spk.pub,
      rk:b64(rk),cks:b64(cks),ckr:null,ns:0,nr:0,pn:0,skipped:{},
      // пока собеседник не ответил — прикладываем данные X3DH к каждому сообщению
      pending:{ik:b64(identity.sign.pub),ikd:b64(identity.dh.pub),ikds:b64(await ikdSign(identity)),ek:b64(ek.pub),spk:bundle.spk.id,opk:opkId},
    };
  }
  // ── X3DH: отвечающий (к нам пришло первое сообщение) ──
  async function respond(identity,spk,opk,init){
    if(!init||!isB64(init.ik,32)||!isB64(init.ikd,32)||!isB64(init.ek,32)||!isB64(init.ikds,64))throw new Error('bad_prekey_message');
    const ikA=unb64(init.ik),ikdA=unb64(init.ikd),ekA=unb64(init.ek);
    // DH-ключ личности отправителя должен быть подписан его ключом подписи (тем, что в коде безопасности),
    // иначе сервер выдаст себя за собеседника, подставив свой ikd при настоящем ik
    if(!await ikdVerify(ikA,ikdA,unb64(init.ikds)))throw new Error('bad_ikd_signature');
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
    const salt=globalThis.crypto.getRandomValues(new Uint8Array(16));
    const h={dh:st.dhs.pub,pn:st.pn,n:st.ns,s:b64(salt)};st.ns++;
    const ct=await aead(mk,plainBytes,cat(unb64(st.ad),hdrBytes(h)),false,salt);
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
    checkMsg(msg);
    const st=JSON.parse(JSON.stringify(st0));
    const h=msg.h,ad=cat(unb64(st.ad),hdrBytes(h)),ct=unb64(msg.c),salt=h.s!=null?unb64(h.s):undefined;
    const sk=st.skipped[h.dh+':'+h.n];
    if(sk){delete st.skipped[h.dh+':'+h.n];return {st,plain:await aead(unb64(sk),ct,ad,true,salt)};}
    if(h.dh===st.dhr&&h.n<st.nr)throw new Error('duplicate_or_old');   // повтор уже прочитанного
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
    const plain=await aead(mk,ct,ad,true,salt);
    st.pending=null;                               // собеседник ответил — X3DH больше не прикладываем
    return {st,plain};
  }

  // ── Отпечаток безопасности (сравнить ключи с собеседником, как «код безопасности» в Signal) ──
  // ikA/ikB — ключ или список ключей (все устройства); порядок не важен
  async function fingerprint(ikA,ikB){
    const side=k=>[].concat(k).slice().sort().join(',');
    const [x,y]=[side(ikA),side(ikB)].sort();
    const d=new Uint8Array(await C.digest('SHA-256',te.encode('SLON_FP_v2|'+x+'|'+y)));
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

  return {b64,unb64,te,td,eq,spkCheck,ikdSign,checkMsg,SPK_V1_UNTIL,
    _t:{hkdf,hmac,dh,sign,verify,aead,kdfCK,kdfRK},newIdentity,newSignedPreKey,newPreKeys,bundleOf,initiate,respond,encrypt,decrypt,
    fingerprint,randomKey,sealBytes,openBytes,passwordKey};
})();
if(typeof module!=='undefined')module.exports=E2E;
