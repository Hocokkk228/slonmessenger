// Встроенная копия сайта (на случай, если сайт недоступен) + иконка приложения.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..'), app = path.resolve(__dirname, '..');
const off = path.join(app, 'offline');
fs.rmSync(off, { recursive: true, force: true }); fs.mkdirSync(off, { recursive: true });
const copy = rel => {
  const src = path.join(root, rel), dst = path.join(off, rel);
  if (fs.statSync(src).isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) copy(path.join(rel, f)); }
  else fs.copyFileSync(src, dst);
};
for (const f of ['index.html', 'style.css', 'manifest.json', 'version.json', 'js', 'icons']) copy(f);
fs.mkdirSync(path.join(app, 'build'), { recursive: true });
fs.copyFileSync(path.join(root, 'icons', 'icon-512.png'), path.join(app, 'build', 'icon.png'));
console.log('offline копия и иконка готовы');
