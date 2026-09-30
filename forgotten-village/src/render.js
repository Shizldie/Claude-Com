'use strict';
/* ================= CAMERA & PROJECTION =================
   The ground is a true perspective plane; every object is a flat 2D
   billboard standing on it, scaled by depth. */
const WC = 2200, CHR = 0.6, CH = WC * CHR;
const cam = { x: 2000, z: 1470, zoom: 0.9 };
let cv, ctx, VW = 400, VH = 700, DPR = 1, HOR = 0, CY = 0;
function camParams() { CY = VH * 0.56; HOR = CY - CH * cam.zoom; }
function proj(x, z) { const w = WC + cam.z - z; if (w < 60) return null; const s = cam.zoom * WC / w; return { x: VW / 2 + (x - cam.x) * s, y: HOR + CH * s, s }; }
function unproj(sx, sy) { const d = sy - HOR; if (d <= 2) return null; const s = d / CH; const w = cam.zoom * WC / s; return { x: cam.x + (sx - VW / 2) / s, z: cam.z + WC - w }; }
function clampCam() { cam.zoom = Math.max(.45, Math.min(1.7, cam.zoom)); cam.x = Math.max(350, Math.min(3300, cam.x)); cam.z = Math.max(300, Math.min(2620, cam.z)); }
let ROT = false;
const PLATEAU_FAR = '#4f7439';
function resize() {
  const low = S && S.settings.low;
  DPR = Math.min(window.devicePixelRatio || 1, dprCap());
  const pw = window.innerWidth, ph = window.innerHeight, app = document.getElementById('app');
  // Landscape by default: on a portrait screen the whole game is turned sideways
  // unless the player chose upright play in the menu.
  ROT = ph > pw && !(S && S.settings.orient === 'portrait');
  if (ROT) { VW = ph; VH = pw; app.style.width = ph + 'px'; app.style.height = pw + 'px'; app.style.transform = `translateX(${pw}px) rotate(90deg)`; }
  else { VW = pw; VH = ph; app.style.width = pw + 'px'; app.style.height = ph + 'px'; app.style.transform = 'none'; }
  app.classList.toggle('wide', VW >= 760); app.classList.toggle('narrow', VW < 440);
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
}
function toLocal(e) { return ROT ? { x: e.clientY, y: window.innerWidth - e.clientX } : { x: e.clientX, y: e.clientY }; }

/* ================= DECOR ================= */
let DECOR = [], SPARKLES = [], SWAMP_FX = [];
function buildDecor() {
  const r = mulberry(99); DECOR = [];
  const GRID = new Map(), key = (x, z) => ((x / 60) | 0) + ',' + ((z / 60) | 0);
  const add = o => { if (o.spr && o.spr.h < 200 && !o.cliff) { o.k = .82 + r() * .42; o.fl = r() < .5; } DECOR.push(o); const k = key(o.x, o.z); if (!GRID.has(k)) GRID.set(k, []); GRID.get(k).push(o); };
  const near = (x, z, d) => { const gx = (x / 60) | 0, gz = (z / 60) | 0; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const l = GRID.get((gx + i) + ',' + (gz + j)); if (l) for (const o of l) if (!o.cliff && Math.hypot(o.x - x, o.z - z) < d) return true; } return false; };
  const siteNear = (x, z, d) => { for (const s of SITES) { if (s.id === 'swamp') continue; if (Math.hypot(s.x - x, s.z - z) < s.r + d) return true; } return false; };
  // --- scattered scenery ---
  const hx = SITE.hearth.x + 40, hz = SITE.hearth.z;
  for (let i = 0; i < 20000 && DECOR.length < 980; i++) {
    const x = r() * 4000, z = r() * 2800; const lv = landVal(x, z);
    if (lv < .012 || inPond(x, z) || nearStream(x, z, 46)) continue;
    let spr, sp = 44;
    const above = beyondCliff(x, z, -40);
    if (beyondCliff(x, z, 70) && !above) continue; // keep the cliff foot clear
    if (above) continue;
    else if (inSwamp(x, z) || swampVal(x, z) < 1.2) {
      const q = r(); spr = q < .28 ? pick2(SPR.deadTree, r) : q < .45 ? pick2(SPR.cattail, r) : q < .58 ? pick2(SPR.thorns, r) : q < .68 ? SPR.stump[0] : q < .76 ? SPR.bones[0] : q < .8 ? SPR.totem[0] : q < .83 ? SPR.ruinHut[0] : pick2(SPR.cattail, r); sp = 46;
    } else if (lv / beachW(x, z) < .12) { const q = r(); if (q < .38) spr = pick2(SPR.palm, r); else if (q < .52) spr = SPR.drift[0]; else if (q < .62) spr = SPR.star[0]; else if (q < .8) spr = pick2(SPR.rock, r); else continue; sp = 60; }
    else {
      const dc = Math.hypot((x - hx) / 1.2, z - hz), forest = fbm(x / 300, z / 300, 11), mea = fbm(x / 500, z / 500, 23);
      if (dc < 440 || (dc < 760 && r() < .55)) { if (r() < .9) continue; spr = r() < .5 ? pick2(SPR.flowers, r) : pick2(SPR.fern, r); sp = 60; }
      else if (forest > .58) { const q = r(); spr = q < .45 ? pick2(SPR.broad, r) : q < .65 ? pick2(SPR.spire, r) : q < .75 ? pick2(SPR.mushroom, r) : q < .9 ? pick2(SPR.fern, r) : pick2(SPR.bush, r); }
      else if (mea > .6) { const q = r(); spr = q < .35 ? pick2(SPR.flowers, r) : q < .6 ? pick2(SPR.bush, r) : q < .8 ? pick2(SPR.fern, r) : SPR.broad[0]; sp = 40; }
      else { if (r() < .4) continue; const q = r(); spr = q < .3 ? pick2(SPR.broad, r) : q < .4 ? pick2(SPR.spire, r) : q < .48 ? pick2(SPR.palm, r) : q < .62 ? pick2(SPR.bush, r) : q < .74 ? pick2(SPR.fern, r) : q < .84 ? pick2(SPR.flowers, r) : q < .95 ? pick2(SPR.rock, r) : pick2(SPR.mushroom, r); }
    }
    if (!(inSwamp(x, z)) && r() < .2) continue;
    const big = spr.h > 90 ? 56 : 14;
    if (siteNear(x, z, big) || near(x, z, spr.h > 90 ? 62 : sp)) continue;
    add({ x, z, spr });
  }
  // rubble along the cliff foot
  // boulder fields, shrubs and ferns heaped along the foot of both walls
  const pool = (x, z) => Math.hypot((x - WATERFALL.x) / 150, (z - cliffZ(WATERFALL.x) - 60) / 80) < 1.15;
  const heap = (x, z, depth) => {
    if (siteNear(x, z, 16) || pool(x, z) || landVal(x, z) < .05 || nearStream(x, z, 40) || (z < CLIFF_E_END + 80 && x > sideX(z) - 20)) return;
    const big = depth < .35 ? Math.floor(r() * 3) : 2 + Math.floor(r() * 4);
    add({ x, z, spr: SPR.boulder[big] });
    const q = r();
    if (q < .35) add({ x: x + (r() - .5) * 60, z: z + 8 + r() * 14, spr: pick2(SPR.fern, r) });
    else if (q < .6) add({ x: x + (r() - .5) * 70, z: z + 10 + r() * 16, spr: pick2(SPR.bush, r) });
    else if (q < .7) add({ x: x + (r() - .5) * 50, z: z + 6 + r() * 10, spr: SPR.boulder[5] });
  };
  for (let x = -40; x < 4040; x += 34 + r() * 46) { const d = r(); heap(x, cliffZ(x) + 16 + d * d * 150, d); }
  for (let z = cliffZ(3700) + 30; z < CLIFF_E_END + 60; z += 30 + r() * 40) { const d = r(); const x = sideX(z) - 16 - d * d * 150; if (!inSwamp(x, z)) heap(x, z, d); }
  for (let i = 0; i < 260; i++) { const x = r() * 4000, z = r() * 2800; if (landVal(x, z) < -.03) SPARKLES.push({ x, z, p: r() * 6.28 }); }
  for (let i = 4; i < RIVER.length - 2; i += 2) SPARKLES.push({ x: RIVER[i][0] + (r() - .5) * 14, z: RIVER[i][1], p: r() * 6.28, river: 1 });
  // blend the Mire into the meadow: reeds, ferns and bushes on the fringe, boulders along the cliff foot
  for (let i = 0; i < 2600; i++) {
    const x = SWAMP.x + (r() - .5) * SWAMP.rx * 3.4, z = SWAMP.z + (r() - .5) * SWAMP.rz * 3.4, v = swampVal(x, z);
    if (v < 1 || v > 1.75 || landVal(x, z) < .05 || beyondCliff(x, z, -20) || nearStream(x, z, 44) || inPond(x, z)) continue;
    const q = r(); let spr;
    if (q < .3) spr = pick2(SPR.cattail, r); else if (q < .5) spr = pick2(SPR.fern, r); else if (q < .64) spr = pick2(SPR.bush, r);
    else if (q < .74) spr = pick2(SPR.deadTree, r); else if (q < .84) spr = pick2(SPR.broad, r); else if (q < .94) spr = pick2(SPR.rock, r); else spr = SPR.stump[0];
    if (near(x, z, spr.h > 90 ? 80 : 40)) continue;
    add({ x, z, spr });
  }
  for (let i = 0; i < 900; i++) {
    const x = SWAMP.x + (r() - .5) * SWAMP.rx * 2.6, z = 1900 + r() * 400, v = swampVal(x, z);
    if (v < .9 || v > 1.6 || x < sideX(z) - 260 || z > 2150 || beyondCliff(x, z, 10) || landVal(x, z) < .05 || nearStream(x, z, 44)) continue;
    if (near(x, z, 46)) continue;
    add({ x, z, spr: SPR.boulder[Math.floor(r() * 6)] });
  }
  SWAMP_FX = [];
  for (let i = 0; i < 400 && SWAMP_FX.length < 70; i++) { const x = SWAMP.x + (r() - .5) * SWAMP.rx * 2, z = SWAMP.z + (r() - .5) * SWAMP.rz * 2; if (swampVal(x, z) < .85 && landVal(x, z) > .03) SWAMP_FX.push({ x, z, p: r() * 10, k: r() }); }
}
function pick2(a, r) { return a[Math.floor(r() * a.length)]; }

/* ================= SITE VISUALS ================= */
function siteDrawables(out) {
  const m = S.myst, add = (x, z, spr, extra) => out.push({ z, x, spr, ...extra });
  const L = S.food < 60 ? 0 : S.food < 600 ? 1 : S.food < 3000 ? 2 : 3;
  add(SITE.larder.x, SITE.larder.z, SPR.larder[L]);
  add(SITE.hearth.x, SITE.hearth.z, SPR.hearth[S.fire.lit ? 3 : S.fire.wood && S.fire.grass ? 2 : S.fire.wood ? 1 : S.fire.grass ? 2 : 0], { fire: S.fire.lit });
  add(SITE.study.x, SITE.study.z, SPR.study);
  add(SITE.bramble.x, SITE.bramble.z, SPR.bramble[S.bramble < 5 ? 0 : S.bramble < 600 ? 1 : 2]);
  add(SITE.woodpile.x, SITE.woodpile.z, SPR.woodpile);
  add(SITE.reeds.x, SITE.reeds.z, SPR.reeds);
  add(SITE.torches.x, SITE.torches.z, SPR.torches[m.m3 ? 1 : 0]);
  add(SITE.hive.x, SITE.hive.z, SPR.hive, { bees: !m.m3 });
  add(SITE.springrocks.x, SITE.springrocks.z, m.m1 ? SPR.spring : SPR.springrocks);
  if (!m.m4) add(SITE.wreck.x, SITE.wreck.z, SPR.wreck);
  add(SITE.nets.x, SITE.nets.z, m.m5 ? SPR.nets : SPR.tiderocks);
  add(SITE.terrace.x, SITE.terrace.z, m.m6 ? SPR.field : SPR.terrace);
  add(SITE.twisted.x, SITE.twisted.z, m.m7 ? SPR.scarecrow : SPR.twisted);
  add(SITE.hall.x, SITE.hall.z, m.m8 ? SPR.school : SPR.hall);
  add(SITE.mantle.x, SITE.mantle.z, SPR.dais[chiefAlive() ? 1 : 0]);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + .3; add(SITE.circle.x + Math.cos(a) * 82, SITE.circle.z + Math.sin(a) * 44, (m.m10 ? SPR.stoneLit : SPR.stone)[i]); }
  add(SITE.cauldron.x, SITE.cauldron.z, SPR.cauldron[m.m11 ? 1 : 0], { brew: m.m11 });
  add(SITE.mending.x, SITE.mending.z, m.m12 ? SPR.mending : SPR.oldFound);
  add(SITE.lodge.x, SITE.lodge.z, m.m13 ? SPR.lodge : SPR.loom);
  add(SITE.dunes.x, SITE.dunes.z, SPR.dune[m.m14 ? 1 : 0], { glint: !m.m14 });
  add(SITE.belfry.x, SITE.belfry.z, m.m16 ? SPR.belfry : SPR.plinth);
  add(HUT_SITES[0].x, HUT_SITES[0].z, SPR.hut);
  for (const p of S.projects) {
    if (p.kind === 'hut') add(p.x, p.z, p.done ? SPR.hut : p.prog >= p.need * .5 ? SPR.hutFrame : SPR.hutFound, { prog: p.done ? null : p });
    else if (!p.done) out.push({ z: p.z + .1, x: p.x, spr: null, prog: p });
  }
}

/* ================= FRAME ================= */
let RAIN = [], FRAME_T = 0, FLASH = 0, CLOUDS = [];
const UIState = { hover: null, pointer: null, selId: 0, star: null };
function nightAmount() {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
  if (h >= 7 && h < 18) return 0;
  if (h >= 18 && h < 20.5) return (h - 18) / 2.5;
  if (h >= 5 && h < 7) return 1 - (h - 5) / 2;
  return 1;
}
function render(rdt, now) {
  FRAME_T = now / 1000;
  camParams();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = true;
  // sky & ocean
  if (HOR > 0) { const g = ctx.createLinearGradient(0, 0, 0, HOR); g.addColorStop(0, '#6f9fc0'); g.addColorStop(1, '#d8e4e4'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, HOR + 2); }
  const y0 = Math.max(0, Math.floor(HOR + 1));
  ctx.fillStyle = PAL.deep; ctx.fillRect(0, y0, VW, VH - y0);
  // ground strips
  const step = S.settings.low ? 5 : 3, TW = TEX.width, TH = TEX.height;
  for (let y = y0; y < VH; y += step) {
    const ya = y, yb = Math.min(VH, y + step);
    const sa = (ya - HOR) / CH, sb = (yb - HOR) / CH; if (sa <= 0) continue;
    const za = cam.z + WC - cam.zoom * WC / sa, zb = cam.z + WC - cam.zoom * WC / sb;
    const s = ((ya + yb) / 2 - HOR) / CH;
    let sx0 = (cam.x - VW / 2 / s) * TS, sx1 = (cam.x + VW / 2 / s) * TS, sy0 = za * TS, sy1 = zb * TS;
    if (sy1 <= 0) { ctx.fillStyle = za < -1400 ? '#c9d7d6' : PLATEAU_FAR; ctx.fillRect(0, ya, VW, yb - ya + .7); continue; }
    if (sy0 >= TH || sx1 <= 0 || sx0 >= TW) continue;
    if (sx1 > TW && sx0 < TW) { const xs = VW - (sx1 - TW) / (sx1 - sx0) * VW, yy = Math.min(TH - 1, Math.max(0, Math.round(sy0))); ctx.drawImage(TEX, TW - 2, yy, 2, Math.max(1, Math.min(TH - yy, sy1 - sy0)), xs - 1, ya, VW - xs + 1, yb - ya + .7); }
    if (false) { const xs = VW - (sx1 - TW) / (sx1 - sx0) * VW; ctx.fillStyle = PLATEAU_FAR; ctx.fillRect(xs - 1, ya, VW - xs + 1, yb - ya + .7); }
    const W0 = sx1 - sx0, H0 = sy1 - sy0;
    let dx0 = 0, dx1 = VW, dy0 = ya, dy1 = yb;
    if (sx0 < 0) { dx0 = (-sx0) / W0 * VW; sx0 = 0; }
    if (sx1 > TW) { dx1 = VW - (sx1 - TW) / W0 * VW; sx1 = TW; }
    if (sy0 < 0) { dy0 = ya + (-sy0) / H0 * (yb - ya); sy0 = 0; }
    if (sy1 > TH) { dy1 = yb - (sy1 - TH) / H0 * (yb - ya); sy1 = TH; }
    if (sx1 - sx0 < .01 || sy1 - sy0 < .01) continue;
    ctx.drawImage(TEX, sx0, sy0, sx1 - sx0, sy1 - sy0, dx0, dy0, dx1 - dx0, dy1 - dy0 + .7);
  }
  { // where the far east upland meets open sea: feathered dark waterline plus a pale surf wash
    const pe = proj(4000, CLIFF_E_END + 10), pc = proj(3790, CLIFF_E_END + 10);
    if (pe && pc && pc.x < VW && pe.y > -60 && pe.y < VH + 60) {
      const y = pe.y, s = pe.s, N = 14, x0 = pc.x, span = Math.max(20, 90 * s);
      let g = ctx.createLinearGradient(0, y - 30 * s, 0, y + 4 * s); g.addColorStop(0, 'rgba(40,70,50,0)'); g.addColorStop(1, 'rgba(40,70,50,.55)');
      let g2 = ctx.createLinearGradient(0, y, 0, y + 34 * s); g2.addColorStop(0, 'rgba(60,140,150,.55)'); g2.addColorStop(1, 'rgba(60,140,150,0)');
      for (let i = 0; i < N; i++) { const xa = x0 + span * i / N, w = (i === N - 1 ? VW - xa : span / N + 1); if (xa > VW) break; ctx.globalAlpha = (i + 1) / N; ctx.fillStyle = g; ctx.fillRect(xa, y - 30 * s, w, 34 * s); ctx.fillStyle = g2; ctx.fillRect(xa, y, w, 34 * s); }
      ctx.globalAlpha = 1;
    }
  }
  if (HOR > -300) { const h0 = Math.max(0, HOR), hz = ctx.createLinearGradient(0, h0, 0, h0 + 220); hz.addColorStop(0, 'rgba(205,218,214,.75)'); hz.addColorStop(1, 'rgba(205,218,214,0)'); ctx.fillStyle = hz; ctx.fillRect(0, h0, VW, 220); }
  // ocean glints
  ctx.strokeStyle = 'rgba(235,248,245,.5)'; ctx.lineCap = 'round';
  for (const sp of SPARKLES) { const a = Math.sin(FRAME_T * 1.3 + sp.p); if (a < .6) continue; const p = proj(sp.x, sp.z); if (!p || p.x < -10 || p.x > VW + 10 || p.y < 0 || p.y > VH) continue; ctx.globalAlpha = (a - .6) * 1.6; ctx.lineWidth = 1.4 * p.s; ctx.beginPath(); ctx.moveTo(p.x - 6 * p.s, p.y); ctx.quadraticCurveTo(p.x, p.y - 2.5 * p.s, p.x + 6 * p.s, p.y); ctx.stroke(); }
  ctx.globalAlpha = 1;
  drawWaves();
  // pond ripples
  { const p = proj(POND.x, POND.z); if (p) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const r = ((FRAME_T * 14 + i * 30) % 90); ctx.globalAlpha = 1 - r / 90; ctx.beginPath(); ctx.ellipse(p.x + 30 * p.s, p.y, r * p.s, r * .35 * p.s, 0, 0, 6.28); ctx.stroke(); } ctx.globalAlpha = 1; } }

  drawCliffs();
  // drag hover ring (on ground, before objects)
  if (DRAG.v && UIState.hover) drawHoverRing(UIState.hover);

  // collect drawables
  const all = [];
  for (const o of DECOR) all.push(o);
  siteDrawables(all);
  for (const it of S.items) all.push({ z: it.z, x: it.x, item: it });
  for (const v of S.vill) if (v !== DRAG.v && v.st !== 'indoors') all.push({ z: v.z + .05, x: v.x, vill: v });
  const list = [];
  for (const o of all) { const p = proj(o.x, o.z); if (!p) continue; if (p.x < -170 * p.s || p.x > VW + 170 * p.s || p.y < -20 || p.y > VH + 380 * p.s) continue; o._p = p; list.push(o); }
  list.sort((a, b) => a.z - b.z);
  const emotes = [];
  for (const o of list) {
    const p = o._p;
    if (o.vill) { drawVillager(o.vill, p.x, p.y, p.s, emotes); continue; }
    if (o.item) { drawItem(o.item, p); continue; }
    if (o.spr) { if (o.k) drawSprK(o.spr, p, o.k, o.fl); else drawSpr(o.spr, p); }
    if (o.fire) drawFire(p);
    if (o.bees) drawBees(p);
    if (o.brew) drawBrewGlow(p);
    if (o.glint) drawGlint(p, 0, -8);
    if (o.prog) emotes.push({ bar: o.prog, x: p.x, y: p.y - (o.spr ? o.spr.ay * p.s + 8 : 40 * p.s), s: p.s });
  }
  // dragged villager
  if (DRAG.v && UIState.pointer) { const pt = UIState.pointer; const s = Math.max(.45, (pt.y + 14 - HOR) / CH) * 1.12; drawVillager(DRAG.v, pt.x, pt.y + 14, s, emotes, true); }
  drawSwampFx();
  // night
  const night = nightAmount();
  const wk = S.weather.k;
  let dark = night * .45 + (wk === 'storm' ? .22 : wk === 'rain' ? .12 : wk === 'cloudy' ? .06 : 0);
  if (dark > 0) { ctx.fillStyle = `rgba(14,22,48,${dark.toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
  if (night > .2) drawNightLights(night);
  if (!S.settings.low && CFG.weather) drawWeather(rdt);
  else if (wk === 'fog') { ctx.fillStyle = 'rgba(225,232,235,.35)'; ctx.fillRect(0, 0, VW, VH); }
  if (FLASH > 0) { ctx.fillStyle = `rgba(255,255,255,${FLASH})`; ctx.fillRect(0, 0, VW, VH); FLASH -= rdt * 2; }
  drawStar(now);
  // emotes & bars on top
  for (const e of emotes) e.bar ? drawBar(e) : drawEmote(e);
  if (DRAG.v && UIState.hover && UIState.pointer) drawDropLabel();
}
function drawSprK(spr, p, k, fl) {
  const s = p.s * k;
  if (!fl) { ctx.drawImage(spr.c, p.x - spr.ax * s, p.y - spr.ay * s, spr.w * s, spr.h * s); return; }
  ctx.save(); ctx.translate(p.x, 0); ctx.scale(-1, 1); ctx.drawImage(spr.c, -spr.ax * s, p.y - spr.ay * s, spr.w * s, spr.h * s); ctx.restore();
}
function drawSpr(spr, p) { const s = p.s; ctx.drawImage(spr.c, p.x - spr.ax * s, p.y - spr.ay * s, spr.w * s, spr.h * s); }
function drawFire(p) {
  const s = p.s, t = FRAME_T;
  ctx.save(); ctx.translate(p.x, p.y - 8 * s); ctx.scale(s, s);
  const g = ctx.createRadialGradient(0, -6, 2, 0, -6, 34); g.addColorStop(0, 'rgba(255,190,90,.45)'); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -6, 34, 0, 6.28); ctx.fill();
  const fl = (x, h, w, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - w, 0); ctx.quadraticCurveTo(x - w * .8, -h * .6, x + Math.sin(t * 9 + x) * 3, -h); ctx.quadraticCurveTo(x + w * .8, -h * .6, x + w, 0); ctx.fill(); };
  const k = S.fire.fuel / 100 * .5 + .6;
  fl(-6, (18 + Math.sin(t * 11) * 3) * k, 6, '#e8542e'); fl(6, (16 + Math.sin(t * 13 + 1) * 3) * k, 6, '#e8542e'); fl(0, (24 + Math.sin(t * 8) * 4) * k, 8, '#f2922e'); fl(0, (14 + Math.sin(t * 15) * 2) * k, 5, '#ffd76a');
  ctx.restore();
}
function drawBees(p) { const s = p.s; ctx.fillStyle = '#2a2010'; for (let i = 0; i < 7; i++) { const a = FRAME_T * (2 + i * .3) + i; ctx.fillRect(p.x + (10 + Math.cos(a) * 16) * s, p.y + (-38 + Math.sin(a * 1.3) * 10) * s, 2.2 * s, 2.2 * s); } }
function drawBrewGlow(p) { const s = p.s; ctx.fillStyle = 'rgba(140,240,190,.6)'; for (let i = 0; i < 3; i++) { const k = (FRAME_T * .6 + i / 3) % 1; ctx.beginPath(); ctx.arc(p.x + Math.sin(k * 9 + i) * 5 * s, p.y - (22 + k * 26) * s, (3 - k * 2) * s, 0, 6.28); ctx.fill(); } }
function drawGlint(p, ox, oy) { const a = (Math.sin(FRAME_T * 3 + p.x) + 1) / 2; const s = p.s * (2 + a * 3); ctx.fillStyle = `rgba(255,250,220,${.4 + a * .6})`; ctx.save(); ctx.translate(p.x + ox * p.s, p.y + oy * p.s); ctx.beginPath(); ctx.moveTo(0, -s * 2); ctx.lineTo(s * .4, 0); ctx.lineTo(0, s * 2); ctx.lineTo(-s * .4, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s * 2, 0); ctx.lineTo(0, s * .4); ctx.lineTo(s * 2, 0); ctx.lineTo(0, -s * .4); ctx.fill(); ctx.restore(); }
function drawItem(it, p) {
  if (it.type === 'glow') { const a = .3 + .2 * Math.sin(FRAME_T * 2 + it.id); ctx.fillStyle = `rgba(140,230,240,${a})`; ctx.beginPath(); ctx.ellipse(p.x, p.y - 6 * p.s, 16 * p.s, 10 * p.s, 0, 0, 6.28); ctx.fill(); drawSpr(SPR.glowcap, p); }
  else if (it.type === 'herb') drawSpr(SPR.herb[it.sub], p);
  else { drawSpr(SPR.curio, p); drawGlint(p, 0, -6); }
}
function drawBar(e) {
  const w = 54 * Math.max(.6, e.s), h = 6, x = e.x - w / 2, y = e.y - 8;
  ctx.fillStyle = 'rgba(40,28,20,.8)'; roundRect(x - 2, y - 2, w + 4, h + 4, 4); ctx.fill();
  ctx.fillStyle = '#e8b64c'; roundRect(x, y, w * Math.min(1, e.bar.prog / e.bar.need), h, 3); ctx.fill();
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawHoverRing(h) {
  let x, z, r;
  if (h.kind === 'site') { x = h.s.x; z = h.s.z; r = h.s.r * .9; }
  else if (h.kind === 'vill') { x = h.v.x; z = h.v.z; r = 16; }
  else if (h.kind === 'item') { x = h.it.x; z = h.it.z; r = 16; }
  else return;
  const p = proj(x, z); if (!p) return;
  ctx.strokeStyle = 'rgba(255,214,110,.95)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -FRAME_T * 20;
  ctx.beginPath(); ctx.ellipse(p.x, p.y, r * p.s, r * .38 * p.s, 0, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,214,110,.15)'; ctx.fill();
}
function drawDropLabel() {
  const txt = targetLabel(UIState.hover, DRAG.v); if (!txt) return;
  const pt = UIState.pointer; ctx.font = '700 13px Nunito, system-ui, sans-serif';
  const w = ctx.measureText(txt).width + 16; let x = pt.x - w / 2, y = pt.y - 78;
  x = Math.max(6, Math.min(VW - w - 6, x)); if (y < 6) y = pt.y + 30;
  ctx.fillStyle = 'rgba(40,28,20,.9)'; roundRect(x, y, w, 24, 12); ctx.fill();
  ctx.fillStyle = '#f6e7c8'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + 8, y + 12);
}

/* ================= VILLAGERS ================= */
function drawVillager(v, X, Y, s, emotes, lifted) {
  const stg = stage(v), a = ageOf(v);
  const inWater = !lifted && (v.st === 'swim' || isWater(v.x, v.z));
  if (!lifted) { ctx.fillStyle = 'rgba(40,70,70,.25)'; ctx.beginPath(); ctx.ellipse(X, Y, (stg === 'child' ? 8 : 11) * s, 3.6 * s, 0, 0, 6.28); ctx.fill(); }
  if (UIState.selId === v.id && !lifted) { ctx.strokeStyle = '#ffd66e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(X, Y, 17 * s, 6 * s, 0, 0, 6.28); ctx.stroke(); }
  const k = stg === 'infant' ? .55 : stg === 'child' ? .58 + (a - 2) / 12 * .34 : 1;
  ctx.save();
  ctx.translate(X, Y);
  if (inWater) { ctx.beginPath(); ctx.rect(-50 * s, -90 * s, 100 * s, 90 * s - 22 * s * k); ctx.clip(); ctx.translate(0, 20 * s * k); }
  ctx.scale(s * k * v.face, s * k);
  if (lifted) ctx.rotate(Math.sin(FRAME_T * 6) * .08);
  if (v.buff.glow > S.t) { ctx.fillStyle = 'rgba(255,236,140,.4)'; ctx.beginPath(); ctx.arc(0, -24, 28, 0, 6.28); ctx.fill(); }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (stg === 'infant') drawBaby(v); else drawBody(v, stg, lifted, k);
  ctx.restore();
  if (inWater) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(X, Y - 2 * s, 14 * s, 4 * s, 0, 0, 6.28); ctx.stroke(); }
  const top = Y - (stg === 'infant' ? 18 : 50 * k) * s;
  if (v.emote || v.sick || v.st === 'wait') emotes.push({ v, x: X + 10 * s * k, y: top - 8 * s, s, e: v.emote || (v.sick ? 'sick' : 'dots') });
}
const INK = '#2b2419';
function fs(fill, lw) { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = 'rgba(30,22,14,.55)'; ctx.lineWidth = lw || 1; ctx.stroke(); }
function limb(x1, y1, x2, y2, col, w) { ctx.strokeStyle = 'rgba(30,22,14,.5)'; ctx.lineWidth = w + 1.4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); }
function drawBaby(v) {
  ctx.beginPath(); ctx.ellipse(0, -9, 8, 6.5, 0, 0, 6.28); fs('#d8ccb0');
  ctx.strokeStyle = 'rgba(120,100,70,.5)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-6, -11); ctx.quadraticCurveTo(0, -7, 6, -11); ctx.stroke();
  ctx.beginPath(); ctx.arc(3.5, -15, 5, 0, 6.28); fs(v.look.skin);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(5.8, -15.2, .8, 0, 6.28); ctx.fill();
  ctx.fillStyle = v.look.hair; ctx.beginPath(); ctx.arc(3, -18.5, 3.2, Math.PI, 6.28); ctx.fill();
}
function drawBody(v, stg, lifted) {
  const walking = v.st === 'walk' || v.st === 'swim';
  const ph = v.walkPh;
  const sw = walking ? Math.sin(ph) * 4.8 : lifted ? Math.sin(FRAME_T * 8) * 3 : 0;
  const dance = v.st === 'dance' ? Math.abs(Math.sin(ph)) * 5 : v.st === 'dig' ? Math.abs(Math.sin(ph)) * 2 : 0;
  const bob = (walking ? Math.abs(Math.sin(ph)) * 1.4 : 0) + dance;
  const elder = stg === 'elder', child = stg === 'child';
  const skin = v.look.skin, skinD = shade(skin, -.16);
  const out = v.chief ? '#8a2a2a' : OUTFITS[v.look.out].c;
  const outD = shade(out, -.25);
  const hair = elder ? '#cfcac0' : v.look.hair;
  const HR = child ? 8.2 : 7.2, HY = child ? -30 : -37;
  const lift = lifted ? 2 : 0;
  // legs & feet
  limb(-3, -13 - bob, -3 + sw, -1.5 - lift, skinD, 3.1); limb(3, -13 - bob, 3 - sw, -1.5 - lift, skinD, 3.1);
  ctx.fillStyle = '#4a3424'; ctx.beginPath(); ctx.ellipse(-2 + sw, -1 - lift, 3, 1.5, 0, 0, 6.28); ctx.ellipse(4 - sw, -1 - lift, 3, 1.5, 0, 0, 6.28); ctx.fill();
  ctx.translate(0, -bob);
  if (elder) ctx.rotate(.07);
  const hs = v.look.hs;
  if (hs === 2) { ctx.beginPath(); ctx.ellipse(-2, HY + 5, HR * .95, HR * 1.35, 0, 0, 6.28); fs(hair); }
  if (hs === 5) { ctx.beginPath(); ctx.ellipse(-HR - 1, HY + 4, 2.6, 6.5, .45, 0, 6.28); fs(hair); }
  // back arm
  const carry = !!v.carry;
  const armSw = walking ? -sw * .8 : v.st === 'work' ? Math.sin(ph * 2) * 4 : v.st === 'dance' ? -6 : 0;
  limb(-4.5, -26, carry ? -4.5 : -7 - armSw * .4, carry ? -46 : v.st === 'dance' ? -36 : -15, skinD, 2.8);
  // torso with wrap
  ctx.beginPath(); ctx.moveTo(-6.5, -12); ctx.quadraticCurveTo(-8, -24, -5, -29); ctx.lineTo(5, -29); ctx.quadraticCurveTo(8 + (v.preg ? 3 : 0), -22, 6.5 + (v.preg ? 2 : 0), -12); ctx.closePath(); fs(out);
  const tg = ctx.createLinearGradient(-7, 0, 7, 0); tg.addColorStop(0, 'rgba(255,255,255,.12)'); tg.addColorStop(.5, 'rgba(0,0,0,0)'); tg.addColorStop(1, 'rgba(0,0,0,.22)'); ctx.fillStyle = tg; ctx.fill();
  ctx.fillStyle = outD; ctx.beginPath(); ctx.moveTo(-7.4, -11); ctx.lineTo(7.4 + (v.preg ? 2 : 0), -11); ctx.lineTo(6.6, -17); ctx.lineTo(-6.6, -17); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,14,8,.35)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(-2.5, -17); ctx.moveTo(2.5, -11); ctx.lineTo(2, -17); ctx.stroke();
  line(ctx, -6.6, -17, 6.6, -17, shade(out, -.45), 1.4);
  const acc = v.chief ? 'sash' : OUTFITS[v.look.out].acc;
  if (acc === 'sash') { ctx.strokeStyle = v.chief ? '#c8a040' : shade(out, .35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -28); ctx.lineTo(5.5, -17); ctx.stroke(); }
  else if (acc === 'dots') { ctx.fillStyle = 'rgba(255,240,220,.7)'; for (const [x, y] of [[-3, -24], [2, -21], [3, -26], [-1, -19]]) { ctx.beginPath(); ctx.arc(x, y, .9, 0, 6.28); ctx.fill(); } }
  else if (acc === 'stars') { ctx.fillStyle = '#c8a646'; for (const [x, y] of [[-3, -24], [3, -21], [-1, -19]]) ctx.fillRect(x - .7, y - .7, 1.4, 1.4); }
  else if (acc === 'feathers') { ctx.beginPath(); ctx.ellipse(-7, -21, 2.4, 7, .3, 0, 6.28); fs('#8a4a3a', .8); ctx.beginPath(); ctx.ellipse(-8, -17, 2, 5.5, .55, 0, 6.28); fs('#b8923a', .8); }
  else if (acc === 'shells') { ctx.fillStyle = '#eee4d0'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-4.4 + i * 2.2, -28 + Math.abs(i - 2) * .6, .9, 0, 6.28); ctx.fill(); } }
  else { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(0, -30, 4.5, .4, 2.7); ctx.stroke(); ctx.fillStyle = '#c8b890'; ctx.beginPath(); ctx.arc(0, -25.6, 1, 0, 6.28); ctx.fill(); }
  // neck & head
  ctx.fillStyle = skinD; ctx.fillRect(-1.8, -32, 3.6, 4);
  const hx = elder ? 1 : 0, hy = HY + (elder ? 1 : 0);
  ctx.beginPath(); ctx.ellipse(hx, hy, HR * .9, HR, 0, 0, 6.28); fs(skin, .9);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(hx - HR * .35, hy + 1, HR * .5, HR * .9, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = skinD; ctx.beginPath(); ctx.ellipse(hx - 1.5, hy + 1, 1.4, 2, 0, 0, 6.28); ctx.fill();
  // hair
  ctx.beginPath(); ctx.arc(hx, hy - .4, HR + .5, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(hx + HR * .5, hy - HR * .35, hx + HR * .1, hy - HR * .5); ctx.quadraticCurveTo(hx - HR * .3, hy - HR * .25, hx - HR * .9, hy + HR * .3); ctx.closePath(); fs(hair, .9);
  if (hs === 1) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(hx + i * 3.5 - 2, hy - HR + 1.5); ctx.lineTo(hx + i * 3.5 + .5, hy - HR - 3.5); ctx.lineTo(hx + i * 3.5 + 2.5, hy - HR + 1.5); fs(hair, .7); }
  if (hs === 3) { ctx.beginPath(); ctx.arc(hx - 4, hy - HR - .5, 3.4, 0, 6.28); fs(hair, .8); }
  if (hs === 4) for (let i = 0; i < 6; i++) { const aa = Math.PI * 1.02 + i / 5 * Math.PI * .96; ctx.beginPath(); ctx.arc(hx + Math.cos(aa) * HR * .95, hy + Math.sin(aa) * HR * .95, 2.6, 0, 6.28); fs(hair, .6); }
  if (hs === 2 || hs === 5) { ctx.beginPath(); ctx.ellipse(hx - HR * .55, hy + 2, 2.4, 5, 0, 0, 6.28); fs(hair, .7); }
  if (v.sex === 'm' && !child && v.id % 3 === 0 && !elder) { ctx.fillStyle = shade(hair, .1); ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(hx + 3, hy + 4.5, 3.8, 2.4, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
  if (elder) { ctx.fillStyle = hair; ctx.globalAlpha = v.sex === 'm' ? .8 : 0; ctx.beginPath(); ctx.ellipse(hx + 3, hy + 5, 3.4, 2.8, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
  // face
  const blink = (Math.floor(FRAME_T * 10 + v.id * 7) % 43) === 0;
  const ex1 = hx + 2.2, ex2 = hx + 5.6, ey = hy;
  ctx.strokeStyle = 'rgba(40,28,18,.7)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(ex1 - 1.4, ey - 2); ctx.lineTo(ex1 + 1, ey - 2.3); ctx.moveTo(ex2 - 1, ey - 2.3); ctx.lineTo(ex2 + 1.3, ey - 2); ctx.stroke();
  if (blink || v.sick) { ctx.beginPath(); ctx.moveTo(ex1 - 1, ey); ctx.lineTo(ex1 + 1, ey); ctx.moveTo(ex2 - 1, ey); ctx.lineTo(ex2 + 1, ey); ctx.stroke(); }
  else { ctx.fillStyle = '#f2ece2'; ctx.beginPath(); ctx.ellipse(ex1, ey, 1.2, .9, 0, 0, 6.28); ctx.ellipse(ex2, ey, 1.2, .9, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#2a1c12'; ctx.beginPath(); ctx.arc(ex1 + .3, ey, .7, 0, 6.28); ctx.arc(ex2 + .3, ey, .7, 0, 6.28); ctx.fill(); }
  ctx.strokeStyle = shade(skin, -.35); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(hx + 4.4, ey + .5); ctx.lineTo(hx + 5.4, ey + 2.6); ctx.lineTo(hx + 4.4, ey + 3); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,40,30,.7)'; ctx.lineWidth = .8; ctx.beginPath(); if (v.sick) { ctx.moveTo(hx + 2.8, hy + 5); ctx.quadraticCurveTo(hx + 3.8, hy + 4.3, hx + 4.8, hy + 5); } else { ctx.moveTo(hx + 2.8, hy + 4.6); ctx.quadraticCurveTo(hx + 3.8, hy + 5.1, hx + 4.8, hy + 4.6); } ctx.stroke();
  if (v.sick) { ctx.fillStyle = 'rgba(120,170,90,.3)'; ctx.beginPath(); ctx.ellipse(hx, hy, HR * .9, HR, 0, 0, 6.28); ctx.fill(); }
  if (elder) { ctx.strokeStyle = 'rgba(80,50,30,.35)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(hx + 1, hy - 4); ctx.lineTo(hx + 5, hy - 4.3); ctx.moveTo(hx + 6.5, ey + 1); ctx.lineTo(hx + 7.3, ey + 1.8); ctx.stroke(); }
  if (v.chief) { ctx.fillStyle = '#c8a040'; ctx.fillRect(hx - HR * .9, hy - HR * .55, HR * 1.8, 2); const fc = ['#6a3a2a', '#e8e0cc', '#3a5a7a']; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(hx - 4 + i * 2.6, hy - HR - 3.5, 1.5, 5.5, -.3 + i * .25, 0, 6.28); fs(fc[i], .6); } }
  // front arm
  limb(4.5, -26, carry ? 4.5 : 7 + armSw * .4, carry ? -46 : v.st === 'work' ? -18 + armSw : v.st === 'dance' ? -36 : -15, skin, 2.8);
  if (elder && !carry) { ctx.strokeStyle = '#6a4a30'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(8, -16); ctx.lineTo(10.5, bob); ctx.stroke(); }
  if (carry) drawCarry(v.carry);
}
function sparkleC(x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill(); }
function drawCarry(c) {
  ctx.save(); ctx.translate(0, -50);
  switch (c.k) {
    case 'food': ctx.fillStyle = '#9a6a38'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(8, -6); ctx.lineTo(6, 3); ctx.lineTo(-6, 3); ctx.fill(); for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#c8323f', '#e3a23a', '#7fb04a', '#8b5ab8'][i]; ctx.beginPath(); ctx.arc(-5 + i * 3.4, -7, 2.3, 0, 6.28); ctx.fill(); } break;
    case 'fish': ctx.fillStyle = '#7fa6b8'; ctx.beginPath(); ctx.ellipse(0, -2, 9, 3.6, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.moveTo(8, -2); ctx.lineTo(13, -6); ctx.lineTo(13, 2); ctx.fill(); break;
    case 'honey': ctx.fillStyle = '#c48a2a'; ctx.beginPath(); ctx.ellipse(0, -3, 6, 6, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#f2c24a'; ctx.fillRect(-4, -10, 8, 3); break;
    case 'wood': ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, -1); ctx.lineTo(10, -4); ctx.moveTo(-10, -6); ctx.lineTo(10, -2); ctx.stroke(); break;
    case 'reeds': ctx.strokeStyle = '#d6bc6a'; ctx.lineWidth = 1.4; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-10, -3 + i * .5); ctx.lineTo(10, -6 + i); ctx.stroke(); } break;
    case 'torch': case 'torchlit': ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-2, 6); ctx.lineTo(3, -10); ctx.stroke(); if (c.k === 'torchlit') { ctx.fillStyle = '#f2922e'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(3 + Math.sin(FRAME_T * 12) * 2, -22, 6, -10); ctx.fill(); ctx.fillStyle = 'rgba(200,200,200,.5)'; ctx.beginPath(); ctx.arc(5, -24 - (FRAME_T * 8 % 8), 3, 0, 6.28); ctx.fill(); } break;
    case 'herb': ctx.fillStyle = '#4a8a3a'; ctx.fillRect(-1, -4, 2, 8); ctx.fillStyle = HERB[c.sub].c; ctx.beginPath(); ctx.arc(-3, -5, 3, 0, 6.28); ctx.arc(3, -6, 3, 0, 6.28); ctx.fill(); break;
    case 'glow': ctx.fillStyle = '#eadfc8'; ctx.fillRect(-1, -4, 2, 6); ctx.fillStyle = '#8fe0e8'; ctx.beginPath(); ctx.ellipse(0, -5, 6, 3.5, 0, 0, 6.28); ctx.fill(); break;
    case 'tongue': ctx.fillStyle = '#b8863a'; ctx.beginPath(); ctx.ellipse(0, -2, 4, 8, 0, 0, 6.28); ctx.fill(); break;
  }
  ctx.restore();
}
function drawEmote(e) {
  const r = 8 * Math.max(.7, e.s), x = e.x, y = e.y + Math.sin(FRAME_T * 3 + (e.v ? e.v.id : 0)) * 1.5;
  ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - r * .5, y + r * .7); ctx.lineTo(x - r * .9, y + r * 1.35); ctx.lineTo(x, y + r * .9); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - r * .5, y + r * .6); ctx.lineTo(x - r * .9, y + r * 1.3); ctx.lineTo(x + .5, y + r * .8); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${Math.round(r * 1.3)}px Nunito, system-ui, sans-serif`;
  switch (e.e) {
    case '?': ctx.fillStyle = '#3b6fb0'; ctx.fillText('?', x, y + .5); break;
    case '!': ctx.fillStyle = '#d9772e'; ctx.fillText('!', x, y + .5); break;
    case 'no': ctx.fillStyle = '#b8423a'; ctx.fillText('×', x, y); break;
    case 'heart': ctx.fillStyle = '#e0566e'; ctx.beginPath(); ctx.arc(x - r * .28, y - r * .12, r * .32, 0, 6.28); ctx.arc(x + r * .28, y - r * .12, r * .32, 0, 6.28); ctx.moveTo(x - r * .58, y); ctx.lineTo(x, y + r * .55); ctx.lineTo(x + r * .58, y); ctx.fill(); break;
    case 'sick': ctx.strokeStyle = '#4f9a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let a = 0; a < 10; a += .3) ctx.lineTo(x + Math.cos(a + FRAME_T * 3) * a * r * .06, y + Math.sin(a + FRAME_T * 3) * a * r * .06); ctx.stroke(); break;
    case 'bubble': ctx.strokeStyle = '#3b8fb0'; ctx.lineWidth = 1.3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x - 3 + i * 3, y + 2 - i * 3, 1.6 + i * .4, 0, 6.28); ctx.stroke(); } break;
    default: ctx.fillStyle = '#6b5a48'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(x + i * r * .4, y, r * .13, 0, 6.28); ctx.fill(); }
  }
  ctx.textAlign = 'start';
}
function drawNightLights(night) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const f of SWAMP_FX) { if (f.k > .35) continue; const p = proj(f.x, f.z); if (!p || p.x < -30 || p.x > VW + 30 || p.y < 0 || p.y > VH + 30) continue; const a = (.5 + .5 * Math.sin(FRAME_T * 1.3 + f.p)) * night; const r = 20 * p.s; const g = ctx.createRadialGradient(p.x, p.y - 4 * p.s, 1, p.x, p.y - 4 * p.s, r); g.addColorStop(0, `rgba(150,255,110,${.55 * a})`); g.addColorStop(1, 'rgba(150,255,110,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
  if (S.fire.lit) { const p = proj(SITE.hearth.x, SITE.hearth.z); if (p) { const r = 150 * p.s; const g = ctx.createRadialGradient(p.x, p.y - 10 * p.s, 5, p.x, p.y - 10 * p.s, r); g.addColorStop(0, `rgba(255,160,70,${.45 * night})`); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); } }
  for (const it of S.items) if (it.type === 'glow') { const p = proj(it.x, it.z); if (!p) continue; const r = 26 * p.s; const g = ctx.createRadialGradient(p.x, p.y - 6 * p.s, 1, p.x, p.y - 6 * p.s, r); g.addColorStop(0, `rgba(120,230,240,${.5 * night})`); g.addColorStop(1, 'rgba(120,230,240,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
  if (S.myst.m10) { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + .3; const p = proj(SITE.circle.x + Math.cos(a) * 82, SITE.circle.z + Math.sin(a) * 44); if (!p) continue; ctx.fillStyle = `rgba(140,230,210,${.25 * night})`; ctx.beginPath(); ctx.arc(p.x, p.y - 30 * p.s, 16 * p.s, 0, 6.28); ctx.fill(); } }
  ctx.restore();
}
function drawWeather(rdt) {
  const k = S.weather.k;
  if (k === 'rain' || k === 'storm') {
    const n = k === 'storm' ? 140 : 80;
    while (RAIN.length < n) RAIN.push({ x: Math.random() * VW, y: Math.random() * VH, l: 8 + Math.random() * 10 });
    ctx.strokeStyle = 'rgba(200,220,240,.5)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const r of RAIN) { r.y += rdt * 600; r.x -= rdt * 90; if (r.y > VH) { r.y = -10; r.x = Math.random() * (VW + 60); } ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 3, r.y + r.l); }
    ctx.stroke();
    if (k === 'storm' && Math.random() < rdt * .12) FLASH = .55;
  } else RAIN.length = 0;
  if (k === 'fog') { const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(230,236,238,.62)'); g.addColorStop(1, 'rgba(230,236,238,.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }
  if (k === 'cloudy' || k === 'fog' || k === 'rain') {
    if (!CLOUDS.length) for (let i = 0; i < 4; i++) CLOUDS.push({ x: Math.random() * VW, y: Math.random() * VH, r: 120 + Math.random() * 160 });
    ctx.fillStyle = 'rgba(20,30,50,.07)';
    for (const c of CLOUDS) { c.x += rdt * 14; if (c.x - c.r > VW) c.x = -c.r; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * .45, 0, 0, 6.28); ctx.fill(); }
  }
  if (k === 'rainbow') {
    const cx = VW * .5, cy = VH * 1.05, R = Math.max(VW, VH) * .9, cols = ['#e05050', '#e89a3a', '#e8d24a', '#5ab85a', '#4a8ad0', '#8a5ad0'];
    ctx.globalAlpha = .22; ctx.lineWidth = 9;
    cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(cx, cy, R - i * 9, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); });
    ctx.globalAlpha = 1;
  }
}
function drawStar(now) {
  const st = UIState.star; if (!st) return;
  const t = (now - st.t0) / st.dur; if (t > 1) { UIState.star = null; return; }
  const x = st.x0 + st.vx * t, y = st.y0 + st.vy * t; st.x = x; st.y = y;
  const g = ctx.createLinearGradient(x, y, x - st.vx * .18, y - st.vy * .18); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(1, 'rgba(255,250,220,0)');
  ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - st.vx * .18, y - st.vy * .18); ctx.stroke();
  ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.28); ctx.fill();
  ctx.fillStyle = 'rgba(255,250,200,.25)'; ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.28); ctx.fill();
}

function drawWaterfall(p, H) {
  const s = p.s, top = p.y - (H - 6) * s, bot = p.y + 4 * s, w = 46 * s, x0 = p.x - w / 2, t = FRAME_T;
  const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  g.addColorStop(0, 'rgba(170,215,225,.35)'); g.addColorStop(.2, 'rgba(210,240,245,.85)'); g.addColorStop(.55, 'rgba(160,210,225,.9)'); g.addColorStop(.85, 'rgba(210,240,245,.8)'); g.addColorStop(1, 'rgba(170,215,225,.3)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 + 4 * s, top); ctx.lineTo(x0 + w - 4 * s, top); ctx.lineTo(x0 + w + 6 * s, bot); ctx.lineTo(x0 - 6 * s, bot); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineCap = 'round';
  const len = bot - top;
  for (let i = 0; i < 16; i++) {
    const fx = (i * 0.37 % 1), xx = x0 + 3 * s + fx * (w - 6 * s), sp = 140 + (i % 5) * 30;
    const y = top + ((t * sp * s + i * 53 * s) % len), l = (16 + (i % 4) * 8) * s;
    ctx.lineWidth = (1 + (i % 3) * .6) * s; ctx.globalAlpha = .5 + (i % 3) * .15;
    ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + (y - top) / len * 4 * s * (fx - .5), Math.min(bot, y + l)); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(245,252,252,.9)'; ctx.beginPath(); ctx.ellipse(p.x, top + 2 * s, w * .55, 4 * s, 0, 0, 6.28); ctx.fill();
  for (let i = 0; i < 9; i++) {
    const k = (t * .6 + i / 9) % 1, a = Math.sin(k * 3.14);
    ctx.fillStyle = `rgba(235,245,248,${(.45 * a).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(p.x + Math.sin(i * 2.1) * (22 + k * 30) * s, bot - (4 + k * 34) * s, (10 + k * 16) * s, 0, 6.28); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5 * s;
  for (let i = 0; i < 3; i++) { const r = ((t * 30 + i * 25) % 75) * s; ctx.globalAlpha = 1 - r / (75 * s); ctx.beginPath(); ctx.ellipse(p.x, bot + 14 * s, r + 20 * s, (r + 20 * s) * .32, 0, 0, 6.28); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.setLineDash([]);
}
function drawSwampFx() {
  for (const f of SWAMP_FX) {
    const p = proj(f.x, f.z); if (!p || p.x < -200 || p.x > VW + 200 || p.y < -50 || p.y > VH + 60) continue;
    const s = p.s, k = (FRAME_T * .35 + f.p) % 1;
    if (k < .7) { const r = (1.5 + k * 3) * s; ctx.fillStyle = 'rgba(160,180,90,.55)'; ctx.beginPath(); ctx.arc(p.x, p.y - 1 * s, r, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(230,240,200,.5)'; ctx.beginPath(); ctx.arc(p.x - r * .3, p.y - r * .6, r * .25, 0, 6.28); ctx.fill(); }
    else { const r = (5 + (k - .7) * 40) * s; ctx.strokeStyle = `rgba(160,180,100,${(1 - (k - .7) / .3) * .6})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * .35, 0, 0, 6.28); ctx.stroke(); }
    if (f.k < .14) { const dx = Math.sin(FRAME_T * .08 + f.p) * 60 * s; ctx.fillStyle = 'rgba(120,140,100,.14)'; ctx.beginPath(); ctx.ellipse(p.x + dx, p.y - 18 * s, 170 * s, 36 * s, 0, 0, 6.28); ctx.fill(); }
  }
}

/* ================= CLIFF WALLS & MOUNTAINS =================
   Walls are continuous ribbons: each thin slice maps a column of the lit
   rock texture (anchored at the ground) onto a skewed quad, then the jungle
   canopy strip is draped over the rim. Distant ranges sit behind them. */
function slice(tex, u0, sy, du, sh, xa, xb, topA, topB, botA) {
  const W = tex.width; du = Math.max(1, du); u0 = ((u0 % W) + W) % W;
  ctx.setTransform(DPR * (xb - xa), DPR * (topB - topA), 0, DPR * (botA - topA), DPR * xa, DPR * topA);
  if (u0 + du <= W) ctx.drawImage(tex, u0, sy, du, sh, 0, 0, 1.3, 1);
  else { const f = (W - u0) / du; ctx.drawImage(tex, u0, sy, W - u0, sh, 0, 0, f + .02, 1); ctx.drawImage(tex, 0, sy, du - (W - u0), sh, f, 0, 1.3 - f, 1); }
}
function wallPass(samples, noCanopy) {
  const T = CLIFF_TEX, RH = T.rock.height, CHh = T.canopy.height, ppu = T.ppu;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    if (!a.p || !b.p) continue;
    const xa = a.p.x, xb = b.p.x;
    if (xb < -4 || xa > VW + 4 || xb <= xa) continue;
    const topA = a.p.y - a.H * a.p.s, topB = b.p.y - b.H * b.p.s;
    if (Math.max(a.p.y, b.p.y) < -40 || Math.min(topA, topB) - T.canU * a.p.s > VH) continue;
    const rows = Math.min(RH, a.H * ppu);
    slice(T.rock, a.u, RH - rows, b.u - a.u, rows, xa, xb, topA, topB, a.p.y + 2);
    if (noCanopy) continue;
    const ov = 34; // canopy overlaps the rim so leaves spill over the edge
    slice(T.canopy, a.u * .93, 0, (b.u - a.u) * .93, CHh, xa, xb, topA - (T.canU - ov) * a.p.s, topB - (T.canU - ov) * b.p.s, topA + ov * a.p.s);
  }
}
let MOUNT_CACHE = null;
function drawMountains() {
  // two hazy ranges of the greater island's interior, far behind the cliffs
  const layers = [{ z: -3600, base: 1500, amp: 1600, seed: 101, col: ['#a7b9bd', '#c3d0cf'] }, { z: -2600, base: 1100, amp: 1100, seed: 103, col: ['#86a09a', '#a8bab4'] }];
  for (const L of layers) {
    const pts = [];
    for (let x = -3000; x <= 7000; x += 60) {
      const h = L.base + (fbm2(x / 1100, .5, L.seed) - .3) * L.amp + (1 - Math.abs(2 * vnoise(x / 700, 1.3, L.seed + 2) - 1)) * L.amp * .45;
      const p = proj(x, L.z); if (!p) continue; pts.push([p.x, p.y - h * p.s, p.y]);
    }
    if (pts.length < 2) continue;
    const top = Math.min(...pts.map(q => q[1])), bot = Math.max(...pts.map(q => q[2]));
    if (top > VH || bot < 0) continue;
    const gr = ctx.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, L.col[0]); gr.addColorStop(1, L.col[1]);
    ctx.fillStyle = gr; ctx.beginPath(); pts.forEach(q => ctx.lineTo(q[0], q[1])); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][2] + 2); ctx.closePath(); ctx.fill();
    // sunlit ridge faces
    ctx.fillStyle = 'rgba(255,250,235,.08)';
    for (let i = 1; i < pts.length - 1; i++) if (pts[i][1] < pts[i - 1][1] && pts[i][1] < pts[i + 1][1]) { ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i - 1][0] - (pts[i][0] - pts[i - 1][0]) * 2, pts[i][1] + (bot - pts[i][1]) * .9); ctx.lineTo(pts[i][0], pts[i][1] + (bot - pts[i][1]) * .9); ctx.fill(); }
  }
}
let RIM_DECOR = null;
function buildRimDecor() {
  const r = mulberry(555); RIM_DECOR = [];
  const pickSpr = () => { const q = r(); return q < .42 ? SPR.broad[[0, 1, 3, 5, 6, 8][Math.floor(r() * 6)]] : q < .62 ? pick2(SPR.spire, r) : q < .72 ? pick2(SPR.palm, r) : q < .86 ? pick2(SPR.bush, r) : SPR.boulder[1 + Math.floor(r() * 4)]; };
  for (let x = -200; x < 4200; x += 26 + r() * 50) RIM_DECOR.push({ x, z: cliffZ(x) - 10 - r() * 40, elev: () => 0, n: 1, spr: pickSpr() });
  for (let z = cliffZ(3700) + 20; z < CLIFF_E_END - 120; z += 26 + r() * 44) { const x = sideX(z) + 10 + r() * 40; RIM_DECOR.push({ x, z, e: 1, spr: pickSpr() }); }
  RIM_DECOR.sort((a, b) => a.z - b.z);
}
function hillRow(d, step, hazeIdx) {
  const T = CLIFF_TEX, tex = hazeIdx >= 0 ? T.hazed[hazeIdx] : T.canopy, CHh = tex.height, ppu = T.ppu;
  const pts = [];
  for (let x = -2200; x <= 6200; x += step) {
    const z = cliffZ(x) - d;
    const ridge = 1 - Math.abs(2 * vnoise(x / 900, d / 500, 73) - 1);
    const elev = cliffH(x) * (1 - d / 2400) + d * .34 + (fbm2(x / 760, d / 400, 71) - .45) * (200 + d * .45) + ridge * d * .35;
    const p = proj(x, z); if (!p) continue;
    pts.push({ x: p.x, y: p.y - elev * p.s, s: p.s, u: (x * 1.37 + d * 3.1) * ppu });
  }
  // solid forest floor under the canopy so nothing shows through
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = hazeIdx >= 1 ? '#5f7f5c' : hazeIdx === 0 ? '#4b6f44' : '#3f6434';
  ctx.beginPath(); pts.forEach(q => ctx.lineTo(q.x, q.y - 40 * q.s)); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y + 420 * pts[i].s); ctx.closePath(); ctx.fill();
  // stacked canopy strips: the forest continues down the slope so no flat floor shows between ridges
  for (const off of (hazeIdx >= 1 ? [175, 0] : [340, 170, 0])) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]; if (b.x < -4 || a.x > VW + 4 || b.x <= a.x) continue;
      const h = T.canU * 1.25, u0 = off * 7.3;
      if (a.y + (off + 30) * a.s < -4 || a.y + (off - h) * a.s > VH + 4) continue;
      slice(tex, a.u + u0, 0, b.u - a.u, CHh, a.x, b.x, a.y + (off - h) * a.s, b.y + (off - h) * b.s, a.y + (off + 30) * a.s);
    }
  }
}
const BACK = { c: null, g: null, key: '' };
function drawCliffs() {
  const T = CLIFF_TEX, ppu = T.ppu;
  if (!RIM_DECOR) buildRimDecor();
  // the far backdrop only changes when the camera moves, so it is cached between frames
  { const key = [cam.x | 0, cam.z | 0, cam.zoom.toFixed(3), VW, VH, DPR, S.settings.low ? 1 : 0].join();
    if (!BACK.c || BACK.key !== key) {
      if (!BACK.c) { BACK.c = document.createElement('canvas'); BACK.g = BACK.c.getContext('2d'); }
      if (BACK.c.width !== cv.width || BACK.c.height !== cv.height) { BACK.c.width = cv.width; BACK.c.height = cv.height; }
      const real = ctx; ctx = BACK.g; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, BACK.c.width, BACK.c.height); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawMountains();
      hillRow(1900, 70, 2); hillRow(1600, 64, 2); hillRow(1300, 58, 2); hillRow(1050, 52, 1); hillRow(850, 48, 1); hillRow(680, 44, 0); hillRow(530, 40, 0); hillRow(400, 36, -1); hillRow(280, 32, -1); hillRow(170, 28, -1);
      ctx = real; BACK.key = key;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(BACK.c, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // trees and boulders standing along the rim
  for (const o of RIM_DECOR) {
    if (o.e) continue;
    const p = proj(o.x, o.z); if (!p) continue;
    const elev = o.e ? cliffHE(o.z) : cliffH(o.x);
    p.y -= (elev - 6) * p.s;
    if (p.x < -150 || p.x > VW + 150 || p.y < -10 || p.y > VH + 400) continue;
    drawSpr(o.spr, p);
  }
  const north = [];
  for (let x = -2200; x <= 6200; x += 14) north.push({ p: proj(x, cliffZ(x) + 2), u: (x + 400) * ppu, H: cliffH(x) });
  wallPass(north);
  { // soft contact shadow / damp earth where the wall meets the ground
    for (let L = 0; L < 5; L++) {
      ctx.beginPath(); let first = true;
      for (const q of north) { if (!q.p) continue; const y = q.p.y + (10 + L * 14) * q.p.s; if (first) { ctx.moveTo(q.p.x, q.p.y); first = false; } ctx.lineTo(q.p.x, y); }
      for (let i = north.length - 1; i >= 0; i--) { const q = north[i]; if (q.p) ctx.lineTo(q.p.x, q.p.y - 2); }
      ctx.closePath(); ctx.fillStyle = 'rgba(28,34,16,.075)'; ctx.fill();
    }
  }
  // East side, interleaved far-to-near: a slice of wall, then the forested
  // upland strip above it (overhanging the rim), then trees standing on it.
  const east = [];
  const z0 = cliffZ(3700) - 20;
  for (let z = z0; z <= CLIFF_E_END + 20; z += 9) {
    const fade = smooth01((CLIFF_E_END + 20 - z) / 280);
    east.push({ z, p: proj(sideX(z) + 2, z), u: (z + 9000) * ppu, H: cliffHE(z) * (.12 + .88 * fade) });
  }
  const rims = RIM_DECOR.filter(o => o.e);
  let wi = 0, ri = 0;
  for (let zs = 560; zs <= CLIFF_E_END + 46; zs += 46) {
    const upto = east.findIndex(q => q.z > zs); const end = upto < 0 ? east.length : upto;
    if (end - wi >= 1) { wallPass(east.slice(Math.max(0, wi - 1), end), true); wi = end; }
    if (zs <= CLIFF_E_END) eastStrip(zs, 44);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    while (ri < rims.length && rims[ri].z <= zs) {
      const o = rims[ri++], p = proj(o.x, o.z); if (!p) continue;
      p.y -= (eastElev(o.x, o.z) - 6) * p.s;
      if (p.x < -150 || p.x > VW + 150 || p.y < -10 || p.y > VH + 400) continue;
      drawSpr(o.spr, p);
    }
  }
  if (wi < east.length) wallPass(east.slice(Math.max(0, wi - 1)), true);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cv0 = SITE.cave, pc = proj(cv0.x, cliffZ(cv0.x) + 3); if (pc) drawSpr(SPR.cave, pc);
  const pw = proj(WATERFALL.x, cliffZ(WATERFALL.x) + 4); if (pw) drawWaterfall(pw, cliffH(WATERFALL.x) - 20);
}

/* Rolling waves: continuous crests that travel shoreward, steepen, then
   break into a foam wash that slides up the sand. */
let SHORE_LINES = null;
function drawWaves() {
  if (!SHORE_LINES) SHORE_LINES = [SHORE.filter(w => w.nz === 1).sort((a, b) => a.x - b.x), SHORE.filter(w => w.nx === -1).sort((a, b) => a.z - b.z)];
  const t = FRAME_T;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const line = (L, dist, wob, width, col, alpha, dash) => {
    ctx.setLineDash(dash || []); if (dash) ctx.lineDashOffset = dash[2] || 0;
    ctx.beginPath(); let started = false, sAcc = 0, n = 0;
    for (const w of L) {
      const d = dist + Math.sin(w.x * .011 + w.z * .011 + t * .7) * wob;
      const p = proj(w.x + w.nx * d, w.z + w.nz * d);
      if (!p || p.x < -80 || p.x > VW + 80 || p.y < -20 || p.y > VH + 20) { started = false; continue; }
      if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
      sAcc += p.s; n++;
    }
    if (!n) return;
    ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = width * sAcc / n; ctx.stroke();
  };
  for (const L of SHORE_LINES) {
    for (let j = 0; j < 3; j++) {
      const k = (t * .085 + j / 3) % 1, e = Math.sin(k * Math.PI);
      const dist = 12 + (1 - k) * 150;
      line(L, dist + 3, 10, 7, 'rgba(20,70,90,1)', .08 * e);          // trough shadow
      line(L, dist, 10, 2.2 + k * 1.8, 'rgba(240,250,248,1)', .55 * e * e, [90 + j * 30, 26 + j * 10, j * 57 + t * 6]); // broken crest
    }
    const wash = 6 + Math.sin(t * .6) * 7;
    line(L, wash + 6, 6, 12, 'rgba(235,248,245,1)', .22);
    line(L, wash, 6, 3, 'rgba(255,255,255,1)', .7);
  }
  ctx.globalAlpha = 1;
}

function eastElev(x, z) {
  const x0 = sideX(z), dx = Math.max(0, x - x0), fade = smooth01((CLIFF_E_END + 20 - z) / 280);
  const ridge = 1 - Math.abs(2 * vnoise(x / 700, z / 700, 77) - 1);
  return (cliffHE(z) * (.12 + .88 * fade) + (dx * .3 + (fbm2(x / 560, z / 560, 75) - .45) * (70 + dx * .35) + ridge * dx * .28) * fade);
}
function eastStrip(z, step) {
  const T = CLIFF_TEX, tex = T.canopy, CHh = tex.height, ppu = T.ppu;
  const x0 = sideX(z) - 2, pts = [];
  for (let x = x0; x <= 5600; x += step) {
    const p = proj(x, z); if (!p) continue;
    const e = eastElev(x, z);
    pts.push({ x: p.x, y: p.y - e * p.s, g: p.y, s: p.s, u: (x * 1.21 + z * 2.3) * ppu });
  }
  if (pts.length < 2 || pts[0].x > VW + 4) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // body of the upland down to the ground line
  ctx.fillStyle = '#3f6434';
  ctx.beginPath(); pts.forEach(q => ctx.lineTo(q.x, q.y - 30 * q.s)); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, Math.min(pts[i].g, pts[i].y + 70 * pts[i].s)); ctx.closePath(); ctx.fill();
  const h = T.canU * 1.25;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]; if (b.x < -4 || a.x > VW + 4 || b.x <= a.x) continue;
    slice(tex, a.u, 0, b.u - a.u, CHh, a.x, b.x, a.y - h * a.s, b.y - h * b.s, a.y + 30 * a.s);
  }
}
