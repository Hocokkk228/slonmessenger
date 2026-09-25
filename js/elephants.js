// ════════════════════════════════════════
// ── ПАК «СЛОНИКИ»: свои анимированные эмодзи SLON ──
// Плюшевый серо-голубой слоник (розовые уши, шов на лбу, румянец) в разных
// эмоциях — как рофл-паки уточек в Telegram. Всё рисуется SVG, без картинок;
// анимации — CSS-классы el-* (style.css), в узоре профиля слоники статичные.
// ════════════════════════════════════════
const EL_C={body:'#9ea9d4',line:'#6f7aa8',ear:'#f4a9b8',blush:'#f59bb0',eye:'#1d2033',mouth:'#5a2236',tongue:'#ff7b93',white:'#fff'};
// id, подпись/поиск, глаза, рот, добавки, анимация всего слоника, цвет морды
const ELEPHANTS=[
  ['smile','улыбка smile','dot','smile','blush','bob'],
  ['grin','радость grin','happy','grin','blush','bob'],
  ['laugh','смех ржака хаха laugh','happyTear','laugh','','bounce'],
  ['rofl','ржу катаюсь rofl','happyTear','laugh','','roll'],
  ['sweat','неловко sweat','happy','grin','sweat','bob'],
  ['wink','подмигивание wink','wink','smile','blush','tilt'],
  ['blush','смущение blush','happy','smile','blush2','bob'],
  ['love','влюблён love','heart','smile','blush','pulse'],
  ['kiss','поцелуй kiss','wink','kiss','kissHeart','bob'],
  ['hugs','обнимашки hug','happy','smile','blush hug','bob'],
  ['halo','ангел halo','happy','smile','halo','float'],
  ['cool','крутой cool','shades','smirk','','bob'],
  ['nerd','ботан nerd','nerd','buck','','bob'],
  ['star','звезда star wow','star','grin','','bounce'],
  ['party','праздник party','happy','laugh','partyHat confetti','bounce'],
  ['think','думаю хм think','side','flat','thinkPaw','tilt'],
  ['smirk','ухмылка smirk','side','smirk','','bob'],
  ['neutral','норм нейтрально neutral','dot','flat','','bob'],
  ['eyeroll','закатил глаза eyeroll','up','flat','','bob'],
  ['sleep','сон спать sleep zzz','closed','o','zzz','float'],
  ['tired','устал tired','sleepy','frown','sweat','bob'],
  ['mask','маска болею mask','dot','none','mask','bob'],
  ['sick','тошнит sick','closed','wavy','','shiver','#a6cf7c'],
  ['hot','жара hot','sleepy','tongue','sweat sweat2','shiver','#f08a7e'],
  ['cold','холодно cold','wide','teeth','icicles','shiver','#8fcaf2'],
  ['dizzy','кружится dizzy','spiral','wavy','','wobble'],
  ['boom','взрыв мозга boom mind','big','o','boom','shake'],
  ['cowboy','ковбой cowboy','happy','grin','cowboy','bob'],
  ['sad','грусть sad','sad','frown','tear','bob'],
  ['cry','плачу cry','cry','wail','','shake'],
  ['plead','пожалуйста плиз plead','plead','frownSmall','','bob'],
  ['scream','ужас шок scream','big','scream','','shake','#b6c4ec'],
  ['shock','ого шок shock','wide','o','blush','bob'],
  ['angry','злой angry','angry','frown','steam','shake'],
  ['rage','бешенство rage','angry','grawlix','steam','shake','#e7736f'],
  ['devil','чертёнок devil','angry','smirk','horns','bob','#9a74d8'],
  ['skull','череп умер skull dead','skull','teeth','','shiver','#eceef5'],
  ['clown','клоун clown','clown','bigSmile','clownNose','bounce','#f3f3f7'],
  ['ghost','призрак ghost','big','o','ghost','float','#f4f5fb'],
  ['money','деньги money','money','tongue','','bounce'],
  ['tongue','язык tongue','dot','tongue','','bob'],
  ['crazy','безумный crazy','crazy','tongue','','wobble'],
  ['zip','молчу zip','dot','zip','','bob'],
  ['upside','перевёрнутый upside','dot','smile','','upside'],
  ['melt','таю melt','happy','smile','melt','bob'],
  ['like','лайк класс like','happy','smile','thumbUp','bob'],
  ['dislike','дизлайк dislike','sad','frown','thumbDown','bob'],
  ['wave','привет wave','happy','grin','wavePaw','bob'],
  ['pray','спасибо пожалуйста pray','closed','smile','pray','bob'],
  ['heart','сердце любовь heart','happy','smile','bigHeart','bob'],
  ['broken','разбитое сердце broken','sad','frown','brokenHeart','bob'],
  ['fire','огонь fire','happy','grin','fire','bob'],
  ['hundred','сто 100 hundred','happy','grin','hundred','bounce'],
  ['king','король король king','happy','smirk','crown','bob'],
  ['grad','выпускник grad','happy','smile','gradCap','bob'],
  ['coffee','кофе coffee','sleepy','smile','coffee','bob'],
  ['popper','хлопушка ура popper','happy','laugh','popper confetti','bounce'],
  ['cake','торт днюха cake','happy','grin','cake','bob'],
];
const _elMap={};for(const e of ELEPHANTS)_elMap[e[0]]=e;

// ── Детали ──
const _S=(d,c,w,x)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x||''}/>`;
const _elHeart=(x,y,s,c,cls)=>`<path class="${cls||''}" d="M${x} ${y+s*.9}C${x-s*1.9} ${y-s*.3} ${x-s} ${y-s*1.7} ${x} ${y-s*.55}C${x+s} ${y-s*1.7} ${x+s*1.9} ${y-s*.3} ${x} ${y+s*.9}z" fill="${c}"/>`;
function _elEyes(t){
  const E=EL_C.eye,L=[24.5,28],R=[39.5,28];
  const dot=(x,y,cls)=>`<g class="${cls||'el-blink'}"><ellipse cx="${x}" cy="${y}" rx="2.4" ry="2.9" fill="${E}"/><circle cx="${x+.8}" cy="${y-1}" r=".85" fill="#fff"/></g>`;
  const arc=(x,y)=>_S(`M${x-3} ${y+1}q3 -4 6 0`,E,1.9);
  const shut=(x,y)=>_S(`M${x-2.8} ${y}q2.8 2.2 5.6 0`,E,1.7);
  switch(t){
    case 'dot':return dot(...L)+dot(...R);
    case 'happy':return arc(...L)+arc(...R);
    case 'closed':return shut(...L)+shut(...R);
    case 'sleepy':return `<g>${_S('M21.8 28h5.4',E,1.7)+_S('M36.8 28h5.4',E,1.7)}<ellipse cx="24.5" cy="29.3" rx="2" ry="1.2" fill="${E}"/><ellipse cx="39.5" cy="29.3" rx="2" ry="1.2" fill="${E}"/></g>`;
    case 'wink':return arc(...L)+dot(...R);
    case 'happyTear':return arc(...L)+arc(...R)
      +`<path class="el-tear" d="M19.5 30.5q-1.6 2.6 0 3.4q1.6-.8 0-3.4z" fill="#69c2ff"/><path class="el-tear el-d2" d="M44.5 30.5q-1.6 2.6 0 3.4q1.6-.8 0-3.4z" fill="#69c2ff"/>`;
    case 'heart':return _elHeart(24.5,27,2.6,'#ff4d6d','el-beat')+_elHeart(39.5,27,2.6,'#ff4d6d','el-beat');
    case 'star':{const st=(x,y)=>`<path class="el-spin" d="M${x} ${y-4}l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" fill="#ffd23f" stroke="#e8a900" stroke-width=".5"/>`;return st(...L)+st(...R);}
    case 'x':return _S('M22 25.5l5 5M27 25.5l-5 5',E,1.8)+_S('M37 25.5l5 5M42 25.5l-5 5',E,1.8);
    case 'spiral':{const sp=(x,y)=>`<g class="el-spin"><path d="M${x} ${y}m0 0a.8 .8 0 1 1 1 .6a1.8 1.8 0 1 1-2.6-1.2a2.9 2.9 0 1 1 4.2 2.6" fill="none" stroke="${E}" stroke-width="1.1" stroke-linecap="round"/></g>`;return sp(...L)+sp(...R);}
    case 'big':return `<circle cx="24.5" cy="28" r="4.3" fill="#fff" stroke="${E}" stroke-width=".8"/><circle class="el-look" cx="24.5" cy="28" r="1.9" fill="${E}"/><circle cx="39.5" cy="28" r="4.3" fill="#fff" stroke="${E}" stroke-width=".8"/><circle class="el-look" cx="39.5" cy="28" r="1.9" fill="${E}"/>`;
    case 'wide':return `<circle cx="24.5" cy="28" r="3.4" fill="#fff" stroke="${E}" stroke-width=".7"/><circle cx="24.5" cy="28" r="1.1" fill="${E}"/><circle cx="39.5" cy="28" r="3.4" fill="#fff" stroke="${E}" stroke-width=".7"/><circle cx="39.5" cy="28" r="1.1" fill="${E}"/>`;
    case 'angry':return dot(...L)+dot(...R)+_S('M20.5 22.5l7 3',E,1.8)+_S('M43.5 22.5l-7 3',E,1.8);
    case 'sad':return dot(...L)+dot(...R)+_S('M21 24.5l6-2.2',E,1.6)+_S('M43 24.5l-6-2.2',E,1.6);
    case 'plead':return `<ellipse cx="24.5" cy="28.5" rx="3.6" ry="4" fill="${E}"/><circle cx="25.6" cy="27" r="1.3" fill="#fff"/><circle cx="23.5" cy="30" r=".6" fill="#fff"/><ellipse cx="39.5" cy="28.5" rx="3.6" ry="4" fill="${E}"/><circle cx="40.6" cy="27" r="1.3" fill="#fff"/><circle cx="38.5" cy="30" r=".6" fill="#fff"/>`
      +_S('M21 23.5l6-2',E,1.5)+_S('M43 23.5l-6-2',E,1.5);
    case 'side':return `<g class="el-look">${dot(26,28,'x')+dot(41,28,'x')}</g>`+_S('M21.5 25.2h6',EL_C.line,1.4)+_S('M36.5 25.2h6',EL_C.line,1.4);
    case 'up':return `<circle cx="24.5" cy="28" r="3.4" fill="#fff" stroke="${E}" stroke-width=".7"/><circle cx="24.5" cy="25.8" r="1.5" fill="${E}"/><circle cx="39.5" cy="28" r="3.4" fill="#fff" stroke="${E}" stroke-width=".7"/><circle cx="39.5" cy="25.8" r="1.5" fill="${E}"/>`;
    case 'shades':return `<path d="M18 24.5h28v1.5l-1.5 4.5q-.8 2.4-3.4 2.4h-3.6q-2.6 0-3.4-2.4l-1-3.1h-2.2l-1 3.1q-.8 2.4-3.4 2.4h-3.6q-2.6 0-3.4-2.4L18 26z" fill="#15161f"/>`+_S('M21 26.5l3 3M36 26.5l3 3','#fff',.9,' opacity=".6"');
    case 'nerd':return dot(...L)+dot(...R)+`<circle cx="24.5" cy="28" r="4.6" fill="none" stroke="${E}" stroke-width="1.5"/><circle cx="39.5" cy="28" r="4.6" fill="none" stroke="${E}" stroke-width="1.5"/>`+_S('M29.1 28h5.8',E,1.5);
    case 'money':return `<text x="24.5" y="31.5" font-size="9" font-weight="900" text-anchor="middle" fill="#27b35a" font-family="Arial">$</text><text x="39.5" y="31.5" font-size="9" font-weight="900" text-anchor="middle" fill="#27b35a" font-family="Arial">$</text>`;
    case 'crazy':return `<circle cx="24.5" cy="27.5" r="4.4" fill="#fff" stroke="${E}" stroke-width=".8"/><circle class="el-spin" cx="25.5" cy="27" r="1.9" fill="${E}"/>`+dot(39.5,28.5);
    case 'cry':return shut(...L)+shut(...R)
      +`<path class="el-stream" d="M22 30v14M42 30v14" stroke="#69c2ff" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 3"/>`;
    case 'skull':return `<ellipse cx="24.5" cy="28.5" rx="4" ry="4.4" fill="#2a2a35"/><ellipse cx="39.5" cy="28.5" rx="4" ry="4.4" fill="#2a2a35"/>`;
    case 'clown':return `<path d="M24.5 21.5l2 6.5-2 6.5-2-6.5z" fill="#4aa3ff" opacity=".7"/><path d="M39.5 21.5l2 6.5-2 6.5-2-6.5z" fill="#4aa3ff" opacity=".7"/>`+dot(...L)+dot(...R);
  }
  return dot(...L)+dot(...R);
}
function _elMouth(t){
  const E=EL_C.eye,M=EL_C.mouth;
  switch(t){
    case 'smile':return _S('M27.5 45.5q4.5 3.6 9 0',E,1.6);
    case 'bigSmile':return `<path d="M24.5 44q7.5 7 15 0q-7.5 4-15 0z" fill="#e8324d"/>`;
    case 'grin':return `<path d="M27 44.3h10q0 5.6-5 5.6t-5-5.6z" fill="${M}"/><path d="M28.3 44.3h7.4v1.4h-7.4z" fill="#fff"/><ellipse cx="32" cy="48.4" rx="2.6" ry="1.3" fill="${EL_C.tongue}"/>`;
    case 'laugh':return `<path class="el-jaw" d="M25.5 43.8h13q0 7.2-6.5 7.2t-6.5-7.2z" fill="${M}"/><path d="M27 43.8h10v1.6H27z" fill="#fff"/><ellipse cx="32" cy="49" rx="3.4" ry="1.6" fill="${EL_C.tongue}"/>`;
    case 'o':return `<ellipse class="el-breath" cx="32" cy="46.5" rx="2" ry="2.4" fill="${M}"/>`;
    case 'scream':return `<ellipse class="el-breath" cx="32" cy="47" rx="3.2" ry="4.6" fill="${M}"/>`;
    case 'frown':return _S('M28 48.5q4-3.6 8 0',E,1.6);
    case 'frownSmall':return _S('M29.5 47.5q2.5-2 5 0',E,1.5);
    case 'flat':return _S('M28.5 46.5h7',E,1.6);
    case 'wavy':return _S('M26.5 46.8q1.4-1.6 2.8 0t2.8 0t2.8 0t2.8 0',E,1.4);
    case 'tongue':return _S('M27.5 45.2q4.5 3.6 9 0',E,1.6)+`<path class="el-lick" d="M31.6 46.8q0 4.6 2.6 4.6t2.6-4.6z" fill="${EL_C.tongue}"/>`;
    case 'kiss':return _S('M31 44.2q2.4 1.1 0 2.2q2.4 1.1 0 2.2',E,1.5);
    case 'teeth':return `<rect x="26.5" y="44.3" width="11" height="4.6" rx="1.8" fill="#fff" stroke="${E}" stroke-width="1"/>`+_S('M26.8 46.6h10.4M30.2 44.4v4.4M33.8 44.4v4.4',E,.6);
    case 'smirk':return _S('M28.5 46.8q4.5 1.6 7.5-1.8',E,1.6);
    case 'buck':return _S('M27.5 45q4.5 3.6 9 0',E,1.6)+`<rect x="30.2" y="46.4" width="1.7" height="2.2" rx=".4" fill="#fff" stroke="${E}" stroke-width=".4"/><rect x="32.1" y="46.4" width="1.7" height="2.2" rx=".4" fill="#fff" stroke="${E}" stroke-width=".4"/>`;
    case 'zip':return _S('M26.5 46.5h11',E,1.3)+_S('M28 45.3v2.4M30 45.3v2.4M32 45.3v2.4M34 45.3v2.4M36 45.3v2.4',E,.8)+`<rect x="36.6" y="45" width="2.4" height="3.2" rx=".5" fill="#c9ced9" stroke="${E}" stroke-width=".5"/>`;
    case 'wail':return `<path class="el-jaw" d="M26.5 49.5q5.5-7.5 11 0z" fill="${M}"/>`;
    case 'grawlix':return `<rect class="el-shake2" x="24" y="43" width="16" height="7" rx="2" fill="#15161f"/><text x="32" y="48.4" font-size="5.4" font-weight="900" text-anchor="middle" fill="#ff4d4d" font-family="Arial">&amp;$!#%</text>`;
    case 'none':return '';
  }
  return _S('M27.5 45.5q4.5 3.6 9 0',E,1.6);
}
function _elExtra(t){
  const E=EL_C.eye;
  switch(t){
    case 'blush':return `<ellipse cx="21" cy="35.5" rx="3" ry="1.8" fill="${EL_C.blush}" opacity=".55"/><ellipse cx="43" cy="35.5" rx="3" ry="1.8" fill="${EL_C.blush}" opacity=".55"/>`;
    case 'blush2':return `<ellipse class="el-glow" cx="21" cy="35" rx="4" ry="2.4" fill="#ff6f8f" opacity=".7"/><ellipse class="el-glow" cx="43" cy="35" rx="4" ry="2.4" fill="#ff6f8f" opacity=".7"/>`;
    case 'sweat':return `<path class="el-drip" d="M46 17q-2.6 4 0 5.2q2.6-1.2 0-5.2z" fill="#69c2ff"/>`;
    case 'sweat2':return `<path class="el-drip el-d2" d="M18 18q-2.2 3.4 0 4.4q2.2-1 0-4.4z" fill="#69c2ff"/>`;
    case 'tear':return `<path class="el-tear" d="M21.5 31.5q-1.8 3 0 4q1.8-1 0-4z" fill="#69c2ff"/>`;
    case 'kissHeart':return _elHeart(44,43,2.4,'#ff4d6d','el-rise');
    case 'hug':return `<ellipse cx="17" cy="47" rx="5" ry="4" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/><ellipse cx="47" cy="47" rx="5" ry="4" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/>`;
    case 'halo':return `<ellipse class="el-hover" cx="32" cy="9" rx="10" ry="2.8" fill="none" stroke="#ffd23f" stroke-width="2.2"/>`;
    case 'partyHat':return `<g class="el-tilt2"><path d="M32 1l7 14H25z" fill="#8c6cff"/><path d="M28.6 9.2h6.8M26.8 12.8h10.4" stroke="#ffd23f" stroke-width="1.5"/><circle cx="32" cy="1.6" r="2" fill="#ff4d6d"/></g>`;
    case 'confetti':return `<rect class="el-conf" x="10" y="6" width="2" height="3" fill="#ff4d6d"/><rect class="el-conf el-d2" x="52" y="8" width="2" height="3" fill="#3ec1ff"/><rect class="el-conf el-d3" x="46" y="3" width="2" height="3" fill="#ffd23f"/><rect class="el-conf el-d4" x="16" y="2" width="2" height="3" fill="#48d07a"/>`;
    case 'thinkPaw':return `<g class="el-rub"><ellipse cx="37" cy="52" rx="5.6" ry="4.6" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/><circle cx="35" cy="51" r=".9" fill="${EL_C.ear}"/><circle cx="37.6" cy="50.3" r=".9" fill="${EL_C.ear}"/><circle cx="40" cy="51.3" r=".9" fill="${EL_C.ear}"/></g>`;
    case 'zzz':return `<text class="el-rise" x="46" y="16" font-size="7" font-weight="900" fill="#7a86b6" font-family="Arial">z</text><text class="el-rise el-d2" x="51" y="10" font-size="9" font-weight="900" fill="#7a86b6" font-family="Arial">Z</text>`;
    case 'mask':return `<path d="M17.5 38q14.5-5 29 0l-1 8q-13.5 7.5-27 0z" fill="#fff" stroke="#c9d0e2" stroke-width="1"/>`+_S('M21 41.5h22M22 44.5h20','#c9d0e2',.8)+_S('M17.5 38l-3-4M46.5 38l3-4','#c9d0e2',1);
    case 'icicles':return `<path d="M20 15.5l2 5 2-5M29 13.8l2 6 2-6M38 14.5l2 5.2 2-5.2" fill="#dff3ff" stroke="#8fcaf2" stroke-width=".6"/>`;
    case 'boom':return `<g class="el-puff"><circle cx="24" cy="10" r="6" fill="#d9dce6"/><circle cx="33" cy="7" r="7.5" fill="#e8eaf1"/><circle cx="42" cy="10" r="6" fill="#d9dce6"/><path d="M33 3l1.5 3.5 3.5.5-2.6 2.4.7 3.6-3.1-1.8-3.1 1.8.7-3.6-2.6-2.4 3.5-.5z" fill="#ff9f1c"/></g>`;
    case 'cowboy':return `<path d="M13 16q19 5 38 0q-3 3-8 3.6l-1.3-8q-.6-3-3.2-2.4L32 10.5l-6.5-1.3q-2.6-.6-3.2 2.4l-1.3 8q-5-.6-8-3.6z" fill="#b5773c" stroke="#7a4b22" stroke-width=".8"/>`;
    case 'steam':return `<g class="el-rise"><path d="M10 20q-2-2 0-4t0-4" fill="none" stroke="#d6d9e4" stroke-width="2" stroke-linecap="round"/></g><g class="el-rise el-d2"><path d="M54 20q2-2 0-4t0-4" fill="none" stroke="#d6d9e4" stroke-width="2" stroke-linecap="round"/></g>`;
    case 'horns':return `<path d="M20 17q-4-5-3-11q4 5 8 7z" fill="#5b2a8c"/><path d="M44 17q4-5 3-11q-4 5-8 7z" fill="#5b2a8c"/>`;
    case 'clownNose':return `<circle class="el-beat" cx="36.2" cy="40" r="3" fill="#ff3b4e"/><circle cx="35.3" cy="39.1" r=".9" fill="#fff" opacity=".7"/><path d="M14 16q-4-6 2-9q-1 5 4 6z" fill="#ff7a3d"/><path d="M50 16q4-6-2-9q1 5-4 6z" fill="#ff7a3d"/>`;
    case 'ghost':return '';
    case 'melt':return `<path class="el-melt" d="M20 46q0 6 2.4 6t2.4-4q0 7 3 7t3-5q0 4 2.4 4t2.4-5q0 6 2.8 6t2.4-6z" fill="${EL_C.body}"/>`;
    case 'thumbUp':return `<g class="el-pump"><rect x="42" y="44" width="11" height="10" rx="4" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/><rect x="44" y="36" width="4.4" height="10" rx="2.2" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/><circle cx="47" cy="50.5" r="1" fill="${EL_C.ear}"/></g>`;
    case 'thumbDown':return `<g class="el-pump2"><rect x="42" y="40" width="11" height="10" rx="4" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/><rect x="44" y="48" width="4.4" height="10" rx="2.2" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/></g>`;
    case 'wavePaw':return `<g class="el-waveP"><ellipse cx="50" cy="40" rx="5.4" ry="6.2" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/><circle cx="48" cy="37" r="1" fill="${EL_C.ear}"/><circle cx="50.5" cy="36.2" r="1" fill="${EL_C.ear}"/><circle cx="53" cy="37.4" r="1" fill="${EL_C.ear}"/><ellipse cx="50.4" cy="41.5" rx="2.2" ry="1.8" fill="${EL_C.ear}"/></g>`;
    case 'pray':return `<g class="el-bob2"><path d="M28 60q-2-10 4-16q6 6 4 16z" fill="${EL_C.body}" stroke="${EL_C.line}" stroke-width="1"/><path d="M32 45v14" stroke="${EL_C.line}" stroke-width="1"/></g><path class="el-spark" d="M20 50l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#ffd23f"/>`;
    case 'bigHeart':return _elHeart(32,52,5,'#ff4d6d','el-beat');
    case 'brokenHeart':return `<g class="el-split">${_elHeart(32,52,5,'#c9283f')}<path d="M32 46.5l-1.5 2.5 2.5 2-1.5 3" fill="none" stroke="#fff" stroke-width="1.2"/></g>`;
    case 'fire':return `<g class="el-flick"><path d="M32 0q9 7 7 15q-2 4-7 4t-7-4q-1-6 4-9q0 4 2 5q3-5 1-11z" fill="#ff7a1a"/><path d="M32 8q5 4 3.6 8.4q-1 2-3.6 2t-3.6-2q-.6-3 1.8-4.6q0 2 1 2.6q1.8-2.6.8-6.4z" fill="#ffd23f"/></g>`;
    case 'hundred':return `<g class="el-tilt2"><text x="49" y="16" font-size="11" font-weight="900" text-anchor="middle" fill="#ff2e4d" font-family="Arial" font-style="italic">100</text>${_S('M42 18.4h14M43 20.6h12','#ff2e4d',1.2)}</g>`;
    case 'crown':return `<path class="el-hover" d="M21 15l3-9 5 6 3-8 3 8 5-6 3 9z" fill="#ffc83d" stroke="#d99a00" stroke-width=".8"/>`;
    case 'gradCap':return `<g class="el-tilt2"><path d="M32 4l17 6-17 6-17-6z" fill="#23263a"/><path d="M24 13v4q8 4 16 0v-4" fill="#23263a"/><path d="M47 10.5v7" stroke="#ffd23f" stroke-width="1.2"/><circle cx="47" cy="18" r="1.3" fill="#ffd23f"/></g>`;
    case 'coffee':return `<g class="el-bob2"><path d="M10 44h11l-1.4 9q-.3 2-2.3 2h-3.6q-2 0-2.3-2z" fill="#fff" stroke="#c2c7d6" stroke-width=".8"/><path d="M21 46q4 0 3 3.4t-4 2" fill="none" stroke="#c2c7d6" stroke-width="1.2"/><ellipse cx="15.5" cy="44.4" rx="5.2" ry="1.2" fill="#7a4b22"/></g><path class="el-rise" d="M14 40q-1.5-2 0-4" fill="none" stroke="#c9ced9" stroke-width="1.2" stroke-linecap="round"/>`;
    case 'popper':return `<g class="el-pump"><path d="M44 58l6-16 8 8z" fill="#ffc83d" stroke="#d99a00" stroke-width=".8"/>${_S('M46 51l5 3M47.5 46.5l6 4','#ff4d6d',1.2)}</g>`;
    case 'cake':return `<g class="el-bob2"><rect x="22" y="50" width="20" height="9" rx="2" fill="#f7c6d4" stroke="#e59ab2" stroke-width=".8"/><path d="M22 53q2.5 2 5 0t5 0t5 0t5 0" fill="none" stroke="#fff" stroke-width="1.4"/><rect x="31.3" y="44.5" width="1.4" height="5.5" fill="#8fd3ff"/></g><path class="el-flick" d="M32 41q2 2 0 3.6q-2-1.6 0-3.6z" fill="#ffb31a"/>`;
  }
  return '';
}
// Сам слоник (viewBox 64×64). opts.flat — без анимационных классов не надо, просто статичная картинка
function elSvgInner(id){
  const s=_elMap[id];if(!s)return '';
  const [,,eyes,mouth,extra,,face]=s;
  const B=face||EL_C.body,Ln=EL_C.line,ghost=extra.includes('ghost');
  const ex=extra.split(' ').filter(Boolean);
  const back=ex.filter(x=>['halo','crown','partyHat','cowboy','horns','fire','boom','gradCap','icicles'].includes(x)).map(_elExtra).join('');
  const front=ex.filter(x=>!['halo','crown','partyHat','cowboy','horns','fire','boom','gradCap','icicles','mask','melt'].includes(x)).map(_elExtra).join('');
  const over=ex.filter(x=>x==='mask'||x==='melt').map(_elExtra).join('');
  const ears=ghost?'':`<g class="el-earL"><ellipse cx="12.5" cy="30" rx="11" ry="13.5" transform="rotate(-14 12.5 30)" fill="${B}" stroke="${Ln}" stroke-width="1.2"/><ellipse cx="13.5" cy="31" rx="6.6" ry="9.4" transform="rotate(-14 13.5 31)" fill="${EL_C.ear}"/></g>`
    +`<g class="el-earR"><ellipse cx="51.5" cy="30" rx="11" ry="13.5" transform="rotate(14 51.5 30)" fill="${B}" stroke="${Ln}" stroke-width="1.2"/><ellipse cx="50.5" cy="31" rx="6.6" ry="9.4" transform="rotate(14 50.5 31)" fill="${EL_C.ear}"/></g>`;
  const head=ghost
    ?`<path d="M13 32q0-19 19-19t19 19v20q-3 3-5 0t-4.6 0-4.7 0-4.7 0-4.6 0-5 0q-2 3-5 0z" fill="${B}" stroke="#cfd4e6" stroke-width="1.2" opacity=".96"/>`
    :`<ellipse cx="32" cy="32" rx="19" ry="18" fill="${B}" stroke="${Ln}" stroke-width="1.2"/><ellipse cx="32" cy="38" rx="11" ry="7" fill="#fff" opacity=".12"/>`
      +`<path d="M32 14.8v7.5" stroke="${Ln}" stroke-width="1" stroke-dasharray="1.5 1.7" opacity=".8"/>`;
  const trunk=ghost||eyes==='skull'?(eyes==='skull'?`<path d="M30.4 34l1.6 3 1.6-3z" fill="#2a2a35"/>`:'')
    :`<g class="el-trunk"><path d="M32 31.5c-.4 4 0 7.2 1.8 8.8c1.6 1.3 3.5.6 3.3-1" fill="none" stroke="${Ln}" stroke-width="7.6" stroke-linecap="round"/><path d="M32 31.5c-.4 4 0 7.2 1.8 8.8c1.6 1.3 3.5.6 3.3-1" fill="none" stroke="${B}" stroke-width="5.4" stroke-linecap="round"/>${_S('M30.2 35.6h3.2M30.6 38.2h3',Ln,.6,' opacity=".6"')}</g>`;
  return `<g class="el-all">${back}${ears}${head}${_elEyes(eyes)}${trunk}${_elMouth(mouth)}${front}${over}</g>`;
}
const _elCache={};
function elSvg(id){
  if(_elCache[id])return _elCache[id];
  const s=_elMap[id];if(!s)return '';
  return _elCache[id]=`<svg class="el el-a-${s[5]}" viewBox="0 0 64 64" aria-hidden="true">${elSvgInner(id)}</svg>`;
}
