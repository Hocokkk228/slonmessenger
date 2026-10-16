// ════════ Стекло: качество под силу телефона ════════
// Размытие под стеклом (backdrop-filter) пересчитывается на каждом кадре прокрутки, и цена растёт с радиусом.
// Поэтому всё стекло берёт параметры из общих переменных (style.css, «Жидкое стекло»), а уровень подбирается:
//   max  — полное размытие;  lite — слабее размытие, плотнее подложка;  off — без размытия, только «стекло»-подложка.
// Авто: слабое железо → сразу lite; при прокрутке проседают кадры → шаг вниз (запоминаем).
// Вручную: Настройки → Общие → Стекло (localStorage sl_glass = auto|max|lite|off).
(function(){
  const K='sl_glass',KA='sl_glass_auto';
  const get=k=>{try{return localStorage.getItem(k)||'';}catch(e){return '';}};
  const set=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
  function tier(){
    const m=get(K)||'auto';
    if(m!=='auto')return m;
    const a=get(KA);if(a)return a;
    const weak=(navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4);
    return weak?'lite':'max';
  }
  function apply(){
    const t=tier(),b=document.body;if(!b)return;
    b.classList.toggle('glass-lo',t==='lite');
    b.classList.toggle('glass-off',t==='off');
  }
  window._glassApply=apply;
  window._glassMode=()=>get(K)||'auto';
  window._glassSet=m=>{set(K,m);if(m==='auto')try{localStorage.removeItem(KA);}catch(e){}apply();};
  if(document.body)apply();else document.addEventListener('DOMContentLoaded',apply);

  // ── Авто: меряем кадры, пока человек листает/свайпает ──
  // Окно 1,5 с; «плохое» окно — больше трети кадров дольше 1,6 × обычного кадра. Три плохих окна подряд → шаг вниз.
  let on=false,frames=[],last=0,bad=0,until=0,base=1000/60;
  function loop(t){
    if(last)frames.push(t-last);last=t;
    if(t<until){requestAnimationFrame(loop);return;}
    on=false;last=0;
    if(frames.length>20){
      const s=frames.slice().sort((a,b)=>a-b);base=Math.min(base,s[Math.floor(s.length*.1)]||base);   // частота экрана (60/90/120 Гц)
      const slow=frames.filter(f=>f>base*1.6).length/frames.length;
      bad=slow>.33?bad+1:0;
      if(bad>=3&&(get(K)||'auto')==='auto'){
        bad=0;const cur=tier(),next=cur==='max'?'lite':cur==='lite'?'off':null;
        if(next){set(KA,next);apply();console.log('[SLON] стекло: прокрутка тормозит — упрощаю до',next);}
      }
    }
    frames=[];
  }
  function poke(){
    if(document.hidden)return;
    if(!on){on=true;frames=[];requestAnimationFrame(loop);}
    until=performance.now()+1500;
  }
  addEventListener('touchmove',poke,{passive:true,capture:true});
  addEventListener('scroll',poke,{passive:true,capture:true});
  addEventListener('wheel',poke,{passive:true,capture:true});
})();

// Пункт в настройках: Общие → Стекло
function _glassPicks(){
  const cur=_glassMode();
  const opts=[['auto','Авто','Подстраивается под телефон'],['max','Максимум','Сильное размытие'],['lite','Лёгкое','Меньше нагрузки'],['off','Без размытия','Самое быстрое']];
  return opts.map(([k,t,s])=>`<div class="sp-pick${cur===k?' sel':''}" onclick="_glassPick('${k}',this)">
    <div class="sp-pick-txt">${t}<div class="sp-row-sub">${s}</div></div><div class="sp-pick-radio"></div></div>`).join('');
}
function _glassPick(k,el){
  _glassSet(k);
  el.parentElement.querySelectorAll('.sp-pick').forEach(x=>x.classList.toggle('sel',x===el));
}

// ── Телефон: поле ввода парит над сообщениями (под ним видно стекло) ──
// Высота поля меняется (несколько строк, ответ, запись) — сообщения получают отступ снизу по факту.
(function _inpFloat(){
  const w=document.getElementById('inpWrap'),pane=document.getElementById('chatPane'),msgs=document.getElementById('msgs')||document.querySelector('#chatPane .msgs');
  if(!w||!pane||!msgs){setTimeout(_inpFloat,400);return;}
  if(typeof ResizeObserver==='undefined')return;
  let h0=0;
  new ResizeObserver(()=>{
    const h=Math.round(w.offsetHeight);if(h===h0)return;
    const near=msgs.scrollHeight-msgs.scrollTop-msgs.clientHeight<90;
    h0=h;pane.style.setProperty('--inp-h',h+'px');
    if(near)requestAnimationFrame(()=>{msgs.scrollTop=msgs.scrollHeight;});
  }).observe(w);
})();
