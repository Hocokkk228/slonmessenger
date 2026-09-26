// ════════════════════════════════════════
// ── ЗАЩИТА ОТ МОШЕННИКОВ ──
// Пустой профиль (без аватарки, описания и нормального имени), который пишет тебе
// первым и не из контактов, — сомнительный: его чат сам уходит в архив, а при открытии
// показывается предупреждение с кнопками «Заблокировать» и «Это знакомый».
// ════════════════════════════════════════
const _afKey = () => 'sl_u_' + myUsername + '_suspects';
function _afLoad() { try { return JSON.parse(localStorage.getItem(_afKey()) || '{}') || {}; } catch (e) { return {}; } }
function _afSave(o) { try { localStorage.setItem(_afKey(), JSON.stringify(o)); } catch (e) { } }
const _afCand = new Set();       // новые чаты от незнакомцев — проверим, когда подгрузится профиль

// Профиль пустой: нет аватарки, нет описания, имя — просто @юзернейм
function _afEmptyProfile(pid) {
  const nm = String(peerNames[pid] || '').replace(/^@/, '').trim().toLowerCase();
  return !peerAvatars[pid] && !String(peerBios[pid] || '').trim() && (!nm || nm === pid);
}
function _afCheck(pid) {
  if (!pid || pid === 'saved' || pid === 'ai' || pid.startsWith('g_') || blockedUsers[pid]) return;
  const s = _afLoad();
  if (s[pid]) return;                                   // уже решено (подозрительный или «знакомый»)
  if (!_afEmptyProfile(pid)) return;
  // писал ли я ему сам? тогда это не незнакомец
  if ((chatHist[pid] || []).some(m => m.sender === 'me')) return;
  s[pid] = 'suspect'; _afSave(s);
  if (!archivedChats[pid]) {
    archivedChats[pid] = true;
    const el = document.getElementById('si-' + pid);
    if (el) { el.classList.add('archived'); document.getElementById('archiveList')?.appendChild(el); }
    if (typeof updateArchiveHeader === 'function') updateArchiveHeader();
    saveAll();
  }
}
// первый входящий от незнакомца — берём на заметку и проверяем чуть позже (профиль подгрузится)
function _afNoteNew(pid) {
  if (!pid || peerNames[pid] || _afCand.has(pid)) return;
  _afCand.add(pid);
  setTimeout(() => { _afCand.delete(pid); _afCheck(pid); }, 3500);
}
if (typeof _mlOnAdd === 'function') {
  const f = _mlOnAdd;
  _mlOnAdd = function (key, r) { try { if (r && !r.out && r.chat && r.chat !== 'saved') _afNoteNew(r.chat); } catch (e) { } return f.apply(this, arguments); };
}
if (typeof _handleIncoming === 'function') {
  const f = _handleIncoming;
  _handleIncoming = function (pid, data) { try { if (data && (data.type === 'msg' || data.type === 'file_start')) _afNoteNew(pid); } catch (e) { } return f.apply(this, arguments); };
}

// Предупреждение при открытии чата с подозрительным
function _afBanner(pid) {
  document.getElementById('afBanner')?.remove();
  const m0 = document.getElementById('msgs'); if (m0 && m0.dataset.afPad !== undefined) { m0.style.paddingTop = m0.dataset.afPad; delete m0.dataset.afPad; }
  if (_afLoad()[pid] !== 'suspect') return;
  const name = peerNames[pid] || ('@' + pid);
  const b = document.createElement('div');
  b.id = 'afBanner'; b.className = 'af-banner';
  b.innerHTML = `<div class="af-ico"><svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg></div>
    <div class="af-body">
      <div class="af-title">Осторожно: возможный мошенник</div>
      <div class="af-text">По нашему мнению, ${esc(name)} может отправлять ложную, вредящую или шокирующую информацию. Не переходи по ссылкам, не сообщай коды и пароли, не переводи деньги. Входи в диалог на свой риск.</div>
      <div class="af-btns"><button class="af-btn danger" data-a="block">Заблокировать</button><button class="af-btn" data-a="ok">Это знакомый</button></div>
    </div>`;
  b.addEventListener('click', e => {
    const a = e.target.closest('.af-btn')?.dataset.a; if (!a) return;
    if (a === 'block') { toggleBlockUser(pid); }
    else { const s = _afLoad(); s[pid] = 'ok'; _afSave(s); b.classList.add('closing'); setTimeout(() => { b.remove(); const m = document.getElementById('msgs'); if (m && m.dataset.afPad !== undefined) { m.style.paddingTop = m.dataset.afPad; delete m.dataset.afPad; } }, 250); }
  });
  const msgs = document.getElementById('msgs'), box = msgs?.parentNode;
  if (box && getComputedStyle(box).position === 'static') box.style.position = 'relative';
  box?.insertBefore(b, msgs);
  // сообщения — ниже плашки, чтобы она их не закрывала
  if (msgs) { msgs.dataset.afPad = msgs.style.paddingTop || ''; const base = parseFloat(getComputedStyle(msgs).paddingTop) || 0; msgs.style.paddingTop = (base + b.offsetHeight + 12) + 'px'; if (typeof scrollDown === 'function') scrollDown(true); }
}
if (typeof openChat === 'function') {
  const f = openChat;
  openChat = function (id) { const r = f.apply(this, arguments); try { _afBanner(id); } catch (e) { } return r; };
}
