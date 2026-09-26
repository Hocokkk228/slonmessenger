// ── YDB (серверлесс) для функции SLON — через Table API (Query API серверлесс-база не отдаёт) ──
// q(sql, params) — запрос с автоматическими DECLARE; строки приходят обычными объектами
// с исходными именами колонок, Int64 приводится к Number.
const { Driver, TokenAuthService, TypedValues, Types,
  TableDescription, Column, TableIndex } = require('ydb-sdk');
// конвертер значений лежит во внутреннем модуле пакета (не экспортирован) — берём по абсолютному пути
const { convertYdbValueToNative } = require(require('path').join(require('path').dirname(require.resolve('ydb-sdk')), 'types.js'));

const ENDPOINT = process.env.YDB_ENDPOINT || 'grpcs://ydb.serverless.yandexcloud.net:2135';
const DATABASE = process.env.YDB_DATABASE;

// Авторизация — IAM-токеном. В функции он приходит свежим в каждом вызове (context.token),
// локально — из YDB_TOKEN. Токен читается при каждом запросе, поэтому его можно обновлять на лету.
// (Стандартный MetadataAuthService тянет тяжёлый @yandex-cloud/nodejs-sdk — не нужен.)
const auth = new TokenAuthService(process.env.YDB_TOKEN || '');
function setToken(t) { if (t) auth.token = t; }
let _driver = null, _ready = null;
function driver() {
  if (_ready) return _ready;
  _driver = new Driver({ endpoint: ENDPOINT, database: DATABASE, authService: auth });
  _ready = _driver.ready(15000).then(ok => { if (!ok) { _ready = null; throw new Error('YDB не отвечает'); } return _driver; });
  return _ready;
}

// Тип параметра по значению (все числа в схеме — Int64, строки — Utf8)
function typed(v) {
  if (v && typeof v === 'object' && v.type && v.value) return [v, null];
  if (v === null || v === undefined) return [TypedValues.optionalNull(Types.UTF8), 'Optional<Utf8>'];
  if (typeof v === 'number') return Number.isInteger(v) ? [TypedValues.int64(v), 'Int64'] : [TypedValues.double(v), 'Double'];
  if (typeof v === 'boolean') return [TypedValues.bool(v), 'Bool'];
  if (Array.isArray(v)) {
    if (v.length && typeof v[0] === 'number') return [TypedValues.list(Types.INT64, v), 'List<Int64>'];
    return [TypedValues.list(Types.UTF8, v.map(String)), 'List<Utf8>'];
  }
  return [TypedValues.utf8(String(v)), 'Utf8'];
}
function toNative(v) {
  if (v && typeof v === 'object' && typeof v.toNumber === 'function' && 'high' in v) return v.toNumber();
  if (v instanceof Uint8Array) return Buffer.from(v).toString('utf8');
  return v;
}
function rowsOf(rs) {
  const cols = rs.columns || [];
  return (rs.rows || []).map(r => {
    const o = {};
    (r.items || []).forEach((val, i) => { const c = cols[i]; if (c && c.name) o[c.name] = toNative(convertYdbValueToNative(c.type, val)); });
    return o;
  });
}

const TX = { beginTx: { serializableReadWrite: {} }, commitTx: true };
async function qAll(sql, params = {}) {
  const d = await driver();
  const decl = [], parameters = {};
  for (const [name, val] of Object.entries(params)) {
    const [tv, t] = typed(val);
    parameters['$' + name] = tv;
    if (t) decl.push(`DECLARE $${name} AS ${t};`);
  }
  const text = decl.join('\n') + '\n' + sql;
  return d.tableClient.withSession(async (session) => {
    const res = await session.executeQuery(text, parameters, TX);
    return (res.resultSets || []).map(rowsOf);
  });
}
async function q(sql, params) { const s = await qAll(sql, params); return s[0] || []; }
async function one(sql, params) { return (await q(sql, params))[0] || null; }

// Создание таблицы из строки схемы вида: name (col Type, …, PRIMARY KEY (a,b), INDEX i GLOBAL ON (x,y))
async function createTableFromYql(stmt) {
  const m = stmt.match(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*)\)\s*$/i);
  if (!m) throw new Error('не разобрал: ' + stmt.slice(0, 60));
  const name = m[1], body = m[2];
  const desc = new TableDescription();
  const pk = (body.match(/PRIMARY KEY\s*\(([^)]*)\)/i) || [])[1].split(',').map(s => s.trim());
  const idx = [...body.matchAll(/INDEX\s+(\w+)\s+GLOBAL\s+ON\s*\(([^)]*)\)/gi)];
  const colsPart = body.replace(/,?\s*PRIMARY KEY\s*\([^)]*\)/i, '').replace(/,?\s*INDEX\s+\w+\s+GLOBAL\s+ON\s*\([^)]*\)/gi, '');
  for (const c of colsPart.split(',').map(s => s.trim()).filter(Boolean)) {
    const [cn, ct] = c.split(/\s+/);
    desc.withColumn(new Column(cn, Types.optional(ct === 'Int64' ? Types.INT64 : Types.UTF8)));
  }
  desc.withPrimaryKeys(...pk);
  for (const [, iname, icols] of idx) desc.withIndex(new TableIndex(iname).withIndexColumns(...icols.split(',').map(s => s.trim())).withGlobalAsync(false));
  const d = await driver();
  await d.tableClient.withSession(s => s.createTable(name, desc));
  return name;
}

module.exports = { q, qAll, one, driver, createTableFromYql, setToken };
