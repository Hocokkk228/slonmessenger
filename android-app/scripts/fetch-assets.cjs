// Большие ресурсы, которые кладутся внутрь APK (в репозиторий не коммитятся — качаются при сборке
// и кешируются в android-app/.cache/):
//  • модель расшифровки голосовых (Whisper base, квантованная) + движок ONNX + библиотека transformers.js —
//    чтобы расшифровка работала сразу и без сети;
//  • шрифт Roboto (400/500/700, кириллица и латиница) — без загрузки с Google Fonts.
const fs=require('fs'),path=require('path');
const cache=path.resolve(__dirname,'..','.cache'),www=path.resolve(__dirname,'..','www');
const TF='4.3.0',ORT='1.31.0-dev.20260914-8d85527a0',HF='https://huggingface.co/onnx-community/whisper-base/resolve/main/';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const FILES=[
  ['https://cdn.jsdelivr.net/npm/@huggingface/transformers@'+TF,'asr/transformers.js'],
  ...['config.json','preprocessor_config.json','tokenizer_config.json','generation_config.json','tokenizer.json',
      'onnx/encoder_model_quantized.onnx','onnx/decoder_model_merged_quantized.onnx'].map(f=>[HF+f,'asr/whisper-base/'+f]),
  ...['ort-wasm-simd-threaded.asyncify.mjs','ort-wasm-simd-threaded.asyncify.wasm'].map(f=>['https://cdn.jsdelivr.net/npm/onnxruntime-web@'+ORT+'/dist/'+f,'asr/ort/'+f.replace(/.mjs$/,'.js')])
];
async function get(url,rel){
  const c=path.join(cache,rel);
  if(!fs.existsSync(c)){
    const r=await fetch(url,{headers:{'User-Agent':UA}});if(!r.ok)throw new Error(r.status+' '+url);
    fs.mkdirSync(path.dirname(c),{recursive:true});fs.writeFileSync(c,Buffer.from(await r.arrayBuffer()));
    console.log('  скачано',rel,Math.round(fs.statSync(c).size/1024)+' КБ');
  }
  fs.mkdirSync(path.dirname(path.join(www,rel)),{recursive:true});fs.copyFileSync(c,path.join(www,rel));
}
(async()=>{
  for(const [u,r] of FILES)await get(u,r);
  // Roboto: берём css Google Fonts (woff2), качаем файлы, пишем свой css с локальными путями
  const cssPath=path.join(cache,'fonts/roboto.css');
  let css;
  if(fs.existsSync(cssPath))css=fs.readFileSync(cssPath,'utf8');
  else{
    css=await (await fetch('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',{headers:{'User-Agent':UA}})).text();
    // только кириллица и латиница (остальные алфавиты не нужны)
    css=css.split('/*').filter(b=>/^\s*(cyrillic|cyrillic-ext|latin|latin-ext) \*\//.test(b)).map(b=>'/*'+b).join('');
    fs.mkdirSync(path.dirname(cssPath),{recursive:true});
  }
  let i=0;
  const out=await replaceAsync(css,/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g,async(m,u)=>{
    const name='roboto-'+(i++)+'.woff2';await get(u,'fonts/'+name);return 'url('+name+')';});
  fs.writeFileSync(cssPath,css);fs.writeFileSync(path.join(www,'fonts/roboto.css'),out);
  console.log('ресурсы в www: расшифровка голосовых + шрифты');
})().catch(e=>{console.error('ресурсы не скачались:',e.message);process.exit(1);});
async function replaceAsync(s,re,fn){const ps=[];s.replace(re,(...a)=>{ps.push(fn(...a));return '';});const r=await Promise.all(ps);let k=0;return s.replace(re,()=>r[k++]);}
