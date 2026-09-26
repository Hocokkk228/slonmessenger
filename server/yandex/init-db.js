// Создать таблицы SLON в YDB (повтор безопасен — существующие пропускаются).
// Локально: YDB_TOKEN=$(yc iam create-token) YDB_DATABASE=... node init-db.js
const fs = require('fs'), path = require('path');
const { createTableFromYql, q, driver } = require('./db');
(async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.yql'), 'utf8')
    .split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  for (const st of sql.split(';').map(s => s.trim()).filter(Boolean)) {
    const name = (st.match(/CREATE TABLE\s+(\w+)/) || [])[1];
    try { await createTableFromYql(st); console.log('создана', name); }
    catch (e) { console.log(/exist|already/i.test(String(e.message)) ? 'уже есть ' + name : 'ОШИБКА ' + name + ': ' + String(e.message).slice(0, 200)); }
  }
  const r = await q('SELECT COUNT(*) AS n FROM users;');
  console.log('проверка чтения: users =', r[0].n);
  (await driver()).destroy(); process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
