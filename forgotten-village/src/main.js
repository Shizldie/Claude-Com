'use strict';
/* ================= BOOT & LOOP ================= */
let LAST = 0, ACC_SEC = 0, SAVE_ACC = 0, HUD_ACC = 0;
function realChecks() {
  const d = new Date(), h = d.getHours();
  if (h >= 22 || h < 4) S.stats.night = 1;
  if (h >= 5 && h < 7) S.stats.dawn = 1;
  const day = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  if (!S.days.includes(day)) { S.days.push(day); if (S.days.length > 40) S.days.shift(); }
  if (S.speed === 3) S.stats.fast = 1;
  checkAch();
}
let LAST_R = 0;
function frame(now) {
  if (CFG.fps === 30 && now - LAST_R < 28) { requestAnimationFrame(frame); return; }
  LAST_R = now;
  const rdt = Math.min(.1, (now - LAST) / 1000 || 0); LAST = now;
  let sim = rdt * SPEEDS[S.speed];
  if (!$('modal').hidden) sim = 0;
  while (sim > 0) { const d = Math.min(.25, sim); tick(d); sim -= d; }
  ACC_SEC += rdt; SAVE_ACC += rdt; HUD_ACC += rdt;
  if (HUD_ACC > .25) { HUD_ACC = 0; updHUD(); if (UI.cardId && !$('card').hidden) renderCard(); }
  if (ACC_SEC > 1) { ACC_SEC = 0; realChecks(); if (UI.tab === 'vill' || UI.tab === 'tech') renderSheet(); }
  if (SAVE_ACC > 15) { SAVE_ACC = 0; saveGame(); }
  render(rdt, now);
  requestAnimationFrame(frame);
}
function boot() {
  cv = $('cv'); ctx = cv.getContext('2d', { alpha: false });
  buildGround(); buildShore(); buildCliffTex(); buildSprites(); buildDecor();
  try { UI.seenAch = +localStorage.getItem('fv_seen') || 0; } catch (e) {}
  const had = loadGame();
  if (!had) newGame();
  resize();
  if (VW < 600) cam.zoom = 1.05;
  cam.x = SITE.hearth.x + 40; cam.z = SITE.hearth.z + 60;
  window.addEventListener('resize', resize);
  buildHUD(); initInput(); initSettings();
  if (had) {
    const away = (Date.now() - (S.savedAt || Date.now())) / 1000;
    S.stats.awayMax = Math.max(S.stats.awayMax, away);
    if (away > 120) { const r = simulateAway(away); if (r) awayModal(r); }
  }
  checkAch(!had);
  if (!S.intro) introModal();
  updHUD();
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); else { const away = (Date.now() - S.savedAt) / 1000; if (away > 120) { S.stats.awayMax = Math.max(S.stats.awayMax, away); const r = simulateAway(away); if (r) awayModal(r); saveGame(); } } });
  window.addEventListener('pagehide', saveGame);
  requestAnimationFrame(t => { LAST = t; frame(t); });
}
setTimeout(() => { boot(); const l = document.getElementById('loading'); if (l) l.remove(); }, 30);
