// ════════════════════════════════════════
// ── РЕАКЦИИ НА СООБЩЕНИЯ (как в Telegram) + ЭМОДЗИ-СТАТУС ──
// • ПКМ / долгое нажатие по сообщению: над меню — полоска быстрых реакций,
//   стрелка раскрывает её в полную панель (паки, поиск, все эмодзи).
// • Реакция хранится в записи журнала полем rx_{username} (у обеих сторон),
//   так она синкается между собеседниками и всеми устройствами.
// • Эффекты: разлёт частиц, у «смешных» — всплывающие надписи ХАХА шариками.
// • Кастомные реакции SLON (W, ХАХА) можно поставить эмодзи-статусом рядом
//   с ником и узором на фон профиля.
// ════════════════════════════════════════

// ── Кастомные реакции SLON ──
const RX_CUSTOM={
  'c:w':   {label:'W',   txt:'W',   kw:'w win вин победа топ база'},
  'c:haha':{label:'ХАХА',txt:'ХАХА',kw:'хаха haha смех ржака lol'},
};
// пак «Слоники» (js/elephants.js) — анимированные
if(typeof ELEPHANTS!=='undefined')for(const e of ELEPHANTS)RX_CUSTOM['e:'+e[0]]={label:e[1].split(' ')[0],kw:e[1]+' слон слоник',el:e[0]};
const RX_ELS=Object.keys(RX_CUSTOM).filter(k=>k.startsWith('e:'));
// Официальные реакции Telegram
const RX_POPULAR='👍👎❤️🔥🥰👏😁🤔🤯😱🤬😢🎉🤩🤮💩🙏👌🕊️🤡🥱🥴😍🐳❤️‍🔥🌚🌭💯🤣⚡🍌🏆💔🤨😐🍓🍾💋🖕😈😴😭🤓👻👨‍💻👀🎃🙈😇😨🤝✍️🤗🫡🎅🎄☃️💅🤪🗿🆒💘🙉🦄😘💊🙊😎👾🤷‍♂️🤷🤷‍♀️😡';
const RX_CATS=[
  ['smile','Смайлы','😀','😀😃😄😁😆😅🤣😂🙂🙃🫠😉😊😇🥰😍🤩😘😗☺️😚😙🥲😋😛😜🤪😝🤑🤗🤭🫢🫣🤫🤔🫡🤐🤨😐😑😶🫥😏😒🙄😬😮‍💨🤥🫨😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵😵‍💫🤯🤠🥳🥸😎🤓🧐😕🫤😟🙁☹️😮😯😲😳🥺🥹😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀☠️💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾🙈🙉🙊'],
  ['people','Люди','👋','👋🤚🖐️✋🖖🫱🫲🫳🫴👌🤌🤏✌️🤞🫰🤟🤘🤙👈👉👆🖕👇☝️🫵👍👎✊👊🤛🤜👏🙌🫶👐🤲🤝🙏✍️💅🤳💪🦾🦵🦶👂🦻👃🧠🫀🫁🦷🦴👀👁️👅👄🫦👶🧒👦👧🧑👱👨🧔👩🧓👴👵🙍🙎🙅🙆💁🙋🧏🙇🤦🤷👮🕵️💂🥷👷🫅🤴👸👳👲🧕🤵👰🤰🫄🤱👼🎅🤶🦸🦹🧙🧚🧛🧜🧝🧞🧟🧌💆💇🚶🧍🧎🏃💃🕺🕴️👯🧖🧗🤺🏇⛷️🏂🏌️🏄🚣🏊⛹️🏋️🚴🚵🤸🤼🤽🤾🤹🧘🛀🛌👭👫👬💏💑👪🗣️👤👥🫂👣'],
  ['nature','Животные и природа','🐘','🐵🐒🦍🦧🐶🐕🦮🐩🐺🦊🦝🐱🐈🐈‍⬛🦁🐯🐅🐆🐴🫎🫏🐎🦄🦓🦌🦬🐮🐂🐃🐄🐷🐖🐗🐽🐏🐑🐐🐪🐫🦙🦒🐘🦣🦏🦛🐭🐁🐀🐹🐰🐇🐿️🦫🦔🦇🐻🐻‍❄️🐨🐼🦥🦦🦨🦘🦡🐾🦃🐔🐓🐣🐤🐥🐦🐧🕊️🦅🦆🦢🦉🦤🪶🦩🦚🦜🪽🐦‍⬛🪿🐸🐊🐢🦎🐍🐲🐉🦕🦖🐳🐋🐬🦭🐟🐠🐡🦈🐙🐚🪸🪼🐌🦋🐛🐜🐝🪲🐞🦗🪳🕷️🕸️🦂🦟🪰🪱🦠💐🌸💮🪷🏵️🌹🥀🌺🌻🌼🌷🪻🌱🪴🌲🌳🌴🌵🌾🌿☘️🍀🍁🍂🍃🪹🪺🍄☀️🌤️⛅🌥️☁️🌦️🌧️⛈️🌩️🌨️❄️☃️⛄🌬️💨💧💦☔☂️🌊🌫️🌪️🌈⭐🌟💫✨⚡🔥💥☄️🌙🌛🌜🌚🌝🌞🪐🌍🌎🌏'],
  ['food','Еда и напитки','🍕','🍇🍈🍉🍊🍋🍌🍍🥭🍎🍏🍐🍑🍒🍓🫐🥝🍅🫒🥥🥑🍆🥔🥕🌽🌶️🫑🥒🥬🥦🧄🧅🥜🫘🌰🫚🫛🍞🥐🥖🫓🥨🥯🥞🧇🧀🍖🍗🥩🥓🍔🍟🍕🌭🥪🌮🌯🫔🥙🧆🥚🍳🥘🍲🫕🥣🥗🍿🧈🧂🥫🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🥮🍡🥟🥠🥡🦀🦞🦐🦑🦪🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯🍼🥛☕🫖🍵🍶🍾🍷🍸🍹🍺🍻🥂🥃🫗🥤🧋🧃🧉🧊🥢🍽️🍴🥄'],
  ['activity','Активности и места','⚽','⚽🏀🏈⚾🥎🎾🏐🏉🥏🎱🪀🏓🏸🏒🏑🥍🏏🪃🥅⛳🪁🏹🎣🤿🥊🥋🎽🛹🛼🛷⛸️🥌🎿🎯🎮🕹️🎰🎲🧩🧸🪅🪩🪆♟️🃏🀄🎴🎭🖼️🎨🧵🧶🎉🎊🎈🎁🎀🎗️🎟️🎫🎖️🏆🏅🥇🥈🥉🎃🎄🎆🎇🧨✨🎋🎍🎎🎏🎐🎑🧧🚗🚕🚙🚌🏎️🚓🚑🚒🚐🛻🚚🏍️🛵🚲🛴✈️🚀🛸🚁⛵🚢🗿🗽🗼🏰🏯🏟️🎡🎢🌋🗻🏕️🏖️🏜️🏝️🌅🌄🌠🌌🌃🌉🌁'],
  ['objects','Предметы','💡','⌚📱💻⌨️🖥️🖨️🖱️💽💾💿📀📼📷📸📹🎥📽️🎞️📞☎️📟📠📺📻🎙️🎚️🎛️🧭⏱️⏲️⏰🕰️⌛⏳📡🔋🪫🔌💡🔦🕯️🪔🧯💸💵💴💶💷🪙💰💳💎⚖️🪜🧰🪛🔧🔨⚒️🛠️⛏️🪚🔩⚙️🪤🧱⛓️🧲🔫💣🪓🔪🗡️⚔️🛡️🚬⚰️🪦⚱️🏺🔮📿🧿🪬💈⚗️🔭🔬🕳️🩹🩺🩻💊💉🩸🧬🧫🧪🌡️🧹🪠🧺🧻🚽🚿🛁🧼🪥🪒🧽🪣🧴🛎️🔑🗝️🚪🪑🛋️🛏️🪞🪟🛍️🛒📦📫📮📝📁📂📅📆📌📍✂️🖊️✏️🔍🔎🔒🔓'],
  ['symbols','Символы','❤️','❤️🧡💛💚💙🩵💜🤎🖤🩶🤍🩷💔❣️💕💞💓💗💖💘💝💟❤️‍🔥❤️‍🩹☮️✝️☪️🕉️☸️✡️🔯☯️☦️🛐♈♉♊♋♌♍♎♏♐♑♒♓🆔⚛️☢️☣️📴📳🆚💮🉐㊙️㊗️🅰️🅱️🆎🆑🅾️🆘❌⭕🛑⛔📛🚫💯💢♨️🚷🚯🚳🚱🔞📵🚭❗❕❓❔‼️⁉️🔅🔆〽️⚠️🚸🔱⚜️🔰♻️✅💹❇️✳️❎🌐💠Ⓜ️🌀💤🏧🚾♿🅿️🛗🛂🛃🛄🛅🚹🚺🚼⚧️🚻🚮🎦📶🔣ℹ️🔤🔡🔠🆖🆗🆙🆒🆕🆓🔟🔢▶️⏸️⏯️⏹️⏺️⏭️⏮️⏩⏪⏫⏬◀️🔼🔽➡️⬅️⬆️⬇️↗️↘️↙️↖️↕️↔️↪️↩️⤴️⤵️🔀🔁🔂🔄🔃🎵🎶➕➖➗✖️🟰♾️💲💱™️©️®️〰️➰➿🔚🔙🔛🔝🔜✔️☑️🔘🔴🟠🟡🟢🔵🟣⚫⚪🟤🔺🔻🔸🔹🔶🔷🔳🔲▪️▫️◾◽◼️◻️🟥🟧🟨🟩🟦🟪⬛⬜🟫🔈🔇🔉🔊🔔🔕📣📢💬💭🗯️♠️♣️♥️♦️'],
];
// Поиск: ключевые слова → эмодзи
const RX_KW=[
  ['сердце любовь лав люблю heart love','❤️🧡💛💚💙💜🖤🤍🩷💔❤️‍🔥💘💕💖💗💞😍🥰😘💋😻'],
  ['лайк класс палец ок норм like thumb ok good','👍👌🤝👏🙌💯✅🆒'],
  ['дизлайк плохо фу dislike bad','👎💩🤮😡🤬🤢'],
  ['смех ржака хаха лол смешно laugh lol funny haha','c:haha😂🤣😆😁😹💀'],
  ['праздник туса ура поздравляю party','🎉🎊🥳🍾🎈🎁🪩🎂'],
  ['огонь жара fire hot','🔥❤️‍🔥🌶️💥'],
  ['грусть плачу грустно sad cry','😢😭🥺😞😔💔😿'],
  ['злой бесит angry','😡🤬😠👿💢'],
  ['шок ого вау wow shock','😱🤯😮😲😳🙀'],
  ['думаю хм think','🤔🧐🤨'],
  ['клоун clown','🤡'],
  ['череп умер помер skull dead','💀☠️'],
  ['победа вин топ база w win','c:w🏆🥇👑💪🔥'],
  ['еда food','🍕🍔🍟🌭🍌🍓🍿'],
  ['слон elephant','🐘'],
  ['кот кошка cat','🐱😺😹😻🐈'],
  ['собака пёс dog','🐶🐕'],
  ['крутой cool','😎🆒🗿'],
  ['сон спать sleep','😴💤🥱'],
  ['деньги money','💰💸💵🤑'],
  ['поцелуй kiss','💋😘😚😙'],
  ['глаза смотрю eyes','👀'],
  ['спасибо молитва thanks pray','🙏'],
  ['звезда star','⭐🌟✨💫'],
  ['секс','😏🍆🍑'],
];
const RX_LAUGH=new Set(['😂','🤣','😹','😆','😁','c:haha','e:laugh','e:rofl']);
const RX_PARTS={
  '❤️':['❤️','🧡','💛','💚','💙','💜','🩷'],'🥰':['❤️','💕','💖'],'😍':['❤️','💖','💘'],'😘':['💋','❤️'],'💋':['💋','❤️','💕'],
  '💘':['💘','❤️'],'❤️‍🔥':['❤️‍🔥','🔥','❤️'],'💔':['💔'],'🔥':['🔥','✨','💥'],'🎉':['🎊','🎉','✨','🎈'],
  '👍':['👍','✨'],'👎':['👎','💢'],'😭':['💧','💦'],'😢':['💧'],'💩':['💩'],'😡':['💢','🔥'],'🤬':['💢','🔥','💥'],
  '🤯':['💥','✨'],'⚡':['⚡','✨'],'💯':['💯','✨'],'🏆':['⭐','✨','🏆'],'🍾':['🥂','✨','🍾'],'👏':['👏','✨'],
  '🐳':['💦','🫧'],'🌚':['⭐','✨'],'😂':['💦','✨'],'🤣':['💦','✨'],'😹':['💦'],'😆':['✨'],'😁':['✨'],
  'c:haha':['💦','✨'],'c:w':['⭐','✨','👑'],
  'e:love':['❤️','💖','💕'],'e:heart':['❤️','💖','💕'],'e:kiss':['💋','❤️'],'e:hugs':['💕','✨'],'e:fire':['🔥','✨','💥'],
  'e:party':['🎊','🎉','✨'],'e:popper':['🎊','🎉','✨'],'e:cake':['🎉','✨'],'e:cry':['💧','💦'],'e:sad':['💧'],'e:broken':['💔'],
  'e:hundred':['💯','✨'],'e:money':['💵','💸','🪙'],'e:king':['👑','✨'],'e:angry':['💢'],'e:rage':['💢','💥'],'e:boom':['💥','✨'],
  'e:laugh':['💦','✨'],'e:rofl':['💦','✨'],'e:like':['👍','✨'],'e:dislike':['👎'],'e:star':['⭐','✨','🌟'],'e:cool':['😎','✨'],
};

const _rxSeg=s=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(s)].map(x=>x.segment):[...s];
const _rxSplit=s=>{const out=[];let rest=s;while(rest.length){if(/^[ce]:/.test(rest)){const k=Object.keys(RX_CUSTOM).find(k=>rest.startsWith(k));if(k){out.push(k);rest=rest.slice(k.length);continue;}}const g=_rxSeg(rest)[0];out.push(g);rest=rest.slice(g.length);}return out;};
// Реакция допустима: кастомная SLON или эмодзи (без букв, кавычек и тегов)
function _rxValid(e){
  if(typeof e!=='string'||!e)return false;
  if(RX_CUSTOM[e])return true;
  return e.length<=16&&!/[\s<>"'&`\\=a-zA-Zа-яА-Я0-9]/.test(e);
}
function rxHtml(e){
  const c=RX_CUSTOM[e];
  if(c&&c.el)return `<span class="cx-el">${elSvg(c.el)}</span>`;
  if(c)return `<span class="cx cx-${e.slice(2)}"><b>${c.txt}</b></span>`;
  return `<span class="rx-em">${esc(e)}</span>`;
}
function _rxCan(chat){
  if(!chat||chat==='ai'||chat.startsWith('g_'))return false;
  if(typeof SLON_CHANNEL_ID!=='undefined'&&chat===SLON_CHANNEL_ID)return false;
  if(typeof _isChannelId==='function'&&_isChannelId(chat))return false;
  return true;
}

// ── Недавние ──
const _rxRecentKey=()=>'sl_u_'+myUsername+'_rxRecent';
function _rxRecent(){const a=LS.get(_rxRecentKey(),[]);return Array.isArray(a)?a.filter(_rxValid):[];}
function _rxTouch(e){LS.set(_rxRecentKey(),[e,..._rxRecent().filter(x=>x!==e)].slice(0,24));}
function _rxQuick(){
  const out=[];
  for(const e of [..._rxRecent(),'❤️','👍','🔥','c:haha','e:laugh','c:w','😭','🤣','👎'])if(!out.includes(e))out.push(e);
  return out.slice(0,7);
}

// ── Поставить / снять реакцию ──
function _rxReact(msg,e,chat){
  chat=chat||activeChat;
  if(!msg||!_rxValid(e))return;
  const rx={...(msg.rx||{})};
  const nv=rx[myUsername]===e?'':e;
  if(nv)rx[myUsername]=nv;else delete rx[myUsername];
  if(Object.keys(rx).length)msg.rx=rx;else delete msg.rx;
  if(nv)_rxTouch(nv);
  _rxRender(msg);
  if(nv)_rxFx(nv,msg.id);
  saveAll();
  if(typeof _mlEdit==='function')_mlEdit(chat,msg.id,{['rx_'+myUsername]:nv});
}
// Реакции из записи журнала (с сервера / с другого устройства)
function _rxOf(r){
  const rx={};
  for(const k in r)if(k.startsWith('rx_')&&_rxValid(r[k]))rx[k.slice(3)]=r[k];
  return Object.keys(rx).length?rx:null;
}
const _rxSig=o=>Object.keys(o||{}).sort().map(k=>k+'='+o[k]).join('|');
function _rxFromRec(r,fx){
  if(!r||!r.chat||!r.id)return;
  const m=(chatHist[r.chat]||[]).find(x=>x.id===r.id);if(!m)return;
  const rx=_rxOf(r)||{},old=m.rx||{};
  if(_rxSig(rx)===_rxSig(old))return;
  const added=Object.keys(rx).filter(u=>rx[u]!==old[u]);
  if(Object.keys(rx).length)m.rx=rx;else delete m.rx;
  _rxRender(m);saveAll();
  if(fx&&added.length&&activeChat===r.chat&&document.visibilityState==='visible')setTimeout(()=>_rxFx(rx[added[0]],m.id),60);
}

// ── Плашки реакций под сообщением ──
function _rxAv(u){
  const me=u===myUsername,src=me?myAvatar:peerAvatars[u];
  if(src)return `<span class="rx-av"><img src="${esc(src)}" alt=""></span>`;
  const n=String((me?myNick:peerNames[u])||u).replace(/^@/,'');
  return `<span class="rx-av rx-av-l">${esc((n[0]||'?').toUpperCase())}</span>`;
}
function _rxRender(m,root){
  const wrap=(root||document).querySelector('[data-msg-id="'+CSS.escape(String(m.id))+'"]');if(!wrap)return;
  const body=wrap.querySelector('.msg-body')||wrap;
  let box=body.querySelector(':scope>.msg-rx');
  const groups={};
  for(const [u,e] of Object.entries(m.rx||{}))if(_rxValid(e))(groups[e]=groups[e]||[]).push(u);
  const keys=Object.keys(groups);
  if(!keys.length){box?.remove();wrap.classList.remove('has-rx');return;}
  if(!box)box=wrap.querySelector('.msg-bub>.msg-rx');
  if(!box){
    box=document.createElement('div');box.className='msg-rx';
    // текст — внутри пузыря (время встаёт справа в ту же строку, как в Telegram); медиа — под ним
    const bub=body.querySelector(':scope>.msg-bub:not(.call-bub)');
    if(bub)bub.appendChild(box);
    else{const t=body.querySelector(':scope>.msg-time');body.insertBefore(box,t||null);}
  }
  wrap.classList.add('has-rx');
  const had=new Set([...box.querySelectorAll('.rx-chip')].map(b=>b.dataset.e));
  box.innerHTML=keys.map(e=>{
    const us=groups[e],mine=us.includes(myUsername);
    const who=us.length<=3?`<span class="rx-avs">${us.map(_rxAv).join('')}</span>`:`<span class="rx-n">${us.length}</span>`;
    return `<button class="rx-chip${mine?' mine':''}${had.has(e)?'':' rx-new'}" data-e="${esc(e)}">${rxHtml(e)}${who}</button>`;
  }).join('');
  box.querySelectorAll('.rx-chip').forEach(b=>b.onclick=ev=>{ev.stopPropagation();_rxReact(m,b.dataset.e);});
}

// ── Эффекты ──
function _rxLayer(){
  let l=$('rxFx');
  if(!l){l=document.createElement('div');l.id='rxFx';document.body.appendChild(l);}
  return l;
}
const _rnd=(a,b)=>a+Math.random()*(b-a);
function _rxFx(e,mid){
  if(document.body.classList.contains('perf-noanim'))return;
  const chip=document.querySelector('#msgs [data-msg-id="'+CSS.escape(String(mid))+'"] .rx-chip[data-e="'+CSS.escape(e)+'"]');
  if(!chip)return;
  chip.classList.remove('rx-pop');void chip.offsetWidth;chip.classList.add('rx-pop');
  const r=chip.getBoundingClientRect(),x=r.left+16,y=r.top+r.height/2;
  const layer=_rxLayer();
  if(RX_LAUGH.has(e))_rxBalloons(layer,x,y,['ХАХА','ХАХАХА','АХАХАХ','ХАХ','АХАХА','ПХАХАХ','ХЫХЫ','LOL','АХАХАХАХА','ХЕХ','ХАХАХАХ','ору']);
  else if(e==='c:w')_rxBalloons(layer,x,y,['W','W','W','BIG W','W','W','WWW']);
  _rxBurst(layer,x,y,RX_PARTS[e]||[e,'✨']);
}
// Разлёт частиц вокруг реакции
function _rxBurst(layer,x,y,parts){
  const n=14;
  for(let i=0;i<n;i++){
    const el=document.createElement('span');el.className='rx-part';
    const p=parts[i%parts.length];
    el.innerHTML=RX_CUSTOM[p]?rxHtml(p):esc(p);
    el.style.left=x+'px';el.style.top=y+'px';
    layer.appendChild(el);
    const a=Math.random()*Math.PI*2,d=_rnd(38,95),s=_rnd(.55,1.15),rot=_rnd(-50,50);
    const dx=Math.cos(a)*d,dy=Math.sin(a)*d;
    el.animate([
      {transform:'translate(-50%,-50%) scale(0)',opacity:1},
      {transform:`translate(calc(-50% + ${dx*.75}px),calc(-50% + ${dy*.75}px)) scale(${s})`,opacity:1,offset:.45},
      {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy-26}px)) scale(${s*.7}) rotate(${rot}deg)`,opacity:0}
    ],{duration:_rnd(750,1250),delay:i*12,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'}).onfinish=()=>el.remove();
  }
}
// Надписи шариками: разные шрифты, цвета, всплывают и покачиваются
const RX_FONTS=['Impact,"Arial Narrow Bold",sans-serif','"Comic Sans MS","Comic Neue",cursive','"Arial Black","Segoe UI Black",sans-serif',
  'Georgia,"Times New Roman",serif','"Courier New",monospace','"Segoe Script","Brush Script MT",cursive','"Trebuchet MS",sans-serif','fantasy','"Segoe Print",cursive'];
const RX_COLORS=['#ff4d6d','#ffb703','#3a86ff','#8338ec','#06d6a0','#fb5607','#ff006e','#00b4d8','#f15bb5','#7cb518'];
function _rxBalloons(layer,x,y,words){
  const n=Math.min(11,Math.max(7,Math.round(window.innerWidth/90)));
  for(let i=0;i<n;i++){
    const el=document.createElement('span');el.className='rx-balloon';
    el.textContent=words[Math.floor(Math.random()*words.length)];
    const col=RX_COLORS[Math.floor(Math.random()*RX_COLORS.length)];
    el.style.cssText=`left:${x+_rnd(-110,110)}px;top:${y+_rnd(-10,20)}px;font-family:${RX_FONTS[Math.floor(Math.random()*RX_FONTS.length)]};`
      +`color:${col};font-size:${Math.round(_rnd(17,38))}px;font-weight:${Math.random()<.6?900:700};font-style:${Math.random()<.3?'italic':'normal'}`;
    layer.appendChild(el);
    const dy=-_rnd(170,Math.min(420,window.innerHeight*.6)),sw=_rnd(14,38)*(Math.random()<.5?-1:1),rot=_rnd(-18,18);
    el.animate([
      {transform:`translate(-50%,0) scale(.2) rotate(${rot}deg)`,opacity:0},
      {transform:`translate(calc(-50% + ${sw}px),${dy*.22}px) scale(1.05) rotate(${-rot/2}deg)`,opacity:1,offset:.18},
      {transform:`translate(calc(-50% - ${sw}px),${dy*.55}px) scale(1) rotate(${rot/2}deg)`,opacity:1,offset:.55},
      {transform:`translate(calc(-50% + ${sw*.6}px),${dy*.85}px) scale(.95) rotate(${-rot/3}deg)`,opacity:.9,offset:.85},
      {transform:`translate(-50%,${dy}px) scale(.9) rotate(0deg)`,opacity:0}
    ],{duration:_rnd(1900,3000),delay:i*_rnd(60,120),easing:'cubic-bezier(.33,.6,.45,1)',fill:'both'}).onfinish=()=>el.remove();
  }
}

// ════════ Панель реакций: полоска над меню → полная панель ════════
let _rxCtx=null;          // {mode:'react'|'status', msg, chat}
function _rxBox(){
  let b=$('rxBox');
  if(!b){b=document.createElement('div');b.id='rxBox';b.className='rx-box';document.body.appendChild(b);}
  return b;
}
function _rxClose(instant){
  const b=$('rxBox');if(!b||!b.classList.contains('show'))return;
  b.classList.remove('show');
  const done=()=>{if(b.classList.contains('show'))return;b.className='rx-box';b.removeAttribute('style');b.innerHTML='';};
  if(instant)done();else setTimeout(done,220);
  _rxCtx=null;
}
const _rxChevron='<svg viewBox="0 0 24 24"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
function _rxOpenBar(msg,chat){
  const menu=$('chatCtxMenu'),b=_rxBox();
  _rxCtx={mode:'react',msg,chat};
  b.className='rx-box';b.removeAttribute('style');
  const mine=msg.rx?.[myUsername];
  b.innerHTML=`<div class="rx-quick">${_rxQuick().map((e,i)=>`<button class="rx-q${mine===e?' sel':''}" style="--i:${i}" data-e="${esc(e)}">${rxHtml(e)}</button>`).join('')}
    <button class="rx-more" title="Все реакции">${_rxChevron}</button></div><div class="rx-full"></div>`;
  b.querySelectorAll('.rx-q').forEach(x=>x.onclick=ev=>{ev.stopPropagation();const c=_rxCtx;closeMsgMenu();_rxClose();if(c)_rxReact(c.msg,x.dataset.e,c.chat);});
  b.querySelector('.rx-more').onclick=ev=>{ev.stopPropagation();_rxExpand();};
  // над меню; не влезает — сдвигаем меню вниз
  const bw=b.offsetWidth,bh=b.offsetHeight;
  let mt=menu.getBoundingClientRect().top,ml=menu.getBoundingClientRect().left;
  if(mt-bh-8<8){mt=bh+16;menu.style.top=mt+'px';}
  const mh=menu.offsetHeight;
  if(mt+mh>window.innerHeight-8){mt=Math.max(bh+16,window.innerHeight-mh-8);menu.style.top=mt+'px';}
  b.style.left=Math.max(8,Math.min(ml,window.innerWidth-bw-8))+'px';
  b.style.top=(mt-bh-8)+'px';
  void b.offsetWidth;b.classList.add('show');
}
const _rxSec=(id,title,list)=>`<div class="rx-sec" data-s="${id}"><div class="rx-sec-h">${title}</div><div class="rx-grid">${list.map(e=>`<button class="rx-i" data-e="${esc(e)}">${rxHtml(e)}</button>`).join('')}</div></div>`;
// Эмодзи-статус — только наши паки (без стандартных эмодзи)
function _rxFullHtmlStatus(){
  let h='';
  if(_esGet())h+=`<button class="rx-clear">Убрать эмодзи-статус</button>`;
  h+=_rxSec('slon','SLON',Object.keys(RX_CUSTOM).filter(k=>k.startsWith('c:')))+_rxSec('elephants','Слоники',RX_ELS);
  return `<div class="rx-tabs"><button class="rx-tab" data-s="slon" title="SLON">${rxHtml('c:w')}</button><button class="rx-tab" data-s="elephants" title="Слоники">${rxHtml('e:smile')}</button><span class="rx-tab-ind"></span></div>
    <div class="rx-search"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <input class="rx-q-inp" placeholder="Поиск статуса" autocomplete="off"></div>
    <div class="rx-scroll"><div class="rx-res" hidden></div><div class="rx-secs">${h}</div></div>`;
}
// Полная панель: паки сверху, поиск, сетка с разделами
const _rxSegMemo=new Map();
function _rxSegC(s){let v=_rxSegMemo.get(s);if(!v){v=_rxSeg(s);_rxSegMemo.set(s,v);}return v;}
const _rxSecMemo={};
// высота раздела заранее — чтобы невидимые разделы не рисовались (content-visibility), а прокрутка не прыгала
const _rxSecH=n=>Math.ceil(n/8)*42+34;
function _rxSecHtml(id,title,list,memo){
  if(memo&&_rxSecMemo[id])return _rxSecMemo[id];
  const h=`<div class="rx-sec" data-s="${id}" style="contain-intrinsic-size:auto ${_rxSecH(list.length)}px"><div class="rx-sec-h">${title}</div><div class="rx-grid">${list.map(e=>`<button class="rx-i" data-e="${esc(e)}">${rxHtml(e)}</button>`).join('')}</div></div>`;
  if(memo)_rxSecMemo[id]=h;
  return h;
}
const _rxCatsHtml=()=>_rxSecMemo.__cats||(_rxSecMemo.__cats=RX_CATS.map(c=>_rxSecHtml(c[0],c[1],_rxSegC(c[3]),true)).join(''));
// остальные категории — дорисовываем после анимации раскрытия
function _rxFullRest(b){
  const secs=b?.querySelector('.rx-secs');if(!secs||secs.dataset.rest)return;
  secs.dataset.rest='1';secs.insertAdjacentHTML('beforeend',_rxCatsHtml());
}
function _rxFullHtml(){
  const rec=_rxRecent();
  const st=_rxCtx?.mode==='status';
  if(st)return _rxFullHtmlStatus();
  const tabs=[['recent','<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7z"/></svg>','Недавние'],
    ['slon',rxHtml('c:w'),'SLON'],['elephants',rxHtml('e:smile'),'Слоники'],['popular',rxHtml('❤️'),'Популярные'],...RX_CATS.map(c=>[c[0],rxHtml(c[2]),c[1]])];
  const sec=(id,title,list,memo)=>_rxSecHtml(id,title,list,memo);
  let h='';
  if(_rxCtx?.mode==='status'&&_esGet())h+=`<button class="rx-clear">Убрать эмодзи-статус</button>`;
  if(rec.length)h+=sec('recent','Недавние',rec);
  h+=sec('slon','SLON',Object.keys(RX_CUSTOM).filter(k=>k.startsWith('c:')),true);
  h+=sec('elephants','Слоники',RX_ELS,true);
  h+=sec('popular','Популярные',_rxSegC(RX_POPULAR),true);
  const filt=[['сердце','❤️'],['лайк','👍'],['дизлайк','👎'],['праздник','🎉'],['смех','😂']];
  return `<div class="rx-tabs">${tabs.filter(t=>t[0]!=='recent'||rec.length).map(t=>`<button class="rx-tab" data-s="${t[0]}" title="${t[2]}">${t[1]}</button>`).join('')}<span class="rx-tab-ind"></span></div>
    <div class="rx-search"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <input class="rx-q-inp" placeholder="Поиск эмодзи" autocomplete="off">
      <div class="rx-filt">${filt.map(f=>`<button data-q="${f[0]}" title="${f[0]}">${f[1]}</button>`).join('')}</div></div>
    <div class="rx-scroll"><div class="rx-res" hidden></div><div class="rx-secs">${h}</div></div>`;
}
function _rxWireFull(b){
  const full=b.querySelector('.rx-full'),scroll=full.querySelector('.rx-scroll'),ind=full.querySelector('.rx-tab-ind');
  const tabs=[...full.querySelectorAll('.rx-tab')];
  const pick=e=>{
    const c=_rxCtx;if(!c)return;
    _rxTouch(e);
    if(c.mode==='status'){_esSet(e);_rxClose();return;}
    closeMsgMenu();_rxClose();_rxReact(c.msg,e,c.chat);
  };
  full.addEventListener('click',ev=>{
    const it=ev.target.closest('.rx-i');if(it){ev.stopPropagation();pick(it.dataset.e);}
  });
  full.querySelector('.rx-clear')?.addEventListener('click',ev=>{ev.stopPropagation();_esSet('');_rxClose();});
  // вкладки: плавная прокрутка к разделу, полоска-указатель едет за разделом
  const moveInd=t=>{if(!t)return;tabs.forEach(x=>x.classList.toggle('on',x===t));ind.style.width=t.offsetWidth+'px';ind.style.transform=`translateX(${t.offsetLeft}px)`;
    const strip=t.parentNode;const l=t.offsetLeft-strip.clientWidth/2+t.offsetWidth/2;strip.scrollTo({left:l,behavior:'smooth'});};
  let lock=0;
  tabs.forEach(t=>t.onclick=ev=>{
    ev.stopPropagation();
    if(!scroll.querySelector('.rx-sec[data-s="'+t.dataset.s+'"]'))_rxFullRest(b);
    const s=scroll.querySelector('.rx-sec[data-s="'+t.dataset.s+'"]');if(!s)return;
    lock=Date.now();moveInd(t);
    scroll.scrollTo({top:s.offsetTop-4,behavior:'smooth'});
  });
  scroll.addEventListener('scroll',()=>{
    if(Date.now()-lock<600)return;
    let cur=null;for(const s of scroll.querySelectorAll('.rx-secs .rx-sec'))if(s.offsetTop-scroll.scrollTop<=40)cur=s;
    const t=tabs.find(x=>x.dataset.s===(cur||scroll.querySelector('.rx-sec'))?.dataset.s);
    if(t&&!t.classList.contains('on'))moveInd(t);
  },{passive:true});
  setTimeout(()=>moveInd(tabs[0]),30);
  // поиск
  const inp=full.querySelector('.rx-q-inp'),res=full.querySelector('.rx-res'),secs=full.querySelector('.rx-secs');
  const search=q=>{
    q=q.trim().toLowerCase();
    if(!q){res.hidden=true;secs.hidden=false;return;}
    const out=[];
    const add=s=>{for(const e of _rxSplit(s))if(!out.includes(e))out.push(e);};
    const onlyOur=_rxCtx?.mode==='status';
    if(!onlyOur)for(const [k,v] of RX_KW)if(k.split(' ').some(w=>w.startsWith(q)||q.startsWith(w)&&w.length>=3))add(v);
    for(const [k,c] of Object.entries(RX_CUSTOM))if(c.kw.split(' ').some(w=>w.startsWith(q)))add(k);
    if(!onlyOur)for(const e of _rxSeg(q))if(!/[a-zа-я0-9\s]/i.test(e)&&!out.includes(e))out.push(e);
    res.innerHTML=out.length?`<div class="rx-sec"><div class="rx-sec-h">Результаты</div><div class="rx-grid">${out.map(e=>`<button class="rx-i" data-e="${esc(e)}">${rxHtml(e)}</button>`).join('')}</div></div>`
      :'<div class="rx-empty">Ничего не нашлось</div>';
    res.hidden=false;secs.hidden=true;
    res.classList.remove('rx-fade');void res.offsetWidth;res.classList.add('rx-fade');
    scroll.scrollTop=0;
  };
  inp.addEventListener('input',()=>search(inp.value));
  inp.addEventListener('click',ev=>ev.stopPropagation());
  full.querySelectorAll('.rx-filt button').forEach(x=>x.onclick=ev=>{
    ev.stopPropagation();
    const on=!x.classList.contains('on');
    full.querySelectorAll('.rx-filt button').forEach(y=>y.classList.remove('on'));
    x.classList.toggle('on',on);inp.value='';search(on?x.dataset.q:'');
  });
}
function _rxFullSize(){return {w:Math.min(376,window.innerWidth-16),h:Math.min(430,window.innerHeight-16)};}
// Полоска плавно вырастает в полную панель, меню уходит
function _rxExpand(){
  const b=$('rxBox');if(!b||b.classList.contains('full'))return;
  const r=b.getBoundingClientRect(),{w,h}=_rxFullSize();
  $('chatCtxMenu')?.classList.remove('show');
  const left=Math.max(8,Math.min(r.left,window.innerWidth-w-8));
  const top=Math.max(8,Math.min(r.top,window.innerHeight-h-8));
  const q=b.querySelector('.rx-quick');
  b.querySelector('.rx-full').innerHTML=_rxFullHtml();
  b.classList.add('full');
  Object.assign(b.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  q.style.left=(r.left-left)+'px';q.style.top=(r.top-top)+'px';
  b.style.clipPath=`inset(${r.top-top}px ${left+w-r.right}px ${top+h-r.bottom}px ${r.left-left}px round 26px)`;
  void b.offsetWidth;
  b.classList.add('rx-clip');b.style.clipPath='inset(-40px round 0px)';
  _rxWireFull(b);
  setTimeout(()=>{_rxFullRest(b);b.classList.remove('rx-clip');b.style.clipPath='';},360);
}
// Сразу полная панель (выбор эмодзи-статуса) — вырастает из элемента
function _rxOpenPicker(anchor,mode){
  _rxClose(true);
  const b=_rxBox();_rxCtx={mode};
  b.className='rx-box full';
  b.innerHTML='<div class="rx-quick"></div><div class="rx-full"></div>';
  b.querySelector('.rx-full').innerHTML=_rxFullHtml();
  _rxWireFull(b);
  const a=anchor.getBoundingClientRect(),{w,h}=_rxFullSize();
  const left=Math.max(8,Math.min(a.left-20,window.innerWidth-w-8));
  let top=a.bottom+8;if(top+h>window.innerHeight-8)top=Math.max(8,a.top-h-8);
  b.style.cssText=`left:${left}px;top:${top}px;width:${w}px;height:${h}px;transform-origin:${Math.max(0,a.left-left+10)}px ${top>a.top?0:h}px`;
  void b.offsetWidth;b.classList.add('show');
}
// Закрытие: клик мимо, Esc, прокрутка чата
document.addEventListener('mousedown',e=>{if($('rxBox')?.classList.contains('show')&&!e.target.closest('#rxBox,#chatCtxMenu'))_rxClose();},true);
document.addEventListener('touchstart',e=>{if($('rxBox')?.classList.contains('show')&&!e.target.closest('#rxBox,#chatCtxMenu'))_rxClose();},{passive:true,capture:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('rxBox')?.classList.contains('show')){_rxClose();closeMsgMenu();}});

// ── Встраивание в меню сообщения, отрисовку и журнал ──
const _rxShowMenu0=showMsgMenu;
showMsgMenu=function(e,msg,isOut){
  _rxClose(true);
  const r=_rxShowMenu0.apply(this,arguments);
  try{if(_rxCan(activeChat)&&msg&&msg.id&&msg.sender!=='system')_rxOpenBar(msg,activeChat);}catch(err){console.warn('rx bar',err);}
  return r;
};
const _rxCloseMenu0=closeMsgMenu;
closeMsgMenu=function(){
  const r=_rxCloseMenu0.apply(this,arguments);
  if(!$('rxBox')?.classList.contains('full'))_rxClose();
  return r;
};
const _rxAppend0=appendMsg;
appendMsg=function(msg,container){
  const r=_rxAppend0.apply(this,arguments);
  try{if(msg&&msg.rx)_rxRender(msg,container||$('msgs'));}catch(e){}
  return r;
};
if(typeof _mlMaterialize==='function'){
  const _rxMat0=_mlMaterialize;
  _mlMaterialize=async function(key,r0){
    const m=await _rxMat0.apply(this,arguments);
    try{const rx=m&&_rxOf(r0);if(rx)m.rx=rx;}catch(e){}
    return m;
  };
}
if(typeof _mlOnAdd==='function'){
  const _rxAdd0=_mlOnAdd;
  _mlOnAdd=function(key,r){try{_rxFromRec(r,false);}catch(e){}return _rxAdd0.apply(this,arguments);};
}
if(typeof _mlOnChange==='function'){
  const _rxChg0=_mlOnChange;
  _mlOnChange=function(key,r){
    try{if(r&&!r.del&&!r.gone)_rxFromRec(r,true);}catch(e){}
    const out=_rxChg0.apply(this,arguments);
    // правка текста переписывает пузырь — вернуть плашки
    try{const m=r&&(chatHist[r.chat]||[]).find(x=>x.id===r.id);if(m&&m.rx)_rxRender(m);}catch(e){}
    return out;
  };
}
// Двойной клик по сообщению — быстрая реакция (как в Telegram)
document.addEventListener('dblclick',e=>{
  const w=e.target.closest?.('#msgs .msg[data-msg-id]');if(!w||e.target.closest('a,button,input,textarea,video,audio,.rx-chip'))return;
  if(!_rxCan(activeChat))return;
  const f=_getMsgFromHist(w.dataset.msgId);if(!f)return;
  window.getSelection?.().removeAllRanges();
  _rxReact(f.m,_rxQuick()[0]||'👍');
});

// ════════ ЭМОДЗИ-СТАТУС (справа от ника) ════════
let myEmojiStatus='',_esUser=null;
let peerEmojiStatus={},_esPeerUser=null;
const _esOk=v=>typeof v==='string'&&!!RX_CUSTOM[v];
function _esGet(){
  if(_esUser!==myUsername){_esUser=myUsername;const v=LS.get('sl_u_'+myUsername+'_estatus','');myEmojiStatus=_esOk(v)?v:'';}
  return myEmojiStatus;
}
function _esPeers(){
  if(_esPeerUser!==myUsername){_esPeerUser=myUsername;peerEmojiStatus=LS.get('sl_u_'+myUsername+'_peerES',{})||{};}
  return peerEmojiStatus;
}
function _esSetLocal(v){_esGet();myEmojiStatus=_esOk(v)?v:'';LS.set('sl_u_'+myUsername+'_estatus',myEmojiStatus);}
function _esSet(v){
  _esSetLocal(v);
  if(typeof _spRender==='function'&&$('spPanel')?.classList.contains('open'))_spRender(true);
  saveAll();
  try{_broadcastHello();}catch(e){}
  toast(v?'Эмодзи-статус установлен':'Эмодзи-статус убран');
}
function _esHtml(e,click){
  if(!e||!_esOk(e))return '';
  return `<span class="es-ico"${click?` onclick="event.stopPropagation();_rxOpenPicker(this,'status')" title="Сменить эмодзи-статус"`:''}>${rxHtml(e)}</span>`;
}
function _esPaint(pid){
  const e=_esPeers()[pid]||'';
  const put=el=>{if(!el)return;el.querySelectorAll('.es-ico').forEach(x=>x.remove());if(e)el.insertAdjacentHTML('beforeend',_esHtml(e));};
  put($('sbn-'+pid));
  if(activeChat===pid)put($('chName'));
  if(typeof _spPeerOpenId!=='undefined'&&_spPeerOpenId===pid&&$('peerProfOverlay')?.classList.contains('show'))put($('peerProfName'));
}
// статус едет вместе с профилем: собеседникам (hello + публичный профиль) и на мои устройства
if(typeof _myHelloFor==='function'){const f=_myHelloFor;_myHelloFor=function(){const d=f.apply(this,arguments);if(d)d.estatus=_esGet();return d;};}
if(typeof _myPublicProfile==='function'){const f=_myPublicProfile;_myPublicProfile=function(){const d=f.apply(this,arguments);if(d)d.estatus=_esGet();return d;};}
if(typeof PS_FIELDS!=='undefined')PS_FIELDS.estatus=[()=>_esGet(),v=>{_esSetLocal(v||'');}];
if(typeof _applyExtraProfile==='function'){
  const f=_applyExtraProfile;
  _applyExtraProfile=function(pid,d){
    const r=f.apply(this,arguments);
    if(d&&'estatus' in d){
      const v=_esOk(d.estatus)?d.estatus:'',all=_esPeers();
      if((all[pid]||'')!==v){if(v)all[pid]=v;else delete all[pid];LS.set('sl_u_'+myUsername+'_peerES',all);}
      setTimeout(()=>_esPaint(pid),0);
    }
    return r;
  };
}
// дорисовываем статус там, где имя переписывается целиком
for(const fn of ['updateSbName','addSbItem']){
  if(typeof window[fn]!=='function')continue;
  const f=window[fn];
  window[fn]=function(pid){const r=f.apply(this,arguments);try{_esPaint(pid);}catch(e){}return r;};
}
if(typeof updateChatHeader==='function'){
  const f=updateChatHeader;
  updateChatHeader=function(){const r=f.apply(this,arguments);try{if(activeChat&&_esPeers()[activeChat])_esPaint(activeChat);}catch(e){}return r;};
}
if(typeof _ppRender==='function'){
  const f=_ppRender;
  _ppRender=function(pid){const r=f.apply(this,arguments);try{const e=_esPeers()[pid];if(e)$('peerProfName')?.insertAdjacentHTML('beforeend',_esHtml(e));}catch(err){}return r;};
}
if(typeof _spRender==='function'){
  const f=_spRender;
  _spRender=function(){
    const r=f.apply(this,arguments);
    try{
      const el=$('spName');
      if(el){const e=_esGet();
        el.insertAdjacentHTML('beforeend',e?_esHtml(e,true)
          :`<span class="es-ico es-add" onclick="event.stopPropagation();_rxOpenPicker(this,'status')" title="Установить эмодзи-статус"><svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg></span>`);}
    }catch(e){}
    return r;
  };
}

// ── Кастомные реакции — ещё и узоры на фон профиля (без белой подложки) ──
for(const [k,c] of Object.entries(RX_CUSTOM)){
  const id='pat_'+k.replace(':','_');
  if(!PREMIUM_BG_PATTERNS.some(p=>p.id===id))PREMIUM_BG_PATTERNS.push({id,emoji:rxHtml(k),label:c.el?'Слоник: '+c.label:c.label,txt:c.txt,el:c.el});
}

// прогрев в простое: разбор эмодзи и HTML разделов готовы до первого открытия панели
setTimeout(()=>{
  const idle=window.requestIdleCallback||(f=>setTimeout(f,50));
  idle(()=>{_rxSegC(RX_POPULAR);RX_ELS.forEach(rxHtml);});
  idle(()=>{_rxCatsHtml();});
},2500);
