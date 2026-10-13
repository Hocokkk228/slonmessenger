// ════════ Резервный сервер ════════
// Яндекс не отвечает (бывает: отключения питания в зонах ru-central1) — сами переходим на Cloudflare,
// а когда Яндекс вернётся — обратно. Ручной выбор (localStorage sl_srv) отключает автомат.
// В резерве: сообщения, звонки, шифрование работают; стена, облако музыки, «слушает» — нет (их там нет).
// Сессии и аккаунты, появившиеся после переезда (26.09), Cloudflare не знает — тогда один раз просим пароль
// (без выхода из аккаунта: выход стёр бы ключи шифрования этого устройства).
(function(){
  let manual=false;
  try{const o=JSON.parse(localStorage.getItem('sl_srv')||'null');manual=o==='yc'||o==='cf';}catch(e){}
  if(manual)return;
  // жив ли адрес: любой HTTP-ответ = жив; обрыв/тайм-аут = нет
  async function alive(url,ms){
    const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
    try{await fetch(url,{mode:'no-cors',cache:'no-store',signal:c.signal});return true;}
    catch(e){return false;}
    finally{clearTimeout(t);}
  }
  const CF=SLON_CF+'/ping';
  // Яндекс жив, только если отвечают И функция (HTTP), И шлюз (через него сокет — сообщения):
  // бывает, что функция поднялась, а шлюз ещё лежит
  const ycAlive=async ms=>{const [f,g]=await Promise.all([alive(SLON_YC.api+'?p=/ping',ms),alive(SLON_YC.gw+'/ping',ms)]);return f&&g;};
  const busy=()=>!!(typeof activeCall!=='undefined'&&activeCall)||!!(typeof _gc!=='undefined'&&_gc);

  if(!SRV_FO){
    // Яндекс: два провала подряд (и Cloudflare жив) → на резерв
    let fails=0,going=false;
    async function chk(){
      if(going)return;
      if(await ycAlive(10000)){fails=0;return;}
      if(++fails<2){setTimeout(chk,4000);return;}
      if(!await alive(CF,8000))return;
      going=true;
      try{localStorage.setItem('sl_srv_fo',String(Date.now()));}catch(e){return;}
      if(typeof toast==='function')toast('Сервер недоступен — переключаемся на резервный…',3000);
      setTimeout(()=>location.reload(),1500);
    }
    setTimeout(chk,3000);
    setInterval(()=>{if(!(typeof _hubUp!=='undefined'&&_hubUp))chk();},45000);
    return;
  }

  // ── Мы на резерве ──
  let back=false;
  setInterval(async()=>{
    if(back||!await ycAlive(10000))return;
    back=true;
    try{localStorage.removeItem('sl_srv_fo');}catch(e){}
    if(typeof toast==='function')toast('Основной сервер снова работает — возвращаемся',4000);
    // не рвём звонок: перезагрузка — когда он закончится
    const go=()=>{if(busy())return setTimeout(go,5000);location.reload();};
    setTimeout(go,2500);
  },60000);

  // плашка «резервный сервер»
  function badge(){
    if(document.getElementById('foBadge'))return;
    const b=document.createElement('div');b.id='foBadge';b.className='fo-badge';
    b.textContent='Резервный сервер';b.title='Основной сервер сейчас недоступен. Сообщения и звонки работают; стена и облако музыки вернутся вместе с ним.';
    b.onclick=()=>toast(b.title,6000);
    document.body.appendChild(b);
  }
  // проверка сессии на резерве
  async function check(){
    if(typeof myUsername==='undefined'||!myUsername){setTimeout(check,1500);return;}
    badge();
    if(!_apiToken()){_foNeedLogin();return;}
    try{await api('/auth/me');}catch(e){if(e.status===401)_foNeedLogin();}
  }
  setTimeout(check,1500);
})();

// Вход на резервный сервер тем же паролем (окно один раз; аккаунта там нет — создаётся с тем же паролем)
let _foAsking=false;
function _foNeedLogin(){
  if(_foAsking||!SRV_FO||typeof myUsername==='undefined'||!myUsername)return;
  _foAsking=true;
  const w=document.createElement('div');w.className='fo-login';
  w.innerHTML=`<div class="fo-card"><b>Основной сервер недоступен</b>
    <p>Пока он чинится, SLON работает через резервный. Введи пароль от @${esc(myUsername)}, чтобы войти туда — переписка и ключи шифрования останутся на месте.</p>
    <input type="password" id="foPass" placeholder="Пароль" autocomplete="current-password">
    <div class="fo-err" id="foErr"></div>
    <div class="fo-btns"><button class="fo-later">Позже</button><button class="fo-go">Войти</button></div></div>`;
  document.body.appendChild(w);
  const inp=w.querySelector('#foPass'),err=w.querySelector('#foErr'),btn=w.querySelector('.fo-go');
  setTimeout(()=>inp.focus(),50);
  w.querySelector('.fo-later').onclick=()=>{w.remove();_foAsking=false;};
  const go=async()=>{
    const pass=inp.value;if(!pass)return;
    btn.disabled=true;err.textContent='';
    try{
      const u=myUsername,h=await hashPassword(pass),dev=_apiDevice();
      let tok='';
      try{
        const d=await api('/auth/login',{u,h,device:dev},{token:''});
        if(d.status==='ok')tok=d.token;
        else if(d.status==='set_password'&&d.rt)tok=(await api('/auth/set-password',{u,h,rt:d.rt},{token:''})).token;
      }catch(e){
        if(e.code==='not_found')tok=(await api('/auth/register',{u,h,device:dev},{token:''})).token;
        else throw e;
      }
      if(!tok)throw new Error('Не получилось войти');
      _apiSetToken(u,tok);
      w.remove();_foAsking=false;
      toast('Подключено к резервному серверу',3000);
      // ключи шифрования этого устройства — в справочник резерва; ключ истории — наш же
      if(typeof _e2eOnPassword==='function')_e2eOnPassword(pass);
      if(typeof _hubConnect==='function'){try{_hubWs?.close();}catch(e){}_hubConnect();}
    }catch(e){err.textContent=e.message||'Ошибка';btn.disabled=false;}
  };
  btn.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go();};
}
