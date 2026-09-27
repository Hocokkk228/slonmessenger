// ════════ Пользовательское соглашение и Политика конфиденциальности ════════
// LEGAL_V — версия документов. Поменял текст → подними версию: всем, кто принял старую,
// при входе покажется окно «Мы обновили правила» с галочкой и кнопкой «Готово».
const LEGAL_V='2026-09-27';
const LEGAL_CHANGES='Первая редакция: правила контента, ответственность за публикации, жалобы и блокировки, какие данные мы храним и где.';
const LEGAL_MAIL='slonmessengersupport@gmail.com';
const LEGAL_DOCS={
  terms:{title:'Пользовательское соглашение',body:[
    ['1. Общее',`SLON — мессенджер для личной переписки, групп, каналов, звонков и обмена файлами. Регистрируясь или продолжая пользоваться SLON, ты принимаешь это соглашение. Если не согласен — не пользуйся сервисом и удали аккаунт.`],
    ['2. Аккаунт',`Пользоваться SLON можно с 14 лет; младше — только с согласия родителей. Ты отвечаешь за сохранность пароля и за всё, что происходит в твоём аккаунте. Передавая доступ к аккаунту другим людям, ты берёшь ответственность за их действия на себя.`],
    ['3. Что запрещено',`Нельзя публиковать, отправлять и хранить в SLON:
• материалы сексуального характера с участием несовершеннолетних — такие аккаунты блокируются сразу и навсегда;
• чужие произведения (музыку, фильмы, книги, программы) без разрешения правообладателя, если это нарушает закон;
• призывы к насилию, экстремистские и террористические материалы;
• продажу наркотиков, оружия и другого, что запрещено законом;
• мошенничество, фишинг, вредоносные программы, спам;
• чужие персональные данные без согласия человека, угрозы, травлю.`],
    ['4. Ответственность за контент',`За сообщения, файлы, треки, посты и всё остальное, что ты публикуешь или отправляешь, отвечаешь ты. SLON не проверяет личную переписку заранее — большая её часть зашифрована так, что мы её не видим. Мы не являемся автором пользовательского контента и не одобряем его.`],
    ['5. Жалобы и блокировки',`Если ты видишь нарушение — напиши на ${LEGAL_MAIL}. Мы рассматриваем жалобы и по ним удаляем контент, ограничиваем или блокируем аккаунты. Нарушения из пункта 3 — основание для блокировки без предупреждения. Мы выполняем законные требования уполномоченных органов.`],
    ['6. Музыка',`«Моя музыка» — личная фонотека. Загружай туда только то, что вправе хранить. Семейный доступ — для нескольких близких людей, а не для публичной раздачи. В профиле другим людям показываются отрывки из открытого каталога.`],
    ['7. Мини-слоники и подарки',`Мини-слоники — внутренняя валюта SLON для подарков. Это не деньги: их нельзя вывести или обменять обратно. Подарок, который ты отправил, вернуть нельзя.`],
    ['8. Сервис «как есть»',`Мы стараемся, чтобы SLON работал стабильно, но не гарантируем отсутствие сбоев и не отвечаем за убытки из-за перерывов в работе, потери данных на устройстве или действий других пользователей. Храни важное в резервных копиях.`],
    ['9. Изменения',`Мы можем обновлять соглашение. О новой редакции покажем уведомление при входе — продолжая пользоваться SLON, ты её принимаешь. Вопросы — ${LEGAL_MAIL}.`]
  ]},
  privacy:{title:'Политика конфиденциальности',body:[
    ['1. Какие данные мы храним',`• юзернейм, имя, аватар, описание, оформление профиля и то, что ты сам сделал публичным (стена, плейлист, подарки);
• хеш пароля (сам пароль мы не знаем) и почту, если ты её указал;
• технические данные: идентификаторы устройств, токены для push-уведомлений, время последнего входа;
• твои треки в «Моей музыке», если включено облако.`],
    ['2. Переписка',`Личные чаты шифруются на устройствах (сквозное шифрование): ключи хранятся только у участников, мы не можем прочитать сообщения. На сервере лежат зашифрованные копии, чтобы сообщения доходили до всех твоих устройств. Фото, видео и файлы из чатов хранятся на сервере 14 дней, затем удаляются.`],
    ['3. Где хранятся данные',`Основной сервер и хранилище файлов — Яндекс Облако, дата-центры в России. Часть служебных данных (профили, статус «в сети», группы и каналы) синхронизируется через Google Firebase (регион europe-west1). Запросы к AI-ассистенту передаются сервису Hugging Face.`],
    ['4. Кому мы передаём данные',`Мы не продаём данные и не показываем рекламу по ним. Данные передаются только сервисам из пункта 3 для работы SLON и по законному требованию уполномоченных органов — в объёме, который у нас есть (содержимое зашифрованных чатов у нас отсутствует).`],
    ['5. Что видят другие',`Другие пользователи видят твой публичный профиль. Кто видит номер, статус и прочее — настраивается в разделе «Конфиденциальность». Твоя фонотека закрыта: её слушают только те, кому ты сам открыл семейный доступ.`],
    ['6. Удаление',`Ты можешь удалить сообщения и контент в приложении. Чтобы удалить аккаунт и все данные на сервере — напиши на ${LEGAL_MAIL} с почты или из аккаунта SLON.`],
    ['7. Изменения',`О новой редакции политики покажем уведомление при входе. Вопросы о данных — ${LEGAL_MAIL}.`]
  ]}
};

function _lgOpen(which){
  const d=LEGAL_DOCS[which];if(!d)return;
  document.getElementById('lgDoc')?.remove();
  const w=document.createElement('div');w.id='lgDoc';w.className='lg-doc';
  w.innerHTML=`<div class="lg-doc-hd"><button onclick="_lgDocClose()" title="Назад"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button><b>${esc(d.title)}</b></div>
    <div class="lg-doc-body"><div class="lg-doc-v">Редакция от ${new Date(LEGAL_V).toLocaleDateString('ru',{day:'numeric',month:'long',year:'numeric'})}</div>
    ${d.body.map(([h,t])=>`<h3>${esc(h)}</h3><p>${esc(t).replace(/\n/g,'<br>')}</p>`).join('')}</div>`;
  document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('show'));
}
function _lgDocClose(){const w=$('lgDoc');if(!w)return;w.classList.remove('show');setTimeout(()=>w.remove(),220);}
const _lgLinks=()=>`<a href="#" onclick="_lgOpen('terms');return false">Пользовательское соглашение</a> и <a href="#" onclick="_lgOpen('privacy');return false">Политику конфиденциальности</a>`;

// ── принятие ──
const _lgKey=()=>'sl_u_'+myUsername+'_legal';
function _lgLocal(){try{return localStorage.getItem(_lgKey())||'';}catch(e){return '';}}
function _lgAccept(){
  try{localStorage.setItem(_lgKey(),LEGAL_V);}catch(e){}
  if(typeof _apiToken==='function'&&_apiToken())api('/legal/accept',{v:LEGAL_V}).catch(()=>{});
}

// регистрация: галочка обязательна
(function _lgReg(){
  const box=document.getElementById('authRegister'),err=document.getElementById('regError');
  if(!box||!err){setTimeout(_lgReg,500);return;}
  if(document.getElementById('regLegal'))return;
  err.insertAdjacentHTML('beforebegin',`<label class="lg-chk"><input type="checkbox" id="regLegal"><span>Я принимаю ${_lgLinks()}</span></label>`);
})();
{const f=doRegister;doRegister=async function(){
  const c=document.getElementById('regLegal');
  if(c&&!c.checked){const e=$('regError');if(e){e.textContent='Чтобы зарегистрироваться, прими соглашение и политику';e.style.display='block';}return;}
  if(c&&c.checked)try{sessionStorage.setItem('sl_lg_pending',LEGAL_V);}catch(e){}
  const r=await f.apply(this,arguments);
  if(myUsername&&c&&c.checked)_lgAccept();
  return r;
};}

// уже зарегистрированные: при входе, если версия новая — окно с галочкой
let _lgShown=false;
async function _lgCheck(){
  if(_lgShown||!myUsername||document.getElementById('lgGate'))return;
  if(_lgLocal()===LEGAL_V)return;
  try{if(sessionStorage.getItem('sl_lg_pending')===LEGAL_V){_lgAccept();return;}}catch(e){}
  if(typeof _apiToken==='function'&&_apiToken()){
    try{const d=await api('/legal');if(d.v===LEGAL_V){try{localStorage.setItem(_lgKey(),LEGAL_V);}catch(e){}return;}}catch(e){return;}   // нет сети — спросим позже
  }
  const ov=document.getElementById('usernameOverlay');if(ov&&ov.style.display!=='none'&&getComputedStyle(ov).display!=='none')return;   // ещё на экране входа
  _lgShown=true;_lgGate();
}
function _lgGate(){
  const w=document.createElement('div');w.id='lgGate';w.className='lg-gate';
  w.innerHTML=`<div class="lg-gate-card">
    <div class="lg-gate-ico"><svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>
    <div class="lg-gate-t">${_lgLocal()?'Мы обновили правила':'Правила SLON'}</div>
    <div class="lg-gate-s">${esc(LEGAL_CHANGES)}</div>
    <div class="lg-gate-links"><button onclick="_lgOpen('terms')">Пользовательское соглашение</button><button onclick="_lgOpen('privacy')">Политика конфиденциальности</button></div>
    <label class="lg-chk"><input type="checkbox" id="lgGateChk" onchange="$('lgGateOk').disabled=!this.checked"><span>Я прочитал(а) и принимаю ${_lgLinks()}</span></label>
    <button class="lg-gate-ok" id="lgGateOk" disabled onclick="_lgGateOk()">Готово</button></div>`;
  document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('show'));
}
function _lgGateOk(){
  if(!$('lgGateChk')?.checked)return;
  _lgAccept();
  const w=$('lgGate');if(w){w.classList.remove('show');setTimeout(()=>w.remove(),250);}
}
setTimeout(function _lgLoop(){_lgCheck().finally(()=>{if(!_lgShown&&_lgLocal()!==LEGAL_V)setTimeout(_lgLoop,5000);});},4000);

// в настройках — ссылка на документы
{const f=_spRender;_spRender=function(){
  const r=f.apply(this,arguments);
  try{
    const body=$('spBody');
    if(body&&!body.querySelector('.lg-row')){
      const logout=[...body.querySelectorAll('.sp-card')].find(c=>c.querySelector('.sp-row-danger'));
      (logout||body.lastElementChild)?.insertAdjacentHTML('beforebegin',`<div class="sp-card"><div class="sp-row lg-row" onclick="_lgOpen('terms')"><div class="sp-row-txt"><div class="sp-row-title">Пользовательское соглашение</div></div></div>
        <div class="sp-row lg-row" onclick="_lgOpen('privacy')"><div class="sp-row-txt"><div class="sp-row-title">Политика конфиденциальности</div></div></div></div>`);
    }
  }catch(e){}
  return r;
};}
