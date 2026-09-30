'use strict';
/* ================= STATE ================= */
let S = null;
let OFFLINE = false, OFF_LOG = [];
const DRAG = { v: null };
const HOOK = { toast() {}, big() {}, refresh() {}, star() {}, finale() {}, closeCard() {}, trophy() {} };
const rnd = Math.random, rr = (a, b) => a + rnd() * (b - a), pick = a => a[Math.floor(rnd() * a.length)];
const NOUN = { forage: 'Forager', build: 'Builder', research: 'Scholar', heal: 'Healer', parent: 'Parent' };

function genName() { const n = pick(SYL_A) + pick(SYL_B) + (rnd() < .3 ? pick(SYL_C) : ''); return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase(); }
function lifeBonus() { return (S.tech.spirit >= 3 ? 6 : 0) + (S.myst.m12 ? 4 : 0); }
function newV(o) {
  const sex = o.sex || (rnd() < .5 ? 'm' : 'f');
  const look = o.look || { skin: pick(SKINS), hair: pick(HAIRS), hs: Math.floor(rnd() * 6), out: 0 };
  return {
    id: S.nextId++, name: o.name || genName(), sex, born: o.born ?? S.t,
    x: o.x, z: o.z, tx: o.x, tz: o.z, st: 'idle', timer: rr(.5, 2), face: rnd() < .5 ? 1 : -1, walkPh: 0,
    job: null, src: null, sk: { forage: 0, build: 0, research: 0, heal: 0, parent: 0 },
    hunger: rr(0, 25), health: 100, sick: false, carry: null, task: null, emote: null, emoteT: 0,
    par: o.par || [], mom: o.mom || 0, gen: o.gen || 1, life: rr(66, 82) + lifeBonus(),
    preg: 0, pregDad: 0, twins: false, mateCD: 0, conf: 0, buff: {}, f: { child: (o.born ?? S.t) > S.t - 14 * YEAR ? 1 : 0 }, look, chief: false
  };
}
function newGame() {
  S = {
    ver: 3, t: 0, food: 150, lore: 0, tech: { harvest: 1, remedy: 1, kinship: 1, craft: 1, lore: 1, spirit: 1 },
    vill: [], nextId: 1, projects: [], myst: {}, fire: { wood: false, grass: false, lit: false, fuel: 0 },
    ms: { dancers: [], chiefDance: 0, diggers: [], digT: 0, scare: 0, destiny: 0 }, bramble: 1500, hive: 800,
    cauldron: [], recipes: {}, curios: {}, items: [], itemId: 1, ach: {}, log: [],
    weather: { k: 'clear', until: YEAR * .25 }, nextEvent: YEAR * .7, speed: 1, savedAt: Date.now(), created: Date.now(),
    buff: { stone: 0 }, chief: 0, spawnT: { g: 5, c: 20, h: 10 }, days: [], settings: { low: false }, intro: false,
    stats: { births: 0, twins: 0, deaths: 0, cures: 0, foodT: 0, loreT: 0, glow: 0, curioPick: 0, dupes: 0, brews: 0, murky: 0, herbs: 0,
      drops: 0, pairDrops: 0, renames: 0, cards: 0, refuels: 0, fish: 0, honey: 0, crop: 0, projects: 0, huts: 0, outfits: 0, stars: 0,
      rainSeen: 0, fogSeen: 0, stormSeen: 0, rainbow: 0, stranger: 0, splash: 0, pickups: 0, persist: 0, wardens: 0, comeOfAge: 0,
      starved: 0, lastStarve: 0, birthTimes: [], maxKids: 0, kids: {}, fast: 0, awayMax: 0, youth: 0, schooled: 0, brambleEmpty: 0, food1: 0, lore1: 0, night: 0, dawn: 0, maxAge: 0, maxGen: 1 }
  };
  const ppl = [['m', 24], ['f', 22], ['m', 31], ['f', 27], ['f', 19]];
  ppl.forEach(([sex, age], i) => S.vill.push(newV({ sex, born: -age * YEAR, x: SITE.hearth.x - 60 + i * 30, z: SITE.hearth.z + 50 + (i % 2) * 26 })));
  S.ms.destiny = pick(S.vill).id;
  syncProjects(true);
}

/* ================= HELPERS ================= */
function vById(id) { for (const v of S.vill) if (v.id === id) return v; return null; }
function ageOf(v) { return (S.t - v.born) / YEAR; }
function stage(v) { const a = ageOf(v); return a < 2 ? 'infant' : a < 14 ? 'child' : a < 60 ? 'adult' : 'elder'; }
function grown(v) { const s = stage(v); return s === 'adult' || s === 'elder'; }
function rank(v, k) { return rankOf(v.sk[k]); }
function hutsBuilt() { return 1 + S.projects.filter(p => p.kind === 'hut' && p.done).length; }
function setsDone() { let n = 0; for (let s = 0; s < 5; s++) { let ok = true; for (let i = 0; i < 6; i++) if (!S.curios[s * 6 + i]) ok = false; if (ok) n++; } return n; }
function popCap() { return 4 + 4 * hutsBuilt() + 2 * setsDone() + (S.myst.m12 ? 2 : 0) + (S.myst.m13 ? 2 : 0); }
function pendingBirths() { let n = 0; for (const v of S.vill) if (v.preg) n += v.twins ? 2 : 1; return n; }
function chiefAlive() { return S.chief && vById(S.chief); }
function msg(text, kind) {
  S.log.unshift({ t: S.t, d: Date.now(), text, kind: kind || 'info' });
  if (S.log.length > 80) S.log.length = 80;
  if (OFFLINE) OFF_LOG.push(text); else HOOK.toast(text, kind);
}
function addFood(n) { S.food += n; S.stats.foodT += n; S.stats.food1 = 1; }
function addLore(n) { S.lore += n; S.stats.loreT += n; S.stats.lore1 = 1; }
function emote(v, e, t) { v.emote = e; v.emoteT = t || 3; }
function gain(v, k, amt) {
  const before = rank(v, k);
  v.sk[k] += amt * [1, 1.35, 1.75][S.tech.lore - 1];
  const after = rank(v, k);
  if (after > before) msg(`${v.name} is now a ${RANKS[after]} ${NOUN[k]}.`, 'good');
}
function walkTo(v, x, z) { v.tx = x; v.tz = z; v.st = 'walk'; }
function near(s, sx, zmin, zmax) { return [s.x + rr(-sx, sx), s.z + rr(zmin ?? 14, zmax ?? 30)]; }
function work(v, d) { v.st = 'work'; v.timer = d; }
function idle(v, d) { v.st = 'idle'; v.timer = d; }
function wander(v, r, d, slow, around) {
  const c = around || SITE.hearth; r *= 1.35;
  for (let i = 0; i < 10; i++) {
    const x = c.x + rr(-r, r), z = c.z + rr(-r, r) * .75;
    if (isPlayable(x, z)) { v.task = null; walkTo(v, x, z); v.slow = !!slow; v.nextIdle = d; return; }
  }
  idle(v, d);
}
function moveSpeed(v, stg) {
  let s = stg === 'child' ? 70 : stg === 'elder' ? 46 : 66;
  if (v.sick) s = 22; if (v.slow) s *= .6;
  if (v.buff.quick > S.t) s *= 1.6;
  return s;
}
function workMult(v) {
  const T = v.task; let k = T && ({ forage: 'forage', build: 'build', repair: 'build', research: 'research', heal: 'heal', school: 'research' })[T.type];
  let m = 1 + (k ? rank(v, k) * .15 : 0);
  if (stage(v) === 'elder') m *= .85;
  if (chiefAlive()) m *= 1.1;
  if (v.buff.quick > S.t) m *= 2;
  return m;
}
function sickRate(v, stg) {
  let r = .16 / YEAR * [1, .6, .3][S.tech.remedy - 1];
  if (S.myst.m1) r *= .6; if (stg === 'elder') r *= 1.6; if (stg === 'child') r *= .8;
  return r;
}

/* ================= PROJECTS ================= */
const PROJ = {
  hut: { need: 110, n: 'Hut' }, spring: { need: 90, site: 'springrocks', n: 'Sweetwater Spring', m: 'm1' },
  shore: { need: 200, site: 'wreck', n: 'Shore Clearing', m: 'm4' }, field: { need: 150, site: 'terrace', n: 'Terrace', m: 'm6' },
  mending: { need: 260, site: 'mending', n: 'House of Mending', m: 'm12' }, lodge: { need: 200, site: 'lodge', n: "Weaver's Lodge", m: 'm13' },
  belfry: { need: 320, site: 'belfry', n: 'Belfry', m: 'm16' }
};
function projBySite(sid) { return S.projects.find(p => p.site === sid); }
function syncProjects(quiet) {
  const n = HUTS_BY_CRAFT[S.tech.craft - 1]; let added = 0;
  for (let i = 1; i <= n; i++) {
    const id = 'hut' + i;
    if (!S.projects.find(p => p.site === id)) { const h = HUT_SITES[i]; S.projects.push({ id, site: id, kind: 'hut', x: h.x, z: h.z, need: PROJ.hut.need, prog: 0, done: false }); added++; }
  }
  if (added && !quiet) msg(`${added} new hut site${added > 1 ? 's are' : ' is'} ready. Drag builders onto them.`, 'good');
}
function startProject(kind) {
  const d = PROJ[kind], s = SITE[d.site];
  let p = projBySite(d.site);
  if (!p) { p = { id: kind, site: d.site, kind, x: s.x, z: s.z, need: d.need, prog: 0, done: false }; S.projects.push(p); msg(`Work can begin on the ${d.n}. Drag builders here.`, 'good'); }
  return p;
}
function pickProject(v) {
  let best = null, bs = 1e9;
  for (const p of S.projects) {
    if (p.done) continue;
    const workers = S.vill.filter(u => u !== v && u.task && u.task.type === 'build' && u.task.pid === p.id).length;
    const sc = workers * 400 + Math.hypot(p.x - v.x, p.z - v.z) + (v.task && v.task.pref === p.id ? -2000 : 0) + (v.pref === p.id ? -1500 : 0);
    if (sc < bs) { bs = sc; best = p; }
  }
  return best;
}
function completeProject(p) {
  p.done = true; S.stats.projects++;
  if (p.kind === 'hut') { S.stats.huts++; msg(`A new hut is finished! Room for ${popCap()} villagers now.`, 'good'); }
  else solveM(PROJ[p.kind].m);
  for (const v of S.vill) if (v.task && v.task.type === 'build' && v.task.pid === p.id) { v.task = null; if (v.st === 'work') idle(v, .5); }
  for (const v of S.vill) if (v.pref === p.id) v.pref = null;
}

/* ================= MYSTERIES ================= */
function solveM(id) {
  if (S.myst[id]) return;
  S.myst[id] = S.t;
  const m = MYSTM[id];
  msg(`Mystery solved: ${m.n}. ${m.done}`, 'myst');
  if (!OFFLINE) HOOK.big(m);
  if (id === 'm12') for (const v of S.vill) v.life += 4;
  if (id === 'm16' && !OFFLINE) setTimeout(() => HOOK.finale(), 2600);
  HOOK.refresh();
}

/* ================= FOOD SOURCES ================= */
function srcOK(src) {
  if (src === 'bramble') return S.bramble >= 5;
  if (src === 'hive') return !!S.myst.m3 && S.hive >= 5;
  if (src === 'field') return !!S.myst.m6;
  if (src === 'nets') return !!S.myst.m5;
  return false;
}
function bestSource(pref) {
  if (pref && srcOK(pref)) return pref;
  for (const s of ['nets', 'field', 'hive', 'bramble']) if (srcOK(s)) return s;
  return null;
}
const SRC_SITE = { bramble: 'bramble', hive: 'hive', field: 'terrace', nets: 'nets' };
function foodYield(v, src) {
  let y = { bramble: 4, hive: 6, field: 7, nets: 9 }[src] * RANK_YIELD[rank(v, 'forage')];
  if (S.tech.harvest >= 2) y *= 1.2; if (S.tech.harvest >= 3) y *= 1.25;
  if (src === 'field' && S.myst.m7) y *= 1.5;
  if (stage(v) === 'elder') y *= .85;
  return Math.max(1, Math.round(y));
}

/* ================= HEALTH ================= */
function makeSick(v) { if (v.sick || stage(v) === 'infant') return; v.sick = true; msg(`${v.name} has fallen ill. Drag someone onto them to help.`, 'bad'); }
function cure(v, healer) {
  v.sick = false; v.health = Math.max(v.health, 60);
  if (healer) { S.stats.cures++; msg(`${healer.name} nursed ${v.name} back to health.`, 'good'); }
  else msg(`${v.name} recovered on their own.`);
}
function findSick(h) {
  let best = null, bd = 1e9;
  for (const v of S.vill) { if (v === h || !v.sick || v === DRAG.v) continue; const d = Math.hypot(v.x - h.x, v.z - h.z); if (d < bd) { bd = d; best = v; } }
  return best;
}
function startHeal(h, t, manual) { h.task = { type: 'heal', tid: t.id, manual: !!manual, tries: 0 }; walkTo(h, t.x + (h.x < t.x ? -14 : 14), t.z + 2); }
function attemptHeal(h, t, manual) {
  if (!t || !t.sick) return;
  const ch = S.myst.m12 ? 1 : [.3, .5, .72, .9][rank(h, 'heal')] + [0, .08, .18][S.tech.remedy - 1];
  const ok = rnd() < ch;
  gain(h, 'heal', ok ? 3 : 1.5);
  if (ok) cure(t, h); else if (manual) msg(`${h.name} tried to help ${t.name}, but it didn't work yet. Try again!`);
}

/* ================= FAMILY ================= */
function related(a, b) { return a.par.includes(b.id) || b.par.includes(a.id) || (a.par.length > 0 && a.par.some(p => p && b.par.includes(p))); }
function pairProblem(a, b) {
  if (a.sex === b.sex) return 'same';
  if (!grown(a) || !grown(b)) return 'young';
  const f = a.sex === 'f' ? a : b;
  if (ageOf(f) > 52) return 'old';
  if (related(a, b)) return 'related';
  if (f.preg) return 'preg';
  if (a.sick || b.sick) return 'sick';
  if (a.hunger > 80 || b.hunger > 80) return 'hungry';
  if (a.chief || b.chief) { /* the Warden may still have a family */ }
  if (S.vill.length + pendingBirths() >= popCap()) return 'room';
  return '';
}
const PAIR_TXT = {
  young: 'is too young for a family.', old: 'can no longer have children.', related: 'are family already.',
  preg: 'is already expecting.', sick: 'is not feeling well enough.', hungry: 'is too hungry to think about that.',
  room: 'There is no room for a baby. Build more huts first.'
};
function nearestHut(x, z) {
  let best = HUT_SITES[0], bd = 1e9;
  const list = [HUT_SITES[0], ...S.projects.filter(p => p.kind === 'hut' && p.done)];
  for (const h of list) { const d = Math.hypot(h.x - x, h.z - z); if (d < bd) { bd = d; best = h; } }
  return best;
}
function tryMate(a, b, auto) {
  const r = pairProblem(a, b);
  if (r) {
    if (!auto && r !== 'same') {
      if (r === 'room') msg(PAIR_TXT.room, 'bad');
      else if (r === 'related') msg(`${a.name} and ${b.name} ${PAIR_TXT.related}`);
      else { const who = r === 'young' ? (grown(a) ? b : a) : r === 'old' || r === 'preg' ? (a.sex === 'f' ? a : b) : r === 'sick' ? (a.sick ? a : b) : (a.hunger > 80 ? a : b); msg(`${who.name} ${PAIR_TXT[r]}`); }
    }
    return false;
  }
  const h = nearestHut((a.x + b.x) / 2, (a.z + b.z) / 2);
  a.task = { type: 'mate', pid: b.id, hx: h.x, hz: h.z + 22, lead: a.sex === 'f', manual: !auto };
  b.task = { type: 'mate', pid: a.id, hx: h.x, hz: h.z + 22, lead: b.sex === 'f', manual: !auto };
  walkTo(a, h.x - 8, h.z + 22); walkTo(b, h.x + 8, h.z + 22);
  a.mateCD = b.mateCD = S.t + YEAR * .3;
  emote(a, 'heart', 3); emote(b, 'heart', 3);
  return true;
}
function resolveMate(f, m, manual) {
  if (f.sex !== 'f') [f, m] = [m, f];
  gain(f, 'parent', 4); gain(m, 'parent', 4);
  if (S.vill.length + pendingBirths() >= popCap()) { if (manual) msg(PAIR_TXT.room, 'bad'); return; }
  let ch = .3 + [0, .15, .3][S.tech.kinship - 1] + (rank(f, 'parent') + rank(m, 'parent')) * .06;
  if (f.buff.cordial || m.buff.cordial) { ch = 1; f.buff.cordial = 0; m.buff.cordial = 0; }
  if (rnd() < ch) {
    f.preg = S.t + YEAR * (S.tech.kinship >= 3 ? .14 : .22); f.pregDad = m.id;
    f.twins = rnd() < (S.tech.kinship >= 3 ? .1 : .03) && S.vill.length + 2 <= popCap();
    msg(`${f.name} and ${m.name} are expecting a baby!`, 'good');
  } else if (manual) msg(`${f.name} and ${m.name} spent time together, but no baby this time.`);
}
function birth(f) {
  const dad = vById(f.pregDad) || null;
  const n = f.twins ? 2 : 1; f.preg = 0; f.twins = false;
  for (let i = 0; i < n; i++) {
    const src = rnd() < .5 || !dad ? f : dad, src2 = rnd() < .5 || !dad ? f : dad;
    const look = { skin: rnd() < .15 ? pick(SKINS) : src.look.skin, hair: rnd() < .2 ? pick(HAIRS) : src2.look.hair, hs: Math.floor(rnd() * 6), out: 0 };
    const b = newV({ born: S.t, x: f.x, z: f.z, par: [f.id, f.pregDad], mom: f.id, gen: Math.max(f.gen, dad ? dad.gen : 1) + 1, look });
    b.f.child = 1; b.hunger = 0;
    if (S.myst.m8) { const k = pick(SKILLS); b.sk[k] = RANK_XP[1]; S.stats.schooled++; }
    S.vill.push(b);
    S.stats.births++; S.stats.birthTimes.push(S.t); if (S.stats.birthTimes.length > 6) S.stats.birthTimes.shift();
    for (const p of [f.id, f.pregDad]) if (p) { S.stats.kids[p] = (S.stats.kids[p] || 0) + 1; S.stats.maxKids = Math.max(S.stats.maxKids, S.stats.kids[p]); }
    S.stats.maxGen = Math.max(S.stats.maxGen, b.gen);
    msg(`A baby ${b.sex === 'm' ? 'boy' : 'girl'} named ${b.name} was born to ${f.name}${dad ? ' and ' + dad.name : ''}!`, 'good');
  }
  if (n === 2) { S.stats.twins++; msg('Twins!', 'good'); }
  gain(f, 'parent', 3); if (dad) gain(dad, 'parent', 2);
}
function die(v, cause) {
  if (v.dead) return;
  v.dead = true; S.stats.deaths++;
  msg(`${v.name} passed away from ${cause} at age ${Math.floor(ageOf(v))}.`, 'bad');
  if (v.chief) { S.chief = 0; v.chief = false; msg('The Warden is gone. Someone new must try on the mantle at the Stone Dais.', 'bad'); }
  removeFromGroups(v);
  for (const u of S.vill) if (u.mom === v.id) u.mom = 0;
  if (DRAG.v === v) DRAG.v = null;
  HOOK.closeCard(v);
}
function removeFromGroups(v) {
  S.ms.dancers = S.ms.dancers.filter(id => id !== v.id);
  if (S.ms.chiefDance === v.id) S.ms.chiefDance = 0;
  S.ms.diggers = S.ms.diggers.filter(id => id !== v.id);
  if (S.ms.diggers.length < 3) S.ms.digT = 0;
  if (v.st === 'dance' || v.st === 'dig') v.st = 'idle';
}
function ensureDestiny() {
  if (S.chief) return;
  const d = vById(S.ms.destiny);
  if (!d || !grown(d)) { const c = S.vill.filter(v => grown(v)); S.ms.destiny = c.length ? pick(c).id : 0; }
}

/* ================= TASK STATE MACHINE ================= */
function think(v, stg) {
  v.task = null; v.slow = false;
  if (stg === 'infant') { wander(v, 40, rr(3, 6), true); return; }
  if (v.hunger >= 55 && S.food >= 1) { v.task = { type: 'eat' }; const [x, z] = near(SITE.larder, 26); walkTo(v, x, z); return; }
  if (v.sick) { wander(v, 60, rr(3, 6), true); return; }
  if (stg === 'child') {
    if (rank(v, 'heal') >= 1) { const s = findSick(v); if (s) { startHeal(v, s); return; } }
    if (v.job === 'school' && S.myst.m8) { v.task = { type: 'school' }; const [x, z] = near(SITE.hall, 50, 20, 40); walkTo(v, x, z); return; }
    wander(v, 220, rr(2, 5)); return;
  }
  if (v.chief) { wander(v, 140, rr(3, 7), false, SITE.mantle); return; }
  switch (v.job) {
    case 'forage': { const src = bestSource(v.src); if (src) { v.task = { type: 'forage', src, phase: 'go' }; const [x, z] = near(SITE[SRC_SITE[src]], src === 'field' ? 50 : 30); walkTo(v, x, z); return; } break; }
    case 'build': {
      if (S.fire.lit && S.fire.fuel < 30 && !S.vill.some(u => u.task && u.task.type === 'fetch' && u.task.what === 'wood')) { v.task = { type: 'fetch', what: 'wood', phase: 'get' }; const [x, z] = near(SITE.woodpile, 20); walkTo(v, x, z); return; }
      const p = pickProject(v); if (p) { v.task = { type: 'build', pid: p.id }; walkTo(v, p.x + rr(-34, 34), p.z + rr(12, 28)); return; }
      { const huts = [HUT_SITES[0], ...S.projects.filter(q => q.kind === 'hut' && q.done)]; const h = pick(huts); v.task = { type: 'repair' }; walkTo(v, h.x + rr(-30, 30), h.z + rr(14, 26)); return; }
    }
    case 'research': { v.task = { type: 'research' }; const [x, z] = near(SITE.study, 30, 12, 26); walkTo(v, x, z); return; }
    case 'heal': { const s = findSick(v); if (s) { startHeal(v, s); return; } break; }
    case 'parent': { if (v.mateCD < S.t) { const c = S.vill.filter(u => u !== v && u.sex !== v.sex && grown(u) && !u.task && u !== DRAG.v && !pairProblem(v, u)); if (c.length) { c.sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z)); if (tryMate(v, c[0], true)) return; } v.mateCD = S.t + YEAR * .08; } break; }
  }
  if (rnd() < .1) { const s = curiousSite(); if (s) { emote(v, '?', 5); walkTo(v, s.x + rr(-30, 30), s.z + rr(26, 44)); v.nextIdle = 3; return; } }
  wander(v, 240, rr(2, 6));
}
function curiousSite() {
  const c = [];
  if (!S.myst.m1) c.push('springrocks'); if (!S.myst.m2) c.push('hearth', 'woodpile', 'reeds'); if (!S.myst.m3) c.push('hive', 'torches');
  if (!S.myst.m4) c.push('wreck'); if (!S.myst.m6) c.push('terrace'); if (!S.myst.m8) c.push('hall'); if (!S.myst.m9) c.push('mantle');
  if (!S.myst.m10) c.push('circle'); if (!S.myst.m11) c.push('cauldron'); if (!S.myst.m14) c.push('dunes'); if (!S.myst.m16) c.push('belfry');
  return c.length ? SITE[pick(c)] : null;
}
function arrive(v) {
  const T = v.task;
  if (!T) { idle(v, v.nextIdle || rr(1, 3)); v.nextIdle = 0; v.slow = false; return; }
  switch (T.type) {
    case 'eat': work(v, WT.eat); break;
    case 'forage':
      if (T.phase === 'go') { if (!srcOK(T.src)) { v.task = null; emote(v, '?'); idle(v, 1); } else work(v, WT.forage); }
      else { if (v.carry) { addFood(v.carry.n); if (T.src === 'nets') S.stats.fish++; if (T.src === 'hive') S.stats.honey++; if (T.src === 'field') S.stats.crop++; } v.carry = null; v.task = null; idle(v, .3); }
      break;
    case 'build': case 'repair': work(v, WT.build); break;
    case 'research': work(v, WT.research); break;
    case 'school': work(v, 8); break;
    case 'heal': {
      const t = vById(T.tid);
      if (!t || !t.sick) { v.task = null; idle(v, 1); break; }
      if (Math.hypot(t.x - v.x, t.z - v.z) > 26 && T.tries++ < 6) { walkTo(v, t.x + (v.x < t.x ? -14 : 14), t.z + 2); break; }
      work(v, WT.heal); break;
    }
    case 'fetch': case 'torch': case 'myst': case 'dive': case 'item': work(v, T.dur || WT.fetch); break;
    case 'mate': {
      const p = vById(T.pid);
      if (!p || !p.task || p.task.type !== 'mate' || p.task.pid !== v.id) { v.task = null; idle(v, 1); break; }
      if (p.st === 'wait') { v.st = p.st = 'indoors'; v.timer = p.timer = 5; }
      else { v.st = 'wait'; v.timer = 15; }
      break;
    }
    default: v.task = null; idle(v, 1);
  }
}
function workDone(v) {
  const T = v.task; if (!T) { idle(v, 1); return; }
  const stg = stage(v);
  switch (T.type) {
    case 'eat': {
      const need = stg === 'child' ? 2 : stg === 'elder' ? 3 : 4;
      if (S.food >= 1) { S.food = Math.max(0, S.food - need); v.hunger = 0; }
      v.task = null; idle(v, .5); break;
    }
    case 'forage': {
      const n = foodYield(v, T.src);
      if (T.src === 'bramble') { S.bramble -= n; if (S.bramble < 5) { S.bramble = Math.max(0, S.bramble); S.stats.brambleEmpty = 1; msg('The Berry Bramble has been picked clean. It will slowly regrow.', 'bad'); } }
      if (T.src === 'hive') { S.hive -= n; if (S.hive < 5) msg('The hive is out of honey for now.'); }
      gain(v, 'forage', 1.2);
      v.carry = { k: T.src === 'nets' ? 'fish' : T.src === 'hive' ? 'honey' : 'food', n };
      T.phase = 'back'; const [x, z] = near(SITE.larder, 26); walkTo(v, x, z); break;
    }
    case 'build': {
      const p = S.projects.find(q => q.id === T.pid);
      if (!p || p.done) { v.task = null; idle(v, .5); break; }
      p.prog += 4 * RANK_YIELD[rank(v, 'build')] * [1, 1.3, 1.7][S.tech.craft - 1] * (S.buff.stone > S.t ? 2 : 1) * (chiefAlive() ? 1.1 : 1);
      gain(v, 'build', 1.2);
      if (p.prog >= p.need) { p.prog = p.need; completeProject(p); v.task = null; idle(v, .5); }
      else if (v.hunger < 55 && !v.sick) work(v, WT.build); else { v.task = null; idle(v, .3); }
      break;
    }
    case 'repair': { gain(v, 'build', 1.1); if (v.hunger < 55 && !v.sick && rnd() < .7 && !S.projects.some(q => !q.done)) work(v, WT.build); else { v.task = null; idle(v, rr(1, 3)); } break; }
    case 'research': {
      addLore(Math.round(6 * RANK_YIELD[rank(v, 'research')] * [1, 1.5, 2.2][S.tech.lore - 1] * (stg === 'elder' ? .9 : 1) * (chiefAlive() ? 1.1 : 1)));
      gain(v, 'research', 1.2);
      if (v.hunger < 55 && !v.sick) work(v, WT.research); else { v.task = null; idle(v, .3); }
      break;
    }
    case 'school': {
      const k = pick(['forage', 'build', 'research', 'heal']); gain(v, k, 2); addLore(2);
      if (v.hunger < 55 && stg === 'child') work(v, 8); else { v.task = null; idle(v, .5); }
      break;
    }
    case 'heal': { attemptHeal(v, vById(T.tid), T.manual); v.task = null; idle(v, 1); break; }
    case 'fetch': {
      if (T.phase === 'get') {
        v.carry = { k: T.what }; T.phase = 'put';
        const [x, z] = near(SITE.hearth, 18, 8, 16); walkTo(v, x, z); T.dur = 1.2;
      } else {
        v.carry = null;
        if (T.what === 'wood') {
          if (S.fire.lit) { S.fire.fuel = Math.min(100, S.fire.fuel + 50); S.stats.refuels++; msg(`${v.name} added wood to the hearth fire.`); }
          else if (!S.fire.wood) { S.fire.wood = true; msg(S.fire.grass ? 'The hearth has wood and reeds. Someone needs to light it!' : 'Wood is stacked in the hearth. It still needs something dry to catch a spark.'); }
          else msg('The hearth already has plenty of wood.');
        } else if (T.what === 'reeds') {
          if (!S.fire.grass) { S.fire.grass = true; msg(S.fire.wood ? 'The hearth has wood and reeds. Drag someone onto it to light it!' : 'Dry reeds are in the hearth. It still needs wood.'); }
          else msg('The hearth already has dry reeds.');
        }
        v.task = null; idle(v, .5);
      }
      break;
    }
    case 'torch': {
      if (T.phase === 'get') { v.carry = { k: 'torch' }; T.phase = 'light'; const [x, z] = near(SITE.hearth, 16, 8, 14); walkTo(v, x, z); T.dur = 1.5; }
      else if (T.phase === 'light') {
        if (!S.fire.lit) { msg('The fire went out before the torch could be lit.'); v.carry = null; v.task = null; idle(v, 1); break; }
        v.carry = { k: 'torchlit' }; T.phase = 'smoke'; T.dur = 5; const [x, z] = near(SITE.hive, 20, 16, 26); walkTo(v, x, z);
      } else { v.carry = null; v.task = null; idle(v, 1); solveM('m3'); }
      break;
    }
    case 'item': {
      const it = S.items.find(i => i.id === T.iid);
      if (T.phase === 'get') {
        if (!it) { v.task = null; msg('Someone else got there first.'); idle(v, 1); break; }
        S.items = S.items.filter(i => i !== it);
        if (it.type === 'curio') { collectCurio(it.sub); emote(v, '!', 2); v.task = null; idle(v, 1); break; }
        v.carry = { k: it.type, sub: it.sub }; T.phase = 'put'; T.dur = 1;
        const dst = it.type === 'herb' ? SITE.cauldron : SITE.larder; const [x, z] = near(dst, 20, 12, 22); walkTo(v, x, z);
      } else {
        const c = v.carry; v.carry = null; v.task = null; idle(v, .6);
        if (!c) break;
        if (c.k === 'glow') { addFood(Math.round(15 * (S.tech.harvest >= 3 ? 1.25 : 1))); S.stats.glow++; gain(v, 'forage', .5); }
        if (c.k === 'herb') addHerb(v, c.sub);
      }
      break;
    }
    case 'myst': { const id = T.id; v.task = null; idle(v, 1); MYST_WORK[id] && MYST_WORK[id](v); break; }
    case 'dive': { v.task = null; idle(v, 1); if (!S.myst.m15) solveM('m15'); v.carry = { k: 'tongue' }; setTimeout(() => { v.carry = null; }, 2500); break; }
    default: v.task = null; idle(v, 1);
  }
}
const MYST_WORK = {
  light(v) { if (S.fire.wood && S.fire.grass && !S.fire.lit) { S.fire.lit = true; S.fire.fuel = 100; if (!S.myst.m2) solveM('m2'); else msg(`${v.name} relit the hearth fire.`, 'good'); } },
  nets(v) { solveM('m5'); v.job = 'forage'; v.src = 'nets'; },
  scare(v) { S.ms.scare++; if (S.ms.scare >= 2) solveM('m7'); else msg(`${v.name} started building something from the driftwood. One more trip should finish it.`); },
  school(v) { solveM('m8'); },
  cauldron(v) { solveM('m11'); }
};

/* ================= BREWING & CURIOS ================= */
function addHerb(v, h) {
  S.cauldron.push(h); S.stats.herbs++;
  if (S.cauldron.length < 3) { msg(`${v.name} added ${HERB[h].n} to the cauldron (${S.cauldron.length}/3).`); return; }
  const key = rkey(S.cauldron); S.cauldron = []; S.stats.brews++;
  const rec = RECIPE[key];
  if (!rec) { S.stats.murky++; addLore(40); msg(`${v.name} brewed something murky. Nothing happened, but the attempt taught them a little. +40 Lore.`); return; }
  const isNew = !S.recipes[key]; S.recipes[key] = (S.recipes[key] || 0) + 1;
  msg(`${v.name} brewed ${rec.n}!${isNew ? ' New recipe!' : ''} ${rec.d}`, 'good');
  switch (rec.n) {
    case 'Deep Breath': v.buff.dive = S.t + YEAR * .5; emote(v, 'bubble', 5); break;
    case 'Hearty Stew': addFood(250); break;
    case 'Clear Mind': addLore(600); break;
    case 'Mending Tonic': for (const u of S.vill) if (u.sick) { u.sick = false; u.health = Math.max(u.health, 70); } break;
    case 'Quickstep': v.buff.quick = S.t + YEAR; break;
    case 'Youth Draught': { const a = ageOf(v); v.born += Math.min(5, Math.max(0, a - 16)) * YEAR; S.stats.youth++; break; }
    case 'Kinship Cordial': v.buff.cordial = 1; break;
    case 'Glow Tea': v.buff.glow = S.t + YEAR * 2; for (const k of SKILLS) gain(v, k, 8); break;
    case 'Stonebrew': S.buff.stone = S.t + YEAR; break;
    case 'Rain Tonic': S.bramble = Math.min(1500, S.bramble + 600); setWeather('rain', 60); break;
  }
}
function curioName(i) { return CURIO_SETS[Math.floor(i / 6)].items[i % 6]; }
function collectCurio(i) {
  S.stats.curioPick++;
  const had = S.curios[i] || 0; S.curios[i] = had + 1;
  if (had) { addLore(100); S.stats.dupes++; msg(`Found another ${curioName(i)}. The spare was studied for 100 Lore.`); return; }
  const set = CURIO_SETS[Math.floor(i / 6)];
  msg(`Found a curio: ${curioName(i)} (${set.n}).`, 'good');
  const s = Math.floor(i / 6); let ok = true; for (let k = 0; k < 6; k++) if (!S.curios[s * 6 + k]) ok = false;
  if (ok) msg(`${set.n} collection complete! The village feels roomier: +2 population.`, 'myst');
}

/* ================= DROPS (player interaction) ================= */
function findTarget(x, z, self) {
  let bv = null, bvd = 1e9;
  for (const u of S.vill) {
    if (u === self || u.st === 'indoors' || stage(u) === 'infant') continue;
    const d = Math.hypot(u.x - x, (u.z - z) * 1.2); if (d < 24 && d < bvd) { bvd = d; bv = u; }
  }
  if (bv && bv.sick && bvd < 15) return { kind: 'vill', v: bv };
  let bi = null, bid = 1e9;
  for (const it of S.items) { const d = Math.hypot(it.x - x, it.z - z); if (d < 30 && d < bid) { bid = d; bi = it; } }
  if (bi && bid < 18) return { kind: 'item', it: bi };
  let bs = null, bn = 1e9;
  for (const s of SITES) {
    if (!siteVisible(s)) continue;
    const d = Math.hypot(s.x - x, (s.z - z) * 1.3) / s.r; if (d < 1 && d < bn) { bn = d; bs = s; }
  }
  const pairable = bv && self && bv.sex !== self.sex && grown(bv) && grown(self) && bv.st !== 'work' && bv.st !== 'dance' && bv.st !== 'dig';
  if (bs && bn < .45) return { kind: 'site', s: bs };
  if (pairable && bvd < 15) return { kind: 'vill', v: bv };
  if (bs) return { kind: 'site', s: bs };
  if (bi) return { kind: 'item', it: bi };
  if (bv) return { kind: 'vill', v: bv };
  return { kind: 'ground' };
}
function siteVisible(s) { if (s.hut) return !!projBySite(s.id); return true; }
function targetLabel(tg, v) {
  if (!tg || tg.kind === 'ground') return '';
  if (tg.kind === 'vill') { const u = tg.v; if (u.sick) return 'Heal ' + u.name; if (v && u.sex !== v.sex && grown(u) && grown(v)) return u.name + ' ♥'; return u.name; }
  if (tg.kind === 'item') return tg.it.type === 'glow' ? 'Glowcap' : tg.it.type === 'herb' ? HERB[tg.it.sub].n : 'Curio';
  return siteName(tg.s);
}
function siteName(s) {
  const m = S.myst;
  const alt = { springrocks: m.m1 && 'Sweetwater Spring', hearth: S.fire.lit ? 'Hearth (burning)' : 'Hearth', wreck: m.m4 && 'Beach', nets: m.m5 && 'Tide Nets', terrace: m.m6 && 'Terrace Field',
    twisted: m.m7 && 'Straw Watcher', hall: m.m8 && 'Hall of Learning', mantle: 'Stone Dais', circle: 'Standing Stones', cauldron: m.m11 && 'Cauldron',
    mending: m.m12 && 'House of Mending', lodge: m.m13 && "Weaver's Lodge", dunes: m.m14 && 'Dug-out Dune', belfry: m.m16 && 'Bell of Echoes' };
  return alt[s.id] || s.n;
}
function dropVillager(v, x, z) {
  S.stats.drops++;
  const tg = findTarget(x, z, v);
  v.task = null; v.carry = null; v.slow = false;
  if (isOcean(x, z) && !(tg.kind === 'site' && ['wreck', 'nets', 'dunes'].includes(tg.s.id))) {
    v.x = x; v.z = z; S.stats.splash++; msg(`Splash! ${v.name} swims back to shore.`);
    let tx = x, tz = z; for (let i = 0; i < 60 && landVal(tx, tz) < .05; i++) { tx += (ISLE.cx - tx) * .05; tz += (ISLE.cz - tz) * .05; }
    v.tx = tx; v.tz = tz; v.st = 'swim'; return;
  }
  if (beyondCliff(x, z, 30)) {
    msg(`The cliff is far too steep for ${v.name} to climb.`);
    if (z < cliffZ(x) + 30) z = cliffZ(x) + 60; else x = sideX(z) - 60;
  }
  if (!isWater(x, z)) { v.x = x; v.z = z; }
  idle(v, 1.2);
  if (tg.kind === 'vill') return dropOnVillager(v, tg.v);
  if (tg.kind === 'item') return dropOnItem(v, tg.it);
  if (tg.kind === 'site') return dropOnSite(v, tg.s);
}
function dropOnVillager(v, u) {
  if (u.sick) { if (v.sick) { msg(`${v.name} is too sick to help.`); return; } startHeal(v, u, true); if (rank(v, 'heal') >= 1 || rnd() < .5) { if (grown(v) && !v.chief && v.job !== 'heal' && rank(v, 'heal') >= 1) v.job = 'heal'; } return; }
  if (v.sex !== u.sex && grown(v) && grown(u)) { S.stats.pairDrops++; if (tryMate(v, u, false) && rank(v, 'parent') >= 1 && !v.job && !v.chief) v.job = 'parent'; return; }
  emote(v, 'chat', 2); emote(u, 'chat', 2); msg(`${v.name} and ${u.name} chat for a while.`);
}
function dropOnItem(v, it) {
  const child = stage(v) === 'child';
  if (it.type === 'glow') { if (!child) { msg('Glowcaps are too fiddly for grown-ups. Children are the ones who find and carry them.'); return; } }
  else if (it.type === 'curio') { if (!child) { msg('Only children have eyes sharp enough (and hands small enough) to dig out curios.'); return; } }
  else if (it.type === 'herb') {
    if (child) { msg(`${v.name} is too young to handle brewing herbs.`); return; }
    if (!S.myst.m11) { msg('There is no working cauldron to brew with yet.'); return; }
  }
  v.task = { type: 'item', iid: it.id, phase: 'get', dur: 1.2 }; walkTo(v, it.x + 6, it.z + 4);
}
function teach(v, skill, then) {
  if (rank(v, skill) >= 1 || rnd() < .4 + v.conf * .15) {
    if (v.conf >= 3) S.stats.persist++;
    v.conf = 0; v.job = skill; if (then) then(); else think(v, stage(v)); return true;
  }
  v.conf++; gain(v, skill, 2); emote(v, '?', 3);
  msg(`${v.name} isn't sure what to do here yet. Keep showing them!`);
  return false;
}
function dropOnSite(v, s) {
  const stg = stage(v), child = stg === 'child', m = S.myst;
  const kid = () => { if (child) { msg(`${v.name} is too young for that. Children can gather glowcaps, dig up curios, and help the sick.`); return true; } return false; };
  const chiefNo = () => { if (v.chief) { msg(`${v.name} is the Warden and leads rather than labors.`); return true; } return false; };
  const setTask = (T, sx, z1, z2) => { v.task = T; const [x, z] = near(s, sx || 24, z1, z2); walkTo(v, x, z); };
  if (s.hut !== undefined) {
    const p = projBySite(s.id);
    if (!p || p.done) { emote(v, 'chat', 2); return; }
    if (kid() || chiefNo()) return;
    v.pref = p.id; teach(v, 'build', () => { v.task = { type: 'build', pid: p.id }; walkTo(v, p.x + rr(-30, 30), p.z + rr(12, 26)); });
    return;
  }
  switch (s.id) {
    case 'cave':
      emote(v, '!', 3);
      msg(`${v.name} presses an ear to the boulders sealing the cave. Cold air whistles through the cracks. There is no way through yet.`);
      return;
    case 'swamp':
      emote(v, '!', 3);
      msg(`${v.name} backs away from the Mire. Something moved under the black water.`);
      { let tx = v.x, tz = v.z; for (let i = 0; i < 40 && inSwamp(tx, tz); i++) { tx += (SITE.hearth.x - tx) * .08; tz += (SITE.hearth.z - tz) * .08; } walkTo(v, tx, tz); v.nextIdle = 1; }
      return;
    case 'larder':
      if (v.hunger > 15 && S.food >= 1) { v.task = { type: 'eat' }; const [x, z] = near(s, 24); walkTo(v, x, z); }
      else msg(S.food < 1 ? 'The larder is empty!' : `${v.name} isn't hungry right now.`);
      return;
    case 'bramble':
      if (kid() || chiefNo()) return;
      if (S.bramble < 5) { msg('The bramble is picked clean. It needs time to regrow.'); return; }
      v.src = 'bramble'; teach(v, 'forage'); return;
    case 'hive':
      if (m.m3) { if (kid() || chiefNo()) return; v.src = 'hive'; teach(v, 'forage'); return; }
      msg(S.fire.lit ? 'The bees are too angry to get near. The old torches nearby might help, if lit from the hearth.' : 'Angry bees swarm the hive. Smoke might calm them, but there is no fire yet.'); return;
    case 'terrace':
      if (m.m6) { if (kid() || chiefNo()) return; v.src = 'field'; teach(v, 'forage'); return; }
      if (kid()) return;
      if (S.tech.harvest < 2) { msg(`${v.name} thinks crops could grow here, with better farming knowledge (Harvest 2).`); return; }
      { const p = startProject('field'); if (!v.chief) { v.pref = p.id; teach(v, 'build', () => { v.task = { type: 'build', pid: p.id }; walkTo(v, p.x + rr(-40, 40), p.z + rr(12, 26)); }); } }
      return;
    case 'nets':
      if (m.m5) { if (kid() || chiefNo()) return; v.src = 'nets'; teach(v, 'forage'); return; }
      if (kid()) return;
      if (!m.m4) { msg('Wreckage blocks the way to the tide rocks.'); return; }
      if (S.tech.harvest < 3) { msg(`${v.name} watches fish dart between the rocks. With Harvest 3, a way to catch them might come to mind.`); return; }
      if (rank(v, 'forage') < 2) { msg(`${v.name} doesn't know enough about food gathering. A Skilled Forager might figure this out.`); return; }
      setTask({ type: 'myst', id: 'nets', dur: 8 }, 30, 4, 16); return;
    case 'study':
      if (kid() || chiefNo()) return; teach(v, 'research'); return;
    case 'hearth':
      if (kid()) return;
      if (S.fire.lit) { msg(`${v.name} warms their hands at the fire. (Fuel ${Math.round(S.fire.fuel)}%)`); return; }
      if (S.fire.wood && S.fire.grass) { setTask({ type: 'myst', id: 'light', dur: 3 }, 16, 8, 14); return; }
      msg(`The hearth is cold. It needs ${!S.fire.wood && !S.fire.grass ? 'deadfall wood and dry reeds' : !S.fire.wood ? 'deadfall wood' : 'dry reeds'} first.`); return;
    case 'woodpile':
      if (kid()) return;
      if (S.fire.lit && S.fire.fuel > 90) { msg('The fire has plenty of wood right now.'); return; }
      setTask({ type: 'fetch', what: 'wood', phase: 'get' }, 20); return;
    case 'reeds':
      if (kid()) return;
      if (S.fire.lit) { msg('The fire is already burning. Deadfall keeps it going.'); return; }
      setTask({ type: 'fetch', what: 'reeds', phase: 'get' }, 18); return;
    case 'torches':
      if (kid()) return;
      if (m.m3) { msg('The torches have done their job. The bees are calm.'); return; }
      if (!S.fire.lit) { msg('Old torches, dry and ready. If only there was a fire to light them.'); return; }
      setTask({ type: 'torch', phase: 'get', dur: 2 }, 16); return;
    case 'springrocks':
      if (m.m1) { msg('Clear, cold water bubbles up here.'); return; }
      if (kid()) return;
      { const p = projBySite('springrocks'); if (p) { if (chiefNo()) return; v.pref = p.id; teach(v, 'build', () => { v.task = { type: 'build', pid: p.id }; walkTo(v, p.x + rr(-30, 30), p.z + rr(12, 24)); }); return; } }
      if (rank(v, 'build') < 1) { msg(`${v.name} hears water trickling under the rocks. A trained builder could open it up.`); return; }
      { const p = startProject('spring'); v.job = 'build'; v.pref = p.id; v.task = { type: 'build', pid: p.id }; walkTo(v, p.x, p.z + 20); } return;
    case 'wreck':
      if (m.m4) { msg('Waves wash over the clean sand.'); return; }
      if (kid()) return;
      if (S.tech.craft < 2) { msg(`${v.name} tugs at the tangled wreckage. Better building methods (Craft 2) are needed to clear it.`); return; }
      { const p = startProject('shore'); if (chiefNo()) return; v.pref = p.id; teach(v, 'build', () => { v.task = { type: 'build', pid: p.id }; walkTo(v, p.x + rr(-50, 50), p.z + rr(-10, 20)); }); } return;
    case 'twisted':
      if (m.m7) { msg('The Straw Watcher keeps the birds away.'); return; }
      if (kid()) return;
      if (!m.m6) { msg(`${v.name} thinks this driftwood could be useful, if there were a field to protect.`); return; }
      if (rank(v, 'forage') < 2) { msg('A Skilled Forager would know what to make of this.'); return; }
      setTask({ type: 'myst', id: 'scare', dur: 6 }, 20); return;
    case 'hall':
      if (m.m8) { if (child) { v.job = 'school'; msg(`${v.name} heads to the Hall of Learning to study.`); think(v, stg); return; } msg('Children learn here. Drag a child onto the hall to send them to school.'); return; }
      if (kid()) return;
      if (rank(v, 'research') < 3) { msg(`${v.name} stares at the carvings but can't make sense of them. Only a Master Scholar could.`); return; }
      setTask({ type: 'myst', id: 'school', dur: 8 }, 40, 20, 34); return;
    case 'mantle':
      if (kid()) return;
      if (chiefAlive()) { msg(`The mantle belongs to ${vById(S.chief).name}, the Warden.`); return; }
      ensureDestiny();
      if (v.id === S.ms.destiny) {
        v.chief = true; S.chief = v.id; v.job = null; v.task = null; S.ms.destiny = 0;
        if (!m.m9) solveM('m9'); else { S.stats.wardens++; msg(`${v.name} put on the mantle. It fits! ${v.name} is the new Warden.`, 'myst'); }
      } else { emote(v, 'no', 2); msg(`${v.name} tries on the mantle. It doesn't fit.`); }
      return;
    case 'circle':
      if (m.m10) { msg('The Standing Stones hum softly.'); return; }
      if (kid()) return;
      if (!m.m9 || S.tech.spirit < 2) { msg('These stones feel important, but the village isn\'t ready. It seems to need a Warden and a deeper Spirit (level 2).'); return; }
      if (v.chief) { S.ms.chiefDance = v.id; }
      else if (rank(v, 'forage') >= 2) { if (!S.ms.dancers.includes(v.id)) S.ms.dancers.push(v.id); }
      else { msg('Only Skilled Foragers seem to know the steps of this old dance.'); return; }
      { const n = S.ms.dancers.length + (S.ms.chiefDance ? 1 : 0), a = n / 5 * 6.28; v.x = s.x + Math.cos(a) * 66; v.z = s.z + Math.sin(a) * 34 + 8; v.st = 'dance'; }
      if (S.ms.chiefDance && S.ms.dancers.length >= 3) {
        solveM('m10'); setWeather('rain', 120);
        for (const id of [...S.ms.dancers, S.ms.chiefDance]) { const u = vById(id); if (u) { u.st = 'idle'; u.timer = 1; } }
        S.ms.dancers = []; S.ms.chiefDance = 0;
      } else msg(`The dance needs ${S.ms.chiefDance ? '' : 'the Warden and '}${Math.max(0, 3 - S.ms.dancers.length)} more Skilled Forager${3 - S.ms.dancers.length === 1 ? '' : 's'}.`);
      return;
    case 'cauldron':
      if (m.m11) { msg('Carry herbs here to brew. Every three herbs make one brew.'); return; }
      if (kid()) return;
      if (S.tech.lore < 2 || S.tech.remedy < 2) { msg(`${v.name} thinks the cracked cauldron could be mended with more knowledge (Lore 2 and Remedy 2).`); return; }
      if (rank(v, 'research') < 1) { msg('A trained scholar would know how to mend this.'); return; }
      setTask({ type: 'myst', id: 'cauldron', dur: 10 }, 18); return;
    case 'mending':
      if (m.m12) { msg('The House of Mending keeps everyone healthy.'); return; }
      if (kid()) return;
      if (S.tech.craft < 3 || S.tech.remedy < 3) { msg(`${v.name} thinks a place of healing once stood here. Rebuilding it needs Craft 3 and Remedy 3.`); return; }
      { const p = startProject('mending'); if (chiefNo()) return; v.pref = p.id; teach(v, 'build', () => { v.task = { type: 'build', pid: p.id }; walkTo(v, p.x + rr(-40, 40), p.z + rr(12, 26)); }); } return;
    case 'lodge':
      if (m.m13) { msg('Open a villager\'s card to change their outfit here.'); return; }
      if (kid()) return;
      if (S.tech.craft < 2 || S.tech.spirit < 2) { msg(`${v.name} runs a hand over the broken loom. Restoring it needs Craft 2 and Spirit 2.`); return; }
      { const p = startProject('lodge'); if (chiefNo()) return; v.pref = p.id; teach(v, 'build', () => { v.task = { type: 'build', pid: p.id }; walkTo(v, p.x + rr(-40, 40), p.z + rr(12, 26)); }); } return;
    case 'dunes':
      if (m.m14) { msg('Just an empty hole in the sand now.'); return; }
      if (kid()) return;
      if (S.tech.craft < 2) { msg('Something big glints beneath the sand. Digging it out needs better tools (Craft 2).'); return; }
      if (rank(v, 'build') < 3) { msg('Something heavy is buried here. It will take three Master Builders together.'); return; }
      if (!S.ms.diggers.includes(v.id)) S.ms.diggers.push(v.id);
      { const n = S.ms.diggers.length; v.x = s.x + (n - 2) * 26; v.z = s.z + 16; v.st = 'dig'; }
      if (S.ms.diggers.length >= 3) { S.ms.digT = S.t + 10; msg('Three Master Builders start digging together!'); }
      else msg(`${3 - S.ms.diggers.length} more Master Builder${S.ms.diggers.length === 2 ? '' : 's'} needed to dig here.`);
      return;
    case 'pond':
      if (m.m15) { msg('The Still Pond is calm and clear.'); return; }
      if (kid()) return;
      if (v.buff.dive > S.t) { v.task = { type: 'dive', dur: 6 }; walkTo(v, s.x, s.z); return; }
      msg(m.m8 ? `Something glints at the bottom, far too deep. ${MYSTM.m15.clue}` : 'Something glints at the bottom of the pond, far too deep to reach by holding your breath.');
      return;
    case 'belfry':
      if (m.m16) { msg('The Bell of Echoes hangs proudly on the hill.'); return; }
      if (kid()) return;
      { const p = projBySite('belfry'); if (p) { if (chiefNo()) return; v.pref = p.id; teach(v, 'build', () => { v.task = { type: 'build', pid: p.id }; walkTo(v, p.x + rr(-40, 40), p.z + rr(12, 26)); }); return; } }
      if (!m.m14 || !m.m15) { msg(`A great stone plinth. ${!m.m14 && !m.m15 ? 'Two bronze pieces seem to be missing.' : 'One bronze piece is still missing.'}`); return; }
      if (S.tech.spirit < 3) { msg('The plinth feels asleep. Spirit 3 might wake it.'); return; }
      if (rank(v, 'build') < 3) { msg('Raising the bell is a job for a Master Builder.'); return; }
      { const p = startProject('belfry'); v.job = 'build'; v.pref = p.id; v.task = { type: 'build', pid: p.id }; walkTo(v, p.x, p.z + 24); } return;
  }
}

/* ================= WEATHER & EVENTS ================= */
function setWeather(k, dur) {
  S.weather.k = k; S.weather.until = S.t + (dur || rr(60, 160));
  if (k === 'rain') S.stats.rainSeen++; if (k === 'fog') S.stats.fogSeen++; if (k === 'rainbow') S.stats.rainbow++;
}
function nextWeather() {
  const w = S.weather, r = rnd();
  if (w.k === 'storm') { S.stats.stormSeen++; setWeather(rnd() < .5 ? 'rainbow' : 'cloudy', rr(40, 70)); return; }
  if (w.k === 'rain') { setWeather(rnd() < .35 ? 'rainbow' : 'clear', rr(40, 90)); return; }
  setWeather(r < .5 ? 'clear' : r < .7 ? 'cloudy' : r < .82 ? 'fog' : 'rain');
}
function randLand(cx, cz, r, minLand) {
  for (let i = 0; i < 30; i++) {
    const x = cx + rr(-r, r), z = cz + rr(-r, r) * .8;
    if (landVal(x, z) < (minLand || .1) || !isPlayable(x, z)) continue;
    let ok = true; for (const s of SITES) if (Math.hypot(s.x - x, s.z - z) < s.r * .8) { ok = false; break; }
    if (ok) return [x, z];
  }
  return null;
}
function spawnItems(dt) {
  const T = S.spawnT;
  T.g -= dt; T.c -= dt; T.h -= dt;
  const cnt = t => S.items.filter(i => i.type === t).length;
  if (T.g <= 0) { T.g = rr(30, 60); if (cnt('glow') < 4) { const p = randLand(2000, 1440, 1300, .15); if (p) S.items.push({ id: S.itemId++, type: 'glow', x: p[0], z: p[1] }); } }
  if (T.c <= 0) { T.c = rr(45, 90); if (cnt('curio') < 3) { const p = randLand(2000, 1440, 1560, .02); if (p) S.items.push({ id: S.itemId++, type: 'curio', sub: Math.floor(rnd() * CURIO_COUNT), x: p[0], z: p[1] }); } }
  if (S.myst.m11 && T.h <= 0) { T.h = rr(18, 36); if (cnt('herb') < 7) { const h = pick(HERBS); const p = randLand(h.home[0], h.home[1], 220, .1); if (p) S.items.push({ id: S.itemId++, type: 'herb', sub: h.id, x: p[0], z: p[1] }); } }
}
function runEvent() {
  const opts = ['storm', 'bounty', 'fishwash', 'outbreak'];
  if (S.vill.length + pendingBirths() < popCap()) opts.push('stranger', 'stranger');
  if (!OFFLINE) opts.push('star', 'star');
  const e = pick(opts);
  switch (e) {
    case 'stranger': {
      const [x, z] = [SITE.wreck.x + rr(-70, 70), SITE.wreck.z + 6];
      const v = newV({ born: S.t - rr(17, 34) * YEAR, x, z }); v.sk[pick(['forage', 'build', 'research', 'heal'])] = rr(20, 70);
      S.vill.push(v); S.stats.stranger++; walkTo(v, SITE.hearth.x + rr(-40, 40), SITE.hearth.z + rr(10, 40));
      msg(`A castaway named ${v.name} washed ashore on a raft and joined the village!`, 'good'); break;
    }
    case 'storm': { setWeather('storm', rr(50, 90)); const lost = Math.min(400, Math.floor(S.food * .08)); S.food -= lost; msg(`A storm lashes the island! ${lost} food spoiled in the larder.`, 'bad'); break; }
    case 'bounty': S.bramble = Math.min(1500, S.bramble + 400); msg('The Berry Bramble is heavy with fruit this season.', 'good'); break;
    case 'fishwash': addFood(80); msg('High tide left fish on the beach. +80 food.', 'good'); break;
    case 'outbreak': {
      const c = S.vill.filter(v => !v.sick && stage(v) !== 'infant'); const n = S.tech.remedy >= 3 ? 1 : 2;
      for (let i = 0; i < n && c.length; i++) { const v = c.splice(Math.floor(rnd() * c.length), 1)[0]; v.sick = true; }
      msg('A fever is spreading through the village! Drag healers onto the sick.', 'bad'); break;
    }
    case 'star': HOOK.star(); break;
  }
}

/* ================= MAIN TICK ================= */
function tick(dt) {
  S.t += dt;
  const wet = S.weather.k === 'rain' || S.weather.k === 'storm';
  S.bramble = Math.min(1500, S.bramble + dt * .35 * (wet ? 2 : 1) * (S.myst.m10 ? 3 : 1));
  S.hive = Math.min(800, S.hive + dt * .15);
  if (S.fire.lit) {
    S.fire.fuel -= dt * 100 / (YEAR * 1.2) * (wet ? 1.5 : 1);
    if (S.fire.fuel <= 0) { S.fire.fuel = 0; S.fire.lit = false; S.fire.wood = S.fire.grass = false; msg('The hearth fire went out. Bring deadfall and dry reeds to relight it.', 'bad'); }
  }
  for (let i = 0; i < S.vill.length; i++) updV(S.vill[i], dt);
  if (S.vill.some(v => v.dead)) S.vill = S.vill.filter(v => !v.dead);
  if (S.ms.digT && S.t >= S.ms.digT) {
    S.ms.digT = 0; solveM('m14');
    for (const id of S.ms.diggers) { const u = vById(id); if (u) { u.st = 'idle'; u.timer = 1; } }
    S.ms.diggers = [];
  }
  spawnItems(dt);
  if (S.t > S.weather.until) nextWeather();
  if (S.t > S.nextEvent) { S.nextEvent = S.t + YEAR * rr(.5, 1.3); runEvent(); }
  if ((S.t % 5) < dt) {
    ensureDestiny();
    for (const v of S.vill) { const a = ageOf(v); if (a > S.stats.maxAge) S.stats.maxAge = a; }
  }
}
function updV(v, dt) {
  if (v.dead || v === DRAG.v) return;
  const a = ageOf(v), stg = a < 2 ? 'infant' : a < 14 ? 'child' : a < 60 ? 'adult' : 'elder';
  if (a >= v.life) { die(v, 'old age'); return; }
  if (stg !== 'infant' && v.st !== 'indoors') {
    v.hunger += dt * HUNGER_RATE * (stg === 'child' ? .8 : 1);
    if (v.hunger >= 100) {
      v.hunger = 100; v.health -= dt * .45; S.stats.lastStarve = S.t; S.stats.starved = 1;
      if (!v.starveMsg) { v.starveMsg = 1; msg(`${v.name} is starving! Get food into the larder.`, 'bad'); }
      if (v.health <= 0) { die(v, 'hunger'); return; }
    } else v.starveMsg = 0;
    if (v.sick) { v.health -= dt * .09; if (v.health <= 0) { die(v, 'illness'); return; } if (rnd() < dt * .0012) cure(v, null); }
    else { if (rnd() < dt * sickRate(v, stg)) makeSick(v); if (v.hunger < 100 && v.health < 100) v.health = Math.min(100, v.health + dt * .4); }
  }
  if (stg === 'adult' && v.f.child && !v.f.adult) { v.f.adult = 1; S.stats.comeOfAge++; if (v.job === 'school') v.job = null; msg(`${v.name} has come of age and is ready to work.`, 'good'); }
  if (stg === 'elder' && !v.f.elder) { v.f.elder = 1; msg(`${v.name} has grown into an elder.`); }
  if (v.preg && S.t >= v.preg) birth(v);
  if (v.emoteT > 0) { v.emoteT -= dt; if (v.emoteT <= 0) v.emote = null; }
  if (stg === 'infant' && v.mom) {
    const m = vById(v.mom);
    if (m && m.st !== 'indoors') { const off = (v.id % 2 ? 7 : -7); v.x = m.x + (m.face > 0 ? off : -off); v.z = m.z + 1; v.face = m.face; v.st = 'held'; return; }
    if (!m) v.mom = 0;
  }
  if (v.st === 'held') v.st = 'idle';
  switch (v.st) {
    case 'walk': case 'swim': {
      const sp = (v.st === 'swim' ? 34 : moveSpeed(v, stg)) * dt;
      const dx = v.tx - v.x, dz = v.tz - v.z, d = Math.hypot(dx, dz);
      if (Math.abs(dx) > .5) v.face = dx > 0 ? 1 : -1;
      if (d <= sp) { v.x = v.tx; v.z = v.tz; const sw = v.st === 'swim'; v.st = 'idle'; v.timer = 0; if (sw) idle(v, 1); else arrive(v); }
      else { v.x += dx / d * sp; v.z += dz / d * sp; v.walkPh += dt * 11; }
      break;
    }
    case 'work': v.timer -= dt * workMult(v); v.walkPh += dt * 4; if (v.timer <= 0) { v.st = 'idle'; v.timer = 0; workDone(v); } break;
    case 'wait': v.timer -= dt; if (v.timer <= 0) { v.task = null; idle(v, 1); } break;
    case 'indoors': v.timer -= dt; if (v.timer <= 0) { const T = v.task; v.st = 'idle'; v.timer = .8; v.task = null; if (T && T.lead) { const p = vById(T.pid); if (p) resolveMate(v, p, T.manual); } } break;
    case 'dance': case 'dig': v.walkPh += dt * 7; if (v.hunger > 90) { removeFromGroups(v); idle(v, .2); } break;
    default: v.timer -= dt; if (v.timer <= 0) think(v, stg);
  }
}

/* ================= TECH ================= */
function buyTech(id) {
  const lvl = S.tech[id]; if (lvl >= 3) return false;
  const cost = TECH[id].costs[lvl]; if (S.lore < cost) return false;
  S.lore -= cost; S.tech[id]++;
  msg(`${TECH[id].n} advanced to level ${S.tech[id]}. ${TECH[id].d[S.tech[id] - 1]}`, 'good');
  if (id === 'craft') syncProjects(false);
  if (id === 'spirit' && S.tech.spirit >= 3) for (const v of S.vill) v.life += 6;
  return true;
}

/* ================= OFFLINE CATCH-UP ================= */
function simulateAway(realSec) {
  const simSec = Math.min(realSec, OFFLINE_CAP) * OFFLINE_RATE * (S.speed > 0 ? 1 : 0);
  if (simSec < 5) return null;
  const b = { food: S.stats.foodT, lore: S.stats.loreT, births: S.stats.births, deaths: S.stats.deaths, pop: S.vill.length, t: S.t };
  OFFLINE = true; OFF_LOG = [];
  let rem = simSec; while (rem > 0) { const d = Math.min(1, rem); tick(d); rem -= d; }
  OFFLINE = false;
  return { real: realSec, years: (S.t - b.t) / YEAR, food: Math.round(S.stats.foodT - b.food), lore: Math.round(S.stats.loreT - b.lore), births: S.stats.births - b.births, deaths: S.stats.deaths - b.deaths, pop: S.vill.length, log: OFF_LOG.slice(-10) };
}
