// ════════ Стена профиля (как в ВК) ════════
// Посты владельца, по желанию — и гостей. Сервер: /wall, /wall/post, /wall/delete, /wall/like, /wall/cfg, /wall/presign
const _WALL_SVG={
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.5 3.7 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>',
  send:'<svg viewBox="0 0 24 24"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9z"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4L12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg>'
};
const _wall={};           // owner → {posts, who, more, busy}
let _wallPhoto=null;      // {owner, blob, url} — картинка, выбранная для нового поста

function _wallBox(owner){return document.getElementById('pxWall_'+owner);}
function _wallAv(u){
  const src=u===myUsername?myAvatar:peerAvatars[u];
  const nm=u===myUsername?(myNick||u):(peerNames[u]||u);
  return _spAvatarHtml(src,nm,'wall-av',u);
}
function _wallName(u){return esc(u===myUsername?(typeof _myFullName==='function'&&_myFullName().trim()||myNick||('@'+u)):(peerNames[u]||('@'+u)));}
function _wallDate(ts){
  const d=new Date(ts),n=new Date(),t=d.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
  if(d.toDateString()===n.toDateString())return 'сегодня в '+t;
  const y=new Date(n);y.setDate(n.getDate()-1);if(d.toDateString()===y.toDateString())return 'вчера в '+t;
  return d.toLocaleDateString('ru',{day:'numeric',month:'long',...(d.getFullYear()!==n.getFullYear()?{year:'numeric'}:{})})+' в '+t;
}

async function _wallLoad(owner,more){
  const box=_wallBox(owner);if(!box)return;
  const st=_wall[owner]=_wall[owner]||{posts:[],who:'me',more:false};
  if(st.busy)return;st.busy=true;
  if(!more&&!st.posts.length)box.innerHTML=_wallComposer(owner)+'<div class="px-gift-hint">Загрузка…</div>';
  try{
    const before=more&&st.posts.length?st.posts[st.posts.length-1].id:'';
    const d=await api('/wall?u='+encodeURIComponent(owner)+(before?'&before='+encodeURIComponent(before):''));
    st.who=d.who||'me';st.more=!!d.more;
    st.posts=more?st.posts.concat(d.posts||[]):(d.posts||[]);
  }catch(e){if(!st.posts.length){st.busy=false;box.innerHTML='<div class="px-gift-hint">Не удалось загрузить стену</div>';return;}}
  st.busy=false;_wallPaint(owner);
}
function _wallCanPost(owner){return !!myUsername&&(owner===myUsername||_wall[owner]?.who==='all');}
function _wallComposer(owner){
  if(!_wallCanPost(owner))return '';
  const mine=owner===myUsername,who=_wall[owner]?.who||'me';
  const ph=_wallPhoto&&_wallPhoto.owner===owner?_wallPhoto:null;
  return `<div class="wall-new" data-owner="${esc(owner)}">
    <div class="wall-new-row">${_wallAv(myUsername)}<textarea class="wall-in" rows="1" maxlength="2000" placeholder="${mine?'Что у тебя нового?':'Напиши что-нибудь…'}" oninput="_wallGrow(this)"></textarea></div>
    ${ph?`<div class="wall-new-ph"><img src="${ph.url}" alt=""><button onclick="_wallPhotoDrop('${esc(owner)}')" title="Убрать">${_WALL_SVG.x}</button></div>`:''}
    <div class="wall-new-bar">
      <label class="wall-ib" title="Фото">${_ico('image')}<input type="file" accept="image/*" hidden onchange="_wallPhotoPick(this,'${esc(owner)}')"></label>
      ${mine?`<button class="wall-who" onclick="_wallWho()" title="Кто может писать на стене">${who==='all'?'Писать могут все':'Писать могу только я'}</button>`:''}
      <button class="wall-send" onclick="_wallPost('${esc(owner)}',this)">${_WALL_SVG.send}</button>
    </div></div>`;
}
function _wallPaint(owner){
  const box=_wallBox(owner);if(!box)return;
  const st=_wall[owner];if(!st)return;
  const draft=box.querySelector('.wall-in')?.value||'';
  const posts=st.posts.map(p=>_wallPostHtml(owner,p)).join('');
  box.innerHTML=_wallComposer(owner)+(posts||`<div class="px-gift-hint">${owner===myUsername?'На стене пока пусто — напиши первый пост.':'На стене пока нет записей.'}</div>`)
    +(st.more?`<button class="wal-link" onclick="_wallLoad('${esc(owner)}',true)">Показать ещё</button>`:'');
  const inp=box.querySelector('.wall-in');if(inp&&draft){inp.value=draft;_wallGrow(inp);}
}
function _wallPostHtml(owner,p){
  const canDel=p.author===myUsername||owner===myUsername;
  const click=p.author!==myUsername?` onclick="showPeerProfile('${esc(p.author)}')"`:'';
  return `<div class="wall-post" data-id="${esc(p.id)}">
    <div class="wall-hd"><span class="wall-hd-av"${click}>${_wallAv(p.author)}</span>
      <div class="wall-hd-t"><b${click}>${_wallName(p.author)}</b><span>${_wallDate(p.ts)}</span></div>
      ${canDel?`<button class="wall-del" title="Удалить" onclick="_wallDel('${esc(owner)}','${esc(p.id)}')">${_WALL_SVG.trash}</button>`:''}</div>
    ${p.text?`<div class="wall-tx">${linkify(p.text)}</div>`:''}
    ${p.photo?`<img class="wall-ph" src="${esc(p.photo)}" alt="" loading="lazy" onclick="_wallPhotoView(this.src)">`:''}
    <div class="wall-ft"><button class="wall-like${p.liked?' on':''}" onclick="_wallLike('${esc(owner)}','${esc(p.id)}',this)">${_WALL_SVG.heart}<span>${p.likes||''}</span></button></div>
  </div>`;
}
function _wallGrow(t){t.style.height='auto';t.style.height=Math.min(t.scrollHeight,240)+'px';}

// ── картинка к посту: ужимаем до 1600px JPEG ──
function _wallJpeg(file){
  return new Promise((res,rej)=>{
    const img=new Image(),u=URL.createObjectURL(file);
    img.onload=()=>{const k=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');
      c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error('Не удалось обработать картинку')),'image/jpeg',.86);};
    img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Это не картинка'));};
    img.src=u;
  });
}
async function _wallPhotoPick(inp,owner){
  const f=inp.files&&inp.files[0];inp.value='';if(!f)return;
  try{const blob=await _wallJpeg(f);if(_wallPhoto)URL.revokeObjectURL(_wallPhoto.url);_wallPhoto={owner,blob,url:URL.createObjectURL(blob)};_wallPaint(owner);}
  catch(e){toast(e.message);}
}
function _wallPhotoDrop(owner){if(_wallPhoto)URL.revokeObjectURL(_wallPhoto.url);_wallPhoto=null;_wallPaint(owner);}
function _wallPhotoView(src){
  const v=document.createElement('div');v.className='wall-view';v.innerHTML=`<img src="${esc(src)}" alt="">`;
  v.onclick=()=>v.remove();document.body.appendChild(v);
}

async function _wallPost(owner,btn){
  const box=_wallBox(owner),inp=box?.querySelector('.wall-in');
  const text=(inp?.value||'').trim(),ph=_wallPhoto&&_wallPhoto.owner===owner?_wallPhoto:null;
  if(!text&&!ph){inp?.focus();return;}
  if(btn.classList.contains('busy'))return;btn.classList.add('busy');
  try{
    let photo='';
    if(ph){const d=await api('/wall/presign',{size:ph.blob.size});await _pxPut(d.put,ph.blob);photo=d.url;}
    const d=await api('/wall/post',{owner,text,photo});
    if(ph){URL.revokeObjectURL(ph.url);_wallPhoto=null;}
    if(inp)inp.value='';
    const st=_wall[owner]=_wall[owner]||{posts:[],who:'me'};st.posts.unshift(d.post);
    _wallPaint(owner);
  }catch(e){toast(e.message||'Не удалось опубликовать');}
  btn.classList.remove('busy');
}
async function _wallDel(owner,id){
  if(!confirm('Удалить запись со стены?'))return;
  try{await api('/wall/delete',{owner,id});const st=_wall[owner];if(st)st.posts=st.posts.filter(p=>p.id!==id);_wallPaint(owner);}
  catch(e){toast(e.message||'Не удалось удалить');}
}
async function _wallLike(owner,id,btn){
  if(!myUsername)return;
  const p=_wall[owner]?.posts.find(x=>x.id===id);if(!p)return;
  const on=!p.liked;p.liked=on;p.likes=Math.max(0,(p.likes||0)+(on?1:-1));   // сразу, не дожидаясь сервера
  btn.classList.toggle('on',on);btn.querySelector('span').textContent=p.likes||'';
  if(on){btn.classList.remove('pop');void btn.offsetWidth;btn.classList.add('pop');}
  try{const d=await api('/wall/like',{owner,id,on});p.likes=d.likes;btn.querySelector('span').textContent=d.likes||'';}
  catch(e){p.liked=!on;p.likes=Math.max(0,p.likes+(on?-1:1));btn.classList.toggle('on',!on);btn.querySelector('span').textContent=p.likes||'';toast(e.message);}
}
async function _wallWho(){
  const st=_wall[myUsername]=_wall[myUsername]||{posts:[],who:'me'};
  const who=st.who==='all'?'me':'all';
  try{await api('/wall/cfg',{who});st.who=who;_wallPaint(myUsername);toast(who==='all'?'Теперь на твоей стене могут писать все':'Теперь на стене пишешь только ты');}
  catch(e){toast(e.message);}
}

// кто-то написал на моей стене
{const f=_handleIncoming;_handleIncoming=function(pid,payload){
  if(payload&&payload.type==='wall_new'){
    toast((peerNames[pid]||('@'+pid))+' написал(а) на твоей стене');
    if(_wall[myUsername]){_wall[myUsername].posts=[];_wallLoad(myUsername);}
    return;
  }
  return f.apply(this,arguments);
};}
