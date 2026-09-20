// ── FIREBASE SIGNALING INIT (compat — работает с file://) ──
const firebaseConfig = {
  apiKey: "AIzaSyAYV5ZAvFDtkb7UU3PddU8OuCCIi0uHfoM",
  authDomain: "slon-376b4.firebaseapp.com",
  databaseURL: "https://slon-376b4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "slon-376b4",
  messagingSenderId: "1045440523817",
  appId: "1:1045440523817:web:c7fd2f599238014f3bb638"
};
firebase.initializeApp(firebaseConfig);
const _db = firebase.database();
window._fbDb = _db;
window._fbRef = (db, path) => db.ref(path);
window._fbSet = (ref, val) => ref.set(val);
window._fbRemove = (ref) => ref.remove();
window._fbPush = (ref, val) => ref.push(val);
window._fbOnValue = (ref, cb, opts) => {
  if(opts && opts.onlyOnce){ ref.once('value').then(cb).catch(()=>{}); return ()=>{}; }
  ref.on('value', cb); return ()=>ref.off('value', cb);
};
window._fbOnChildAdded = (ref, cb) => { ref.on('child_added', cb); return ()=>ref.off('child_added', cb); };
window._fbOnChildRemoved = (ref, cb) => { ref.on('child_removed', cb); return ()=>ref.off('child_removed', cb); };
window._fbOff = (ref) => ref.off();
window._firebaseReady = true;
window.dispatchEvent(new Event('firebaseReady'));

// ═══ MAIN APP LOGIC ═══
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const nowTime = () => { const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
const fmtTime = (ts) => { const d=new Date(ts); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };

// Дата для разделителей в чате: "Сегодня", "Вчера", "23 мая" или "23 мая 2024"


// Превращаем ссылки в кликабельные <a>. Безопасно эскейпит остальное.

const fmtSz = b => b<1024?b+'B':b<1048576?(b/1024).toFixed(1)+'KB':(b/1048576).toFixed(1)+'MB';
const icoSvg = id => `<svg><use href="#${id}"/></svg>`;

// ── ANDROID POLYFILL ──
(function(){
  if(typeof navigator!=='undefined'){
    if(!navigator.mediaDevices)navigator.mediaDevices={};
    if(!navigator.mediaDevices.getUserMedia){
      const gum=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia;
      if(gum)navigator.mediaDevices.getUserMedia=c=>new Promise((res,rej)=>gum.call(navigator,c,res,rej));
    }
    if(!navigator.mediaDevices.enumerateDevices)navigator.mediaDevices.enumerateDevices=()=>Promise.resolve([]);
  }
  if(typeof window!=='undefined'){
    window.RTCPeerConnection=window.RTCPeerConnection||window.webkitRTCPeerConnection||window.mozRTCPeerConnection;
    window.RTCSessionDescription=window.RTCSessionDescription||window.webkitRTCSessionDescription||window.mozRTCSessionDescription;
    window.RTCIceCandidate=window.RTCIceCandidate||window.webkitRTCIceCandidate||window.mozRTCIceCandidate;
  }
})();
const hasMediaDevices=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);

// ── THEMES ──
const THEMES=[
  // Бесплатные
  {id:'liketg', lbl:'like tg',     grad:'linear-gradient(135deg,#8fb981 0%,#cfd79b 50%,#eeffde 50%,#ffffff 100%)', premium:false},
  {id:'dark',   lbl:'Тёмная',      grad:'linear-gradient(135deg,#0d1117,#58a6ff)',  premium:false},
  {id:'light',  lbl:'Светлая',     grad:'linear-gradient(135deg,#f0f2f5,#0084ff)',  premium:false},
  {id:'pink',   lbl:'Розовая',     grad:'linear-gradient(135deg,#2a1022,#f472b6)',  premium:false},
  {id:'purple', lbl:'Фиолет',      grad:'linear-gradient(135deg,#120820,#c084fc)',  premium:false},
  {id:'ocean',  lbl:'Океан',       grad:'linear-gradient(135deg,#071929,#38bdf8)',  premium:false},
  {id:'galaxy', lbl:'Галактика',   grad:'linear-gradient(135deg,#020617,#818cf8)',  premium:false},
  {id:'green',  lbl:'Природа',     grad:'linear-gradient(135deg,#071a0f,#4ade80)',  premium:false},
  {id:'sunset', lbl:'Закат',       grad:'linear-gradient(135deg,#1c0900,#fb923c)',  premium:false},
  {id:'autumn', lbl:'Осень',       grad:'linear-gradient(135deg,#1a0c00,#f59e0b)',  premium:false},
  // SLON Premium
  {id:'midnight',   lbl:'Полночь',     grad:'linear-gradient(135deg,#000,#60a5fa)',       premium:true},
  {id:'cherry',     lbl:'Вишня',       grad:'linear-gradient(135deg,#1a0012,#fb7185)',     premium:true},
  {id:'arctic',     lbl:'Арктика',     grad:'linear-gradient(135deg,#e0f2fe,#0284c7)',     premium:true},
  {id:'volcano',    lbl:'Вулкан',      grad:'linear-gradient(135deg,#1a0400,#f97316)',     premium:true},
  {id:'emerald',    lbl:'Изумруд',     grad:'linear-gradient(135deg,#001208,#10b981)',     premium:true},
  {id:'neon',       lbl:'Неон',        grad:'linear-gradient(135deg,#000a00,#00ff41)',     premium:true},
  {id:'rose-gold',  lbl:'Розовое золото',grad:'linear-gradient(135deg,#1a0e0e,#e8b4b8)',  premium:true},
  {id:'deep-space', lbl:'Космос',      grad:'linear-gradient(135deg,#00001a,#818cf8)',     premium:true},
  {id:'golden',     lbl:'Золото',      grad:'linear-gradient(135deg,#0a0800,#fbbf24)',     premium:true},
  {id:'lavender',   lbl:'Лаванда',     grad:'linear-gradient(135deg,#0e0920,#c4b5fd)',     premium:true},
  // Тематические (фильмы/книги)
  {id:'dune', lbl:'Дюна', grad:'linear-gradient(135deg,#1a1206,#e0a44a)', premium:true},
  {id:'gryffindor', lbl:'Гриффиндор', grad:'linear-gradient(135deg,#1a0505,#ffce49)', premium:true},
  {id:'slytherin', lbl:'Слизерин', grad:'linear-gradient(135deg,#04120c,#2ecf8f)', premium:true},
  {id:'pandora', lbl:'Пандора', grad:'linear-gradient(135deg,#030a1a,#38d0ff)', premium:true},
  {id:'bladerunner', lbl:'Бегущий по лезвию', grad:'linear-gradient(135deg,#0a0410,#ff2e88)', premium:true},
  {id:'joker', lbl:'Джокер', grad:'linear-gradient(135deg,#0d0716,#7ee060)', premium:true},
  {id:'interstellar', lbl:'Интерстеллар', grad:'linear-gradient(135deg,#000205,#d9a34a)', premium:true},
  {id:'barbie', lbl:'Барби', grad:'linear-gradient(135deg,#fff0f6,#ff2e93)', premium:true},
];
const THEME_EMOJIS={liketg:'✈️',dark:'🌙',light:'☀️',pink:'🌸',purple:'💜',ocean:'🌊',galaxy:'🌌',green:'🌿',sunset:'🌅',autumn:'🍂',midnight:'🖤',cherry:'🍒',arctic:'🧊',volcano:'🌋',emerald:'💎',neon:'💚',['rose-gold']:'🌹',['deep-space']:'🚀',golden:'✨',lavender:'💜',dune:'🏜️',gryffindor:'🦁',slytherin:'🐍',pandora:'🧝',bladerunner:'🌆',joker:'🃏',interstellar:'🚀',barbie:'💖'};

// Emoji-паттерны для чата (обои)
// SVG пути для монохромных значков обоев (простые геометрические)
const WALLPAPER_PATHS={
  elephant:'M12 3c-1.1 0-2 .4-2.7 1-.7-.3-1.5-.5-2.3-.5C4.7 3.5 3 5.2 3 7.3c0 1 .4 2 1 2.7C3.4 10.6 3 11.4 3 12.3c0 1.5.8 2.8 2 3.5V17c0 1.1.9 2 2 2h1v2h2v-2h4v2h2v-2h1c1.1 0 2-.9 2-2v-1.2c1.2-.7 2-2 2-3.5 0-.9-.4-1.7-1-2.3.6-.7 1-1.7 1-2.7C21 5.2 19.3 3.5 17 3.5c-.8 0-1.6.2-2.3.5C14 3.4 13.1 3 12 3z',
  hippo:'M12 2C8 2 5 5 5 9v1H4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v1c0 2.2 1.8 4 4 4h6c2.2 0 4-1.8 4-4v-1h1c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2h-1V9c0-4-3-7-7-7zm-2 9a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2z',
  giraffe:'M11 2v4.5L9.5 8C8.6 8.8 8 10 8 11.3V22h2v-6h4v6h2V11.3c0-1.3-.6-2.5-1.5-3.3L13 6.5V2h-2zM10 4h1V2h-1v2zm3 0h-1V2h1v2z',
  eagle:'M12 2L8 6H5l-3 4 4 1-1 3 4-2v2l-3 4h4l3-4 1 2 1-2 3 4h4l-3-4v-2l4 2-1-3 4-1-3-4h-3L12 2zm0 3l2.5 2.5h-5L12 5z',
};

const CHAT_WALLPAPERS={
  none:     {label:'Нет',      path:''},
  elephant: {label:'Слон',     path:'elephant'},
  hippo:    {label:'Бегемот',  path:'hippo'},
  giraffe:  {label:'Жираф',    path:'giraffe'},
  eagle:    {label:'Орёл',     path:'eagle'},
};

// Цвет узора для каждой темы — контрастный, сочетающийся
const THEME_WALLPAPER_COLOR={
  dark:'#3b82f6',light:'#1d4ed8',
  pink:'#db2777',purple:'#7c3aed',
  ocean:'#0284c7',galaxy:'#6366f1',
  green:'#16a34a',sunset:'#ea580c',
  autumn:'#b45309',midnight:'#2563eb',
  cherry:'#be123c',arctic:'#0369a1',
  volcano:'#c2410c',emerald:'#059669',
  neon:'#16a34a','rose-gold':'#9f1239',
  'deep-space':'#4f46e5',golden:'#92400e',
  lavender:'#6d28d9',
  dune:'#c9772a',gryffindor:'#d3222a',slytherin:'#9fb0b6',pandora:'#a56bff',bladerunner:'#22d3ee',joker:'#b06bff',interstellar:'#6a8bb0',barbie:'#ff7ac0',
};

// Premium profile backgrounds — включают RGB и паттерны
const PREMIUM_BG_PATTERNS=[
  {id:'pat_elephant',emoji:'🐘',label:'Слоны'},
  {id:'pat_hippo',   emoji:'🦛',label:'Бегемоты'},
  {id:'pat_giraffe', emoji:'🦒',label:'Жирафы'},
  {id:'pat_eagle',   emoji:'🦅',label:'Орлы'},
];

const _tpLockSvg='<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>';
const _tpStarSvg='<svg viewBox="0 0 24 24" style="fill:#fbbf24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';






// ── PHOTO STORE ──
const photoStore={};
let _pid=0;






// ── LOCALSTORAGE ──
const LS={
  get(k,d=null){try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):d;}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},
  del(k){try{localStorage.removeItem(k);}catch(e){}}
};

// ── SHA-256 хеширование пароля (нативный SubtleCrypto) ──


// ── AUTH SCREENS ──




// ── FIREBASE AUTH HELPERS ──
// Пароли хранятся в Firebase RTDB: auth/{username}/hash
// Локально кэшируем только текущую сессию







// Сбрасываем данные устройства для входа в другой аккаунт


// ── ВХОД ──


// ── РЕГИСТРАЦИЯ ──


// ── УСТАНОВКА ПАРОЛЯ (существующий юзер без пароля) ──




// ── СМЕНА ПАРОЛЯ ──




// ── ВЫХОД ──






// Загружаем свой профиль из Firebase (ник/аватарка/bio актуальные)


// ── TOAST ──


// ── STATE ──
let peer=null,myId=null;
let myUsername='';
let myInternalId='';
let myPassword=''; // хэш пароля (sha256 hex)
let myNick='',myBio='',myAvatar=null,myProfileBg='bg0';
let hasElephantBadge=false;
let conns={},activeChat='ai',currentView='chat';
let chatHist={ai:[]},grpHist={},groups={},peerNames={},peerAvatars={};
let archivedChats={}; // id->true
let pinnedChats={}; // id->true — закреплённые чаты
let mutedChats={}; // id->true — заглушённые чаты
let peerIids={}; // pid->internalId
let peerProfileBgs={};
let peerBios={};
let blockedUsers={};
let bannedUsers={};
let myPremium=false;
let peerPremium={};
let myProfileBgColor='';
let myProfilePattern='';
let myAvFrame='';           // рамка/эффект аватара (id из AV_FRAMES)
let myChatWallpaper='none';
let peerProfileBgColors={}; // pid->rgbColor
let peerProfilePatterns={}; // pid->patternId
let peerAvFrames={};        // pid->avFrame id
let myLinkedChannel=''; // username своего канала, привязанного к профилю
let peerLinkedChannels={}; // pid->username канала, привязанного к профилю
// ── Профиль/настройки в стиле Telegram (settings-panel.js) ──
let myLastName='';          // фамилия (необязательно)
let myBirthday=null;        // {d,m,y} — y может быть 0
let myBusinessHours=null;   // {enabled, days:[{mode:'open24'|'closed'|'custom',from,to} ×7, Пн..Вс]}
let myPrivacy={};           // кто видит/может: lastSeen, photo, bio, birthday, calls, voice, messages, groups; archiveUnknown, titleChatName
let myNotif={};             // web, volume(0..10), private/privatePreview, groups/groupsPreview, channels/channelsPreview
let myPasscode='';          // SHA-256 хеш локального код-пароля ('' — выключен)
let peerLastNames={},peerBirthdays={},peerBusinessHours={},peerLastSeen={};
let myChannels={}; // channelId -> {name, desc, username, bg, bgColor, bgPattern, avatar}
let subscribedChannels={}; // channelId -> {name, desc, ...} — подписки
let inMediaBufs={};
let recChunks=[],recTimer=null,recSecs=0,recMode=null; // 'voice'|'slon'
let inFiles={},fileStore={};
let activeCall=null,localStream=null,callTimer=null,callSecs=0;
let pendingCall=null,isMuted=false,isCamOff=false;
let isScreenSharing=false,screenShareStream=null;
let selMic='',selSpk='',selCam='';
let typingTimers={};
let callMinimized=false;
const CHUNK=8192;

const BG_COLORS=[
  {id:'bg0',grad:'linear-gradient(135deg,#1d4ed8,#7c3aed)'},
  {id:'bg1',grad:'linear-gradient(135deg,#db2777,#a21caf)'},
  {id:'bg2',grad:'linear-gradient(135deg,#16a34a,#0891b2)'},
  {id:'bg3',grad:'linear-gradient(135deg,#dc2626,#ea580c)'},
  {id:'bg4',grad:'linear-gradient(135deg,#0369a1,#0d9488)'},
  {id:'bg5',grad:'linear-gradient(135deg,#b45309,#d97706)'},
  {id:'bg6',grad:'linear-gradient(135deg,#374151,#6b7280)'},
  {id:'bg7',grad:'linear-gradient(135deg,#be185d,#f43f5e)'},
  {id:'bg8',grad:'linear-gradient(135deg,#4338ca,#6d28d9)'},
];

// ── USERNAME SETUP ──




// Останавливаем listener на старый username (на случай смены)


// ══════════════════════════════════════════════
// ── INDEXEDDB: хранилище медиа (голос, слонкружки, файлы) ──
// Хранит бинарные данные без ограничения 5MB как у localStorage
// ══════════════════════════════════════════════
const _idb={
  _db:null,
  _ready:false,
  _q:[],
  init(){
    if(this._ready||this._opening)return;
    this._opening=true;
    const req=indexedDB.open('slon_media',1);
    req.onupgradeneeded=e=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains('media'))
        db.createObjectStore('media'); // key=msgId+kind
    };
    req.onsuccess=e=>{
      this._db=e.target.result;this._ready=true;
      this._q.forEach(fn=>fn());this._q=[];
    };
    req.onerror=()=>{console.warn('[IDB] open failed');};
  },
  _run(fn){this._ready?fn():this._q.push(fn);},
  put(key,blob){
    return new Promise(res=>{
      this._run(()=>{
        try{
          const tx=this._db.transaction('media','readwrite');
          tx.objectStore('media').put(blob,key);
          tx.oncomplete=()=>res(true);
          tx.onerror=()=>res(false);
        }catch(e){res(false);}
      });
    });
  },
  get(key){
    return new Promise(res=>{
      this._run(()=>{
        try{
          const tx=this._db.transaction('media','readonly');
          const req=tx.objectStore('media').get(key);
          req.onsuccess=()=>res(req.result||null);
          req.onerror=()=>res(null);
        }catch(e){res(null);}
      });
    });
  },
  del(key){
    return new Promise(res=>{
      this._run(()=>{
        try{
          const tx=this._db.transaction('media','readwrite');
          tx.objectStore('media').delete(key);
          tx.oncomplete=()=>res(true);
          tx.onerror=()=>res(false);
        }catch(e){res(false);}
      });
    });
  }
};
_idb.init();
// Сохраняем медиа в IndexedDB (blob URL или data URL → Blob)


// Загружаем медиа из IDB → свежий Blob URL










// ════════════════════════════════════════
// ── PEER (P2P с юзернеймом как ID) ──
// ════════════════════════════════════════



// ════════════════════════════════════════════════════════
// ── FIREBASE SIGNALING (обход блокировок РФ) ──
// Используется когда PeerJS сервер недоступен.
// Firebase выступает только как сигнальный канал для
// обмена сообщениями (текст, файлы и т.д.) напрямую.
// ════════════════════════════════════════════════════════
let _fbMode=false;
let _fbListeners={}; // pid -> unsubscribe fn






// ── СЛОН-КАНАЛ: системные новости ──
const SLON_CHANNEL_ID='slon_channel';
const SLON_CHANGELOG=`🐘 **SLON v0.9 — Changelog**

✨ **Новое:**
• Система паролей — аккаунты теперь защищены
• Вход/Регистрация с подтверждением пароля
• Выход из аккаунта
• Мульти-устройство: одновременный вход с нескольких гаджетов
• IndexedDB: голосовые и слонкружки сохраняются после перезагрузки
• Кнопка поворота камеры в слонкружках
• Исправлены голосовые сообщения (длительность 0 с)
• Исправлены даты в чате (разделитель «Сегодня»)
• Исправлена доставка звонков оффлайн-пользователям

🔧 **Исправлено:**
• Слонкружки — чёрный экран у получателя
• Первая регистрация — вечное «Подключение»
• Удаление у всех — теперь удаляет полностью
• Пропавшие сообщения при переполнении localStorage`;



// Синхронизация отправленных сообщений между устройствами
let _sentListener=null;
let _lastSyncTs=Date.now(); // не подгружаем сообщения старше сессии



// Уникальный ID устройства (для фильтрации собственных sync-записей)
let _myDeviceId=LS.get('sl_device_id','');
if(!_myDeviceId){
  _myDeviceId='dev'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  LS.set('sl_device_id',_myDeviceId);
}

// Публикуем отправленное сообщение для синхронизации на других устройствах


// Слушаем входящие сообщения для себя в Firebase


// "Виртуальные соединения" через Firebase
let _fbConns={}; // pid -> true если доступен через Firebase


// ── Firebase Presence: следим кто онлайн ──
let _presenceWatchers={}; // pid -> unsubscribe











let _profileWatchers={}; // pid -> unsubscribe












// ── DATA HANDLER ──


// ── MESSAGES ──









// ══════════════════════════════════════════════
// ── СООБЩЕНИЯ: меню, удаление, ред., закрепление ──
// ══════════════════════════════════════════════

let _msgMenuEl=null;


// Удалить пост из канала у всех (admin only)


// Редактировать пост в канале (admin only)




// ── DOWNLOAD HELPERS ──









































// ── FILES ──






// Обновляем прогресс отправки в сообщении и в UI


// Рендерим круговую шкалу прогресса в элементе


// Показ прогресса входящего файла (получение)
const _incFileProgress={}; // fid -> el









// ── PERM ──
let _permResolve=null,_permIsVideo=false;





// ═══════════════════════════════════════════════════
// ── CALLS (аудио + видео + экран + камера в аудио) ──
// ═══════════════════════════════════════════════════

// ── WebRTC звонки через Firebase/DataChannel сигналинг ──
let _callPC=null; // RTCPeerConnection для активного звонка
let _remoteStream=null;
let _pendingIceCandidates=[];
let _pendingRemoteOffer=null;
let _lastIncomingCallId=null; // callId последнего входящего звонка
let _cancelledCallIds=new Set(); // callId отменённых звонков (чтобы не показывать при оффлайн-доставке)
const ICE_SERVERS=[
  {urls:'stun:stun.cloudflare.com:3478'},
  {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'},
];



// Применить все буферизованные ICE-кандидаты (вызывать после setRemoteDescription)










// Синхронизация состояния звонка между нашими устройствами
// Шлём себе в inbox специальное сообщение чтобы другие устройства знали




let _pipSwapped=false;



// Обработка каждого нового remote-трека (вызывается из ontrack)

// Обновляем видимость video-обёртки в зависимости от наличия активного remote video

// Универсальная попытка запустить воспроизведение remote audio/video
// (некоторые браузеры блокируют autoplay даже после user gesture при renegotiation)

// Совместимость со старым кодом


// ── Кнопка МИКРОФОН ──

// ── Кнопка КАМЕРА ──
// В видеозвонке: включает/выключает трек.
// В аудиозвонке: добавляет камеру → показывает видео-обёртку.

// Возвращает список активных RTCPeerConnection (и для обычного звонка, и для войса)
// Шлём renegotiation offer всем активным PCs


// ── Кнопка ДЕМОНСТРАЦИЯ ЭКРАНА ──







// Обработка каждого нового remote-трека (вызывается из ontrack)


// Обновляем видимость video-обёртки в зависимости от наличия активного remote video


// Универсальная попытка запустить воспроизведение remote audio/video
// (некоторые браузеры блокируют autoplay даже после user gesture при renegotiation)
let _audioUnlockBound=false;


// Совместимость со старым кодом







// Плавное растягивание карточки звонка на весь экран и обратно
let _callFullscreen=false;







// ── Кнопка МИКРОФОН ──



// ── Кнопка КАМЕРА ──
// В видеозвонке: включает/выключает трек.
// В аудиозвонке: добавляет камеру → показывает видео-обёртку.


// Возвращает список активных RTCPeerConnection (и для обычного звонка, и для войса)

// Шлём renegotiation offer всем активным PCs





// ── Кнопка ДЕМОНСТРАЦИЯ ЭКРАНА ──






// ── GROUPS ──

// Записываем группу в Firebase чтобы все устройства аккаунта её видели


// Слушаем изменения групп для этого аккаунта (синхронизация между устройствами)








// ── SIDEBAR ──









// ── БЛОКИРОВКА пользователей (локальная) ──



// ── СЛОНГАЛОЧКИ — пир у которого есть ──
let peerElephantBadges={}; // pid->bool

// Проверяем слонгалочки контактов при старте


// ── ADMIN: выдача/отзыв слонгалочки ──



// ── ADMIN: бан пользователей ──




// Безопасный одноразовый read с таймаутом (5с) — не зависнет если Firebase rules запрещают


// Проверяем забанен ли текущий пользователь


// Показываем бан-уведомление при получении system_ban


// ── SLON PREMIUM ──




// Admin: выдать Premium




// Обои чата — обновляем фон #msgs


// Обои выбираем в настройках



// RGB пикер цвета профиля (premium)




// Получаем фоновый стиль профиля (с учётом premium паттерна)





// ── CHAT DROPDOWN MENU ──












let _globalSearchTimer=null;












// ── NET STATUS ──



// ── PROFILE DISPLAY ──
















// ── MODALS ──






// ── FAB SPEED-DIAL MENU ──



// ── CREATE WIZARD (группа / канал) — многошаговый визард с анимацией ──
let _wizStep=1;
let _wizType=null; // 'group' | 'channel'
let _wizData={members:[],name:'',desc:'',avatar:null};
const _wizCameraSvg='<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
















// ── HAMBURGER MENU ──



let _hbFlyoutTimer=null;






// ── Блокировка ввода для подписчиков канала (не владельцев) ──



// ── Новое окно выбора темы ──




// ── ИЗБРАННОЕ (Saved Messages) ──


























// ── DEVICES PANEL ──







// ── AI REPLY ──
// ── SLON AI: реальный ИИ через Hugging Face Inference API ──
// ⚠ Токен лежит прямо в клиентском коде — любой кто откроет исходник страницы
// сможет его увидеть. Это ок для личного прототипа, но если файл когда-то
// станет публичным — токен нужно будет отозвать/заменить на HF.
const HF_API_TOKEN='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';
const HF_MODEL='mistralai/Mistral-7B-Instruct-v0.2';

const SLON_AI_SYSTEM_PROMPT=`Ты — СЛОН AI 🐘, встроенный помощник мессенджера SLON. Ты разбираешься АБСОЛЮТНО во всех функциях и кнопках приложения и помогаешь пользователю разобраться в любом контексте. Вот полное описание всего что есть в SLON:

ЧАТЫ И СООБЩЕНИЯ: обычный текст, фото, файлы, голосовые сообщения (кнопка микрофона), слонкружки (видео-кружочки как в Telegram, кнопка камеры рядом с микрофоном). У каждого сообщения есть меню (долгое нажатие или кнопка ⋮): скачать, копировать, сохранить в Избранное ⭐, редактировать, закрепить, удалить у себя/у всех.

ЗВОНКИ: аудио и видео звонки (кнопки телефон/камера в шапке чата), демонстрация экрана во время звонка, зум пальцами на видео, тап по видео показывает панель управления (микрофон/камера/демонстрация/сброс), поворот камеры на телефоне.

ГРУППЫ: создаются через круглую кнопку ➕ снизу справа в списке чатов → "Новая группа" → сначала выбираешь участников (поиск + чекбоксы), потом задаёшь название, описание и аватарку группы.

КАНАЛЫ: создаются той же кнопкой ➕ → "Новый канал" → юзернейм, название, описание, аватарка. Владелец публикует посты прямо в чате канала. Каналы теперь доступны ВСЕМ пользователям, не только с Premium (лимит 3 канала без подписки, 10 с подпиской). Найти любой канал или человека можно через глобальный поиск по юзернейму.

SLON PREMIUM ⭐: платная подписка даёт 19 эксклюзивных тем оформления, возможность красить свой профиль в любой RGB-цвет, ставить узор из эмодзи (слон/бегемот/жираф/орёл) на фон профиля и обои чата, больше каналов. Значок ⭐ у пользователя означает что у него Premium.

СЛОНГАЛОЧКА 🐘: особый значок-бейдж, который выдают администраторы за что-то особенное.

АДМИН-КОНСОЛЬ: у администраторов SLON есть возможность банить пользователей на время (замороженный аккаунт получает значок ❄️ и не показывает статус "в сети"), выдавать/забирать Premium и слонгалочку, публиковать в официальном канале SLON.

ИЗБРАННОЕ: личный чат-блокнот только для себя (ярлык-иконка в списке чатов). Туда можно сохранять любые сообщения, фото, файлы, голосовые и слонкружки через кнопку "Сохранить" в меню сообщения. Хранится локально на устройстве.

АРХИВ, ЗАКРЕПИТЬ, ЗАГЛУШИТЬ: правый клик по чату в списке → меню с пунктами: просмотр, отметить непрочитанным, добавить в папку (скоро), закрепить/открепить, включить/выключить уведомления, архивировать, очистить историю, удалить чат.

КОНТАКТЫ: список всех контактов открывается через ☰ (три полоски) в левом верхнем углу → "Контакты", панель выезжает слева и закрывается стрелкой назад.

МЕНЮ ☰ (гамбургер): профиль (аватар+имя сверху), добавить аккаунт (скоро), Избранное, Архивированные чаты, Мои истории (скоро), Контакты, Настройки, Тема (открывает окно выбора темы оформления).

ТЕМЫ: 9 бесплатных (Тёмная, Светлая, Розовая, Фиолет, Океан, Галактика, Природа, Закат, Осень) + 10 премиальных (Полночь, Вишня, Арктика, Вулкан, Изумруд, Неон, Розовое золото, Космос, Золото, Лаванда).

Отвечай по-русски, дружелюбно, живо, с эмодзи 🐘, коротко (2-4 предложения). Если вопрос про конкретную кнопку или функцию — объясни куда нажать и что произойдёт. Если не про мессенджер — просто общайся как дружелюбный собеседник.`;

// Надёжный локальный калькулятор — работает ВСЕГДА, не зависит от API.
// Ловит "17*21", "сколько будет 17*21", "посчитай 5+3*2" и т.п.


// Модели, которые пробуем по очереди через современный HF Router (OpenAI-совместимый чат)
const HF_CHAT_MODELS=[
  'meta-llama/Llama-3.1-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'Qwen/Qwen2.5-7B-Instruct'
];



// Классический endpoint (второй шанс, другой формат API)


// Основная точка входа: сначала надёжная математика, потом реальный ИИ (2 попытки), потом заготовка


// Заготовки-фразы на случай если API недоступен/модель прогревается/лимит исчерпан


// ── HELPERS ──




// ── CHANNEL PUBLISH (только для admins) ──




// ── SLON CHANNEL ADMINS ──
// Эти юзернеймы могут публиковать посты в канале
const CHANNEL_ADMINS=new Set(['mamedov','vadimslonik67']);

// Загружаем список админов из Firebase при старте (чтобы динамически выданные права работали)







// Слонгалочка через Firebase — проверяем при каждом входе


// Выдать слонгалочку пользователю (только для channel admins)



// ── EPIC OVERLAY ──




// ═══════════════════════════════════════════════════════
// ── VOICE MESSAGES & SLON CIRCLES ──
// ═══════════════════════════════════════════════════════
let mediaRecorder=null; // recorder instance


















// Отправка медиа в группу через RTDB: чанки + grp_msgs уведомление


// Отправка voice/slon через RTDB chunks (Storage не используется)
// RTDB лимит ~10MB, чанки по 200KB чтобы не упираться в лимит одной записи
const FB_MEDIA_CHUNK=200000;


// ── Voice/Slon rendering ──




// Запись слонкружка с предпросмотром и кнопкой поворота камеры
let _slonFacing='user'; // текущая камера для слонкружка
let _slonStream=null;   // текущий стрим записи




// ── i-play / i-stop icons (inline) ──



// ─────────────────────────────────────────────────────
// ── CONTEXT MENU (правый клик на чате в сайдбаре) ──
// ─────────────────────────────────────────────────────
let ctxTargetId=null;



// ── Новые действия контекстного меню ──






















// Закрываем контекстное меню при клике в другое место
document.addEventListener('click',()=>$('chatCtxMenu')?.classList.remove('show'));

// ─────────────────────────────────────────────────────
// ── REBUILD: поддержка архива ──
// ─────────────────────────────────────────────────────


// ── VIDEO CONTROLS: pinch-zoom, tap overlay, volume, landscape ──
(function(){
  let _scale=1,_lastDist=0,_startScale=1,_tx=0,_ty=0;
  let _overlayTimer=null;
  let _overlayVisible=false;

  function dist(t){
    const dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;
    return Math.hypot(dx,dy);
  }
  // Зум к точке между пальцами: translate(x,y) scale(s) при transform-origin 0 0
  function applyZoom(animate){
    const v=$('remoteVideo');if(!v)return;
    v.style.transformOrigin='0 0';
    v.style.transition=animate?'transform .28s cubic-bezier(.32,.72,0,1)':'none';
    v.style.transform=_scale===1&&!_tx&&!_ty?'':'translate('+_tx+'px,'+_ty+'px) scale('+_scale+')';
  }
  // Картинка не должна уезжать за края: при s>1 края видео не заходят внутрь рамки
  function clampPan(){
    const w=$('callVidWrap');if(!w)return;
    const W=w.clientWidth,H=w.clientHeight;
    _tx=Math.min(0,Math.max(W-W*_scale,_tx));_ty=Math.min(0,Math.max(H-H*_scale,_ty));
  }
  function localPt(x,y){const r=$('callVidWrap').getBoundingClientRect();const z=r.width/($('callVidWrap').offsetWidth||r.width);return {x:(x-r.left)/z,y:(y-r.top)/z};}
  function isInVidWrap(el){
    const w=$('callVidWrap');return w&&w.contains(el)&&w.classList.contains('show');
  }

  // Тап-оверлей: показать/скрыть по одному тапу
  function showOverlay(){
    const ov=$('vidTapOverlay');if(!ov)return;
    _overlayVisible=true;ov.classList.add('visible');
    clearTimeout(_overlayTimer);
    _overlayTimer=setTimeout(hideOverlay,4000);
  }
  function hideOverlay(){
    const ov=$('vidTapOverlay');if(!ov)return;
    _overlayVisible=false;ov.classList.remove('visible');
    clearTimeout(_overlayTimer);
  }

  // Тап на видео-зону — показать/скрыть overlay
  // Исключаем двойные тапы и pinch
  let _tapCount=0,_tapTimer=null;
  document.addEventListener('click',e=>{
    if(!isInVidWrap(e.target))return;
    // Клики на самом overlay не скрывают его
    const ov=$('vidTapOverlay');
    if(ov&&ov.contains(e.target)&&e.target!==ov)return;
    _tapCount++;
    clearTimeout(_tapTimer);
    _tapTimer=setTimeout(()=>{
      if(_tapCount===1){
        _overlayVisible?hideOverlay():showOverlay();
      }else if(_tapCount>=2){
        // Двойной тап — плавно вернуть исходный вид
        _scale=1;_tx=0;_ty=0;applyZoom(true);
      }
      _tapCount=0;
    },250);
  });

  // Pinch-zoom в любую точку + перетаскивание. После отпускания масштаб сохраняется.
  let _p0=null,_s0=1,_x0=0,_y0=0,_pan=null;
  const mid=t=>localPt((t[0].clientX+t[1].clientX)/2,(t[0].clientY+t[1].clientY)/2);
  document.addEventListener('touchstart',e=>{
    if(!isInVidWrap(e.target))return;
    if(e.touches.length===2){
      _lastDist=dist(e.touches);_s0=_scale;_x0=_tx;_y0=_ty;_p0=mid(e.touches);_pan=null;
      e.preventDefault();
    }else if(e.touches.length===1&&_scale>1){
      const p=localPt(e.touches[0].clientX,e.touches[0].clientY);_pan={x:p.x,y:p.y,tx:_tx,ty:_ty};
    }
  },{passive:false});
  document.addEventListener('touchmove',e=>{
    if(!isInVidWrap(e.target))return;
    if(e.touches.length===2&&_p0){
      const d=dist(e.touches),m=mid(e.touches);
      _scale=Math.min(6,Math.max(1,_s0*(d/_lastDist)));
      // Точка контента, которая была под пальцами, остаётся под ними (и следует за ними)
      _tx=m.x-(_p0.x-_x0)*(_scale/_s0);_ty=m.y-(_p0.y-_y0)*(_scale/_s0);
      clampPan();applyZoom();
      e.preventDefault();
    }else if(e.touches.length===1&&_pan){
      const p=localPt(e.touches[0].clientX,e.touches[0].clientY);
      _tx=_pan.tx+(p.x-_pan.x);_ty=_pan.ty+(p.y-_pan.y);
      clampPan();applyZoom();
      e.preventDefault();
    }
  },{passive:false});
  document.addEventListener('touchend',e=>{
    if(e.touches.length<2)_p0=null;
    if(e.touches.length===0)_pan=null;
    if(_scale<=1.02&&!_p0){_scale=1;_tx=0;_ty=0;applyZoom(true);} // почти 1 — аккуратно в исходное
  },{passive:true});
  // Колёсико на ПК — тоже зум к курсору
  document.addEventListener('wheel',e=>{
    if(!isInVidWrap(e.target)||!e.ctrlKey&&!e.altKey)return;
    e.preventDefault();
    const p=localPt(e.clientX,e.clientY),s0=_scale;
    _scale=Math.min(6,Math.max(1,_scale*(e.deltaY<0?1.12:1/1.12)));
    _tx=p.x-(p.x-_tx)*(_scale/s0);_ty=p.y-(p.y-_ty)*(_scale/s0);clampPan();applyZoom();
  },{passive:false});

  // Ориентация экрана — fullscreen при landscape
  function handleOrientation(){
    const cs=$('callScreen');if(!cs)return;
    const isLandscape=window.innerWidth>window.innerHeight&&window.innerHeight<500;
    if(isLandscape&&cs.classList.contains('show')){
      // Пробуем fullscreen API
      if(document.documentElement.requestFullscreen&&!document.fullscreenElement){
        document.documentElement.requestFullscreen().catch(()=>{});
      }
    }else{
      if(document.fullscreenElement&&document.exitFullscreen){
        document.exitFullscreen().catch(()=>{});
      }
    }
  }
  window.addEventListener('orientationchange',()=>setTimeout(handleOrientation,300));
  window.addEventListener('resize',()=>handleOrientation());

  // Экспортируем showOverlay для использования в setupCallUI
  window._showVidOverlay=showOverlay;
  window._hideVidOverlay=hideOverlay;
})();

// Громкость в звонке



// ════════════════════════════════════════════════════════
// ── CHAT DEDUP by username ──
// ════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════
// ── SOUNDS (Web Audio API — без файлов) ──
// ════════════════════════════════════════════════════════
let _audioCtx=null;




let _ringInterval=null;





// ════════════════════════════════════════════════════════
// ── FLIP CAMERA (мобильные) ──
// ════════════════════════════════════════════════════════
let _camFacing='user';



// ════════════════════════════════════════════════════════
// ── DESKTOP NOTIFICATIONS ──
// ════════════════════════════════════════════════════════
let _notifPermission='default';

// ── SERVICE WORKER для фоновых уведомлений ──
let _swReg=null;












// Смена username из профиля










// ── EXPORT / CLEAR ──




// ── MOBILE ──


// ── INIT ──
window.addEventListener('click',e=>{
  if(!$('themePanel').contains(e.target)&&!e.target.closest('.tb-icon-btn[onclick*="toggleThemePanel"]'))
    $('themePanel').classList.remove('show');
},true);

// Только при смене ШИРИНЫ (поворот экрана). На телефоне клавиатура меняет высоту окна —
// раньше это закрывало шторку со списком чатов прямо во время набора в поиске
let _lastVw=window.innerWidth;
window.addEventListener('resize',()=>{
  if(window.innerWidth===_lastVw)return;
  _lastVw=window.innerWidth;
  setupMobile();
  if(window.innerWidth>640){$('sidebar').classList.remove('open');$('sbOverlay').classList.remove('show');}
});



// ════════════════════════════════════════════════════════
// ── ГРУППОВЫЕ ЗВОНКИ (mesh WebRTC через Firebase) ──
// Каждый участник устанавливает PeerConnection со всеми остальными.
// Сигналинг идёт через Firebase: group_calls/{gid}/signals/{to}/{from}
// ════════════════════════════════════════════════════════

let _gc = null; // активный групповой звонок
// _gc = { gid, callId, isVideo, pcs: {pid: RTCPeerConnection},
//         streams: {pid: MediaStream}, localStream, timer, timerSec,
//         muted: false, camOff: false }

const _GC_ICE = [
  {urls:'stun:stun.cloudflare.com:3478'},
  {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
];

// ── Запуск группового звонка (инициатор) ──




// ── Принятие группового звонка ──
let _pendingGrpCall = null;







// ── Создать PeerConnection с одним участником ──


// ── Сигналинг ──


let _gcSignalUnsub = null;




// ── UI ──














// ── Управление ──








// ── Обработка входящих сообщений группового звонка ──




// ════════════════════════════════════════════════════════════════
// ── ПОЛЬЗОВАТЕЛЬСКИЕ КАНАЛЫ (SLON PREMIUM) ──
// Каждый Premium-пользователь может создать до 3 каналов.
// Firebase: user_channels/{channelId}/  — мета-данные
//           user_channels/{channelId}/posts/  — посты
// Подписка: channel_subs/{channelId}/{username} = true
// ════════════════════════════════════════════════════════════════

let _myChannelListeners={}; // channelId -> unsub
let _channelSubWatchers={}; // channelId -> unsub

// ── Создание нового канала ──




// ── Настройки канала ──






// ── Публикация поста в своём канале ──




// ── Подписка на канал по юзернейму ──




// ── Добавить канал в sidebar ──


// ── Слушаем посты канала в Firebase ──


// ── Загружаем свои каналы и подписки при старте ──


// Вызываем при создании канала — пишем индекс owner





// ════════════════════════════════════════
// ── ВОЙС UI: плитки участников ──
// ════════════════════════════════════════

let _vrMinimized = false;
let _vrCallTimer = null;
let _vrCallSecs = 0;

// Создать/обновить свою плитку


// Создать плитку участника




// Обновить видео плитки (включить/выключить video элемент)


// Обновить свою плитку (камера/экран)


// Обновить mic-иконку


// Обновить сетку


// Удалить плитку участника


// Показать войс экран





// Обновить кнопки войса (перенаправляем id кнопок)




// Слушаем сообщения всех групп через Firebase RTDB
let _grpMsgListeners={}; // gid -> unsub



// Приём голосового/слонкружка из группы через RTDB


// Вызываем при получении group_invite/group_add


document.addEventListener('DOMContentLoaded',()=>{
  loadStorage();
  initDesktopNotif();
  setupMobile();
  buildThemeGrids();
  updateProfileDisplay();
  rebuildSidebar();

  if(!myUsername){
    $('usernameOverlay').classList.add('show');
    showAuthRegister();
  }else{
    // Читаем сессию по username-ключу (новый формат) или по общему (старый)
    const session=LS.get('sl_session_'+myUsername,null)||LS.get('sl_session',null);
    const sessionFresh=session&&session.username===myUsername&&
      (Date.now()-session.ts)<30*24*60*60*1000; // 30 дней

    if(sessionFresh&&session.verified){
      // Активная сессия — входим без пароля
      myPassword=LS.get('sl_pass_'+myUsername,'');
      initPeer();
      // Фоновая проверка что пароль не изменился на другом устройстве
      setTimeout(async()=>{
        try{
          const fbHash=await _fbGetPasswordHash(myUsername);
          if(fbHash&&myPassword&&fbHash!==myPassword){
            toast('Пароль изменён — войди снова',5000);
            setTimeout(()=>doLogout(),2000);
          }else if(fbHash){
            LS.set('sl_pass_'+myUsername,fbHash);
            myPassword=fbHash;
          }
        }catch(e){}
      },3000);
    }else{
      // Нет сессии или старый формат — проверяем Firebase
      $('usernameOverlay').classList.add('show');
      _fbGetPasswordHash(myUsername).then(fbHash=>{
        if(fbHash){
          // Пароль зарегистрирован — экран входа
          showAuthLogin();
          const inp=$('loginUsernameInp');if(inp)inp.value=myUsername;
        }else{
          // Пароля нет — предлагаем установить (уже зарегистрирован без пароля)
          showSetPassword(myUsername);
        }
      }).catch(()=>{
        // Firebase недоступен — показываем логин с тем что есть
        showAuthLogin();
        const inp=$('loginUsernameInp');if(inp)inp.value=myUsername;
      });
    }
  }

  openChat('ai');
  _hideSplash();
  // Подстраховка: восстановить историю и профиль из IndexedDB, если LS их потерял
  if(myUsername){setTimeout(_restoreChatsFromIdb,800);setTimeout(_restoreProfileFromIdb,300);}
});

// ── Заставка: скрываем после загрузки (мин. показ + аварийный таймаут) ──
let _splashAt=Date.now();
function _hideSplash(){
  const s=$('splash');if(!s||s.classList.contains('hide'))return;
  const wait=Math.max(0,650-(Date.now()-_splashAt));
  setTimeout(()=>{s.classList.add('hide');setTimeout(()=>s.remove(),650);},wait);
}
setTimeout(_hideSplash,6000); // на случай зависшей загрузки

// ════════════════════════════════════════════════════════════════
// ── ВОЙСЫ — голосовые комнаты в группах (Discord-style) ──
// Firebase: voice_rooms/{gid}/{roomId} = {name, createdBy, ts}
// Участники: voice_rooms/{gid}/{roomId}/online/{username} = {ts, nick}
// Mesh WebRTC: при входе шлём voice_join в inbox всех участников
// ════════════════════════════════════════════════════════════════

let _vr = null; // активный войс-рум
// _vr = { gid, roomId, roomName, pcs:{pid:RTCPeerConnection},
//         streams:{pid:MediaStream}, localStream, muted, camOff }
let _vrRoomListeners = {}; // gid -> unsub  (слушаем список комнат)
let _vrParticipantListeners = {}; // gid/roomId -> unsub
let _vrSignalUnsub = null;
let _vrCurrentGid = null; // какая группа сейчас открыта в панели войсов

const _VR_ICE = [
  {urls:'stun:stun.cloudflare.com:3478'},
  {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
];

// ── Открыть панель войсов группы ──



// ── Рендерим список войсов ──






// Слушаем изменения комнат в реальном времени


// ── Создание войса ──



// ── Войти в войс ──





// ── WebRTC PeerConnection для войса ──




// Сигналинг через Firebase inbox


let _vrSignalListeners=[]; // unsub functions






// ── Выйти из войса ──





// ── Обработка входящих войс-сообщений (onData) ──

// ═══ CORE UTILS ═══

function toast(msg,dur=3000){document.querySelector('.toast')?.remove();const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),dur);}

function saveAll(){
  // Очищаем тяжёлые данные из истории перед сохранением в localStorage.
  // base64-фото/аудио/видео могут занимать мегабайты — LS квота обычно 5-10 MB.
  // Сохраняем только метаданные; при загрузке показываем заглушку "медиа недоступно".
  const prep=hist=>(hist||[]).slice(-200).map(m=>{
    if(!m||m.sender==='system')return m;
    const clean={...m};
    // Фото: сохраняем thumb (маленький) вместо полного photoId
    if(clean.photoThumb&&clean.photoThumb.length>50000){
      // thumb слишком большой — сжимаем до маркера
      clean.photoThumb=clean.photoThumb.slice(0,50000);
    }
    // Полноразмерное фото живёт только в памяти (photoStore) — пока сессия жива,
    // дублируем его в IndexedDB, чтобы оно не пропадало после перезагрузки страницы
    if(clean.photoId&&!clean.photoId.startsWith('idb:')){
      const fullPhoto=photoStore[clean.photoId];
      if(fullPhoto){
        _saveMediaToIdb(clean.id,'photo',fullPhoto);
        clean.photoId='idb:'+clean.id+':photo';
      }
    }
    // Файлы: то же самое — сохраняем в IndexedDB вместо потери при перезагрузке
    if(clean.fileDataId&&!clean.fileDataId.startsWith('idb:')){
      const fullFile=fileStore[clean.fileDataId];
      if(fullFile){
        _saveMediaToIdb(clean.id,'file',fullFile);
        clean.fileDataId='idb:'+clean.id+':file';
      }
    }
    // Голосовые/слонкружки:
    // - isUrl=true && blob: → сохраняем в IDB, ставим маркер idb:
    // - isUrl=true && idb: → уже в IDB, оставляем
    // - base64 data: → тоже в IDB
    if(clean.voiceData){
      const v=clean.voiceData;
      if(v.startsWith('blob:')||(!v.startsWith('idb:')&&v.startsWith('data:'))){
        // Асинхронно сохраняем в IDB (не ждём)
        _saveMediaToIdb(clean.id,'voice',v);
        clean.voiceData='idb:'+clean.id+':voice';
        clean.isUrl=false;
      }
    }
    if(clean.slonData){
      const v=clean.slonData;
      if(v.startsWith('blob:')||(!v.startsWith('idb:')&&v.startsWith('data:'))){
        _saveMediaToIdb(clean.id,'slon',v);
        clean.slonData='idb:'+clean.id+':slon';
        clean.isUrl=false;
      }
      // blob: уже сохранён ранее — ставим маркер
      if(v.startsWith('blob:')){
        clean.slonData='idb:'+clean.id+':slon';
        clean.isUrl=false;
      }
    }
    return clean;
  }).filter(Boolean);

  const co={};for(const[k,v]of Object.entries(chatHist))if(k!=='saved')co[k]=prep(v);
  const go={};for(const[k,v]of Object.entries(grpHist))go[k]=prep(v);
  const p=_getAccountPrefix(myUsername);
  // Надёжная копия истории в IndexedDB (большая квота) — не страдает от обрезки
  // localStorage при переполнении. Копируем ДО возможного тримминга co/go ниже.
  try{
    if(typeof _idb!=='undefined'&&_idb){
      const u=myUsername||'';
      _idb.put('bk_chats_'+u,JSON.parse(JSON.stringify(co)));
      _idb.put('bk_grph_'+u,JSON.parse(JSON.stringify(go)));
      // Копия ключевых полей профиля/кастомизации — чтобы не слетали при перезагрузке
      _idb.put('bk_prof_'+u,{
        nick:myNick,lastName:myLastName,bio:myBio,avatar:myAvatar,
        profileBg:myProfileBg,bgColor:myProfileBgColor,bgPattern:myProfilePattern,avFrame:myAvFrame,
        linkedChannel:myLinkedChannel,birthday:myBirthday,businessHours:myBusinessHours,
        privacy:myPrivacy,notif:myNotif,premium:myPremium,elephant:hasElephantBadge,
        myChannels:myChannels,subscribedChannels:subscribedChannels,ts:Date.now()
      });
    }
  }catch(e){}
  // Избранное сохраняем ОТДЕЛЬНО от общей истории — небольшой объём, не подвержен
  // обрезке по квоте остальных чатов, поэтому надёжно переживает перезагрузку
  const savedPrepped=prep(chatHist.saved||[]);
  try{localStorage.setItem(p+'savedMsgs',JSON.stringify(savedPrepped));}catch(e){console.warn('saved persist error:',e);}

  const _trySave=()=>{
    try{
      // Сначала маленькие настройки: если квота кончится на тяжёлой истории,
      // профиль/канал в профиле/приватность всё равно уже сохранены
      localStorage.setItem(p+'groups',JSON.stringify(groups));
      localStorage.setItem(p+'names',JSON.stringify(peerNames));
      localStorage.setItem(p+'nick',JSON.stringify(myNick));
      localStorage.setItem(p+'bio',JSON.stringify(myBio));
      localStorage.setItem(p+'av',JSON.stringify(myAvatar));
      localStorage.setItem(p+'pbg',JSON.stringify(myProfileBg));
      localStorage.setItem(p+'elephant',JSON.stringify(hasElephantBadge));
      localStorage.setItem(p+'arch',JSON.stringify(archivedChats));
      localStorage.setItem(p+'pinned',JSON.stringify(pinnedChats));
      localStorage.setItem(p+'muted',JSON.stringify(mutedChats));
      localStorage.setItem(p+'blocked',JSON.stringify(blockedUsers));
      localStorage.setItem(p+'premium',JSON.stringify(myPremium));
      localStorage.setItem(p+'bgColor',JSON.stringify(myProfileBgColor));
      localStorage.setItem(p+'bgPattern',JSON.stringify(myProfilePattern));
      localStorage.setItem(p+'avFrame',JSON.stringify(myAvFrame));
      localStorage.setItem(p+'linkedCh',JSON.stringify(myLinkedChannel));
      localStorage.setItem(p+'lastName',JSON.stringify(myLastName));
      localStorage.setItem(p+'birthday',JSON.stringify(myBirthday));
      localStorage.setItem(p+'bizHours',JSON.stringify(myBusinessHours));
      localStorage.setItem(p+'privacy',JSON.stringify(myPrivacy));
      localStorage.setItem(p+'notif',JSON.stringify(myNotif));
      localStorage.setItem(p+'passcode',JSON.stringify(myPasscode));
      localStorage.setItem(p+'chatWall',JSON.stringify(myChatWallpaper));
      localStorage.setItem(p+'piids',JSON.stringify(peerIids));
      localStorage.setItem(p+'pbgs2',JSON.stringify(peerProfileBgs));
      localStorage.setItem(p+'myChannels',JSON.stringify(myChannels));
      localStorage.setItem(p+'subChannels',JSON.stringify(subscribedChannels));
      // Настройки устройства — без префикса
      localStorage.setItem('sl_mic',JSON.stringify(selMic));
      localStorage.setItem('sl_spk',JSON.stringify(selSpk));
      localStorage.setItem('sl_cam',JSON.stringify(selCam));
      // Тяжёлое — в конце
      localStorage.setItem(p+'avs',JSON.stringify(peerAvatars));
      localStorage.setItem(p+'grpH',JSON.stringify(go));
      localStorage.setItem(p+'chats',JSON.stringify(co));
      return true;
    }catch(e){
      if(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED')return false;
      return true;
    }
  };

  if(!_trySave()){
    console.warn('LS quota exceeded, trimming...');
    for(const k of Object.keys(co))co[k]=(co[k]||[]).slice(-50);
    for(const k of Object.keys(go))go[k]=(go[k]||[]).slice(-50);
    const trimmedAvs={};
    for(const[k,v]of Object.entries(peerAvatars)){if(v&&v.length<5000)trimmedAvs[k]=v;}
    try{localStorage.setItem(p+'avs',JSON.stringify(trimmedAvs));}catch(e){}
    if(!_trySave()){
      console.error('LS quota emergency trim');
      try{localStorage.removeItem(p+'avs');}catch(e){}
      for(const k of Object.keys(co))co[k]=(co[k]||[]).slice(-20);
      _trySave();
    }
  }
}

function _getAccountPrefix(username){
  // Данные каждого аккаунта хранятся с префиксом чтобы не мешаться
  return username?'sl_u_'+username+'_':'sl_';
}

// Восстановление истории из IndexedDB-копии, если localStorage потерял/обрезал сообщения
async function _restoreChatsFromIdb(){
  try{
    if(typeof _idb==='undefined'||!_idb)return;
    const u=myUsername||'';
    const [bc,bg]=await Promise.all([_idb.get('bk_chats_'+u),_idb.get('bk_grph_'+u)]);
    let changed=false;
    const merge=(target,backup)=>{
      if(!backup||typeof backup!=='object')return;
      for(const k in backup){
        const cur=Array.isArray(target[k])?target[k]:[];
        const bk=Array.isArray(backup[k])?backup[k]:[];
        const map=new Map();
        // сначала бэкап, потом текущее — свежее локальное перекрывает по id
        bk.concat(cur).forEach(m=>{ if(m&&m.id!=null)map.set(m.id,m); else map.set('_'+map.size,m); });
        const merged=[...map.values()].sort((a,b)=>(a?.ts||0)-(b?.ts||0));
        if(merged.length>cur.length){target[k]=merged;changed=true;}
      }
    };
    merge(chatHist,bc);merge(grpHist,bg);
    if(changed){
      if(typeof rebuildSidebar==='function')rebuildSidebar();
      if(typeof renderChat==='function'&&typeof activeChat!=='undefined'&&activeChat)renderChat(activeChat);
    }
  }catch(e){console.warn('restore chats err',e);}
}

// Восстановление полей профиля/кастомизации из IDB, если localStorage их потерял.
// Заполняем только ПУСТЫЕ локальные поля — не перетираем свежие изменения.
async function _restoreProfileFromIdb(){
  try{
    if(typeof _idb==='undefined'||!_idb)return;
    const b=await _idb.get('bk_prof_'+(myUsername||''));
    if(!b)return;
    let changed=false;
    const empty=v=>v===''||v===null||v===undefined;
    const emptyObj=v=>!v||(typeof v==='object'&&Object.keys(v).length===0);
    if(empty(myNick)&&b.nick){myNick=b.nick;changed=true;}
    if(empty(myLastName)&&b.lastName){myLastName=b.lastName;changed=true;}
    if(empty(myBio)&&b.bio){myBio=b.bio;changed=true;}
    if(empty(myAvatar)&&b.avatar){myAvatar=b.avatar;changed=true;}
    if((empty(myProfileBg)||myProfileBg==='bg0')&&b.profileBg&&b.profileBg!=='bg0'){myProfileBg=b.profileBg;changed=true;}
    if(empty(myProfileBgColor)&&b.bgColor){myProfileBgColor=b.bgColor;changed=true;}
    if(empty(myProfilePattern)&&b.bgPattern){myProfilePattern=b.bgPattern;changed=true;}
    if(empty(myAvFrame)&&b.avFrame){myAvFrame=b.avFrame;changed=true;}
    if(empty(myLinkedChannel)&&b.linkedChannel){myLinkedChannel=b.linkedChannel;changed=true;}
    if(empty(myBirthday)&&b.birthday){myBirthday=b.birthday;changed=true;}
    if(emptyObj(myBusinessHours)&&b.businessHours){myBusinessHours=b.businessHours;changed=true;}
    if(emptyObj(myChannels)&&!emptyObj(b.myChannels)){myChannels=b.myChannels;changed=true;}
    if(emptyObj(subscribedChannels)&&!emptyObj(b.subscribedChannels)){subscribedChannels=b.subscribedChannels;changed=true;}
    if(!myPremium&&b.premium){myPremium=true;changed=true;}
    if(!hasElephantBadge&&b.elephant){hasElephantBadge=true;changed=true;}
    if(changed){
      saveAll();
      if(typeof updateProfileDisplay==='function')updateProfileDisplay();
      if(typeof setMyLabel==='function')setMyLabel();
      if(typeof buildThemeGrids==='function')buildThemeGrids();
    }
  }catch(e){console.warn('restore profile err',e);}
}

function loadStorage(){
  // Сначала читаем username (он не зависит от аккаунта — это текущий вошедший)
  myUsername=LS.get('sl_username','');
  myPassword=LS.get('sl_pass_'+myUsername,'');

  // Скрытый постоянный ID — один на АККАУНТ (не на устройство!)
  // Разные аккаунты на одном устройстве имеют разные iid
  const iidKey=myUsername?'sl_iid_'+myUsername:'sl_iid';
  myInternalId=LS.get(iidKey,'')||LS.get('sl_iid','');
  if(!myInternalId){
    myInternalId='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  }
  if(myUsername)LS.set('sl_iid_'+myUsername,myInternalId);
  else LS.set('sl_iid',myInternalId);

  // Данные аккаунта — читаем с префиксом username если он есть
  const p=_getAccountPrefix(myUsername);
  chatHist=LS.get(p+'chats',LS.get('sl_chats',{ai:[]}));
  grpHist=LS.get(p+'grpH',LS.get('sl_grpH',{}));
  groups=LS.get(p+'groups',LS.get('sl_groups',{}));
  peerNames=LS.get(p+'names',LS.get('sl_names',{}));
  peerAvatars=LS.get(p+'avs',LS.get('sl_avs',{}));
  myNick=LS.get(p+'nick',LS.get('sl_nick',''));
  myBio=LS.get(p+'bio',LS.get('sl_bio',''));
  myAvatar=LS.get(p+'av',LS.get('sl_av',null));
  myProfileBg=LS.get(p+'pbg',LS.get('sl_pbg','bg0'));
  hasElephantBadge=LS.get(p+'elephant',LS.get('sl_elephant',false));
  archivedChats=LS.get(p+'arch',LS.get('sl_arch',{}));
  pinnedChats=LS.get(p+'pinned',{});
  mutedChats=LS.get(p+'muted',{});
  blockedUsers=LS.get(p+'blocked',{});
  myPremium=LS.get(p+'premium',false);
  myProfileBgColor=LS.get(p+'bgColor','');
  myProfilePattern=LS.get(p+'bgPattern','');
  myAvFrame=LS.get(p+'avFrame','');
  myLinkedChannel=LS.get(p+'linkedCh','');
  myLastName=LS.get(p+'lastName','');
  myBirthday=LS.get(p+'birthday',null);
  myBusinessHours=LS.get(p+'bizHours',null);
  myPrivacy=LS.get(p+'privacy',{})||{};
  myNotif=LS.get(p+'notif',{})||{};
  myPasscode=LS.get(p+'passcode','');
  myChatWallpaper=LS.get(p+'chatWall','none');
  peerIids=LS.get(p+'piids',LS.get('sl_piids',{}));
  peerProfileBgs=LS.get(p+'pbgs2',LS.get('sl_pbgs2',{}));
  myChannels=LS.get(p+'myChannels',{});
  subscribedChannels=LS.get(p+'subChannels',{});

  // Настройки устройства (не привязаны к аккаунту)
  selMic=LS.get('sl_mic','');selSpk=LS.get('sl_spk','');selCam=LS.get('sl_cam','');

  if(!chatHist.ai)chatHist.ai=[];
  // Избранное читаем из отдельного ключа (изолировано от квоты-обрезки остальных чатов)
  const savedFromDedicated=LS.get(p+'savedMsgs',null);
  if(savedFromDedicated&&savedFromDedicated.length){
    chatHist.saved=savedFromDedicated;
  }else if(!chatHist.saved){
    chatHist.saved=[];
  }
  // Бэкфилл ts для старых сообщений
  const tdy=new Date();tdy.setHours(0,0,0,0);
  const tdyMs=tdy.getTime();
  for(const h of Object.values(chatHist)){
    if(!h)continue;
    for(let i=0;i<h.length;i++){
      const m=h[i];
      if(m&&!m.ts){
        if(m.time&&/^\d{2}:\d{2}$/.test(m.time)){
          const [hh,mm]=m.time.split(':').map(Number);
          m.ts=tdyMs+hh*3600000+mm*60000;
        }else{
          m.ts=Date.now()-(h.length-i)*60000;
        }
      }
    }
  }
  for(const h of Object.values(grpHist)){
    if(!h)continue;
    for(let i=0;i<h.length;i++){
      const m=h[i];
      if(m&&!m.ts){
        if(m.time&&/^\d{2}:\d{2}$/.test(m.time)){
          const [hh,mm]=m.time.split(':').map(Number);
          m.ts=tdyMs+hh*3600000+mm*60000;
        }else{
          m.ts=Date.now()-(h.length-i)*60000;
        }
      }
    }
  }
  for(const h of Object.values(chatHist))for(const m of(h||[]))if(m.photoSaved){m.photoId=storePhoto(m.photoSaved);delete m.photoSaved;}
  for(const h of Object.values(grpHist))for(const m of(h||[]))if(m.photoSaved){m.photoId=storePhoto(m.photoSaved);delete m.photoSaved;}
  applyTheme(LS.get('sl_theme','dark'),false);
}
