// ════════════════════════════════════════
// ── ЗНАЧКИ вместо эмодзи ──
// _ico('lock') — svg-иконка (цвет от currentColor), _badge('slon'|'prem') — значки у имени,
// _envelopeHtml() — конверт с анимацией (открылся → письмо залетело → закрылся).
// ════════════════════════════════════════
const _ICO_PATHS = {
  star: 'M12 2.6l2.85 5.95 6.55.8-4.83 4.5 1.24 6.5L12 17.2l-5.81 3.15 1.24-6.5L2.6 9.35l6.55-.8z',
  lock: 'M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0z',
  bellOff: 'M20 18.7 5.3 4 4 5.3l3.1 3.1A6.9 6.9 0 0 0 6 11v5l-2 2v1h13.7l2 2 1.3-1.3zM12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6.8V11c0-3.1-1.6-5.6-4.5-6.3V4a1.5 1.5 0 0 0-3 0v.7c-.5.1-1 .3-1.4.5z',
  image: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5z',
  hammer: 'M2 19.6 12.6 9l2.4 2.4L4.4 22zM13.4 2.1l8.5 8.5-2.8 2.8-1.4-1.4-1.4 1.4-5.7-5.7 1.4-1.4-1.4-1.4z',
  snow: 'M22 11h-4.2l3.2-3.2-1.4-1.4L15 11h-2V9l4.6-4.6-1.4-1.4L13 6.2V2h-2v4.2L7.8 3 6.4 4.4 11 9v2H9L4.4 6.4 3 7.8 6.2 11H2v2h4.2L3 16.2l1.4 1.4L9 13h2v2l-4.6 4.6L7.8 21l3.2-3.2V22h2v-4.2l3.2 3.2 1.4-1.4L13 15v-2h2l4.6 4.6 1.4-1.4-3.2-3.2H22z',
  block: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM4 12a8 8 0 0 1 12.9-6.3L5.7 16.9A8 8 0 0 1 4 12zm8 8a8 8 0 0 1-4.9-1.7L18.3 7.1A8 8 0 0 1 12 20z',
  mic: 'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.3-3c0 3-2.5 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.4 2.7 6.2 6 6.7V21h2v-3.3c3.3-.5 6-3.3 6-6.7z',
  camera: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.2 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.2L15 2zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z',
  megaphone: 'M18 11v2h4v-2zm-2 6.6c1 .7 2.2 1.6 3.2 2.4l1.2-1.6c-1-.8-2.3-1.7-3.2-2.4zM20.4 5.6 19.2 4c-1 .8-2.2 1.7-3.2 2.4l1.2 1.6c1-.7 2.2-1.6 3.2-2.4zM4 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v4h2v-4h1l5 3V6L8 9zm11.5 3c0-1.3-.6-2.5-1.5-3.4v6.8c.9-.8 1.5-2 1.5-3.4z',
  group: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  person: 'M12 12a4.8 4.8 0 1 0 0-9.6 4.8 4.8 0 0 0 0 9.6zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
  crown: 'M5 16 3 5l5.5 5L12 4l3.5 6L21 5l-2 11zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14z',
  personAdd: 'M15 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2zm9 4c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z',
  personCheck: 'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4zm7.8-3.2-1.4-1.4-1.4 1.4 2.8 2.8 5.2-5.2-1.4-1.4z',
  pencil: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z',
  chat: 'M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z',
  folder: 'M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z',
};
function _ico(name, cls) {
  const d = _ICO_PATHS[name]; if (!d) return '';
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
}

// data:URL → {mime, b64}
function _duParts(u){
  u=String(u||'');
  if(!u.startsWith('data:'))return {mime:'',b64:u};
  const i=u.lastIndexOf(',');
  const head=u.slice(5,i);
  return {mime:head.replace(/;base64$/i,'').split(';')[0]||'',b64:u.slice(i+1)};
}

// Розетка «как у Telegram» (12 лепестков) — основа слонгалочки
const _ROSETTE = (() => {
  const n = 12, R = 11, r = 9.4; let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI * i / n - Math.PI / 2, rr = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (12 + rr * Math.cos(a)).toFixed(2) + ' ' + (12 + rr * Math.sin(a)).toFixed(2);
  }
  return d + 'Z';
})();
// Значки у имени: слонгалочка (синяя розетка с галочкой) и SLON Premium (звезда)
function _badge(kind, extra) {
  if (kind === 'slon')
    return `<span class="slb slb-slon" title="Слонгалочка"${extra || ''}><svg viewBox="0 0 24 24"><path class="slb-bg" d="${_ROSETTE}" stroke-linejoin="round"/><path class="slb-fg" d="M7.6 12.3l3 3 5.8-6.1" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  if (kind === 'prem')
    return `<span class="slb slb-prem" title="SLON Premium"${extra || ''}><svg viewBox="0 0 24 24"><path class="slb-bg" d="${_ICO_PATHS.star}" stroke-linejoin="round"/></svg></span>`;
  return '';
}
function _badgeEl(kind) { const t = document.createElement('template'); t.innerHTML = _badge(kind); return t.content.firstChild; }

// Конверт: открывается, письмо залетает внутрь, конверт закрывается
function _envelopeHtml(cls) {
  return `<div class="env3d${cls ? ' ' + cls : ''}" aria-hidden="true"><div class="env-shadow"></div><div class="env-body">
    <div class="env-back"></div>
    <div class="env-letter"><i></i><i></i><i></i></div>
    <div class="env-front"></div>
    <div class="env-flap"></div></div></div>`;
}
