// Подпись APK всеми схемами (v1 + v2 + v3). Gradle при minSdk 24 ставит только v2/v3, а часть установщиков
// и файловых менеджеров без v1 пишет «APK contains no signature files».
// Ключ и пароли — из %USERPROFILE%/.slon/keystore.properties (вне репозитория); пароли идут в apksigner
// через переменные окружения и нигде не печатаются.
// Запуск: node scripts/sign-apk.cjs <входной.apk> <выходной.apk>
const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const [inp,out]=process.argv.slice(2);
if(!inp||!out){console.error('node scripts/sign-apk.cjs <in.apk> <out.apk>');process.exit(1);}
const props={};
for(const l of fs.readFileSync(path.join(os.homedir(),'.slon','keystore.properties'),'utf8').split(/\r?\n/)){
  const m=l.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);if(m)props[m[1]]=m[2];
}
const sdk=path.join(process.env.LOCALAPPDATA,'Android','Sdk','build-tools');
const bt=fs.readdirSync(sdk).sort().pop();
const signer=path.join(sdk,bt,'apksigner.bat');
const ks=path.isAbsolute(props.storeFile)?props.storeFile:path.resolve(__dirname,'..','android','app',props.storeFile);
const r=spawnSync(signer,['sign','--ks',ks,'--ks-key-alias',props.keyAlias,'--ks-pass','env:SLON_KS_PASS','--key-pass','env:SLON_KEY_PASS',
  '--v1-signing-enabled','true','--v2-signing-enabled','true','--v3-signing-enabled','true','--min-sdk-version','24','--out',out,inp],
  {env:{...process.env,SLON_KS_PASS:props.storePassword,SLON_KEY_PASS:props.keyPassword},encoding:'utf8',shell:true});
if(r.status!==0){console.error('подпись не удалась:',(r.stderr||'').split('\n').filter(x=>!/pass/i.test(x)).join('\n').slice(0,400));process.exit(1);}
console.log('подписано v1+v2+v3 →',out);
