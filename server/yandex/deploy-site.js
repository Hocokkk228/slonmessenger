// Выложить сайт SLON на Яндекс: https://slonmessenger.website.yandexcloud.net
// Копия index.html сразу выбирает яндекс-сервер (window.SLON_SRV='yc'). Запуск: node server/yandex/deploy-site.js
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const YC = path.join(process.env.USERPROFILE, 'yandex-cloud', 'bin', 'yc.exe');
const ROOT = path.resolve(__dirname, '..', '..'), BUCKET = 'slonmessenger';
const files = ['style.css', 'manifest.json', 'sw.js', 'version.json'];
(function walk(d) { for (const f of fs.readdirSync(path.join(ROOT, d))) { const p = path.join(d, f); fs.statSync(path.join(ROOT, p)).isDirectory() ? walk(p) : files.push(p); } })('js');
(function walk(d) { for (const f of fs.readdirSync(path.join(ROOT, d))) { const p = path.join(d, f); fs.statSync(path.join(ROOT, p)).isDirectory() ? walk(p) : files.push(p); } })('icons');
const tmp = path.join(os.tmpdir(), 'slon-index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<head([^>]*)>/i, '<head$1><script>window.SLON_SRV="yc"</script>'));
const up = (src, key) => spawnSync(YC, ['storage', 's3', 'cp', src, 's3://' + BUCKET + '/' + key], { encoding: 'utf8' }).status === 0;
let ok = 0, bad = [];
for (const f of files) up(path.join(ROOT, f), f.split(path.sep).join('/')) ? ok++ : bad.push(f);
up(tmp, 'index.html') ? ok++ : bad.push('index.html');
console.log('загружено', ok, bad.length ? 'ошибки: ' + bad.join(', ') : 'без ошибок', '→ https://' + BUCKET + '.website.yandexcloud.net');
