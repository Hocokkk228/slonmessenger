// ════════ Телефон: переходы как в Telegram ════════
// Список чатов — основа; открытый чат въезжает справа ПОВЕРХ списка (список чуть уезжает влево и темнеет),
// назад — чат уезжает вправо. Свайп вправо по чату — назад к списку (палец ведёт экран).
// На ПК ничего не меняется.
(function(){
  const mob=()=>window.innerWidth<=640;
  let x0=0,y0=0,dx=0,drag=false,locked=false,t0=0;
  const chat=()=>document.getElementById('chatPane'),sb=()=>document.getElementById('sidebar');
  document.addEventListener('touchstart',e=>{
    if(!mob()||sb()?.classList.contains('open'))return;
    const t=e.touches[0],c=chat();if(!c||!c.contains(e.target))return;
    // не мешаем горизонтальным штукам внутри чата (ползунки, прокрутка по горизонтали, меню)
    if(e.target.closest('input[type=range],.mx-row,.mx-chips,.st-bar,.ctx-menu,.emoji-panel,.cs-overlay,#callScreen'))return;
    x0=t.clientX;y0=t.clientY;dx=0;drag=true;locked=false;t0=Date.now();
  },{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!drag)return;
    const t=e.touches[0],ddx=t.clientX-x0,ddy=t.clientY-y0;
    if(!locked){
      if(Math.abs(ddy)>12&&Math.abs(ddy)>Math.abs(ddx)){drag=false;return;}   // вертикальная прокрутка — не наш жест
      if(ddx>14&&ddx>Math.abs(ddy)*1.4){locked=true;chat().classList.add('mnav-drag');sb().classList.add('mnav-drag');}
      else return;
    }
    dx=Math.max(0,ddx);
    const w=window.innerWidth,p=Math.min(1,dx/w);
    chat().style.transform='translateX('+dx+'px)';
    sb().style.transform='translateX('+(-25+25*p)+'%)';
    sb().style.setProperty('--mnav-dim',String(.45*(1-p)));
  },{passive:true});
  const end=()=>{
    if(!drag)return;drag=false;
    const c=chat(),s=sb();if(!c||!s)return;
    c.classList.remove('mnav-drag');s.classList.remove('mnav-drag');
    c.style.transform='';s.style.transform='';s.style.removeProperty('--mnav-dim');
    if(!locked)return;
    const fast=dx>50&&Date.now()-t0<250;
    if(dx>window.innerWidth*0.33||fast)backToList();
  };
  document.addEventListener('touchend',end,{passive:true});
  document.addEventListener('touchcancel',end,{passive:true});
})();
// назад к списку: подсветку «открытого» чата на телефоне не держим (как в Telegram)
{const f=backToList;backToList=function(){const r=f.apply(this,arguments);if(window.innerWidth<=640)document.querySelectorAll('.sb-item.active').forEach(el=>el.classList.remove('active'));return r;};}
