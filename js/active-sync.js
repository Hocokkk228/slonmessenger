// ════════════════════════════════════════
// ── «Я уже в приложении»: не дёргать уведомлениями другие окна и устройства ──
// Окно, которое открыто и в фокусе, сообщает об этом:
//  • другим окнам этого же браузера — через BroadcastChannel (мгновенно и бесплатно);
//  • другим устройствам аккаунта — сигналом «self» раз в минуту (фоновая служба Android тоже слушает).
// Пока где-то активно, остальные не показывают уведомления о сообщениях и не пищат.
// ════════════════════════════════════════
const _WIN_ID = Math.random().toString(36).slice(2, 10);   // своё у каждого окна (у устройства — _myDeviceId)
let _activeElsewhereUntil = 0;
const _winActive = () => document.visibilityState === 'visible' && document.hasFocus();
function activeElsewhere() { return Date.now() < _activeElsewhereUntil; }

let _bc = null;
try { _bc = new BroadcastChannel('slon-active'); _bc.onmessage = e => { const d = e.data || {}; if (d.win !== _WIN_ID && d.u === myUsername && d.active) _activeElsewhereUntil = Date.now() + 70000; if (d.win !== _WIN_ID && d.u === myUsername && d.active === false) _activeElsewhereUntil = 0; }; } catch (e) { }

let _lastSelfActive = 0;
function _announceActive(force) {
  if (!myUsername) return;
  const active = _winActive();
  try { _bc?.postMessage({ win: _WIN_ID, u: myUsername, active }); } catch (e) { }
  // другим устройствам — не чаще раза в минуту (каждое сообщение — вызов сервера)
  if (active && (force || Date.now() - _lastSelfActive > 60000) && typeof _hubSend === 'function') {
    if (_hubSend({ t: 'self', payload: { type: 'dev_active', dev: typeof _myDeviceId !== 'undefined' ? _myDeviceId : '', win: _WIN_ID, ts: Date.now() } })) _lastSelfActive = Date.now();
  }
}
document.addEventListener('visibilitychange', () => _announceActive(true));
window.addEventListener('focus', () => _announceActive(true));
window.addEventListener('blur', () => _announceActive(false));
setInterval(() => { if (_winActive()) _announceActive(false); }, 20000);

// сигнал с другого устройства
function _onDevActive(p) {
  if (!p || p.win === _WIN_ID) return;
  if (Date.now() - (p.ts || 0) < 90000) _activeElsewhereUntil = Math.max(_activeElsewhereUntil, (p.ts || Date.now()) + 70000);
}

// Уведомления и звук сообщения — молчим, если приложение открыто в другом месте
if (typeof showDesktopNotif === 'function') {
  const _sdn0 = showDesktopNotif;
  showDesktopNotif = function (title, body, icon, tag, extra) {
    const kind = extra && extra.kind;
    if (kind !== 'call' && activeElsewhere() && !_winActive()) return;
    return _sdn0.apply(this, arguments);
  };
}
if (typeof playNotifSound === 'function') {
  const _pns0 = playNotifSound;
  playNotifSound = function () { if (activeElsewhere() && !_winActive()) return; return _pns0.apply(this, arguments); };
}
