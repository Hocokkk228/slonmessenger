// ════════ Музыка+: переход между треками, затухание, «играть следующим», очередь перетаскиванием, топ месяца ════════
// Работает и с браузерным плеером (ПК, сайт), и с нативным плеером Android (_npa / SlonPlayer):
// у нативного очередь и затухание живут в службе плеера (insertNext/move/remove/skip/setFade — APK 1.6.9+),
// на старом APK — откат: очередь пересобирается целиком.

// ── 1. Анимация смены трека (сам дошёл до конца или переключили кнопкой) ──
let _trLast='',_trDir=1;
function _trKick(sel,kind,d){
  document.querySelectorAll(sel).forEach(e=>{
    e.classList.remove('trc-n','trc-p','trt-n','trt-p');void e.offsetWidth;e.classList.add('tr'+kind+'-'+d);
  });
}
function _trAnim(){
  const id=_islTr?String(_islTr.id):'';
  if(!id||id===_trLast)return;
  const first=!_trLast;_trLast=id;
  if(first)return;
  const d=_trDir<0?'p':'n';_trDir=1;
  requestAnimationFrame(()=>{
    _trKick('#fpCover,#mmMini .mm-mini-cv,#slIsl>img,#slIsl>.mm-cv-none,#slIsl .isl-top>img,#slIsl .isl-top>.mm-cv-none','c',d);
    _trKick('#mmFp .fp-info,#mmMini .mm-mini-t,#slIsl .isl-t,#slIsl .isl-mt','t',d);
  });
}
{const f=_isl;_isl=function(){const r=f.apply(this,arguments);_trAnim();return r;};}
{const f=_fpPaint;_fpPaint=function(){const r=f.apply(this,arguments);_trAnim();return r;};}
// окно караоке на ПК пересоздаётся на каждый трек — анимируем обложку и название в новом окне
{const f=_pxLyrics;_pxLyrics=function(){
  const had=!!$('pxKara'),d=_trDir<0?'p':'n';
  const r=f.apply(this,arguments);
  if(had)requestAnimationFrame(()=>{_trKick('#pxKara .px-kara-art','c',d);_trKick('#pxKara .px-kara-tt,#pxKara .px-kara-hd img','t',d);});
  return r;
};}

// ── 2. Затухание: конец трека плавно гаснет, следующий плавно появляется; кнопкой — быстрый увод звука ──
const _fadeSec=()=>{try{const v=localStorage.getItem('sl_mm_fade');return v==null?3:Math.max(0,Math.min(12,+v||0));}catch(e){return 3;}};
function _fadeSet(s){
  try{localStorage.setItem('sl_mm_fade',String(s));}catch(e){}
  const P=typeof _NPL==='function'&&_NPL();if(P)P.setFade({ms:s*1000}).catch(()=>{});
}
let _fadeId='',_fadeT0=0,_fadeHold=false;
const _isNative=()=>typeof _npa!=='undefined'&&_pxAudio===_npa;
function _fadeTick(){
  const a=_pxAudio;if(!a||_isNative()||_fadeHold)return;
  if(!String(_pxAudioId).startsWith('mm_')){if(a.volume<1)a.volume=1;return;}   // трек из чата, отрывок — без затухания
  if(String(_pxAudioId)!==_fadeId){_fadeId=String(_pxAudioId);_fadeT0=0;}
  const F=_fadeSec();let v=1;
  if(F>0){
    if(!_fadeT0&&a.currentTime>0.05)_fadeT0=performance.now();
    const fin=_fadeT0?Math.min(1,(performance.now()-_fadeT0)/900):0;
    const d=a.duration,t=a.currentTime;
    const out=isFinite(d)&&d>F*3?Math.max(0,Math.min(1,(d-t)/F)):1;
    v=fin*out;
  }
  if(Math.abs(a.volume-v)>.008)a.volume=v;
}
setInterval(()=>{if(_pxAudio&&!_pxAudio.paused)_fadeTick();},50);
setTimeout(()=>{const P=typeof _NPL==='function'&&_NPL();if(P)P.setFade({ms:_fadeSec()*1000}).catch(()=>{});},3000);

// переключение кнопкой: звук уводится за ~0,2 с, потом следующий трек (он сам плавно появится)
{const f=_mmStep;_mmStep=function(d){
  _trDir=d;
  const a=_pxAudio,self=this,args=arguments;
  // «играть следующим» в режиме перемешивания (браузерный плеер): сначала то, что попросили
  const up=d>0&&_mm.shuffle&&!_isNative()&&(_mm.upNext||[]).find(x=>_mmFind(x));
  const go=()=>{if(up){_mm.upNext=_mm.upNext.filter(x=>x!==up);_mmPlay(up,_mm.queue);}else f.apply(self,args);};
  if(_isNative()){
    const P=_NPL();
    if(P&&_fadeSec()>0&&!(d<0&&a.currentTime>4)){
      P.skip({dir:d,ms:220}).then(()=>{_npa._mstD=Object.assign({},_npa._mstD,{want:true});_npa._fire('play');}).catch(()=>f.apply(self,args));
      return;
    }
    return f.apply(this,arguments);
  }
  if(_fadeSec()>0&&a&&!a.paused&&String(_pxAudioId).startsWith('mm_')&&!(d<0&&a.currentTime>4)){
    _fadeHold=true;const v0=a.volume,t0=performance.now();
    const iv=setInterval(()=>{const k=Math.min(1,(performance.now()-t0)/200);a.volume=Math.max(0,v0*(1-k));
      if(k>=1){clearInterval(iv);_fadeHold=false;_fadeId='';go();}},16);
    return;
  }
  go();
};}
// сыгранный трек больше не «следующий»
{const f=_mmPlay;_mmPlay=function(id){if(_mm.upNext)_mm.upNext=_mm.upNext.filter(x=>x!==id);return f.apply(this,arguments);};}

// ── 3. Очередь: «играть следующим», перетаскивание, убрать ──
function _mqNat(it){return {id:it.id,url:_npUrl(it),title:it.title||'',artist:it.artist||'',cover:_npCover(it)};}
// нативная очередь не умеет (старый APK) — пересобираем целиком с того же места
function _mqRebuild(){
  const P=_NPL();if(!P||!_isNative())return;
  const items=_mm.queue.map(x=>_mmFind(x)).filter(Boolean);
  _npa._ids=_mm.queue.slice();
  P.setQueue({items:items.map(_mqNat),index:Math.max(0,_mm.qi),pos:Math.round(_npa.currentTime*1000),play:!_npa.paused,shuffle:!!_mm.shuffle,repeat:'off'}).catch(()=>{});
}
function _mqNext(id){
  const it=_mmFind(id);if(!it)return;
  if(!_mm.cur||!_mm.queue.length||!_pxAudio){_mmPlay(id);return;}
  const cur=_mm.queue[_mm.qi];
  if(cur===id){toast('Этот трек уже играет');return;}
  if(_isNative()&&!_npUrl(it)){toast('Этот трек есть только на другом устройстве — сначала он должен загрузиться в облако');return;}
  const q=_mm.queue.filter((x,i)=>x!==id||i===_mm.qi);
  const qi=q.indexOf(cur);q.splice(qi+1,0,id);_mm.queue=q;_mm.qi=qi;
  _mm.upNext=(_mm.upNext||[]).filter(x=>x!==id);_mm.upNext.push(id);
  if(_isNative()){_npa._ids=q.slice();_NPL().insertNext({item:_mqNat(it)}).catch(_mqRebuild);}
  toast('Сыграет следующим');
}
function _mqMove(from,to){
  if(from===to||from<0||to<0||from>=_mm.queue.length||to>=_mm.queue.length)return;
  const cur=_mm.queue[_mm.qi];
  const q=_mm.queue.slice();const [x]=q.splice(from,1);q.splice(to,0,x);
  _mm.queue=q;_mm.qi=q.indexOf(cur);
  if(_isNative()){_npa._ids=q.slice();_NPL().move({from,to}).catch(_mqRebuild);}
}
function _mqRemove(i){
  if(i===_mm.qi||i<0||i>=_mm.queue.length)return;
  const cur=_mm.queue[_mm.qi];_mm.queue.splice(i,1);_mm.qi=_mm.queue.indexOf(cur);
  if(_isNative()){_npa._ids=_mm.queue.slice();_NPL().remove({index:i}).catch(_mqRebuild);}
  _mxQueue();
}
const _MQ_ICO={drag:'<svg viewBox="0 0 24 24"><path d="M4 8h16v2H4zm0 6h16v2H4z"/></svg>',
  next:'<svg viewBox="0 0 24 24"><path d="M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm13-1v8l6-4z"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'};
// очередь: держи за «≡» и тащи; нажми на трек — включить; × — убрать
_mxQueue=function(){
  const ids=_mm.queue||[];
  const rows=ids.map((id,i)=>{const it=_mmFind(id);if(!it)return '';
    const cur=i===_mm.qi;
    return `<div class="mq-row${cur?' cur':''}" data-i="${i}">
      <div class="mq-main" onclick="_mxQueueJump(${i})">${_mxCv(it.coverUrl)}<div class="mm-tr-t"><b>${esc(it.title)}</b><span>${esc(it.artist||'')}</span></div></div>
      ${cur?'<span class="mq-now">Сейчас</span>':`<button class="mq-x" onclick="_mqRemove(${i})" title="Убрать из очереди">${_MQ_ICO.x}</button><span class="mq-h" title="Перетащить">${_MQ_ICO.drag}</span>`}</div>`;}).join('');
  _pxSheet(`<div class="px-sh-t">Очередь</div><div class="mq-hint">Держи ≡ и перетаскивай</div><div class="mq-list" id="mqList">${rows||'<div class="px-empty">Очередь пуста</div>'}</div>`);
  $('pxSheet')?.querySelector('.px-sheet-card')?.classList.add('wide');
  setTimeout(()=>{const c=document.querySelector('#mqList .mq-row.cur');c&&c.scrollIntoView({block:'center'});},50);
  _mqDrag($('mqList'));
};
function _mqDrag(list){
  if(!list)return;
  let row=null,from=-1,y0=0,rows=[],h=0,to=-1;
  list.addEventListener('pointerdown',e=>{
    const hd=e.target.closest('.mq-h');if(!hd)return;
    row=hd.closest('.mq-row');from=+row.dataset.i;to=from;y0=e.clientY;
    rows=[...list.querySelectorAll('.mq-row')];h=row.getBoundingClientRect().height;
    row.classList.add('drag');hd.setPointerCapture(e.pointerId);e.preventDefault();
    if(navigator.vibrate)try{navigator.vibrate(8);}catch(x){}
  });
  list.addEventListener('pointermove',e=>{
    if(!row)return;
    const dy=e.clientY-y0;row.style.transform=`translateY(${dy}px)`;
    to=Math.max(0,Math.min(rows.length-1,from+Math.round(dy/h)));
    rows.forEach(r=>{const i=+r.dataset.i;if(r===row)return;
      let s=0;if(from<to&&i>from&&i<=to)s=-h;else if(from>to&&i<from&&i>=to)s=h;
      r.style.transform=s?`translateY(${s}px)`:'';});
    // у края списка — подкручиваем
    const b=list.closest('.px-sheet-card')||list,rc=b.getBoundingClientRect();
    if(e.clientY<rc.top+50)b.scrollTop-=8;else if(e.clientY>rc.bottom-50)b.scrollTop+=8;
  });
  const end=()=>{
    if(!row)return;
    rows.forEach(r=>r.style.transform='');row.classList.remove('drag');row=null;
    if(to!==from){_mqMove(from,to);_mxQueue();}
  };
  list.addEventListener('pointerup',end);list.addEventListener('pointercancel',end);
}
// пункты в меню трека
{const f=_mmMenu;_mmMenu=function(id){
  const r=f.apply(this,arguments);
  const a=document.querySelector('#pxSheet .mm-acts');
  if(a&&_mm.cur&&_pxAudio)a.insertAdjacentHTML('afterbegin',`<button onclick="_pxSheetClose();_mqNext('${esc(id)}')">Играть следующим</button>`);
  return r;
};}

// ── 4. Статистика прослушиваний и топ месяца ──
// Засчитываем прослушивание, когда трек играл 30 с (или половину, если он короче минуты). Минуты — по факту.
const _mstK=()=>'sl_mmstat_'+(myUsername||'');
const _mstMonth=(t=Date.now())=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');};
function _mstLoad(){try{return JSON.parse(localStorage.getItem(_mstK())||'{}')||{};}catch(e){return {};}}
let _mstD=null,_mstCur='',_mstMs=0,_mstCounted=false,_mstLastT=0,_mstDirty=false;
setInterval(()=>{
  const a=_pxAudio;if(!a||a.paused||!String(_pxAudioId).startsWith('mm_')||!myUsername)return;
  const it=_mmFind(String(_pxAudioId).slice(3));if(!it)return;
  const k=it.cid||it.id;
  if(k!==_mstCur){_mstCur=k;_mstMs=0;_mstCounted=false;}
  const now=Date.now(),dt=_mstLastT&&now-_mstLastT<3000?now-_mstLastT:1000;_mstLastT=now;
  if(!_mstD)_mstD=_mstLoad();
  const m=_mstMonth(),M=_mstD[m]||(_mstD[m]={}),r=M[k]||(M[k]={n:0,ms:0,t:it.title||'',a:it.artist||''});
  r.ms+=dt;_mstMs+=dt;r.t=it.title||r.t;r.a=it.artist||r.a;
  const need=isFinite(a.duration)&&a.duration<60?a.duration*500:30000;
  if(!_mstCounted&&_mstMs>=need){_mstCounted=true;r.n++;r.last=now;}
  _mstDirty=true;
},1000);
setInterval(()=>{if(_mstDirty&&_mstD){_mstDirty=false;try{localStorage.setItem(_mstK(),JSON.stringify(_mstD));}catch(e){}}},10000);
addEventListener('pagehide',()=>{if(_mstDirty&&_mstD)try{localStorage.setItem(_mstK(),JSON.stringify(_mstD));}catch(e){}});

const _MON=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const _MON_G=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const _CROWN='<svg class="mt-crown" viewBox="0 0 64 44"><defs><linearGradient id="mtCg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#e09a00"/></linearGradient></defs><path d="M4 14l14 12L32 4l14 22 14-12-6 26H10z" fill="url(#mtCg)" stroke="#b97800" stroke-width="2" stroke-linejoin="round"/><circle cx="4" cy="13" r="4" fill="#ffd23f"/><circle cx="32" cy="4" r="4" fill="#ffd23f"/><circle cx="60" cy="13" r="4" fill="#ffd23f"/><rect x="10" y="36" width="44" height="6" rx="2" fill="#e09a00"/></svg>';
function _mstTop(m){
  if(!_mstD)_mstD=_mstLoad();
  const M=_mstD[m]||{};
  const tr=Object.entries(M).map(([k,v])=>({k,...v,it:_mm.list.find(x=>(x.cid||x.id)===k)||null})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n||b.ms-a.ms);
  const ar={};for(const x of Object.values(M)){const n=(typeof _mxArtistOf==='function'?_mxArtistOf({artist:x.a}):x.a)||'';if(!n)continue;const o=ar[n]||(ar[n]={name:n,n:0,ms:0});o.n+=x.n;o.ms+=x.ms;}
  const arts=Object.values(ar).filter(x=>x.n>0).sort((a,b)=>b.n-a.n||b.ms-a.ms);
  const ms=Object.values(M).reduce((s,x)=>s+x.ms,0);
  return {tr,arts,ms};
}
// карточка на главной
function _mxTopCard(){
  const m=_mstMonth(),{tr}=_mstTop(m);if(!tr.length)return '';
  const t=tr[0],cv=t.it&&t.it.coverUrl;
  return `<div class="mt-card" onclick="_mxTopOpen('${m}')"><div class="mt-card-cv">${_mxCv(cv)}${_CROWN}</div>
    <div class="mt-card-t"><span>Топ ${_MON_G[+m.slice(5)-1]}</span><b>${esc(t.t||'')}</b><i>${esc(t.a||'')} · ${t.n} ${_mtPl(t.n)}</i></div></div>`;
}
const _mtPl=n=>{const a=n%10,b=n%100;return a===1&&b!==11?'прослушивание':a>=2&&a<=4&&(b<12||b>14)?'прослушивания':'прослушиваний';};
{const f=_mxHome;_mxHome=function(){
  const h=f.apply(this,arguments),c=_mxTopCard();
  return c?h.replace('</div>',`</div>${c}`):h;           // сразу после приветствия
};}
function _mxTopOpen(m){
  if(!_mstD)_mstD=_mstLoad();
  const months=Object.keys(_mstD).sort().reverse();
  _spPush('Топ месяца',`<div class="mt" id="mtRoot"></div>`);
  _mxTopPaint(m||months[0]||_mstMonth(),months);
}
function _mxTopPaint(m,months){
  const box=$('mtRoot');if(!box)return;
  const {tr,arts,ms}=_mstTop(m),[y,mm]=m.split('-');
  const mins=Math.round(ms/60000);
  let h=`<div class="mt-hero"><div class="mt-month">${_MON[+mm-1]} ${y}</div><div class="mt-sum"><b>${mins}</b> мин · <b>${tr.length}</b> ${typeof _mmPlural==='function'?_mmPlural(tr.length):'треков'}</div>
    ${months.length>1?`<div class="mt-months">${months.map(x=>`<button class="${x===m?'on':''}" onclick="_mxTopPaint('${x}',${esc(JSON.stringify(months)).replace(/"/g,'&quot;')})">${_MON[+x.slice(5)-1].slice(0,3)} ${x.slice(2,4)}</button>`).join('')}</div>`:''}</div>`;
  if(!tr.length){box.innerHTML=h+'<div class="px-empty">В этом месяце ещё ничего не слушал</div>';return;}
  const play=x=>x.it?`_mm.src='lib';_mmPlay('${esc(x.it.id)}',${esc(JSON.stringify(tr.filter(y=>y.it).map(y=>y.it.id))).replace(/"/g,'&quot;')})`:'';
  const t1=tr[0];
  h+=`<div class="mt-one" onclick="${play(t1)}"><div class="mt-one-cv">${_mxCv(t1.it&&t1.it.coverUrl)}${_CROWN}<span class="mt-rank1">1</span></div>
    <div class="mt-one-t"><b>${esc(t1.t||'')}</b><span>${esc(t1.a||'')}</span><i>${t1.n} ${_mtPl(t1.n)} · ${Math.round(t1.ms/60000)} мин</i></div></div>`;
  h+=`<div class="mx-h2">Треки</div><div class="mt-list">`+tr.slice(1,15).map((x,i)=>`<div class="mt-row r${i+2}" onclick="${play(x)}"><span class="mt-n">${i+2}</span>${_mxCv(x.it&&x.it.coverUrl)}
    <div class="mm-tr-t"><b>${esc(x.t||'')}</b><span>${esc(x.a||'')}</span></div><i>${x.n}</i></div>`).join('')+`</div>`;
  if(arts.length){
    h+=`<div class="mx-h2">Исполнители</div><div class="mt-arts">`+arts.slice(0,8).map((a,i)=>{
      const g={name:a.name,cover:((_mm.list.find(x=>_mxArtistOf(x)===a.name)||{}).coverUrl)||''};
      return `<div class="mt-art${i===0?' top':''}" onclick="_mxOpenGroup('artist',${esc(JSON.stringify(a.name)).replace(/"/g,'&quot;')})"><div class="mt-art-cv">${_mxArtCv(g)}${i===0?_CROWN:`<span class="mt-n">${i+1}</span>`}</div><b>${esc(a.name)}</b><span>${a.n} ${_mtPl(a.n)}</span></div>`;}).join('')+`</div>`;
  }
  box.innerHTML=h;
}
