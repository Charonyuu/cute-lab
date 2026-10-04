/* =====================================================================
   Cute Lab · kit
   Registry + math + drawing primitives. Loaded FIRST, before render.js
   and every styles/*.js file. Everything lives on window.CUTE.

   Every style is a plain object registered with CUTE.define(kind, def).
   ORDER MATTERS: share links encode each choice as its index in the
   registry (one base-36 char, so max 36 per kind). Only APPEND new
   items; never reorder or delete, or old links open the wrong mascot.
   ===================================================================== */
(function () {
'use strict';
const TAU = Math.PI * 2, PI = Math.PI;

/* ---------- registry ---------- */
const reg = {
  shape: [], eye: [], brow: [], mouth: [], cheek: [], accessory: [],
  finish: [], state: [], color: [], family: [],
};
function define(kind, def) {
  const L = reg[kind];
  if (!L) throw new Error(`CUTE.define: unknown kind "${kind}" (use ${Object.keys(reg).join(', ')})`);
  if (!def || !def.id) throw new Error(`CUTE.define(${kind}): every style needs an id`);
  const i = L.findIndex(d => d.id === def.id);
  if (i >= 0) L[i] = { ...L[i], ...def }; else L.push(def);
  return def;
}
const get = (kind, id) => reg[kind].find(d => d.id === id);
/* visible = what pickers show (hidden items are internal, e.g. the "x" eyes of the Error state) */
const visible = kind => reg[kind].filter(d => !d.hidden);

/* ---------- numbers & colour ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
const toHex = a => '#' + a.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, k) => { const A = hexToRgb(a), B = hexToRgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)); };
const darken = (h, k) => mixHex(h, '#000000', k);
const lighten = (h, k) => mixHex(h, '#FFFFFF', k);
function lum(h) { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; const [r, g, b] = hexToRgb(h); return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); }
const contrast = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((m, n) => n - m); return (l1 + .05) / (l2 + .05); };
/* complementary hue (+180°), re-saturated so it stays vivid; neutrals get hot pink */
function complement(h) {
  let [r, g, b] = hexToRgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let hu = 0;
  if (d < .12) return '#FF5AA5';
  hu = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hu = (hu * 60 + 180 + 360) % 360;
  const sat = .78, l = .58, c = (1 - Math.abs(2 * l - 1)) * sat, x = c * (1 - Math.abs((hu / 60) % 2 - 1)), m = l - c / 2;
  const [a1, b1, c1] = hu < 60 ? [c, x, 0] : hu < 120 ? [x, c, 0] : hu < 180 ? [0, c, x] : hu < 240 ? [0, x, c] : hu < 300 ? [x, 0, c] : [c, 0, x];
  return toHex([a1, b1, c1].map(v => (v + m) * 255));
}

/* ---------- drawing primitives (SVG-export safe) ----------
   Style code may ONLY use: save/restore, translate/scale/rotate, beginPath, moveTo, lineTo,
   quadraticCurveTo, bezierCurveTo, arc, ellipse, rect, closePath, fill, stroke, fillRect, clip,
   globalAlpha, fillStyle/strokeStyle (hex or rgb()), lineWidth, lineCap, lineJoin.
   No gradients, shadows, text, images or filters: the SVG/GIF exporter replays the same calls. */
function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(rx, 1e-4), Math.max(ry, 1e-4), rot, 0, TAU); }
function rrect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); if (c.primRect) { c.primRect(x, y, w, h, r); return; }
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arc(x + w - r, y + r, r, -PI / 2, 0); c.lineTo(x + w, y + h - r); c.arc(x + w - r, y + h - r, r, 0, PI / 2);
  c.lineTo(x + r, y + h); c.arc(x + r, y + h - r, r, PI / 2, PI); c.lineTo(x, y + r); c.arc(x + r, y + r, r, PI, PI * 1.5); c.closePath();
}
/* 4-point twinkle */
function sparkle(c, x, y, r, inner = .3) {
  c.beginPath();
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 - PI / 2, b = a + PI / 2; if (!k) c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.quadraticCurveTo(x + Math.cos(a + PI / 4) * r * inner, y + Math.sin(a + PI / 4) * r * inner, x + Math.cos(b) * r, y + Math.sin(b) * r); }
  c.closePath();
}
/* n-point star (polygon, round it with lineJoin + stroke) */
function star(c, x, y, r, inner = .5, n = 5) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i * PI / n - PI / 2, q = i % 2 ? r * inner : r; i ? c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : c.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  c.closePath();
}
/* heart centred on (x,y), width ≈ 2r */
function heart(c, x, y, r) {
  c.beginPath(); c.moveTo(x, y + r * .9);
  c.bezierCurveTo(x - r * 1.25, y + r * .05, x - r * .95, y - r * 1.05, x, y - r * .4);
  c.bezierCurveTo(x + r * .95, y - r * 1.05, x + r * 1.25, y + r * .05, x, y + r * .9); c.closePath();
}
/* path through a point list (e.g. the body outline, to clip or stroke it by hand) */
function poly(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }

/* ---------- shape generators: all return [[x,y],…] in roughly [-1,1] ---------- */
/* superellipse: n=2 ellipse, n>2 squarer */
function superE(n, a, b, N) { const p = []; for (let i = 0; i < N; i++) { const t = TAU * i / N, c = Math.cos(t), s = Math.sin(t); p.push([a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]); } return p; }
/* parametric curve t∈[0,2π) → [x,y] */
function param(N, f) { const p = []; for (let i = 0; i < N; i++) p.push(f(TAU * i / N)); return p; }
/* polar: radius as a function of angle (0 = top, clockwise) */
function polar(N, f) { const p = []; for (let i = 0; i < N; i++) { const a = TAU * i / N, r = f(a); p.push([r * Math.sin(a), -r * Math.cos(a)]); } return p; }
/* polygon with rounded corners: each vertex becomes a quadratic, t = how far the rounding eats into each side */
function rpoly(V, t, n = 18) {
  const p = [], L = V.length;
  for (let i = 0; i < L; i++) {
    const P = V[(i - 1 + L) % L], Q = V[i], R = V[(i + 1) % L];
    const A = [Q[0] + (P[0] - Q[0]) * t, Q[1] + (P[1] - Q[1]) * t], B = [Q[0] + (R[0] - Q[0]) * t, Q[1] + (R[1] - Q[1]) * t];
    for (let k = 0; k <= n; k++) { const u = k / n, m = 1 - u; p.push([m * m * A[0] + 2 * m * u * Q[0] + u * u * B[0], m * m * A[1] + 2 * m * u * Q[1] + u * u * B[1]]); }
  }
  return p;
}
/* union of discs [[x,y,r],…] seen from the origin (cloud, clover, ears…). Must be star-shaped around 0,0 */
function discs(C, N) { return polar(N, a => { const dx = Math.sin(a), dy = -Math.cos(a); let r = 0; for (const [x, y, R] of C) { const b = dx * x + dy * y, d = b * b - (x * x + y * y) + R * R; if (d >= 0) r = Math.max(r, b + Math.sqrt(d)); } return r; }); }
/* bump at angle c with width w, for polar() */
const gauss = (a, c, w) => { const d = Math.atan2(Math.sin(a - c), Math.cos(a - c)); return Math.exp(-(d / w) * (d / w)); };
function smooth(p, n) { for (let k = 0; k < n; k++) { const L = p.length; p = p.map((q, i) => { const a = p[(i - 1 + L) % L], b = p[(i + 1) % L]; return [(a[0] + 2 * q[0] + b[0]) / 4, (a[1] + 2 * q[1] + b[1]) / 4]; }); } return p; }
function resample(p, N) {
  const L = p.length, d = [0]; for (let i = 1; i <= L; i++) { const a = p[i - 1], b = p[i % L]; d.push(d[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const tot = d[L], o = []; let j = 0;
  for (let i = 0; i < N; i++) { const s = tot * i / N; while (d[j + 1] < s) j++; const u = (s - d[j]) / ((d[j + 1] - d[j]) || 1), a = p[j], b = p[(j + 1) % L]; o.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
  return o;
}
function pathOf(p) { const q = new Path2D(); p.forEach(([x, y], i) => i ? q.lineTo(x, y) : q.moveTo(x, y)); q.closePath(); q.pts = p; return q; }

/* ---------- motion helpers (for state choreographies) ---------- */
const easeIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeBack = x => { const k = 2.2; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
/* 0→1 while p goes a→b */
const span = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
/* 0→1→0 sine bump between a and b */
const bump = (p, a, b) => { const v = span(p, a, b); return v > 0 && v < 1 ? Math.sin(v * PI) : 0; };
/* asymmetric blinks (close 90 ms, open 140 ms). list = [{c: phase, q: quick?}] */
function blinkAmt(p, list, cyc) {
  let o = 1;
  for (const b of list) { const m = b.q ? .7 : 1, cN = .09 * m / cyc, oN = .14 * m / cyc; let d = p - b.c; if (d > .5) d -= 1; if (d < -.5) d += 1;
    if (d >= -cN && d <= oN) o = Math.min(o, d < 0 ? .5 * (1 + Math.cos(PI * (d + cN) / cN)) : .5 * (1 - Math.cos(PI * d / oN))); }
  return 1 - o;
}
/* keyframe track [[phase, x, y, ease?],…] → [x,y] */
function track(tr, p) { for (let k = 0; k < tr.length - 1; k++) { const A = tr[k], B = tr[k + 1]; if (p >= A[0] && p <= B[0]) { const e = (B[3] || easeIO)((p - A[0]) / ((B[0] - A[0]) || 1)); return [A[1] + (B[1] - A[1]) * e, A[2] + (B[2] - A[2]) * e]; } } return [0, 0]; }
/* a fall with 3 damped bounces, v∈[0,1] → height 1…0 */
const BH = [.3, .09, .027], BT = 1 + 2 * BH.reduce((q, h) => q + Math.sqrt(h), 0);
function fallH(v) { let x = v * BT; if (x < 1) return 1 - x * x; x -= 1; for (const h of BH) { const d = 2 * Math.sqrt(h), r = Math.sqrt(h); if (x < d) return Math.max(0, h - (x - r) * (x - r)); x -= d; } return 0; }

/* preset helper: a full mascot with sensible defaults */
const P = (shape, color, eyes, o = {}) => ({ shape, color, eyes, brows: 'none', mouth: 'none', ink: 'auto', size: 100, gap: 100, tilt: 0, finish: 'flat', cheeks: 'none', acc: 'none', ...o });

window.CUTE = Object.assign(window.CUTE || {}, {
  TAU, PI, reg, define, get, visible,
  clamp, hexToRgb, toHex, mixHex, darken, lighten, lum, contrast, complement,
  ell, rrect, sparkle, star, heart, poly,
  superE, param, polar, rpoly, discs, gauss, smooth, resample, pathOf,
  easeIO, easeBack, span, bump, blinkAmt, track, fallH, FALL_T: BT,
  P, DARK: '#141416', WHITE: '#FFFFFF',
});
})();
