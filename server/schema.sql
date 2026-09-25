-- SLON API — схема базы D1

-- Аккаунты. Пароль хранится только как verifier = SHA-256(salt + clientHash),
-- где clientHash = SHA-256(пароль) считает клиент (как было в Firebase-версии).
CREATE TABLE IF NOT EXISTS users (
  username     TEXT PRIMARY KEY,
  salt         TEXT,
  verifier     TEXT,              -- NULL → пароль сброшен админом, ждём новый
  created      INTEGER NOT NULL,
  pass_updated INTEGER NOT NULL,
  migrated     INTEGER NOT NULL DEFAULT 0   -- 1 = перенесён из Firebase
);

-- Сессии: храним только хеш токена
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  device     TEXT,
  created    INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(username);

-- Одноразовые токены установки пароля после сброса (15 минут)
CREATE TABLE IF NOT EXISTS resets (
  token_hash TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  expires    INTEGER NOT NULL
);

-- Защита от перебора паролей
CREATE TABLE IF NOT EXISTS login_fails (
  username TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  until    INTEGER NOT NULL
);

-- Админы (плюс встроенные в код)
CREATE TABLE IF NOT EXISTS admins (
  username TEXT PRIMARY KEY
);

-- Статусы «в сети» (ведёт хаб аккаунта)
CREATE TABLE IF NOT EXISTS presence (
  username TEXT PRIMARY KEY,
  online   INTEGER NOT NULL,
  ts       INTEGER NOT NULL,
  ls       INTEGER NOT NULL      -- «был(а) в …»; 0 = скрыто настройками приватности
);
-- Публичные профили
CREATE TABLE IF NOT EXISTS profiles (
  username TEXT PRIMARY KEY,
  data     TEXT NOT NULL,
  ts       INTEGER NOT NULL
);
-- Синк своего профиля между своими устройствами
CREATE TABLE IF NOT EXISTS user_sync (
  username TEXT PRIMARY KEY,
  data     TEXT NOT NULL,
  ts       INTEGER NOT NULL
);

-- Сквозное шифрование: публичные ключи устройств
CREATE TABLE IF NOT EXISTS e2e_devices (
  username  TEXT NOT NULL,
  device_id INTEGER NOT NULL,
  ik        TEXT NOT NULL,     -- Ed25519 identity (подпись)
  ikd       TEXT NOT NULL,     -- X25519 identity (DH)
  spk_id    INTEGER NOT NULL,
  spk_pub   TEXT NOT NULL,
  spk_sig   TEXT NOT NULL,
  updated   INTEGER NOT NULL,
  PRIMARY KEY(username,device_id)
);
-- Одноразовые предключи (каждый выдаётся один раз)
CREATE TABLE IF NOT EXISTS e2e_prekeys (
  username  TEXT NOT NULL,
  device_id INTEGER NOT NULL,
  key_id    INTEGER NOT NULL,
  pub       TEXT NOT NULL,
  PRIMARY KEY(username,device_id,key_id)
);
-- Ключ бэкапа истории, запечатанный паролем (сервер не может открыть)
CREATE TABLE IF NOT EXISTS vault_keys (
  username TEXT PRIMARY KEY,
  wrapped  TEXT NOT NULL,
  ts       INTEGER NOT NULL
);

-- FCM-токены Android-устройств (разбудить приложение, как Telegram)
CREATE TABLE IF NOT EXISTS fcm_tokens (
  username TEXT NOT NULL,
  device   TEXT NOT NULL,
  token    TEXT NOT NULL,
  updated  INTEGER NOT NULL,
  PRIMARY KEY(username,device)
);
