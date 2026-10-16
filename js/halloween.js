// ════════ ХЕЛЛОУИН: кандидаты (витрина для отбора) ════════
// Всё рисуется векторами (SVG) — своё, без чужих картинок; стиль как у наших стикеров-слоников:
// объём градиентами, блики, мягкая обводка, «живая» мимика. Анимации — CSS-классы hw-* (style.css).
// Здесь: библиотека персонажей → эмодзи (пак), рамки аватара, обои профиля, эффекты профиля,
// плашки в списке чатов, подарки. Витрина: Настройки → «🎃 Хеллоуин — витрина» (номера для отбора).
// После отбора лучшие встраиваются в обычные каталоги (HW_ON).

// ── общие градиенты (один раз на страницу) ──
(function _hwDefs(){
  if(document.getElementById('hwDefs'))return;
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.id='hwDefs';s.setAttribute('width','0');s.setAttribute('height','0');s.style.position='absolute';s.setAttribute('aria-hidden','true');
  s.innerHTML=`<defs>
    <radialGradient id="hwPump" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffc24a"/><stop offset=".55" stop-color="#ff8a1c"/><stop offset="1" stop-color="#c94e06"/></radialGradient>
    <radialGradient id="hwPumpRib" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#ffb13a"/><stop offset="1" stop-color="#e06a0c"/></radialGradient>
    <radialGradient id="hwGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6b0"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff9500" stop-opacity="0"/></radialGradient>
    <linearGradient id="hwFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#ffb000"/></linearGradient>
    <linearGradient id="hwStem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8bc34a"/><stop offset="1" stop-color="#3e6b1f"/></linearGradient>
    <radialGradient id="hwGhost" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef0ff"/><stop offset="1" stop-color="#c9cdf2"/></radialGradient>
    <radialGradient id="hwBat" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#6b4a8f"/><stop offset="1" stop-color="#2a1640"/></radialGradient>
    <linearGradient id="hwWing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2d69"/><stop offset="1" stop-color="#1d0e2e"/></linearGradient>
    <radialGradient id="hwSkull" cx=".42" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#ece4d4"/><stop offset="1" stop-color="#c4b79c"/></radialGradient>
    <radialGradient id="hwSpider" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#5a5a6e"/><stop offset="1" stop-color="#121218"/></radialGradient>
    <linearGradient id="hwHat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a4fd0"/><stop offset="1" stop-color="#3b1670"/></linearGradient>
    <linearGradient id="hwGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".5" stop-color="#ffcc33"/><stop offset="1" stop-color="#d48b00"/></linearGradient>
    <radialGradient id="hwPot" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#5b5b66"/><stop offset="1" stop-color="#14141a"/></radialGradient>
    <radialGradient id="hwBrew" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#d4ff7a"/><stop offset=".6" stop-color="#5fe03a"/><stop offset="1" stop-color="#1f8a2e"/></radialGradient>
    <linearGradient id="hwWax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc4"/><stop offset=".45" stop-color="#fff8ea"/><stop offset="1" stop-color="#cdbb98"/></linearGradient>
    <radialGradient id="hwFlame" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#ffe066"/><stop offset=".75" stop-color="#ff8a1c"/><stop offset="1" stop-color="#ff4d00" stop-opacity="0"/></radialGradient>
    <linearGradient id="hwCorn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf2"/><stop offset=".34" stop-color="#fffdf2"/><stop offset=".34" stop-color="#ffb21e"/><stop offset=".68" stop-color="#ffb21e"/><stop offset=".68" stop-color="#ff7b1c"/><stop offset="1" stop-color="#f25c05"/></linearGradient>
    <radialGradient id="hwCat" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#3e3e52"/><stop offset="1" stop-color="#0d0d14"/></radialGradient>
    <radialGradient id="hwCatEye" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff59a"/><stop offset="1" stop-color="#ffb300"/></radialGradient>
    <radialGradient id="hwMoon" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#fffbe0"/><stop offset=".6" stop-color="#ffe9a3"/><stop offset="1" stop-color="#e6b85c"/></radialGradient>
    <radialGradient id="hwBlood" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ff7a6b"/><stop offset=".6" stop-color="#d4241c"/><stop offset="1" stop-color="#6e0a0a"/></radialGradient>
    <linearGradient id="hwStone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a3a8b8"/><stop offset="1" stop-color="#4c5163"/></linearGradient>
    <radialGradient id="hwPotion" cx=".4" cy=".55" r=".6"><stop offset="0" stop-color="#ffb3ff"/><stop offset=".5" stop-color="#c03cff"/><stop offset="1" stop-color="#5a0d8f"/></radialGradient>
    <radialGradient id="hwEye" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".8" stop-color="#f3e9e9"/><stop offset="1" stop-color="#d9b9b9"/></radialGradient>
    <radialGradient id="hwSugar" cx=".42" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e8e2f5"/></radialGradient>
  </defs>`;
  (document.body||document.documentElement).appendChild(s);
})();
const _hwSh='<ellipse cx="32" cy="60" rx="17" ry="2.6" fill="#000" opacity=".22"/>';   // тень под персонажем

// ── персонажи (64×64) ──
const HW_SPRITES={
  pumpkin:()=>`${_hwSh}<g class="hwp-body">
    <ellipse cx="18" cy="38" rx="13" ry="17" fill="url(#hwPumpRib)" stroke="#a8420a" stroke-width=".8"/>
    <ellipse cx="46" cy="38" rx="13" ry="17" fill="url(#hwPumpRib)" stroke="#a8420a" stroke-width=".8"/>
    <ellipse cx="32" cy="38" rx="16" ry="19" fill="url(#hwPump)" stroke="#a8420a" stroke-width=".9"/>
    <path d="M30 20c0-6 3-9 6-10l2 2c-3 1-4 4-4 8z" fill="url(#hwStem)" stroke="#2f4f16" stroke-width=".7"/>
    <path d="M36 14c4-3 9-2 11 1-4 0-7 1-9 3z" fill="#6fae3a"/>
    <g class="hwp-face"><path d="M20 32l6-5 3 7z M44 32l-6-5-3 7z" fill="url(#hwFace)"/>
      <path d="M20 42c4 6 20 6 24 0l-3 1-2 3-3-3-2 3-2-3-2 3-3-3-2 3-3-3z" fill="url(#hwFace)"/>
      <circle cx="32" cy="38" r="2" fill="url(#hwFace)"/></g>
    <path d="M22 24c3-3 8-4 12-3" stroke="#fff3c8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`,
  ghost:()=>`${_hwSh}<g class="hwg-body">
    <path d="M14 34C14 18 22 9 32 9s18 9 18 25v20c-3 3-5-1-7 2s-4 2-6 0-4-3-6 0-4 3-6 0-4-3-6 0c-2 2-3-1-5 1z" fill="url(#hwGhost)" stroke="#a9aee0" stroke-width=".9"/>
    <path class="hwg-arm" d="M15 36c-6 1-8 6-6 9 2-3 4-4 7-4z" fill="url(#hwGhost)" stroke="#a9aee0" stroke-width=".8"/>
    <path class="hwg-arm2" d="M49 36c6 1 8 6 6 9-2-3-4-4-7-4z" fill="url(#hwGhost)" stroke="#a9aee0" stroke-width=".8"/>
    <g class="hwg-eyes"><ellipse cx="25.5" cy="29" rx="3.2" ry="4.3" fill="#1d2033"/><ellipse cx="38.5" cy="29" rx="3.2" ry="4.3" fill="#1d2033"/>
      <circle cx="26.5" cy="27.5" r="1.1" fill="#fff"/><circle cx="39.5" cy="27.5" r="1.1" fill="#fff"/></g>
    <ellipse cx="32" cy="38" rx="3" ry="3.6" fill="#3a1d33"/><ellipse cx="32" cy="39.3" rx="1.8" ry="1.5" fill="#ff7b93"/>
    <ellipse cx="20.5" cy="35" rx="3" ry="1.8" fill="#ffb3c6" opacity=".7"/><ellipse cx="43.5" cy="35" rx="3" ry="1.8" fill="#ffb3c6" opacity=".7"/>
    <path d="M21 17c3-4 8-5 11-5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/></g>`,
  bat:()=>`<g class="hwb-body">
    <path class="hwb-wl" d="M27 30C20 20 9 20 3 26c4 0 6 3 6 6 2-2 5-2 7 1 1-3 5-4 8-1z" fill="url(#hwWing)" stroke="#12081d" stroke-width=".8"/>
    <path class="hwb-wr" d="M37 30c7-10 18-10 24-4-4 0-6 3-6 6-2-2-5-2-7 1-1-3-5-4-8-1z" fill="url(#hwWing)" stroke="#12081d" stroke-width=".8"/>
    <path d="M24 22l2-9 5 7h2l5-7 2 9" fill="url(#hwBat)" stroke="#12081d" stroke-width=".8"/>
    <ellipse cx="32" cy="32" rx="10" ry="11" fill="url(#hwBat)" stroke="#12081d" stroke-width=".9"/>
    <ellipse cx="28" cy="29" rx="2.6" ry="3.2" fill="#ffd23f"/><ellipse cx="36" cy="29" rx="2.6" ry="3.2" fill="#ffd23f"/>
    <circle cx="28.5" cy="29.6" r="1.3" fill="#1a0b10"/><circle cx="36.5" cy="29.6" r="1.3" fill="#1a0b10"/>
    <path d="M29 35q3 2.4 6 0" stroke="#12081d" stroke-width="1" fill="none"/><path d="M30 35.6l.8 2 .8-1.8M33.6 35.6l.6 1.8.8-2" fill="#fff"/>
    <path d="M26 24c2-2 5-2.5 7-2" stroke="#9b7cc7" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`,
  skull:()=>`${_hwSh}<g class="hws-body">
    <path d="M13 30c0-12 9-20 19-20s19 8 19 20c0 7-3 11-6 13v6c0 2-2 3-4 3H23c-2 0-4-1-4-3v-6c-3-2-6-6-6-13z" fill="url(#hwSkull)" stroke="#9c8f74" stroke-width=".9"/>
    <g class="hws-eyes"><path d="M19 30c0-4 3-6 6-6s6 2 6 6-3 6-6 6-6-2-6-6z" fill="#2a1a2a"/><path d="M33 30c0-4 3-6 6-6s6 2 6 6-3 6-6 6-6-2-6-6z" fill="#2a1a2a"/>
      <circle class="hws-glow" cx="25" cy="30" r="2" fill="#7dfcff"/><circle class="hws-glow" cx="39" cy="30" r="2" fill="#7dfcff"/></g>
    <path d="M32 37l-2.6 4h5.2z" fill="#2a1a2a"/>
    <g class="hws-jaw"><path d="M23 45h18" stroke="#9c8f74" stroke-width=".8"/><path d="M26 44v6M30 44v7M34 44v7M38 44v6" stroke="#9c8f74" stroke-width=".9"/></g>
    <path d="M19 20c3-5 9-7 14-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`,
  spider:()=>`<path class="hwsp-thread" d="M32 0v18" stroke="#c9cdf2" stroke-width=".8" opacity=".8"/><g class="hwsp-body">
    <g stroke="#14141a" stroke-width="2" fill="none" stroke-linecap="round" class="hwsp-legs">
      <path d="M24 34c-6-4-10-3-13 1M24 38c-6-1-10 1-12 5M25 42c-5 2-7 5-8 9M26 30c-5-6-9-6-12-4"/>
      <path d="M40 34c6-4 10-3 13 1M40 38c6-1 10 1 12 5M39 42c5 2 7 5 8 9M38 30c5-6 9-6 12-4"/></g>
    <ellipse cx="32" cy="40" rx="10" ry="11" fill="url(#hwSpider)"/>
    <circle cx="32" cy="27" r="7.5" fill="url(#hwSpider)"/>
    <ellipse cx="29" cy="26" rx="2.2" ry="2.8" fill="#fff"/><ellipse cx="35" cy="26" rx="2.2" ry="2.8" fill="#fff"/>
    <circle cx="29.4" cy="26.6" r="1.2" fill="#14141a"/><circle cx="35.4" cy="26.6" r="1.2" fill="#14141a"/>
    <path d="M29 31q3 2 6 0" stroke="#ff7b93" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M26 37c2-3 5-4 8-4" stroke="#8a8aa8" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/></g>`,
  hat:()=>`${_hwSh}<g class="hwh-body">
    <ellipse cx="32" cy="50" rx="26" ry="7" fill="url(#hwHat)" stroke="#24094a" stroke-width=".9"/>
    <path d="M18 49C21 36 24 22 31 12c3-4 9-6 14-3-5 0-7 3-8 7l3 33z" fill="url(#hwHat)" stroke="#24094a" stroke-width=".9"/>
    <path d="M19.6 44c7 2.4 15 2.6 22 .4l.6 5.4c-8 2.4-16 2.2-24-.4z" fill="#ff8a1c" stroke="#a8420a" stroke-width=".6"/>
    <rect x="27" y="43.6" width="7" height="6.4" rx="1" fill="none" stroke="url(#hwGold)" stroke-width="1.8"/>
    <g class="hwh-stars"><path d="M24 30l1 2.2 2.4.3-1.8 1.6.5 2.4-2.1-1.2-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#ffd23f"/><path d="M33 22l.7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2z" fill="#ffe680"/></g>
    <path d="M27 20c1-3 3-6 5-8" stroke="#c9a3ff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>`,
  cauldron:()=>`${_hwSh}<g class="hwc-fire"><path d="M20 58c-2-5 2-7 3-10 1 3 3 4 3 7 1-2 3-3 3-6 2 3 4 5 3 9z" fill="#ff8a1c"/><path d="M33 58c-1-4 2-6 3-9 1 3 3 4 3 6 1-2 2-3 2-5 2 3 3 5 2 8z" fill="#ffb627"/></g>
    <g class="hwc-body"><ellipse cx="32" cy="27" rx="21" ry="6" fill="#2a2a33"/>
    <path d="M12 28c0 14 8 24 20 24s20-10 20-24z" fill="url(#hwPot)" stroke="#06060a" stroke-width=".9"/>
    <ellipse cx="32" cy="27" rx="18" ry="4.6" fill="url(#hwBrew)"/>
    <ellipse cx="32" cy="27" rx="22" ry="5.6" fill="none" stroke="#3a3a46" stroke-width="2.4"/>
    <path d="M17 34c1 6 5 11 10 13" stroke="#8a8a9a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/>
    <g class="hwc-bub"><circle cx="26" cy="22" r="3" fill="#a8ff6a" stroke="#3fa82e" stroke-width=".6"/><circle cx="37" cy="19" r="2.2" fill="#c8ff8a" stroke="#3fa82e" stroke-width=".6"/><circle cx="31" cy="14" r="1.6" fill="#d8ffa0"/></g></g>`,
  candle:()=>`${_hwSh}<g class="hwk-flame"><ellipse cx="32" cy="15" rx="9" ry="11" fill="url(#hwGlow)" opacity=".7"/>
    <path d="M32 6c4 5 5 8 5 11a5 5 0 0 1-10 0c0-3 1-6 5-11z" fill="url(#hwFlame)"/><path d="M32 12c2 2 2.4 4 2.4 5a2.4 2.4 0 0 1-4.8 0c0-1 .4-3 2.4-5z" fill="#fff"/></g>
    <path d="M32 21v4" stroke="#3a2a1a" stroke-width="1.2"/>
    <path d="M22 26h20v28c0 2-4 4-10 4s-10-2-10-4z" fill="url(#hwWax)" stroke="#b5a07a" stroke-width=".8"/>
    <path d="M22 26c0 3 2 2 2 5s2 3 2 0 1-4 3-4 1 6 3 6 1-4 3-5 2 1 2 3 2-2 2-5c1 1 3 0 3-2z" fill="#fffaf0" stroke="#d8c7a4" stroke-width=".5"/>
    <ellipse cx="32" cy="26" rx="10" ry="2.4" fill="#f5ebd6"/>
    <path d="M25 33v16" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
  candy:()=>`${_hwSh}<g class="hwcn-body"><path d="M32 6c6 0 18 32 17 42-1 6-9 8-17 8s-16-2-17-8C14 38 26 6 32 6z" fill="url(#hwCorn)" stroke="#c44a00" stroke-width=".9"/>
    <path d="M27 18c1-4 3-7 5-8" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>
    <ellipse cx="27" cy="39" rx="2" ry="2.6" fill="#3a1d10"/><ellipse cx="37" cy="39" rx="2" ry="2.6" fill="#3a1d10"/>
    <path d="M29 45q3 2.6 6 0" stroke="#3a1d10" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="23" cy="44" rx="2.4" ry="1.4" fill="#ff5a3c" opacity=".55"/><ellipse cx="41" cy="44" rx="2.4" ry="1.4" fill="#ff5a3c" opacity=".55"/></g>`,
  cat:()=>`${_hwSh}<g class="hwct-body">
    <path class="hwct-tail" d="M46 52c8-2 12-8 10-15-1-4-4-5-5-3 2 3 1 8-6 11z" fill="url(#hwCat)"/>
    <path d="M14 30L16 9l10 10h12l10-10 2 21c2 14-6 25-18 25S12 44 14 30z" fill="url(#hwCat)" stroke="#000" stroke-width=".8"/>
    <path d="M18 14l1 9 5-4zM46 14l-1 9-5-4z" fill="#7a3d5c"/>
    <g class="hwct-eyes"><ellipse cx="24.5" cy="33" rx="4.6" ry="5" fill="url(#hwCatEye)"/><ellipse cx="39.5" cy="33" rx="4.6" ry="5" fill="url(#hwCatEye)"/>
      <ellipse cx="24.5" cy="33" rx="1.2" ry="4.2" fill="#140a00"/><ellipse cx="39.5" cy="33" rx="1.2" ry="4.2" fill="#140a00"/>
      <circle cx="26" cy="31" r="1" fill="#fff"/><circle cx="41" cy="31" r="1" fill="#fff"/></g>
    <path d="M30 40l2 2 2-2z" fill="#ff8fb1"/><path d="M32 42v2m0 0c-1 2-3 2-4 1m4-1c1 2 3 2 4 1" stroke="#ff8fb1" stroke-width=".9" fill="none"/>
    <path d="M21 41l-9-1M21 43l-8 2M43 41l9-1M43 43l8 2" stroke="#9aa0b8" stroke-width=".6"/>
    <path d="M20 20c3-2 6-2 8-1" stroke="#6a6a88" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`,
  moon:()=>`<g class="hwm-body"><circle cx="32" cy="32" r="24" fill="url(#hwGlow)" opacity=".35"/><path d="M40 10a22 22 0 1 0 14 34A18 18 0 0 1 40 10z" fill="url(#hwMoon)" stroke="#c99a3e" stroke-width=".8"/>
    <circle cx="26" cy="38" r="3" fill="#e8c77a" opacity=".6"/><circle cx="20" cy="26" r="2" fill="#e8c77a" opacity=".6"/><circle cx="30" cy="48" r="1.6" fill="#e8c77a" opacity=".6"/></g>`,
  tomb:()=>`${_hwSh}<g class="hwt-body"><path d="M16 56V26c0-10 7-16 16-16s16 6 16 16v30z" fill="url(#hwStone)" stroke="#2c303d" stroke-width=".9"/>
    <path d="M24 30h16M32 22v18" stroke="#2c303d" stroke-width="3" stroke-linecap="round" opacity=".55"/><text x="32" y="50" text-anchor="middle" font-size="8" font-weight="900" fill="#2c303d" opacity=".6" font-family="sans-serif">RIP</text>
    <path d="M10 57c4-4 6-2 8-5 2 3 4 1 6 4 2-3 4-2 6 0 2-3 4-2 6 1 2-3 4-3 6 0 2-2 4-2 7 0z" fill="#4caf50"/>
    <path d="M21 18c2-3 5-4 8-4" stroke="#e1e4ef" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/></g>`,
  potion:()=>`${_hwSh}<g class="hwpt-body"><rect x="27" y="8" width="10" height="7" rx="2" fill="#a5743e" stroke="#5e3e1a" stroke-width=".8"/>
    <path d="M28 15h8v8c8 3 14 10 14 18 0 10-8 16-18 16S14 51 14 41c0-8 6-15 14-18z" fill="rgba(220,235,255,.35)" stroke="#8fa2c9" stroke-width="1"/>
    <path d="M16 40c5 2 27 2 32 0 1 8-6 15-16 15s-17-7-16-15z" fill="url(#hwPotion)"/>
    <g class="hwpt-bub"><circle cx="26" cy="46" r="2" fill="#ffd6ff" opacity=".9"/><circle cx="36" cy="44" r="1.4" fill="#ffd6ff" opacity=".9"/><circle cx="31" cy="50" r="1.1" fill="#fff"/></g>
    <path d="M21 32c2-4 5-6 8-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/></g>`,
  eye:()=>`${_hwSh}<g class="hwe-body"><circle cx="32" cy="32" r="20" fill="url(#hwEye)" stroke="#b08585" stroke-width=".8"/>
    <path d="M14 30c4 0 6 2 8 1M50 36c-4-1-6 1-8 0M30 13c0 4 2 5 1 8" stroke="#e05b5b" stroke-width=".8" fill="none"/>
    <g class="hwe-iris"><circle cx="32" cy="33" r="9" fill="#4ecb71"/><circle cx="32" cy="33" r="9" fill="none" stroke="#1d6b36" stroke-width="1"/><circle cx="32" cy="33" r="4.4" fill="#0d1a10"/><circle cx="29.6" cy="30.4" r="2" fill="#fff"/></g>
    <path d="M20 22c3-4 8-6 12-6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`,
  sugar:()=>`${_hwSh}<g class="hwsg-body"><path d="M13 30c0-12 9-20 19-20s19 8 19 20c0 7-3 11-6 13v6c0 2-2 3-4 3H23c-2 0-4-1-4-3v-6c-3-2-6-6-6-13z" fill="url(#hwSugar)" stroke="#a69cc4" stroke-width=".9"/>
    <circle cx="25" cy="30" r="6" fill="#ff5fa2"/><circle cx="39" cy="30" r="6" fill="#4fc3ff"/><circle cx="25" cy="30" r="3" fill="#2a1a2a"/><circle cx="39" cy="30" r="3" fill="#2a1a2a"/>
    <g fill="#ffd23f"><circle cx="25" cy="22" r="1.2"/><circle cx="39" cy="22" r="1.2"/><circle cx="32" cy="18" r="1.4"/></g>
    <path d="M28 16c1-2 3-2 4 0 1-2 3-2 4 0" stroke="#ff5fa2" stroke-width="1.2" fill="none"/>
    <path d="M30 36c0 2 4 2 4 0-1 2-3 2-4 0z" fill="#8a4fd0"/><path d="M23 45h18M26 44v5M30 44v6M34 44v6M38 44v5" stroke="#a69cc4" stroke-width=".9"/>
    <path d="M17 38c2 1 4 0 4-2M47 38c-2 1-4 0-4-2" stroke="#7bd96b" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`,
};
const hwSprite=(id,cls)=>`<svg class="hws ${cls||''} hw-${id}" viewBox="0 0 64 64" aria-hidden="true">${(HW_SPRITES[id]||(()=>''))()}</svg>`;

// ════════ 1. Пак эмодзи (для сообщений, реакций и эмодзи-статуса у ника) ════════
const HW_EMOJI=[
  ['pumpkin','Тыква','тыква фонарь pumpkin хеллоуин'],['ghost','Призрак','призрак привидение ghost бу'],['bat','Летучая мышь','летучая мышь bat'],
  ['skull','Черепушка','череп skull'],['spider','Паучок','паук spider'],['hat','Ведьмина шляпа','ведьма шляпа witch'],
  ['cauldron','Котёл','котёл зелье cauldron'],['candle','Свеча','свеча candle'],['candy','Конфетка','конфета candy'],
  ['cat','Чёрный кот','кот кошка cat'],['potion','Зелье','зелье potion'],['eye','Глаз','глаз eye'],['sugar','Сахарный череп','сахарный череп calavera'],
];

// ════════ 2. Рамки аватара (аватар — квадрат 0..100, рамка может выходить за него) ════════
const _hwBox=(b,inner,cls)=>`<svg class="hwf-svg ${cls||''}" viewBox="${b.join(' ')}" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%" aria-hidden="true">${inner}</svg>`;
// позиция — во внутренней группе (атрибут transform), анимация — во внешней (CSS-анимация заменила бы позицию)
const _hwUse=(id,x,y,s,cls,rot)=>`<g class="${cls||''}"><g transform="translate(${x} ${y})${rot?` rotate(${rot})`:''} scale(${s}) translate(-32 -32)">${(HW_SPRITES[id]||(()=>''))()}</g></g>`;
const HW_FRAMES=[
  ['crown','Тыквенная корона',()=>_hwBox([-15,-30,130,80],
    `<path d="M2 40c14-10 30-14 48-14s34 4 48 14" stroke="#3e6b1f" stroke-width="3" fill="none" stroke-linecap="round"/>
     <path d="M14 33c-3-6 2-10 6-8M84 33c3-6-2-10-6-8" stroke="#6fae3a" stroke-width="2" fill="none"/>
     ${_hwUse('pumpkin',22,26,.42,'hwf-bob a')}${_hwUse('pumpkin',50,18,.58,'hwf-bob b')}${_hwUse('pumpkin',78,26,.42,'hwf-bob c')}`)],
  ['witch','Шляпа ведьмы',()=>_hwBox([-20,-50,90,90],_hwUse('hat',30,24,1.05,'hwf-hat',-14)+
     `<g class="hwf-tw"><path d="M70 20l1.5 3.4 3.6.4-2.7 2.4.8 3.6-3.2-1.9-3.2 1.9.8-3.6-2.7-2.4 3.6-.4z" fill="#ffd23f"/><path d="M-6 40l1 2.4 2.6.3-2 1.7.6 2.6-2.2-1.4-2.2 1.4.6-2.6-2-1.7 2.6-.3z" fill="#ffe680"/></g>`)],
  ['horns','Рожки',()=>_hwBox([-10,-30,120,60],
    `<defs><linearGradient id="hwHorn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7a0f0f"/><stop offset=".6" stop-color="#e3261c"/><stop offset="1" stop-color="#ff7a5c"/></linearGradient></defs>
     <g class="hwf-horn l"><path d="M20 48c-6-14-2-28 8-36-2 10 2 20 12 28z" fill="url(#hwHorn)" stroke="#4a0606" stroke-width="1"/><path d="M24 34c-1-8 1-14 4-18" stroke="#ffb3a0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>
     <g class="hwf-horn r"><path d="M80 48c6-14 2-28-8-36 2 10-2 20-12 28z" fill="url(#hwHorn)" stroke="#4a0606" stroke-width="1"/><path d="M76 34c1-8-1-14-4-18" stroke="#ffb3a0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>`)],
  ['wings','Крылья мыши',()=>_hwBox([-55,-10,210,90],
    `<g class="hwf-wing l"><path d="M50 40C30 8 2 6-50 22c14 2 20 10 20 18 6-6 14-6 20 2 4-8 14-10 22-4 6-6 14-6 20 2 4-2 10-2 18 0z" fill="url(#hwWing)" stroke="#12081d" stroke-width="1"/><path d="M-30 30c20-10 50-12 70 4" stroke="#6b4a8f" stroke-width="1.4" fill="none" opacity=".7"/></g>
     <g class="hwf-wing r"><path d="M50 40c20-32 48-34 100-18-14 2-20 10-20 18-6-6-14-6-20 2-4-8-14-10-22-4-6-6-14-6-20 2-4-2-10-2-18 0z" fill="url(#hwWing)" stroke="#12081d" stroke-width="1"/><path d="M130 30c-20-10-50-12-70 4" stroke="#6b4a8f" stroke-width="1.4" fill="none" opacity=".7"/></g>`)],
  ['orbit','Хоровод призраков',()=>_hwBox([-25,-25,150,150],
    `<g class="hwf-orbit">${[0,120,240].map((a,i)=>{const r=60,x=50+r*Math.cos(a*Math.PI/180),y=50+r*Math.sin(a*Math.PI/180);return `<g class="hwf-orb-i" style="--d:${-i*.6}s">${_hwUse('ghost',x,y,.62)}</g>`;}).join('')}</g>`)],
  ['candles','Круг свечей',()=>_hwBox([-25,-10,150,135],
    [205,165,128,90,52,15,335].map((a,i)=>{const r=60,x=50+r*Math.cos(a*Math.PI/180),y=52+r*Math.sin(a*Math.PI/180)*.95;return _hwUse('candle',x,y,.5,'hwf-cdl',0).replace('class="hwf-cdl"',`class="hwf-cdl" style="--d:${-i*.37}s"`);}).join(''))],
  ['dropspider','Паук на нитке',()=>_hwBox([40,-60,70,120],
    `<path d="M48 -60V20" stroke="#c9cdf2" stroke-width=".8" class="hwf-thr"/><g class="hwf-drop">${_hwUse('spider',48,28,.85)}</g>
     <path d="M66 -10c10 8 14 20 12 34M58 -12c14 2 26 12 30 24" stroke="#c9cdf2" stroke-width=".6" fill="none" opacity=".6"/>`)],
  ['graveyard','Кладбище',()=>_hwBox([-25,50,150,70],
    `<ellipse class="hwf-fog" cx="50" cy="108" rx="80" ry="12" fill="#cfd8ff" opacity=".35"/>
     ${_hwUse('tomb',-4,82,.6,'',-8)}${_hwUse('tomb',104,84,.55,'',8)}${_hwUse('pumpkin',14,100,.4)}${_hwUse('pumpkin',88,102,.34)}
     <ellipse class="hwf-fog b" cx="50" cy="112" rx="70" ry="9" fill="#e6ebff" opacity=".45"/>`)],
  ['bloodmoon','Кровавая луна',()=>_hwBox([-30,-30,160,160],
    `<circle cx="50" cy="50" r="56" fill="none" stroke="#ff2a1a" stroke-width="10" opacity=".35" class="hwf-pulse" style="filter:blur(4px)"/><circle cx="50" cy="50" r="54" fill="none" stroke="url(#hwBlood)" stroke-width="4"/>
     <g class="hwf-bats">${[[-14,10,.3],[118,24,.26],[102,-10,.22]].map(([x,y,s],i)=>`<g class="hwf-bat" style="--d:${-i*.5}s">${_hwUse('bat',x,y,s)}</g>`).join('')}</g>`)],
  ['blackcat','Чёрный кот',()=>_hwBox([-10,60,120,70],
    `<g class="hwf-cat">${_hwUse('cat',50,100,.95)}</g>
     <g fill="url(#hwCat)"><ellipse cx="22" cy="72" rx="9" ry="6"/><ellipse cx="78" cy="72" rx="9" ry="6"/></g>
     <g stroke="#3e3e52" stroke-width="1"><path d="M16 70v4M20 70v5M24 70v4M74 70v4M78 70v5M82 70v4"/></g>`)],
];

// ════════ 3. Обои профиля (большой фон за аватаркой) ════════
const _hwRnd=(i,k)=>((Math.sin(i*12.9898+k*78.233)*43758.5453)%1+1)%1;
const HW_WALLS=[
  ['moonbats','Луна и мыши',()=>`<div class="hww-sky night"></div><div class="hww-moon">${hwSprite('moon')}</div>${Array.from({length:5},(_,i)=>`<i class="hww-fly" style="--y:${15+i*12}%;--d:${-i*2.2}s;--s:${.5+_hwRnd(i,1)*.5};--t:${9+i*1.5}s">${hwSprite('bat')}</i>`).join('')}`],
  ['pumpfield','Тыквенное поле',()=>`<div class="hww-sky dusk"></div><svg class="hww-hills" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 70Q60 40 130 62T260 56T400 66V120H0z" fill="#1a0f2e"/><path d="M0 90Q80 70 170 88T330 82T400 90V120H0z" fill="#0f0820"/></svg>${[[12,78,.9],[30,84,.7],[52,80,1],[74,86,.75],[90,79,.85]].map(([x,y,s],i)=>`<i class="hww-pump" style="left:${x}%;top:${y}%;--s:${s};--d:${-i*.5}s">${hwSprite('pumpkin')}</i>`).join('')}${Array.from({length:12},(_,i)=>`<i class="hww-ff" style="left:${_hwRnd(i,2)*100}%;top:${30+_hwRnd(i,3)*45}%;--d:${-_hwRnd(i,4)*4}s"></i>`).join('')}`],
  ['graveyard','Туманное кладбище',()=>`<div class="hww-sky fog"></div><svg class="hww-hills" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 80Q100 66 200 78T400 76V120H0z" fill="#1c2233"/></svg>${[[14,70,.8,-8],[34,74,.6,6],[64,72,.9,-4],[84,75,.65,8]].map(([x,y,s,r])=>`<i class="hww-tomb" style="left:${x}%;top:${y}%;--s:${s};--r:${r}deg">${hwSprite('tomb')}</i>`).join('')}<i class="hww-fogl a"></i><i class="hww-fogl b"></i><i class="hww-fogl c"></i>`],
  ['ghostwood','Призрачный лес',()=>`<div class="hww-sky teal"></div><svg class="hww-trees" viewBox="0 0 400 200" preserveAspectRatio="none"><g fill="#0a1418"><path d="M30 200V90l-14-30 18 22 4-50 6 46 16-30-12 44v108z"/><path d="M330 200V80l-20-24 22 16 2-44 8 40 14-26-10 42v116z"/><path d="M200 200v-70l-10-20 12 12 4-30 4 28 10-16-8 26v70z"/></g></svg><i class="hww-ghost a">${hwSprite('ghost')}</i><i class="hww-ghost b">${hwSprite('ghost')}</i><i class="hww-fogl a"></i>`],
  ['brew','Ведьмин котёл',()=>`<div class="hww-sky brew"></div><i class="hww-cauldron">${hwSprite('cauldron')}</i>${Array.from({length:10},(_,i)=>`<i class="hww-bubble" style="left:${40+_hwRnd(i,5)*20}%;--d:${-_hwRnd(i,6)*4}s;--s:${.5+_hwRnd(i,7)}"></i>`).join('')}<i class="hww-smoke a"></i><i class="hww-smoke b"></i>`],
  ['candyrain','Конфетный дождь',()=>`<div class="hww-sky candy"></div>${Array.from({length:14},(_,i)=>`<i class="hww-fall" style="left:${_hwRnd(i,8)*96}%;--d:${-_hwRnd(i,9)*7}s;--t:${5+_hwRnd(i,10)*4}s;--r:${_hwRnd(i,11)*360}deg">${hwSprite(i%3?'candy':'pumpkin')}</i>`).join('')}`],
  ['bloodmoon','Кровавая луна',()=>`<div class="hww-sky blood"></div><div class="hww-moon red"></div><svg class="hww-trees" viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M0 200V150Q60 130 120 150T260 140T400 150V200z" fill="#14040a"/><path d="M300 150V70l-16-20 18 14 2-30 6 28 12-18-8 26v80z" fill="#14040a"/></svg>${Array.from({length:4},(_,i)=>`<i class="hww-fly crow" style="--y:${12+i*10}%;--d:${-i*2.6}s;--s:${.4+_hwRnd(i,12)*.3};--t:${11+i*2}s">${hwSprite('bat')}</i>`).join('')}`],
  ['neonskulls','Неоновые черепа',()=>`<div class="hww-sky neon"></div>${Array.from({length:9},(_,i)=>`<i class="hww-neon" style="left:${8+(i%3)*33+_hwRnd(i,13)*10}%;top:${8+Math.floor(i/3)*30+_hwRnd(i,14)*8}%;--d:${-_hwRnd(i,15)*3}s;--h:${[300,190,120][i%3]}">${hwSprite('skull')}</i>`).join('')}`],
  ['webs','Паутина',()=>`<div class="hww-sky webs"></div><svg class="hww-web" viewBox="0 0 400 200" preserveAspectRatio="none">${_hwWebPath()}</svg>${[[18,0,.7],[62,0,.55],[86,0,.8]].map(([x,,s],i)=>`<i class="hww-swing" style="left:${x}%;--s:${s};--d:${-i*.8}s"><b></b>${hwSprite('spider')}</i>`).join('')}`],
  ['candles','Свечи',()=>`<div class="hww-sky warm"></div>${[[8,64,.9],[22,72,.7],[38,60,1],[56,70,.8],[72,62,.95],[88,72,.7]].map(([x,y,s],i)=>`<i class="hww-cdl" style="left:${x}%;top:${y}%;--s:${s};--d:${-i*.31}s">${hwSprite('candle')}</i>`).join('')}${Array.from({length:10},(_,i)=>`<i class="hww-bokeh" style="left:${_hwRnd(i,16)*100}%;top:${_hwRnd(i,17)*60}%;--s:${8+_hwRnd(i,18)*22}px;--d:${-_hwRnd(i,19)*5}s"></i>`).join('')}`],
];
function _hwWebPath(){
  let d='';const cx=[0,400],cy=0;
  for(const x of cx){const dir=x?-1:1;
    for(let i=0;i<7;i++){const a=(i/6)*Math.PI/2;d+=`M${x},0L${x+dir*Math.cos(a)*160},${Math.sin(a)*160}`;}
    for(let r=30;r<=150;r+=28)for(let i=0;i<6;i++){const a1=(i/6)*Math.PI/2,a2=((i+1)/6)*Math.PI/2,am=(a1+a2)/2;
      d+=`M${x+dir*Math.cos(a1)*r},${Math.sin(a1)*r}Q${x+dir*Math.cos(am)*(r-8)},${Math.sin(am)*(r-8)} ${x+dir*Math.cos(a2)*r},${Math.sin(a2)*r}`;}}
  return `<path d="${d}" stroke="rgba(230,235,255,.55)" stroke-width="1" fill="none" vector-effect="non-scaling-stroke"/>`;
}

// ════════ 4. Эффекты профиля (по краям всего окна профиля) ════════
const HW_FX=[
  ['batswarm','Стая мышей',()=>Array.from({length:7},(_,i)=>`<i class="hwx-bat" style="--y:${10+_hwRnd(i,20)*70}%;--d:${-_hwRnd(i,21)*6}s;--t:${5+_hwRnd(i,22)*4}s;--s:${.35+_hwRnd(i,23)*.35};--dir:${i%2?1:-1}">${hwSprite('bat')}</i>`).join('')],
  ['groundfog','Туман снизу',()=>`<i class="hwx-fog a"></i><i class="hwx-fog b"></i><i class="hwx-fog c"></i>`],
  ['candlerow','Свечи по низу',()=>`<div class="hwx-cdls">${Array.from({length:9},(_,i)=>`<i style="--s:${.6+_hwRnd(i,24)*.5};--d:${-i*.29}s">${hwSprite('candle')}</i>`).join('')}</div>`],
  ['garland','Тыквенная гирлянда',()=>`<svg class="hwx-wire" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 6Q50 34 100 10T200 10T300 10T400 6" stroke="#2c2c35" stroke-width="2" fill="none"/></svg><div class="hwx-lights">${Array.from({length:8},(_,i)=>`<i style="left:${6+i*12.4}%;top:${[18,30,22,14,22,30,18,10][i]}px;--d:${-i*.4}s">${hwSprite('pumpkin')}</i>`).join('')}</div>`],
  ['leaves','Осенние листья',()=>Array.from({length:12},(_,i)=>`<i class="hwx-leaf" style="left:${_hwRnd(i,25)*100}%;--d:${-_hwRnd(i,26)*8}s;--t:${6+_hwRnd(i,27)*5}s;--c:${['#ff8a1c','#e0451b','#ffb627','#b3361a'][i%4]}"></i>`).join('')],
  ['ghosts','Проплывающие призраки',()=>`<i class="hwx-ghost a">${hwSprite('ghost')}</i><i class="hwx-ghost b">${hwSprite('ghost')}</i><i class="hwx-ghost c">${hwSprite('ghost')}</i>`],
  ['blood','Кровавые подтёки',()=>`<svg class="hwx-drip" viewBox="0 0 400 60" preserveAspectRatio="none"><path d="M0 0H400V10c-10 0-12 4-14 14-2 8-8 8-9-2-1-8-4-12-12-12s-10 2-12 18c-1 10-9 10-10 0-1-12-4-18-14-18s-14 6-16 10c-2 6-7 6-8 0-1-6-6-10-14-10H0z" fill="#9c0c0c"/></svg>${[[12,.8],[37,1.1],[63,.9],[86,1.2]].map(([x,t],i)=>`<i class="hwx-drop" style="left:${x}%;--d:${-i*1.1}s;--t:${3+t*2}s"></i>`).join('')}`],
  ['magic','Ведьмина магия',()=>Array.from({length:18},(_,i)=>`<i class="hwx-spark" style="left:${_hwRnd(i,28)*100}%;top:${_hwRnd(i,29)*100}%;--d:${-_hwRnd(i,30)*3}s;--c:${['#a8ff6a','#c03cff','#7dfcff'][i%3]}"></i>`).join('')],
  ['eyes','Глаза в темноте',()=>Array.from({length:6},(_,i)=>`<i class="hwx-eyes" style="left:${[4,86,2,88,10,80][i]}%;top:${[18,30,58,68,86,84][i]}%;--d:${-i*.9}s"><b></b><b></b></i>`).join('')],
  ['lightning','Гроза',()=>`<i class="hwx-flash"></i><svg class="hwx-bolt" viewBox="0 0 40 120"><path d="M24 0L8 54h12L6 120 36 44H22L32 0z" fill="#e8f0ff"/></svg>`],
];

// ════════ 5. Плашки в списке чатов (фон строки у всех, у кого ты в списке) ════════
const HW_PLATES=[
  ['pumpkins','Тыквы',()=>`<div class="hwn-bg" style="--a:#2a1004;--b:#5c2205"></div>${[[64,.42],[78,.32],[90,.38]].map(([x,s],i)=>`<i class="hwn-it" style="left:${x}%;--s:${s};--d:${-i*.5}s">${hwSprite('pumpkin')}</i>`).join('')}`],
  ['web','Паутина',()=>`<div class="hwn-bg" style="--a:#121218;--b:#24242e"></div><svg class="hwn-web" viewBox="0 0 200 72" preserveAspectRatio="none"><path d="M200 0L120 72M200 0L150 72M200 0L200 72M200 0L90 50M200 0L80 20M150 8Q160 22 172 28M120 14Q140 36 160 46M95 20Q125 50 140 66" stroke="rgba(230,235,255,.5)" stroke-width="1" fill="none" vector-effect="non-scaling-stroke"/></svg><i class="hwn-it sp" style="left:84%;--s:.3">${hwSprite('spider')}</i>`],
  ['bats','Летучие мыши',()=>`<div class="hwn-bg" style="--a:#14092a;--b:#2b1450"></div>${[0,1,2].map(i=>`<i class="hwn-fly" style="--y:${10+i*24}%;--d:${-i*1.4}s">${hwSprite('bat')}</i>`).join('')}`],
  ['graves','Кладбище',()=>`<div class="hwn-bg" style="--a:#141a26;--b:#28324a"></div><svg class="hwn-sil" viewBox="0 0 200 72" preserveAspectRatio="none"><path d="M0 72V60Q50 50 100 58T200 56V72z" fill="#0b0f18"/><path d="M130 72V48c0-6 4-10 9-10s9 4 9 10v24zM160 72V52c0-5 3-8 7-8s7 3 7 8v20zM110 72V56c0-4 3-6 6-6s6 2 6 6v16z" fill="#0b0f18"/></svg><i class="hwn-fog"></i>`],
  ['mist','Фиолетовый туман',()=>`<div class="hwn-bg" style="--a:#1e0b33;--b:#3c1466"></div><i class="hwn-fog v a"></i><i class="hwn-fog v b"></i>`],
  ['bloody','Кровь',()=>`<div class="hwn-bg" style="--a:#1a0306;--b:#3a070d"></div><svg class="hwn-drip" viewBox="0 0 200 30" preserveAspectRatio="none"><path d="M0 0H200V6c-6 0-7 3-8 9s-5 6-5-1-3-8-8-8-6 1-7 11-6 6-6-1-3-10-9-10-8 4-9 6-4 3-5 0-3-5-8-5H0z" fill="#b3140f"/></svg>`],
  ['candy','Конфеты',()=>`<div class="hwn-bg" style="--a:#3a1438;--b:#ff7b1c"></div>${[[60,-10],[74,14],[88,-6]].map(([x,r],i)=>`<i class="hwn-it" style="left:${x}%;--s:.3;--r:${r}deg;--d:${-i*.6}s">${hwSprite('candy')}</i>`).join('')}`],
  ['eyes','Глаза',()=>`<div class="hwn-bg" style="--a:#050508;--b:#14141f"></div>${[[64,30],[80,58],[92,22]].map(([x,y],i)=>`<i class="hwx-eyes small" style="left:${x}%;top:${y}%;--d:${-i*1.2}s"><b></b><b></b></i>`).join('')}`],
  ['moon','Луна',()=>`<div class="hwn-bg" style="--a:#0a1028;--b:#1c2a5a"></div><i class="hwn-it moon" style="left:82%;--s:.62">${hwSprite('moon')}</i>${[0,1,2,3,4].map(i=>`<i class="hwn-star" style="left:${55+i*8}%;top:${[20,60,35,75,15][i]}%;--d:${-i*.6}s"></i>`).join('')}`],
  ['neon','Неон',()=>`<div class="hwn-bg" style="--a:#0d0018;--b:#1e0036"></div>${[[66,300],[80,190],[93,120]].map(([x,h],i)=>`<i class="hwn-it hww-neon" style="left:${x}%;--s:.34;--h:${h};--d:${-i*.7}s">${hwSprite('skull')}</i>`).join('')}`],
];

// ════════ 6. Подарки (как в Telegram: крупно, объёмно, с анимацией) ════════
const HW_GIFTS=[
  ['g_lantern','Тыква-фонарь',['pumpkin'],'#ff8a1c'],
  ['g_ghost','Призрак с конфетой',['ghost','candy'],'#9aa6ff'],
  ['g_hat','Шляпа ведьмы',['hat'],'#8a4fd0'],
  ['g_brew','Котёл зелья',['cauldron'],'#5fe03a'],
  ['g_sugar','Сахарный череп',['sugar'],'#ff5fa2'],
  ['g_cat','Чёрный кот',['cat'],'#ffd23f'],
  ['g_candle','Вечная свеча',['candle'],'#ffb627'],
  ['g_potion','Любовное зелье',['potion'],'#c03cff'],
];
function hwGiftSvg(id,cls){
  const g=HW_GIFTS.find(x=>x[0]===id);if(!g)return '';
  const [,,parts,col]=g;
  const main=_hwUse(parts[0],60,58,1.45,'hwg-main');
  const extra=parts[1]?`<g class="hwg-extra">${_hwUse(parts[1],92,82,.5,'',-18)}</g>`:'';
  return `<svg class="gift-svg hwgift${cls?' '+cls:''}" viewBox="0 0 120 120" aria-hidden="true" style="--gc:${col}">
    <circle cx="60" cy="58" r="50" fill="${col}" opacity=".16" class="hwg-halo"/>
    <ellipse cx="60" cy="111" rx="34" ry="5" fill="#000" opacity=".25"/>
    <g class="hwg-wob">${main}${extra}</g>
    <g class="hwg-spark"><path d="M14 30l1.6 3.4 3.6.4-2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.4 3.6-.4z" fill="${col}"/><path d="M104 20l1.2 2.6 2.8.3-2.1 1.8.6 2.8-2.5-1.5-2.5 1.5.6-2.8-2.1-1.8 2.8-.3z" fill="${col}"/></g>
  </svg>`;
}

// ════════ ВИТРИНА для отбора ════════
function _hwShowcase(){
  const av=()=>`<div class="hwv-av"><span class="hwv-face">${typeof myAvatar!=='undefined'&&myAvatar?`<img src="${esc(myAvatar)}" alt="">`:'🐘'}</span>`;
  const sec=(t,sub,html)=>_spSec(t)+`<div class="sp-card sp-pad"><div class="hwv-sub">${sub}</div>${html}</div>`;
  const tag=(p,i)=>`<b class="hwv-n">${p}${i+1}</b>`;
  let h=`<div class="hwv-intro">🎃 Кандидаты к Хеллоуину. У каждого номер — напиши, какие оставить (например: «П2, П5, Э1–Э6, Р3»).</div>`;
  h+=sec('Подарки','П1–П'+HW_GIFTS.length+' · как в Telegram',`<div class="hwv-grid gifts">${HW_GIFTS.map((g,i)=>`<div class="hwv-cell">${hwGiftSvg(g[0])}<span>${tag('П',i)} ${esc(g[1])}</span></div>`).join('')}</div>`);
  h+=sec('Эмодзи','Э1–Э'+HW_EMOJI.length+' · в сообщения, реакции и статус у ника',`<div class="hwv-grid emoji">${HW_EMOJI.map((e,i)=>`<div class="hwv-cell">${hwSprite(e[0],'hw-anim')}<span>${tag('Э',i)} ${esc(e[1])}</span></div>`).join('')}</div>
    <div class="hwv-nick">Твой ник ${hwSprite('pumpkin','hw-anim es')} · в сообщении: «бу! ${hwSprite('ghost','hw-anim inl')}»</div>`);
  h+=sec('Рамки аватара','Р1–Р'+HW_FRAMES.length,`<div class="hwv-grid frames">${HW_FRAMES.map((f,i)=>`<div class="hwv-cell">${av()}<span class="hwf hwf-${f[0]}">${f[2]()}</span></div><span>${tag('Р',i)} ${esc(f[1])}</span></div>`).join('')}</div>`);
  h+=sec('Обои профиля','О1–О'+HW_WALLS.length+' · большой анимированный фон за аватаркой',`<div class="hwv-grid walls">${HW_WALLS.map((w,i)=>`<div class="hwv-cell"><div class="hwv-wall"><div class="hww hww-${w[0]}">${w[2]()}</div>${av()}</div></div><span>${tag('О',i)} ${esc(w[1])}</span></div>`).join('')}</div>`);
  h+=sec('Эффекты профиля','Ф1–Ф'+HW_FX.length+' · по краям всего окна профиля',`<div class="hwv-grid fx">${HW_FX.map((f,i)=>`<div class="hwv-cell"><div class="hwv-prof"><div class="hwv-pfx"><div class="hwx hwx-${f[0]}">${f[2]()}</div></div>${av()}</div><i class="hwv-l"></i><i class="hwv-l s"></i></div><span>${tag('Ф',i)} ${esc(f[1])}</span></div>`).join('')}</div>`);
  h+=sec('Плашки в списке чатов','Пл1–Пл'+HW_PLATES.length+' · фон твоей строки у всех, у кого ты в списке',`<div class="hwv-plates">${HW_PLATES.map((p,i)=>`<div class="hwv-plate"><div class="hwn hwn-${p[0]}">${p[2]()}</div><span class="hwv-pav">🐘</span><div class="hwv-pt"><b>${esc(typeof myNick!=='undefined'&&myNick||'Ты')}</b><span>${tag('Пл',i)} ${esc(p[1])}</span></div></div>`).join('')}</div>`);
  _spPush('🎃 Хеллоуин — витрина',`<div class="hwv">${h}</div>`);
}
// пункт в настройках (на время отбора)
if(typeof _spGeneral==='function'){const f=_spGeneral;_spGeneral=function(){const r=f.apply(this,arguments);
  const b=document.querySelector('.sp-page:last-child .sp-page-body');
  if(b)b.insertAdjacentHTML('afterbegin',`<div class="sp-card"><div class="sp-row" onclick="_hwShowcase()"><div class="sp-row-txt"><div class="sp-row-title">🎃 Хеллоуин — витрина кандидатов</div><div class="sp-row-sub">Подарки, эмодзи, рамки, обои, эффекты, плашки — выбрать лучшие</div></div></div></div>`);
  return r;};}

// ════════ ВСЁ — В НАСТОЯЩИЕ КАТАЛОГИ (лишнее потом вычеркнем) ════════
// id с префиксом hw_ (подарки — g_), чтобы потом легко убрать.
(function _hwInstall(){
  // рамки
  if(typeof AV_FRAMES!=='undefined'){
    for(const [id,name] of HW_FRAMES){const f={id:'hw_'+id,name:'🎃 '+name,prem:true,kind:'fx'};if(!AV_FRAME_MAP[f.id]){AV_FRAMES.push(f);AV_FRAME_MAP[f.id]=f;}
      if(typeof AV_FRAME_CARD_BG!=='undefined')AV_FRAME_CARD_BG[f.id]='#1d1029';}
    const f0=_avFrameInner;_avFrameInner=function(id){
      if(String(id).startsWith('hw_')){const f=HW_FRAMES.find(x=>'hw_'+x[0]===id);return f?`<span class="hwf hwf-${f[0]}">${f[2]()}</span>`:'';}
      return f0.apply(this,arguments);};
  }
  // обои профиля
  if(typeof PROFILE_WALLPAPERS!=='undefined'){
    for(const [id,name] of HW_WALLS){const w={id:'hw_'+id,name:'🎃 '+name,prem:true};if(!PROFILE_WALLPAPER_MAP[w.id]){PROFILE_WALLPAPERS.push(w);PROFILE_WALLPAPER_MAP[w.id]=w;}}
    const f0=_wallpaperInner;_wallpaperInner=function(id){
      if(String(id).startsWith('hw_')){const w=HW_WALLS.find(x=>'hw_'+x[0]===id);return w?`<div class="hww hww-${w[0]}">${w[2]()}</div>`:'';}
      return f0.apply(this,arguments);};
  }
  // эффекты профиля
  if(typeof PROFILE_FX!=='undefined'){
    for(const [id,name] of HW_FX)if(!PROFILE_FX.some(x=>x.id==='hw_'+id))PROFILE_FX.push({id:'hw_'+id,name:'🎃 '+name,prem:true});
    const f0=_fxInner;_fxInner=function(id){
      if(String(id).startsWith('hw_')){const f=HW_FX.find(x=>'hw_'+x[0]===id);return f?`<div class="hwx hwx-${f[0]}">${f[2]()}</div>`:'';}
      return f0.apply(this,arguments);};
  }
  // плашки в списке чатов
  if(typeof NAME_PLATES!=='undefined'){
    for(const [id,name] of HW_PLATES)if(!NAME_PLATES.some(x=>x.id==='hw_'+id))NAME_PLATES.push({id:'hw_'+id,name:'🎃 '+name,prem:true});
    const f0=_npInner;_npInner=function(id){
      if(String(id).startsWith('hw_')){const p=HW_PLATES.find(x=>'hw_'+x[0]===id);return p?`<div class="hwn hwn-${p[0]}">${p[2]()}</div>`:'';}
      return f0.apply(this,arguments);};
  }
  // эмодзи: реакции, эмодзи-статус, панель эмодзи в сообщениях (метка «:h-id:»)
  if(typeof RX_CUSTOM!=='undefined'){
    for(const [id,label,kw] of HW_EMOJI)RX_CUSTOM['h:'+id]={label,kw:kw+' хеллоуин halloween',hw:id};
    const HW_RX=HW_EMOJI.map(e=>'h:'+e[0]);
    const r0=rxHtml;rxHtml=function(e){const c=RX_CUSTOM[e];if(c&&c.hw)return `<span class="cx-hw">${hwSprite(c.hw,'hw-anim')}</span>`;return r0.apply(this,arguments);};
    const sec=()=>`<div class="rx-sec" data-s="halloween"><div class="rx-sec-h">🎃 Хеллоуин</div><div class="rx-grid">${HW_RX.map(e=>`<button class="rx-i" data-e="${esc(e)}">${rxHtml(e)}</button>`).join('')}</div></div>`;
    const tab=`<button class="rx-tab" data-s="halloween" title="Хеллоуин">${rxHtml('h:pumpkin')}</button>`;
    const addTo=h=>String(h).replace('<span class="rx-tab-ind">',tab+'<span class="rx-tab-ind">').replace('<div class="rx-secs">','<div class="rx-secs">'+sec());
    if(typeof _rxFullHtml==='function'){const f=_rxFullHtml;_rxFullHtml=function(){return addTo(f.apply(this,arguments));};}
    if(typeof _rxFullHtmlStatus==='function'){const f=_rxFullHtmlStatus;_rxFullHtmlStatus=function(){return addTo(f.apply(this,arguments));};}
    const TOK=/:h-([a-z]+):/g;
    const l0=linkify;linkify=function(text){
      const out=l0.apply(this,arguments);
      if(!text||text.indexOf(':h-')<0)return out;
      const only=/^\s*(:(?:h|e)-[a-z0-9_]+:\s*){1,3}$/.test(text);
      const h=out.replace(TOK,(m,id)=>RX_CUSTOM['h:'+id]?rxHtml('h:'+id):m);
      return only&&!out.includes('el-big')?`<span class="el-big">${h}</span>`:h;
    };
    const u0=updatePreview;updatePreview=function(id,txt,ts){return u0.call(this,id,typeof txt==='string'?txt.replace(TOK,'🎃'):txt,ts);};
    const t0=_toggleEmojiPanel;_toggleEmojiPanel=function(e){
      const p=$('emojiPanel');const first=p&&!p.dataset.ready;
      const r=t0.apply(this,arguments);
      if(first&&p&&!p.querySelector('.ep-hw')){
        const btns=HW_EMOJI.map(x=>`<button class="ep-el" title="${esc(x[1])}" onclick="_insertEmoji(':h-${x[0]}:')">${rxHtml('h:'+x[0])}</button>`).join('');
        p.insertAdjacentHTML('afterbegin',`<div class="ep-sec">🎃 Хеллоуин</div><div class="ep-els ep-hw">${btns}</div>`);
      }
      return r;
    };
  }
  // подарки: картинка по id (цены и названия — с сервера)
  if(typeof _giftSvg==='function'){const f=_giftSvg;_giftSvg=function(id,cls){if(String(id).startsWith('g_'))return hwGiftSvg(id,cls);return f.apply(this,arguments);};}
})();
