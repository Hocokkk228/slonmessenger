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
  const dot=(x,y,cls)=>`<g class="${cls||'el-blink'}"><ellipse cx="${x}" cy="${y}" rx="2.9" ry="3.5" fill="url(#elEye)"/><ellipse cx="${x+1}" cy="${y-1.3}" rx="1.15" ry="1.3" fill="#fff"/><circle cx="${x-.9}" cy="${y+1.5}" r=".5" fill="#fff" opacity=".8"/></g>`;
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
    case 'up':return `<circle cx="24.5" cy="28" r="3.4" fill="#fff" stroke="${E}" stroke-width=".7"/><circle class="el-pupil" cx="24.5" cy="25.8" r="1.5" fill="${E}"/><circle cx="39.5" cy="28" r="3.4" fill="#fff" stroke="${E}" stroke-width=".7"/><circle class="el-pupil" cx="39.5" cy="25.8" r="1.5" fill="${E}"/>`;
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
    case 'zip':return _S('M26.5 46.5h11',E,1.3)+_S('M28 45.3v2.4M30 45.3v2.4M32 45.3v2.4M34 45.3v2.4M36 45.3v2.4',E,.8)+`<rect class="el-zipper" x="36.6" y="45" width="2.4" height="3.2" rx=".5" fill="#c9ced9" stroke="${E}" stroke-width=".5"/>`;
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
// Сам слоник (viewBox 64×64): объём как у уточек — градиенты, блики, мягкие тени
const _elMix=(hex,t,to)=>{const n=parseInt(hex.slice(1),16),c=[n>>16,(n>>8)&255,n&255],o=to==='w'?255:0;
  return '#'+c.map(v=>Math.round(v+(o-v)*t).toString(16).padStart(2,'0')).join('');};
const _elKey=c=>c.slice(1);
const _elColors=[...new Set([EL_C.body,...ELEPHANTS.map(e=>e[6]).filter(Boolean)])];
function elDefsStr(){
  let d=`<radialGradient id="elEye" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#4b5170"/><stop offset=".6" stop-color="#15172a"/><stop offset="1" stop-color="#05060c"/></radialGradient>`
   +`<radialGradient id="elHi"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`
   +`<radialGradient id="elPink" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#ffd3dc"/><stop offset=".6" stop-color="#f4a0b3"/><stop offset="1" stop-color="#d9738d"/></radialGradient>`
   +`<radialGradient id="elBlushG"><stop offset="0" stop-color="#ff7f9f" stop-opacity=".75"/><stop offset="1" stop-color="#ff7f9f" stop-opacity="0"/></radialGradient>`;
  for(const c of _elColors){const k=_elKey(c);
    d+=`<radialGradient id="elB${k}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${_elMix(c,.45,'w')}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${_elMix(c,.32,'b')}"/></radialGradient>`
      +`<linearGradient id="elT${k}" x1="0" x2="1"><stop offset="0" stop-color="${_elMix(c,.18,'b')}"/><stop offset=".45" stop-color="${_elMix(c,.25,'w')}"/><stop offset="1" stop-color="${_elMix(c,.3,'b')}"/></linearGradient>`;}
  return d;
}
function elSvgInner(id){
  const s=_elMap[id];if(!s)return '';
  const [,,eyes,mouth,extra,,face]=s;
  const B=face||EL_C.body,k=_elKey(B),G=`url(#elB${k})`,Ln=_elMix(B,.4,'b'),ghost=extra.includes('ghost');
  const ex=extra.split(' ').filter(Boolean);
  const TOP=['halo','crown','partyHat','cowboy','horns','fire','boom','gradCap','icicles'];
  const back=ex.filter(x=>TOP.includes(x)).map(_elExtra).join('');
  const front=ex.filter(x=>!TOP.includes(x)&&x!=='mask'&&x!=='melt').map(_elExtra).join('');
  const over=ex.filter(x=>x==='mask'||x==='melt').map(_elExtra).join('');
  const ear=(cx,rot,icx)=>`<ellipse cx="${cx}" cy="30" rx="11" ry="13.5" transform="rotate(${rot} ${cx} 30)" fill="${G}" stroke="${Ln}" stroke-width=".7" stroke-opacity=".6"/>`
    +`<ellipse cx="${icx}" cy="31" rx="6.6" ry="9.4" transform="rotate(${rot} ${icx} 31)" fill="url(#elPink)"/>`
    +`<ellipse cx="${cx+(rot<0?-3:3)}" cy="22" rx="3.2" ry="2" transform="rotate(${rot} ${cx} 22)" fill="url(#elHi)" opacity=".7"/>`;
  const ears=ghost?'':`<g class="el-earL">${ear(12.5,-14,13.5)}</g><g class="el-earR">${ear(51.5,14,50.5)}</g>`;
  const head=ghost
    ?`<path d="M13 32q0-19 19-19t19 19v20q-3 3-5 0t-4.6 0-4.7 0-4.7 0-4.6 0-5 0q-2 3-5 0z" fill="${G}" stroke="#cfd4e6" stroke-width=".8" opacity=".96"/><ellipse cx="25" cy="21" rx="7" ry="4.5" fill="url(#elHi)" transform="rotate(-20 25 21)"/>`
    :`<ellipse cx="32" cy="32" rx="19" ry="18" fill="${G}" stroke="${Ln}" stroke-width=".7" stroke-opacity=".6"/>`
      +`<ellipse cx="25" cy="21" rx="8.5" ry="5" fill="url(#elHi)" transform="rotate(-22 25 21)"/>`
      +`<path d="M32 14.8v7.5" stroke="${Ln}" stroke-width=".9" stroke-dasharray="1.5 1.7" opacity=".7"/>`
      +`<circle cx="20.5" cy="36.5" r="4.2" fill="url(#elBlushG)"/><circle cx="43.5" cy="36.5" r="4.2" fill="url(#elBlushG)"/>`;
  const tp='M32 31.5c-.4 4 0 7.2 1.8 8.8c1.6 1.3 3.5.6 3.3-1';
  const trunk=ghost||eyes==='skull'?(eyes==='skull'?`<path d="M30.4 34l1.6 3 1.6-3z" fill="#2a2a35"/>`:'')
    :`<g class="el-trunk"><path d="${tp}" fill="none" stroke="${Ln}" stroke-opacity=".7" stroke-width="7.2" stroke-linecap="round"/><path d="${tp}" fill="none" stroke="url(#elT${k})" stroke-width="5.8" stroke-linecap="round"/>`
      +`<path d="M31.2 32.5c-.2 3 .1 5.2 1.3 6.6" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/>${_S('M30.4 36h3M30.8 38.4h2.8',Ln,.6,' opacity=".5"')}</g>`;
  return `<g class="el-all"><g class="el-top">${back}</g>${ears}<g class="el-head">${head}<g class="el-eyes">${_elEyes(eyes)}</g>${trunk}<g class="el-mouth">${_elMouth(mouth)}</g></g><g class="el-front">${front}</g><g class="el-over">${over}</g></g>`;
}
const _elCache={};
function elSvg(id){
  if(_elCache[id])return _elCache[id];
  const s=_elMap[id];if(!s)return '';
  return _elCache[id]=`<svg class="el el-i-${id}" viewBox="0 0 64 64" aria-hidden="true">${elSvgInner(id)}</svg>`;
}

// ── Анимации: у каждого — тело + уши + хобот + глаза + рот, каждое своим ритмом ──
const EK={
  // тело
  hop:'0%,70%,100%{transform:none}12%{transform:translateY(1px) scale(1.12,.86)}30%{transform:translateY(-8px) scale(.9,1.12)}46%{transform:translateY(0) scale(1.14,.84)}56%{transform:scale(.96,1.05)}64%{transform:scale(1.02,.98)}',
  hop2:'0%,100%{transform:none}8%{transform:translateY(1px) scale(1.1,.88)}20%{transform:translateY(-6px) scale(.92,1.1)}32%{transform:scale(1.12,.86)}44%{transform:translateY(-4px) scale(.95,1.06)}56%{transform:scale(1.08,.92)}66%{transform:none}',
  nod:'0%,100%{transform:none}20%{transform:rotate(-6deg) translateY(-1.5px)}45%{transform:rotate(4deg) translateY(1px) scale(1.03,.97)}70%{transform:rotate(-2deg)}',
  lean:'0%,100%{transform:none}40%,70%{transform:rotate(10deg) translateX(2px) scale(1.04)}',
  tilt:'0%,100%{transform:rotate(-4deg)}50%{transform:rotate(-14deg) translateX(-1.5px)}',
  sway:'0%,100%{transform:rotate(-9deg) translateX(-1.5px)}50%{transform:rotate(9deg) translateX(1.5px) translateY(-1.5px)}',
  dance:'0%,100%{transform:translateX(-3px) rotate(-14deg) scale(1.04,.96)}25%{transform:translateY(-4px) scale(.96,1.06)}50%{transform:translateX(3px) rotate(14deg) scale(1.04,.96)}75%{transform:translateY(-4px) scale(.96,1.06)}',
  laugh:'0%,100%{transform:rotate(-8deg) translateY(0) scale(1.03,.97)}50%{transform:rotate(-13deg) translateY(-3.5px) scale(.97,1.05)}',
  roll:'0%,100%{transform:translateX(-5px) rotate(-50deg)}50%{transform:translateX(5px) rotate(50deg) translateY(-2px)}',
  flip:'0%,55%,100%{transform:none}10%{transform:translateY(1px) scale(1.12,.86)}28%{transform:translateY(-9px) rotate(180deg) scale(.9)}44%{transform:translateY(0) rotate(360deg) scale(1.12,.86)}50%{transform:rotate(360deg)}',
  spin:'0%,50%,100%{transform:none}60%{transform:translateY(-6px) rotate(-180deg) scale(1.06)}78%{transform:translateY(0) rotate(-360deg) scale(1.12,.88)}86%{transform:rotate(-360deg)}',
  float:'0%,100%{transform:translateY(1.5px) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}',
  beat:'0%,100%{transform:scale(1)}14%{transform:scale(1.14)}28%{transform:scale(1)}42%{transform:scale(1.1)}70%{transform:scale(1)}',
  shrink:'0%,12%,88%,100%{transform:none}30%,72%{transform:scale(.86) translateY(3px) rotate(-8deg)}',
  kiss:'0%,15%,70%,100%{transform:none}30%,55%{transform:scale(1.18) translateY(1px) rotate(4deg)}',
  squeeze:'0%,100%{transform:none}35%,60%{transform:scale(1.1,.9)}45%{transform:scale(1.14,.86)}',
  proud:'0%,100%{transform:none}35%,75%{transform:rotate(-9deg) translateY(-2.5px) scale(1.06)}',
  bow:'0%,12%,70%,100%{transform:none}32%,50%{transform:rotate(18deg) translateY(4px) scale(.94)}',
  recoil:'0%,35%,100%{transform:none}6%{transform:translateX(-4px) rotate(-12deg) scale(1.08,.92)}16%{transform:translateX(1px) rotate(3deg)}',
  jolt:'0%,45%,100%{transform:none}8%{transform:scale(.78) translateY(5px)}20%{transform:scale(1.16,1.1) translateY(-5px)}32%{transform:scale(.97)}',
  inflate:'0%{transform:scale(1)}38%{transform:scale(1.24,1.2)}42%{transform:scale(1.26,1.18) rotate(3deg)}45%{transform:scale(1.26,1.2) rotate(-3deg)}48%{transform:scale(.86)}58%{transform:scale(1.05)}66%,100%{transform:scale(1)}',
  melt:'0%,20%,100%{transform:none}70%,85%{transform:translateY(6px) scale(1.12,.78)}',
  sob:'0%,100%{transform:translateY(0) scale(1)}20%{transform:translateY(-2.5px) scale(.97,1.04)}40%{transform:translateY(0) scale(1.03,.97)}60%{transform:translateY(-2px)}',
  rage:'0%,100%{transform:scale(1) rotate(0)}10%{transform:scale(1.1) rotate(-6deg)}20%{transform:scale(1.04) rotate(6deg)}30%{transform:scale(1.12) rotate(-5deg)}40%{transform:scale(1.02) rotate(4deg)}55%{transform:scale(1.14)}70%{transform:scale(1)}',
  fume:'0%,45%,100%{transform:none}50%{transform:scale(1.08,.94) translateY(1px)}55%{transform:translateX(-2px) scale(1.08,.94)}60%{transform:translateX(2px) scale(1.08,.94)}65%{transform:translateX(-2px) scale(1.06)}70%{transform:translateX(2px)}80%{transform:none}',
  shiver:'0%,100%{transform:translateX(-1px) scale(.97,1.02)}50%{transform:translateX(1px) scale(.97,1.02)}',
  orbit:'0%,100%{transform:translate(3px,0) rotate(8deg)}25%{transform:translate(0,3px) rotate(0)}50%{transform:translate(-3px,0) rotate(-8deg)}75%{transform:translate(0,-3px) rotate(0)}',
  upside:'0%,25%{transform:rotate(0)}40%{transform:rotate(200deg) scale(1.08)}48%,75%{transform:rotate(180deg)}90%{transform:rotate(380deg) scale(1.08)}100%{transform:rotate(360deg)}',
  stare:'0%,55%,100%{transform:none}62%,90%{transform:scale(1.22) translateY(1px)}',
  cough:'0%,50%,100%{transform:none}56%{transform:translateY(-3px) scale(1.1,.92) rotate(-4deg)}62%{transform:scale(.97,1.03)}70%{transform:translateY(-3px) scale(1.1,.92) rotate(4deg)}78%{transform:none}',
  headbang:'0%,100%{transform:rotate(-4deg) translateY(-1px)}45%{transform:rotate(16deg) translateY(3px) scale(1.04,.96)}',
  sigh:'0%,100%{transform:none}30%{transform:scale(1.06,1.03) translateY(-1.5px) rotate(-5deg)}65%{transform:scale(.96,.98) translateY(1.5px)}',
  evil:'0%,100%{transform:rotate(-3deg)}20%{transform:rotate(-12deg) translateY(-2px) scale(1.04)}28%,44%,60%{transform:rotate(-12deg) translateY(.5px)}36%,52%{transform:rotate(-12deg) translateY(-1.5px)}',
  crazy:'0%,100%{transform:rotate(-12deg) translate(-2px,1px)}15%{transform:rotate(10deg) translate(2px,-3px) scale(1.08)}30%{transform:rotate(-4deg) translate(-1px,-4px) scale(.92,1.08)}50%{transform:rotate(14deg) translate(3px,2px)}70%{transform:rotate(-8deg) translate(0,-1px) scale(1.1,.9)}85%{transform:rotate(6deg) translate(-2px,0)}',
  ghost:'0%,100%{transform:translate(-3px,1px) rotate(-5deg);opacity:1}50%{transform:translate(3px,-4px) rotate(5deg);opacity:.4}',
  sleep:'0%{transform:none}65%{transform:rotate(16deg) translateY(3px) scale(1.03)}74%{transform:rotate(18deg) translateY(3.5px)}78%{transform:rotate(-6deg) translateY(-2px) scale(1.05)}86%,100%{transform:none}',
  tired:'0%,10%,100%{transform:none}60%,85%{transform:translateY(5px) scale(1.04,.9) rotate(5deg)}',
  no:'0%,62%,100%{transform:none}8%,32%,54%{transform:rotate(-12deg) translateX(-1px)}20%,44%{transform:rotate(12deg) translateX(1px)}',
  heat:'0%,100%{transform:skewX(-7deg)}50%{transform:skewX(7deg) scale(1.03,.94) translateY(1px)}',
  scream:'0%,100%{transform:none}12%{transform:scale(1.1,.88)}24%{transform:scale(.88,1.2) translateY(-3px)}28%{transform:scale(.88,1.2) translate(-1.5px,-3px)}32%{transform:scale(.88,1.2) translate(1.5px,-3px)}36%{transform:scale(.88,1.2) translate(-1.5px,-3px)}40%,60%{transform:scale(.88,1.2) translateY(-3px)}72%{transform:scale(1.05,.95)}82%{transform:none}',
  sip:'0%,20%,75%,100%{transform:none}40%,60%{transform:rotate(-10deg) translateY(-1px)}',
  wiggle:'0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg) scale(1.03,.97)}75%{transform:rotate(7deg) scale(1.03,.97)}',
  impact:'0%,12%,34%,100%{transform:none}16%{transform:scale(1.14,.84) translateY(2px)}24%{transform:scale(.96,1.05)}',
  // уши (L — левое, R — правое)
  fL:'0%,100%{transform:rotate(0)}50%{transform:rotate(-24deg) scale(.95,1.05)}',
  fR:'0%,100%{transform:rotate(0)}50%{transform:rotate(24deg) scale(.95,1.05)}',
  slowL:'0%,100%{transform:rotate(3deg)}50%{transform:rotate(-13deg)}',
  slowR:'0%,100%{transform:rotate(-3deg)}50%{transform:rotate(13deg)}',
  perkL:'0%,25%,100%{transform:rotate(0)}38%{transform:rotate(-32deg) scale(1.12)}50%{transform:rotate(-20deg) scale(1.05)}62%,80%{transform:rotate(-28deg) scale(1.1)}',
  perkR:'0%,25%,100%{transform:rotate(0)}38%{transform:rotate(32deg) scale(1.12)}50%{transform:rotate(20deg) scale(1.05)}62%,80%{transform:rotate(28deg) scale(1.1)}',
  droopL:'0%,15%,100%{transform:rotate(0)}55%,90%{transform:rotate(30deg) scaleY(.92)}',
  droopR:'0%,15%,100%{transform:rotate(0)}55%,90%{transform:rotate(-30deg) scaleY(.92)}',
  foldL:'0%,12%,88%,100%{transform:rotate(0)}30%,72%{transform:rotate(36deg) scale(.9)}',
  foldR:'0%,12%,88%,100%{transform:rotate(0)}30%,72%{transform:rotate(-36deg) scale(.9)}',
  flutL:'0%,100%{transform:rotate(0)}50%{transform:rotate(-10deg)}',
  flutR:'0%,100%{transform:rotate(0)}50%{transform:rotate(10deg)}',
  wigL:'0%,50%,100%{transform:rotate(0)}15%{transform:rotate(-22deg)}30%{transform:rotate(5deg)}',
  wigR:'0%,50%,100%{transform:rotate(0)}65%{transform:rotate(22deg)}80%{transform:rotate(-5deg)}',
  // хобот
  swing:'0%,100%{transform:rotate(-10deg)}50%{transform:rotate(14deg)}',
  wag:'0%,100%{transform:rotate(-18deg)}50%{transform:rotate(18deg)}',
  curl:'0%,20%,85%,100%{transform:rotate(0)}40%,70%{transform:rotate(-40deg) scale(.92,1.05)}',
  trumpet:'0%,35%,100%{transform:rotate(0)}48%{transform:rotate(-78deg) scale(1.05,1.18)}56%{transform:rotate(-66deg) scale(1.05,1.15)}64%{transform:rotate(-78deg) scale(1.05,1.18)}82%{transform:rotate(0)}',
  tdroop:'0%,100%{transform:rotate(4deg)}50%{transform:rotate(12deg) scaleY(1.1)}',
  sniff:'0%,55%,100%{transform:rotate(0)}62%{transform:rotate(-10deg) scaleY(.94)}68%{transform:rotate(5deg)}74%{transform:rotate(-10deg) scaleY(.94)}82%{transform:rotate(0)}',
  twirl:'0%,100%{transform:rotate(0)}25%{transform:rotate(-28deg)}50%{transform:rotate(16deg) scale(.95)}75%{transform:rotate(-12deg)}',
  // глаза
  blink:'0%,44%,52%,100%{transform:scaleY(1)}48%{transform:scaleY(.08)}',
  blink2:'0%,70%,78%,86%,100%{transform:scaleY(1)}74%,82%{transform:scaleY(.08)}',
  look:'0%,15%,85%,100%{transform:translateX(0)}25%,45%{transform:translateX(-2.4px)}55%,75%{transform:translateX(2.4px)}',
  pop:'0%,100%{transform:scale(1)}10%{transform:scale(.7)}25%{transform:scale(1.5)}40%{transform:scale(1.2)}55%{transform:scale(1.38)}',
  squint:'0%,20%,85%,100%{transform:scaleY(1)}35%,70%{transform:scaleY(.42) translateY(.5px)}',
  dart:'0%,100%{transform:translate(0,0)}20%{transform:translate(-2px,0)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,1px)}80%{transform:translate(2px,0)}',
  glint:'0%,100%{transform:scale(1)}50%{transform:scale(1.22)}',
  up:'0%,100%{transform:none}50%{transform:translate(1.2px,-2px)}',
  happy:'0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-1px) scaleY(1.35)}',
  shades:'0%{transform:translateY(-16px);opacity:0}14%{opacity:1}24%,88%{transform:none;opacity:1}100%{transform:translateY(-16px);opacity:0}',
  nerd:'0%,20%,45%,100%{transform:none}28%{transform:translateY(-2.8px)}36%{transform:translateY(-.5px)}',
  coin:'0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}',
  // рот
  talk:'0%,100%{transform:scaleY(1)}25%{transform:scaleY(.5)}50%{transform:scaleY(1.25)}75%{transform:scaleY(.7)}',
  grow:'0%,100%{transform:scale(1)}50%{transform:scale(1.4,1.25)}',
  laughM:'0%,100%{transform:scale(1)}50%{transform:scale(1.15,.55)}',
  chomp:'0%,100%{transform:scaleY(1)}50%{transform:scaleY(.2)}',
  wob:'0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}',
  pout:'0%,15%,70%,100%{transform:scale(1)}30%,55%{transform:scale(1.7) translateY(-.5px)}',
  open:'0%,100%{transform:scale(1)}20%{transform:scale(.6)}35%,70%{transform:scale(1.5,1.75)}',
  smirkM:'0%,100%{transform:none}50%{transform:scaleX(1.35) rotate(-7deg) translateX(1px)}',
  quiver:'0%,100%{transform:translateY(0) scaleX(1)}50%{transform:translateY(.7px) scaleX(.88)}',
  // предметы и отдельные части
  winkEye:'0%,28%,62%,100%{transform:scaleY(1)}35%,55%{transform:scaleY(.08)}',
  hug:'0%,100%{transform:scaleX(1)}40%,60%{transform:scaleX(.7)}',
  halo:'0%,100%{transform:scaleX(1) translateY(0)}50%{transform:scaleX(.25) translateY(-2px)}',
  roll2:'0%,100%{transform:translate(0,0)}25%{transform:translate(1.6px,1.4px)}50%{transform:translate(0,3.4px)}75%{transform:translate(-1.6px,1.4px)}',
  maskPuff:'0%,50%,62%,78%,100%{transform:scale(1)}56%,70%{transform:scale(1.1,1.15)}',
  popC:'0%,44%{transform:scale(0);opacity:0}50%{transform:scale(1.35);opacity:1}80%{transform:scale(1);opacity:1}100%{transform:scale(1.15);opacity:0}',
  tip:'0%,20%,60%,100%{transform:none}35%,45%{transform:translate(-2px,-5px) rotate(-20deg)}',
  glow:'0%,100%{opacity:1}50%{opacity:.55}',
  zip:'0%,15%{transform:translateX(-10px)}45%,90%{transform:none}100%{transform:translateX(-10px)}',
  brk:'0%,30%{transform:none;opacity:1}35%,45%{transform:rotate(-10deg)}40%,50%{transform:rotate(10deg)}80%{transform:translateY(9px) rotate(22deg);opacity:0}100%{opacity:0}',
  stamp:'0%{transform:scale(3) rotate(-30deg);opacity:0}14%,85%{transform:scale(1) rotate(0);opacity:1}100%{transform:scale(1);opacity:0}',
  toss:'0%,15%,70%,100%{transform:none}35%{transform:translateY(-17px) rotate(200deg)}55%{transform:translateY(-2px) rotate(360deg)}',
  cup:'0%,20%,75%,100%{transform:none}40%,60%{transform:translate(8px,-7px) rotate(-28deg)}',
};
// тело / уши / хобот / глаза / рот — «имя/секунды», «-» — стоит на месте
const EA={
  smile:'nod/2.6 slow/2.6 swing/2.6 blink/3.4 grow/2.6',
  grin:'hop2/1.9 f/.38 wag/.38 happy/.95 talk/.95',
  laugh:'laugh/.42 f/.21 wag/.42 happy/.42 laughM/.21',
  rofl:'roll/1.2 f/.3 wag/.3 happy/.4 laughM/.2',
  sweat:'sigh/2.4 slow/1.2 sniff/2.4 look/2.4 quiver/.4',
  wink:'lean/2.2 wig/2.2 curl/2.2 -/0 smirkM/2.2',
  blush:'shrink/3 fold/3 tdroop/1.5 squint/3 quiver/.5',
  love:'beat/1.1 f/.55 trumpet/2.2 glint/.55 grow/1.1',
  kiss:'kiss/2 perk/2 curl/2 squint/2 pout/2',
  hugs:'squeeze/1.6 fold/1.6 swing/1.6 happy/1.6 grow/1.6',
  halo:'float/3 slow/3 swing/3 blink/3 grow/3',
  cool:'nod/1.5 wig/3 swing/1.5 shades/3 smirkM/3',
  nerd:'nod/2.8 slow/2.8 sniff/2.8 nerd/2.8 talk/1.4',
  star:'flip/2.4 perk/2.4 trumpet/2.4 glint/.6 grow/1.2',
  party:'dance/.9 f/.45 wag/.45 happy/.45 laughM/.45',
  think:'tilt/3.2 slow/3.2 twirl/3.2 up/3.2 wob/3.2',
  smirk:'lean/2.8 wig/2.8 curl/2.8 squint/2.8 smirkM/2.8',
  neutral:'stare/3.4 slow/3.4 sniff/3.4 blink2/3.4 -/0',
  eyeroll:'sigh/2.6 droop/2.6 tdroop/2.6 -/0 quiver/1.3',
  sleep:'sleep/4 droop/4 tdroop/2 -/0 grow/2',
  tired:'tired/3.6 droop/3.6 tdroop/1.8 squint/3.6 quiver/1.8',
  mask:'cough/2.4 perk/2.4 sniff/2.4 squint/2.4 -/0',
  sick:'sway/2.6 droop/2.6 twirl/2.6 squint/2.6 wob/1.3',
  hot:'heat/1 flut/.12 tdroop/1 squint/2 wob/.5',
  cold:'shiver/.09 flut/.1 wag/.18 dart/.8 chomp/.12',
  dizzy:'orbit/1.3 wig/1.3 twirl/1.3 -/0 wob/1.3',
  boom:'inflate/2 perk/2 trumpet/2 pop/2 open/2',
  cowboy:'nod/2.4 slow/2.4 swing/2.4 blink/2.4 talk/1.2',
  sad:'sigh/3.2 droop/3.2 tdroop/3.2 blink/3.2 quiver/1',
  cry:'sob/.5 flut/.25 tdroop/1 -/0 laughM/.25',
  plead:'kiss/2.2 fold/2.2 curl/2.2 glint/1.1 quiver/.3',
  scream:'scream/1.6 perk/1.6 trumpet/1.6 pop/1.6 open/1.6',
  shock:'jolt/2.2 perk/2.2 trumpet/2.2 pop/2.2 open/2.2',
  angry:'fume/1.6 flut/.16 wag/.4 squint/1.6 chomp/.4',
  rage:'rage/.8 flut/.1 wag/.2 dart/.4 talk/.2',
  devil:'evil/1.6 wig/1.6 curl/1.6 squint/1.6 laughM/.2',
  skull:'wiggle/.5 -/0 -/0 dart/1 chomp/.22',
  clown:'spin/2.8 f/.35 twirl/1.4 blink2/2.8 grow/1.4',
  ghost:'ghost/3 -/0 -/0 blink/3 open/3',
  money:'hop/1.4 perk/1.4 trumpet/1.4 coin/.7 talk/.7',
  tongue:'wiggle/1 wig/1 wag/.5 squint/2 wob/.25',
  crazy:'crazy/1.1 wig/.55 twirl/.55 dart/.55 wob/.3',
  zip:'nod/2.6 slow/2.6 sniff/2.6 look/2.6 -/0',
  upside:'upside/3 f/.5 swing/1.5 blink/3 grow/1.5',
  melt:'melt/3 droop/3 tdroop/3 squint/3 wob/1.5',
  like:'hop/1.4 perk/1.4 curl/1.4 happy/1.4 grow/1.4',
  dislike:'no/2.2 droop/2.2 tdroop/2.2 blink/2.2 quiver/.6',
  wave:'sway/1.1 f/.55 swing/1.1 happy/1.1 talk/.55',
  pray:'bow/1.8 fold/1.8 tdroop/1.8 -/0 grow/1.8',
  heart:'beat/.8 f/.4 curl/1.6 glint/.8 grow/.8',
  broken:'sigh/2.4 droop/2.4 tdroop/2.4 blink/2.4 quiver/.4',
  fire:'headbang/.45 f/.225 wag/.45 squint/.9 laughM/.45',
  hundred:'impact/2.4 perk/2.4 trumpet/2.4 pop/2.4 grow/2.4',
  king:'proud/2.6 perk/2.6 trumpet/2.6 squint/2.6 smirkM/2.6',
  grad:'impact/2.6 f/.4 trumpet/2.6 happy/1.3 grow/1.3',
  coffee:'sip/3 slow/3 curl/3 squint/3 pout/3',
  popper:'recoil/1.6 perk/1.6 trumpet/1.6 pop/1.6 laughM/.4',
  cake:'dance/1.4 f/.7 wag/.7 happy/.7 talk/.7',
};
const EA_X={   // отдельные части: [селектор, анимация, секунды, transform-origin]
  wink:[['.el-blink','winkEye',2.2]],hugs:[['.el-front','hug',1.6]],halo:[['.el-top','halo',2,'center']],
  eyeroll:[['.el-pupil','roll2',2.6]],mask:[['.el-over','maskPuff',2.4]],boom:[['.el-top','popC',2,'center']],
  cowboy:[['.el-top','tip',2.4,'left bottom']],devil:[['.el-top','glow',.8]],zip:[['.el-zipper','zip',2.6]],
  broken:[['.el-front','brk',2.4]],hundred:[['.el-front','stamp',2.4,'center']],grad:[['.el-top','toss',2.6,'center']],
  coffee:[['.el-front','cup',3,'center']],
};
const EA_CENTER=new Set(['rofl','star','clown','upside','dizzy','crazy']);
function _elAnimCss(){
  let css='.el .el-all{transform-box:view-box;transform-origin:32px 46px}.el .el-earL{transform-origin:88% 45%}.el .el-earR{transform-origin:12% 45%}'
    +'.el .el-trunk{transform-origin:30% 0}.el .el-eyes,.el .el-mouth{transform-origin:center}.el .el-top{transform-origin:center bottom}';
  for(const [n,k] of Object.entries(EK))css+=`@keyframes ek_${n}{${k}}`;
  for(const [id,spec] of Object.entries(EA)){
    const [b,e,t,y,m]=spec.split(' ').map(x=>x.split('/'));
    const sel=`.el-i-${id}`,an=(n,d,ez)=>`animation:ek_${n} ${d}s ${ez||'ease-in-out'} infinite`;
    if(b[0]!=='-')css+=`${sel} .el-all{${an(b[0],b[1])}${EA_CENTER.has(id)?';transform-origin:32px 32px':''}}`;
    if(e[0]!=='-')css+=`${sel} .el-earL{${an(e[0]==='f'?'fL':e[0]+'L',e[1])}}${sel} .el-earR{${an(e[0]==='f'?'fR':e[0]+'R',e[1])}}`;
    if(t[0]!=='-')css+=`${sel} .el-trunk{${an(t[0],t[1])}}`;
    if(y[0]!=='-')css+=`${sel} .el-eyes{${an(y[0],y[1],y[0]==='shades'?'cubic-bezier(.3,1.4,.5,1)':'')}}`;
    if(m[0]!=='-')css+=`${sel} .el-mouth{${an(m[0],m[1])}}`;
    for(const [s,n,d,o] of EA_X[id]||[])css+=`${sel} ${s}{${an(n,d)}${o?';transform-origin:'+o:''}}`;
  }
  return css+'body.perf-noanim .el,body.perf-noanim .el *{animation:none!important}';
}
// общие градиенты и анимации — один раз на страницу
(function _elBoot(){
  if(typeof document==='undefined')return;
  const go=()=>{
    if(document.getElementById('elDefs'))return;
    const d=document.createElementNS('http://www.w3.org/2000/svg','svg');
    d.id='elDefs';d.setAttribute('aria-hidden','true');d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML='<defs>'+elDefsStr()+'</defs>';
    document.body.appendChild(d);
    const st=document.createElement('style');st.id='elAnim';st.textContent=_elAnimCss();document.head.appendChild(st);
  };
  if(document.body)go();else document.addEventListener('DOMContentLoaded',go);
})();
