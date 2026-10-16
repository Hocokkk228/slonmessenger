// ════════ Музыка: эффекты под трек ════════
// • Дроп: один раз разбираем файл трека (в пониженном качестве, в фоне) и находим места, где бас резко
//   взрывается после затишья/нагнетания. В эти моменты — «БАМ»: удар с увеличением, вспышка и плавная
//   тряска с подёргиванием (как у призрака на фоне профиля). Работает и с нативным плеером Android —
//   эффект привязан к позиции трека, а не к живому звуку.
// • Фит: если в тексте песни есть заголовки «[Куплет 2: Kai Angel]», при смене исполнителя — свой эффект
//   (глитч-сдвиг цвета) и плашка с именем того, кто сейчас читает.

const _DROP_K='sl_drops3';     // [{t, s: 1 лёгкий | 2 средний | 3 жёсткий}]
const _dropsDb=(()=>{try{return JSON.parse(localStorage.getItem(_DROP_K)||'{}')||{};}catch(e){return {};}})();
const _dropsSave=()=>{try{localStorage.setItem(_DROP_K,JSON.stringify(_dropsDb));}catch(e){}};
let _dropBusy=false,_dropFired=new Set(),_dropKey='';

// поиск дропов в треке: энергия баса по окнам 100 мс
async function _dropScan(it){
  const url=it.url||(typeof _mmSrc==='function'?await _mmSrc(it):'');
  if(!url)return null;
  const buf=await (await fetch(url)).arrayBuffer();
  if(buf.byteLength>40*1024*1024)return [];
  const sr=8000;
  const ab=await new OfflineAudioContext(1,sr,sr).decodeAudioData(buf);   // пересэмплируется в 8 кГц — мало памяти
  const ch=ab.getChannelData(0),win=sr/10,n=Math.floor(ch.length/win);
  if(n<300)return [];                                                     // короче 30 с — не ищем
  // бас: простой фильтр низких частот (~150 Гц), энергия по окнам
  const a=1-Math.exp(-2*Math.PI*150/sr);let lp=0;const E=new Float32Array(n),F=new Float32Array(n);
  for(let w=0;w<n;w++){let s=0,f=0;for(let i=w*win,e=i+win;i<e;i++){const x=ch[i];lp+=a*(x-lp);s+=lp*lp;f+=x*x;}E[w]=Math.sqrt(s/win);F[w]=Math.sqrt(f/win);}
  const pct=(arr,p)=>{const s=Array.from(arr).sort((x,y)=>x-y);return s[Math.floor(s.length*p)]||0;};
  const loud50=pct(F,.5),loud80=pct(F,.8),bass80=pct(E,.8);
  const avg=(arr,i0,i1)=>{let s=0,c=0;for(let i=Math.max(0,i0);i<Math.min(n,i1);i++){s+=arr[i];c++;}return c?s/c:0;};
  // кандидаты: бас после момента заметно сильнее, чем до (сравниваем 2 с после и 4 с до), и трек тут не тихий
  const cand=[];
  for(let w=50;w<n-20;w++){
    const before=avg(E,w-40,w),after=avg(E,w,w+20),afterF=avg(F,w,w+20);
    const r=after/(before+1e-6);
    if(r<1.35||afterF<loud50)continue;
    // сила: насколько громко после и насколько вырос бас
    const lvl=r>=2&&afterF>=loud80&&after>=bass80?3:r>=1.6&&afterF>=loud50*1.15?2:1;
    // точный момент удара — самый резкий скачок рядом
    let best=w,jump=-1;for(let k=w-5;k<=w+5;k++){const j=E[k]-avg(E,k-5,k);if(j>jump){jump=j;best=k;}}
    cand.push({t:best/10,s:lvl,score:r*(afterF/(loud80||1))});
  }
  // сначала сильные; между событиями — не меньше 8 с; до 12 за трек
  cand.sort((x,y)=>y.s-x.s||y.score-x.score);
  const out=[];for(const c of cand){if(out.every(o=>Math.abs(o.t-c.t)>8))out.push({t:Math.round(c.t*10)/10,s:c.s});if(out.length>=12)break;}
  return out.sort((x,y)=>x.t-y.t);
}
async function _dropPrep(){
  if(_dropBusy||(navigator.deviceMemory&&navigator.deviceMemory<=3))return;   // слабый телефон — разбор трека не тянем
  const t=typeof _mm!=='undefined'&&_mm.cur;if(!t||!t.mm)return;
  const it=_mmFind(t.mm);if(!it)return;
  const k=it.cid||it.id;if(_dropsDb[k])return;
  _dropBusy=true;
  try{_dropsDb[k]=(await _dropScan(it))||[];_dropsSave();}catch(e){_dropsDb[k]=[];}
  _dropBusy=false;
}
function _dropsNow(){
  const t=typeof _mm!=='undefined'&&_mm.cur;if(!t||!t.mm)return null;
  const it=_mmFind(t.mm);if(!it)return null;
  return {k:it.cid||it.id,list:_dropsDb[it.cid||it.id]||null};
}
// «БАМ»
// сила 3 — жёсткий дроп: удар, вспышка, тряска, вибрация; 2 — удар покороче со слабой вспышкой; 1 — пульс обложки
function _fxBam(lvl){
  lvl=lvl||3;const b=document.body,cls=lvl>=3?'fx-bam':lvl===2?'fx-hit':'fx-pulse';
  b.classList.remove('fx-bam','fx-hit','fx-pulse');void b.offsetWidth;b.classList.add(cls);
  clearTimeout(_fxBam._t);_fxBam._t=setTimeout(()=>b.classList.remove(cls),1400);
  if(lvl>=2)for(const host of [document.getElementById('mmFp'),document.getElementById('pxKara')]){if(!host)continue;
    host.querySelector(':scope>.fx-flash')?.remove();const f=document.createElement('div');f.className='fx-flash';host.appendChild(f);if(lvl<3)f.style.opacity='.5';setTimeout(()=>f.remove(),1200);}
  if(lvl>=3&&navigator.vibrate&&matchMedia('(max-width:640px)').matches)try{navigator.vibrate([35,40,70]);}catch(e){}
}

// ── фит: разметка куплетов из текста ([Куплет 2: Исполнитель]) ──
let _featKey='',_featSecs=null,_featCur='';
const _fNorm=s=>String(s||'').toLowerCase().replace(/\(.*?\)|\[.*?\]/g,'').replace(/[^a-zа-яё0-9]+/gi,'');
async function _featPrep(){
  const t=typeof _mm!=='undefined'&&_mm.cur;if(!t||!t.mm)return;
  const key=String(t.mm);if(key===_featKey)return;_featKey=key;_featSecs=null;_featCur='';
  try{
    const hit=await _lrcFind(t);if(!hit||!hit.plainLyrics||!hit.syncedLyrics||_featKey!==key)return;
    const lines=_lrcParse(hit.syncedLyrics);
    // разделы с исполнителями из «чистого» текста
    const secs=[];let who='';
    for(const raw of String(hit.plainLyrics).split('\n')){
      const m=raw.match(/^\s*\[[^\]:]*:\s*([^\]]+)\]\s*$/);
      if(m){who=m[1].replace(/\s*\(.*?\)\s*/g,'').split(/\s*[&,]\s*|\s+и\s+/)[0].trim();continue;}
      if(raw.trim()&&who)secs.push({n:_fNorm(raw),who});
    }
    if(new Set(secs.map(s=>s.who.toLowerCase())).size<2)return;          // один исполнитель — не фит
    // сопоставляем строки по порядку
    const map=[];let j=0;
    for(let i=0;i<lines.length;i++){const n=_fNorm(lines[i].text);if(!n)continue;
      for(let k=j;k<Math.min(secs.length,j+8);k++)if(secs[k].n===n){map.push({t:lines[i].t,who:secs[k].who});j=k+1;break;}}
    if(map.length>3)_featSecs=map;
  }catch(e){}
}
function _fxFeat(who){
  const b=document.body;b.classList.remove('fx-feat');void b.offsetWidth;b.classList.add('fx-feat');
  clearTimeout(_fxFeat._t);_fxFeat._t=setTimeout(()=>b.classList.remove('fx-feat'),1200);
  let chip=document.getElementById('fxWho');
  if(!chip){chip=document.createElement('div');chip.id='fxWho';chip.className='fx-who';document.body.appendChild(chip);}
  chip.innerHTML='🎤 '+esc(who);chip.classList.remove('show');void chip.offsetWidth;chip.classList.add('show');
  clearTimeout(chip._t);chip._t=setTimeout(()=>chip.classList.remove('show'),2600);
}

// ── главный цикл: следим за позицией трека ──
setInterval(()=>{
  const a=typeof _pxAudio!=='undefined'&&_pxAudio;
  if(!a||a.paused||!String(_pxAudioId||'').startsWith('mm_')||document.hidden)return;
  const d=_dropsNow();if(!d)return;
  if(d.k!==_dropKey){_dropKey=d.k;_dropFired=new Set();}
  const t=a.currentTime;
  if(!d.list){if(t>2)_dropPrep();}
  else for(const x of d.list){if(!_dropFired.has(x.t)&&t>=x.t-0.05&&t<x.t+0.6){_dropFired.add(x.t);_fxBam(x.s);}
    else if(t<x.t-1)_dropFired.delete(x.t);}                                        // перемотали назад — сыграет снова
  _featPrep();
  if(_featSecs){let who='';for(const s of _featSecs){if(s.t<=t)who=s.who;else break;}
    if(who&&who!==_featCur){const first=!_featCur;_featCur=who;if(!first)_fxFeat(who);}}
},100);
