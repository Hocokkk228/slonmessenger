// ════════════════════════════════════════════════════════════════
// SLON — сервер в Yandex Cloud Functions (бесплатный уровень).
// Одна функция обслуживает:
//  • HTTP API — прямой вызов функции, маршрут в ?p=/auth/login (или путь через API Gateway);
//  • WebSocket — события API Gateway (CONNECT / MESSAGE / DISCONNECT);
//  • медиа — подписанные ссылки на загрузку прямо в Object Storage.
// Протокол тот же, что у Cloudflare-версии (worker.js + hub.js), клиент почти не меняется.
// ════════════════════════════════════════════════════════════════
const crypto = require('crypto');
// секреты из деплоя приходят в base64 (в JSON и списках есть запятые) — раскладываем обратно
for (const [k, v] of Object.entries(process.env)) if (k.endsWith('_B64') && !process.env[k.slice(0, -4)]) { try { process.env[k.slice(0, -4)] = Buffer.from(v, 'base64').toString('utf8'); } catch (e) { } }
const { q, qAll, one, setToken } = require('./db');

const BUILTIN_ADMINS = (process.env.ADMINS || 'mamedov,vadimslonik67').split(',').map(s => s.trim()).filter(Boolean);
const MAX_FAILS = 10, LOCK_MS = 5 * 60 * 1000, RESET_TTL = 15 * 60 * 1000;
// ── Подарки и мини-слоники (внутренняя валюта: 100 мини-слоников = 20 ₽) ──
// Цены — только на сервере: клиент не может подарить дешевле.
const GIFTS = { plush: { price: 50, title: 'Плюшевый слоник' } };
const PM_MAX = 5, PM_SIZE = 15 * 1024 * 1024;
const QUEUE_TTL = 7 * 24 * 3600e3, CONN_TTL = 61 * 60 * 1000;           // соединение шлюза живёт не дольше 60 минут
const MEDIA_MAX = 100 * 1024 * 1024, WS_BUDGET = 90 * 1024;              // сообщение в сокет — до ~96 КБ
const BUCKET = process.env.BUCKET || '';
const S3_HOST = 'storage.yandexcloud.net';
const WS_API = 'https://apigateway-connections.api.cloud.yandex.net/apigateways/websocket/v1/connections/';
const QUEUE_TYPES = new Set(['msg', 'read', 'msg_edit', 'msg_delete', 'msg_pin', 'chat_delete', 'hello', 'call_incoming', 'call_offer',
  'call_cancel', 'call_reject', 'call_end', 'group_invite', 'group_add', 'group_update', 'group_kick', 'group_profile_update',
  'group_msg', 'system_premium', 'system_admin_granted', 'system_pass_reset', 'system_elephant', 'channel_invite']);

const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const rnd = n => crypto.randomBytes(n).toString('base64url');
const same = (a, b) => { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); };
const validUser = u => typeof u === 'string' && /^[a-z0-9_]{3,20}$/.test(u);
const validHash = h => typeof h === 'string' && /^[0-9a-f]{64}$/.test(h);
const now = () => Date.now();

// ── Firebase: только мягкий перенос старых аккаунтов (кто ещё ни разу не входил после переезда) ──
const FB = 'https://slon-376b4-default-rtdb.europe-west1.firebasedatabase.app';
async function fbGet(p) { try { const r = await fetch(FB + '/' + p + '.json', { signal: AbortSignal.timeout(5000) }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
async function fbPut(p, v) { try { await fetch(FB + '/' + p + '.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v), signal: AbortSignal.timeout(5000) }); } catch (e) { } }

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Slon-Auth, X-Mime, X-Name', 'Access-Control-Max-Age': '86400' };
const J = (o, s = 200) => ({ statusCode: s, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
const E = (code, msg, s = 400) => J({ ok: false, error: code, message: msg }, s);

// ── IAM-токен функции (для отправки в сокеты) ──
let IAM = '';
const iam = () => IAM || process.env.YC_IAM || '';

// ════════ Аккаунты ════════
const getUser = u => one('SELECT * FROM users WHERE username=$u;', { u });
async function setPassword(u, clientHash, migrated) {
  const salt = rnd(16), verifier = sha(salt + clientHash), t = now();
  const ex = await one('SELECT created, migrated FROM users WHERE username=$u;', { u });
  await q('UPSERT INTO users (username,salt,verifier,created,pass_updated,migrated) VALUES ($u,$s,$v,$c,$t,$m);',
    { u, s: salt, v: verifier, c: ex ? ex.created : t, t, m: ex ? (ex.migrated || 0) : (migrated ? 1 : 0) });
}
async function newSession(u, device) {
  const token = rnd(32), t = now();
  await q('UPSERT INTO sessions (token_hash,username,device,created,last_seen) VALUES ($h,$u,$d,$t,$t);', { h: sha(token), u, d: String(device || '').slice(0, 40), t });
  return token;
}
async function newReset(u) { const tk = rnd(24); await q('UPSERT INTO resets (token_hash,username,expires) VALUES ($h,$u,$e);', { h: sha(tk), u, e: now() + RESET_TTL }); return tk; }
async function sessionUser(token) {
  if (!token) return null;
  const h = sha(token);
  const s = await one('SELECT username,last_seen FROM sessions WHERE token_hash=$h;', { h });
  if (!s) return null;
  if (now() - (s.last_seen || 0) > 3600e3) await q('UPDATE sessions SET last_seen=$t WHERE token_hash=$h;', { t: now(), h });
  return s.username;
}
// токен SLON: X-Slon-Auth (прямой вызов функции) или Authorization: Bearer (через шлюз — фоновая служба Android)
const bearer = hd => { if (hd['x-slon-auth']) return hd['x-slon-auth']; const a = hd['authorization'] || ''; return a.startsWith('Bearer ') ? a.slice(7) : ''; };
async function isAdmin(u) { if (BUILTIN_ADMINS.includes(u)) return true; return !!(await one('SELECT username FROM admins WHERE username=$u;', { u })); }
async function failCheck(u) { const f = await one('SELECT cnt,until_ts FROM login_fails WHERE username=$u;', { u }); return f && f.cnt >= MAX_FAILS && f.until_ts > now() ? Math.ceil((f.until_ts - now()) / 60000) : 0; }
async function failAdd(u) {
  const f = await one('SELECT cnt,until_ts FROM login_fails WHERE username=$u;', { u });
  const cnt = !f || f.until_ts < now() ? 1 : (f.cnt || 0) + 1;
  await q('UPSERT INTO login_fails (username,cnt,until_ts) VALUES ($u,$c,$t);', { u, c: cnt, t: now() + LOCK_MS });
}
const failClear = u => q('DELETE FROM login_fails WHERE username=$u;', { u });
async function putPrekeys(u, dev, opks) {
  if (!Array.isArray(opks) || !opks.length) return;
  const list = opks.slice(0, 100).filter(k => k && k.pub);
  if (!list.length) return;
  const p = { u, d: dev }; const vals = [];
  list.forEach((k, i) => { p['k' + i] = +k.id; p['p' + i] = String(k.pub); vals.push(`($u,$d,$k${i},$p${i})`); });
  await q(`UPSERT INTO e2e_prekeys (username,device_id,key_id,pub) VALUES ${vals.join(',')};`, p);
}

// ════════ Почта: коды на e-mail (привязка, двухэтапный вход, восстановление) ════════
const validEmail = e => typeof e === 'string' && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const maskEmail = e => { const [a, d] = String(e).split('@'); return (a.length <= 2 ? a[0] + '*' : a.slice(0, 2) + '***') + '@' + d; };
let _mailer = null;
function mailer() {
  if (_mailer) return _mailer;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = +SMTP_PORT || 465;
  _mailer = require('nodemailer').createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER.trim(), pass: SMTP_PASS.replace(/\s+/g, '') } });   // пароль приложения Google вводят с пробелами — убираем
  return _mailer;
}
async function sendCodeMail(to, code, why) {
  const m = mailer();
  if (!m) { const e = new Error('Почта на сервере ещё не настроена'); e.code = 'mail_off'; throw e; }
  const titles = { bind: 'Подтверждение почты', login: 'Код для входа', rec: 'Восстановление доступа' };
  const html = `<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;background:#0d1520;color:#e8eef6;border-radius:16px">
    <div style="font-size:22px;font-weight:700;margin-bottom:6px">SLON</div>
    <div style="font-size:15px;opacity:.85;margin-bottom:18px">${titles[why] || 'Код'}</div>
    <div style="font-size:34px;font-weight:700;letter-spacing:8px;background:#1b2a3d;border-radius:12px;padding:16px;text-align:center">${code}</div>
    <div style="font-size:13px;opacity:.7;margin-top:16px">Код действует 10 минут. Никому его не сообщай — сотрудники SLON никогда его не спрашивают. Если это был не ты — просто проигнорируй письмо.</div></div>`;
  await m.sendMail({ from: process.env.SMTP_FROM || ('SLON <' + process.env.SMTP_USER + '>'), to, subject: 'SLON: ' + (titles[why] || 'код') + ' — ' + code,
    text: 'Твой код SLON: ' + code + '\nДействует 10 минут. Никому его не сообщай.', html });
}
async function codeIssue(k, email, why) {
  const prev = await one('SELECT sent FROM email_codes WHERE k=$k;', { k });
  if (prev && now() - prev.sent < 55000) { const e = new Error('Подожди минуту перед новым кодом'); e.code = 'wait'; throw e; }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await q('UPSERT INTO email_codes (k,code_hash,email,expires,tries,sent) VALUES ($k,$h,$e,$x,0,$t);', { k, h: sha(code), e: email, x: now() + 10 * 60e3, t: now() });
  await sendCodeMail(email, code, why);
}
async function codeCheck(k, code) {
  const r = await one('SELECT code_hash,email,expires,tries FROM email_codes WHERE k=$k;', { k });
  if (!r || r.expires < now()) return { err: 'Код устарел — запроси новый' };
  if (r.tries >= 5) return { err: 'Слишком много попыток — запроси новый код' };
  if (!same(sha(String(code || '').replace(/\D/g, '')), r.code_hash)) { await q('UPDATE email_codes SET tries=$n WHERE k=$k;', { n: (r.tries || 0) + 1, k }); return { err: 'Неверный код' }; }
  await q('DELETE FROM email_codes WHERE k=$k;', { k });
  return { ok: true, email: r.email };
}
const mailErr = e => e.code === 'mail_off' || e.code === 'wait' ? E(e.code, e.message, e.code === 'wait' ? 429 : 503) : (console.error('mail', e.code, e.responseCode, String(e.message).slice(0, 200)), E('mail_failed', 'Не удалось отправить письмо (' + (e.responseCode || e.code || 'ошибка') + ')', 502));

// ════════ Хаб: соединения, доставка, журнал ════════
// Кэш «кто онлайн» в памяти функции на 5 секунд: одно сообщение раньше читало это из базы 2–3 раза.
// Сбрасывается при подключении/отключении и когда сокет оказался мёртвым.
const _connCache = new Map();
const _connRow = new Map();   // conn_id → {u,bg,drained,t}
const connDrop = u => _connCache.delete(u);
async function liveConns(u) {
  const c = _connCache.get(u);
  if (c && now() - c.t < 5000) return c.rows;
  const rows = await q('SELECT conn_id, bg FROM conns VIEW idx_user WHERE u=$u AND at_ts>$cut;', { u, cut: now() - CONN_TTL });
  _connCache.set(u, { t: now(), rows });
  if (_connCache.size > 500) _connCache.delete(_connCache.keys().next().value);
  return rows;
}
async function wsSend(connId, obj) {
  const data = Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj), 'utf8').toString('base64');
  try {
    const r = await fetch(WS_API + encodeURIComponent(connId) + ':send', {
      method: 'POST', headers: { Authorization: 'Bearer ' + iam(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, type: 'TEXT' })
    });
    if (r.status === 404 || r.status === 410) { await q('DELETE FROM conns WHERE conn_id=$c;', { c: connId }); _connCache.clear(); return false; }
    return r.ok;
  } catch (e) { return false; }
}
async function bcast(u, obj, exceptConn, conns) {
  const cs = (conns || await liveConns(u)).filter(c => c.conn_id !== exceptConn);
  await Promise.all(cs.map(c => wsSend(c.conn_id, obj)));
  return cs;
}
async function setPresence(u, online, ls) {
  if (ls === undefined) { const r = await one('SELECT ls FROM hub_ls WHERE u=$u;', { u }); ls = r ? r.ls : '1'; }
  const lsAllowed = ls !== '0', t = now();
  await q('UPSERT INTO presence (username,online,ts,ls) VALUES ($u,$o,$t,$l);', { u, o: online ? 1 : 0, t, l: lsAllowed ? t : 0 });
}
async function deliver(from, to, payload) {
  const item = { t: 'data', from, payload };
  const conns = await liveConns(to);
  // доставлено, только если хотя бы одно открытое приложение реально приняло (мёртвый сокет → очередь и пуш)
  const sent = await Promise.all(conns.map(c => wsSend(c.conn_id, item)));
  if (conns.some((c, i) => !c.bg && sent[i])) return true;
  if (QUEUE_TYPES.has(payload.type))
    await q('UPSERT INTO queue (u,id,msg,ts) VALUES ($u,$i,$m,$t);', { u: to, i: String(now()).padStart(15, '0') + rnd(4), m: JSON.stringify(item), t: now() });
  if (payload.type === 'call_incoming')
    await sendFcm(to, { type: 'call', peer: from, title: payload.nick || ('@' + from), callId: payload.callId || '', video: payload.isVideo ? '1' : '0' }, '45s');
  else if (payload.type === 'call_cancel' || payload.type === 'call_end')
    await sendFcm(to, { type: 'call_end', peer: from, title: '@' + from }, '60s');
  return false;
}
async function mlPut(u, key, rec, exceptConn, fresh) {
  const old = fresh ? null : await one('SELECT rec FROM ml WHERE u=$u AND k=$k;', { u, k: key });
  if (old) { try { const o = JSON.parse(old.rec); if (o.del || o.gone) return; } catch (e) { } }
  const t = now();
  await q('UPSERT INTO ml (u,k,rec,upd) VALUES ($u,$k,$r,$t);', { u, k: key, r: JSON.stringify(rec), t });
  const conns = await liveConns(u);
  await bcast(u, { t: 'ml', key, rec, upd: t }, exceptConn, conns);
  if (!old && !rec.out && rec.chat !== 'saved' && !conns.some(c => !c.bg)) {
    const lbl = { photo: 'Фото', voice: 'Голосовое сообщение', slon: 'Слонкружок', file: 'Файл', e2e: 'Новое сообщение' };
    const body = lbl[rec.k] || (rec.text ? String(rec.text).slice(0, 200) : 'Новое сообщение');
    const data = { type: 'msg', chat: rec.chat, title: rec.nick || ('@' + rec.chat), body };
    if (rec.n) { const n = JSON.stringify(rec.n); if (n.length < 3500) data.n = n; }
    await sendFcm(u, data);
  }
}
async function mlPatch(u, key, patch, exceptConn) {
  const row = await one('SELECT rec FROM ml WHERE u=$u AND k=$k;', { u, k: key });
  if (!row) return;
  const rec = { ...JSON.parse(row.rec), ...patch }, t = now();
  await q('UPSERT INTO ml (u,k,rec,upd) VALUES ($u,$k,$r,$t);', { u, k: key, r: JSON.stringify(rec), t });
  await bcast(u, { t: 'ml', key, rec, upd: t, chg: 1 }, exceptConn);
}
// Пачка под лимит сокета (~90 КБ)
function fit(items, toJson) {
  const out = []; let size = 0;
  for (const it of items) { const s = JSON.stringify(toJson(it)).length + 1; if (out.length && size + s > WS_BUDGET) return [out, true]; out.push(toJson(it)); size += s; }
  return [out, false];
}
async function presenceOf(us) {
  if (!us.length) return {};
  const rows = await q('SELECT username,online,ts,ls FROM presence WHERE username IN $us;', { us });
  const out = {};
  for (const r of rows) out[r.username] = { online: !!r.online && r.ts > now() - CONN_TTL, ts: r.ts, ls: r.ls };
  return out;
}

// Сообщение устройства (из сокета или из HTTP /hub). Возвращает ответ этому устройству (или null).
async function handleMsg(me, m, connId) {
  switch (m.t) {
    case 'ping': return { t: 'pong' };
    case 'send': {
      if (!m.to || !m.payload) return null;
      if (m.to === me) { await bcast(me, { t: 'data', from: me, payload: m.payload }, connId); return null; }
      if (!validUser(m.to)) return null;
      await deliver(me, m.to, m.payload); return null;
    }
    case 'self': await bcast(me, { t: 'self', payload: m.payload }, connId); return null;
    case 'ml_post': {
      const { key, rec, chat } = m; if (!key || !rec || !chat) return null;
      await mlPut(me, key, { ...rec, chat, out: true, from: me }, connId, !m.retry);
      if (chat !== 'saved' && validUser(chat)) { await mlPut(chat, key, { ...(m.recPeer || rec), chat: me, out: false, from: me }); return { t: 'ml_ack', key }; }
      return null;
    }
    case 'ml_patch': {
      const { key, patch, chat } = m; if (!key || !patch) return null;
      await mlPatch(me, key, patch, connId);
      if (chat && chat !== 'saved' && !patch.gone && validUser(chat)) await mlPatch(chat, key, m.patchPeer || patch, null);
      return null;
    }
    case 'vault_put': {
      if (!m.key || typeof m.blob !== 'string' || m.blob.length > 1500000) return null;
      const t = now();
      await q('UPSERT INTO vault (u,k,payload,upd) VALUES ($u,$k,$b,$t);', { u: me, k: m.key, b: m.blob, t });
      await bcast(me, { t: 'vault', key: m.key, blob: m.blob, upd: t }, connId);
      return null;
    }
    case 'vault_sync': {
      const rows = await q('SELECT k,payload,upd FROM vault VIEW idx_upd WHERE u=$u AND upd>$s ORDER BY upd LIMIT 500;', { u: me, s: +m.since || 0 });
      const [items, capped] = fit(rows, r => ({ key: r.k, blob: r.payload, upd: r.upd }));
      return { t: 'vault_batch', items, more: capped || rows.length === 500 };
    }
    case 'ml_sync': {
      const since = +m.since || 0;
      if (since) {
        const rows = await q('SELECT k,rec,upd FROM ml VIEW idx_upd WHERE u=$u AND upd>$s ORDER BY upd LIMIT 500;', { u: me, s: since });
        const [items, capped] = fit(rows, r => ({ key: r.k, rec: JSON.parse(r.rec), upd: r.upd }));
        return { t: 'ml_batch', items, full: false, more: capped || rows.length === 500 };
      }
      // первый вход устройства: самые свежие, сколько влезет
      const rows = await q('SELECT k,rec,upd FROM ml WHERE u=$u ORDER BY k DESC LIMIT 400;', { u: me });
      const [items] = fit(rows, r => ({ key: r.k, rec: JSON.parse(r.rec), upd: r.upd }));
      return { t: 'ml_batch', items: items.reverse(), full: true };
    }
    case 'pres_q': {
      const us = (Array.isArray(m.u) ? m.u : []).map(x => String(x).toLowerCase()).filter(validUser).slice(0, 200);
      return { t: 'pres', presence: await presenceOf(us) };
    }
  }
  return null;
}
// Очередь, накопившаяся, пока все устройства были офлайн — отдаём первому подключившемуся приложению
async function drainQueue(u, connId) {
  const rows = await q('SELECT id,msg,ts FROM queue WHERE u=$u ORDER BY id LIMIT 500;', { u });
  if (!rows.length) return;
  const fresh = rows.filter(r => now() - r.ts < QUEUE_TTL).map(r => { try { return JSON.parse(r.msg); } catch (e) { return null; } }).filter(Boolean);
  let chunk = [], size = 0;
  for (const it of fresh) {
    const s = JSON.stringify(it).length;
    if (chunk.length && size + s > WS_BUDGET) { await wsSend(connId, { t: 'batch', items: chunk }); chunk = []; size = 0; }
    chunk.push(it); size += s;
  }
  if (chunk.length) await wsSend(connId, { t: 'batch', items: chunk });
  await q('DELETE FROM queue WHERE u=$u AND id<=$last;', { u, last: rows[rows.length - 1].id });
}

// ════════ WebSocket-события шлюза ════════
async function onWs(event) {
  const rc = event.requestContext || {}, hd = lowerHeaders(event.headers);
  const type = rc.eventType || hd['x-yc-apigateway-websocket-event-type'];
  const connId = rc.connectionId || hd['x-yc-apigateway-websocket-connection-id'];
  if (type === 'CONNECT') {
    const qs = event.queryStringParameters || {};
    const u = await sessionUser(qs.token || '');
    if (!u) return { statusCode: 401 };
    const bg = qs.bg === '1' ? 1 : 0;
    await q('UPSERT INTO conns (conn_id,u,dev,bg,at_ts,drained) VALUES ($c,$u,$d,$b,$t,0);', { c: connId, u, d: String(qs.dev || '').slice(0, 40), b: bg, t: now() });
    const ls = qs.ls === '0' ? '0' : '1';
    await q('UPSERT INTO hub_ls (u,ls) VALUES ($u,$l);', { u, l: ls });
    connDrop(u);
    if (!bg) await setPresence(u, true, ls);
    return { statusCode: 200 };
  }
  if (type === 'DISCONNECT') {
    const row = await one('SELECT u,bg FROM conns WHERE conn_id=$c;', { c: connId });
    await q('DELETE FROM conns WHERE conn_id=$c;', { c: connId });
    _connRow.delete(connId);
    if (row) connDrop(row.u);
    if (row && !row.bg) { const left = (await liveConns(row.u)).filter(c => !c.bg && c.conn_id !== connId); if (!left.length) await setPresence(row.u, false); }
    return { statusCode: 200 };
  }
  // MESSAGE
  let m; try { m = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '')); } catch (e) { return { statusCode: 200 }; }
  if (m && m.t === 'ping') return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '{"t":"pong"}' };   // пинг — без базы
  let row = _connRow.get(connId);
  if (!row || now() - row.t > 60000) {
    row = await one('SELECT u,bg,drained FROM conns WHERE conn_id=$c;', { c: connId });
    if (row) { row.t = now(); _connRow.set(connId, row); if (_connRow.size > 2000) _connRow.delete(_connRow.keys().next().value); }
  }
  if (!row) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '{"t":"reauth"}' };
  if (!row.bg && !row.drained) { row.drained = 1; await q('UPDATE conns SET drained=1 WHERE conn_id=$c;', { c: connId }); await drainQueue(row.u, connId); }
  const reply = await handleMsg(row.u, m, connId);
  return reply ? { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reply) } : { statusCode: 200 };
}

// ════════ Медиа: подписанные ссылки Object Storage (AWS SigV4) ════════
const enc3986 = s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const hmac = (k, s) => crypto.createHmac('sha256', k).update(s, 'utf8').digest();
function presign(method, key, expires = 3600) {
  const AK = process.env.S3_KEY_ID, SK = process.env.S3_SECRET;
  const d = new Date(), amz = d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), day = amz.slice(0, 8);
  const scope = `${day}/ru-central1/s3/aws4_request`;
  const uri = '/' + BUCKET + '/' + key.split('/').map(enc3986).join('/');
  const qp = { 'X-Amz-Algorithm': 'AWS4-HMAC-SHA256', 'X-Amz-Credential': `${AK}/${scope}`, 'X-Amz-Date': amz, 'X-Amz-Expires': String(expires), 'X-Amz-SignedHeaders': 'host' };
  const cq = Object.keys(qp).sort().map(k => enc3986(k) + '=' + enc3986(qp[k])).join('&');
  const creq = [method, uri, cq, 'host:' + S3_HOST + '\n', 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const sts = ['AWS4-HMAC-SHA256', amz, scope, crypto.createHash('sha256').update(creq).digest('hex')].join('\n');
  const kSign = hmac(hmac(hmac(hmac('AWS4' + SK, day), 'ru-central1'), 's3'), 'aws4_request');
  const sig = crypto.createHmac('sha256', kSign).update(sts).digest('hex');
  return `https://${S3_HOST}${uri}?${cq}&X-Amz-Signature=${sig}`;
}
const mediaUrl = id => `https://${S3_HOST}/${BUCKET}/m/${id}`;

// ════════ FCM (пуши Android) ════════
let _fcmTok = null, _fcmExp = 0;
const b64u = b => Buffer.from(b).toString('base64url');
async function fcmAccess(sa) {
  if (_fcmTok && now() < _fcmExp) return _fcmTok;
  const t = Math.floor(now() / 1000);
  const unsigned = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: t, exp: t + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + unsigned + '.' + b64u(sig) });
  const d = await r.json(); if (!d.access_token) throw new Error('fcm oauth');
  _fcmTok = d.access_token; _fcmExp = now() + (d.expires_in - 120) * 1000; return _fcmTok;
}
async function sendFcm(u, data, ttl = '3600s') {
  if (!process.env.FCM_SA) return 0;
  try {
    const sa = JSON.parse(process.env.FCM_SA);
    const rows = await q('SELECT device,tok FROM fcm_tokens WHERE username=$u;', { u });
    if (!rows.length) return 0;
    const tok = await fcmAccess(sa), str = {};
    for (const [k, v] of Object.entries(data)) str[k] = String(v ?? '');
    await Promise.all(rows.map(async row => {
      const r = await fetch('https://fcm.googleapis.com/v1/projects/' + sa.project_id + '/messages:send', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { token: row.tok, data: str, android: { priority: 'HIGH', ttl } } }) });
      if (!r.ok) { const t = await r.text(); if (r.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(t)) await q('DELETE FROM fcm_tokens WHERE username=$u AND device=$d;', { u, d: row.device }); }
    }));
  } catch (e) { console.error('fcm', e.message); }
}

// ════════ HTTP-маршруты ════════
const routes = {
  async 'POST /auth/login'(r, d) {
    const u = String(d.u || '').toLowerCase();
    if (!validUser(u) || !validHash(d.h)) return E('bad_request', 'Неверные данные');
    const locked = await failCheck(u); if (locked) return E('locked', 'Слишком много попыток — подожди ' + locked + ' мин.', 429);
    const user = await getUser(u);
    if (!user) {
      // нет у нас — пробуем перенести из Firebase (как делал старый сервер)
      const fb = await fbGet('auth/' + u);
      if (!fb) return E('not_found', 'Аккаунт не найден — зарегистрируйся!', 404);
      if (!fb.hash || fb.reset) {
        const t = now();
        await q('UPSERT INTO users (username,salt,verifier,created,pass_updated,migrated) VALUES ($u,$n1,$n2,$t,$t,1);', { u, n1: null, n2: null, t });
        return J({ ok: true, status: 'set_password', rt: await newReset(u) });
      }
      if (!same(fb.hash, d.h)) { await failAdd(u); return E('wrong_password', 'Неверный пароль', 401); }
      await setPassword(u, d.h, true); await fbPut('auth/' + u, { migrated: true, ts: now() }); await failClear(u);
      return J({ ok: true, status: 'ok', token: await newSession(u, d.device), migrated: true });
    }
    if (!user.verifier) return J({ ok: true, status: 'set_password', rt: await newReset(u) });
    if (!same(sha(user.salt + d.h), user.verifier)) { await failAdd(u); return E('wrong_password', 'Неверный пароль', 401); }
    await failClear(u);
    // двухэтапный вход: пароль верный — шлём код на почту
    const ue = await one('SELECT email,twofa FROM user_email WHERE username=$u;', { u });
    if (ue && ue.twofa && ue.email) {
      try { await codeIssue('login:' + u, ue.email, 'login'); } catch (e) { if (e.code !== 'wait') return mailErr(e); }
      return J({ ok: true, status: 'code', hint: maskEmail(ue.email) });
    }
    return J({ ok: true, status: 'ok', token: await newSession(u, d.device) });
  },
  async 'POST /auth/login/code'(r, d) {
    const u = String(d.u || '').toLowerCase();
    if (!validUser(u) || !validHash(d.h)) return E('bad_request', 'Неверные данные');
    const locked = await failCheck(u); if (locked) return E('locked', 'Слишком много попыток — подожди ' + locked + ' мин.', 429);
    const user = await getUser(u);
    if (!user || !user.verifier || !same(sha(user.salt + d.h), user.verifier)) { await failAdd(u); return E('wrong_password', 'Неверный пароль', 401); }
    const c = await codeCheck('login:' + u, d.code);
    if (!c.ok) return E('bad_code', c.err, 401);
    return J({ ok: true, status: 'ok', token: await newSession(u, d.device) });
  },
  // ── Почта аккаунта ──
  async 'GET /auth/email'(r) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const x = await one('SELECT email,twofa FROM user_email WHERE username=$u;', { u: r.user });
    return J({ ok: true, email: x?.email || null, twofa: !!x?.twofa, mail: !!mailer() });
  },
  async 'POST /auth/email/start'(r, d) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const email = String(d.email || '').trim().toLowerCase();
    if (!validEmail(email)) return E('bad_email', 'Проверь адрес почты');
    const own = await one('SELECT username FROM email_owner WHERE email=$e;', { e: email });
    if (own && own.username !== r.user) return E('taken', 'Эта почта уже привязана к другому аккаунту', 409);
    try { await codeIssue('bind:' + r.user, email, 'bind'); } catch (e) { return mailErr(e); }
    return J({ ok: true, hint: maskEmail(email) });
  },
  async 'POST /auth/email/confirm'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const c = await codeCheck('bind:' + u, d.code);
    if (!c.ok) return E('bad_code', c.err, 401);
    const old = await one('SELECT email,twofa FROM user_email WHERE username=$u;', { u });
    if (old && old.email && old.email !== c.email) await q('DELETE FROM email_owner WHERE email=$e;', { e: old.email });
    await q('UPSERT INTO user_email (username,email,twofa) VALUES ($u,$e,$t); UPSERT INTO email_owner (email,username) VALUES ($e,$u);', { u, e: c.email, t: old?.twofa || 0 });
    return J({ ok: true, email: c.email });
  },
  async 'POST /auth/email/remove'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const user = await getUser(u);
    if (user?.verifier && (!validHash(d.h) || !same(sha(user.salt + d.h), user.verifier))) return E('wrong_password', 'Неверный пароль', 401);
    const x = await one('SELECT email FROM user_email WHERE username=$u;', { u });
    if (x?.email) await q('DELETE FROM email_owner WHERE email=$e;', { e: x.email });
    await q('DELETE FROM user_email WHERE username=$u;', { u });
    return J({ ok: true });
  },
  async 'POST /auth/2fa'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const x = await one('SELECT email FROM user_email WHERE username=$u;', { u });
    if (!x?.email) return E('no_email', 'Сначала привяжи почту', 400);
    await q('UPDATE user_email SET twofa=$t WHERE username=$u;', { t: d.enable ? 1 : 0, u });
    return J({ ok: true, twofa: !!d.enable });
  },
  // ── Забыл пароль: код на привязанную почту ──
  async 'POST /auth/recover/start'(r, d) {
    const email = String(d.email || '').trim().toLowerCase();
    if (!validEmail(email)) return E('bad_email', 'Проверь адрес почты');
    const own = await one('SELECT username FROM email_owner WHERE email=$e;', { e: email });
    if (!own) return E('not_found', 'К этой почте не привязан ни один аккаунт', 404);
    try { await codeIssue('rec:' + email, email, 'rec'); } catch (e) { return mailErr(e); }
    return J({ ok: true, hint: maskEmail(email) });
  },
  async 'POST /auth/recover/confirm'(r, d) {
    const email = String(d.email || '').trim().toLowerCase();
    const c = await codeCheck('rec:' + email, d.code);
    if (!c.ok) return E('bad_code', c.err, 401);
    const own = await one('SELECT username FROM email_owner WHERE email=$e;', { e: email });
    if (!own) return E('not_found', 'Аккаунт не найден', 404);
    // вход сразу (код доказал владение почтой) + одноразовый токен смены пароля
    return J({ ok: true, username: own.username, token: await newSession(own.username, d.device), rt: await newReset(own.username) });
  },
  async 'POST /auth/register'(r, d) {
    const u = String(d.u || '').toLowerCase();
    if (!validUser(u) || !validHash(d.h)) return E('bad_request', 'Юзернейм: 3–20 символов, латиница, цифры и _');
    if (await getUser(u)) return E('taken', 'Юзернейм занят — выбери другой или войди', 409);
    if (await one('SELECT u FROM aliases WHERE alias=$a;', { a: u })) return E('taken', 'Юзернейм занят — выбери другой', 409);
    if (await fbGet('auth/' + u)) return E('taken', 'Юзернейм занят — выбери другой или войди', 409);
    await setPassword(u, d.h, false); await fbPut('auth/' + u, { migrated: true, ts: now() });
    return J({ ok: true, token: await newSession(u, d.device) });
  },
  async 'POST /auth/set-password'(r, d) {
    const u = String(d.u || '').toLowerCase();
    if (!validUser(u) || !validHash(d.h) || !d.rt) return E('bad_request', 'Неверные данные');
    const x = await one('SELECT username,expires FROM resets WHERE token_hash=$h;', { h: sha(d.rt) });
    if (!x || x.username !== u || x.expires < now()) return E('expired', 'Ссылка устарела — войди ещё раз', 401);
    await q('DELETE FROM resets WHERE username=$u;', { u });
    await setPassword(u, d.h, true);
    return J({ ok: true, token: await newSession(u, d.device) });
  },
  async 'POST /auth/change-password'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    if (!validHash(d.old) || !validHash(d.h)) return E('bad_request', 'Неверные данные');
    const user = await getUser(u);
    if (user?.verifier && !same(sha(user.salt + d.old), user.verifier)) return E('wrong_password', 'Неверный текущий пароль', 401);
    await setPassword(u, d.h, !!user?.migrated);
    await q('DELETE FROM sessions WHERE username=$u;', { u });
    return J({ ok: true, token: await newSession(u, d.device) });
  },
  async 'GET /auth/me'(r) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const x = await one('SELECT created FROM users WHERE username=$u;', { u: r.user });
    return J({ ok: true, username: r.user, admin: await isAdmin(r.user), created: x?.created || 0 });
  },
  // Дополнительные юзернеймы («а также @…»): бронь, чтобы их не заняли другие. До 5 штук.
  async 'POST /aliases'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const want = [...new Set((Array.isArray(d.aliases) ? d.aliases : []).map(x => String(x || '').toLowerCase().replace(/^@/, '')))].filter(Boolean);
    if (want.length > 5) return E('limit', 'Не больше 5 дополнительных юзернеймов');
    for (const a of want) {
      if (!validUser(a)) return E('bad', '@' + a + ': 3–20 символов, латиница, цифры и _');
      if (a === u) return E('bad', '@' + a + ' — это твой основной юзернейм');
      const own = await one('SELECT u FROM aliases WHERE alias=$a;', { a });
      if (own && own.u !== u) return E('taken', '@' + a + ' уже занят', 409);
      if (!own && (await getUser(a) || await fbGet('auth/' + a))) return E('taken', '@' + a + ' уже занят', 409);
    }
    const old = await q('SELECT alias FROM aliases VIEW idx_u WHERE u=$u;', { u });
    for (const o of old) if (!want.includes(o.alias)) await q('DELETE FROM aliases WHERE alias=$a;', { a: o.alias });
    for (const a of want) await q('UPSERT INTO aliases (alias,u,ts) VALUES ($a,$u,$t);', { a, u, t: now() });
    return J({ ok: true, aliases: want, removed: old.map(o => o.alias).filter(a => !want.includes(a)) });
  },
  async 'POST /auth/logout'(r) {
    const tok = bearer(r.hd);
    if (tok) {
      const h = sha(tok);
      const ses = await one('SELECT username,device FROM sessions WHERE token_hash=$h;', { h });
      await q('DELETE FROM sessions WHERE token_hash=$h;', { h });
      if (ses?.device) await q('DELETE FROM fcm_tokens WHERE username=$u AND device=$d;', { u: ses.username, d: ses.device });
    }
    return J({ ok: true });
  },
  // проверка SMTP без отправки письма: только код ошибки, без секретов
  // Диагностика доставки (по служебному ключу): соединения, журнал, устройства шифрования. Без содержимого.
  async 'GET /diag'(r) {
    const qs = r.qs;
    const K = process.env.DIAG_KEY;
    if (!K || !same(sha(String(qs.get('k') || '')), sha(K))) return E('not_found', 'Нет такого метода', 404);
    // проверка доступности внешнего адреса с сервера (только статус и время)
    if (qs.get('probe')) { const t0 = now(); try { const c = new AbortController(); setTimeout(() => c.abort(), 8000); const r = await fetch(qs.get('probe'), { headers: { Range: 'bytes=0-1000' }, signal: c.signal }); return J({ ok: true, status: r.status, type: r.headers.get('content-type'), ms: now() - t0 }); } catch (e) { return J({ ok: false, err: String(e.name || e.message), ms: now() - t0 }); } }
    const u = String(qs.get('u') || '').toLowerCase();
    if (!u) {
      const rows = await q('SELECT u, bg, at_ts, dev FROM conns;', {});
      return J({ ok: true, conns: rows.map(x => ({ u: x.u, bg: x.bg, agoMin: Math.round((now() - x.at_ts) / 60000), dev: x.dev })) });
    }
    const [conns, ml, dev, fcm, pres, q1] = await Promise.all([
      q('SELECT conn_id, bg, at_ts, drained, dev FROM conns VIEW idx_user WHERE u=$u;', { u }),
      q('SELECT k, rec, upd FROM ml VIEW idx_upd WHERE u=$u AND upd>$s ORDER BY upd DESC LIMIT 15;', { u, s: now() - 6 * 3600e3 }),
      q('SELECT device_id, updated FROM e2e_devices WHERE username=$u;', { u }),
      q('SELECT device, updated FROM fcm_tokens WHERE username=$u;', { u }),
      one('SELECT online, ts FROM presence WHERE username=$u;', { u }),
      q('SELECT id, ts FROM queue WHERE u=$u LIMIT 50;', { u }),
    ]);
    const recent = ml.map(x => { let o = {}; try { o = JSON.parse(x.rec); } catch (e) { } return { agoMin: Math.round((now() - x.upd) / 60000), chat: o.chat, out: !!o.out, k: o.k, e2eFor: o.e && o.e.c ? Object.keys(o.e.c) : null, del: !!(o.del || o.gone) }; });
    return J({ ok: true, u, conns: conns.map(x => ({ bg: x.bg, agoMin: Math.round((now() - x.at_ts) / 60000), drained: x.drained, dev: x.dev })),
      presence: pres, e2eDevices: dev.map(x => ({ d: x.device_id, updatedDaysAgo: Math.round((now() - x.updated) / 864e5) })),
      fcm: fcm.length, queue: q1.length, recent });
  },
  async 'GET /mail/check'() {
    const m = mailer(); if (!m) return J({ ok: false, err: 'mail_off' });
    try { await Promise.race([m.verify(), new Promise((_, j) => setTimeout(() => j(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), 15000))]); return J({ ok: true }); }
    catch (e) { return J({ ok: false, err: e.code || 'error', rc: e.responseCode || 0, msg: String(e.message).replace(/[w.+-]+@[w.-]+/g, '@').slice(0, 160) }); }
  },
  async 'GET /auth/exists'(r) {
    const u = String(r.qs.get('u') || '').toLowerCase();
    if (!validUser(u)) return J({ ok: true, exists: false });
    const al = await one('SELECT u FROM aliases WHERE alias=$a;', { a: u });
    return J({ ok: true, exists: !!al || !!(await getUser(u)) || !!(await fbGet('auth/' + u)), aliasOf: al ? al.u : undefined });
  },
  async 'GET /turn'(r) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const { TURN_URLS, TURN_USER, TURN_PASS } = process.env;
    if (TURN_URLS && TURN_USER && TURN_PASS) {
      const urls = TURN_URLS.split(',').map(x => x.trim()).filter(Boolean);
      // к каждому turn:host:port без транспорта добавляем TCP-вариант — там, где UDP режут
      for (const u of [...urls]) if (/^turn:[^?]+$/.test(u) && !urls.includes(u + '?transport=tcp')) urls.push(u + '?transport=tcp');
      return J({ ok: true, iceServers: [{ urls, username: TURN_USER, credential: TURN_PASS }], ttl: 86400 });
    }
    return E('no_turn', 'TURN не настроен', 503);
  },
  async 'GET /presence'(r) {
    const us = String(r.qs.get('u') || '').toLowerCase().split(',').filter(validUser).slice(0, 200);
    return J({ ok: true, presence: await presenceOf(us) });
  },
  async 'POST /profile'(r, d) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const data = JSON.stringify(d.data || {}); if (data.length > 900000) return E('too_large', 'Профиль слишком большой (аватарка?)', 413);
    await q('UPSERT INTO profiles (username,data,ts) VALUES ($u,$d,$t);', { u: r.user, d: data, t: now() });
    return J({ ok: true });
  },
  async 'GET /profiles'(r) {
    const us = String(r.qs.get('u') || '').toLowerCase().split(',').filter(validUser).slice(0, 100);
    if (!us.length) return J({ ok: true, profiles: {} });
    const rows = await q('SELECT username,data,ts FROM profiles WHERE username IN $us;', { us });
    const out = {}; for (const x of rows) { try { out[x.username] = { ...JSON.parse(x.data), ts: x.ts }; } catch (e) { } }
    return J({ ok: true, profiles: out });
  },
  async 'GET /me/sync'(r) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const x = await one('SELECT data,ts FROM user_sync WHERE username=$u;', { u: r.user });
    return J({ ok: true, data: x ? JSON.parse(x.data) : null, ts: x?.ts || 0 });
  },
  async 'POST /me/sync'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const data = JSON.stringify(d.data || {}); if (data.length > 900000) return E('too_large', 'Слишком большой профиль', 413);
    const ts = +d.ts || now();
    const x = await one('SELECT ts FROM user_sync WHERE username=$u;', { u });
    if (!x || ts > x.ts) await q('UPSERT INTO user_sync (username,data,ts) VALUES ($u,$d,$t);', { u, d: data, t: ts });
    await bcast(u, { t: 'self', payload: { type: 'profile_sync', data: d.data, ts, dev: d.dev || '' } });
    return J({ ok: true });
  },
  async 'POST /e2e/register'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const dev = +d.deviceId;
    if (!Number.isInteger(dev) || dev < 1 || !d.ik || !d.ikd || !d.spk?.pub || !d.spk?.sig) return E('bad_request', 'Неверные ключи');
    const cnt = await one('SELECT COUNT(*) AS n FROM e2e_devices WHERE username=$u AND device_id<>$d;', { u, d: dev });
    if ((cnt?.n || 0) >= 20) return E('too_many_devices', 'Слишком много устройств', 409);
    const ex = await one('SELECT nk,nks FROM e2e_devices WHERE username=$u AND device_id=$d;', { u, d: dev });
    await q('UPSERT INTO e2e_devices (username,device_id,ik,ikd,spk_id,spk_pub,spk_sig,updated,nk,nks) VALUES ($u,$d,$ik,$ikd,$si,$sp,$ss,$t,$nk,$nks);',
      { u, d: dev, ik: String(d.ik), ikd: String(d.ikd), si: +d.spk.id, sp: String(d.spk.pub), ss: String(d.spk.sig), t: now(), nk: ex?.nk ?? null, nks: ex?.nks ?? null });
    await putPrekeys(u, dev, d.opks); return J({ ok: true });
  },
  async 'POST /e2e/prekeys'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    await putPrekeys(u, +d.deviceId, d.opks);
    if (d.spk?.pub) await q('UPDATE e2e_devices SET spk_id=$si,spk_pub=$sp,spk_sig=$ss,updated=$t WHERE username=$u AND device_id=$d;', { si: +d.spk.id, sp: String(d.spk.pub), ss: String(d.spk.sig), t: now(), u, d: +d.deviceId });
    return J({ ok: true });
  },
  async 'GET /e2e/count'(r) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const dev = +r.qs.get('d');
    const [c, reg] = await qAll('SELECT COUNT(*) AS n FROM e2e_prekeys WHERE username=$u AND device_id=$d; SELECT device_id FROM e2e_devices WHERE username=$u AND device_id=$d;', { u, d: dev });
    return J({ ok: true, count: c[0]?.n || 0, registered: !!reg.length });
  },
  async 'POST /e2e/nk'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    if (!d.nk || !d.sig || String(d.nk).length > 64 || String(d.sig).length > 128) return E('bad_request', 'Неверный ключ');
    await q('UPDATE e2e_devices SET nk=$nk,nks=$ns WHERE username=$u AND device_id=$d;', { nk: String(d.nk), ns: String(d.sig), u, d: +d.deviceId });
    return J({ ok: true });
  },
  async 'GET /e2e/devices'(r) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const us = String(r.qs.get('u') || '').toLowerCase().split(',').filter(validUser).slice(0, 20);
    if (!us.length) return J({ ok: true, devices: {} });
    const rows = await q('SELECT username,device_id,ik,nk,nks FROM e2e_devices WHERE username IN $us;', { us });
    const out = {}; for (const x of us) out[x] = [];
    for (const x of rows) out[x.username].push(x.nk ? { d: x.device_id, ik: x.ik, nk: x.nk, nks: x.nks } : { d: x.device_id, ik: x.ik });
    return J({ ok: true, devices: out });
  },
  async 'GET /e2e/bundle'(r) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const u = String(r.qs.get('u') || '').toLowerCase(), dev = +r.qs.get('d');
    const x = await one('SELECT * FROM e2e_devices WHERE username=$u AND device_id=$d;', { u, d: dev });
    if (!x) return E('not_found', 'Нет такого устройства', 404);
    // одноразовый предключ: выдаём и сразу удаляем
    const opk = await one('SELECT key_id,pub FROM e2e_prekeys WHERE username=$u AND device_id=$d LIMIT 1;', { u, d: dev });
    if (opk) await q('DELETE FROM e2e_prekeys WHERE username=$u AND device_id=$d AND key_id=$k;', { u, d: dev, k: opk.key_id });
    return J({ ok: true, bundle: { ik: x.ik, ikd: x.ikd, spk: { id: x.spk_id, pub: x.spk_pub, sig: x.spk_sig }, opk: opk ? { id: opk.key_id, pub: opk.pub } : null } });
  },
  async 'POST /e2e/remove'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const dev = +d.deviceId;
    await q('DELETE FROM e2e_devices WHERE username=$u AND device_id=$d; DELETE FROM e2e_prekeys WHERE username=$u AND device_id=$d;', { u, d: dev });
    return J({ ok: true });
  },
  async 'GET /e2e/vaultkey'(r) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    const x = await one('SELECT wrapped,ts FROM vault_keys WHERE username=$u;', { u: r.user });
    return J({ ok: true, wrapped: x?.wrapped || null, ts: x?.ts || 0 });
  },
  async 'POST /e2e/vaultkey'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    if (typeof d.wrapped !== 'string' || d.wrapped.length > 2000) return E('bad_request', 'Неверные данные');
    const x = await one('SELECT wrapped FROM vault_keys WHERE username=$u;', { u });
    if (d.replace || !x) { await q('UPSERT INTO vault_keys (username,wrapped,ts) VALUES ($u,$w,$t);', { u, w: d.wrapped, t: now() }); return J({ ok: true, wrapped: d.wrapped }); }
    return J({ ok: true, wrapped: x.wrapped });
  },
  async 'POST /push/fcm'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    if (typeof d.token !== 'string' || d.token.length < 20 || d.token.length > 4096) return E('bad_request', 'Неверный токен');
    await q('UPSERT INTO fcm_tokens (username,device,tok,updated) VALUES ($u,$d,$k,$t);', { u, d: String(d.dev || '').slice(0, 40) || 'android', k: d.token, t: now() });
    return J({ ok: true });
  },
  async 'POST /signal'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const to = String(d.to || '').toLowerCase();
    if (!validUser(to) || !d.payload || typeof d.payload.type !== 'string') return E('bad_request', 'Неверные данные');
    if (!['call_reject', 'call_cancel', 'call_end', 'read'].includes(d.payload.type)) return E('forbidden', 'Нельзя', 403);
    await deliver(u, to, d.payload); return J({ ok: true });
  },
  // большие сообщения (> лимита сокета) — тем же протоколом, но по HTTP
  async 'POST /hub'(r, d) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    if (!d.m || typeof d.m.t !== 'string') return E('bad_request', 'Неверные данные');
    return J({ ok: true, reply: await handleMsg(r.user, d.m, null) });
  },
  // медиа: выдаём ссылку, по которой устройство само кладёт файл в хранилище
  async 'POST /media/presign'(r, d) {
    if (!r.user) return E('unauthorized', 'Войди заново', 401);
    if (+d.size > MEDIA_MAX) return E('too_large', 'Файл больше 100 МБ', 413);
    const id = rnd(18);
    return J({ ok: true, id, put: presign('PUT', 'm/' + id), get: mediaUrl(id) });
  },
  // ── Музыка профиля: свои треки. Лежат в pm/ — без автоудаления (правило 14 дней только для m/).
  // До PM_MAX треков по PM_SIZE на человека; обложка — отдельным файлом рядом.
  // ── Кошелёк мини-слоников ──
  async 'GET /wallet'(r) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const [w, log] = await qAll('SELECT bal FROM wallet WHERE u=$u; SELECT id,delta,kind,peer,note,ts FROM wallet_log WHERE u=$u ORDER BY id DESC LIMIT 60;', { u });
    return J({ ok: true, bal: w[0]?.bal || 0, log, gifts: GIFTS });
  },
  // Подарить: списываем мини-слоников, подарок появляется у получателя в профиле
  async 'POST /gift/send'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const to = String(d.to || '').toLowerCase(), g = GIFTS[d.gift];
    if (!validUser(to) || to === u) return E('bad', 'Неверный получатель');
    if (!g) return E('bad', 'Такого подарка нет');
    // получатель: аккаунт на сервере, старый аккаунт Firebase или хотя бы опубликованный профиль
    if (!(await getUser(to)) && !(await fbGet('auth/' + to)) && !(await fbGet('profiles/' + to + '/username'))) return E('not_found', 'Пользователь не найден', 404);
    const text = String(d.text || '').slice(0, 200);
    const w = await one('SELECT bal FROM wallet WHERE u=$u;', { u });
    const bal = w?.bal || 0;
    if (bal < g.price) return E('no_money', 'Не хватает мини-слоников', 402);
    const t = now(), id = String(t).padStart(15, '0') + rnd(4);
    await q('UPSERT INTO wallet (u,bal,ts) VALUES ($u,$b,$t);', { u, b: bal - g.price, t });
    await q('UPSERT INTO wallet_log (u,id,delta,kind,peer,note,ts) VALUES ($u,$i,$dl,$k,$p,$n,$t);', { u, i: id, dl: -g.price, k: 'gift_out', p: to, n: g.title, t });
    await q('UPSERT INTO gifts (to_u,id,from_u,gift,text,price,ts,hidden) VALUES ($to,$i,$f,$g,$tx,$pr,$t,0);', { to, i: id, f: u, g: d.gift, tx: text, pr: g.price, t });
    await deliver(u, to, { type: 'gift_new', id, gift: d.gift, from: u });
    return J({ ok: true, id, bal: bal - g.price, price: g.price });
  },
  // Подарки человека — видны всем (кроме скрытых владельцем)
  async 'GET /gifts'(r) {
    const u = String(r.qs.get('u') || '').toLowerCase(); if (!validUser(u)) return E('bad', 'Неверный юзернейм');
    const rows = await q('SELECT id,from_u,gift,text,price,ts,hidden FROM gifts WHERE to_u=$u ORDER BY id DESC LIMIT 100;', { u });
    const mine = r.user === u;
    return J({ ok: true, gifts: rows.filter(x => mine || !x.hidden).map(x => ({ id: x.id, from: x.from_u, gift: x.gift, text: x.text, price: x.price, ts: x.ts, hidden: !!x.hidden })) });
  },
  async 'POST /gift/hide'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const x = await one('SELECT id FROM gifts WHERE to_u=$u AND id=$i;', { u, i: String(d.id || '') });
    if (!x) return E('not_found', 'Подарок не найден', 404);
    await q('UPDATE gifts SET hidden=$h WHERE to_u=$u AND id=$i;', { h: d.hidden ? 1 : 0, u, i: x.id });
    return J({ ok: true });
  },
  // Начислить мини-слоников (админ; пока нет оплаты)
  async 'POST /admin/wallet'(r, d) {
    const a = r.user; if (!a || !(await isAdmin(a))) return E('forbidden', 'Только для админов', 403);
    const u = String(d.u || '').toLowerCase().replace(/^@/, ''), delta = Math.trunc(+d.delta || 0);
    if (!validUser(u) || !delta || Math.abs(delta) > 1e6) return E('bad', 'Неверные данные');
    const w = await one('SELECT bal FROM wallet WHERE u=$u;', { u }), t = now();
    const bal = Math.max(0, (w?.bal || 0) + delta);
    await q('UPSERT INTO wallet (u,bal,ts) VALUES ($u,$b,$t);', { u, b: bal, t });
    await q('UPSERT INTO wallet_log (u,id,delta,kind,peer,note,ts) VALUES ($u,$i,$dl,$k,$p,$n,$t);', { u, i: String(t).padStart(15, '0') + rnd(4), dl: delta, k: 'admin', p: a, n: 'Начисление', t });
    return J({ ok: true, bal });
  },
  async 'POST /pmusic/presign'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    if (!(+d.size > 0) || +d.size > PM_SIZE) return E('too_large', 'Трек больше 15 МБ', 413);
    if (!/^audio\//.test(String(d.mime || ''))) return E('bad', 'Нужен аудиофайл (mp3, m4a, ogg…)');
    const have = await q('SELECT id FROM pmusic WHERE u=$u;', { u });
    if (have.length >= PM_MAX) return E('limit', 'Не больше ' + PM_MAX + ' своих треков — удали какой-нибудь', 409);
    const id = rnd(14), key = 'pm/' + u + '/' + id;
    await q('UPSERT INTO pmusic (u,id,size,ts) VALUES ($u,$i,$s,$t);', { u, i: id, s: +d.size, t: now() });
    return J({ ok: true, id, put: presign('PUT', key), url: `https://${S3_HOST}/${BUCKET}/${key}`,
      putCover: presign('PUT', key + '.jpg'), cover: `https://${S3_HOST}/${BUCKET}/${key}.jpg` });
  },
  async 'POST /pmusic/delete'(r, d) {
    const u = r.user; if (!u) return E('unauthorized', 'Войди заново', 401);
    const id = String(d.id || ''); if (!/^[A-Za-z0-9_-]{8,30}$/.test(id)) return E('bad', 'Неверный трек');
    const x = await one('SELECT id FROM pmusic WHERE u=$u AND id=$i;', { u, i: id });
    if (x) {
      for (const k of ['pm/' + u + '/' + id, 'pm/' + u + '/' + id + '.jpg']) { try { await fetch(presign('DELETE', k), { method: 'DELETE' }); } catch (e) { } }
      await q('DELETE FROM pmusic WHERE u=$u AND id=$i;', { u, i: id });
    }
    return J({ ok: true });
  },
  async 'POST /admin/reset-password'(r, d) {
    const a = r.user; if (!a || !(await isAdmin(a))) return E('forbidden', 'Только для админов', 403);
    const u = String(d.u || '').toLowerCase(); if (!validUser(u)) return E('bad_request', 'Неверный юзернейм');
    const ex = await one('SELECT created FROM users WHERE username=$u;', { u }), t = now();
    await q('UPSERT INTO users (username,salt,verifier,created,pass_updated,migrated) VALUES ($u,$n1,$n2,$c,$t,1);', { u, n1: null, n2: null, c: ex ? ex.created : t, t });
    await q('DELETE FROM sessions WHERE username=$u; DELETE FROM vault_keys WHERE username=$u;', { u });
    return J({ ok: true });
  },
};

function lowerHeaders(h) { const o = {}; for (const [k, v] of Object.entries(h || {})) o[k.toLowerCase()] = Array.isArray(v) ? v[0] : v; return o; }

async function onHttp(event) {
  const method = (event.httpMethod || 'GET').toUpperCase();
  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  const qsp = event.queryStringParameters || {};
  // маршрут: ?p=/auth/login?u=… (прямой вызов функции) или путь через шлюз
  let full = qsp.p || event.path || event.url || '/';
  if (!qsp.p && event.params && event.params.proxy) full = '/' + event.params.proxy;
  const [path, rawQs] = String(full).split('?');
  const qs = new URLSearchParams(rawQs || '');
  if (!qsp.p) for (const [k, v] of Object.entries(qsp)) if (!qs.has(k)) qs.set(k, v);
  if (path === '/' || path === '/api') return J({ ok: true, service: 'slon-yc', version: 1 });
  // старые ссылки на медиа → в хранилище
  if (method === 'GET' && path.startsWith('/media/')) {
    const id = path.slice(7);
    if (!/^[A-Za-z0-9_-]{16,40}$/.test(id)) return E('not_found', 'Нет файла', 404);
    return { statusCode: 302, headers: { ...CORS, Location: mediaUrl(id) }, body: '' };
  }
  const h = routes[method + ' ' + path];
  if (!h) return E('not_found', 'Нет такого метода', 404);
  let d = {};
  if (method === 'POST') {
    try { const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || ''); d = raw ? JSON.parse(raw) : {}; }
    catch (e) { return E('bad_json', 'Неверный JSON'); }
  }
  const hd = lowerHeaders(event.headers);
  const user = await sessionUser(bearer(hd));
  return h({ hd, qs, user }, d);
}

module.exports.handler = async (event, context) => {
  IAM = context?.token?.access_token || IAM;
  setToken(IAM);                                   // тот же токен сервисного аккаунта — и для базы
  try {
    const rc = event.requestContext || {};
    const et = rc.eventType || lowerHeaders(event.headers)['x-yc-apigateway-websocket-event-type'];
    if (et === 'CONNECT' || et === 'MESSAGE' || et === 'DISCONNECT') return await onWs(event);
    return await onHttp(event);
  } catch (e) {
    console.error(e && e.stack || e);
    if (process.env.SLON_DEBUG) return J({ ok: false, error: 'server', message: 'Ошибка сервера', detail: String(e && e.message || e).slice(0, 600) }, 500);
    return E('server', 'Ошибка сервера', 500);
  }
};
module.exports._test = { handleMsg, presign };
