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
