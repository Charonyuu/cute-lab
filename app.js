/* =====================================================================
   Cute Lab · app (UI)
   Built entirely from the registries: a new style file shows up in the
   tabs, thumbnails, dice, presets, morph playlist and exports by itself.
   ===================================================================== */
(() => {
'use strict';
const K = CUTE, R = K.R, X = K.X, $ = s => document.querySelector(s);
const { TAU, PI, clamp, hexToRgb, contrast, bump } = K;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const dpr = () => Math.min(window.devicePixelRatio || 1, 2.5);
function fit(cv, w, h = w) { const d = dpr(), W = Math.round(w * d), H = Math.round(h * d); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } cv.style.width = w + 'px'; cv.style.height = h + 'px'; const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h); return x; }
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

const SHAPES = K.visible('shape'), STATES = K.reg.state, PALETTE = K.reg.color, INKS = R.INKS;
const shapeOf = R.shapeOf, eyeDef = R.eyeDef;
const EXPRS = K.visible('eye').flatMap(e => (e.ring || ['none']).map(b => [e.id, b]));
const INK_ZH = { auto: T('自動'), dark: T('黑'), light: T('白') };
const stName = st => CUTE_I18N.LANG === 'zh' ? st.zh || st.label : st.label;

/* ================= state ================= */
const KEY = 'cute-lab-v2';
let S = { ...K.P('round', '#1ED8C0', 'toon'), png: 512, svgAnim: true, gifBg: 'white' };
/* morph & video settings (not part of the share link) */
const M = { on: false, hold: 1.2, dur: 1.1, order: 'seq', list: SHAPES.map(s => s.id), seq: [], t0: 0, recBg: 'green', recSize: 1080, stageBg: 'soft' };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (s && typeof s === 'object') { for (const k of ['png', 'svgAnim', 'gifBg']) if (s[k] != null) S[k] = s[k];
    for (const k of ['hold', 'dur', 'order', 'recBg', 'recSize', 'stageBg']) if (s.m && s.m[k] != null) M[k] = s.m[k];
    if (s.m && Array.isArray(s.m.list)) { const ok = s.m.list.filter(id => K.get('shape', id)); if (ok.length >= 2) M.list = ok; } } } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ png: S.png, svgAnim: S.svgAnim, gifBg: S.gifBg, m: { hold: M.hold, dur: M.dur, order: M.order, list: M.list, recBg: M.recBg, recSize: M.recSize, stageBg: M.stageBg } })); } catch (e) {} };
const ART_URL = location.origin + location.pathname;
let stateIdx = 0, stateSince = performance.now();
const token = () => R.encode(S, stateIdx);
let fromLink = null; try { fromLink = R.decode(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
if (fromLink) Object.assign(S, fromLink.o);
function updateHash() { try { history.replaceState(null, '', '#' + token()); } catch (e) {} }
R.pageInk = '#2B2320';
const plain = o => ({ ...o, finish: 'flat', acc: 'none', cheeks: 'none', mouth: 'none', tilt: 0 });
function paint(cv, sz, o, st = STATES[0], u = .34, cy = .54) { const c = fit(cv, sz); R.drawBlob(c, sz, o, R.REST(st), { u, cy }); }

let toastT = 0; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }

/* ================= inspector: tabs + thumbnail tiles ================= */
const TABS = [['shape', T('形狀')], ['face', T('臉')], ['style', T('風格')], ['motion', T('動態')], ['presets', T('預設')]];
let tab = 'shape';
const tabBtns = TABS.map(([id, label]) => { const b = el('button', null, label); b.type = 'button'; b.setAttribute('role', 'tab'); b.addEventListener('click', () => setTab(id)); $('#tabs').appendChild(b); return { b, id }; });
function setTab(id) { tab = id; tabBtns.forEach(t => t.b.setAttribute('aria-selected', String(t.id === id)));
  document.querySelectorAll('.panel').forEach(p => p.hidden = p.dataset.tab !== id); tilesDirty = true; }
/* every thumbnail: which tab it lives in, how to draw it, whether it is selected */
const tiles = [];
function tile(host, tabId, { label, sz = 58, u = .32, cy = .55, make, on, click, title }) {
  const b = el('button', 'tile'); b.type = 'button'; if (title) b.title = title; const cv = el('canvas'); cv.setAttribute('aria-hidden', 'true');
  b.append(cv, el('span', null, label)); b.setAttribute('aria-label', label); b.addEventListener('click', click); $(host).appendChild(b);
  const t = { b, cv, tab: tabId, sz, u, cy, make, on }; tiles.push(t); return t;
}
function chips(host, list, isOn, click) { return list.map(it => { const b = el('button', 'chip', it.label); b.type = 'button'; b.addEventListener('click', () => click(it.id)); $(host).appendChild(b); return { b, it, isOn }; }); }
const chipSets = [];

/* shape */
SHAPES.forEach(sh => tile('#tShape', 'shape', { label: sh.label, sz: 62, make: () => ({ ...S, shape: sh.id }), on: () => S.shape === sh.id, click: () => setShape(sh.id) }));
/* face: shown on a round body so tiny details stay readable */
const faceBody = () => ({ ...plain(S), shape: 'round', size: 100, gap: 100 });
K.visible('eye').forEach(e => tile('#tEyes', 'face', { label: e.label, u: .4, cy: .52, make: () => ({ ...faceBody(), eyes: e.id, brows: 'none' }), on: () => S.eyes === e.id, click: () => set({ eyes: e.id }) }));
chipSets.push(chips('#cBrows', K.reg.brow, it => S.brows === it.id, id => set({ brows: id })));
K.visible('mouth').forEach(m => tile('#tMouth', 'face', { label: m.label, u: .44, cy: .46, make: () => ({ ...faceBody(), eyes: S.eyes, mouth: m.id }), on: () => S.mouth === m.id, click: () => set({ mouth: m.id }) }));
K.visible('cheek').forEach(ch => tile('#tCheeks', 'face', { label: ch.label, u: .44, cy: .5, make: () => ({ ...faceBody(), eyes: S.eyes, cheeks: ch.id }), on: () => S.cheeks === ch.id, click: () => set({ cheeks: ch.id }) }));
chipSets.push(chips('#cInk', INKS.map(i => ({ ...i, label: INK_ZH[i.id] || i.label })), it => S.ink === it.id, id => set({ ink: id })));
const ranges = [['#fSize', '#oSize', 'size', v => v + '%'], ['#fGap', '#oGap', 'gap', v => v + '%'], ['#fTilt', '#oTilt', 'tilt', v => (v > 0 ? '+' : '') + v + '°']];
ranges.forEach(([i, , key]) => $(i).addEventListener('input', e => set({ [key]: +e.target.value })));
/* style */
const swBtns = PALETTE.map(p => { const b = el('button', 'sw'); b.type = 'button'; b.style.background = p.hex; b.title = p.label; b.setAttribute('aria-label', p.label); b.addEventListener('click', () => set({ color: p.hex })); $('#swatches').appendChild(b); return { b, hex: p.hex }; });
const cw = el('span', 'sw custom', `<input type="color" aria-label="${T('自訂顏色')}">`); cw.title = T('自訂顏色'); $('#swatches').appendChild(cw);
const fCustom = cw.querySelector('input'); fCustom.addEventListener('input', () => set({ color: fCustom.value.toUpperCase() }));
K.visible('finish').forEach(f => tile('#tFinish', 'style', { label: f.label, make: () => ({ ...S, finish: f.id }), on: () => S.finish === f.id, click: () => set({ finish: f.id }) }));
K.visible('accessory').forEach(a => tile('#tAcc', 'style', { label: a.label, u: .26, cy: .62, make: () => ({ ...S, acc: a.id }), on: () => S.acc === a.id, click: () => set({ acc: a.id }) }));
/* presets */
K.reg.family.forEach(fam => { const sec = el('div', 'sec', `<h4>${fam.label}</h4>`), g = el('div', 'tiles sm'); g.id = 'fam-' + fam.id; sec.appendChild(g); $('#presetList').appendChild(sec);
  fam.items.forEach((it, i) => tile('#fam-' + fam.id, 'presets', { label: shapeOf(it).label, make: () => it, on: () => false, click: () => set({ ...it }) })); });
/* motion */
const mRanges = [['#mHold', '#oHold', 'hold'], ['#mDur', '#oDur', 'dur']];
mRanges.forEach(([i, , key]) => $(i).addEventListener('input', e => { M[key] = +e.target.value; restartAuto(); syncMotion(); save(); }));
chipSets.push(chips('#cOrder', [{ id: 'seq', label: T('依序') }, { id: 'random', label: T('隨機') }], it => M.order === it.id, id => { M.order = id; buildSeq(); restartAuto(); syncMotion(); save(); }));
const playTiles = SHAPES.map(sh => tile('#tPlaylist', 'motion', { label: sh.label, sz: 50, make: () => ({ ...plain(S), shape: sh.id, eyes: S.eyes }), on: () => M.list.includes(sh.id),
  click: () => { const i = M.list.indexOf(sh.id); if (i >= 0) { if (M.list.length <= 2) { toast(T('至少保留 2 個形狀')); return; } M.list.splice(i, 1); } else M.list.push(sh.id);
    M.list.sort((a, b) => SHAPES.findIndex(s => s.id === a) - SHAPES.findIndex(s => s.id === b)); buildSeq(); restartAuto(); syncMotion(); save(); } }));
$('#plAll').addEventListener('click', () => { M.list = SHAPES.map(s => s.id); buildSeq(); restartAuto(); syncMotion(); save(); });
$('#plNone').addEventListener('click', () => { M.list = [S.shape, SHAPES.find(s => s.id !== S.shape).id]; buildSeq(); restartAuto(); syncMotion(); save(); });
chipSets.push(chips('#cRecBg', [{ id: 'transparent', label: T('透明') }, { id: 'green', label: T('綠幕') }, { id: 'white', label: T('白') }, { id: 'stage', label: T('舞台色') }], it => M.recBg === it.id, id => { M.recBg = id; syncMotion(); save(); }));
chipSets.push(chips('#cRecSize', [{ id: 720, label: '720' }, { id: 1080, label: '1080' }], it => M.recSize === it.id, id => { M.recSize = id; syncMotion(); save(); }));

/* stage backgrounds */
const BGS = [['soft', T('柔光'), 'radial-gradient(circle,#fff,var(--mc-soft))'], ['dots', T('點點'), 'radial-gradient(circle,var(--ink) 1.5px,transparent 2px) 0 0/7px 7px,var(--paper)'], ['grid', T('格線'), 'linear-gradient(var(--faint) 1px,transparent 1px) 0 0/7px 7px,var(--paper)'], ['plain', T('素色'), 'var(--paper)'], ['green', T('綠幕'), '#00B140']];
const bgBtns = BGS.map(([id, label, bg]) => { const b = el('button'); b.type = 'button'; b.title = label; b.setAttribute('aria-label', T('背景：') + label); b.style.background = bg; b.addEventListener('click', () => { M.stageBg = id; syncStageBg(); save(); }); $('#bgPick').appendChild(b); return { b, id }; });
function syncStageBg() { const st = $('#stage'); BGS.forEach(([id]) => st.classList.toggle('bg-' + id, M.stageBg === id)); bgBtns.forEach(({ b, id }) => b.setAttribute('aria-pressed', String(M.stageBg === id))); }

/* states row: each a mini mascot playing its loop */
const stBtns = STATES.map((st, i) => { const b = el('button', 'st'); b.type = 'button'; const cv = el('canvas'); cv.setAttribute('aria-hidden', 'true'); b.append(cv, el('span', null, stName(st))); b.setAttribute('aria-label', T('狀態：') + (stName(st)));
  b.addEventListener('click', () => { stateIdx = i; stateSince = performance.now(); jigT = performance.now(); syncStates(); }); $('#states').appendChild(b); return { b, cv }; });
function syncStates() { stBtns.forEach(({ b }, i) => b.setAttribute('aria-pressed', String(i === stateIdx))); updateHash(); }

/* ================= changes ================= */
let tilesDirty = true, jigT = -1e9;
function set(patch) { if (patch.shape && M.on) stopAuto(); Object.assign(S, patch); changed(); }
function setShape(id) { if (M.on) stopAuto(); S.shape = id; changed(); }
function changed() { tilesDirty = true; jigT = performance.now(); $('#fallback').hidden = true; sync(); }
function sync() {
  tiles.forEach(t => t.b.setAttribute('aria-pressed', String(!!t.on())));
  chipSets.flat().forEach(({ b, it, isOn }) => b.setAttribute('aria-pressed', String(isOn(it))));
  const custom = !PALETTE.some(p => p.hex.toLowerCase() === S.color.toLowerCase());
  swBtns.forEach(({ b, hex }) => b.setAttribute('aria-pressed', String(hex.toLowerCase() === S.color.toLowerCase())));
  cw.setAttribute('aria-pressed', String(custom)); if (custom) { cw.style.background = S.color; fCustom.value = S.color; } else cw.style.background = '';
  ranges.forEach(([i, out, key, f]) => { $(i).value = S[key]; $(out).textContent = f(S[key]); });
  document.documentElement.style.setProperty('--mc', S.color);
  syncStates(); syncTeam(); syncMotion();
}
function syncMotion() {
  mRanges.forEach(([i, out, key]) => { $(i).value = M[key]; $(out).textContent = M[key].toFixed(1) + T(' 秒'); });
  playTiles.forEach(t => t.b.classList.toggle('off', !M.list.includes(t.make().shape)));
  const sec = loopLen(); $('#cycleInfo').textContent = T`${M.list.length} 個形狀 · 一輪 ${sec.toFixed(1)} 秒`; $('#recInfo').textContent = T`${sec.toFixed(1)} 秒`;
  tiles.forEach(t => t.b.setAttribute('aria-pressed', String(!!t.on()))); chipSets.flat().forEach(({ b, it, isOn }) => b.setAttribute('aria-pressed', String(isOn(it))));
  const ab = $('#btnAuto'); ab.setAttribute('aria-pressed', String(M.on)); ab.querySelector('span').textContent = M.on ? T('停止變形') : T('自動變形');
  ab.querySelector('svg').innerHTML = M.on ? '<rect x="7" y="6" width="3.6" height="12" rx="1"/><rect x="13.4" y="6" width="3.6" height="12" rx="1"/>' : '<path d="M8 5.5v13l10.5-6.5z"/>';
  $('#liveTag').hidden = !M.on && !rec;
}

/* ================= morph timeline ================= */
function buildSeq() { M.seq = M.list.slice(); if (M.order === 'random') for (let i = M.seq.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [M.seq[i], M.seq[j]] = [M.seq[j], M.seq[i]]; } }
const loopLen = () => M.list.length * (M.hold + M.dur);
/* where are we at τ seconds: holding a shape, or morphing from one to the next (k = 0…1) — loops seamlessly */
function morphAt(tau) {
  const n = M.seq.length, seg = M.hold + M.dur; tau = ((tau % (n * seg)) + n * seg) % (n * seg);
  const i = Math.floor(tau / seg), local = tau - i * seg;
  return local < M.hold ? { to: M.seq[i], k: null } : { from: M.seq[i], to: M.seq[(i + 1) % n], k: (local - M.hold) / M.dur, seed: i * 1.7 + .4 };
}
function startAuto() { if (M.list.length < 2) { toast(T('變形清單至少要 2 個形狀')); return; } buildSeq(); const i = M.seq.indexOf(S.shape); if (i > 0) M.seq = M.seq.slice(i).concat(M.seq.slice(0, i)); M.on = true; M.t0 = performance.now(); syncMotion(); }
function stopAuto() { M.on = false; syncMotion(); }
function restartAuto() { if (M.on) { M.t0 = performance.now(); buildSeq(); } }
$('#btnAuto').addEventListener('click', () => M.on ? stopAuto() : startAuto());
buildSeq();

/* ================= dice ================= */
const hwOf = id => (K.get('eye', id) || {}).hw || .1;
function eyesFit(eyes, brows, size, gap) {
  const sz = size / 100, x = eyeDef(eyes).gap * gap / 100, L = R.sideEye(eyes, -1).hw || .1, Rt = R.sideEye(eyes, 1).hw || .1;
  const need = Math.max((L + Rt) * 1.22, 2 * hwOf('happy'), 2 * hwOf('closed'), brows === 'none' ? 0 : .2 * 1.22 + .06) * sz, out = Math.max(L, Rt) * 1.22 * sz;
  return 2 * x - need >= .04 && x + out <= .46;
}
function pickW(kind, restId, restW) { const L = K.visible(kind), w = d => d.weight ?? (d.id === restId ? restW : 1), tot = L.reduce((s, d) => s + w(d), 0); let r = Math.random() * tot; for (const d of L) { r -= w(d); if (r <= 0) return d.id; } return L[0].id; }
function randomDot() {
  const pick = a => a[Math.floor(Math.random() * a.length)], rnd = (a, b, st) => a + Math.round(Math.random() * (b - a) / st) * st, [eyes, brows] = pick(EXPRS), color = pick(PALETTE).hex;
  let size = 100, gap = 100; for (let i = 0; i < 60; i++) { const z = rnd(70, 135, 5), g = rnd(60, 150, 5); if (eyesFit(eyes, brows, z, g)) { size = z; gap = g; break; } }
  const inks = INKS.filter(k => contrast(R.inkOf({ eyes, color, ink: k.id }), color) >= 3.5).map(k => k.id);
  return { shape: pick(SHAPES).id, eyes, brows, color, ink: inks.length ? pick(inks) : 'auto', size, gap, tilt: Math.round((Math.random() - Math.random()) * 12),
    finish: pickW('finish', 'flat', 4), cheeks: pickW('cheek', 'none', 5), acc: pickW('accessory', 'none', 6), mouth: pickW('mouth', 'none', 8) };
}
$('#btnRandom').addEventListener('click', () => { const d = randomDot(); if (M.on) delete d.shape; Object.assign(S, d); changed(); react = { type: 'boing', dur: 800, t0: performance.now() }; });

/* ================= export menu ================= */
const NS = STATES.length, fname = (o, rest) => `cute-lab-${shapeOf(o).id}-${rest}`, kb = t => Math.round(t.length / 1024) + ' KB';
const expMenu = $('#expMenu'), expBtn = $('#btnExport');
const mHead = txt => { const d = el('div', 'mh', txt); expMenu.appendChild(d); return d; };
const mItem = (label, fn, hint) => { const b = el('button', null, `<span>${label}</span>${hint ? `<small style="color:var(--muted)">${hint}</small>` : ''}`); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.addEventListener('click', () => { closeMenu(); fn(); }); expMenu.appendChild(b); return b; };
const mChips = (list, isOn, click) => { const w = el('div', 'chips'); expMenu.appendChild(w); return list.map(it => { const b = el('button', 'chip', it.label); b.type = 'button'; b.addEventListener('click', () => { click(it.id); syncMenu(); save(); }); w.appendChild(b); return { b, it, isOn }; }); };
function openMenu() { syncMenu(); expMenu.hidden = false; expBtn.setAttribute('aria-expanded', 'true'); expMenu.querySelector('button').focus(); }
function closeMenu() { expMenu.hidden = true; expBtn.setAttribute('aria-expanded', 'false'); }
expBtn.addEventListener('click', () => expMenu.hidden ? openMenu() : closeMenu());
document.addEventListener('pointerdown', e => { if (!expMenu.hidden && !e.target.closest('.menu-wrap')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!expMenu.hidden) { closeMenu(); expBtn.focus(); } else $('#fallback').hidden = true; } });
expMenu.addEventListener('keydown', e => { const d = { ArrowDown: 1, ArrowUp: -1 }[e.key]; if (!d) return; e.preventDefault(); const L = [...expMenu.querySelectorAll('button:not([hidden])')], i = L.indexOf(document.activeElement); L[(i + d + L.length) % L.length].focus(); });
const curSvg = st => S.svgAnim ? X.animSvg(st, S) : X.stateSvg(st, S);
mHead(T('圖片'));
const pngItem = mItem(T('複製 PNG'), copyPng, `${S.png} px`);
const menuChips = [mChips([128, 256, 512, 1024].map(n => ({ id: n, label: n + '' })), it => S.png === it.id, id => { S.png = id; })];
const stHead = mHead(T('目前狀態'));
mItem(T('複製 SVG'), () => { const st = STATES[stateIdx], svg = curSvg(st); copyText(svg, T`SVG「${st.label}」已複製 · ${kb(svg)}`); });
mItem(T('下載 SVG'), () => { const st = STATES[stateIdx]; download(new Blob([curSvg(st)], { type: 'image/svg+xml' }), fname(S, st.id + '.svg')); toast(T`已下載「${st.label}」SVG`); });
mItem(T('下載 GIF'), async () => { const st = STATES[stateIdx], n = Math.min(S.png, X.GIF_MAX); toast(T('GIF 製作中…')); const g = await X.gif(st, S, n, S.gifBg); download(new Blob([g], { type: 'image/gif' }), fname(S, st.id + '.gif')); toast(T`已下載 GIF · ${n}px · ${kb(g)}`); }, T('Figma / Slack 用'));
mHead(T`全部 ${NS} 個狀態`);
mItem(T('複製 SVG 總表'), () => { const svg = X.sheet(S.svgAnim, S); copyText(svg, T`全部狀態已複製 · ${kb(svg)}`); });
mItem(T('下載全部 (.zip)'), async () => { toast(T`準備 ${NS} 個狀態…`); const files = await X.stateFiles(S, '', S.png, { anim: S.svgAnim, gifBg: S.gifBg }); download(X.zip(files), fname(S, 'states.zip')); toast(T('已下載 SVG + PNG + GIF')); }, 'SVG · PNG · GIF');
const teamHead = mHead(T('收藏'));
const teamItems = [mItem(T('複製收藏總表'), copyTeam), mItem(T('下載收藏 (.zip)'), async () => { const L = teamDots(), files = [];
  for (const [i, o] of L.entries()) { toast(T`準備收藏 ${i + 1}/${L.length}…`); files.push(...await X.stateFiles(o, `${String(i + 1).padStart(2, '0')}-${shapeOf(o).id}/`, S.png, { anim: S.svgAnim, gifBg: S.gifBg })); }
  files.push({ name: 'team.svg', data: new TextEncoder().encode(X.teamSheet(S.svgAnim, L)) }); download(X.zip(files), 'cute-lab-team.zip'); toast(T('收藏已下載')); })];
mHead(T('SVG 樣式')); menuChips.push(mChips([{ id: true, label: T('動態') }, { id: false, label: T('靜態') }], it => S.svgAnim === it.id, id => { S.svgAnim = id; }));
mHead(T('GIF 背景')); menuChips.push(mChips([{ id: 'white', label: T('白色') }, { id: 'transparent', label: T('透明') }], it => S.gifBg === it.id, id => { S.gifBg = id; }));
expMenu.appendChild(el('hr'));
mItem(T('🎬 錄製變形影片'), () => { setTab('motion'); document.querySelector('[data-tab=motion]').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 'WebM');
function syncMenu() { pngItem.querySelector('small').textContent = `${S.png} px`; stHead.textContent = T`目前狀態 · ${stName(STATES[stateIdx])}`;
  const has = team.length > 0; teamHead.hidden = !has; teamItems.forEach(b => b.hidden = !has);
  menuChips.flat().forEach(({ b, it, isOn }) => b.setAttribute('aria-pressed', String(isOn(it)))); }
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
function showFallback(kind, data, msg) { const fb = $('#fallback'); fb.hidden = false; $('#fbImg').hidden = kind !== 'png'; $('#fbTxt').hidden = kind === 'png';
  if (kind === 'png') { $('#fbImg').src = data; $('#fbMsg').textContent = T('瀏覽器擋住了複製圖片，請右鍵（或長按）圖片另存。'); }
  else { const t = $('#fbTxt'); t.value = data; t.focus(); t.select(); $('#fbMsg').textContent = msg || T('無法自動複製，內容已選取，請按 Ctrl/⌘ + C。'); } }
$('#fbClose').addEventListener('click', () => { $('#fallback').hidden = true; });
function copyText(txt, msg) { const no = () => showFallback('svg', txt); try { navigator.clipboard.writeText(txt).then(() => toast(msg), no); } catch (e) { no(); } }
function copyPng() { const n = S.png, cv = X.png(S, n), no = () => showFallback('png', cv.toDataURL('image/png'));
  try { const blob = new Promise(r => cv.toBlob(r, 'image/png')); navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => toast(T`PNG ${n}×${n} 已複製`), no); } catch (e) { no(); } }
$('#btnShare').addEventListener('click', () => { const url = ART_URL + '#' + token(), no = () => showFallback('link', url, T('無法自動複製，連結已選取，請按 Ctrl/⌘ + C。'));
  try { navigator.clipboard.writeText(url).then(() => toast(T('連結已複製 · 打開就是這隻角色')), no); } catch (e) { no(); } });

/* ================= team ================= */
const TEAM_KEY = 'cute-lab-team-v1', TEAM_MAX = 12, xIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
let team = []; try { const v = JSON.parse(localStorage.getItem(TEAM_KEY) || '[]'); if (Array.isArray(v)) team = v.filter(t => R.decode(t)).slice(0, TEAM_MAX); } catch (e) {}
let teamEls = [];
const teamDots = () => team.map(t => R.decode(t).o);
function saveTeam() { try { localStorage.setItem(TEAM_KEY, JSON.stringify(team)); } catch (e) {} }
function renderTeam(newIdx) {
  const list = $('#teamList'); list.innerHTML = '';
  teamEls = team.map((t, i) => { const o = R.decode(t).o, e = el('div', 'tm' + (i === newIdx ? ' new' : ''));
    e.innerHTML = `<button class="tm-pick" type="button" aria-label="${T('載入')} ${shapeOf(o).label}"><canvas aria-hidden="true"></canvas></button><button class="tm-x" type="button" aria-label="${T('移出收藏')}">${xIc}</button>`;
    e.querySelector('.tm-pick').addEventListener('click', () => { if (M.on) stopAuto(); Object.assign(S, o); changed(); });
    e.querySelector('.tm-x').addEventListener('click', () => { team.splice(i, 1); saveTeam(); renderTeam(); });
    list.appendChild(e); return { e, cv: e.querySelector('canvas'), o, tok: R.baseTok(R.encode(o, 0)) }; });
  $('#teamEmpty').hidden = team.length > 0; syncTeam();
  if (newIdx != null) teamEls[newIdx]?.e.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
}
function syncTeam() { const cur = R.baseTok(token()); teamEls.forEach(it => it.e.classList.toggle('active', it.tok === cur)); }
function copyTeam() { const svg = X.teamSheet(S.svgAnim, teamDots()); copyText(svg, T`收藏總表已複製 · ${team.length} 隻 × ${NS} 狀態 · ${kb(svg)}`); }
$('#btnSave').addEventListener('click', () => { const t = R.baseTok(token());
  if (teamEls.some(x => x.tok === t)) { toast(T('這隻已經收藏了')); return; }
  if (team.length >= TEAM_MAX) { toast(T`收藏已滿（${TEAM_MAX}），先移除一隻`); return; }
  team.push(t); saveTeam(); renderTeam(team.length - 1); react = { type: 'boing', dur: 800, t0: performance.now() }; toast(T`已收藏 · ${team.length}`); });

/* ================= stage interaction ================= */
const stage = $('#stage'), hero = $('#hero');
let pointer = null, lastMove = -1e9, look = { x: 0, y: 0 }, react = null, reactN = 0, drag = null;
const REACTS = [['boing', 800], ['giggle', 1100], ['love', 1400]];
const playReact = () => { const [type, dur] = REACTS[reactN++ % REACTS.length]; react = { type, dur, t0: performance.now() }; };
window.addEventListener('pointermove', e => { pointer = { x: e.clientX, y: e.clientY }; lastMove = performance.now(); });
document.addEventListener('pointerleave', () => { pointer = null; });
/* click = react; drag = eyes (horizontal = spacing, vertical = size) */
stage.addEventListener('pointerdown', e => { if (e.target.closest('button, .stage-top, .actions')) return; stage.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, size: S.size, gap: S.gap, moved: false }; });
stage.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) < 6) return; drag.moved = true;
  const r5 = v => Math.round(v / 5) * 5; S.size = clamp(r5(drag.size - dy * .6), 60, 150); S.gap = clamp(r5(drag.gap + dx * .6), 55, 160); tilesDirty = true; sync(); $('#hint').textContent = T`眼睛 ${S.size}% · 眼距 ${S.gap}%`; });
const endDrag = () => { if (!drag) return; const moved = drag.moved; drag = null; if (moved) setTimeout(() => { $('#hint').textContent = T('點我互動 · 拖曳調眼睛'); }, 900); else playReact(); };
stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', () => { drag = null; });
stage.addEventListener('keydown', e => { if (e.target === stage && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); playReact(); } });

/* ================= drawing ================= */
const HERO_U = .22, HERO_CY = .6;
/* soft floor shadow (stage + video only, not in exports) */
function floorShadow(c, W, o, a) { const sh = R.compiled(o.shape), u = W * HERO_U, y = W * HERO_CY + sh.bottom * u + u * .04, k = 1 - clamp(a.hop || 0, 0, 1) * .45;
  c.save(); c.globalAlpha = .13 * k; c.fillStyle = '#2B2320'; K.ell(c, W / 2 + (a.dx || 0) * u, y, u * .85 * k * (1 + (a.melt || 0) * .7), u * .1 * k); c.fill(); c.restore(); }
/* apply a click reaction on top of the choreography */
function applyReact(C, now) {
  if (!react || reduced) return; const r = (now - react.t0) / react.dur; if (r >= 1) { react = null; return; }
  if (react.type === 'boing') { C.squash += r < .12 ? .22 * Math.sin(r / .12 * PI / 2) : -.2 * Math.exp(-(r - .12) * 6) * Math.cos((r - .12) * 22); C.hop += r > .12 && r < .55 ? .55 * Math.sin((r - .12) / .43 * PI) : 0; C.eyePop *= 1 + .25 * bump(r, .1, .5); }
  else if (react.type === 'giggle') { C.eyeOverride = 'happy'; C.mouthOverride = 'open'; C.sway += 7 * Math.sin(r * 44) * (1 - r); C.hop += .08 * Math.abs(Math.sin(r * 26)) * (1 - r); C.squash += .04 * Math.sin(r * 52) * (1 - r); }
  else { C.eyeOverride = 'happy'; C.hearts = r; C.sway += 4 * Math.sin(r * 8) * (1 - r); C.squash += -.06 * bump(r, 0, .3); }
}
/* manual shape change → morph from whatever is on screen right now (even mid-morph) */
let shown = S.shape, manual = null, lastSh = null, disp = hexToRgb(S.color);
function heroShape(now) {
  if (M.on) {
    const m = morphAt((now - M.t0) / 1000);
    if (m.to !== S.shape) { S.shape = m.to; shown = m.to; tilesDirty = true; tiles.forEach(t => t.b.setAttribute('aria-pressed', String(!!t.on()))); updateHash(); }
    return m.k != null ? { from: m.from, t: m.k, seed: m.seed } : null;
  }
  if (S.shape !== shown) { manual = { from: lastSh || shown, t0: now, seed: Math.random() * 6 }; shown = S.shape; }
  if (manual) { const t = (now - manual.t0) / (M.dur * 1000); if (t >= 1 || reduced) manual = null; else return { from: manual.from, t, seed: manual.seed }; }
  return null;
}
function frame() {
  const now = performance.now(), st = STATES[stateIdx], T = reduced ? 0 : now / 1000, p = reduced ? 0 : (((now - stateSince) / 1000) / st.cycle) % 1;
  const C = R.choreo(st, p, T), fo = st.follow;
  let tx, ty, fast = .45;
  if (pointer && fo && (fo.always || now - lastMove < 2500) && !rec) { const r = stage.getBoundingClientRect(); tx = clamp((pointer.x - (r.left + r.width / 2)) / 240, -1, 1) * fo.k; ty = clamp((pointer.y - (r.top + r.height * .5)) / 240, -1, 1) * fo.k; fast = .14; }
  else [tx, ty] = C.look || [0, 0];
  look.x += (tx - look.x) * fast; look.y += (ty - look.y) * fast;
  if (fo && fo.sway) C.sway += look.x * fo.sway;
  const dj = Math.max(0, now - jigT); if (!reduced) C.squash += .07 * Math.exp(-dj / 180) * Math.cos(dj / 1000 * 26);
  applyReact(C, now);
  const tgt = hexToRgb(S.color); disp = disp.map((v, i) => reduced ? tgt[i] : v + (tgt[i] - v) * .18); const col = K.toHex(disp);
  const morph = heroShape(now), o = { ...S, color: col, morph }, a = { ...C, t: T, p, st, look, scale: 1 };
  /* the stage may be wider than tall: draw the mascot in a centred square of the stage's height */
  const SWd = Math.round(stage.clientWidth), SHt = Math.round(stage.clientHeight), W = Math.min(SWd, SHt), c = fit(hero, SWd, SHt);
  c.translate((SWd - W) / 2, (SHt - W) / 2);
  floorShadow(c, W, o, a); lastSh = R.drawBlob(c, W, o, a, { hero: true, u: HERO_U, cy: HERO_CY });
  /* logo + state minis + team keep breathing */
  const lc = fit($('#logo'), 38); R.drawBlob(lc, 38, { ...S, color: col, morph }, { ...R.choreo(STATES[0], (T / STATES[0].cycle) % 1, T), t: T, st: STATES[0], look: { x: 0, y: 0 } }, { u: .3, cy: .56 });
  stBtns.forEach(({ cv }, i) => { const ms = STATES[i], mp = reduced ? 0 : ((T / ms.cycle) + i * .13) % 1, MC = R.choreo(ms, mp, mp * ms.cycle);
    R.drawBlob(fit(cv, 52), 52, { ...S, color: col }, { ...MC, t: T, p: mp, st: ms, look: { x: (MC.look || [0, 0])[0], y: (MC.look || [0, 0])[1] }, scale: 1 }, { hero: true, u: .24, cy: .6 }); });
  teamEls.forEach((it, i) => { const ms = STATES[0], mp = reduced ? 0 : ((T / ms.cycle) + i * .23) % 1;
    R.drawBlob(fit(it.cv, 50), 50, it.o, { ...R.frameOf(ms, mp), t: T }, { u: .3, cy: .56 }); });
  if (tilesDirty) { tilesDirty = false; tiles.forEach(t => { if (t.tab === tab) paint(t.cv, t.sz, t.make(), STATES[0], t.u, t.cy); }); }
  requestAnimationFrame(frame);
}

/* ================= video recording (WebM via MediaRecorder) ================= */
let rec = null;
function recFrame(c, n, tau) {
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, n, n);
  if (M.recBg === 'white') { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, n, n); }
  else if (M.recBg === 'green') { c.fillStyle = '#00B140'; c.fillRect(0, 0, n, n); }
  else if (M.recBg === 'stage') { const g = c.createRadialGradient(n / 2, n * .42, 0, n / 2, n * .42, n * .75); g.addColorStop(0, K.mixHex(S.color, '#FFFFFF', .7)); g.addColorStop(.6, K.mixHex(S.color, '#FFFDF9', .88)); g.addColorStop(1, K.mixHex(S.color, '#FFF6EC', .94)); c.fillStyle = g; c.fillRect(0, 0, n, n); }
  const st = STATES[stateIdx], m = morphAt(tau), a = { ...R.frameOf(st, (tau / st.cycle) % 1), t: tau };
  const o = { ...S, shape: m.to, morph: m.k != null ? { from: m.from, t: m.k, seed: m.seed } : null };
  if (M.recBg !== 'transparent' && M.recBg !== 'green') floorShadow(c, n, o, a);
  R.drawBlob(c, n, o, a, { hero: true, u: HERO_U, cy: HERO_CY });
}
async function record() {
  if (rec) { rec.stop = true; return; }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { toast(T('這個瀏覽器不支援錄影，請用 Chrome')); return; }
  if (M.list.length < 2) { toast(T('變形清單至少要 2 個形狀')); return; }
  const n = M.recSize, cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d');
  const types = M.recBg === 'transparent' ? ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'] : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  const mime = types.find(t => MediaRecorder.isTypeSupported(t)); if (!mime) { toast(T('找不到可用的影片格式')); return; }
  buildSeq(); const i0 = M.seq.indexOf(S.shape); if (i0 > 0) M.seq = M.seq.slice(i0).concat(M.seq.slice(0, i0));
  const total = loopLen(), stream = cv.captureStream(60), mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: n >= 1080 ? 12e6 : 6e6 }), chunks = [];
  mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise(r => { mr.onstop = r; });
  rec = { stop: false }; const wasOn = M.on; if (M.on) stopAuto(); M.on = false;
  $('#recBar').hidden = false; const bar = $('#recBar i'), btn = $('#btnRec span'); btn.textContent = T('停止錄製'); $('#liveTxt').textContent = T('錄製中'); syncMotion();
  recFrame(c, n, 0); mr.start(250); const t0 = performance.now();
  await new Promise(res => { const step = () => { const tau = (performance.now() - t0) / 1000; if (tau >= total || rec.stop) return res(); recFrame(c, n, tau); bar.style.width = (tau / total * 100) + '%'; requestAnimationFrame(step); }; step(); });
  recFrame(c, n, total); await new Promise(r => setTimeout(r, 120)); mr.stop(); await done; stream.getTracks().forEach(t => t.stop());
  const ext = mime.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(chunks, { type: mime.split(';')[0] });
  if (!rec.stop) download(blob, `cute-lab-morph-${M.recBg}-${n}.${ext}`);
  toast(rec.stop ? T('已取消錄製') : T`影片已下載 · ${total.toFixed(1)} 秒 · ${(blob.size / 1048576).toFixed(1)} MB`);
  rec = null; $('#recBar').hidden = true; bar.style.width = '0'; btn.textContent = T('錄製一整輪'); $('#liveTxt').textContent = T('自動變形中'); if (wasOn) startAuto(); syncMotion();
}
$('#btnRec').addEventListener('click', record);

/* ================= boot ================= */
if (!fromLink) Object.assign(S, randomDot()); else stateIdx = clamp(fromLink.state, 0, STATES.length - 1);
shown = S.shape; disp = hexToRgb(S.color);
setTab('shape'); syncStageBg(); renderTeam(); sync(); requestAnimationFrame(frame);
})();
