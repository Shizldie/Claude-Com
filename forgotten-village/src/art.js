'use strict';
/* ================= NOISE & RNG ================= */
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967295; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { return vnoise(x, y, s) * .5 + vnoise(x * 2, y * 2, s + 7) * .25 + vnoise(x * 4, y * 4, s + 13) * .125 + vnoise(x * 8, y * 8, s + 29) * .0625; }
function fbm2(x, y, s) { return vnoise(x, y, s) * .67 + vnoise(x * 2.1, y * 2.1, s + 7) * .33; }
function polyAt(pts, t) { for (let i = 0; i < pts.length - 1; i++) { const [a, av] = pts[i], [b, bv] = pts[i + 1]; if (t <= b || i === pts.length - 2) { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); const s = k * k * (3 - 2 * k); return av + (bv - av) * s; } } return pts[0][1]; }
const smooth01 = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

/* ================= GEOGRAPHY =================
   The playable basin is the south-western corner of a much larger island:
   a cliff wall runs along the north and down the east side, the sea along
   the south and west, and the Mire rots in the south-east corner under the cliffs. */
const ISLE = { cx: 2000, cz: 1440 };
const CLIFF_N = [[0, 560], [600, 400], [1300, 310], [2000, 270], [2700, 320], [3400, 440], [4000, 560]];
const CLIFF_E_END = 1950;
const SOUTH = [[0, 2390], [500, 2495], [1100, 2495], [1800, 2530], [2600, 2525], [3400, 2450], [4000, 2330]];
const WESTC = [[0, 370], [900, 400], [1800, 370], [2800, 340]];
const SWAMP = { x: 3330, z: 2200, rx: 530, rz: 430 };
const WATERFALL = { x: 2700 };
const BEACH_BOOST = ['wreck', 'nets', 'dunes', 'belfry', 'circle'];
function cliffZ(x) { return polyAt(CLIFF_N, x) + (vnoise(x / 420, 3, 41) - .5) * 36; }
function sideX(z) { return 3660 + (vnoise(z / 380, 7, 43) - .5) * 50 + smooth01((z - 1600) / 350) * 140; }
function beyondCliff(x, z, m) { m = m || 0; return z < cliffZ(x) + m || (z < CLIFF_E_END && x > sideX(z) - m); }
function swampVal(x, z) { const a = (x - SWAMP.x) / SWAMP.rx, b = (z - SWAMP.z) / SWAMP.rz; return a * a + b * b + (vnoise(x / 140, z / 140, 51) - .5) * .45; }
function inSwamp(x, z) { return swampVal(x, z) < 1; }
/* south-west lagoon spit: land bulges into the sea around a shallow turquoise lagoon */
function coastAdj(x, z) {
  const dx = x - 560, dz = z - 2600; if (dx * dx > 1600000 || dz * dz > 490000) return 0;
  const g = (a, b) => Math.exp(-(a * a + b * b));
  return .34 * g(dx / 470, dz / 230) - .45 * g((x - 600) / 250, (z - 2550) / 100);
}
function eastC(x, z) { return (3800 + smooth01((1700 - z) / 200) * 500 - x) / 1100; }
function lagoonFix(x, z, v) { if (v < 0) { const a = (x - 600) / 330, b = (z - 2550) / 135; if (a * a + b * b < 2.4) v = Math.max(v, -.045); } return v; }
function beachW(x, z) { const a = (x - 560) / 760, b = (z - 2440) / 420; return 1 + 1.5 * Math.exp(-(a * a + b * b)); }
function landVal(x, z) {
  const s = (polyAt(SOUTH, x) - z) / 1100, w = (x - polyAt(WESTC, z)) / 1100;
  let v = Math.min(s, w, eastC(x, z)) + (fbm(x / 380, z / 380, 3) - .47) * .13 + (vnoise(x / 110, z / 110, 4) - .5) * .035 + coastAdj(x, z);
  for (const id of BEACH_BOOST) { const st = SITE[id]; const d = Math.hypot(x - st.x, z - st.z); if (d < 240) v += 0.1 * (1 - d / 240); }
  return lagoonFix(x, z, v);
}
/* One continuous watercourse: plunge pool -> river -> Still Pond -> outflow -> sea. */
const RIVER_CTRL = [[2700, 380], [2700, 470], [2770, 760], [2690, 1160], [2760, 1640], [2800, 2090], [2750, 2330], [2690, 2700]];
const RIVER = (() => { // Catmull-Rom sampled centre line
  const P = RIVER_CTRL, out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 12; k++) { const t = k / 12, t2 = t * t, t3 = t2 * t;
      out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  out.push(P[P.length - 1]); return out;
})();
const STREAM = RIVER;
const POND = { x: 2800, z: 2090, rx: 150, rz: 98 };
function inPond(x, z) { const a = (x - POND.x) / POND.rx, b = (z - POND.z) / POND.rz; return a * a + b * b < 1; }
function isOcean(x, z) { return landVal(x, z) < 0; }
function isWater(x, z) { return isOcean(x, z) || inPond(x, z); }
function nearStream(x, z, w) {
  if (x < 2560 || x > 2920) return false;
  for (let i = 0; i < RIVER.length - 1; i++) { const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1]; if ((z < az - w && z < bz - w) || (z > az + w && z > bz + w)) continue; const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2 || 1))); if (Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az)) < w) return true; }
  return false;
}
function isPlayable(x, z) { return landVal(x, z) > .04 && !inPond(x, z) && !beyondCliff(x, z, 50) && !inSwamp(x, z) && !nearStream(x, z, 34); }

/* ================= COLOR HELPERS ================= */
function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(h, a) { const [r, g, b] = hexRgb(h); return a >= 0 ? rgbHex(r + (255 - r) * a, g + (255 - g) * a, b + (255 - b) * a) : rgbHex(r * (1 + a), g * (1 + a), b * (1 + a)); }
function mix(h1, h2, t) { const a = hexRgb(h1), b = hexRgb(h2); return rgbHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); }
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ================= PALETTE (natural) ================= */
const PAL = {
  ink: '#2b2419',
  deep: '#1d5f7e', shallow: '#3fa1a4', foam: '#e2f0ea', sand: '#e3cd9d', wet: '#c7ae7e',
  grass: '#79a646', grassHi: '#8fb654', grassLo: '#5e9038', forest: '#46773a', meadow: '#9fb45a', plateau: '#557f3a',
  mud: '#5a4a32', bog: '#2e3622', bogHi: '#48542e', scum: '#7a8a34', bank: '#8a7a5c',
  path: '#c9a878', pathHi: '#d8bc90', water: '#3f9fb8', waterHi: '#8fd0da', riverDeep: '#23708a',
  leaf: ['#4f8a38', '#5f9a3e', '#43773a', '#6a9a44'], blossom: '#e8c4cc', gold: '#c7a640',
  trunk: '#6e5038', trunkHi: '#8c6a4a', stone: '#9d978b', stoneHi: '#c3beb2', stoneLo: '#77726a',
  rock1: '#8a7d6c', rock2: '#9c8f7c', rock3: '#6f6456',
  wall: '#c9a47c', wallLo: '#a8845e', thatch: '#b88a45', thatchHi: '#d2a55c', thatchLo: '#8e6a34', door: '#5a3a28',
  flowers: ['#e8d27a', '#d9a0b8', '#f2efe4', '#a99ad8', '#e59a5a']
};

/* ================= WATER MASK =================
   The river, pond and plunge pool are painted as soft layered masks and
   blended into the terrain pixel by pixel, so banks, shallows and the
   river mouth run seamlessly into the sea. */
function buildWaterMask(W0, H0) {
  const c = document.createElement('canvas'); c.width = W0; c.height = H0;
  const m = c.getContext('2d'); m.scale(TS0, TS0); m.lineCap = 'round'; m.lineJoin = 'round';
  m.globalCompositeOperation = 'lighter';
  const riverPath = () => { m.beginPath(); m.moveTo(RIVER[0][0], RIVER[0][1]); for (let i = 1; i < RIVER.length; i++) m.lineTo(RIVER[i][0], RIVER[i][1]); };
  const wz = cliffZ(WATERFALL.x);
  const blob = (col, grow) => {
    m.fillStyle = col;
    m.beginPath(); m.ellipse(POND.x, POND.z, POND.rx + grow, POND.rz + grow * .7, 0, 0, 6.283); m.fill();
    m.beginPath(); m.ellipse(WATERFALL.x, wz + 60, 105 + grow, 46 + grow * .6, 0, 0, 6.283); m.fill();
    const mo = RIVER[RIVER.length - 1]; m.beginPath(); m.ellipse(mo[0], mo[1] - 40, 70 + grow, 60 + grow * .6, 0, 0, 6.283); m.fill();
  };
  // R channel: banks (wide soft falloff)
  for (let k = 0; k < 6; k++) { m.strokeStyle = 'rgb(42,0,0)'; m.lineWidth = 58 + k * 16; riverPath(); m.stroke(); blob('rgb(42,0,0)', 20 + k * 12); }
  // G channel: water surface
  for (let k = 0; k < 5; k++) { m.strokeStyle = 'rgb(0,51,0)'; m.lineWidth = 30 + k * 5; riverPath(); m.stroke(); blob('rgb(0,51,0)', -16 + k * 4); }
  // B channel: depth
  for (let k = 0; k < 5; k++) { m.strokeStyle = 'rgb(0,0,51)'; m.lineWidth = 6 + k * 5; riverPath(); m.stroke(); blob('rgb(0,0,51)', -70 + k * 12); }
  return m.getImageData(0, 0, W0, H0).data;
}

/* ================= GROUND TEXTURE ================= */
const TS = 0.6, TS0 = 0.25;
let TEX = null;
function buildGround() {
  const W0 = Math.round(WORLD.w * TS0), H0 = Math.round(WORLD.h * TS0);
  const base = document.createElement('canvas'); base.width = W0; base.height = H0;
  const bg = base.getContext('2d');
  const img = bg.createImageData(W0, H0), d = img.data;
  const C = k => hexRgb(PAL[k]);
  const deep = C('deep'), shal = C('shallow'), foam = C('foam'), sand = C('sand'), wet = C('wet');
  const g1 = C('grass'), g2 = C('grassHi'), g3 = C('grassLo'), fo = C('forest'), me = C('meadow'), pl = C('plateau');
  const mud = C('mud'), bog = C('bog'), bogHi = C('bogHi'), scum = C('scum'), rockc = hexRgb('#7a6e5e'), bankc = C('bank'), rdeep = C('riverDeep');
  const WM = buildWaterMask(W0, H0);
  const colS = new Float32Array(W0), colC = new Float32Array(W0), rowW = new Float32Array(H0), rowE = new Float32Array(H0);
  for (let px = 0; px < W0; px++) { colS[px] = polyAt(SOUTH, px / TS0); colC[px] = cliffZ(px / TS0); }
  for (let py = 0; py < H0; py++) { rowW[py] = polyAt(WESTC, py / TS0); rowE[py] = sideX(py / TS0); }
  const boost = BEACH_BOOST.map(id => SITE[id]);
  const LVG = new Float32Array(W0 * H0);
  const lvAt = (x, z) => { const px = Math.min(W0 - 1, Math.max(0, Math.round(x * TS0))), py = Math.min(H0 - 1, Math.max(0, Math.round(z * TS0))); return LVG[py * W0 + px]; };
  for (let py = 0; py < H0; py++) {
    for (let px = 0; px < W0; px++) {
      const x = px / TS0, z = py / TS0, i = (py * W0 + px);
      let lv = Math.min((colS[px] - z) / 1100, (x - rowW[py]) / 1100, eastC(x, z));
      if (lv < .3) { lv += (fbm(x / 380, z / 380, 3) - .47) * .13 + (vnoise(x / 110, z / 110, 4) - .5) * .035 + coastAdj(x, z); for (const st of boost) { const dx = x - st.x, dz = z - st.z; if (dx > -240 && dx < 240 && dz > -240 && dz < 240) { const dd = Math.sqrt(dx * dx + dz * dz); if (dd < 240) lv += 0.1 * (1 - dd / 240); } } }
      lv = lagoonFix(x, z, lv); LVG[i] = lv;
      const wb = WM[i * 4] / 255, ww = WM[i * 4 + 1] / 255, wd = WM[i * 4 + 2] / 255;
      let col;
      if (lv < 0) {
        // sea: smooth shallows-to-deep with soft surf
        const t = smooth01((-lv - .002) / .17);
        col = lerp3(shal, deep, t);
        col = lerp3(col, foam, Math.max(0, 1 - (-lv) / .012) * .7);
      } else {
        const bw = beachW(x, z), lb = lv / bw;
        const beachT = smooth01((lb - .012) / .12);
        const sandc = lerp3(wet, lerp3(sand, wet, vnoise(x / 40, z / 40, 8) * .22), smooth01(lv / .03));
        const f = fbm2(x / 300, z / 300, 11), m = fbm2(x / 110, z / 110, 17), mea = fbm2(x / 500, z / 500, 23);
        let b = lerp3(g3, g2, smooth01((m - .35) * 3));
        b = lerp3(b, g1, .4);
        if (f > .56) b = lerp3(b, fo, smooth01((f - .56) * 6));
        if (mea > .6) b = lerp3(b, me, smooth01((mea - .6) * 5) * .7);
        b = lerp3(sandc, b, smooth01((lb - .09) / .06));
        // under the cliffs: plateau beyond, weathered scree at the foot
        const cz = colC[px], ex = rowE[py], inE = z < CLIFF_E_END && x > ex;
        if (z < cz || inE) b = lerp3(pl, fo, fbm2(x / 160, z / 160, 31));
        else {
          const dn = z - cz, de = z < CLIFF_E_END + 200 ? ex - x : 999;
          const dmin = Math.min(dn, de);
          if (dmin < 90) b = lerp3(lerp3(rockc, b, .25), b, smooth01(dmin / 90));
        }
        // the Mire
        const sa = (x - SWAMP.x) / SWAMP.rx, sb = (z - SWAMP.z) / SWAMP.rz;
        if (sa * sa + sb * sb < 2.3 && !(z < cz || inE)) {
          const sv = swampVal(x, z);
          if (sv < 1.75) {
            const t = smooth01((1.75 - sv) / .75) * (sv > 1 ? .85 : 1);
            const pool = fbm2(x / 90, z / 90, 61);
            let sw = lerp3(mud, bogHi, fbm2(x / 50, z / 50, 63) * .6);
            if (pool > .52 - (1 - Math.min(1, sv)) * .14) { sw = lerp3(bog, bogHi, fbm2(x / 30, z / 30, 67) * .45); if (vnoise(x / 9, z / 9, 69) > .78) sw = lerp3(sw, scum, .55); }
            b = lerp3(b, sw, t);
          }
        }
        // river, pond and plunge pool
        if (wb > 0) {
          b = lerp3(b, lerp3(bankc, sandc, .35), smooth01(wb * 1.2) * .85);
          if (ww > 0) {
            let wc = lerp3(shal, rdeep, smooth01(wd * 1.1));
            if (vnoise(x / 24, z / 60, 71) > .72) wc = lerp3(wc, foam, .18);
            b = lerp3(b, wc, smooth01(ww * 1.6));
          }
        }
        col = b;
      }
      const n = lv < -.02 ? 1 : 1 + (hash2(px, py, 9) - .5) * .05;
      d[i * 4] = col[0] * n; d[i * 4 + 1] = col[1] * n; d[i * 4 + 2] = col[2] * n; d[i * 4 + 3] = 255;
    }
  }
  bg.putImageData(img, 0, 0);
  const W = Math.round(WORLD.w * TS), H = Math.round(WORLD.h * TS);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(base, 0, 0, W, H);
  g.save(); g.scale(TS, TS); g.lineCap = 'round'; g.lineJoin = 'round';
  const r = mulberry(77);
  const inWater = (x, z) => { const px = Math.min(W0 - 1, Math.max(0, Math.round(x * TS0))), py = Math.min(H0 - 1, Math.max(0, Math.round(z * TS0))); return WM[(py * W0 + px) * 4 + 1] > 20; };
  // grass, wildflowers, bare patches (batched paths for speed)
  {
    const P = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], PC = ['rgba(40,70,28,.3)', 'rgba(170,200,110,.28)', 'rgba(20,26,14,.42)', 'rgba(110,120,60,.32)'];
    const FL = PAL.flowers.map(() => new Path2D()), PT = new Path2D();
    for (let i = 0; i < 36000; i++) {
      const x = r() * WORLD.w, z = r() * WORLD.h; const lv = lvAt(x, z);
      if (lv / beachW(x, z) < 0.14 || inPond(x, z) || inWater(x, z) || beyondCliff(x, z, -10)) continue;
      const sw = Math.abs(x - SWAMP.x) < SWAMP.rx * 1.5 && Math.abs(z - SWAMP.z) < SWAMP.rz * 1.5 && inSwamp(x, z);
      const q = r();
      if (q < .82 || sw) {
        const pth = P[(sw ? 2 : 0) + (r() < .5 ? 0 : 1)];
        const h = 5 + r() * 5, lean = (r() - .5) * 4;
        pth.moveTo(x - 2, z); pth.quadraticCurveTo(x - 2 + lean * .3, z - h * .6, x - 3 + lean, z - h); pth.moveTo(x + 1, z); pth.lineTo(x + 1 + lean * .6, z - h * .8); pth.moveTo(x + 3, z); pth.quadraticCurveTo(x + 3, z - h * .5, x + 5 + lean * .5, z - h * .7);
      } else if (q < .88) {
        const pth = FL[Math.floor(r() * FL.length)];
        for (let k = 0; k < 4; k++) { const fx = x + (r() - .5) * 8, fz = z + (r() - .5) * 5; pth.moveTo(fx + 1.1, fz); pth.arc(fx, fz, 1.1, 0, 6.283); }
      } else { const rx = 5 + r() * 8, ry = 3 + r() * 4; PT.moveTo(x + rx, z); PT.ellipse(x, z, rx, ry, 0, 0, 6.283); }
    }
    g.lineWidth = 1.4; P.forEach((pth, i) => { g.strokeStyle = PC[i]; g.stroke(pth); });
    g.globalAlpha = .7; FL.forEach((pth, i) => { g.fillStyle = PAL.flowers[i]; g.fill(pth); }); g.globalAlpha = 1;
    g.fillStyle = 'rgba(70,50,30,.12)'; g.fill(PT);
  }
  // sand grain, pebbles, shells, wrack line
  {
    const SA = new Path2D(), SB = new Path2D(), PB = new Path2D(), SH = new Path2D(), WR = new Path2D();
    for (let i = 0; i < 14000; i++) {
      const x = r() * WORLD.w, z = r() * WORLD.h; const lv = lvAt(x, z);
      if (lv < 0.0 || lv > 0.13 || inWater(x, z)) continue;
      const q = r();
      if (q < .85) { const p = r() < .5 ? SA : SB, rr = .7 + r() * 1.2; p.moveTo(x + rr, z); p.arc(x, z, rr, 0, 6.283); }
      else if (q < .93) { const rx = 2 + r() * 3; PB.moveTo(x + rx, z); PB.ellipse(x, z, rx, 1.5 + r() * 2, 0, 0, 6.283); }
      else if (lv < .03) { WR.moveTo(x, z); WR.quadraticCurveTo(x + 6, z - 3, x + 12, z + 1); }
      else { SH.moveTo(x + 3, z); SH.ellipse(x, z, 3, 2.2, 0, 0, 6.283); }
    }
    g.fillStyle = 'rgba(150,118,76,.3)'; g.fill(SA); g.fillStyle = 'rgba(255,250,235,.4)'; g.fill(SB); g.fillStyle = '#978f82'; g.fill(PB); g.fillStyle = '#e6dccc'; g.fill(SH);
    g.strokeStyle = 'rgba(70,80,40,.5)'; g.lineWidth = 2; g.stroke(WR);
  }
  // soft contact shadow along the foot of both cliff walls
  {
    for (let x = 0; x < WORLD.w; x += 8) { const cz = cliffZ(x); const gr = g.createLinearGradient(0, cz - 6, 0, cz + 80); gr.addColorStop(0, 'rgba(20,16,10,.42)'); gr.addColorStop(1, 'rgba(20,16,10,0)'); g.fillStyle = gr; g.fillRect(x, cz - 6, 9, 86); }
    for (let z = cliffZ(3700); z < CLIFF_E_END + 300; z += 8) { const ex = sideX(z); const gr = g.createLinearGradient(ex + 6, 0, ex - 80, 0); gr.addColorStop(0, 'rgba(20,16,10,.4)'); gr.addColorStop(1, 'rgba(20,16,10,0)'); g.fillStyle = gr; g.fillRect(ex - 80, z, 86, 9); }
  }
  // village clearing (trampled earth)
  const hx = SITE.hearth.x, hz = SITE.hearth.z;
  { const cg = g.createRadialGradient(hx - 40, hz, 60, hx - 40, hz, 470);
    cg.addColorStop(0, 'rgba(170,140,95,.62)'); cg.addColorStop(.6, 'rgba(170,140,95,.28)'); cg.addColorStop(1, 'rgba(170,140,95,0)');
    g.fillStyle = cg; g.beginPath(); g.ellipse(hx - 40, hz, 480, 400, 0, 0, 6.283); g.fill(); }
  // foot paths
  const paths = [['hearth', 'study'], ['hearth', 'bramble'], ['hearth', 'woodpile'], ['hearth', 'larder'], ['larder', 'wreck'], ['study', 'torches'], ['torches', 'hive'], ['study', 'springrocks'], ['larder', 'mantle'], ['mantle', 'cauldron'], ['hearth', 'hall'], ['hall', 'circle'], ['circle', 'belfry'], ['circle', 'lodge'], ['lodge', 'cave'], ['bramble', 'terrace'], ['bramble', 'mending'], ['mending', 'pond'], ['mending', 'dunes'], ['reeds', 'larder'], ['terrace', 'twisted'], ['wreck', 'nets']];
  const curves = paths.map(([a, b]) => { const A = SITE[a], B = SITE[b]; return [A, B, (A.x + B.x) / 2 + (hash2(A.x | 0, B.z | 0, 1) - .5) * 160, (A.z + B.z) / 2 + (hash2(B.x | 0, A.z | 0, 2) - .5) * 110]; });
  const stroke = (w, col) => { g.strokeStyle = col; g.lineWidth = w; for (const [A, B, mx, mz] of curves) { g.beginPath(); g.moveTo(A.x, A.z); g.quadraticCurveTo(mx, mz, B.x, B.z); g.stroke(); } };
  stroke(34, 'rgba(150,120,80,.3)'); stroke(24, 'rgba(190,160,115,.72)'); stroke(10, 'rgba(215,190,145,.5)');
  { const PA = new Path2D(), PBb = new Path2D();
    for (const [A, B, mx, mz] of curves) for (let t = .04; t < .96; t += .03) {
      const x = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x + (r() - .5) * 22, z = (1 - t) * (1 - t) * A.z + 2 * (1 - t) * t * mz + t * t * B.z + (r() - .5) * 16;
      const p = r() < .5 ? PA : PBb, rx = 1.5 + r() * 2.5; p.moveTo(x + rx, z); p.ellipse(x, z, rx, 1 + r() * 1.5, 0, 0, 6.283); }
    g.fillStyle = 'rgba(120,95,65,.35)'; g.fill(PA); g.fillStyle = 'rgba(235,220,190,.4)'; g.fill(PBb); }
  // river stones, lily pads and reflections
  for (let i = 0; i < RIVER.length; i += 2) {
    const [x, z] = RIVER[i]; if (inPond(x, z)) continue;
    for (const side of [-1, 1]) if (r() < .7) { const sx = x + side * (22 + r() * 10), sz = z + (r() - .5) * 20; g.fillStyle = r() < .5 ? '#8f877a' : '#a39c8e'; g.beginPath(); g.ellipse(sx, sz, 4 + r() * 5, 3 + r() * 2, 0, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(sx - 1, sz - 1.5, 2.5, 1, 0, 0, 6.283); g.fill(); }
  }
  g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.ellipse(POND.x - 50, POND.z - 34, 50, 7, -.15, 0, 6.283); g.fill();
  for (let i = 0; i < 12; i++) { const a = r() * 6.283, dd = .45 + r() * .45; const x = POND.x + Math.cos(a) * POND.rx * dd, z = POND.z + Math.sin(a) * POND.rz * dd;
    g.fillStyle = r() < .5 ? '#4f7f36' : '#5c8c3e'; g.beginPath(); g.ellipse(x, z, 9 + r() * 4, 5 + r() * 2, 0, .3, 6.0); g.lineTo(x, z); g.fill(); }
  // the Mire: algae, roots and an oily sheen
  { const AL = new Path2D(), SHN = new Path2D(), DK = new Path2D(), RT = new Path2D();
    for (let i = 0; i < 5000; i++) {
      const x = SWAMP.x + (r() - .5) * SWAMP.rx * 2.6, z = SWAMP.z + (r() - .5) * SWAMP.rz * 2.6;
      if (!inSwamp(x, z) || lvAt(x, z) < 0.02 || beyondCliff(x, z, 0)) continue;
      const q = r();
      if (q < .45) { const rx = 2 + r() * 6; AL.moveTo(x + rx, z); AL.ellipse(x, z, rx, 1.5 + r() * 3, 0, 0, 6.283); }
      else if (q < .7) { RT.moveTo(x, z); RT.bezierCurveTo(x + (r() - .5) * 30, z + (r() - .5) * 12, x + (r() - .5) * 40, z + (r() - .5) * 14, x + (r() - .5) * 50, z + (r() - .5) * 18); }
      else if (q < .8) { const rx = 10 + r() * 14; SHN.moveTo(x + rx, z); SHN.ellipse(x, z, rx, 3 + r() * 4, 0, 0, 6.283); }
      else { const rx = 6 + r() * 16; DK.moveTo(x + rx, z); DK.ellipse(x, z, rx, 3 + r() * 7, 0, 0, 6.283); }
    }
    g.fillStyle = 'rgba(110,130,36,.45)'; g.fill(AL); g.strokeStyle = 'rgba(30,22,14,.55)'; g.lineWidth = 2.5; g.stroke(RT); g.fillStyle = 'rgba(160,120,200,.12)'; g.fill(SHN); g.fillStyle = 'rgba(15,18,10,.32)'; g.fill(DK); }
  g.restore();
  TEX = c;
}
/* Shoreline sample points for animated waves (south and west coasts) */
let SHORE = [];
function buildShore() {
  SHORE = [];
  for (let x = 0; x <= 4000; x += 20) {
    let lo = 1700, hi = 2800; if (landVal(x, lo) < 0 || landVal(x, hi) > 0) continue;
    for (let zz = 2790; zz > 1700; zz -= 10) if (landVal(x, zz) > 0) { lo = zz; hi = zz + 10; break; }
    for (let k = 0; k < 16; k++) { const m = (lo + hi) / 2; if (landVal(x, m) > 0) lo = m; else hi = m; }
    SHORE.push({ x, z: (lo + hi) / 2, nx: 0, nz: 1, p: x * .013 });
  }
  for (let z = 600; z <= 2500; z += 20) {
    let lo = 700, hi = 0; if (landVal(lo, z) < 0 || landVal(hi, z) > 0) continue;
    for (let k = 0; k < 16; k++) { const m = (lo + hi) / 2; if (landVal(m, z) > 0) lo = m; else hi = m; }
    SHORE.push({ x: (lo + hi) / 2, z, nx: -1, nz: 0, p: z * .013 });
  }
}

/* ================= CLIFF WALL TEXTURES =================
   The rock face is lit from a sculpted heightfield (columns, ledges,
   rounded masses) so it reads as real relief. Plants cling to the ledges.
   A separate canopy strip is draped over the rim. Both tile seamlessly. */
const CLIFF_TEX = { rock: null, canopy: null, ppu: 1.25, tileU: 1600, faceU: 720, canU: 150 };
function buildCliffTex() {
  const T = CLIFF_TEX, ppu = T.ppu, W = Math.round(T.tileU * ppu), H = Math.round(T.faceU * ppu), R = mulberry(313);
  // ---- heightfield at half resolution ----
  const hw = W >> 1, hh = H >> 1, hf = new Float32Array(hw * hh);
  const k = 2 / ppu; // world units per heightfield pixel
  const hfun = (U, V) => {
    const col = 1 - Math.abs(2 * vnoise(U / 46, V / 240, 81) - 1);
    const mass = vnoise(U / 170, V / 150, 83);
    const rough = fbm2(U / 22, V / 22, 85);
    const Lb = V / 115 + vnoise(U / 170, V / 300, 87) * 2.2, fr = Lb - Math.floor(Lb);
    const ledge = smooth01(fr / .3) * vnoise(U / 260, V / 90, 88);
    return col * .55 + mass * .55 + rough * .16 + ledge * .07;
  };
  const tileU = hw * k;
  for (let v = 0; v < hh; v++) for (let u = 0; u < hw; u++) {
    const U = u * k, V = v * k, t = u / hw;
    hf[v * hw + u] = hfun(U, V) * (1 - t) + hfun(U + tileU, V) * t;
  }
  // blurred copy for ambient occlusion
  const bl = new Float32Array(hw * hh), rad = 4;
  for (let v = 0; v < hh; v++) { let acc = 0; for (let u = -rad; u <= rad; u++) acc += hf[v * hw + ((u + hw) % hw)]; for (let u = 0; u < hw; u++) { bl[v * hw + u] = acc / (2 * rad + 1); acc += hf[v * hw + ((u + rad + 1) % hw)] - hf[v * hw + ((u - rad + hw) % hw)]; } }
  for (let u = 0; u < hw; u++) { const colv = new Float32Array(hh); for (let v = 0; v < hh; v++) { let acc = 0, n = 0; for (let d = -rad; d <= rad; d++) { const vv = v + d; if (vv >= 0 && vv < hh) { acc += bl[vv * hw + u]; n++; } } colv[v] = acc / n; } for (let v = 0; v < hh; v++) bl[v * hw + u] = colv[v]; }
  const small = document.createElement('canvas'); small.width = hw; small.height = hh;
  const sg = small.getContext('2d'), img = sg.createImageData(hw, hh), px = img.data;
  const L = [-.52, -.58, .62], ln = Math.hypot(...L); L[0] /= ln; L[1] /= ln; L[2] /= ln;
  const alb = ['#978a78', '#85796a', '#a39580', '#7a6e60', '#8e8272'].map(hexRgb), moss = hexRgb('#5a7a3a'), moss2 = hexRgb('#6f8c44'), wetc = hexRgb('#4a4238');
  const strata = [];
  for (let i = 0; i < 40; i++) strata.push(alb[Math.floor(R() * alb.length)]);
  const ledgeMask = new Uint8Array(hw * hh);
  for (let v = 0; v < hh; v++) for (let u = 0; u < hw; u++) {
    const i = v * hw + u, h = hf[i];
    const dx = hf[v * hw + (u + 1) % hw] - hf[v * hw + (u - 1 + hw) % hw];
    const dy = (v < hh - 1 ? hf[i + hw] : h) - (v > 0 ? hf[i - hw] : h);
    let nx = -dx * 9, ny = -dy * 9, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    const ao = Math.max(.45, Math.min(1.1, 1 - (bl[i] - h) * 2.6));
    const sv = (v * k + (fbm2(u * k / 260, v * k / 260, 89) - .5) * 150) / 36, sf = Math.floor(sv), st = smooth01(sv - sf);
    const band = lerp3(strata[((sf % 40) + 40) % 40], strata[(((sf + 1) % 40) + 40) % 40], st);
    let c = lerp3(band, alb[0], vnoise(u * k / 90, v * k / 90, 91) * .5);
    // large-scale weathering: warm ochre patches, dark rain streaks running down the columns
    c = lerp3(c, [150, 118, 88], smooth01((fbm2(u * k / 320, v * k / 240, 97) - .5) * 4) * .3);
    c = lerp3(c, wetc, smooth01((vnoise(u * k / 14, v * k / 380, 99) - .62) * 5) * .38 * (.4 + .6 * (1 - v / hh)));
    c = lerp3(c, [176, 166, 148], smooth01((fbm2(u * k / 500, v * k / 400, 101) - .58) * 5) * .2);
    // vegetation takes hold on upward-facing ledges
    const up = -ny;
    const mz = vnoise(u * k / 70, v * k / 110, 93);
    if ((up > .22 && mz > .36) || mz > .74) { c = lerp3(c, vnoise(u * k / 25, v * k / 25, 95) > .5 ? moss : moss2, Math.min(.92, Math.max(up - .22, 0) * 3 + (mz > .74 ? (mz - .74) * 3 : 0))); if (up > .22) ledgeMask[i] = 1; }
    const hAbove = (hh - v) * k; // height above ground in world units
    if (hAbove < 60) c = lerp3(c, wetc, (1 - hAbove / 60) * .45);
    const lit = (.36 + .82 * diff) * ao;
    px[i * 4] = c[0] * lit; px[i * 4 + 1] = c[1] * lit; px[i * 4 + 2] = c[2] * lit; px[i * 4 + 3] = 255;
  }
  sg.putImageData(img, 0, 0);
  const rock = document.createElement('canvas'); rock.width = W; rock.height = H;
  const g = rock.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, W, H);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const wrap = (x, fn) => { for (const o of [-W, 0, W]) { if (x + o > -200 && x + o < W + 200) { g.save(); g.translate(o, 0); fn(x); g.restore(); } } };
  // hairline cracks following the column joints
  for (let i = 0; i < 60; i++) {
    const x = R() * W, y0 = R() * H * .8, len = 40 + R() * 220, pts = []; let xx = x;
    for (let y = y0; y < Math.min(H, y0 + len); y += 10) { xx += (R() - .5) * 4; pts.push([xx, y]); }
    wrap(x, () => { g.strokeStyle = 'rgba(25,20,15,.35)'; g.lineWidth = 1; g.beginPath(); pts.forEach(p => g.lineTo(p[0], p[1])); g.stroke(); });
  }
  // plants rooted on ledges: shrubs, ferns, grass tufts, flowers
  const cols = ['#4a7434', '#557f3a', '#3f6a30', '#62883e'];
  let placed = 0;
  for (let tries = 0; tries < 6000 && placed < 320; tries++) {
    const u = Math.floor(R() * hw), v = Math.floor(R() * (hh - 20)) + 10;
    if (!ledgeMask[v * hw + u]) continue;
    placed++;
    const x = u * 2, y = v * 2, q = R(), col = cols[Math.floor(R() * cols.length)];
    wrap(x, () => {
      if (q < .45) { foliage(g, x, y - 6, 10 + R() * 14, 6 + R() * 6, col, R, 10); }
      else if (q < .75) { for (let f = 0; f < 6; f++) { const a = -Math.PI / 2 + (f - 2.5) * .4, len = 8 + R() * 10; g.strokeStyle = f % 2 ? col : shade(col, .15); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len * .5, y + Math.sin(a) * len * .9, x + Math.cos(a) * len * 1.2, y + Math.sin(a) * len * .5); g.stroke(); } }
      else { g.strokeStyle = shade(col, .1); g.lineWidth = 1.2; for (let f = 0; f < 7; f++) { g.beginPath(); g.moveTo(x + f - 3, y); g.lineTo(x + (f - 3) * 1.8, y - 5 - R() * 6); g.stroke(); } if (R() < .4) { g.fillStyle = PAL.flowers[Math.floor(R() * 5)]; g.beginPath(); g.arc(x, y - 8, 1.6, 0, 6.283); g.fill(); } }
    });
  }
  // a few gnarled trees jutting from the face
  for (let i = 0; i < 7; i++) {
    const x = R() * W, y = H * (.15 + R() * .5), dir = R() < .5 ? -1 : 1;
    wrap(x, () => { g.strokeStyle = '#5a4634'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dir * 18, y - 6, x + dir * 30, y - 34); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(x + dir * 18, y - 10); g.lineTo(x + dir * 40, y - 22); g.stroke();
      foliage(g, x + dir * 32, y - 42, 22, 14, cols[i % 4], R, 16); foliage(g, x + dir * 42, y - 26, 12, 8, cols[(i + 1) % 4], R, 8); });
  }
  // hanging vines and trailing creepers
  for (let i = 0; i < 110; i++) {
    const x = R() * W, y0 = R() * H * .55, len = 60 + R() * 280, sway = (R() - .5) * 16;
    const leaves = []; for (let t = 0; t < 1; t += 12 / len) leaves.push([t, R()]);
    wrap(x, () => {
      g.strokeStyle = 'rgba(46,72,32,.9)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x + sway, y0 + len * .33, x - sway, y0 + len * .66, x + sway * .4, y0 + len); g.stroke();
      for (const [t, rr] of leaves) { const lx = x + Math.sin(t * 5 + i) * sway * .5, ly = y0 + len * t; g.fillStyle = rr < .5 ? '#4f7f38' : '#5f8f40'; g.beginPath(); g.ellipse(lx + (rr - .5) * 5, ly, 3.2, 1.8, (rr - .5), 0, 6.283); g.fill(); }
    });
  }
  // contact shadow and talus tint at the foot
  const bs = g.createLinearGradient(0, H - 190, 0, H); bs.addColorStop(0, 'rgba(18,15,12,0)'); bs.addColorStop(.6, 'rgba(18,15,12,.16)'); bs.addColorStop(1, 'rgba(18,15,12,.5)'); g.fillStyle = bs; g.fillRect(0, H - 190, W, 190);
  const ts = g.createLinearGradient(0, 0, 0, 160); ts.addColorStop(0, 'rgba(255,236,180,.16)'); ts.addColorStop(1, 'rgba(255,236,180,0)'); g.fillStyle = ts; g.fillRect(0, 0, W, 160);
  T.rock = rock;

  // ---- canopy strip draped over the rim ----
  const CW = W, CHh = Math.round(T.canU * ppu);
  const can = document.createElement('canvas'); can.width = CW; can.height = CHh;
  const cg = can.getContext('2d'); cg.lineCap = 'round';
  const ccols = ['#3a6630', '#42703a', '#4b7a36', '#35603a', '#557f3a'];
  const cwrap = (x, fn) => { for (const o of [-CW, 0, CW]) { if (x + o > -200 && x + o < CW + 200) { cg.save(); cg.translate(o, 0); fn(); cg.restore(); } } };
  // soil lip with roots
  cg.fillStyle = '#4a3f30'; cg.fillRect(0, CHh - 46, CW, 20);
  for (let i = 0; i < 140; i++) { const x = R() * CW; cwrap(x, () => { cg.strokeStyle = 'rgba(70,52,34,.85)'; cg.lineWidth = 1 + R(); cg.beginPath(); cg.moveTo(x, CHh - 30); cg.quadraticCurveTo(x + (R() - .5) * 10, CHh - 18, x + (R() - .5) * 14, CHh - 4 - R() * 10); cg.stroke(); }); }
  for (let i = 0; i < 150; i++) {
    const x = R() * CW, y = CHh * (.22 + R() * .52), rx = 28 + R() * 40, ry = 20 + R() * 22, col = ccols[Math.floor(R() * ccols.length)];
    cwrap(x, () => foliage(cg, x, y, rx, ry, col, R, 16));
  }
  for (let i = 0; i < 90; i++) { const x = R() * CW, y = CHh - 40 + R() * 16; cwrap(x, () => foliage(cg, x, y, 12 + R() * 12, 7 + R() * 6, ccols[Math.floor(R() * 5)], R, 8)); }
  for (let i = 0; i < 12; i++) {
    const x = R() * CW, y = 10 + R() * 30;
    cwrap(x, () => { cg.strokeStyle = '#6a5640'; cg.lineWidth = 3; cg.beginPath(); cg.moveTo(x, CHh * .6); cg.quadraticCurveTo(x + 4, y + 30, x + 6, y); cg.stroke();
      for (let f = 0; f < 8; f++) { const a = f / 8 * 6.283; cg.strokeStyle = f % 2 ? '#4f7a36' : '#43703a'; cg.lineWidth = 2.4; cg.beginPath(); cg.moveTo(x + 6, y); cg.quadraticCurveTo(x + 6 + Math.cos(a) * 16, y - 8, x + 6 + Math.cos(a) * 30, y + 6 + Math.abs(Math.sin(a)) * 8); cg.stroke(); } });
  }
  T.canopy = can;
  T.hazed = [.18, .34, .5].map(a => { const h = document.createElement('canvas'); h.width = CW; h.height = CHh; const x = h.getContext('2d'); x.drawImage(can, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(170,190,185,${a})`; x.fillRect(0, 0, CW, CHh); return h; });
}
/* Rim height of the northern wall: rolling cliffs rising into two mountain spurs. */
function cliffH(x) {
  const bump = (c, w, h) => h * Math.exp(-(((x - c) / w) ** 2));
  return Math.min(700, 270 + (fbm2(x / 430, 1.7, 45) - .5) * 260 + bump(900, 360, 300) + bump(3650, 400, 320) + bump(1950, 260, 150) - bump(2700, 260, 60));
}
function cliffHE(z) { const bump = (c, w, h) => h * Math.exp(-(((z - c) / w) ** 2)); return Math.min(700, 250 + (fbm2(z / 380, 3.1, 47) - .5) * 220 + bump(520, 420, 320) + bump(1300, 260, 120)); }

/* ================= SPRITE PIPELINE ================= */
const SR = (() => { try { const o = JSON.parse(localStorage.getItem('forgotten_village_v1') || 'null'); if (o && o.settings && o.settings.low) return 1.6; } catch (e) {} return 2.6; })();
const OUT_W = .55;
function sprite(w, h, fn, ay, opt) {
  ay = ay ?? h - 6; opt = opt || {};
  const pad = 3, W = w + pad * 2, H = h + pad * 2, cw = Math.ceil(W * SR), chh = Math.ceil(H * SR);
  const body = document.createElement('canvas'); body.width = cw; body.height = chh;
  const g = body.getContext('2d'); g.scale(SR, SR); g.translate(w / 2 + pad, ay + pad); g.lineCap = 'round'; g.lineJoin = 'round';
  fn(g);
  const c = document.createElement('canvas'); c.width = cw; c.height = chh;
  const o = c.getContext('2d');
  if (opt.sh) { o.save(); o.scale(SR, SR); o.translate(w / 2 + pad, ay + pad); const gr = o.createRadialGradient(opt.sh[2] || 0, 1, 1, opt.sh[2] || 0, 1, opt.sh[0]); gr.addColorStop(0, 'rgba(20,24,12,.34)'); gr.addColorStop(1, 'rgba(20,24,12,0)'); o.fillStyle = gr; o.beginPath(); o.ellipse(opt.sh[2] || 0, 1, opt.sh[0], opt.sh[1], 0, 0, 6.283); o.fill(); o.restore(); }
  if (opt.flat) o.drawImage(body, 0, 0);
  else {
    const sil = document.createElement('canvas'); sil.width = cw; sil.height = chh;
    const s = sil.getContext('2d'); s.drawImage(body, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = 'rgba(28,32,18,.4)'; s.fillRect(0, 0, cw, chh);
    const rr = OUT_W * SR;
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; o.drawImage(sil, Math.cos(a) * rr, Math.sin(a) * rr); }
    // volumetric light: warm sky light from above, cool bounce below, applied only over the drawn pixels
    { const lg = body.getContext('2d'); lg.save(); lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-atop';
      const gr = lg.createLinearGradient(0, 0, 0, chh); gr.addColorStop(0, 'rgba(255,244,190,.16)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(10,26,40,.24)');
      lg.fillStyle = gr; lg.fillRect(0, 0, cw, chh);
      const rg = lg.createRadialGradient(cw * .36, chh * .3, 2, cw * .5, chh * .5, Math.max(cw, chh) * .62); rg.addColorStop(0, 'rgba(255,240,170,.12)'); rg.addColorStop(1, 'rgba(0,10,20,.12)');
      lg.fillStyle = rg; lg.fillRect(0, 0, cw, chh); lg.restore(); }
    o.drawImage(body, 0, 0);
  }
  return { c, w: W, h: H, ax: w / 2 + pad, ay: ay + pad };
}
function ell(g, x, y, rx, ry, f) { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2); if (f) g.fillStyle = f; g.fill(); }
function circ(g, x, y, r, f) { ell(g, x, y, r, r, f); }
function poly(g, pts, f, s, lw) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); if (f) { g.fillStyle = f; g.fill(); } if (s) { g.strokeStyle = s; g.lineWidth = lw || 1; g.stroke(); } }
function line(g, x1, y1, x2, y2, s, w) { g.strokeStyle = s; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
function rrect(g, x, y, w, h, r, f) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); if (f) { g.fillStyle = f; g.fill(); } }
function sparkle(g, x, y, s, col) { g.fillStyle = col || '#fff'; g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill(); }
function flower(g, x, y, r, col) { g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 - 1.57; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * .7, 0, 6.283); g.fill(); } circ(g, x, y, r * .45, '#d8b440'); }
function foliage(g, cx, cy, rx, ry, base, rnd, n) {
  n = Math.round((n || 26) * 1.7);
  const r0 = (rx + ry) * .2 * .74;
  for (let i = 0; i < n; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()); circ(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d + r0 * .35, r0 * (.7 + rnd() * .5), shade(base, -.32)); }
  for (let i = 0; i < n; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * .92; circ(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d - r0 * .1, r0 * (.6 + rnd() * .45), shade(base, (rnd() - .5) * .14)); }
  for (let i = 0; i < n * .7; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * .6; circ(g, cx - rx * .28 + Math.cos(a) * rx * d, cy - ry * .34 + Math.sin(a) * ry * d, r0 * (.35 + rnd() * .3), shade(base, .14 + rnd() * .14)); }
}
function bark(g, x0, y0, x1, y1, w0, w1, col) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x0 - w0, y0); g.quadraticCurveTo((x0 + x1) / 2 - w0 * .8, (y0 + y1) / 2, x1 - w1, y1); g.lineTo(x1 + w1, y1); g.quadraticCurveTo((x0 + x1) / 2 + w0 * .8, (y0 + y1) / 2, x0 + w0, y0); g.closePath(); g.fill();
  g.strokeStyle = shade(col, -.3); g.lineWidth = .8; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x0 + i * w0 * .5, y0 - 2); g.quadraticCurveTo((x0 + x1) / 2 + i * w0 * .4, (y0 + y1) / 2, x1 + i * w1 * .5, y1 + 2); g.stroke(); }
  g.fillStyle = shade(col, .18); g.beginPath(); g.moveTo(x0 - w0 * .6, y0); g.quadraticCurveTo((x0 + x1) / 2 - w0 * .6, (y0 + y1) / 2, x1 - w1 * .6, y1); g.lineTo(x1 - w1 * .2, y1); g.quadraticCurveTo((x0 + x1) / 2 - w0 * .2, (y0 + y1) / 2, x0 - w0 * .2, y0); g.fill();
}
function rockShape(g, x, y, s, col, rnd) {
  col = col || PAL.rock2; rnd = rnd || Math.random;
  const pts = [], n = 7;
  for (let i = 0; i < n; i++) { const a = Math.PI + i / (n - 1) * Math.PI; pts.push([x + Math.cos(a) * 15 * s * (.8 + rnd() * .35), y + Math.sin(a) * 15 * s * (.7 + rnd() * .4)]); }
  g.fillStyle = shade(col, -.2); g.beginPath(); g.moveTo(x - 15 * s, y + 1); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(x + 15 * s, y + 1); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n - 1; i++) g.lineTo(pts[i][0], pts[i][1]); g.lineTo(x + 3 * s, y - 4 * s); g.lineTo(x - 8 * s, y - 2 * s); g.closePath(); g.fill();
  g.fillStyle = shade(col, .22); g.beginPath(); g.moveTo(pts[1][0], pts[1][1]); g.lineTo(pts[2][0], pts[2][1]); g.lineTo(pts[3][0], pts[3][1]); g.lineTo(x - 2 * s, y - 8 * s); g.closePath(); g.fill();
  g.strokeStyle = shade(col, -.4); g.lineWidth = .7; g.beginPath(); g.moveTo(x - 2 * s, y - 10 * s); g.lineTo(x + 2 * s, y - 4 * s); g.lineTo(x + 1 * s, y); g.stroke();
}
function stoneShape(g, x, y, s, col) { rockShape(g, x, y, s, col || PAL.stone, mulberry(Math.round(x * 13 + y * 7 + s * 100))); }

/* ================= NATURE ================= */
function drawPalm(g, rnd) {
  const h = 110 + rnd() * 40, lean = (rnd() - .5) * 56;
  const pt = t => [2 * (1 - t) * t * lean * .1 + t * t * lean, -h * (2 * (1 - t) * t * .55 + t * t)];
  for (let i = 0; i < 16; i++) { const [x, y] = pt(i / 16), [x2, y2] = pt((i + 1) / 16); const w = 8.5 - i * .25; line(g, x, y, x2, y2, '#7a6248', w); line(g, x - w * .25, y, x2 - w * .25, y2, '#94795a', w * .35); line(g, x - w / 2, y, x + w / 2, y + 1.5, '#5a4632', .9); }
  const [tx, ty] = pt(1);
  const frond = (a, len, col) => {
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * .35 + len * .42;
    const cx = tx + Math.cos(a) * len * .5, cy = ty + Math.sin(a) * len * .15 - 18;
    g.strokeStyle = shade(col, -.2); g.lineWidth = 1.6; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
    for (let k = 1; k < 16; k++) { const t = k / 16; const px = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * cx + t * t * ex, py = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * cy + t * t * ey;
      const dx = 2 * (1 - t) * (cx - tx) + 2 * t * (ex - cx), dy = 2 * (1 - t) * (cy - ty) + 2 * t * (ey - cy), L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ll = 11 * Math.sin(t * 3.1) + 2;
      g.strokeStyle = k % 2 ? col : shade(col, .15); g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + nx * ll + dx / L * 4, py + ny * ll + 5); g.moveTo(px, py); g.lineTo(px - nx * ll + dx / L * 4, py - ny * ll + 5); g.stroke(); }
  };
  const n = 9;
  for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rnd() * .3; if (Math.sin(a) < 0) frond(a, 50 + rnd() * 14, '#3f6e33'); }
  circ(g, tx - 4, ty + 6, 4.5, '#6a5232'); circ(g, tx + 4, ty + 7, 4.5, '#5e4a2c'); circ(g, tx, ty + 10, 4, '#7a6038');
  for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rnd() * .3 + .35; if (Math.sin(a) >= 0) frond(a, 52 + rnd() * 14, '#4f8a3a'); }
}
function drawTree(g, rnd, kind) {
  const h = 80 + rnd() * 36;
  bark(g, 0, 0, 1, -h * .56, 8, 4.5, PAL.trunk);
  line(g, 0, -h * .4, -16, -h * .62, PAL.trunk, 3.5); line(g, 1, -h * .46, 15, -h * .66, PAL.trunk, 3);
  const base = kind === 'dark' ? '#3a6630' : kind === 'olive' ? '#6f8a3a' : kind === 'gold' ? '#9a9a3e' : PAL.leaf[Math.floor(rnd() * 4)];
  foliage(g, 0, -h * .8, 44, 34, base, rnd, 30);
  if (kind === 'fruit') for (let i = 0; i < 9; i++) { const x = (rnd() - .5) * 64, y = -h * .7 - rnd() * h * .3; circ(g, x, y, 2.6, '#d98a3a'); circ(g, x - .7, y - .7, .8, '#f0c08a'); }
  if (kind === 'blossom') for (let i = 0; i < 18; i++) { const x = (rnd() - .5) * 72, y = -h * .62 - rnd() * h * .42; circ(g, x, y, 1.6 + rnd(), rnd() < .5 ? '#f2e2e4' : PAL.blossom); }
}
function drawSpire(g, rnd) {
  const h = 110 + rnd() * 50, col = ['#35603a', '#2f5a36', '#3e6a3c'][Math.floor(rnd() * 3)];
  bark(g, 0, 0, 0, -30, 4, 3, '#5a4030');
  for (let i = 0; i < 7; i++) { const y = -18 - i * h * .12, w = 24 - i * 3; foliage(g, 0, y - 6, w, 11, col, rnd, 10); }
  foliage(g, 0, -h * .92, 6, 12, col, rnd, 6);
}
function drawBush(g, rnd, berries, col, flowers) {
  const base = col || PAL.leaf[Math.floor(rnd() * 4)];
  foliage(g, 0, -15, 28, 15, base, rnd, 20);
  if (berries) for (let i = 0; i < berries; i++) { const x = (rnd() - .5) * 44, y = -6 - rnd() * 22; circ(g, x, y, 2.3, '#a8203a'); circ(g, x - .7, y - .7, .8, '#e88a9a'); }
  if (flowers) for (let i = 0; i < 9; i++) circ(g, (rnd() - .5) * 42, -6 - rnd() * 24, 1.8, flowers);
}
function drawRock(g, rnd, big) {
  if (big) { rockShape(g, -18, 0, 1, PAL.rock3, rnd); rockShape(g, 17, 1, .9, PAL.rock1, rnd); rockShape(g, 0, 3, 1.25, PAL.rock2, rnd); }
  else rockShape(g, 0, 0, 1, rnd() < .5 ? PAL.rock2 : PAL.stone, rnd);
  if (rnd() < .6) { for (let i = 0; i < 8; i++) circ(g, -10 + rnd() * 16, -2 - rnd() * 5, 1.6 + rnd(), rnd() < .5 ? '#5f8a3a' : '#7a9a44'); }
}
function drawFern(g, rnd) {
  const col = PAL.leaf[Math.floor(rnd() * 4)];
  for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * .32; const len = 16 + rnd() * 9; const ex = Math.cos(a) * len * 1.35, ey = Math.sin(a) * len;
    g.strokeStyle = shade(col, -.2); g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(ex * .5, ey * .7, ex, ey); g.stroke();
    for (let k = 1; k < 8; k++) { const t = k / 8, px = ex * t, py = ey * (t * (1.4 - t * .4)), l = 4.5 * (1 - t * .7); g.strokeStyle = k % 2 ? col : shade(col, .15); g.lineWidth = 1.4; g.beginPath(); g.moveTo(px, py); g.lineTo(px - l, py - l * .6); g.moveTo(px, py); g.lineTo(px + l, py - l * .6); g.stroke(); } }
}
function drawFlowers(g, rnd) {
  for (let i = 0; i < 10; i++) { const x = (rnd() - .5) * 32, y = -4 - rnd() * 12; line(g, x, 0, x + (rnd() - .5) * 3, y, '#4f7a36', 1); circ(g, x, y - 1, 1.6, PAL.flowers[Math.floor(rnd() * PAL.flowers.length)]); }
  for (let i = 0; i < 8; i++) line(g, (rnd() - .5) * 30, 0, (rnd() - .5) * 34, -6 - rnd() * 8, '#5f8a3a', 1.1);
}
function drawMushroom(g, rnd) {
  const cap = rnd() < .5 ? '#9a6a44' : '#b8844e';
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 9 + (rnd() - .5) * 4, k = .5 + rnd() * .5;
    g.fillStyle = '#e8dcc4'; g.fillRect(x - 1.8 * k, -12 * k, 3.6 * k, 12 * k);
    g.fillStyle = cap; g.beginPath(); g.moveTo(x - 8 * k, -11 * k); g.quadraticCurveTo(x, -22 * k, x + 8 * k, -11 * k); g.closePath(); g.fill();
    g.fillStyle = shade(cap, .25); g.beginPath(); g.ellipse(x - 2 * k, -15 * k, 3 * k, 1.5 * k, -.3, 0, 6.283); g.fill();
  }
}
function drawDriftwood(g) { g.fillStyle = '#b8a282'; g.beginPath(); g.ellipse(0, -3, 24, 4, -.1, 0, 6.283); g.fill(); g.strokeStyle = '#8f7a5e'; g.lineWidth = .8; g.beginPath(); g.moveTo(-20, -3); g.lineTo(18, -5); g.stroke(); line(g, 8, -4, 18, -13, '#b8a282', 3); circ(g, -22, -2, 2.6, '#9a8468'); }
function drawStarfishAt(g, x, y) { g.fillStyle = '#c8704a'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 - 1.57, rr = k % 2 ? 2.4 : 6; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .6); } g.fill(); }

/* ================= CLIFFS, WATERFALL, CAVE ================= */
function drawCave(g, rnd) {
  // weathered rock surround so the opening blends into the wall
  const rg = g.createRadialGradient(0, -60, 20, 0, -60, 120); rg.addColorStop(0, 'rgba(70,60,50,.9)'); rg.addColorStop(.6, 'rgba(90,78,64,.55)'); rg.addColorStop(1, 'rgba(90,78,64,0)');
  g.fillStyle = rg; g.beginPath(); g.ellipse(0, -58, 118, 96, 0, 0, 6.283); g.fill();
  const mg = g.createRadialGradient(0, -30, 5, 0, -40, 80); mg.addColorStop(0, '#050404'); mg.addColorStop(.7, '#15110d'); mg.addColorStop(1, '#2a221a');
  const arch = () => { g.beginPath(); g.moveTo(-58, 2); g.quadraticCurveTo(-62, -70, -24, -104); g.quadraticCurveTo(0, -118, 26, -102); g.quadraticCurveTo(62, -72, 58, 2); g.closePath(); };
  arch(); g.fillStyle = mg; g.fill();
  arch(); g.strokeStyle = 'rgba(200,185,160,.35)'; g.lineWidth = 3; g.stroke();
  g.strokeStyle = 'rgba(40,30,20,.6)'; g.lineWidth = 1.4;
  for (const [x, y] of [[-72, -60], [72, -58], [-40, -122], [44, -120]]) { g.beginPath(); g.arc(x, y, 5, 0, 6.283); g.moveTo(x - 7, y + 9); g.lineTo(x + 7, y + 9); g.stroke(); }
  const bl = [[-34, 2, 1.6], [26, 3, 1.8], [-4, -2, 2.1], [-22, -38, 1.3], [16, -40, 1.4], [0, -66, 1.1], [44, -14, 1], [-48, -8, 1]];
  for (const [x, y, s] of bl) rockShape(g, x, y, s, rnd() < .5 ? '#8a7f70' : '#7a6f62', rnd);
  for (let i = 0; i < 10; i++) circ(g, -40 + rnd() * 80, -60 + rnd() * 60, 1.8 + rnd() * 1.4, 'rgba(90,120,60,.8)');
  line(g, -60, -6, -30, -50, '#5a4636', 4); line(g, 58, -4, 34, -44, '#5a4636', 4);
}
/* Large weathered boulder, lit from the upper left. */
function drawBoulder(g, rnd, w, h) {
  const n = 11, pts = [];
  for (let i = 0; i < n; i++) { const a = Math.PI + i / (n - 1) * Math.PI; const rr = .82 + rnd() * .28; pts.push([Math.cos(a) * w / 2 * rr, Math.sin(a) * h * rr * (i === 0 || i === n - 1 ? .25 : 1)]); }
  const shape = () => { g.beginPath(); g.moveTo(-w / 2, 2); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(w / 2, 2); g.quadraticCurveTo(0, 6, -w / 2, 2); g.closePath(); };
  const base = ['#8a7e6c', '#948674', '#7e7466', '#9a8e7c'][Math.floor(rnd() * 4)];
  const gr = g.createRadialGradient(-w * .22, -h * .72, h * .08, -w * .05, -h * .4, Math.max(w, h) * .8);
  gr.addColorStop(0, shade(base, .32)); gr.addColorStop(.45, base); gr.addColorStop(1, shade(base, -.45));
  shape(); g.fillStyle = gr; g.fill();
  g.save(); shape(); g.clip();
  // facets and planes
  for (let i = 0; i < 4; i++) { const x0 = (rnd() - .3) * w * .6, y0 = -h * (.2 + rnd() * .7); g.fillStyle = rnd() < .5 ? 'rgba(20,16,12,.16)' : 'rgba(255,245,225,.1)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w * (.2 + rnd() * .3), y0 + h * (.1 + rnd() * .2)); g.lineTo(x0 + w * (.15 + rnd() * .3), y0 + h * (.4 + rnd() * .3)); g.lineTo(x0 - w * .05, y0 + h * .3); g.fill(); }
  // speckle texture
  for (let i = 0; i < w * .9; i++) { g.fillStyle = rnd() < .5 ? 'rgba(255,250,235,.12)' : 'rgba(20,16,12,.14)'; g.fillRect((rnd() - .5) * w, -rnd() * h, 1.4, 1.4); }
  // cracks
  g.strokeStyle = 'rgba(25,20,15,.5)'; g.lineWidth = 1;
  for (let i = 0; i < 2; i++) { let x = (rnd() - .5) * w * .6, y = -h * (.3 + rnd() * .6); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - .4) * w * .12; y += h * .14; g.lineTo(x, y); } g.stroke(); }
  // moss cap and lichen
  const mg = g.createRadialGradient(-w * .1, -h * 1.05, 2, -w * .1, -h * .9, w * .45); mg.addColorStop(0, 'rgba(92,128,56,.95)'); mg.addColorStop(.6, 'rgba(82,116,50,.7)'); mg.addColorStop(1, 'rgba(82,116,50,0)');
  if (rnd() < .75) { g.fillStyle = mg; g.fillRect(-w / 2, -h * 1.3, w, h * .9); }
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(200,196,140,.5)'; g.beginPath(); g.arc((rnd() - .5) * w * .7, -h * (.2 + rnd() * .6), 1.5 + rnd() * 3, 0, 6.283); g.fill(); }
  // grounding shadow at the base
  const bs = g.createLinearGradient(0, -h * .25, 0, 4); bs.addColorStop(0, 'rgba(15,12,9,0)'); bs.addColorStop(1, 'rgba(15,12,9,.45)'); g.fillStyle = bs; g.fillRect(-w / 2, -h * .25, w, h * .3);
  g.restore();
  // grass tufts at the foot
  for (let i = 0; i < 8; i++) { const x = (rnd() - .5) * w * 1.05; g.strokeStyle = rnd() < .5 ? '#4f7a36' : '#5f8a3e'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, 3); g.lineTo(x + (rnd() - .5) * 4, -3 - rnd() * 7); g.stroke(); }
}
/* ================= THE MIRE ================= */
function drawDeadTree(g, rnd) {
  const h = 90 + rnd() * 50;
  bark(g, 0, 0, (rnd() - .5) * 20, -h * .6, 7, 3.5, '#3d352c');
  g.strokeStyle = '#3d352c'; g.lineCap = 'round';
  const branch = (x, y, a, len, w, d) => {
    if (d > 4 || len < 5) return;
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    g.strokeStyle = '#3d352c'; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + ex) / 2 + (rnd() - .5) * len * .4, (y + ey) / 2 + (rnd() - .5) * len * .3, ex, ey); g.stroke();
    const n = 2 + (rnd() < .4 ? 1 : 0);
    for (let i = 0; i < n; i++) branch(ex, ey, a + (rnd() - .5) * 1.4, len * (.55 + rnd() * .2), w * .6, d + 1);
  };
  const tx = 0, ty = -h * .58;
  branch(tx, ty, -1.57 - .5, h * .32, 4, 0); branch(tx, ty, -1.57 + .6, h * .3, 3.6, 0); branch(tx, ty + 12, -1.57 - 1.2, h * .22, 3, 1);
  for (let i = 0; i < 10; i++) { const x = (rnd() - .5) * h * .6, y = -h * .55 - rnd() * h * .35, len = 12 + rnd() * 26; g.strokeStyle = 'rgba(120,130,90,.75)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y + len * .5, x - 1, y + len); g.moveTo(x + 2, y); g.quadraticCurveTo(x + 5, y + len * .4, x + 3, y + len * .8); g.stroke(); }
  for (let i = 0; i < 4; i++) { const a = rnd() * 3.14; line(g, 0, -2, Math.cos(a) * 18 * (rnd() < .5 ? -1 : 1), 1, '#2e2820', 3); }
}
function drawStump(g, rnd) {
  bark(g, 0, 0, 0, -18, 12, 11, '#43392e'); ell(g, 0, -18, 11, 4, '#6a5a44'); ell(g, 0, -18, 7, 2.5, '#554736');
  for (let i = 0; i < 3; i++) { const x = -8 + rnd() * 16; g.fillStyle = '#c8c070'; g.beginPath(); g.ellipse(x, -10 + rnd() * 6, 3, 1.5, 0, 0, 6.283); g.fill(); }
}
function drawBones(g) {
  const bone = '#d8d0bc', dk = '#9a917c';
  for (let i = 0; i < 5; i++) { g.strokeStyle = bone; g.lineWidth = 2.2; g.beginPath(); g.arc(-4 + i * 5, 0, 10 - Math.abs(i - 2) * 1.5, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
  line(g, -14, -1, 22, -1, dk, 2.6);
  g.fillStyle = bone; g.beginPath(); g.ellipse(-20, -5, 7, 6, 0, 0, 6.283); g.fill(); g.fillRect(-25, -3, 10, 4);
  circ(g, -22.5, -6, 1.8, '#1d1a14'); circ(g, -17.5, -6, 1.8, '#1d1a14'); g.fillStyle = '#1d1a14'; g.fillRect(-21, -2, 2, 1.6);
  line(g, 18, 2, 30, -2, bone, 2); circ(g, 30, -2, 1.8, bone); circ(g, 18, 2, 1.8, bone);
}
function drawTotem(g) {
  line(g, 0, 2, 0, -64, '#3d352c', 4.5);
  line(g, -14, -44, 14, -48, '#3d352c', 3);
  g.fillStyle = '#d2c9b2'; g.beginPath(); g.ellipse(0, -70, 8, 7.5, 0, 0, 6.283); g.fill(); g.fillRect(-5, -66, 10, 5);
  circ(g, -3, -71, 2.2, '#140f0a'); circ(g, 3, -71, 2.2, '#140f0a'); g.fillStyle = '#140f0a'; g.fillRect(-1, -66.5, 2, 2);
  g.fillStyle = '#5a2a22'; g.beginPath(); g.moveTo(-12, -46); g.lineTo(-18, -24); g.lineTo(-10, -30); g.lineTo(-8, -46); g.fill();
  g.fillStyle = '#3a3a2a'; g.beginPath(); g.moveTo(12, -48); g.lineTo(16, -28); g.lineTo(9, -34); g.fill();
  for (let i = 0; i < 3; i++) line(g, 0, -58 + i * 3, 6 + i * 3, -50 + i * 6, '#222', 1.2);
  for (const x of [-14, 14]) { line(g, x, -46, x, -38, '#6a5a44', .8); circ(g, x, -36, 2, '#d2c9b2'); }
}
function drawCattails(g, rnd) {
  for (let i = 0; i < 16; i++) { const x = (rnd() - .5) * 34, h = 24 + rnd() * 22, lean = (rnd() - .5) * 10; line(g, x, 0, x + lean, -h, i % 3 ? '#4a5230' : '#3a4226', 1.4); if (i % 3 === 0) { ell(g, x + lean * .92, -h * .88, 2.2, 6, '#3a2a1c'); } }
}
function drawThorns(g, rnd) {
  g.strokeStyle = '#2a2418'; g.lineWidth = 2.2;
  for (let i = 0; i < 14; i++) { const x = (rnd() - .5) * 50; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (rnd() - .5) * 30, -14, x + (rnd() - .5) * 40, -26, x + (rnd() - .5) * 44, -20 - rnd() * 16); g.stroke(); }
  g.fillStyle = '#2a2418'; for (let i = 0; i < 40; i++) { const x = (rnd() - .5) * 60, y = -rnd() * 34; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y - 1); g.lineTo(x + .5, y + 1.4); g.fill(); }
  for (let i = 0; i < 6; i++) circ(g, (rnd() - .5) * 46, -6 - rnd() * 24, 1.8, '#6a1a3a');
}
function drawRuinHut(g, rnd) {
  g.fillStyle = '#4a3f30'; g.beginPath(); g.moveTo(-34, 0); g.lineTo(-30, -26); g.lineTo(28, -30); g.lineTo(34, 0); g.fill();
  for (let i = -28; i < 30; i += 7) line(g, i, -2, i + 2, -26, 'rgba(20,16,10,.5)', 1.3);
  g.fillStyle = '#5a4a34'; g.beginPath(); g.moveTo(-40, -24); g.lineTo(-6, -58); g.lineTo(10, -38); g.lineTo(38, -28); g.lineTo(30, -24); g.closePath(); g.fill();
  g.fillStyle = '#0e0c08'; g.fillRect(-6, -20, 12, 20);
  line(g, 10, -38, 22, -60, '#3d352c', 3); line(g, -6, -58, -20, -64, '#3d352c', 2.4);
  for (let i = 0; i < 6; i++) circ(g, -30 + rnd() * 60, -rnd() * 5, 2 + rnd() * 2, 'rgba(90,110,40,.8)');
}

/* ================= BUILDINGS & LANDMARKS ================= */
function drawHut(g) {
  g.fillStyle = PAL.wallLo; g.beginPath(); g.ellipse(0, -3, 34, 10, 0, 0, Math.PI); g.fill();
  const wg = g.createLinearGradient(-34, 0, 34, 0); wg.addColorStop(0, '#a8845e'); wg.addColorStop(.45, '#cfae88'); wg.addColorStop(1, '#94734f');
  g.fillStyle = wg; g.beginPath(); g.moveTo(-34, -3); g.quadraticCurveTo(-36, -22, -31, -34); g.lineTo(31, -34); g.quadraticCurveTo(36, -22, 34, -3); g.quadraticCurveTo(0, 8, -34, -3); g.fill();
  g.strokeStyle = 'rgba(90,60,35,.35)'; g.lineWidth = .8; for (let y = -30; y < -2; y += 5) { g.beginPath(); g.moveTo(-33, y); g.quadraticCurveTo(0, y + 5, 33, y); g.stroke(); }
  for (let i = -26; i <= 26; i += 13) line(g, i, -2 + Math.abs(i) * .05, i * 1.02, -33, 'rgba(90,60,35,.35)', 2);
  g.fillStyle = '#2a1c12'; g.beginPath(); g.moveTo(-9, 3); g.lineTo(-9, -17); g.quadraticCurveTo(0, -26, 9, -17); g.lineTo(9, 3); g.fill();
  g.fillStyle = PAL.door; g.beginPath(); g.moveTo(-7, 3); g.lineTo(-7, -15); g.quadraticCurveTo(0, -23, 7, -15); g.lineTo(7, 3); g.fill();
  for (let x = -5; x <= 5; x += 2.5) line(g, x, 2, x, -18 + Math.abs(x) * .4, 'rgba(30,20,12,.45)', .7);
  g.fillStyle = '#1e140c'; g.fillRect(17, -24, 10, 8); line(g, 22, -24, 22, -16, '#6a4a30', 1); line(g, 16, -16, 28, -16, '#6a4a30', 1.4);
  const layer = (y0, y1, wv, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(-wv, y0); g.quadraticCurveTo(-wv * .55, y1 - 4, 0, y1 - 18); g.quadraticCurveTo(wv * .55, y1 - 4, wv, y0); g.quadraticCurveTo(0, y0 + 8, -wv, y0); g.fill(); };
  layer(-26, -74, 47, PAL.thatchLo); layer(-30, -76, 44, PAL.thatch); layer(-46, -80, 32, shade(PAL.thatch, .06)); layer(-60, -84, 20, PAL.thatchHi);
  g.strokeStyle = 'rgba(80,55,20,.45)'; g.lineWidth = .8;
  for (let i = -42; i <= 42; i += 3) { g.beginPath(); g.moveTo(i, -27 - Math.abs(i) * .02 + 4); g.lineTo(i * .55, -48 - (42 - Math.abs(i)) * .3); g.stroke(); }
  for (let i = -44; i <= 44; i += 4) line(g, i, -27 + Math.abs(i) * .1, i + 1, -22 + Math.abs(i) * .12 + (i % 8 ? 2 : 0), 'rgba(140,100,50,.9)', 1);
  line(g, -2, -92, 2, -99, '#5a4030', 2.2); line(g, 0, -92, -3, -98, '#5a4030', 1.8);
}
function drawFoundation(g, w) {
  w = w || 34;
  g.fillStyle = 'rgba(120,95,65,.45)'; g.beginPath(); g.ellipse(0, -2, w, w * .3, 0, 0, 6.283); g.fill();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; stoneShape(g, Math.cos(a) * w, Math.sin(a) * w * .3, .32, i % 3 ? PAL.stone : PAL.rock1); }
  line(g, -w * .6, -2, -w * .6, -22, PAL.trunk, 3.5); line(g, w * .6, -2, w * .6, -22, PAL.trunk, 3.5);
  g.strokeStyle = '#c8b890'; g.lineWidth = .8; g.beginPath(); g.moveTo(-w * .6, -18); g.lineTo(w * .6, -18); g.stroke();
}
function drawHutFrame(g) {
  drawFoundation(g, 32);
  for (const x of [-30, -15, 0, 15, 30]) line(g, x, -1, x * .9, -32, PAL.trunkHi, 3.2);
  line(g, -33, -32, 33, -32, PAL.trunkHi, 3.2);
  for (const x of [-30, 30]) line(g, x, -32, 0, -74, PAL.trunkHi, 2.8);
  line(g, -18, -54, 18, -54, PAL.trunkHi, 2.2);
  g.fillStyle = PAL.thatch; g.beginPath(); g.moveTo(-30, -32); g.quadraticCurveTo(-18, -52, -8, -62); g.lineTo(-4, -34); g.fill();
}
function drawLarder(g, level) {
  const basket = (x, y, s, fill) => {
    g.fillStyle = '#9a7040'; g.beginPath(); g.moveTo(x - 14 * s, y - 17 * s); g.lineTo(x + 14 * s, y - 17 * s); g.quadraticCurveTo(x + 12 * s, y, x + 9 * s, y); g.lineTo(x - 9 * s, y); g.quadraticCurveTo(x - 12 * s, y, x - 14 * s, y - 17 * s); g.fill();
    for (let i = 0; i < 4; i++) line(g, x - 12 * s, y - 13 * s + i * 3.6 * s, x + 12 * s, y - 13 * s + i * 3.6 * s, '#7a5430', .9);
    for (let i = -3; i <= 3; i++) line(g, x + i * 3.4 * s, y - 16 * s, x + i * 2.6 * s, y, 'rgba(90,60,30,.5)', .7);
    ell(g, x, y - 17 * s, 14 * s, 4.4 * s, '#7a5430');
    if (fill) { const cs = ['#a8303a', '#d08a2a', '#7a9a3a', '#6a3a6a', '#c86a3a']; for (let i = 0; i < 9; i++) { const fx = x + (i % 4 - 1.5) * 6.5 * s, fy = y - 19 * s - Math.floor(i / 4) * 4.5 * s; circ(g, fx, fy, 3.3 * s, cs[i % 5]); circ(g, fx - 1 * s, fy - 1.2 * s, 1 * s, 'rgba(255,255,255,.35)'); } }
  };
  basket(-13, 0, 1, level > 0); basket(15, 2, .85, level > 1); basket(1, -5, .75, level > 2);
  if (level > 2) { ell(g, -28, 0, 5, 4, '#7a9a3a'); circ(g, -22, 2, 3.6, '#d08a2a'); ell(g, 28, 1, 7, 4, '#6a5a2a'); }
}
function drawStudy(g) {
  poly(g, [-28, 0, -26, -15, -18, -15, -18, 0], PAL.stoneLo); poly(g, [18, 0, 18, -15, 26, -15, 28, 0], PAL.stoneLo);
  rrect(g, -36, -24, 72, 10, 2, PAL.stone); rrect(g, -36, -24, 72, 3, 1, PAL.stoneHi);
  g.strokeStyle = 'rgba(50,45,40,.4)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-10, -24); g.lineTo(-6, -14); g.stroke();
  poly(g, [-24, -24, -8, -24, -9, -40, -23, -40], '#b8a07a'); for (let i = 0; i < 5; i++) line(g, -21, -37 + i * 2.8, -11, -37 + i * 2.8, '#6a5230', .8);
  rrect(g, 0, -29, 22, 5, 2, '#e6dcc4'); circ(g, 0, -26.5, 3, '#cfc0a0'); circ(g, 22, -26.5, 3, '#cfc0a0');
  poly(g, [25, -24, 33, -24, 32, -32, 26, -32], '#8a5a3a'); line(g, 29, -32, 33, -42, '#e0d8c8', 1.2);
}
function drawHearth(g, st) {
  if (st >= 1) { line(g, -13, -5, 11, -9, st === 3 ? '#2a1e18' : '#7a5838', 6); line(g, -11, -10, 13, -5, st === 3 ? '#342620' : '#8a6644', 6); if (st === 3) circ(g, -3, -7, 2, '#5a2a18'); }
  if (st === 2) for (let i = 0; i < 10; i++) line(g, -9 + i * 2, -9, -11 + i * 2.6, -18, '#c8b060', 1.2);
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; if ((Math.sin(a) < 0) !== (pass === 0)) continue; stoneShape(g, Math.cos(a) * 24, Math.sin(a) * 8 - 2, .36, i % 2 ? PAL.stone : PAL.rock1); }
}
function drawWoodpile(g) {
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) { const x = -19 + i * 13 + r * 6.5, y = -6 - r * 9; line(g, x - 11, y + 2, x + 11, y - 1, '#6e5038', 8); line(g, x - 11, y, x + 11, y - 3, '#8c6a4a', 2); circ(g, x + 11, y - 1, 4, '#c8a47a'); g.strokeStyle = '#8a6a48'; g.lineWidth = .6; g.beginPath(); g.arc(x + 11, y - 1, 2.4, 0, 6.283); g.stroke(); }
}
function drawReeds(g, rnd) {
  for (let i = 0; i < 30; i++) { const x = (rnd() - .5) * 32, h = 22 + rnd() * 20, lean = (rnd() - .5) * 12; line(g, x, 0, x + lean, -h, i % 3 ? '#c8aa5a' : '#a88a44', 1.4); if (i % 5 === 0) ell(g, x + lean, -h, 1.8, 5, '#8a6a3a'); }
}
function drawTorches(g, lit) {
  stoneShape(g, 0, 0, .9);
  for (const [x, a] of [[-8, -.25], [8, .3]]) { const ex = x + Math.sin(a) * 38, ey = -Math.cos(a) * 38; line(g, x, 0, ex, ey, '#6e5038', 3.2); ell(g, ex, ey, 4.5, 6, lit ? '#3a2a20' : '#8a6a44'); for (let k = -1; k <= 1; k++) line(g, ex - 4, ey + k * 2, ex + 4, ey + k * 2 - 1, 'rgba(60,40,20,.5)', .8); }
}
function drawHiveTree(g, rnd) {
  drawTree(g, rnd, 'green');
  line(g, 12, -64, 12, -54, '#5a4030', 1.4);
  const hx = 12, hy = -42;
  for (let i = 0; i < 5; i++) ell(g, hx, hy - 10 + i * 5, 9.5 - Math.abs(i - 2) * 1.8, 3.4, i % 2 ? '#c89a4a' : '#a87a34');
  circ(g, hx, hy + 6, 2.2, '#2a1a0a');
}
function drawSpringRocks(g, rnd) {
  rockShape(g, -20, 0, 1.3, PAL.rock3, rnd); rockShape(g, 18, 1, 1.1, PAL.rock1, rnd); rockShape(g, 0, -4, 1.5, PAL.rock2, rnd);
  for (let i = 0; i < 18; i++) circ(g, (rnd() - .5) * 64, -rnd() * 22, 1.6 + rnd() * 2, rnd() < .5 ? '#4f7a36' : '#6a8f40');
  for (let i = 0; i < 3; i++) ell(g, -10 + i * 10, 3, 2, 2.6, '#6fb0c0');
}
function drawSpring(g) {
  ell(g, 0, -3, 42, 14, '#7a6e5e'); ell(g, 0, -3, 35, 11, '#2f7f96'); ell(g, -6, -5, 24, 6, '#4aa7ba'); ell(g, -12, -7, 10, 1.8, 'rgba(255,255,255,.55)');
  stoneShape(g, 0, -12, 1.4);
  line(g, 0, -30, 0, -14, 'rgba(180,225,235,.9)', 3.4); circ(g, 0, -31, 2.8, '#c8eaf0');
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; if (Math.sin(a) > -.2) stoneShape(g, Math.cos(a) * 38, Math.sin(a) * 12, .42, i % 2 ? PAL.stone : PAL.rock1); }
}
function drawWreck(g, rnd) {
  g.fillStyle = '#6a4a30'; g.beginPath(); g.moveTo(-62, -4); g.quadraticCurveTo(-30, 12, 32, 0); g.lineTo(54, -24); g.quadraticCurveTo(0, -12, -58, -28); g.closePath(); g.fill();
  for (let i = 0; i < 6; i++) line(g, -56 + i * 4, -22 + i * 3.4, 48 - i * 2, -18 + i * 3.2, '#4a3220', 1.2);
  for (let i = -40; i < 40; i += 14) line(g, i, -22 + (i + 40) * .08, i + 3, 4, 'rgba(30,20,10,.4)', 1.4);
  line(g, -10, -14, 4, -70, '#7a5a3a', 4.5); line(g, 4, -70, 32, -52, '#7a5a3a', 2.2);
  poly(g, [6, -66, 29, -52, 9, -34], '#d8ccb0'); line(g, 8, -60, 22, -50, 'rgba(120,100,70,.5)', 1); poly(g, [18, -48, 29, -52, 22, -40], '#b8aa8c');
  for (let i = 0; i < 9; i++) { const x = (rnd() - .5) * 130, y = (rnd() - .2) * 12; line(g, x - 11, y, x + 11, y - (rnd() - .5) * 6, '#7a5a3a', 3.4); }
  g.strokeStyle = 'rgba(70,80,40,.7)'; g.lineWidth = 1.6; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-50 + i * 30, -2); g.quadraticCurveTo(-46 + i * 30, 4, -40 + i * 30, 2); g.stroke(); }
}
function drawTideRocks(g) { const R = mulberry(7); rockShape(g, -22, 0, 1.4, PAL.rock3, R); rockShape(g, 18, 2, 1.15, PAL.rock1, R); rockShape(g, 2, 5, .8, PAL.rock2, R); for (let i = 0; i < 8; i++) circ(g, -30 + i * 8, -2 - (i % 3) * 3, 1.6, '#3a4a2a'); }
function drawNets(g) {
  drawTideRocks(g);
  line(g, -44, 2, -44, -48, '#6e5038', 3.6); line(g, 44, 2, 44, -48, '#6e5038', 3.6);
  g.strokeStyle = 'rgba(220,210,185,.9)'; g.lineWidth = .9;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-44, -44 + i * 6.5); g.quadraticCurveTo(0, -32 + i * 6.5, 44, -44 + i * 6.5); g.stroke(); }
  for (let i = 0; i <= 10; i++) line(g, -44 + i * 8.8, -44 + Math.sin(i / 10 * 3.14) * 12, -44 + i * 8.8, -12 + Math.sin(i / 10 * 3.14) * 12, 'rgba(220,210,185,.75)', .8);
  for (let i = 0; i < 5; i++) { const x = -34 + i * 17; circ(g, x, -44 + Math.sin((x + 44) / 88 * 3.14) * 12, 2.6, '#c8a66a'); }
  ell(g, 24, 0, 11, 5.5, '#8a6a40'); ell(g, 20, -4, 5, 2.2, '#8aa0a8'); ell(g, 27, -5, 5, 2.2, '#9ab0b8');
}
function drawTerrace(g, rnd) {
  ell(g, 0, -2, 74, 22, 'rgba(110,85,55,.35)');
  for (let i = 0; i < 60; i++) { const x = (rnd() - .5) * 136, y = (rnd() - .5) * 30; g.strokeStyle = PAL.leaf[i % 4]; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (rnd() - .5) * 20, y - 24, x + (rnd() - .5) * 26, y - 12 - rnd() * 16); g.stroke(); }
  for (let i = 0; i < 4; i++) foliage(g, (rnd() - .5) * 110, -8, 12, 7, '#4f7a36', rnd, 8);
  for (let i = 0; i < 8; i++) stoneShape(g, -66 + i * 19, 20, .4);
}
function drawField(g, rnd) {
  ell(g, 0, -2, 76, 23, '#6a4a30'); ell(g, 0, -4, 72, 20, '#7a5a3a');
  for (let r = 0; r < 6; r++) {
    const y = -18 + r * 7.4, w = 68 * Math.sqrt(Math.max(0, 1 - Math.pow((y + 2) / 23, 2)));
    line(g, -w, y + 1, w, y + 1, '#5a3e28', 2.2); line(g, -w, y - .5, w, y - .5, 'rgba(160,120,80,.5)', .8);
    for (let x = -w + 4; x < w; x += 5.5) { const hh = 8 + rnd() * 5; line(g, x, y, x - 1.5, y - hh, '#5a8a36', 1.3); line(g, x, y, x + 2, y - hh * .8, '#6a9a3e', 1.2); if (rnd() < .4) ell(g, x - 1.5, y - hh, 1.3, 2.6, '#c8a646'); }
  }
  for (let i = 0; i < 8; i++) stoneShape(g, -66 + i * 19, 21, .4);
}
function drawTwisted(g) {
  g.strokeStyle = '#a89878'; g.lineWidth = 6; g.beginPath(); g.moveTo(-24, 0); g.bezierCurveTo(-10, -32, 10, 10, 22, -28); g.stroke();
  g.strokeStyle = '#b8a888'; g.lineWidth = 4; g.beginPath(); g.moveTo(-20, -4); g.bezierCurveTo(0, -42, 4, -2, 26, -8); g.stroke();
  g.strokeStyle = 'rgba(80,70,50,.6)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-18, -6); g.bezierCurveTo(-6, -30, 8, 4, 20, -24); g.stroke();
  g.strokeStyle = '#4f7a36'; g.lineWidth = 1.4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-16 + i * 8, -6); g.quadraticCurveTo(-10 + i * 8, -28, -5 + i * 9, -14); g.stroke(); }
}
function drawScarecrow(g) {
  line(g, 0, 0, 0, -60, '#6e5038', 4); line(g, -26, -44, 26, -44, '#6e5038', 3.2);
  poly(g, [-11, -50, 11, -50, 15, -22, -15, -22], '#6a6a5a'); poly(g, [-11, -40, 11, -40, 12, -36, -12, -36], '#8a5a3a');
  for (let i = 0; i < 9; i++) line(g, -13 + i * 3.2, -22, -14 + i * 3.4, -14, '#c8aa5a', 1.2);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) line(g, s * 26, -44, s * (29 + i), -40 + i * 2, '#c8aa5a', 1.2);
  circ(g, 0, -60, 9.5, '#c8b27a'); for (let i = 0; i < 6; i++) line(g, -7 + i * 2.8, -52, -8 + i * 3, -48, '#b8a060', 1);
  poly(g, [-17, -62, 17, -62, 0, -80], '#7a5a34'); line(g, -17, -62, 17, -62, '#5a4024', 2);
  circ(g, -3.5, -61, 1.5, '#2a1e12'); circ(g, 3.5, -61, 1.5, '#2a1e12'); line(g, -3, -56, 3, -56, '#2a1e12', 1);
}
function column(g, x, h, broken) {
  const cg = g.createLinearGradient(x - 7, 0, x + 7, 0); cg.addColorStop(0, '#b8ab94'); cg.addColorStop(.4, '#e0d4bc'); cg.addColorStop(1, '#9a8e78');
  g.fillStyle = cg; g.fillRect(x - 7, -h, 14, h);
  for (let k = -4; k <= 4; k += 4) line(g, x + k, -2, x + k, -h + 3, 'rgba(90,80,65,.35)', .9);
  if (!broken) rrect(g, x - 10, -h - 6, 20, 6, 1.5, '#d8ccb4'); else poly(g, [x - 7, -h, x + 7, -h + 5, x + 2, -h - 3], '#d0c4ac');
}
function drawHallRuin(g, rnd) {
  rrect(g, -64, -7, 128, 8, 2, '#b8ab94');
  poly(g, [-56, -6, -56, -44, -44, -50, -32, -38, -22, -48, -14, -6], '#c8bba2');
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) line(g, -54 + j * 13, -12 - i * 7, -44 + j * 13, -12 - i * 7, 'rgba(90,80,65,.4)', .9);
  column(g, 4, 64, false); column(g, 28, 38, true); column(g, 52, 54, true);
  for (let i = 0; i < 6; i++) stoneShape(g, (rnd() - .5) * 116, 7 + rnd() * 6, .35 + rnd() * .25, '#b8ab94');
  for (let i = 0; i < 16; i++) circ(g, -54 + rnd() * 34, -44 + rnd() * 36, 1.6 + rnd() * 1.4, rnd() < .5 ? '#4f7a36' : '#6a8f40');
  g.strokeStyle = 'rgba(60,50,40,.6)'; g.lineWidth = 1.2; g.beginPath(); g.arc(-35, -25, 5, 0, 6.283); g.stroke(); line(g, -35, -32, -35, -18, 'rgba(60,50,40,.6)', 1.2);
}
function drawSchool(g) {
  rrect(g, -66, -8, 132, 9, 2, '#b8ab94');
  const wg = g.createLinearGradient(-58, 0, 58, 0); wg.addColorStop(0, '#c8bba2'); wg.addColorStop(.4, '#e6dac2'); wg.addColorStop(1, '#b0a38a');
  g.fillStyle = wg; g.fillRect(-58, -50, 116, 43);
  for (const x of [-50, -25, 25, 50]) column(g, x, 43, false);
  g.fillStyle = '#2a1c12'; g.beginPath(); g.moveTo(-11, -8); g.lineTo(-11, -32); g.quadraticCurveTo(0, -42, 11, -32); g.lineTo(11, -8); g.fill();
  g.fillStyle = PAL.thatchLo; g.beginPath(); g.moveTo(-74, -44); g.lineTo(0, -98); g.lineTo(74, -44); g.quadraticCurveTo(0, -38, -74, -44); g.fill();
  g.fillStyle = PAL.thatch; g.beginPath(); g.moveTo(-68, -46); g.lineTo(0, -94); g.lineTo(68, -46); g.quadraticCurveTo(0, -40, -68, -46); g.fill();
  g.strokeStyle = 'rgba(80,55,20,.45)'; g.lineWidth = .8; for (let i = -64; i <= 64; i += 4) { g.beginPath(); g.moveTo(i, -45); g.lineTo(i * .15, -88); g.stroke(); }
  ell(g, 46, -4, 10, 3.2, '#6e5038'); poly(g, [36, -4, 56, -4, 54, -22, 38, -22], '#8a5a3a'); ell(g, 46, -22, 8, 2.6, '#d8ccb0'); for (let i = 0; i < 4; i++) line(g, 38 + i * 5, -20, 40 + i * 5, -6, 'rgba(40,25,15,.5)', .8);
}
function drawDais(g, robe) {
  rrect(g, -30, -13, 60, 13, 2, PAL.stone); rrect(g, -25, -18, 50, 6, 2, PAL.stoneHi);
  g.strokeStyle = 'rgba(50,45,40,.4)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-20, -12); g.lineTo(-14, -2); g.stroke();
  if (robe) { g.fillStyle = '#8a2a2a'; g.beginPath(); g.moveTo(-17, -18); g.quadraticCurveTo(-4, -34, 11, -25); g.quadraticCurveTo(20, -20, 17, -16); g.lineTo(-19, -16); g.fill();
    g.strokeStyle = 'rgba(40,10,10,.5)'; g.lineWidth = .8; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-12 + i * 7, -17); g.quadraticCurveTo(-8 + i * 7, -26, -4 + i * 7, -22); g.stroke(); }
    line(g, -11, -20, 11, -22, '#c8a040', 1.5); circ(g, 13, -29, 3, '#c8a040'); for (let i = 0; i < 3; i++) line(g, 11 + i * 2, -31, 9 + i * 4, -44, ['#3a6a8a', '#8a3a2a', '#5a7a3a'][i], 1.8); }
}
function drawStone(g, rnd, lit) {
  const h = 50 + rnd() * 20, col = lit ? '#9a98a0' : PAL.stone;
  const sg = g.createLinearGradient(-12, 0, 12, 0); sg.addColorStop(0, shade(col, .15)); sg.addColorStop(.5, col); sg.addColorStop(1, shade(col, -.25));
  g.fillStyle = sg; g.beginPath(); g.moveTo(-11, 0); g.quadraticCurveTo(-13, -h * .7, -4, -h); g.quadraticCurveTo(6, -h - 4, 11, -h + 6); g.quadraticCurveTo(13, -h * .5, 12, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(40,36,30,.4)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-5, -h + 6); g.lineTo(-2, -h * .6); g.lineTo(-5, -h * .3); g.stroke();
  g.strokeStyle = lit ? '#7fe0c8' : 'rgba(60,55,48,.7)'; g.lineWidth = 1.5;
  g.beginPath(); for (let a = 0; a < 12; a += .3) g.lineTo(1 + Math.cos(a) * a * .42, -h * .55 + Math.sin(a) * a * .42); g.stroke();
  for (let i = 0; i < 6; i++) circ(g, -9 + rnd() * 6, -2 - rnd() * 12, 1.6 + rnd(), rnd() < .5 ? '#4f7a36' : '#6a8f40');
}
function drawCauldron(g, working) {
  if (working) { line(g, -24, 0, 0, -48, '#6e5038', 3.2); line(g, 24, 0, 0, -48, '#6e5038', 3.2); line(g, 0, -48, 0, -36, '#3a3a3a', 1.4); line(g, -9, -2, 9, -4, '#3a2418', 5); circ(g, 0, -4, 4, '#d8702a'); }
  const y0 = working ? -9 : 0;
  const cg = g.createLinearGradient(-20, 0, 20, 0); cg.addColorStop(0, '#4a4a4c'); cg.addColorStop(.35, '#6a6a6c'); cg.addColorStop(1, '#2a2a2c');
  g.fillStyle = cg; g.beginPath(); g.ellipse(0, y0 - 13, 20, 18, 0, 0, Math.PI); g.lineTo(-20, y0 - 13); g.fill();
  ell(g, 0, y0 - 13, 20, 6, '#3a3a3c'); ell(g, 0, y0 - 13, 16.5, 4.5, working ? '#4a9a6a' : '#141416');
  if (!working) { line(g, 5, y0 - 13, 11, y0 - 2, '#0e0e10', 2); line(g, 11, y0 - 2, 7, y0 + 3, '#0e0e10', 1.6); }
}
function drawOldFoundation(g) {
  ell(g, 0, -2, 60, 17, 'rgba(120,95,65,.4)');
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; if (i % 5 === 3) continue; stoneShape(g, Math.cos(a) * 57, Math.sin(a) * 16, .52, i % 2 ? PAL.stone : PAL.rock1); }
}
function drawMending(g) {
  const wg = g.createLinearGradient(-52, 0, 52, 0); wg.addColorStop(0, '#b89a78'); wg.addColorStop(.4, '#d8c0a0'); wg.addColorStop(1, '#a88a68');
  g.fillStyle = wg; g.fillRect(-52, -42, 104, 42);
  for (let i = -44; i < 48; i += 11) line(g, i, -2, i, -40, 'rgba(90,65,40,.3)', 1.6);
  g.fillStyle = '#2a1c12'; g.beginPath(); g.moveTo(-10, 0); g.lineTo(-10, -24); g.quadraticCurveTo(0, -33, 10, -24); g.lineTo(10, 0); g.fill();
  g.fillStyle = '#1e140c'; g.fillRect(-38, -28, 12, 9);
  g.fillStyle = '#4f6a3a'; g.beginPath(); g.moveTo(-64, -34); g.quadraticCurveTo(0, -108, 64, -34); g.quadraticCurveTo(0, -26, -64, -34); g.fill();
  g.strokeStyle = 'rgba(30,45,20,.5)'; g.lineWidth = .8; for (let i = -60; i <= 60; i += 4) { g.beginPath(); g.moveTo(i, -33); g.lineTo(i * .3, -80); g.stroke(); }
  g.fillStyle = '#8a3a3a'; g.beginPath(); g.moveTo(32, -18); g.bezierCurveTo(24, -24, 28, -32, 32, -27); g.bezierCurveTo(36, -32, 40, -24, 32, -18); g.fill();
  for (let i = 0; i < 4; i++) { const x = -46 + i * 6; line(g, x, -42, x, -30, '#5a7a3a', 1); circ(g, x, -30, 1.8, '#8a9a4a'); }
}
function drawLoom(g) {
  line(g, -24, 0, -20, -48, '#6e5038', 3.6); line(g, 22, 0, 18, -44, '#6e5038', 3.6); line(g, -26, -32, 24, -38, '#6e5038', 2.8);
  for (let i = 0; i < 9; i++) line(g, -18 + i * 4.4, -32, -16 + i * 4.4 + (i % 2) * 2, -4, 'rgba(220,210,190,.85)', .9);
  poly(g, [-15, -16, 7, -18, 9, -7, -13, -5], '#8a3a3a'); poly(g, [-14, -12, 8, -14, 8.5, -10, -13.5, -9], '#c8a040');
  stoneShape(g, 28, 2, .5);
}
function drawLodge(g) {
  const wg = g.createLinearGradient(-48, 0, 48, 0); wg.addColorStop(0, '#9a7650'); wg.addColorStop(.4, '#c09a70'); wg.addColorStop(1, '#8a6a48');
  g.fillStyle = wg; g.fillRect(-48, -40, 96, 40);
  const cols = ['#8a3a3a', '#3a5a7a', '#b8923a', '#5a4a7a', '#4f7a3a'];
  for (let i = 0; i < 5; i++) { g.fillStyle = cols[i]; g.fillRect(-46 + i * 19, -36, 12, 28); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-46 + i * 19, -12, 12, 4); }
  g.fillStyle = PAL.door; g.fillRect(-9, -27, 18, 27);
  g.fillStyle = PAL.thatchLo; g.beginPath(); g.moveTo(-60, -34); g.lineTo(-42, -74); g.lineTo(42, -74); g.lineTo(60, -34); g.quadraticCurveTo(0, -28, -60, -34); g.fill();
  g.fillStyle = PAL.thatch; g.beginPath(); g.moveTo(-54, -37); g.lineTo(-40, -70); g.lineTo(40, -70); g.lineTo(54, -37); g.quadraticCurveTo(0, -31, -54, -37); g.fill();
  g.strokeStyle = 'rgba(80,55,20,.45)'; g.lineWidth = .8; for (let i = -50; i <= 50; i += 4) { g.beginPath(); g.moveTo(i, -36); g.lineTo(i * .78, -70); g.stroke(); }
}
function drawDune(g, dug) {
  g.fillStyle = '#d8c08a'; g.beginPath(); g.ellipse(0, -4, 36, 13, 0, Math.PI, 0); g.lineTo(36, 0); g.quadraticCurveTo(0, 6, -36, 0); g.fill();
  g.fillStyle = '#ead6a4'; g.beginPath(); g.ellipse(-7, -8, 21, 7, 0, Math.PI, 0); g.fill();
  g.strokeStyle = 'rgba(160,130,80,.5)'; g.lineWidth = .8; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-4, 6 + i * 4, 20 + i * 5, 3.6, 5.8); g.stroke(); }
  if (dug) { ell(g, 0, -2, 17, 5.5, '#b89a60'); ell(g, 0, -1, 13, 4, '#8a6e40'); }
  for (let i = 0; i < 6; i++) line(g, -27 + i * 11, -2, -25 + i * 11 + (i % 2 ? 3 : -3), -15 - (i % 2) * 5, '#8a9a4a', 1.2);
}
function drawPlinth(g) {
  rrect(g, -36, -17, 72, 17, 2, PAL.stone); rrect(g, -30, -24, 60, 8, 2, PAL.stoneHi);
  rrect(g, -22, -38, 8, 15, 2, PAL.stoneLo); rrect(g, 14, -38, 8, 15, 2, PAL.stoneLo);
  g.strokeStyle = 'rgba(50,45,40,.6)'; g.lineWidth = 1.3; g.beginPath(); g.arc(0, -9, 5, 0, 6.283); g.stroke();
  for (let i = 0; i < 6; i++) circ(g, -34 + i * 3, -2, 1.8, '#4f7a36');
}
function drawBelfry(g) {
  drawPlinth(g);
  line(g, -28, -22, -26, -124, '#6e5038', 7); line(g, 28, -22, 26, -124, '#6e5038', 7);
  line(g, -36, -122, 36, -122, '#5a4030', 8); poly(g, [-44, -124, 44, -124, 32, -138, -32, -138], PAL.thatch);
  line(g, 0, -118, 0, -108, '#3a3a3a', 2.2);
  const bg2 = g.createLinearGradient(-22, 0, 22, 0); bg2.addColorStop(0, '#8a6428'); bg2.addColorStop(.35, '#d8a84a'); bg2.addColorStop(1, '#6a4a1a');
  g.fillStyle = bg2; g.beginPath(); g.moveTo(-11, -108); g.quadraticCurveTo(-13, -84, -22, -68); g.lineTo(22, -68); g.quadraticCurveTo(13, -84, 11, -108); g.quadraticCurveTo(0, -112, -11, -108); g.fill();
  ell(g, 0, -68, 22, 4, '#7a5220'); circ(g, 0, -63, 3.6, '#5a3a1a');
  g.fillStyle = 'rgba(60,110,90,.35)'; g.beginPath(); g.ellipse(8, -80, 5, 9, .3, 0, 6.283); g.fill();
}
function drawGlowcap(g, rnd) {
  for (let i = 0; i < 3; i++) { const x = (i - 1) * 7, h = 8 + rnd() * 6; rrect(g, x - 1.5, -h, 3, h, 1.4, '#e8e0cc'); ell(g, x, -h, 5.4 - i % 2, 3.4, '#5fd0d8'); ell(g, x - 1.5, -h - 1.2, 2, 1, '#c8f6f8'); }
}
function drawHerb(g, col) {
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .4; line(g, 0, 0, Math.cos(a) * 11, Math.sin(a) * 13, '#4f7a36', 1.8); ell(g, Math.cos(a) * 11, Math.sin(a) * 13, 2.4, 1.3, '#5f8a3e'); }
  for (let i = 0; i < 3; i++) { const x = (i - 1) * 6.5, y = -13 - (i % 2) * 4; flower(g, x, y, 2, col); }
}
function drawCurioMound(g) { ell(g, 0, -1, 8, 3, '#8a6e48'); circ(g, 0, -3.5, 3, '#e8e0cc'); circ(g, -1, -4.5, 1, '#fff'); }

const SPR = {};
function buildSprites() {
  const R = mulberry(4242);
  const S_ = (w, h, fn, ay, sh) => sprite(w, h, fn, ay, { sh });
  SPR.palm = [0, 1, 2, 3].map(() => S_(160, 186, g => drawPalm(g, R), undefined, [30, 8]));
  SPR.broad = ['green', 'green', 'fruit', 'dark', 'olive', 'dark', 'green', 'blossom', 'green', 'gold'].map(k => S_(120, 136, g => drawTree(g, R, k), undefined, [40, 10]));
  SPR.spire = [0, 1, 2].map(() => S_(64, 170, g => drawSpire(g, R), undefined, [22, 6]));
  SPR.bush = [S_(68, 44, g => drawBush(g, R, 0), undefined, [30, 7]), S_(68, 44, g => drawBush(g, R, 6), undefined, [30, 7]), S_(68, 44, g => drawBush(g, R, 0, '#5a8a3a', '#e8e2d0'), undefined, [30, 7]), S_(68, 44, g => drawBush(g, R, 0, '#46773a'), undefined, [30, 7])];
  SPR.rock = [S_(40, 30, g => drawRock(g, R, false), undefined, [18, 4]), S_(80, 40, g => drawRock(g, R, true), undefined, [38, 7])];
  SPR.fern = [0, 1].map(() => sprite(48, 32, g => drawFern(g, R), 28, { flat: true }));
  SPR.flowers = [0, 1, 2].map(() => sprite(40, 24, g => drawFlowers(g, R), 20, { flat: true }));
  SPR.mushroom = [0, 1].map(() => S_(36, 24, g => drawMushroom(g, R), 20, [12, 3]));
  SPR.star = [sprite(22, 14, g => drawStarfishAt(g, 0, -4), 10, { flat: true })];
  SPR.drift = [S_(56, 20, drawDriftwood, 14, [24, 3])];
  SPR.cave = sprite(250, 170, g => drawCave(g, R), 160, { flat: true });
  SPR.boulder = [[150, 96], [120, 80], [96, 64], [80, 52], [60, 40], [44, 30]].map(([w, h]) => sprite(w + 16, h + 20, g => drawBoulder(g, R, w, h), h + 12, { sh: [w * .55, h * .16] }));
  SPR.deadTree = [0, 1, 2, 3].map(() => S_(120, 150, g => drawDeadTree(g, R), undefined, [26, 7]));
  SPR.stump = [S_(40, 30, g => drawStump(g, R), undefined, [16, 4])];
  SPR.bones = [sprite(70, 26, drawBones, 20, { flat: true })];
  SPR.totem = [S_(44, 86, drawTotem, undefined, [12, 4])];
  SPR.cattail = [0, 1].map(() => sprite(44, 50, g => drawCattails(g, R), 46, { flat: true }));
  SPR.thorns = [0, 1].map(() => sprite(66, 44, g => drawThorns(g, R), 40, { flat: true }));
  SPR.ruinHut = [S_(90, 72, g => drawRuinHut(g, R), 66, [36, 8])];
  SPR.bramble = [0, 7, 22].map(b => S_(100, 66, g => { g.scale(1.5, 1.4); drawBush(g, R, b, '#46773a'); }, undefined, [44, 10]));
  SPR.hut = S_(100, 106, drawHut, undefined, [46, 12]); SPR.hutFound = sprite(84, 34, g => drawFoundation(g, 32), 24); SPR.hutFrame = S_(84, 90, drawHutFrame, undefined, [36, 10]);
  SPR.larder = [0, 1, 2, 3].map(l => S_(76, 52, g => drawLarder(g, l), undefined, [34, 8]));
  SPR.study = S_(80, 52, drawStudy, undefined, [40, 9]);
  SPR.hearth = [0, 1, 2, 3].map(s => S_(64, 32, g => drawHearth(g, s), 24, [30, 8]));
  SPR.woodpile = S_(76, 44, drawWoodpile, undefined, [32, 7]); SPR.reeds = S_(52, 50, g => drawReeds(g, R), undefined, [22, 5]);
  SPR.torches = [S_(54, 50, g => drawTorches(g, false), undefined, [20, 5]), S_(54, 50, g => drawTorches(g, true), undefined, [20, 5])];
  SPR.hive = S_(120, 136, g => drawHiveTree(g, R), undefined, [40, 10]);
  SPR.springrocks = S_(90, 46, g => drawSpringRocks(g, R), undefined, [42, 9]); SPR.spring = sprite(96, 50, drawSpring, 34);
  SPR.wreck = S_(160, 86, g => drawWreck(g, R), 68, [72, 12]); SPR.tiderocks = S_(84, 32, drawTideRocks, undefined, [38, 8]); SPR.nets = S_(104, 64, drawNets, undefined, [42, 8]);
  SPR.terrace = sprite(156, 62, g => drawTerrace(g, R), 38); SPR.field = sprite(160, 62, g => drawField(g, R), 38);
  SPR.twisted = S_(60, 46, drawTwisted, undefined, [26, 6]); SPR.scarecrow = S_(60, 90, drawScarecrow, undefined, [18, 5]);
  SPR.hall = S_(144, 84, g => drawHallRuin(g, R), 72, [72, 14]); SPR.school = S_(156, 108, drawSchool, 98, [74, 14]);
  SPR.dais = [S_(66, 52, g => drawDais(g, true), 42, [32, 8]), S_(66, 32, g => drawDais(g, false), 24, [32, 8])];
  SPR.stone = [0, 1, 2, 3, 4].map(() => S_(34, 78, g => drawStone(g, R, false), undefined, [16, 4]));
  SPR.stoneLit = [0, 1, 2, 3, 4].map(() => S_(34, 78, g => drawStone(g, R, true), undefined, [16, 4]));
  SPR.cauldron = [S_(48, 36, g => drawCauldron(g, false), undefined, [24, 6]), S_(56, 58, g => drawCauldron(g, true), undefined, [28, 7])];
  SPR.oldFound = sprite(128, 46, drawOldFoundation, 28); SPR.mending = S_(132, 112, drawMending, 102, [62, 14]);
  SPR.loom = S_(66, 54, drawLoom, undefined, [30, 7]); SPR.lodge = S_(124, 84, drawLodge, 76, [58, 13]);
  SPR.dune = [sprite(78, 26, g => drawDune(g, false), 20), sprite(78, 26, g => drawDune(g, true), 20)];
  SPR.plinth = S_(78, 44, drawPlinth, 38, [38, 9]); SPR.belfry = S_(92, 146, drawBelfry, 140, [42, 10]);
  SPR.glowcap = S_(24, 22, g => drawGlowcap(g, R), 20);
  SPR.herb = {}; for (const h of HERBS) SPR.herb[h.id] = S_(26, 26, g => drawHerb(g, h.c), 22);
  SPR.curio = S_(20, 12, drawCurioMound, 9);
}

/* ================= CURIO ICONS (collection) ================= */
function curioIcon(idx, size) {
  const set = Math.floor(idx / 6), i = idx % 6, col = CURIO_SETS[set].cols[i];
  const c = document.createElement('canvas'); c.width = c.height = size * 2; const g = c.getContext('2d'); g.scale(size / 20, size / 20); g.translate(20, 22); g.lineCap = 'round';
  const dk = shade(col, -.35);
  if (set === 0) {
    if (i === 0) { g.fillStyle = col; g.beginPath(); for (let a = 0; a < 12; a += .2) { const r = 1 + a * 1.2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * .8); } g.fill(); g.strokeStyle = dk; g.lineWidth = 1; g.stroke(); }
    else if (i === 4) { g.fillStyle = col; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28 - 1.57, r = k % 2 ? 5 : 13; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); circ(g, 0, 0, 2, dk); }
    else if (i === 5) { circ(g, 0, 0, 9, col); circ(g, -3, -3, 3, '#ffffff'); g.strokeStyle = '#c8c0b0'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 9, 0, 6.28); g.stroke(); }
    else if (i === 2) { circ(g, 0, 0, 12, col); g.strokeStyle = dk; g.lineWidth = 1.2; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 - 1.57; g.beginPath(); g.ellipse(Math.cos(a) * 5, Math.sin(a) * 5, 1.5, 4, a + 1.57, 0, 6.28); g.stroke(); } }
    else { g.fillStyle = col; g.beginPath(); g.moveTo(0, 10); for (let a = -2.6; a <= -.5; a += .15) g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13 + 2); g.closePath(); g.fill(); for (let k = 0; k < 6; k++) line(g, 0, 10, Math.cos(-2.5 + k * .38) * 12, Math.sin(-2.5 + k * .38) * 12 + 2, dk, 1); }
  } else if (set === 1) {
    g.rotate(-.6); g.fillStyle = col; g.beginPath(); g.moveTo(0, 14); g.quadraticCurveTo(-9, 0, 0, -16); g.quadraticCurveTo(9, 0, 0, 14); g.fill();
    line(g, 0, 16, 0, -14, dk, 1.2); for (let k = 0; k < 5; k++) { line(g, 0, -8 + k * 4, -6, -11 + k * 4, dk, .6); line(g, 0, -8 + k * 4, 6, -11 + k * 4, dk, .6); }
  } else if (set === 2) {
    const pts = [[-10, 4], [-6, -8], [4, -11], [11, -2], [7, 9], [-4, 10]];
    g.fillStyle = col; g.beginPath(); pts.forEach(p => g.lineTo(p[0], p[1])); g.fill();
    g.fillStyle = shade(col, .35); g.beginPath(); g.moveTo(-6, -8); g.lineTo(4, -11); g.lineTo(0, -2); g.fill();
    g.strokeStyle = dk; g.lineWidth = 1; g.beginPath(); pts.forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.stroke();
  } else if (set === 3) {
    if (i === 0) { circ(g, 0, 0, 8, col); circ(g, 0, 0, 2.5, '#2a1a10'); }
    else if (i === 1) { g.rotate(-.6); g.fillStyle = col; g.fillRect(-3, -14, 6, 28); for (let k = 0; k < 4; k++) circ(g, 0, -8 + k * 5, 1.2, dk); }
    else if (i === 2) { g.fillStyle = col; g.beginPath(); g.moveTo(-4, -12); g.quadraticCurveTo(8, -4, 2, 13); g.quadraticCurveTo(-6, 0, -4, -12); g.fill(); line(g, -1, -4, 2, 4, dk, 1); }
    else if (i === 3) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 9, 0, 6.28); g.stroke(); circ(g, 0, -9, 3, '#3fae8a'); }
    else if (i === 4) { g.fillStyle = col; g.beginPath(); g.moveTo(-11, -10); g.lineTo(10, -12); g.lineTo(8, 4); g.lineTo(-2, 12); g.lineTo(-10, 2); g.fill(); circ(g, -4, -4, 2.4, '#2a1a10'); circ(g, 4, -5, 2.4, '#2a1a10'); line(g, -6, 4, 4, 3, '#e8b64c', 1.4); }
    else { g.fillStyle = col; g.fillRect(-10, -12, 20, 24); g.strokeStyle = '#e9dcc0'; g.lineWidth = 1.2; g.beginPath(); g.arc(-3, -5, 3, 0, 6.28); g.stroke(); line(g, 3, -8, 6, -2, '#e9dcc0', 1.2); line(g, -6, 4, 6, 6, '#e9dcc0', 1.2); }
  } else {
    if (i === 0) { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.ellipse(-4, 0, 6, 4, .5, 0, 6.28); g.stroke(); g.beginPath(); g.ellipse(4, 0, 6, 4, -.5, 0, 6.28); g.stroke(); }
    else if (i === 1) { ell(g, 0, 0, 11, 8, col); circ(g, -3, -1, 2.5, '#f0d060'); circ(g, 4, 2, 2, '#e0664e'); }
    else if (i === 2) { for (let k = 0; k < 4; k++) { const a = k / 4 * 3.14; line(g, Math.cos(a) * -12, Math.sin(a) * -12, Math.cos(a) * 12, Math.sin(a) * 12, col, 2.4); } }
    else if (i === 3) { g.fillStyle = col; g.beginPath(); g.ellipse(-2, 0, 10, 5, 0, 0, 6.28); g.fill(); g.beginPath(); g.moveTo(7, 0); g.lineTo(14, -6); g.lineTo(14, 6); g.fill(); circ(g, -8, -1, 1.2, '#2a1a10'); }
    else if (i === 4) { poly(g, [-8, -8, 8, -8, 7, 8, -7, 8], col); ell(g, 0, -8, 8, 2.6, '#eadcc0'); line(g, -8, -2, 8, 4, dk, 1); }
    else { g.rotate(-.5); g.fillStyle = col; g.fillRect(-2.5, -14, 5, 28); for (let k = 0; k < 3; k++) circ(g, 0, -6 + k * 6, 1.2, dk); }
  }
  return c;
}
