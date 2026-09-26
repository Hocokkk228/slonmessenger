// Выкладка функции SLON в Yandex Cloud. Секреты берутся из %USERPROFILE%\.slon\ и не печатаются.
const {spawnSync}=require('child_process');const fs=require('fs');const path=require('path');
const YC=path.join(process.env.USERPROFILE,'yandex-cloud','bin','yc.exe');
const yc=(args,quiet)=>{const r=spawnSync(YC,args,{encoding:'utf8',maxBuffer:64e6});if(r.status!==0){throw new Error('yc '+args.slice(0,4).join(' ')+': '+(r.stderr||'').slice(0,400));}return r.stdout;};
const cfg={
  fn:'slon-api', db:'/ru-central1/b1gkhvfs1t0gmfb4pdcm/etne7nmkdme0cnk61i32',
  bucket:fs.readFileSync(path.join(process.env.TEMP,'slon-bucket.txt'),'utf8').trim(),
};
const key=JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE,'.slon','yc-s3.json'),'utf8'));
const sa=JSON.parse(yc(['iam','service-account','get','slon-fn','--format','json'])).id;
let fn;try{fn=JSON.parse(yc(['serverless','function','get',cfg.fn,'--format','json']));}catch(e){fn=JSON.parse(yc(['serverless','function','create','--name',cfg.fn,'--description','SLON API + WebSocket','--format','json']));}
const env=['YDB_DATABASE='+cfg.db,'BUCKET='+cfg.bucket,'S3_KEY_ID='+key.access_key.key_id,'S3_SECRET='+key.secret];
// дополнительные секреты (TURN, FCM, админы) — если лежат в %USERPROFILE%\.slon\yc-env.json
const extraF=path.join(process.env.USERPROFILE,'.slon','yc-env.json');
if(fs.existsSync(extraF))for(const [k,v] of Object.entries(JSON.parse(fs.readFileSync(extraF,'utf8'))))env.push(k+'='+v);
const out=JSON.parse(yc(['serverless','function','version','create','--function-id',fn.id,'--runtime','nodejs22','--entrypoint','index.handler',
  '--memory','256m','--execution-timeout','30s','--source-path',path.join(__dirname,'slon-fn.zip'),'--service-account-id',sa,
  '--environment',env.join(','),'--format','json']));
console.log('функция',fn.id,'| версия',out.id,'| статус',out.status,'| env:',env.map(e=>e.split('=')[0]).join(','));
if(!fn.http_invoke_url_public){try{yc(['serverless','function','allow-unauthenticated-invoke',fn.id]);console.log('публичный вызов: включён');}catch(e){console.log('публичный вызов:',e.message.slice(0,120));}}
console.log('URL:', fn.http_invoke_url);
fs.writeFileSync(path.join(__dirname,'.deploy.json'),JSON.stringify({fnId:fn.id,url:fn.http_invoke_url,sa,bucket:cfg.bucket},null,1));
