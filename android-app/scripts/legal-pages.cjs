// Публичные страницы «Политика конфиденциальности» и «Пользовательское соглашение» — из того же текста,
// что и в приложении (js/legal.js). Нужны магазинам (RuStore требует ссылку на политику).
// Запуск: node android-app/scripts/legal-pages.cjs  → privacy.html, terms.html в корне сайта
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..');
const src=fs.readFileSync(path.join(root,'js/legal.js'),'utf8');
const head=src.slice(0,src.indexOf('function _lgOpen'));
const {LEGAL_DOCS,LEGAL_V,LEGAL_MAIL}=new Function(head+';return {LEGAL_DOCS,LEGAL_V,LEGAL_MAIL};')();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const date=new Date(LEGAL_V).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
for(const [file,key] of [['privacy.html','privacy'],['terms.html','terms']]){
  const d=LEGAL_DOCS[key];
  const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.title)} — SLON</title><link rel="icon" href="icons/favicon-64.png">
<style>body{margin:0;background:#0d1117;color:#e6edf3;font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:32px 20px 60px}h1{font-size:28px;margin:0 0 4px}.v{color:#8b949e;font-size:14px;margin-bottom:22px}
h2{font-size:18px;margin:26px 0 8px}p{margin:0;color:#c9d1d9;white-space:pre-line}a{color:#58a6ff}header{display:flex;align-items:center;gap:12px;margin-bottom:22px}
header img{width:44px;height:44px;border-radius:12px}nav{margin-top:34px;font-size:14px;color:#8b949e}</style></head><body><main>
<header><img src="icons/icon-96.png" alt=""><b style="font-size:20px">SLON</b></header>
<h1>${esc(d.title)}</h1><div class="v">Редакция от ${esc(date)}</div>
${d.body.map(([h,t])=>`<h2>${esc(h)}</h2><p>${esc(t)}</p>`).join('\n')}
<nav>Вопросы: <a href="mailto:${esc(LEGAL_MAIL)}">${esc(LEGAL_MAIL)}</a> · <a href="${key==='privacy'?'terms.html':'privacy.html'}">${key==='privacy'?'Пользовательское соглашение':'Политика конфиденциальности'}</a></nav>
</main></body></html>`;
  fs.writeFileSync(path.join(root,file),html);
  console.log('готово',file);
}
