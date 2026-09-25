// Копирует веб-версию SLON (корень репозитория) в www/ — она встраивается в APK.
// Так приложение запускается мгновенно и работает с тем же кодом, что и сайт.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..'),www=path.resolve(__dirname,'..','www');
fs.rmSync(www,{recursive:true,force:true});fs.mkdirSync(www,{recursive:true});
const copy=(rel)=>{const src=path.join(root,rel),dst=path.join(www,rel);
  if(fs.statSync(src).isDirectory()){fs.mkdirSync(dst,{recursive:true});for(const f of fs.readdirSync(src))copy(path.join(rel,f));}
  else fs.copyFileSync(src,dst);};
for(const f of ['index.html','style.css','manifest.json','sw.js','js','icons'])copy(f);
// версия сборки — приложение сравнивает её с version.json на сайте и предлагает обновиться
const ver=require('../package.json').version;
fs.writeFileSync(path.join(www,'app-version.json'),JSON.stringify({version:ver,build:Date.now()}));
console.log('www готов, версия',ver);
