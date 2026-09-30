'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = n => { n = Math.floor(n); return n >= 100000 ? Math.round(n / 1000) + 'k' : n >= 10000 ? (n / 1000).toFixed(1) + 'k' : n.toLocaleString('en-US'); };
const ICON = {
  people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5" fill="#f4e4c1"/><path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6z" fill="#f4e4c1"/><circle cx="17" cy="9" r="2.8" fill="#c7ad8c"/><path d="M14.5 14.3c3.8-.6 6.4 1.4 7 5.7h-4.4c-.3-2.3-1.2-4.3-2.6-5.7z" fill="#c7ad8c"/></svg>',
  food: '<svg viewBox="0 0 24 24"><path d="M12 6c1-2.5 3-3.5 5-3.2-.6 2-2.2 3.2-4.6 3.6z" fill="#86c95a"/><circle cx="8" cy="14" r="4.6" fill="#d8404d"/><circle cx="15.5" cy="13" r="4.6" fill="#e0525e"/><circle cx="12" cy="18" r="4" fill="#c8323f"/><circle cx="14" cy="11.6" r="1.2" fill="#ffb0b8"/></svg>',
  lore: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2" fill="#e9dcc0"/><rect x="2.5" y="4" width="3.5" height="16" rx="1.7" fill="#c8b48a"/><rect x="18" y="4" width="3.5" height="16" rx="1.7" fill="#c8b48a"/><path d="M8 9h8M8 12h8M8 15h5" stroke="#6b5230" stroke-width="1.5" stroke-linecap="round"/></svg>',
  year: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#e8b64c"/><g stroke="#e8b64c" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></g></svg>',
  tabVill: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4"/><path d="M4 21c.6-5 3.8-7.5 8-7.5s7.4 2.5 8 7.5z"/></svg>',
  tabTech: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4.5"/></svg>',
  tabMyst: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M15.5 15.2c0-1.3 1-2 2-2s2 .7 2 1.8c0 1.6-2 1.6-2 3M17.5 20.5v.1" stroke-linecap="round"/></svg>',
  tabTro: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="10.8" y="12.5" width="2.4" height="4.5"/><rect x="7.5" y="17" width="9" height="3.5" rx="1"/></svg>',
  tabCol: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c4 0 7 3.5 7 8 0 2-1 3.5-2 4.5L12 21l-5-5.5C6 14.5 5 13 5 11c0-4.5 3-8 7-8z" opacity=".35"/><path d="M12 5.5a5.5 5.5 0 0 1 5 7.5c-1.5-2.5-3.2-3.5-5-3.5s-3.5 1-5 3.5a5.5 5.5 0 0 1 5-7.5z"/></svg>',
  tabMenu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  medal: (on) => `<svg viewBox="0 0 30 30"><path d="M9 2h5l2 8h-5zM21 2h-5l-2 8h5z" fill="${on ? '#d9774a' : '#434a3b'}"/><circle cx="15" cy="19" r="8.5" fill="${on ? '#d9ae4c' : '#434a3b'}" stroke="${on ? '#b8863a' : '#5c6450'}" stroke-width="2"/><path d="M15 14.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="${on ? '#fff4c8' : '#5c6450'}"/></svg>`
};

/* ================= HUD ================= */
function buildHUD() {
  $('stats').innerHTML =
    `<div class="chip panel" id="cPop">${ICON.people}<span></span></div>` +
    `<div class="chip panel" id="cFood">${ICON.food}<span></span></div>` +
    `<div class="chip panel" id="cLore">${ICON.lore}<span></span></div>` +
    `<div class="chip panel" id="cYear">${ICON.year}<span></span></div>`;
  $('speed').onclick = () => { S.speed = (S.speed + 1) % SPEEDS.length; if (S.speed === 3) S.stats.fast = 1; updHUD(); };
  const tabs = [['vill', 'Villagers', ICON.tabVill], ['tech', 'Tech', ICON.tabTech], ['myst', 'Mysteries', ICON.tabMyst], ['tro', 'Trophies', ICON.tabTro], ['col', 'Collection', ICON.tabCol], ['menu', 'Menu', ICON.tabMenu]];
  $('tabs').innerHTML = tabs.map(([id, n, ic]) => `<button data-tab="${id}" aria-label="${n}">${ic}<span>${n}</span></button>`).join('');
  $('tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; const t = b.dataset.tab; if (UI.tab === t) closeSheet(); else openSheet(t); };
  $('sheetX').onclick = closeSheet;
  $('zin').onclick = () => { sfx('tap'); cam.zoom *= Math.pow(1.2, CFG.zoomSpd); clampCam(); };
  $('zout').onclick = () => { sfx('tap'); cam.zoom /= Math.pow(1.2, CFG.zoomSpd); clampCam(); };
  $('zrot').onclick = toggleOrient;
}
function toggleOrient() {
  const portraitScreen = window.innerHeight > window.innerWidth;
  if (!portraitScreen && !ROT) { toast('Your screen is already sideways. Turn your device upright to play in portrait.'); return; }
  S.settings.orient = S.settings.orient === 'portrait' ? 'auto' : 'portrait'; resize(); if (UI.tab === 'menu') renderSheet();
}
function updHUD() {
  const cap = popCap();
  $('cPop').querySelector('span').innerHTML = `${S.vill.length}<small>/${cap}</small>`;
  $('cFood').querySelector('span').textContent = fmt(S.food);
  $('cLore').querySelector('span').textContent = fmt(S.lore);
  const yr = Math.floor(S.t / YEAR) + 1, frac = (S.t % YEAR) / YEAR;
  const season = ['Dry', 'Bloom', 'Monsoon', 'Harvest'][Math.floor(frac * 4)];
  $('cYear').querySelector('span').innerHTML = `Yr ${yr} <small>${season}</small>`;
  const sp = $('speed'); sp.textContent = S.speed === 0 ? 'Paused' : SPEEDS[S.speed] + '×'; sp.classList.toggle('paused', S.speed === 0);
  $('cFood').style.color = S.food < 20 ? 'var(--bad)' : '';
  // goal
  const g = currentGoal(); const ge = $('goal');
  if (g && !UI.tab && !UI.cardId) { ge.hidden = false; ge.innerHTML = `<b>Next</b><span>${g}</span>`; } else ge.hidden = true;
  const unseen = ACH.filter(a => S.ach[a.id] && S.ach[a.id] > (UI.seenAch || 0)).length;
  const tb = document.querySelector('[data-tab="tro"]'); if (tb) { let d = tb.querySelector('.dot'); if (unseen && !d) { d = document.createElement('i'); d.className = 'dot'; tb.appendChild(d); } if (!unseen && d) d.remove(); }
}
const GOALS = [
  ['Press and drag a villager onto the Berry Bramble to gather food.', () => S.vill.some(v => v.job === 'forage') || S.stats.foodT > 50],
  ['Drag a villager onto the Study Stones to earn Lore.', () => S.vill.some(v => v.job === 'research') || S.stats.loreT > 100],
  ['Drag a villager onto a Hut Site to start building.', () => S.vill.some(v => v.job === 'build') || S.stats.huts > 0],
  ['Drag a man onto a woman to start a family.', () => S.stats.pairDrops > 0 || S.stats.births > 0],
  ['Open Tech and spend Lore on an upgrade.', () => TECHS.some(t => S.tech[t.id] > 1)],
  ['Explore: drag villagers onto odd places around the island.', () => Object.keys(S.myst).length > 0]
];
function currentGoal() { if (S.goalsDone) return null; for (const [t, f] of GOALS) if (!f()) return t; S.goalsDone = 1; return null; }

/* ================= TOASTS ================= */
function toast(text, kind) {
  const box = $('toasts'); const el = document.createElement('div');
  el.className = 'toast ' + (kind || ''); el.innerHTML = text;
  box.prepend(el);
  while (box.children.length > 3) box.lastChild.remove();
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, kind === 'trophy' || kind === 'myst' ? 6500 : 4800);
}
HOOK.toast = (t, k) => toast(esc(t), k);
HOOK.trophy = list => { for (const a of list) toast(`Trophy unlocked: <b>${esc(a.n)}</b><br><span style="color:var(--muted)">${esc(a.d)}</span>`, 'trophy'); updHUD(); if (UI.tab === 'tro') renderSheet(); };
HOOK.big = m => {
  const w = $('bigwrap'); w.innerHTML = `<div class="big panel"><img src="${mystImg(m.id)}" alt=""><small>Mystery solved</small><b>${esc(m.n)}</b><p>${esc(m.done)}</p></div>`;
  clearTimeout(UI.bigT); UI.bigT = setTimeout(() => { w.innerHTML = ''; }, 4200);
};
HOOK.refresh = () => { if (UI.tab) renderSheet(); };
HOOK.closeCard = v => { if (UI.cardId === v.id) closeCard(); };
HOOK.star = () => {
  const dir = Math.random() < .5 ? 1 : -1;
  UIState.star = { t0: performance.now(), dur: 3200, x0: VW * (dir > 0 ? .1 : .9), y0: VH * (.1 + Math.random() * .12), vx: dir * VW * .75, vy: VH * .16 };
  msg('A shooting star streaks across the sky. Tap it!', 'myst');
};
HOOK.finale = () => {
  showModal(`<h1>The Bell of Echoes</h1><p>Its voice rolls over the hills, across the pond and out to sea. Old carvings seem to glow for a moment. Your villagers stop their work and listen.</p><p>Every mystery on this island has been uncovered. The village can keep growing for as long as you like, and there are still trophies to earn.</p><button class="btn" id="mOk">Keep playing</button>`);
  $('mOk').onclick = hideModal;
};

/* ================= MODALS ================= */
function showModal(html) { $('modalBox').innerHTML = html; $('modal').hidden = false; }
function hideModal() { $('modal').hidden = true; }
function introModal() {
  showModal(`<h1>Forgotten Village</h1><p>Five castaways have made camp on an island no map remembers. Keep them fed, help them grow, and uncover what this place is hiding.</p>
  <ul><li><b>Drag</b> a villager onto something to give them a job, or to try something new.</li>
  <li><b>Drag the ground</b> to look around. Use + and − to zoom.</li>
  <li><b>Tap</b> a villager to see their skills.</li>
  <li>Time keeps passing while you're away, about a year per hour.</li></ul>
  <button class="btn" id="mOk">Begin</button>`);
  $('mOk').onclick = () => { hideModal(); S.intro = true; };
}
function awayModal(r) {
  const h = Math.floor(r.real / 3600), m = Math.floor(r.real % 3600 / 60);
  const list = r.log.slice(-6).reverse().map(t => `<li>${esc(t)}</li>`).join('');
  showModal(`<h2>While you were away</h2><p class="sub" style="color:var(--muted)">${h ? h + 'h ' : ''}${m}m passed, about ${r.years.toFixed(1)} years on the island.</p>
  <div class="sumgrid"><div>Food<b>+${fmt(r.food)}</b></div><div>Lore<b>+${fmt(r.lore)}</b></div><div>Births<b>${r.births}</b></div><div>Passings<b>${r.deaths}</b></div></div>
  ${list ? `<div class="lab">Recent news</div><ul>${list}</ul>` : ''}<button class="btn" id="mOk">Back to the village</button>`);
  $('mOk').onclick = hideModal;
}

/* ================= SHEETS ================= */
const UI = { tab: null, cardId: 0, trFilter: -1, mystSel: null, cardMode: null, seenAch: 0 };
const TITLES = { vill: 'Villagers', tech: 'Village Tech', myst: 'Mysteries', tro: 'Trophies', col: 'Collection', menu: 'Menu', set: 'Settings' };
function openSheet(t) {
  sfx('tap'); UI.tab = t; $('sheet').hidden = false; $('sheetTitle').textContent = TITLES[t];
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  if (t === 'tro') { UI.seenAch = Date.now(); try { localStorage.setItem('fv_seen', UI.seenAch); } catch (e) {} }
  closeCard(); renderSheet(); $('sheetBody').scrollTop = 0; updHUD();
}
function closeSheet() { UI.tab = null; $('sheet').hidden = true; document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('on')); updHUD(); }
function renderSheet() {
  const b = $('sheetBody'); const st = b.scrollTop;
  b.innerHTML = ({ vill: sheetVill, tech: sheetTech, myst: sheetMyst, tro: sheetTro, col: sheetCol, menu: sheetMenu, set: sheetSettings })[UI.tab]();
  b.scrollTop = st;
  if (UI.tab === 'col') fillCurioIcons();
}
function jobLabel(v) {
  if (v.chief) return 'Warden';
  const s = stage(v);
  if (s === 'infant') return 'Baby'; if (s === 'child') return v.job === 'school' ? 'At school' : 'Child';
  return v.job ? ({ forage: 'Forager', build: 'Builder', research: 'Scholar', heal: 'Healer', parent: 'Parent' })[v.job] : 'No job';
}
function topSkill(v) { let bk = null, bx = -1; for (const k of SKILLS) if (v.sk[k] > bx) { bx = v.sk[k]; bk = k; } return bx >= RANK_XP[1] ? `${RANKS[rankOf(bx)]} ${NOUN[bk]}` : 'Untrained'; }
function sheetVill() {
  const vs = S.vill.slice().sort((a, b) => (b.chief - a.chief) || a.born - b.born);
  const kids = S.vill.filter(v => !grown(v)).length, eld = S.vill.filter(v => stage(v) === 'elder').length, sick = S.vill.filter(v => v.sick).length, preg = S.vill.filter(v => v.preg).length;
  let h = `<div class="sumgrid"><div>Adults<b>${S.vill.length - kids}</b></div><div>Children<b>${kids}</b></div><div>Elders<b>${eld}</b></div><div>Sick<b style="color:${sick ? 'var(--bad)' : ''}">${sick}</b></div></div>`;
  h += `<p class="sub">Room for ${popCap()}. ${preg ? preg + ' expecting. ' : ''}Tap a name to find them.</p><div class="vl">`;
  for (const v of vs) {
    const tags = (v.chief ? '<span class="tag chief">Warden</span> ' : '') + (v.sick ? '<span class="tag sick">Sick</span> ' : '') + (v.preg ? '<span class="tag preg">Expecting</span>' : '');
    h += `<button class="vi" data-v="${v.id}"><span class="av" style="background:${v.look.skin};color:${v.look.hair === '#171720' || v.look.hair === '#221811' ? '#fff' : '#2b1f17'}">${esc(v.name[0])}</span><span><span class="nm">${esc(v.name)}</span> <span class="meta">${v.sex === 'm' ? '♂' : '♀'} ${Math.floor(ageOf(v))}</span><br><span class="meta">${jobLabel(v)} · ${topSkill(v)}</span></span><span>${tags}</span></button>`;
  }
  return h + '</div>';
}
function sheetTech() {
  let h = `<p class="sub">You have <b style="color:var(--sand)">${fmt(S.lore)} Lore</b>. Scholars at the Study Stones earn more.</p>`;
  for (const t of TECHS) {
    const L = S.tech[t.id], cost = t.costs[L];
    const pips = [1, 2, 3].map(i => `<i style="background:${i <= L ? t.c : ''}"></i>`).join('');
    h += `<div class="tech"><h3><span style="color:${t.c}">●</span>${t.n}<span class="pips">${pips}</span></h3><p><b>Now:</b> ${esc(t.d[L - 1])}</p>`;
    if (L < 3) h += `<p><b>Next:</b> ${esc(t.d[L])}</p><div class="row"><button class="btn" data-buy="${t.id}" ${S.lore < cost ? 'disabled' : ''}>Buy level ${L + 1}</button><span class="sub" style="margin:0">${fmt(cost)} Lore</span></div>`;
    else h += `<p style="color:${t.c}"><b style="color:inherit">Mastered</b></p>`;
    h += '</div>';
  }
  return h;
}
const MYST_IMG = {};
function mystImg(id) {
  if (MYST_IMG[id]) return MYST_IMG[id];
  const art = MYSTM[id].art;
  const map = { spring: SPR.spring, hearthlit: SPR.hearth[3], hive: SPR.hive, shore: SPR.wreck, nets: SPR.nets, field: SPR.field, scarecrow: SPR.scarecrow, school: SPR.school, mantle: SPR.dais[0], circle: SPR.stoneLit[0], cauldron: SPR.cauldron[1], mending: SPR.mending, lodge: SPR.lodge, belfry: SPR.belfry };
  let spr = map[art];
  if (!spr && art === 'crown') spr = sprite(50, 50, g => { g.fillStyle = '#b8863a'; g.beginPath(); g.moveTo(-18, -4); g.quadraticCurveTo(-18, -34, 0, -36); g.quadraticCurveTo(18, -34, 18, -4); g.fill(); g.fillStyle = '#d8a84a'; g.beginPath(); g.ellipse(-6, -24, 5, 9, 0, 0, 7); g.fill(); ell(g, 0, -4, 18, 4, '#8a6428'); });
  if (!spr && art === 'tongue') spr = sprite(40, 50, g => { line(g, 0, -40, 0, -14, '#6a4a20', 3); ell(g, 0, -10, 7, 9, '#b8863a'); ell(g, -2, -12, 2.5, 4, '#d8a84a'); });
  MYST_IMG[id] = spr.c.toDataURL();
  return MYST_IMG[id];
}
function sheetMyst() {
  const n = Object.keys(S.myst).length;
  let h = `<p class="sub">${n} of 16 solved. Mysteries need the right mix of skills, tech, and earlier discoveries. Watch where villagers look curious (?).</p><div class="mgrid">`;
  for (const m of MYST) { const d = !!S.myst[m.id]; h += `<button class="mt ${d ? 'done' : 'locked'} ${UI.mystSel === m.id ? 'sel' : ''}" data-m="${m.id}"><img src="${mystImg(m.id)}" alt=""><span>${d ? esc(m.n) : '???'}</span></button>`; }
  h += '</div>';
  if (UI.mystSel) { const m = MYSTM[UI.mystSel], d = S.myst[m.id]; h += `<div class="hintbox"><h4>${d ? esc(m.n) : 'Unsolved mystery'}</h4>${d ? esc(m.done) : esc(m.hint) + (m.clue && S.myst.m8 ? '<br><br>' + esc(m.clue) : '')}</div>`; }
  else h += `<p class="sub" style="margin-top:12px">Tap a tile for a hint.</p>`;
  return h;
}
function sheetTro() {
  const got = ACH.filter(a => S.ach[a.id]).length;
  let h = `<div class="row"><b style="font-family:var(--display);font-size:22px">${got} / ${ACH.length}</b><span class="sub" style="margin:0">trophies earned</span></div><div class="prog"><i style="width:${got / ACH.length * 100}%"></i></div>`;
  h += `<div class="chips"><button data-f="-1" class="${UI.trFilter === -1 ? 'on' : ''}">All</button>` + ACH_CATS.map((c, i) => `<button data-f="${i}" class="${UI.trFilter === i ? 'on' : ''}">${c}</button>`).join('') + '</div><div class="al">';
  const list = ACH.filter(a => UI.trFilter < 0 || a.cat === UI.trFilter).slice().sort((a, b) => (S.ach[b.id] ? 1 : 0) - (S.ach[a.id] ? 1 : 0));
  for (const a of list) { const on = !!S.ach[a.id]; h += `<div class="ai ${on ? 'got' : ''}">${ICON.medal(on)}<div><b>${esc(a.n)}</b><span>${esc(a.d)}</span></div></div>`; }
  return h + '</div>';
}
function sheetCol() {
  const n = Object.keys(S.curios).length;
  let h = `<p class="sub">Children dig up curios that sparkle around the island. Each finished set makes room for 2 more villagers. Spares become Lore. ${n}/30 found.</p>`;
  CURIO_SETS.forEach((s, si) => {
    let cnt = 0; for (let i = 0; i < 6; i++) if (S.curios[si * 6 + i]) cnt++;
    h += `<div class="cset"><div class="row"><b>${s.n}</b><span class="sub" style="margin:0">${cnt === 6 ? '<span style="color:var(--gold)">Complete · +2 room</span>' : cnt + '/6'}</span></div><div class="cgrid">`;
    for (let i = 0; i < 6; i++) { const idx = si * 6 + i, c = S.curios[idx]; h += c ? `<div title="${esc(s.items[i])}" data-ci="${idx}">${c > 1 ? `<em>×${c}</em>` : ''}</div>` : '<div>?</div>'; }
    h += '</div></div>';
  });
  h += `<div class="lab">Brewing</div>`;
  if (!S.myst.m11) h += `<p class="sub">The cauldron is cracked. Mend it to start brewing with herbs.</p>`;
  else {
    const cur = S.cauldron.map(k => HERB[k].n).join(', ');
    h += `<p class="sub">Drag adults onto herbs to carry them to the cauldron. Three herbs make one brew; the last carrier drinks it. ${cur ? 'In the pot: ' + cur + '.' : 'The pot is empty.'}</p>`;
  }
  h += `<div class="herbkey">${HERBS.map(x => `<span><i style="background:${x.c}"></i>${x.n}</span>`).join('')}</div><div style="height:10px"></div>`;
  for (const r of RECIPES) {
    const k = !!S.recipes[r.k];
    const dots = k ? r.k.split(',').map(x => `<i style="background:${HERB[x].c}"></i>`).join('') : '<i></i><i></i><i></i>';
    h += `<div class="rec"><span class="dots">${dots}</span><div><b>${k ? esc(r.n) : 'Unknown brew'}</b><span>${k ? esc(r.d) : 'Keep experimenting.'}</span></div></div>`;
  }
  if (S.myst.m8 && !S.recipes[RECIPES[0].k]) h += `<p class="sub">Hall carving: ${esc(MYSTM.m15.clue)}</p>`;
  return h;
}
function fillCurioIcons() { document.querySelectorAll('.cgrid [data-ci]').forEach(d => { const c = curioIcon(+d.dataset.ci, 40); d.prepend(c); }); }
function sheetMenu() {
  const log = S.log.slice(0, 25).map(l => `<li style="color:${l.kind === 'bad' ? '#f0a098' : l.kind === 'good' ? '#a8e0c4' : l.kind === 'myst' ? 'var(--gold)' : 'var(--sand)'}"><span style="color:var(--muted);font-size:11px">Yr ${Math.floor(l.t / YEAR) + 1}</span> ${esc(l.text)}</li>`).join('');
  return `<div class="lab">Speed</div><div class="row" style="flex-wrap:wrap">${SPEEDS.map((s, i) => `<button class="btn ${S.speed === i ? '' : 'ghost'}" data-sp="${i}">${i ? s + '×' : 'Pause'}</button>`).join('')}</div>
  <p class="sub" style="margin-top:6px">At 1× a year takes 8 minutes. While the game is closed, time passes at about a year per hour (up to 12 hours).</p>
  <div class="row" style="margin-top:10px"><button class="btn ghost" id="mSet">Settings: sound, graphics, controls, updates</button></div>
  <div class="lab">Village chronicle</div><ul style="margin:0;padding-left:16px;font-size:13px;line-height:1.45;display:flex;flex-direction:column;gap:4px">${log || '<li>Nothing yet.</li>'}</ul>
  <div class="lab">Move your village to another device</div><p class="sub">Copy this code, then paste it into Load on the other device.</p>
  <div class="row"><button class="btn ghost" id="mExp">Copy save code</button><button class="btn ghost" id="mImpShow">Load a code</button></div>
  <div id="mImpBox" hidden style="margin-top:8px"><textarea id="mImpTxt" placeholder="Paste a save code here"></textarea><div class="row" style="margin-top:6px"><button class="btn" id="mImp">Load village</button><span class="sub" id="mImpMsg" style="margin:0"></span></div></div>
  <textarea id="mExpTxt" hidden readonly style="margin-top:8px"></textarea>
  <div class="lab">How to play</div><ul style="margin:0 0 6px;padding-left:16px;font-size:13px;line-height:1.5;color:var(--sand)">
  <li>Drop an adult on the <b>Berry Bramble</b>, <b>Study Stones</b>, or a <b>Hut Site</b> to make them a forager, scholar, or builder. Untrained villagers may need a few tries.</li>
  <li>Villagers improve with practice: Novice, Skilled, then Master.</li>
  <li>Drop someone on a <b>sick</b> villager to heal them. Drop a man onto a woman (or the reverse) to start a family.</li>
  <li>Only <b>children</b> can gather glowing mushrooms and dig up sparkling curios.</li>
  <li>Spend <b>Lore</b> on Tech. Tech, skills and earlier discoveries unlock the 16 mysteries.</li></ul>
  <div class="lab">Start over</div><div class="row"><button class="btn danger" id="mNew">New village</button></div><div id="mNewC" hidden style="margin-top:8px"><p class="sub">This erases your current village for good.</p><div class="row"><button class="btn danger" id="mNewY">Erase and start over</button><button class="btn ghost" id="mNewN">Keep playing</button></div></div>`;
}
function sheetClick(e) {
  const t = e.target.closest('button'); if (!t) return;
  if (UI.tab === 'set') { settingsClick(e); return; }
  sfx('tap');
  if (t.dataset.v) { const v = vById(+t.dataset.v); if (v) { closeSheet(); cam.x = v.x; cam.z = v.z; clampCam(); openCard(v); } return; }
  if (t.dataset.buy) { if (buyTech(t.dataset.buy)) { checkAch(); renderSheet(); updHUD(); } return; }
  if (t.dataset.m) { UI.mystSel = UI.mystSel === t.dataset.m ? null : t.dataset.m; renderSheet(); return; }
  if (t.dataset.f !== undefined) { UI.trFilter = +t.dataset.f; renderSheet(); return; }
  if (t.dataset.sp !== undefined) { S.speed = +t.dataset.sp; if (S.speed === 3) S.stats.fast = 1; renderSheet(); updHUD(); return; }
  switch (t.id) {
    case 'mSet': openSheet('set'); break;
    case 'mExp': { const code = exportSave(); const ta = $('mExpTxt'); ta.hidden = false; ta.value = code; const done = () => { t.textContent = 'Copied'; }; try { navigator.clipboard.writeText(code).then(done, () => { ta.select(); t.textContent = 'Select and copy below'; }); } catch (err) { ta.select(); } break; }
    case 'mImpShow': $('mImpBox').hidden = false; break;
    case 'mImp': { const ok = importSave($('mImpTxt').value.trim()); $('mImpMsg').textContent = ok ? '' : 'That code could not be read. Check that it was copied completely.'; if (ok) { closeSheet(); toast('Village loaded.', 'good'); } break; }
    case 'mNew': $('mNewC').hidden = false; break;
    case 'mNewN': $('mNewC').hidden = true; break;
    case 'mNewY': newGame(); saveGame(); closeSheet(); closeCard(); cam.x = SITE.hearth.x + 40; cam.z = SITE.hearth.z + 60; introModal(); break;
  }
}

/* ================= VILLAGER CARD ================= */
function openCard(v) { UI.cardId = v.id; UI.cardMode = null; UIState.selId = v.id; S.stats.cards++; $('card').hidden = false; renderCard(); }
function closeCard() { UI.cardId = 0; UIState.selId = 0; $('card').hidden = true; }
function renderCard() {
  const v = vById(UI.cardId); if (!v) { closeCard(); return; }
  if (UI.cardMode === 'rename' && document.activeElement && document.activeElement.id === 'rnIn') return;
  const s = stage(v), a = ageOf(v);
  const parents = v.par.map(id => vById(id)).filter(Boolean).map(p => p.name);
  let status = v.sick ? 'Sick' : v.hunger >= 100 ? 'Starving' : v.hunger > 60 ? 'Hungry' : 'Healthy';
  if (v.preg) status += ' · Expecting';
  let h = `<div class="row"><h3>${esc(v.name)}</h3><button class="x" id="cX" aria-label="Close">×</button></div>
  <div class="meta">${v.sex === 'm' ? 'Male' : 'Female'} · ${Math.floor(a)} years · ${s[0].toUpperCase() + s.slice(1)} · Gen ${v.gen}<br>${jobLabel(v)} · ${status}${parents.length ? ' · Child of ' + parents.map(esc).join(' & ') : ''}</div>
  <div class="bars"><span>Health</span><span class="bar"><i style="width:${v.health}%;background:var(--jade)"></i></span><span class="rk">${Math.round(v.health)}%</span>
  <span>Fullness</span><span class="bar"><i style="width:${100 - v.hunger}%;background:#e3a23a"></i></span><span class="rk">${Math.round(100 - v.hunger)}%</span>`;
  for (const k of SKILLS) {
    const xp = v.sk[k], r = rankOf(xp), next = RANK_XP[r + 1];
    const pct = r >= 3 ? 100 : (xp - RANK_XP[r]) / (next - RANK_XP[r]) * 100;
    h += `<span>${SK[k].n}</span><span class="bar"><i style="width:${pct}%;background:${SK[k].c}"></i></span><span class="rk">${RANKS[r]}</span>`;
  }
  h += '</div>';
  if (UI.cardMode === 'rename') h += `<div class="row" style="margin-top:10px"><input type="text" id="rnIn" maxlength="14" value="${esc(v.name)}" aria-label="New name"><button class="btn" id="rnOk">Save</button></div>`;
  else if (UI.cardMode === 'outfit') {
    h += `<div class="lab">Outfits · ${OUTFIT_COST} Lore each</div><div class="ofgrid">${OUTFITS.map((o, i) => `<button data-of="${i}" class="${v.look.out === i ? 'on' : ''}" ${S.lore < OUTFIT_COST && v.look.out !== i ? 'disabled' : ''}><i style="background:${o.c}"></i>${esc(o.n)}</button>`).join('')}</div>`;
  } else {
    h += `<div class="cardbtns"><button class="btn ghost" id="cRn">Rename</button>${S.myst.m13 && s !== 'infant' ? '<button class="btn ghost" id="cOf">Outfit</button>' : ''}${v.job && grown(v) ? '<button class="btn ghost" id="cJob">Clear job</button>' : ''}</div>`;
  }
  $('card').innerHTML = h;
}
function cardClick(e) {
  const t = e.target.closest('button'); if (!t) return;
  const v = vById(UI.cardId); if (!v) return;
  if (t.id === 'cX') { closeCard(); return; }
  if (t.id === 'cRn') { UI.cardMode = 'rename'; renderCard(); const i = $('rnIn'); i.focus(); i.select(); return; }
  if (t.id === 'rnOk') { const n = $('rnIn').value.trim().slice(0, 14); if (n && n !== v.name) { v.name = n; S.stats.renames++; } UI.cardMode = null; renderCard(); return; }
  if (t.id === 'cOf') { UI.cardMode = 'outfit'; renderCard(); return; }
  if (t.id === 'cJob') { v.job = null; v.task = null; v.st = 'idle'; v.timer = .5; renderCard(); return; }
  if (t.dataset.of !== undefined) { const i = +t.dataset.of; if (i !== v.look.out && S.lore >= OUTFIT_COST) { S.lore -= OUTFIT_COST; v.look.out = i; S.stats.outfits++; msg(`${v.name} is wearing a new ${OUTFITS[i].n}.`, 'good'); } UI.cardMode = null; renderCard(); }
}

/* ================= INPUT ================= */
const PTRS = new Map(); let PT = null, PINCH = null;
function hitVillager(sx, sy) {
  let best = null, bz = -1e9;
  for (const v of S.vill) {
    if (v.st === 'indoors' || stage(v) === 'infant') continue;
    const p = proj(v.x, v.z); if (!p) continue;
    const k = stage(v) === 'child' ? .7 : 1, s = p.s * k;
    if (Math.abs(sx - p.x) < 12 * s + 8 && sy > p.y - 44 * s - 8 && sy < p.y + 8 && v.z > bz) { bz = v.z; best = v; }
  }
  return best;
}
function footWorld(x, y) { return unproj(x, y + 14); }
function startDrag(v) {
  DRAG.v = v; S.stats.pickups++; v.task = null; v.carry = null; removeFromGroups(v); v.st = 'idle';
  cv.classList.add('dragging'); closeCard(); sfx('pick');
}
function endDrag(x, y) {
  const v = DRAG.v; DRAG.v = null; cv.classList.remove('dragging'); UIState.hover = null; UIState.pointer = null;
  if (!v) return;
  sfx('drop');
  const w = footWorld(x, y);
  if (w && w.x > 0 && w.x < WORLD.w && w.z > 0 && w.z < WORLD.h) dropVillager(v, w.x, w.z); else { v.st = 'idle'; v.timer = 1; }
  checkAch();
}
function initInput() {
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    const L = toLocal(e);
    PTRS.set(e.pointerId, toLocal(e));
    if (PTRS.size === 2) {
      const [a, b] = [...PTRS.values()];
      if (DRAG.v) { const v = DRAG.v; DRAG.v = null; v.st = 'idle'; v.timer = 1; cv.classList.remove('dragging'); }
      PINCH = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.zoom }; PT = null; return;
    }
    PT = { id: e.pointerId, x0: L.x, y0: L.y, t0: performance.now(), mode: 'pending', v: hitVillager(L.x, L.y), cx: cam.x, cz: cam.z };
  });
  cv.addEventListener('pointermove', e => {
    const L = toLocal(e);
    if (PTRS.has(e.pointerId)) PTRS.set(e.pointerId, L);
    if (PINCH && PTRS.size === 2) { const [a, b] = [...PTRS.values()]; cam.zoom = PINCH.z * Math.pow(Math.hypot(a.x - b.x, a.y - b.y) / PINCH.d, CFG.zoomSpd); clampCam(); return; }
    if (!PT || PT.id !== e.pointerId) return;
    const dx = L.x - PT.x0, dy = L.y - PT.y0;
    if (PT.mode === 'pending' && Math.hypot(dx, dy) > 7) {
      if (PT.v) { PT.mode = 'drag'; startDrag(PT.v); } else PT.mode = 'pan';
    }
    if (PT.mode === 'pan') { const k = CFG.pan * (CFG.invert ? -1 : 1); cam.x = PT.cx - k * dx / cam.zoom; cam.z = PT.cz - k * dy / (CHR * cam.zoom); clampCam(); }
    if (PT.mode === 'drag' && DRAG.v) {
      UIState.pointer = { x: L.x, y: L.y };
      const w = footWorld(L.x, L.y); UIState.hover = w ? findTarget(w.x, w.z, DRAG.v) : null;
    }
  });
  const up = e => {
    PTRS.delete(e.pointerId);
    if (PTRS.size < 2) PINCH = null;
    if (!PT || PT.id !== e.pointerId) return;
    const L = toLocal(e);
    if (PT.mode === 'drag') endDrag(L.x, L.y);
    else if (PT.mode === 'pending') tap(L.x, L.y, PT.v);
    PT = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { const L = toLocal(e); if (PT && PT.mode === 'drag') endDrag(L.x, L.y); PTRS.delete(e.pointerId); PT = null; PINCH = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); cam.zoom *= Math.pow(e.deltaY > 0 ? .9 : 1.1, CFG.zoomSpd); clampCam(); }, { passive: false });
  $('sheetBody').addEventListener('click', sheetClick);
  $('card').addEventListener('click', cardClick);
  $('card').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'rnIn') $('rnOk').click(); });
  window.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if (e.key === ' ') { S.speed = S.speed ? 0 : 1; updHUD(); e.preventDefault(); } if (e.key === 'Escape') { closeSheet(); closeCard(); } });
}
function tap(x, y, v) {
  const st = UIState.star;
  if (st && st.x !== undefined && Math.hypot(x - st.x, y - st.y) < 50) { UIState.star = null; S.stats.stars++; addLore(300); msg('You caught the falling star! +300 Lore.', 'good'); checkAch(); return; }
  if (v) { openCard(v); return; }
  if (UI.cardId) { closeCard(); return; }
  if (UI.tab) { closeSheet(); return; }
  const w = unproj(x, y); if (!w) return;
  const tg = findTarget(w.x, w.z, null);
  if (tg.kind === 'site') toast(esc(siteInfo(tg.s)));
  else if (tg.kind === 'item') toast(esc(tg.it.type === 'herb' ? `${HERB[tg.it.sub].n}. Drag an adult here to carry it to the cauldron.` : tg.it.type === 'glow' ? 'A glowcap mushroom. Drag a child onto it to bring it to the larder.' : 'Something sparkles in the dirt. Drag a child onto it to dig it up.'));
}
function siteInfo(s) {
  const n = siteName(s), p = projBySite(s.id) || (s.hut !== undefined ? null : null);
  if (p && !p.done) return `${n}: ${Math.round(p.prog / p.need * 100)}% built. Drag builders here.`;
  switch (s.id) {
    case 'larder': return `Larder: ${fmt(S.food)} food stored.`;
    case 'bramble': return `Berry Bramble: ${S.bramble < 5 ? 'picked clean' : Math.round(S.bramble / 15) + '% full'}. Drag an adult here to forage.`;
    case 'study': return 'Study Stones. Drag an adult here to research and earn Lore.';
    case 'hearth': return S.fire.lit ? `Hearth fire: ${Math.round(S.fire.fuel)}% fuel. Builders keep it fed.` : 'A cold hearth.';
    case 'hive': return S.myst.m3 ? `Hive Tree: ${Math.round(S.hive / 8)}% honey. Drag an adult here to forage.` : 'Hive Tree. The bees look fierce.';
    case 'terrace': return S.myst.m6 ? 'Terrace Field. Drag an adult here to farm.' : n + '.';
    case 'nets': return S.myst.m5 ? 'Tide Nets. Drag an adult here to fish.' : n + '.';
    case 'cauldron': return S.myst.m11 ? `Cauldron: ${S.cauldron.length}/3 herbs.` : n + '.';
  }
  return n + '. Drag a villager here to see what they make of it.';
}

/* ================= SAVE ================= */
const SAVE_KEY = 'forgotten_village_v1';
function saveGame() { if (!S) return; S.savedAt = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function hydrate(o) {
  const base = S; newGame(); const fresh = S; S = base;
  for (const k in fresh) if (o[k] === undefined) o[k] = fresh[k];
  for (const k in fresh.stats) if (o.stats[k] === undefined) o.stats[k] = fresh.stats[k];
  for (const k in fresh.ms) if (o.ms[k] === undefined) o.ms[k] = fresh.ms[k];
  if ((o.ver || 1) < 2) { // v0.1 saves used a map half the size
    const m = p => { p.x = 2000 + (p.x - 1000) * 1.35; p.z = 1440 + (p.z - 720) * 1.35; };
    for (const v of o.vill) { m(v); v.tx = v.x; v.tz = v.z; v.task = null; if (v.st === 'walk' || v.st === 'swim') v.st = 'idle'; }
    for (const it of o.items) { it.x = 2000 + (it.x - 1000) * 2; it.z = 1440 + (it.z - 720) * 2; }
    for (const p of o.projects) { const st = SITE[p.site]; if (st) { p.x = st.x; p.z = st.z; } }
    o.ver = 2;
  }
  if (o.ver < 3) { // v0.3 mirrored the map west-to-east
    for (const v of o.vill) { v.x = 4000 - v.x; v.tx = v.x; v.tz = v.z; v.task = null; if (v.st === 'walk' || v.st === 'swim') v.st = 'idle'; }
    for (const it of o.items) it.x = 4000 - it.x;
    for (const p of o.projects) { const st = SITE[p.site]; if (st) { p.x = st.x; p.z = st.z; } }
    o.ver = 3;
  }
  return o;
}
function loadGame() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; const o = JSON.parse(raw); if (!o || !o.vill) return false; S = hydrate(o); return true; } catch (e) { return false; } }
function exportSave() { S.savedAt = Date.now(); return 'FV1.' + btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function importSave(code) {
  try { if (!code.startsWith('FV1.')) return false; const o = JSON.parse(decodeURIComponent(escape(atob(code.slice(4))))); if (!o || !o.vill) return false; S = hydrate(o); S.savedAt = Date.now(); saveGame(); return true; } catch (e) { return false; }
}
