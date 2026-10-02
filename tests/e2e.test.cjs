// Тесты сквозного шифрования (js/e2e-core.js). Запуск: node tests/e2e.test.cjs
// 1) эталонные векторы RFC — примитивы считают ровно то, что в стандартах;
// 2) протокол: X3DH + Double Ratchet, порядок, пропуски, повторы;
// 3) атаки: подмена ключей сервером, порча шифра/заголовка/AD, повтор первого сообщения;
// 4) фаззинг расшифровки (мусор не роняет и не портит состояние);
// 5) уникальность пары ключ+nonce AES-GCM, в т.ч. при повторном использовании состояния.
const E2E=require('../js/e2e-core.js');
const {b64,unb64,te,td,_t}=E2E;
const hex=h=>Uint8Array.from(h.match(/../g)||[],x=>parseInt(x,16));
const tohex=u=>[...u].map(x=>x.toString(16).padStart(2,'0')).join('');
const b64u=u=>b64(u).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
let pass=0,fail=0;
async function t(name,fn){
  try{await fn();pass++;console.log('  ok  ',name);}
  catch(e){fail++;console.log('  FAIL',name,'—',e&&e.message||e);}
}
const assert=(c,m)=>{if(!c)throw new Error(m||'assert');};
const eqHex=(a,b,m)=>assert(tohex(a)===b.toLowerCase(),(m||'')+' got '+tohex(a));
async function throwsAsync(fn,m){let ok=false;try{await fn();}catch(e){ok=true;}assert(ok,m||'должно было упасть');}
const clone=o=>JSON.parse(JSON.stringify(o));

(async()=>{
  console.log('— векторы RFC');
  await t('HKDF-SHA256 (RFC 5869, тест 1)',async()=>{
    const okm=await _t.hkdf(hex('0b'.repeat(22)),hex('000102030405060708090a0b0c'),hex('f0f1f2f3f4f5f6f7f8f9'),42);
    eqHex(okm,'3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865');
  });
  await t('HMAC-SHA256 (RFC 4231, тест 2)',async()=>{
    eqHex(await _t.hmac(te.encode('Jefe'),te.encode('what do ya want for nothing?')),'5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  });
  await t('X25519 (RFC 7748, §6.1)',async()=>{
    const aPriv='77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a',aPub='8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a';
    const bPriv='5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb',bPub='de9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f';
    const K='4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742';
    eqHex(await _t.dh({kty:'OKP',crv:'X25519',d:b64u(hex(aPriv)),x:b64u(hex(aPub))},hex(bPub)),K,'A');
    eqHex(await _t.dh({kty:'OKP',crv:'X25519',d:b64u(hex(bPriv)),x:b64u(hex(bPub))},hex(aPub)),K,'B');
  });
  await t('Ed25519 (RFC 8032, тест 1)',async()=>{
    const sk='9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',pk='d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
    const sig='e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b';
    eqHex(await _t.sign({kty:'OKP',crv:'Ed25519',d:b64u(hex(sk)),x:b64u(hex(pk))},new Uint8Array(0)),sig);
    assert(await _t.verify(hex(pk),hex(sig),new Uint8Array(0)),'verify');
    const bad=hex(sig);bad[0]^=1;assert(!await _t.verify(hex(pk),bad,new Uint8Array(0)),'испорченная подпись прошла');
    assert(!await _t.verify(hex(pk),hex(sig),new Uint8Array([0])),'подпись к другому сообщению прошла');
  });
  await t('AES-256-GCM (McGrew–Viega, тесты 13 и 14)',async()=>{
    const C=globalThis.crypto.subtle,k=await C.importKey('raw',new Uint8Array(32),'AES-GCM',false,['encrypt','decrypt']);
    const iv=new Uint8Array(12);
    eqHex(new Uint8Array(await C.encrypt({name:'AES-GCM',iv},k,new Uint8Array(0))),'530f8afbc74536b9a963b4f1c4cb738b','13');
    eqHex(new Uint8Array(await C.encrypt({name:'AES-GCM',iv},k,new Uint8Array(16))),'cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919','14');
  });

  console.log('— протокол');
  async function device(){const id=await E2E.newIdentity();const spk=await E2E.newSignedPreKey(id,1);const opks=await E2E.newPreKeys(1,5);return {id,spk,opks};}
  async function pair(useOpk=true){
    const A=await device(),B=await device();
    const bundle=E2E.bundleOf(B.id,B.spk,[]);if(useOpk)bundle.opk={id:B.opks[0].id,pub:b64(B.opks[0].pub)};
    const sa=await E2E.initiate(A.id,bundle);
    return {A,B,bundle,sa};
  }
  async function bRespond(B,m,opkUsed=true){return E2E.respond(B.id,B.spk,opkUsed?B.opks[0]:null,m.x);}
  const P=s=>te.encode(s),S=u=>td.decode(u);

  await t('обмен в обе стороны + храповик',async()=>{
    const {B,sa}=await pair();
    const m1=await E2E.encrypt(sa,P('привет'));
    let sb=await bRespond(B,m1);let r=await E2E.decrypt(sb,m1);sb=r.st;assert(S(r.plain)==='привет');
    const m2=await E2E.encrypt(sb,P('ответ'));r=await E2E.decrypt(sa,m2);Object.assign(sa,r.st);assert(S(r.plain)==='ответ');
    assert(sa.pending===null,'pending не снят после ответа');
    for(let i=0;i<5;i++){const m=await E2E.encrypt(sa,P('a'+i));r=await E2E.decrypt(sb,m);sb=r.st;assert(S(r.plain)==='a'+i);
      const n=await E2E.encrypt(sb,P('b'+i));r=await E2E.decrypt(sa,n);Object.assign(sa,r.st);assert(S(r.plain)==='b'+i);}
  });
  await t('без одноразового предключа',async()=>{
    const {B,sa}=await pair(false);const m=await E2E.encrypt(sa,P('x'));
    const r=await E2E.decrypt(await bRespond(B,m,false),m);assert(S(r.plain)==='x');
  });
  await t('сообщения не по порядку и с пропусками',async()=>{
    const {B,sa}=await pair();
    const ms=[];for(let i=0;i<6;i++)ms.push(await E2E.encrypt(sa,P('m'+i)));
    let sb=await bRespond(B,ms[0]);
    for(const i of [0,4,2,5,1,3]){const r=await E2E.decrypt(sb,ms[i]);sb=r.st;assert(S(r.plain)==='m'+i,'m'+i);}
  });
  await t('повтор уже прочитанного — отклоняется',async()=>{
    const {B,sa}=await pair();
    const m0=await E2E.encrypt(sa,P('0')),m1=await E2E.encrypt(sa,P('1'));
    let sb=await bRespond(B,m0);sb=(await E2E.decrypt(sb,m0)).st;sb=(await E2E.decrypt(sb,m1)).st;
    await throwsAsync(()=>E2E.decrypt(sb,m1),'повтор m1 расшифровался');
    await throwsAsync(()=>E2E.decrypt(sb,m0),'повтор m0 расшифровался');
  });
  await t('ошибка расшифровки не меняет состояние',async()=>{
    const {B,sa}=await pair();const m=await E2E.encrypt(sa,P('x'));
    const sb=await bRespond(B,m),snap=JSON.stringify(sb);
    const bad=clone(m);bad.c=b64(unb64(bad.c).map((x,i)=>i===3?x^1:x));
    await throwsAsync(()=>E2E.decrypt(sb,bad));
    assert(JSON.stringify(sb)===snap,'состояние изменилось');
    assert(S((await E2E.decrypt(sb,m)).plain)==='x','после ошибки нормальное не читается');
  });
  await t('слишком большой пропуск — отклоняется (защита от DoS)',async()=>{
    const {B,sa}=await pair();const m=await E2E.encrypt(sa,P('x'));let sb=(await E2E.decrypt(await bRespond(B,m),m)).st;
    const f=clone(m);f.h.n=5000;await throwsAsync(()=>E2E.decrypt(sb,f));
  });

  console.log('— атаки (сервер подменяет ключи, портит сообщения)');
  await t('подмена ikd собеседника в связке (v2-подпись предключа)',async()=>{
    const A=await device(),B=await device(),M=await device();
    const bundle=E2E.bundleOf(B.id,B.spk,[]);bundle.ikd=b64(M.id.dh.pub);
    await throwsAsync(()=>E2E.initiate(A.id,bundle),'приняли чужой ikd');
  });
  await t('подмена предключа (подпись чужим ключом)',async()=>{
    const A=await device(),B=await device(),M=await device();
    const bundle=E2E.bundleOf(B.id,M.spk,[]);
    await throwsAsync(()=>E2E.initiate(A.id,bundle));
  });
  await t('старая подпись (v1) после срока и при v2only — отклоняется',async()=>{
    const A=await device(),B=await device();
    const v1sig=await _t.sign(B.id.sign.priv,B.spk.pub);
    const bundle=E2E.bundleOf(B.id,{...B.spk,sig:v1sig},[]);
    assert((await E2E.initiate(A.id,bundle,{now:E2E.SPK_V1_UNTIL-1})).spkV===1,'v1 в переходный период');
    await throwsAsync(()=>E2E.initiate(A.id,bundle,{now:E2E.SPK_V1_UNTIL+1}),'v1 после срока');
    await throwsAsync(()=>E2E.initiate(A.id,bundle,{v2only:true,now:0}),'v1 при закреплённом v2');
  });
  await t('выдать себя за собеседника: настоящий ik + свой ikd (ответная сторона)',async()=>{
    const {A,B,sa}=await pair();const M=await device();
    // сервер берёт ik Алисы (код безопасности совпадёт), но ikd/ek свои
    const m=await E2E.encrypt(sa,P('x'));const f=clone(m);f.x.ikd=b64(M.id.dh.pub);
    await throwsAsync(()=>bRespond(B,f),'приняли подменённый ikd');
    const g=clone(m);delete g.x.ikds;await throwsAsync(()=>bRespond(B,g),'приняли без подписи ikd');
    // подпись ikd «под другую метку» (подпись предключа) не подходит
    const h=clone(m);h.x.ikds=b64(await _t.sign(A.id.sign.priv,A.id.dh.pub));await throwsAsync(()=>bRespond(B,h));
  });
  await t('ключ ikd, подписанный, но от другого ik',async()=>{
    const {B,sa}=await pair();const M=await device();
    const m=await E2E.encrypt(sa,P('x'));const f=clone(m);
    f.x.ikd=b64(M.id.dh.pub);f.x.ikds=b64(await E2E.ikdSign(M.id));       // подпись M, а ik — Алисы
    await throwsAsync(()=>bRespond(B,f));
  });
  await t('порча: шифр, тег, заголовок, соль, AD',async()=>{
    const {B,sa}=await pair();const m=await E2E.encrypt(sa,P('секрет'));const sb=await bRespond(B,m);
    const mut=[
      x=>{const c=unb64(x.c);c[0]^=1;x.c=b64(c);},
      x=>{const c=unb64(x.c);c[c.length-1]^=0x80;x.c=b64(c);},                 // тег GCM
      x=>{x.h.n=1;},x=>{x.h.pn=3;},
      x=>{const s=unb64(x.h.s);s[0]^=1;x.h.s=b64(s);},
      x=>{delete x.h.s;},                                                        // откат на формат без соли
      x=>{const d=unb64(x.h.dh);d[5]^=1;x.h.dh=b64(d);},
      x=>{x.c=x.c.slice(0,-8)+'AAAAAAA=';},
    ];
    for(const [i,f] of mut.entries()){const y=clone(m);f(y);await throwsAsync(()=>E2E.decrypt(sb,y),'мутация '+i);}
    const sb2=clone(sb);const ad=unb64(sb2.ad);ad[0]^=1;sb2.ad=b64(ad);await throwsAsync(()=>E2E.decrypt(sb2,m),'другой AD');
  });
  await t('чужая сессия не читает',async()=>{
    const p1=await pair(),p2=await pair();const m=await E2E.encrypt(p1.sa,P('x'));
    await throwsAsync(()=>E2E.decrypt(p2.sa,m));
  });

  console.log('— фаззинг');
  await t('500 случайных/испорченных сообщений: только исключения, состояние цело',async()=>{
    const {B,sa}=await pair();const m=await E2E.encrypt(sa,P('x'));const sb=(await E2E.decrypt(await bRespond(B,m),m)).st;
    const snap=JSON.stringify(sb);const R=n=>Math.floor(Math.random()*n);
    const junk=[null,undefined,0,-1,1.5,2**40,'',' ','A','====','@@@',[],{},{a:1},'x'.repeat(5000),true,NaN];
    for(let i=0;i<500;i++){
      const y=clone(await E2E.encrypt(clone(sa),P('f'+i)));
      const k=R(6);
      if(k===0)y.h[['dh','pn','n','s'][R(4)]]=junk[R(junk.length)];
      else if(k===1)y.c=junk[R(junk.length)];
      else if(k===2)y.h=junk[R(junk.length)];
      else if(k===3){const c=unb64(y.c);c[R(c.length)]^=1<<R(8);y.c=b64(c);}
      else if(k===4){y.c=b64(globalThis.crypto.getRandomValues(new Uint8Array(R(80))));}
      else {y.h.dh=b64(globalThis.crypto.getRandomValues(new Uint8Array(R(40))));}
      let threw=false;try{await E2E.decrypt(sb,y);}catch(e){threw=true;}
      // мутация «в никуда» (например, n поменяли на то же значение) может расшифроваться — главное, состояние не трогаем
      assert(JSON.stringify(sb)===snap,'состояние изменилось на итерации '+i+' (threw='+threw+')');
    }
  });
  await t('фаззинг первого сообщения (respond)',async()=>{
    const {B,sa}=await pair();const m=await E2E.encrypt(sa,P('x'));
    const junk=[null,'','AAAA',b64(new Uint8Array(31)),b64(new Uint8Array(33)),123,{}];
    for(const f of ['ik','ikd','ek','ikds'])for(const j of junk){const y=clone(m);y.x[f]=j;await throwsAsync(()=>bRespond(B,y),f+'='+String(j).slice(0,10));}
  });

  console.log('— nonce');
  await t('ключ+nonce AES-GCM не повторяются (1000 сообщений, вкл. двойное использование состояния)',async()=>{
    const {sa}=await pair();
    // перехватываем расчёт ключа сообщения: смотрим, что выходит из HKDF
    const C=globalThis.crypto.subtle,orig=C.encrypt.bind(C),seen=new Set();let dup=0;
    C.encrypt=async(p,k,d)=>{if(p.name==='AES-GCM'){const raw=tohex(new Uint8Array(await C.exportKey('raw',k).catch(()=>new ArrayBuffer(0))));const id=raw+'|'+tohex(p.iv);if(seen.has(id))dup++;seen.add(id);}return orig(p,k,d);};
    const ek=C.importKey.bind(C);C.importKey=(f,kd,alg,ex,us)=>ek(f,kd,alg,alg==='AES-GCM'?true:ex,us);
    try{
      const st=clone(sa);
      for(let i=0;i<500;i++)await E2E.encrypt(st,P('n'+i));
      // «вторая вкладка» с тем же состоянием: те же ключи цепочки, но соль разная → ключ/nonce разные
      const st2=clone(sa);for(let i=0;i<500;i++)await E2E.encrypt(st2,P('n'+i));
    }finally{C.encrypt=orig;C.importKey=ek;}
    assert(seen.size===1000,'видели '+seen.size);
    assert(dup===0,'повторов: '+dup);
  });

  console.log('— код безопасности');
  await t('симметричен, зависит от всех устройств',async()=>{
    const a=[b64(new Uint8Array(32).fill(1)),b64(new Uint8Array(32).fill(2))],b=[b64(new Uint8Array(32).fill(3))];
    const x=await E2E.fingerprint(a,b),y=await E2E.fingerprint(b,[...a].reverse());
    assert(x===y,'не симметричен');assert(/^(\d{5} ){5}\d{5}$/.test(x),'формат '+x);
    assert(x!==await E2E.fingerprint([a[0]],b),'не учитывает второе устройство');
  });

  console.log(`\n${pass} ok, ${fail} fail`);
  process.exit(fail?1:0);
})();
