'use strict';
/* ================= SETTINGS, SOUND, CONTROLS, UPDATES =================
   Settings are stored on the device (not in the village save), so they survive
   starting a new village and game updates. */
const BUILD = __BUILD__, BUILD_LABEL = '__BUILD_LABEL__', DEFAULT_UPDATE_URL = '__UPDATE_URL__';
const CFG_KEY = 'fv_settings_v1';
const CFG = { vol: { m: 80, a: 60, s: 80 }, mute: false, weather: true, res: 'high', fps: 60, pan: 1, invert: false, zoomSpd: 1, autoCheck: true, updUrl: '', lastCheck: 0 };
(function loadCfg() {
  try {
    const o = JSON.parse(localStorage.getItem(CFG_KEY) || 'null');
    if (o) { for (const k in o) if (k === 'vol') Object.assign(CFG.vol, o.vol); else if (k in CFG) CFG[k] = o[k]; }
  } catch (e) {}
})();
function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(CFG)); } catch (e) {} }
function dprCap() { return S && S.settings.low ? 1 : CFG.res === 'low' ? 1 : CFG.res === 'med' ? 1.5 : 2; }

/* ---------------- Sound (all synthesised, no audio files) ---------------- */
const AUD = { ctx: null, master: null, amb: null, sfx: null, cricket: null, started: false, noise: null };
function audInit() {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); return; }
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const c = AUD.ctx = new A();
    AUD.master = c.createGain(); AUD.amb = c.createGain(); AUD.sfx = c.createGain();
    AUD.amb.connect(AUD.master); AUD.sfx.connect(AUD.master); AUD.master.connect(c.destination);
    const len = c.sampleRate * 3, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let b0 = 0; for (let i = 0; i < len; i++) { b0 = b0 * .97 + (Math.random() * 2 - 1) * .03; d[i] = b0 * 9; } // brown-ish noise
    AUD.noise = buf;
    const loop = (freq, q, type, g0, lfoHz, lfoDepth) => {
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); g.gain.value = g0;
      const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfoHz; lg.gain.value = lfoDepth; l.connect(lg); lg.connect(g.gain);
      s.connect(f); f.connect(g); g.connect(AUD.amb); s.start(); l.start();
    };
    loop(420, .6, 'lowpass', .34, .09, .2);      // surf
    loop(900, .5, 'bandpass', .05, .05, .035);   // wind in the leaves
    // crickets
    const co = c.createOscillator(); co.type = 'sine'; co.frequency.value = 4300;
    const cg = c.createGain(); cg.gain.value = 0; const cl = c.createOscillator(), clg = c.createGain(); cl.frequency.value = 16; clg.gain.value = .5; cl.connect(clg);
    const cm = c.createGain(); cm.gain.value = .5; clg.connect(cm.gain); co.connect(cm); cm.connect(cg); cg.connect(AUD.amb); co.start(); cl.start(); AUD.cricket = cg;
    audApply(); audBirds(); audTick();
  } catch (e) { AUD.ctx = null; }
}
function audApply() {
  if (!AUD.ctx) return;
  const t = AUD.ctx.currentTime, m = CFG.mute ? 0 : (CFG.vol.m / 100) ** 1.6;
  AUD.master.gain.setTargetAtTime(m, t, .05); AUD.amb.gain.setTargetAtTime((CFG.vol.a / 100) ** 1.6, t, .1); AUD.sfx.gain.setTargetAtTime((CFG.vol.s / 100) ** 1.6, t, .05);
}
function audTick() {
  if (!AUD.ctx) return;
  try { const n = typeof nightAmount === 'function' ? nightAmount() : 0; AUD.cricket.gain.setTargetAtTime(n > .3 ? .05 * n : 0, AUD.ctx.currentTime, 1.5); } catch (e) {}
  setTimeout(audTick, 1500);
}
function audBirds() {
  if (!AUD.ctx) return;
  try {
    const n = typeof nightAmount === 'function' ? nightAmount() : 0;
    if (n < .25 && !document.hidden && !CFG.mute) {
      const c = AUD.ctx, t0 = c.currentTime, cnt = 1 + Math.floor(Math.random() * 3), base = 2200 + Math.random() * 1800;
      for (let i = 0; i < cnt; i++) {
        const o = c.createOscillator(), g = c.createGain(), t = t0 + i * (.11 + Math.random() * .05);
        o.type = 'sine'; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.15 + Math.random() * .35), t + .07); o.frequency.exponentialRampToValueAtTime(base * .9, t + .13);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + .14);
        o.connect(g); g.connect(AUD.amb); o.start(t); o.stop(t + .16);
      }
    }
  } catch (e) {}
  setTimeout(audBirds, 2500 + Math.random() * 7000);
}
function sfx(kind) {
  if (!AUD.ctx || CFG.mute) return;
  try {
    const c = AUD.ctx, t = c.currentTime;
    const note = (f, at, dur, type, vol, f2) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t + at);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
      g.gain.setValueAtTime(0, t + at); g.gain.linearRampToValueAtTime(vol || .25, t + at + .008); g.gain.exponentialRampToValueAtTime(.0008, t + at + dur);
      o.connect(g); g.connect(AUD.sfx); o.start(t + at); o.stop(t + at + dur + .02);
    };
    switch (kind) {
      case 'tap': note(620, 0, .07, 'sine', .16, 480); break;
      case 'pick': note(300, 0, .12, 'sine', .22, 520); break;
      case 'drop': note(420, 0, .14, 'triangle', .25, 260); break;
      case 'good': note(523, 0, .14, 'sine', .2); note(659, .09, .2, 'sine', .2); break;
      case 'bad': note(200, 0, .22, 'triangle', .22, 140); break;
      case 'trophy': [523, 659, 784, 1047].forEach((f, i) => note(f, i * .09, .35, 'sine', .22)); break;
    }
  } catch (e) {}
}
function installAudioHooks() {
  const t = HOOK.toast, tr = HOOK.trophy;
  HOOK.toast = (text, kind) => { if (kind === 'good') sfx('good'); else if (kind === 'bad') sfx('bad'); return t(text, kind); };
  HOOK.trophy = list => { sfx('trophy'); return tr(list); };
  const unlock = () => { audInit(); };
  window.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('visibilitychange', () => { if (AUD.ctx) { if (document.hidden) AUD.ctx.suspend(); else AUD.ctx.resume(); } });
}

/* ---------------- Native bridge and updates ---------------- */
const NATIVE = typeof window.Android !== 'undefined' ? window.Android : null;
const UPD = { state: 'idle', msg: '', info: null, native: null, busy: false };
function updUrl() { let u = (CFG.updUrl || DEFAULT_UPDATE_URL || '').trim(); if (u && !u.endsWith('/')) u += '/'; return u; }
window.fvNative = {
  onCheck(json) {
    UPD.busy = false; let r; try { r = JSON.parse(json); } catch (e) { r = { ok: false, error: 'Bad reply' }; }
    CFG.lastCheck = Date.now(); saveCfg();
    if (!r.ok) { UPD.state = 'error'; UPD.msg = r.error || 'Could not check for updates.'; }
    else if (r.latest > BUILD_ACTIVE()) { UPD.state = 'available'; UPD.info = r; UPD.msg = ''; if (UPD.quiet) toast('A game update is available. Open Settings to install it.', 'good'); }
    else { UPD.state = 'current'; UPD.msg = 'You have the newest version.'; }
    UPD.quiet = false; refreshSettings(); updGear();
  },
  onApply(json) {
    UPD.busy = false; let r; try { r = JSON.parse(json); } catch (e) { r = { ok: false, error: 'Bad reply' }; }
    if (r.ok) { UPD.state = 'ready'; UPD.msg = 'Update downloaded.'; } else { UPD.state = 'error'; UPD.msg = r.error || 'The download failed.'; }
    refreshSettings(); updGear();
  },
  onProgress(pct) { UPD.msg = 'Downloading… ' + pct + '%'; const el = document.getElementById('updMsg'); if (el) el.textContent = UPD.msg; }
};
function nativeInfo() { if (UPD.native) return UPD.native; try { UPD.native = NATIVE ? JSON.parse(NATIVE.info()) : {}; } catch (e) { UPD.native = {}; } return UPD.native; }
function BUILD_ACTIVE() { return BUILD; }
function checkUpdate(quiet) {
  if (!NATIVE || UPD.busy) return;
  const u = updUrl(); if (!u) { UPD.state = 'error'; UPD.msg = 'No update address set. Add it under Update address below.'; refreshSettings(); return; }
  UPD.busy = true; UPD.quiet = !!quiet; UPD.state = 'checking'; UPD.msg = 'Checking…'; refreshSettings();
  try { NATIVE.check(u); } catch (e) { UPD.busy = false; UPD.state = 'error'; UPD.msg = 'Update check is not available in this app.'; refreshSettings(); }
}
function applyUpdate() {
  if (!NATIVE || UPD.busy) return;
  UPD.busy = true; UPD.state = 'downloading'; UPD.msg = 'Downloading…'; refreshSettings();
  try { NATIVE.apply(updUrl()); } catch (e) { UPD.busy = false; UPD.state = 'error'; UPD.msg = 'The download failed.'; refreshSettings(); }
}
function updGear() { const g = document.getElementById('gear'); if (g) g.classList.toggle('dot', UPD.state === 'available' || UPD.state === 'ready'); }
function refreshSettings() { if (UI.tab === 'set') { const b = document.getElementById('sheetBody'), st = b.scrollTop, f = document.activeElement && document.activeElement.id; renderSheet(); b.scrollTop = st; } }

/* ---------------- Settings sheet ---------------- */
function seg(cfgKey, opts, cur) { return `<div class="seg">${opts.map(([v, n]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-seg="${cfgKey}" data-val="${v}">${n}</button>`).join('')}</div>`; }
function slider(key, label, val, min, max, step, unit) { return `<div class="srow"><label for="r_${key}">${label}</label><input type="range" class="rng" id="r_${key}" data-rng="${key}" min="${min}" max="${max}" step="${step || 1}" value="${val}"><output id="o_${key}">${unit ? unit(val) : val}</output></div>`; }
const pctU = v => v + '%', xU = v => (+v).toFixed(2).replace(/0$/, '') + '×';
function sheetSettings() {
  const ni = nativeInfo(), u = updUrl();
  let upd;
  if (!NATIVE) upd = `<p class="sub">You are playing in a web browser. This copy is already the newest version each time the page loads. In-app updating works in the Android app.</p>`;
  else {
    const st = UPD.state;
    let action = `<button class="btn" id="uCheck" ${UPD.busy ? 'disabled' : ''}>Check for updates</button>`;
    if (st === 'available') action = `<button class="btn" id="uApply">Download update</button><button class="btn ghost" id="uCheck">Check again</button>`;
    if (st === 'ready') action = `<button class="btn" id="uRestart">Restart to finish</button>`;
    if (st === 'checking' || st === 'downloading') action = `<button class="btn" disabled>${st === 'checking' ? 'Checking…' : 'Downloading…'}</button>`;
    const notes = st === 'available' && UPD.info ? `<p class="sub"><b>New version ${esc(UPD.info.label || '')}</b>${UPD.info.notes ? '<br>' + esc(UPD.info.notes) : ''}</p>` : '';
    upd = `<div class="row" style="flex-wrap:wrap">${action}</div><p class="sub" id="updMsg" style="margin-top:6px;${st === 'error' ? 'color:var(--bad)' : ''}">${esc(UPD.msg)}</p>${notes}
    <div class="srow tog"><label>Check automatically when the game opens</label>${seg('autoCheck', [[1, 'On'], [0, 'Off']], CFG.autoCheck ? 1 : 0)}</div>
    <details style="margin-top:6px"><summary class="sub" style="cursor:pointer">Advanced</summary>
      <div class="lab" style="margin-top:8px">Update address</div><input type="text" id="uUrl" class="txt" placeholder="https://raw.githubusercontent.com/you/repo/main/forgotten-village/" value="${esc(CFG.updUrl || '')}">
      <p class="sub" style="margin-top:4px">${u ? 'Currently using: ' + esc(u) : 'Nothing set yet.'}</p>
      <div class="row" style="flex-wrap:wrap"><button class="btn ghost" id="uSaveUrl">Save address</button>${ni.override ? '<button class="btn ghost" id="uReset">Go back to the built-in version</button>' : ''}</div>
    </details>`;
  }
  return `<div class="lab">Sound</div>
  ${slider('vol.m', 'Master volume', CFG.vol.m, 0, 100, 1, pctU)}${slider('vol.a', 'Nature ambience', CFG.vol.a, 0, 100, 1, pctU)}${slider('vol.s', 'Effects', CFG.vol.s, 0, 100, 1, pctU)}
  <div class="srow tog"><label>Mute everything</label>${seg('mute', [[1, 'Muted'], [0, 'Sound on']], CFG.mute ? 1 : 0)}</div>
  <div class="lab">Graphics</div>
  <div class="srow tog"><label>Battery saver</label>${seg('low', [[1, 'On'], [0, 'Off']], S.settings.low ? 1 : 0)}</div>
  <div class="srow tog"><label>Sharpness</label>${seg('res', [['low', 'Low'], ['med', 'Medium'], ['high', 'High']], CFG.res)}</div>
  <div class="srow tog"><label>Frame rate</label>${seg('fps', [[30, '30'], [60, '60']], CFG.fps)}</div>
  <div class="srow tog"><label>Weather effects</label>${seg('weather', [[1, 'On'], [0, 'Off']], CFG.weather ? 1 : 0)}</div>
  <div class="srow tog"><label>Screen</label>${seg('orient', [['auto', 'Sideways'], ['portrait', 'Upright']], S.settings.orient === 'portrait' ? 'portrait' : 'auto')}</div>
  <div class="lab">Controls</div>
  ${slider('pan', 'Drag speed', CFG.pan, .5, 2, .05, xU)}${slider('zoomSpd', 'Zoom speed', CFG.zoomSpd, .5, 2, .05, xU)}
  <div class="srow tog"><label>Dragging the map</label>${seg('invert', [[0, 'Moves the map'], [1, 'Moves the view']], CFG.invert ? 1 : 0)}</div>
  <p class="sub">Drag a villager to move them. Drag empty ground to look around. Pinch, the + and − buttons, or the scroll wheel zoom.</p>
  <div class="lab">Updates</div>
  <p class="sub" style="margin:0 0 6px">Game version <b>${esc(BUILD_LABEL)}</b>${ni.app ? ' · app ' + esc(ni.app) : ''}${ni.override ? ' · updated copy in use' : ''}</p>
  ${upd}
  <div class="lab">Your village</div><p class="sub">Settings are kept on this device and are not lost when you start a new village or install an update.</p>
  <div class="row"><button class="btn ghost" id="sDefaults">Restore default settings</button></div>`;
}
function settingsRange(el) {
  const key = el.dataset.rng, v = +el.value;
  if (key.startsWith('vol.')) { CFG.vol[key.slice(4)] = v; audInit(); audApply(); if (key === 'vol.s') { clearTimeout(settingsRange.t); settingsRange.t = setTimeout(() => sfx('good'), 120); } }
  else CFG[key] = v;
  const o = document.getElementById('o_' + key); if (o) o.textContent = key.startsWith('vol.') ? v + '%' : xU(v);
  saveCfg();
}
function settingsClick(e) {
  const t = e.target.closest('button'); if (!t) return false;
  if (t.dataset.seg) {
    const k = t.dataset.seg, v = t.dataset.val;
    if (k === 'mute') { CFG.mute = v === '1'; audInit(); audApply(); }
    else if (k === 'low') { S.settings.low = v === '1'; resize(); }
    else if (k === 'res') { CFG.res = v; resize(); }
    else if (k === 'fps') CFG.fps = +v;
    else if (k === 'weather') CFG.weather = v === '1';
    else if (k === 'orient') { if (window.innerHeight > window.innerWidth || ROT) { S.settings.orient = v === 'portrait' ? 'portrait' : 'auto'; resize(); } else toast('Your screen is already sideways. Turn your device upright to play in portrait.'); }
    else if (k === 'invert') CFG.invert = v === '1';
    else if (k === 'autoCheck') CFG.autoCheck = v === '1';
    saveCfg(); sfx('tap'); refreshSettings(); return true;
  }
  switch (t.id) {
    case 'uCheck': checkUpdate(false); return true;
    case 'uApply': applyUpdate(); return true;
    case 'uRestart': try { saveGame(); NATIVE.reload(); } catch (err) { location.reload(); } return true;
    case 'uReset': try { saveGame(); NATIVE.resetUpdate(); } catch (err) {} return true;
    case 'uSaveUrl': { const v = document.getElementById('uUrl').value.trim(); CFG.updUrl = v; saveCfg(); UPD.state = 'idle'; UPD.msg = v ? 'Address saved.' : 'Address cleared.'; refreshSettings(); return true; }
    case 'sDefaults': { const keep = CFG.updUrl; Object.assign(CFG, { vol: { m: 80, a: 60, s: 80 }, mute: false, weather: true, res: 'high', fps: 60, pan: 1, invert: false, zoomSpd: 1, autoCheck: true }); CFG.updUrl = keep; S.settings.low = false; saveCfg(); audApply(); resize(); refreshSettings(); return true; }
  }
  return false;
}
function initSettings() {
  installAudioHooks();
  const g = document.getElementById('gear'); if (g) g.onclick = () => { sfx('tap'); if (UI.tab === 'set') closeSheet(); else openSheet('set'); };
  document.getElementById('sheetBody').addEventListener('input', e => { if (e.target.dataset && e.target.dataset.rng) settingsRange(e.target); });
  if (NATIVE && CFG.autoCheck && updUrl() && Date.now() - CFG.lastCheck > 3 * 3600 * 1000) setTimeout(() => checkUpdate(true), 4000);
}
