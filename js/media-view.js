// ════════════════════════════════════════
// ── ПРОСМОТР ФОТО И ВИДЕО ВНУТРИ ПРИЛОЖЕНИЯ (как в Telegram) ──
// Слева сверху — аватар, ник и дата; справа — переслать, скачать, уменьшить,
// увеличить, удалить, закрыть. Колесо/кнопки — зум, перетаскивание — когда увеличено.
// + slonConfirm() — окно подтверждения в стиле Telegram (удаление, блокировка и т.п.)
// ════════════════════════════════════════

const _VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|3gp)$/i;
const _isVideoMsg = m => !!(m && m.fileInfo && _VIDEO_EXT.test(m.fileInfo.name || ''));

const _MV_I = {
  fwd: 'M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z',
  dl: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  zout: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z',
  zin: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2z',
  del: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'
};
const _mvBtn = (k, title) => `<button class="mv-btn" data-a="${k}" title="${title}"><svg viewBox="0 0 24 24"><path d="${_MV_I[k]}"/></svg></button>`;

let _mv = null;   // {msg, scale, x, y}
function _mvEl() {
  let el = document.getElementById('mediaView');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'mediaView'; el.className = 'mv';
  el.innerHTML = `<div class="mv-top">
      <div class="mv-who"><div class="mv-av"></div><div class="mv-meta"><div class="mv-name"></div><div class="mv-date"></div></div></div>
      <div class="mv-acts">${_mvBtn('fwd', 'Переслать')}${_mvBtn('dl', 'Скачать')}${_mvBtn('zout', 'Уменьшить')}${_mvBtn('zin', 'Увеличить')}${_mvBtn('del', 'Удалить')}${_mvBtn('close', 'Закрыть')}</div>
    </div>
    <div class="mv-stage"></div>`;
  document.body.appendChild(el);
  el.querySelector('.mv-acts').addEventListener('click', e => {
    const b = e.target.closest('.mv-btn'); if (!b) return;
    e.stopPropagation(); _mvAct(b.dataset.a);
  });
  const stage = el.querySelector('.mv-stage');
  stage.addEventListener('click', e => { if (e.target === stage) closeMedia(); });
  stage.addEventListener('wheel', e => { if (!_mv) return; e.preventDefault(); _mvZoom(e.deltaY < 0 ? 1.2 : 1 / 1.2); }, { passive: false });
  // перетаскивание увеличенной картинки
  let drag = null;
  stage.addEventListener('pointerdown', e => { if (!_mv || _mv.scale <= 1 || !e.target.closest('.mv-media')) return; drag = { x: e.clientX - _mv.x, y: e.clientY - _mv.y }; e.target.setPointerCapture?.(e.pointerId); });
  stage.addEventListener('pointermove', e => { if (!drag) return; _mv.x = e.clientX - drag.x; _mv.y = e.clientY - drag.y; _mvApply(); });
  stage.addEventListener('pointerup', () => { drag = null; });
  stage.addEventListener('dblclick', e => { if (e.target.closest('img.mv-media')) { _mv.scale > 1 ? _mvReset() : _mvZoom(2); } });
  document.addEventListener('keydown', e => {
    if (!el.classList.contains('show')) return;
    if (e.key === 'Escape') closeMedia();
    else if (e.key === '+' || e.key === '=') _mvZoom(1.25);
    else if (e.key === '-') _mvZoom(0.8);
  });
  return el;
}
function _mvApply() {
  const m = document.querySelector('#mediaView .mv-media');
  if (m && _mv) m.style.transform = `translate(${_mv.x}px,${_mv.y}px) scale(${_mv.scale})`;
  document.querySelector('#mediaView')?.classList.toggle('zoomed', !!(_mv && _mv.scale > 1));
}
function _mvReset() { if (!_mv) return; _mv.scale = 1; _mv.x = 0; _mv.y = 0; _mvApply(); }
function _mvZoom(k) {
  if (!_mv || _mv.video) return;
  _mv.scale = Math.max(1, Math.min(6, _mv.scale * k));
  if (_mv.scale === 1) { _mv.x = 0; _mv.y = 0; }
  _mvApply();
}

// Открыть медиа сообщения (фото или видео)
async function openMedia(msg) {
  if (!msg) return;
  const el = _mvEl(), stage = el.querySelector('.mv-stage');
  const video = _isVideoMsg(msg);
  let src = null;
  if (msg.photoId) src = await _resolvePhotoSrc(msg.photoId);
  else if (msg.fileDataId) src = await _resolveFileSrc(msg.fileDataId);
  if (!src) { toast('Файл ещё загружается или недоступен'); return; }
  _mv = { msg, scale: 1, x: 0, y: 0, video };
  // кто отправил и когда
  const isMe = msg.sender === 'me';
  const av = isMe ? myAvatar : (msg.avatar || peerAvatars[msg.senderId] || null);
  const name = isMe ? (myNick || ('@' + myUsername)) : (msg.name || peerNames[msg.senderId] || '');
  el.querySelector('.mv-av').innerHTML = av ? `<img src="${esc(av)}" alt="">` : esc((String(name).replace(/^@/, '')[0] || '?').toUpperCase());
  el.querySelector('.mv-name').textContent = name;
  el.querySelector('.mv-date').textContent = (typeof fmtDateSeparator === 'function' ? fmtDateSeparator(msg.ts) : '') + ', ' + (msg.time || fmtTime(msg.ts));
  el.querySelector('[data-a="zin"]').style.display = video ? 'none' : '';
  el.querySelector('[data-a="zout"]').style.display = video ? 'none' : '';
  el.querySelector('[data-a="fwd"]').style.display = typeof forwardMsg === 'function' ? '' : 'none';
  stage.innerHTML = video
    ? `<video class="mv-media" src="${esc(src)}" controls autoplay playsinline></video>`
    : `<img class="mv-media" src="${esc(src)}" alt="" draggable="false">`;
  el.classList.remove('closing');
  el.classList.add('show');
}
function closeMedia() {
  const el = document.getElementById('mediaView'); if (!el || !el.classList.contains('show')) return;
  el.querySelector('video')?.pause();
  el.classList.add('closing');
  setTimeout(() => { el.classList.remove('show', 'closing', 'zoomed'); el.querySelector('.mv-stage').innerHTML = ''; _mv = null; }, 200);
}
async function _mvAct(a) {
  const msg = _mv && _mv.msg; if (!msg) return;
  if (a === 'close') return closeMedia();
  if (a === 'zin') return _mvZoom(1.25);
  if (a === 'zout') return _mvZoom(0.8);
  if (a === 'dl') { if (msg.photoId) return _downloadPhoto(msg); if (msg.fileDataId) return dlFile(msg.fileDataId, msg.fileInfo?.name || 'file'); return; }
  if (a === 'fwd') { if (typeof forwardMsg === 'function') { closeMedia(); forwardMsg(msg); } return; }
  if (a === 'del') {
    const isMe = msg.sender === 'me';
    const peer = peerNames[activeChat] || '';
    const r = await slonConfirm({
      title: 'Удалить сообщение',
      text: 'Удалить это сообщение насовсем?',
      buttons: isMe && activeChat !== 'saved'
        ? [{ label: 'Удалить у меня и у ' + peer, value: 'all', danger: true }, { label: 'Удалить только у меня', value: 'me', danger: true }, { label: 'Отмена', value: null }]
        : [{ label: 'Удалить', value: 'me', danger: true }, { label: 'Отмена', value: null }]
    });
    if (!r) return;
    closeMedia(); deleteMsg(msg, r === 'all');
  }
}

// Старые вызовы openPhoto(id) → новый просмотр (ищем сообщение по id фото)
const _openPhoto0 = openPhoto;
openPhoto = function (id) {
  const hist = (activeChat && (activeChat.startsWith('g_') ? grpHist[activeChat] : chatHist[activeChat])) || [];
  const msg = hist.find(m => m.photoId === id);
  if (msg) return openMedia(msg);
  return _openPhoto0.apply(this, arguments);
};

// ════════ Окно подтверждения в стиле Telegram ════════
// slonConfirm({title, text, avatar?, buttons:[{label, value, danger}]}) → Promise<value|null>
function slonConfirm(o) {
  return new Promise(res => {
    const wrap = document.createElement('div');
    wrap.className = 'sc-wrap';
    wrap.innerHTML = `<div class="sc-box" role="dialog">
      <div class="sc-head">${o.avatar ? `<div class="sc-av">${o.avatar}</div>` : ''}<div class="sc-title">${esc(o.title || '')}</div></div>
      ${o.text ? `<div class="sc-text">${esc(o.text)}</div>` : ''}
      ${o.html || ''}
      <div class="sc-btns">${(o.buttons || [{ label: 'OK', value: true }]).map((b, i) => `<button class="sc-btn${b.danger ? ' danger' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>
    </div>`;
    const btns = o.buttons || [{ label: 'OK', value: true }];
    const done = v => { wrap.classList.add('closing'); document.removeEventListener('keydown', key); setTimeout(() => wrap.remove(), 180); res(v); };
    const key = e => { if (e.key === 'Escape') done(null); };
    wrap.addEventListener('click', e => {
      const b = e.target.closest('.sc-btn');
      if (b) return done(btns[+b.dataset.i].value);
      if (e.target === wrap) done(null);
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(wrap);
    void wrap.offsetWidth; wrap.classList.add('show');
  });
}
