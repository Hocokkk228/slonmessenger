// ════════════════════════════════════════
// ── ПОЧТА: восстановление доступа и двухэтапный вход ──
// Экран входа: «Забыл пароль?» → почта → код из письма → «Хотите сменить пароль?»
//   Да → новый пароль → вход; Позже → сразу вход.
// Вход с двухэтапной защитой: пароль → код из письма → вход.
// Настройки → Конфиденциальность → «Дополнительные способы входа»: почта и двухэтапный вход.
// ════════════════════════════════════════
const _em = { mode: '', email: '', user: '', pass: '', token: '', rt: '' };

// ── разметка новых окон экрана входа ──
(function _emInject() {
  const card = document.getElementById('authCard');
  if (!card) { setTimeout(_emInject, 300); return; }
  if (document.getElementById('authRecover')) return;
  const langBtn = document.getElementById('authLangBtn');
  const html = `
    <div id="authRecover" class="auth-sec" style="display:none">
      <div class="auth-glass auth-hello"><h1>Восстановление</h1><p>Введи почту, привязанную к аккаунту — пришлём код.</p></div>
      <label class="auth-field"><input class="username-inp" id="recEmailInp" type="email" placeholder="Электронная почта" autocomplete="email" autocapitalize="none" spellcheck="false" onkeydown="if(event.key==='Enter')_emRecStart()"></label>
      <div class="username-error" id="recError" style="display:none"></div>
      <div class="auth-alt"><a href="#" class="auth-link" onclick="_authGo('authLogin');return false">Назад ко входу</a></div>
      <button class="username-btn" onclick="_emRecStart()">Получить код</button>
    </div>
    <div id="authCode" class="auth-sec" style="display:none">
      <div class="auth-glass auth-hello"><h1>Код из письма</h1><p id="codeHint">Мы отправили код на почту.</p></div>
      <label class="auth-field"><input class="username-inp auth-code-inp" id="codeInp" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="one-time-code" oninput="this.value=this.value.replace(/\\D/g,'').slice(0,6);if(this.value.length===6)_emCodeSubmit()"></label>
      <div class="username-error" id="codeError" style="display:none"></div>
      <button class="username-btn" onclick="_emCodeSubmit()">Подтвердить</button>
      <button class="em-resend" id="codeResend" onclick="_emResend()">Отправить код повторно</button>
      <div class="auth-alt"><a href="#" class="auth-link" onclick="_authGo('authLogin');return false">Отмена</a></div>
    </div>
    <div id="authAsk" class="auth-sec" style="display:none">
      <div class="auth-ask-ico"><svg viewBox="0 0 24 24"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 16-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg></div>
      <div class="auth-glass auth-hello"><h1>Доступ восстановлен</h1><p>Хочешь сменить пароль? Если забыл старый — лучше задать новый прямо сейчас.</p></div>
      <button class="username-btn" onclick="_authGo('authNewPass')">Да, сменить пароль</button>
      <button class="username-btn auth-btn-2" onclick="_emEnter()">Позже</button>
    </div>
    <div id="authNewPass" class="auth-sec" style="display:none">
      <div class="auth-glass auth-hello"><h1>Новый пароль</h1><p>Придумай пароль, которого нет на других сайтах.</p></div>
      <label class="auth-field"><input class="username-inp" id="npPassInp" type="password" placeholder="Новый пароль (мин. 6 символов)" autocomplete="new-password" onkeydown="if(event.key==='Enter')$('npPassConfInp').focus()"></label>
      <label class="auth-field"><input class="username-inp" id="npPassConfInp" type="password" placeholder="Повтори пароль" autocomplete="new-password" onkeydown="if(event.key==='Enter')_emNewPass()"></label>
      <div class="username-error" id="npError" style="display:none"></div>
      <div class="auth-alt"><a href="#" class="auth-link" onclick="_emEnter();return false">Пропустить</a></div>
      <button class="username-btn" onclick="_emNewPass()">Сохранить и войти</button>
    </div>`;
  if (langBtn) langBtn.insertAdjacentHTML('beforebegin', html); else card.insertAdjacentHTML('beforeend', html);
  // «Забыл пароль?» под полем пароля на входе
  const err = document.getElementById('loginError');
  if (err && !document.getElementById('forgotLink'))
    err.insertAdjacentHTML('afterend', `<div class="auth-alt auth-forgot" id="forgotLink"><a href="#" class="auth-link" onclick="_authGo('authRecover');return false">Забыл пароль?</a></div>`);
})();

// Показать секцию экрана входа с той же анимацией, что вход/регистрация
function _authGo(id) {
  const next = document.getElementById(id); if (!next) return;
  const from = [...document.querySelectorAll('#authCard .auth-sec')].find(x => x.style.display !== 'none');
  const show = () => {
    document.querySelectorAll('#authCard .auth-sec').forEach(s => s.style.display = s === next ? '' : 'none');
    next.classList.remove('auth-in'); void next.offsetWidth; next.classList.add('auth-in');
    setTimeout(() => next.querySelector('input')?.focus(), 250);
  };
  if (!from || from === next) return show();
  from.classList.add('auth-out');
  setTimeout(() => { from.classList.remove('auth-out'); show(); }, 180);
}
const _emErr = (id, msg) => { const e = document.getElementById(id); if (!e) return; e.textContent = msg || ''; e.style.display = msg ? 'block' : 'none'; };
async function _emBusy(btnSel, fn) {
  const b = document.querySelector(btnSel), t = b?.textContent;
  if (b) { b.disabled = true; b.textContent = '…'; }
  try { return await fn(); } finally { if (b) { b.disabled = false; b.textContent = t; } }
}

// ── Забыл пароль ──
async function _emRecStart() {
  const email = (document.getElementById('recEmailInp')?.value || '').trim().toLowerCase();
  _emErr('recError', '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return _emErr('recError', 'Проверь адрес почты');
  await _emBusy('#authRecover .username-btn', async () => {
    try {
      const d = await api('/auth/recover/start', { email }, { token: '' });
      Object.assign(_em, { mode: 'rec', email });
      document.getElementById('codeHint').textContent = 'Код отправлен на ' + (d.hint || email) + '. Проверь и папку «Спам».';
      document.getElementById('codeInp').value = ''; _emErr('codeError', '');
      _authGo('authCode'); _emTimer('codeResend');
    } catch (e) { _emErr('recError', e.message); }
  });
}
// ── Вход с кодом (вызывается из doLogin) ──
function _emLoginCode(user, pass, hint) {
  Object.assign(_em, { mode: 'login', user, pass });
  document.getElementById('codeHint').textContent = 'Двухэтапный вход: код отправлен на ' + (hint || 'твою почту') + '.';
  document.getElementById('codeInp').value = ''; _emErr('codeError', '');
  _authGo('authCode'); _emTimer('codeResend');
}
function _emTimer(id, sec = 60) {
  const b = document.getElementById(id); if (!b) return;
  clearInterval(b._t); let left = sec;
  const tick = () => { if (left <= 0) { clearInterval(b._t); b.disabled = false; b.textContent = 'Отправить код повторно'; return; }
    b.disabled = true; b.textContent = 'Отправить повторно через 0:' + String(left--).padStart(2, '0'); };
  tick(); b._t = setInterval(tick, 1000);
}
async function _emResend() {
  if (document.getElementById('codeResend')?.disabled) return;
  try {
    if (_em.mode === 'rec') await api('/auth/recover/start', { email: _em.email }, { token: '' });
    else if (_em.mode === 'login') await api('/auth/login', { u: _em.user, h: await hashPassword(_em.pass), device: _apiDevice() }, { token: '' });
    toast('Код отправлен ещё раз'); _emTimer('codeResend');
  } catch (e) { _emErr('codeError', e.message); }
}
async function _emCodeSubmit() {
  const code = (document.getElementById('codeInp')?.value || '').trim();
  _emErr('codeError', '');
  if (code.length !== 6) return _emErr('codeError', 'Код — 6 цифр');
  await _emBusy('#authCode .username-btn', async () => {
    try {
      if (_em.mode === 'rec') {
        const d = await api('/auth/recover/confirm', { email: _em.email, code, device: _apiDevice() }, { token: '' });
        Object.assign(_em, { user: d.username, token: d.token, rt: d.rt });
        _authGo('authAsk');                                  // «Хотите сменить пароль?»
      } else if (_em.mode === 'login') {
        const d = await api('/auth/login/code', { u: _em.user, h: await hashPassword(_em.pass), code, device: _apiDevice() }, { token: '' });
        const pass = _em.pass; _em.pass = '';
        _authEnter(_em.user, d.token, false);
        if (typeof _e2eOnPassword === 'function') _e2eOnPassword(pass);
      }
    } catch (e) { _emErr('codeError', e.message); }
  });
}
// «Позже» — сразу в мессенджер
function _emEnter() {
  if (!_em.user || !_em.token) return _authGo('authLogin');
  _authEnter(_em.user, _em.token, false);
  _em.token = ''; _em.rt = '';
}
async function _emNewPass() {
  const p = document.getElementById('npPassInp')?.value || '', c = document.getElementById('npPassConfInp')?.value || '';
  _emErr('npError', '');
  if (p.length < 6) return _emErr('npError', 'Пароль минимум 6 символов');
  if (p !== c) return _emErr('npError', 'Пароли не совпадают');
  await _emBusy('#authNewPass .username-btn', async () => {
    try {
      const d = await api('/auth/set-password', { u: _em.user, rt: _em.rt, h: await hashPassword(p), device: _apiDevice() }, { token: '' });
      _authEnter(_em.user, d.token, false);
      if (typeof _e2eOnPassword === 'function') _e2eOnPassword(p);
      _em.token = ''; _em.rt = '';
      toast('Пароль изменён 🔒');
    } catch (e) { _emErr('npError', e.message); }
  });
}

// ════════ Настройки → «Дополнительные способы входа» ════════
async function _spLoginMethods() {
  _spPush('Дополнительные способы входа', `<div id="lmBody" class="lm-body"><div class="sp-hint">Загрузка…</div></div>`);
  _lmRender();
}
async function _lmRender() {
  const box = document.getElementById('lmBody'); if (!box) return;
  let st;
  try { st = await api('/auth/email'); } catch (e) { box.innerHTML = `<div class="sp-hint">${esc(e.message)}</div>`; return; }
  const card = h => `<div class="sp-card sp-pad">${h}</div>`;
  let h = _spSec('Электронная почта');
  if (st.email) {
    h += card(`<div class="lm-mail"><div class="lm-mail-ico">@</div><div><div class="lm-mail-addr">${esc(st.email)}</div><div class="sp-row-sub">Привязана · через неё можно восстановить доступ</div></div></div>
      <div class="lm-btns"><button class="lm-btn" onclick="_lmBindStart(true)">Сменить почту</button><button class="lm-btn danger" onclick="_lmRemove()">Отвязать</button></div>`);
    h += _spSec('Двухэтапный вход') + card(`<div class="lm-row"><div><div class="lm-t">Код на почту при входе</div><div class="sp-row-sub">После пароля на новом устройстве нужно будет ввести код из письма</div></div>
      <div class="sp-check${st.twofa ? ' on' : ''}" onclick="_lm2fa(this)">${typeof _spSvg === 'function' ? _spSvg('check') : '✓'}</div></div>`);
  } else {
    h += card(`<div class="sp-row-sub" style="margin-bottom:10px">Привяжи почту — если забудешь пароль, мы пришлём на неё код, и ты войдёшь в аккаунт. Ещё она нужна для двухэтапного входа.</div>
      <div id="lmBind"></div><button class="lm-btn primary" id="lmBindBtn" onclick="_lmBindStart(false)">Привязать почту</button>`);
  }
  if (!st.mail) h += `<div class="sp-hint">⚠ Отправка писем на сервере ещё не настроена — коды пока не придут.</div>`;
  box.innerHTML = h;
}
let _lmMail = '';
function _lmBindStart(change) {
  const box = document.getElementById('lmBody');
  box.innerHTML = _spSec(change ? 'Новая почта' : 'Привязать почту') + `<div class="sp-card sp-pad em-box">
    <div class="em-ico">✉️</div>
    <div class="em-t">Введи адрес почты</div>
    <div class="sp-row-sub em-sub">Пришлём на неё код из 6 цифр</div>
    <input class="lm-inp" id="lmEmail" type="email" placeholder="you@example.com" autocomplete="email" autocapitalize="none" onkeydown="if(event.key==='Enter')_lmSend()">
    <div class="lm-err" id="lmErr"></div>
    <button class="lm-btn primary em-wide" id="lmGo" onclick="_lmSend()">Отправить код</button>
    <button class="em-resend" onclick="_lmRender()">Отмена</button></div>`;
  setTimeout(() => document.getElementById('lmEmail')?.focus(), 200);
}
async function _lmSend(again) {
  const go = document.getElementById(again ? 'lmResend' : 'lmGo'), err = document.getElementById('lmErr');
  if (go?.disabled) return;
  const email = again ? _lmMail : (document.getElementById('lmEmail')?.value || '').trim().toLowerCase();
  err.textContent = '';
  if (!/^[^s@]+@[^s@]+.[^s@]{2,}$/.test(email)) { err.textContent = 'Проверь адрес почты'; return; }
  const t = go.textContent; go.disabled = true; go.textContent = 'Отправляем…';
  try {
    const d = await api('/auth/email/start', { email });
    _lmMail = email;
    if (again) { toast('Код отправлен ещё раз'); _emTimer('lmResend'); return; }
    document.querySelector('#lmBody .em-box').innerHTML = `
      <div class="em-ico">📩</div>
      <div class="em-t">Введи код из письма</div>
      <div class="sp-row-sub em-sub">Код отправлен на <b>${esc(d.hint || email)}</b>.<br>Не пришло — загляни в «Спам».</div>
      <input class="lm-inp lm-code-inp" id="lmCode" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="one-time-code" oninput="this.value=this.value.replace(/\D/g,'').slice(0,6);if(this.value.length===6)_lmConfirm()">
      <div class="lm-err" id="lmErr"></div>
      <button class="lm-btn primary em-wide" id="lmGo" onclick="_lmConfirm()">Подтвердить</button>
      <button class="em-resend" id="lmResend" onclick="_lmSend(true)">Отправить код повторно</button>
      <button class="em-resend" onclick="_lmBindStart()">Изменить почту</button>`;
    _emTimer('lmResend');
    setTimeout(() => document.getElementById('lmCode')?.focus(), 150);
  } catch (e) { err.textContent = e.message; if (go) { go.disabled = false; go.textContent = t; } }
  if (!again && go && document.body.contains(go)) { go.disabled = false; go.textContent = t; }
}
async function _lmConfirm() {
  const go = document.getElementById('lmGo'), err = document.getElementById('lmErr');
  const code = document.getElementById('lmCode')?.value || '';
  err.textContent = '';
  if (code.length !== 6) { err.textContent = 'Код — 6 цифр'; return; }
  if (go.disabled) return; go.disabled = true;
  try { await api('/auth/email/confirm', { code }); toast('Почта привязана ✉️'); _lmRender(); }
  catch (e) { err.textContent = e.message; go.disabled = false; }
}
async function _lm2fa(el) {
  const on = !el.classList.contains('on');
  try { await api('/auth/2fa', { enable: on }); el.classList.toggle('on', on); toast(on ? 'Двухэтапный вход включён' : 'Двухэтапный вход выключен'); }
  catch (e) { toast(e.message); }
}
async function _lmRemove() {
  const ok = typeof slonConfirm === 'function' ? await slonConfirm({ title: 'Отвязать почту', text: 'Без почты не получится восстановить доступ, если забудешь пароль, и выключится двухэтапный вход.', buttons: [{ label: 'Отвязать', value: true, danger: true }, { label: 'Отмена', value: null }] }) : true;
  if (!ok) return;
  const pass = prompt('Введи пароль от аккаунта, чтобы отвязать почту');
  if (!pass) return;
  try { await api('/auth/email/remove', { h: await hashPassword(pass) }); toast('Почта отвязана'); _lmRender(); } catch (e) { toast(e.message); }
}
