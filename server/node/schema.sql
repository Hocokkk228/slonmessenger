-- SLON — схема автономного сервера (SQLite). Один файл базы вместо D1 + Durable Objects.
-- Всё то же, что на Cloudflare, но с колонкой user там, где раньше объект был «на юзернейм».

CREATE TABLE IF NOT EXISTS users (
  username     TEXT PRIMARY KEY,
  salt         TEXT,
  verifier     TEXT,
  created      INTEGER NOT NULL,
  pass_updated INTEGER NOT NULL,
  migrated     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  device     TEXT,
  created    INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(username);
CREATE TABLE IF NOT EXISTS resets (
  token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_fails (
  username TEXT PRIMARY KEY, count INTEGER NOT NULL, until INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS admins ( username TEXT PRIMARY KEY );
CREATE TABLE IF NOT EXISTS presence (
  username TEXT PRIMARY KEY, online INTEGER NOT NULL, ts INTEGER NOT NULL, ls INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
  username TEXT PRIMARY KEY, data TEXT NOT NULL, ts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS user_sync (
  username TEXT PRIMARY KEY, data TEXT NOT NULL, ts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS e2e_devices (
  username TEXT NOT NULL, device_id INTEGER NOT NULL,
  ik TEXT NOT NULL, ikd TEXT NOT NULL,
  spk_id INTEGER NOT NULL, spk_pub TEXT NOT NULL, spk_sig TEXT NOT NULL,
  updated INTEGER NOT NULL, nk TEXT, nks TEXT,
  PRIMARY KEY(username,device_id)
);
CREATE TABLE IF NOT EXISTS e2e_prekeys (
  username TEXT NOT NULL, device_id INTEGER NOT NULL, key_id INTEGER NOT NULL, pub TEXT NOT NULL,
  PRIMARY KEY(username,device_id,key_id)
);
CREATE TABLE IF NOT EXISTS vault_keys (
  username TEXT PRIMARY KEY, wrapped TEXT NOT NULL, ts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS fcm_tokens (
  username TEXT NOT NULL, device TEXT NOT NULL, token TEXT NOT NULL, updated INTEGER NOT NULL,
  PRIMARY KEY(username,device)
);

-- ── Хаб аккаунта: журнал, очередь офлайна, сейф истории (раньше — Durable Object) ──
CREATE TABLE IF NOT EXISTS ml (
  user TEXT NOT NULL, key TEXT NOT NULL, rec TEXT NOT NULL, upd INTEGER NOT NULL,
  PRIMARY KEY(user,key)
);
CREATE INDEX IF NOT EXISTS ml_user_upd ON ml(user,upd);
CREATE TABLE IF NOT EXISTS queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, msg TEXT NOT NULL, ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS queue_user ON queue(user,id);
CREATE TABLE IF NOT EXISTS vault (
  user TEXT NOT NULL, key TEXT NOT NULL, blob TEXT NOT NULL, upd INTEGER NOT NULL,
  PRIMARY KEY(user,key)
);
CREATE INDEX IF NOT EXISTS vault_user_upd ON vault(user,upd);
CREATE TABLE IF NOT EXISTS hub_ls ( user TEXT PRIMARY KEY, ls TEXT NOT NULL );

-- ── Медиа: раньше Durable Object с кусками; тут — один blob на файл ──
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY, mime TEXT, name TEXT, size INTEGER, owner TEXT, created INTEGER, data BLOB NOT NULL
);
