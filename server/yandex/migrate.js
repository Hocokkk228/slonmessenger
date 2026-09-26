// Перенос SLON с Cloudflare (D1 + хабы + медиа) в Yandex Cloud (YDB + Object Storage).
// Повторный запуск безопасен (UPSERT). Секреты берутся из ~/.slon и не печатаются.
// Запуск (из server/yandex): см. README / команду в чате — нужны YDB_TOKEN, YDB_DATABASE, прокси.
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const { q } = require('./db');
const CF = 'https://slon-api.hopasup789.workers.dev';
const HOME = process.env.USERPROFILE;
const DUMP_KEY = fs.readFileSync(path.join(HOME, '.slon', 'cf-dump.key'), 'utf8').trim();
const s3 = JSON.parse(fs.readFileSync(path.join(HOME, '.slon', 'yc-s3.json'), 'utf8'));
process.env.S3_KEY_ID = s3.access_key.key_id; process.env.S3_SECRET = s3.secret;
process.env.BUCKET = process.env.BUCKET || 'slon-media-86ea6642';
const { presign } = require('./index')._test;
const ONLY = process.argv.includes('--no-media') ? 'nomedia' : '';

// ── D1 через wrangler ──
function d1(sql) {
  const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', 'wrangler@4', 'd1', 'execute', 'slon-db', '--remote', '--json', '--command', process.platform === 'win32' ? '"' + sql + '"' : sql],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 512e6, shell: process.platform === 'win32' });
  const out = r.stdout || '';
  const i = out.indexOf('[');
  if (i < 0) throw new Error('d1: ' + (r.stderr || out).slice(0, 300));
  return JSON.parse(out.slice(i))[0].results || [];
}
// ── хабы ──
async function hub(u, part, after, limit) {
  const url = CF + '/admin/dump-hub?u=' + u + '&part=' + part + (after ? '&after=' + encodeURIComponent(after) : '') + (limit ? '&limit=' + limit : '');
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(url, { headers: { 'X-Dump-Key': DUMP_KEY } }); const d = await r.json(); if (d.ok) return d.rows; throw new Error(d.message); }
    catch (e) { if (i === 3) throw e; await new Promise(r => setTimeout(r, 1500)); }
  }
}
// ── запись пачками ──
async function upsert(table, spec, rows, batch = 100) {
  const cols = Object.keys(spec);
  for (let i = 0; i < rows.length; i += batch) {
    const part = rows.slice(i, i + batch), p = {}, vals = [];
    part.forEach((row, ri) => {
      const ph = cols.map((c, ci) => {
        const t = spec[c]; let v = row[c];
        if (t === 'I') v = Number.isFinite(+v) ? Math.trunc(+v) : 0;
        else if (t === 'U') v = v == null ? '' : String(v);
        else v = v == null ? null : String(v);                 // 'U?'
        p['p' + ri + '_' + ci] = v; return '$p' + ri + '_' + ci;
      });
      vals.push('(' + ph.join(',') + ')');
    });
    await q(`UPSERT INTO ${table} (${cols.join(',')}) VALUES ${vals.join(',')};`, p);
  }
  return rows.length;
}
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

(async () => {
  // 1) таблицы D1
  const T = {
    users: { username: 'U', salt: 'U?', verifier: 'U?', created: 'I', pass_updated: 'I', migrated: 'I' },
    sessions: { token_hash: 'U', username: 'U', device: 'U?', created: 'I', last_seen: 'I' },
    admins: { username: 'U' },
    profiles: { username: 'U', data: 'U', ts: 'I' },
    user_sync: { username: 'U', data: 'U', ts: 'I' },
    e2e_devices: { username: 'U', device_id: 'I', ik: 'U', ikd: 'U', spk_id: 'I', spk_pub: 'U', spk_sig: 'U', updated: 'I', nk: 'U?', nks: 'U?' },
    e2e_prekeys: { username: 'U', device_id: 'I', key_id: 'I', pub: 'U' },
    vault_keys: { username: 'U', wrapped: 'U', ts: 'I' },
  };
  for (const [t, spec] of Object.entries(T)) {
    const rows = d1('SELECT * FROM ' + t);
    log(t, await upsert(t, spec, rows, t === 'profiles' || t === 'user_sync' ? 5 : 100));
  }
  const fcm = d1('SELECT * FROM fcm_tokens').map(r => ({ ...r, tok: r.token }));
  log('fcm_tokens', await upsert('fcm_tokens', { username: 'U', device: 'U', tok: 'U', updated: 'I' }, fcm));
  const pres = d1('SELECT * FROM presence').map(r => ({ ...r, online: 0 }));
  log('presence', await upsert('presence', { username: 'U', online: 'I', ts: 'I', ls: 'I' }, pres));

  // 2) хабы: журнал, сейф, очередь, «был(а)»
  const users = d1('SELECT username FROM users').map(r => r.username);
  let mlN = 0, vN = 0, qN = 0;
  for (const u of users) {
    let after = '';
    for (;;) { const rows = await hub(u, 'ml', after, 1000); if (!rows.length) break;
      mlN += await upsert('ml', { u: 'U', k: 'U', rec: 'U', upd: 'I' }, rows.map(r => ({ u, k: r.key, rec: r.rec, upd: r.upd })), 100);
      after = rows[rows.length - 1].key; if (rows.length < 1000) break; }
    after = '';
    for (;;) { const rows = await hub(u, 'vault', after, 50); if (!rows.length) break;
      vN += await upsert('vault', { u: 'U', k: 'U', payload: 'U', upd: 'I' }, rows.map(r => ({ u, k: r.key, payload: r.blob, upd: r.upd })), 5);
      after = rows[rows.length - 1].key; if (rows.length < 50) break; }
    const qr = await hub(u, 'queue');
    qN += await upsert('queue', { u: 'U', id: 'U', msg: 'U', ts: 'I' }, qr.map(r => ({ u, id: String(r.ts).padStart(15, '0') + 'm' + r.id, msg: r.msg, ts: r.ts })));
    const kv = await hub(u, 'kv'); const ls = kv.find(x => x.k === 'ls');
    if (ls) await upsert('hub_ls', { u: 'U', ls: 'U' }, [{ u, ls: ls.v }]);
  }
  log('хабы:', users.length, 'юзеров | журнал', mlN, '| сейф', vN, '| очередь', qN);

  // 3) медиа → хранилище
  if (ONLY === 'nomedia') { log('медиа пропущены'); process.exit(0); }
  let mOk = 0, mBad = 0, bytes = 0;
  for (let shard = 0; shard < 8; shard++) {
    let after = '';
    for (;;) {
      const r = await fetch(CF + '/admin/media-ids?shard=' + shard + (after ? '&after=' + after : ''), { headers: { 'X-Dump-Key': DUMP_KEY } }).then(r => r.json());
      const rows = r.rows || []; if (!rows.length) break;
      for (const m of rows) {
        try {
          const head = await fetch('https://storage.yandexcloud.net/' + process.env.BUCKET + '/m/' + m.id, { method: 'HEAD' });
          if (head.ok) { mOk++; continue; }                       // уже перенесён
          const src = await fetch(CF + '/media/' + m.id); if (!src.ok) throw new Error('cf ' + src.status);
          const buf = Buffer.from(await src.arrayBuffer());
          const put = await fetch(presign('PUT', 'm/' + m.id), { method: 'PUT', headers: { 'Content-Type': m.mime || 'application/octet-stream' }, body: buf });
          if (!put.ok) throw new Error('put ' + put.status);
          mOk++; bytes += buf.length;
        } catch (e) { mBad++; console.log('медиа', m.id, e.message); }
      }
      after = rows[rows.length - 1].id; if (rows.length < 1000) break;
    }
    log('шард', shard, '| медиа', mOk, 'ошибок', mBad, '|', Math.round(bytes / 1e6), 'МБ');
  }
  log('ГОТОВО');
  process.exit(0);
})().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
