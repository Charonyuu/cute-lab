/* =====================================================================
   Cute Lab · render
   Turns a mascot description  o = {shape,color,eyes,brows,mouth,ink,size,gap,tilt,finish,cheeks,acc}
   plus an animation frame     a = {st,t,p,blink,look,hop,squash,sway,shake,…}
   into drawing calls on a canvas-like context. The same calls go to a real
   <canvas> (screen, PNG, GIF) or to SvgCtx (SVG export) — one drawing, every format.

   Coordinate system: after the body transform everything is in UNIT space —
   the body fits in [-1,1]², (0,0) is its centre, y points down.
   The face is drawn in a smaller space (scaled by shape.fs × FACE) centred at shape.fy.
   ===================================================================== */
(function () {
'use strict';
const K = CUTE, { TAU, PI, clamp, hexToRgb, lum, ell, rrect, sparkle, DARK, WHITE } = K;
const FACE = 1.45;

/* ---------- shapes: compiled lazily, once ----------
   Every outline is normalised to the SAME layout: 220 points, clockwise on screen, point 0 at the top.
   That is what makes morphing possible — point i of one shape flows to point i of any other. */
const N_PTS = 220, cache = new Map();
function makeEdge(p) {
  /* edge[k] = distance from centre to the outline at angle k·5° (0 = top): lets decorations sit on the rim */
  const edge = new Array(72).fill(0);
  for (const [x, y] of p) { const b = Math.round(((Math.atan2(x, -y) + TAU) % TAU) / TAU * 72) % 72; edge[b] = Math.max(edge[b], Math.hypot(x, y)); }
  for (let pass = 0; pass < 3; pass++) for (let k = 0; k < 72; k++) if (!edge[k]) edge[k] = Math.max(edge[(k + 71) % 72], edge[(k + 1) % 72]);
  return edge;
}
function extent(p) { let top = 0, bottom = 0; for (const [, y] of p) { top = Math.min(top, y); bottom = Math.max(bottom, y); } return { top, bottom }; }
function compile(d) {
  let p = K.resample(K.smooth(d.gen(200), d.smooth || 2), N_PTS);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, s = (d.k || 1) / Math.max((x1 - x0) / 2, (y1 - y0) / 2);
  p = p.map(([x, y]) => [(x - cx) * s, (y - cy) * s]);
  /* clockwise on screen (positive signed area with y down), then start at the point closest to straight up */
  let area = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; area += a[0] * b[1] - b[0] * a[1]; }
  if (area < 0) p.reverse();
  let best = 0, bd = 1e9; p.forEach(([x, y], i) => { if (y >= 0) return; const an = Math.abs(Math.atan2(x, -y)); if (an < bd) { bd = an; best = i; } });
  p = p.slice(best).concat(p.slice(0, best));
  let { top, bottom } = extent(p);
  const handle = d.handle ? { x: -.34, y: top - .3, w: .68, h: .5, r: .16, lw: .13 } : null;
  if (handle) top = handle.y - .06;
  return { fy: 0, fs: 1, ...d, pts: p, path: K.pathOf(p), top, bottom, handle, edge: makeEdge(p) };
}
const compiled = id => { const L = K.reg.shape, d = L.find(s => s.id === id) || L[0]; let c = cache.get(d); if (!c) { c = compile(d); cache.set(d, c); } return c; };

/* ---------- blending two outlines ----------
   Not a plain lerp: every point gets its own delay, so some regions pull in while others are still
   bulging out, plus a soft overshoot along the radius — reads as jelly, not as a cross-fade.
   mode 'morph': delays follow a slow wave around the outline (seed varies it per transition)
   mode 'melt' : the bottom moves first and the top last, like something collapsing into a puddle */
function blend(A, B, t, mode = 'morph', seed = 0) {
  t = clamp(t, 0, 1);
  if (t <= 0) return A; if (t >= 1 && mode === 'morph') return B;
  const n = A.pts.length, sp = mode === 'melt' ? .35 : .55, h = (A.bottom - A.top) || 1, pts = new Array(n);
  for (let i = 0; i < n; i++) {
    const [ax, ay] = A.pts[i], [bx, by] = B.pts[i], th = TAU * i / n;
    const d = mode === 'melt' ? 1 - clamp((ay - A.top) / h, 0, 1) : .5 + .5 * Math.sin(2 * th + seed) * Math.cos(th * 3 - seed * .7);
    const q = clamp((t * (1 + sp) - d * sp), 0, 1), e = K.easeIO(q);
    let x = ax + (bx - ax) * e, y = ay + (by - ay) * e;
    if (mode === 'morph') { const r = Math.hypot(x, y) || 1, w = .09 * Math.sin(PI * q) * Math.sin(3 * th + seed * 1.3); x += x / r * w; y += y / r * w; }
    pts[i] = [x, y];
  }
  const { top, bottom } = extent(pts), k = mode === 'melt' ? clamp(t * 1.4, 0, 1) : K.easeIO(t);
  const fadeDecor = (S, a) => S.decor && a > .01 ? (c, Bd) => { c.globalAlpha *= a; S.decor(c, Bd); } : null;
  const decA = fadeDecor(A, 1 - k * 2), decB = mode === 'morph' ? fadeDecor(B, k * 2 - 1) : null;
  return { ...B, id: B.id, label: B.label, pts, path: K.pathOf(pts), top, bottom, edge: makeEdge(pts),
    fy: A.fy + (B.fy - A.fy) * k, fs: A.fs + (B.fs - A.fs) * k,
    handle: k < .25 ? A.handle : mode === 'morph' && k > .75 ? B.handle : null,
    decor: decA && decB ? (c, Bd) => { decA(c, Bd); decB(c, Bd); } : decA || decB, floor: mode === 'melt' ? (A.floor ?? A.bottom) : undefined };
}
/* puddle version of a shape: same point layout, flat and wide on the floor, with a lumpy rim */
const puddles = new Map();
function puddleOf(A) {
  let P = puddles.get(A); if (P) return P;
  const n = A.pts.length, yc = A.bottom - .08, pts = [];
  /* domed on top, flat underneath */
  for (let i = 0; i < n; i++) { const th = TAU * i / n, R = 1 + .08 * Math.sin(4 * th + .5) + .05 * Math.sin(7 * th + 2), cy = Math.cos(th);
    pts.push([Math.sin(th) * 1.45 * R, yc - cy * (cy > 0 ? .3 : .07) * R]); }
  const { top, bottom } = extent(pts);
  P = { ...A, pts, top, bottom, fy: yc - .12, fs: .55, handle: null, decor: null }; puddles.set(A, P); return P;
}
/* o.morph = { from: shape id OR an already-blended shape, t: 0…1, seed? } → mid-morph outline */
function shapeOf(o) {
  const B = compiled(o.shape); if (!o.morph) return B;
  const A = typeof o.morph.from === 'string' ? compiled(o.morph.from) : o.morph.from;
  return A && A !== B ? blend(A, B, o.morph.t, 'morph', o.morph.seed || 0) : B;
}
/* height of the outline straight above x = 0 (works even when the body is not around the origin, e.g. a puddle) */
function topAt0(sh) { if (sh.handle) return sh.top + .06; let y = 0, hit = false; for (const [px, py] of sh.pts) if (Math.abs(px) < .1 && (!hit || py < y)) { y = py; hit = true; } return hit ? y : -edgeR(sh, 0); }
const edgeR = (sh, an) => sh.edge[Math.round(((an % TAU + TAU) % TAU) / TAU * 72) % 72];
/* point on the outline at `deg` (0 = top, clockwise), pushed out by `off`, in unit space */
const rimPt = (sh, deg, off = 0) => { const an = deg * PI / 180, r = edgeR(sh, an) + off; return [Math.sin(an) * r, -Math.cos(an) * r]; };

/* ---------- face catalogue lookups ---------- */
const eyeDef = id => K.get('eye', id) || K.reg.eye[0];
const sideEye = (id, s) => { const d = eyeDef(id); return d.sides ? eyeDef(d.sides[s < 0 ? 0 : 1]) : d; };
const eyeHalf = (id, k) => (sideEye(id, -1).half || .1) * k;
const INKS = [{ id: 'auto', label: 'Auto' }, { id: 'dark', label: 'Black' }, { id: 'light', label: 'White' }];
/* auto ink: eyes flagged lightInk (pills, dashes) go white on mid tones; the rest stay black unless the body is near-black */
function inkOf(o) {
  if (o.ink === 'dark') return DARK; if (o.ink === 'light') return WHITE;
  const L = lum(o.color); return eyeDef(o.eyes).lightInk ? (L > .6 ? DARK : WHITE) : (L < .05 ? WHITE : DARK);
}
/* the state may override the face (Success → happy eyes + open mouth…) */
function faceSpec(o, st, live) {
  const f = { eye: o.eyes, brows: o.brows, mouth: o.mouth || 'none', k: 1 };
  if (st && st.face) st.face(f, live);
  return f;
}

function spiral(c, R, rot, ink, lw) {
  c.strokeStyle = ink; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
  for (let i = 0; i <= 48; i++) { const u = i / 48, an = rot + u * PI * 3.2, r = R * u; i ? c.lineTo(Math.cos(an) * r, Math.sin(an) * r) : c.moveTo(0, 0); }
  c.stroke();
}

/* ---------- face ---------- */
function drawFace(c, o, f, a, ink) {
  const sz = o.size / 100, gp = o.gap / 100, x = eyeDef(o.eyes).gap * gp, k = f.k * sz;
  const M = a.merge ?? 0, ex = a.eyeDX ?? 0, ey = a.eyeDY ?? 0, pop = a.eyePop ?? 1, esx = (a.eyeSX ?? 1) * pop, esy = (a.eyeSY ?? 1) * pop, sw = a.swirl ?? 0;
  const lx = a.look.x, ly = a.look.y, blink = a.blink ?? 0;
  /* cheeks sit under the eyes, behind them */
  const ch = K.get('cheek', o.cheeks);
  if (ch && ch.draw && M < .999) {
    const cy = Math.max(eyeHalf(f.eye, k), .08) + .045;
    for (const s of [-1, 1]) { c.save(); c.globalAlpha *= 1 - M; c.translate(s * (x + .04 * k) + ex * .5, cy + ey * .4); c.fillStyle = ink; c.strokeStyle = ink; c.lineCap = 'round'; c.lineJoin = 'round';
      ch.draw(c, { s, k, ink, color: o.color, t: a.t ?? 0 }); c.restore(); }
  }
  for (const s of [-1, 1]) {
    const d = sideEye(f.eye, s);
    c.save(); c.translate(s * x + ex + ((a.mx ?? 0) - (s * x + ex)) * M, ey + ((a.my ?? 0) - ey) * M); c.scale(esx, esy);
    if (M > .001) { const h = (d.half || .1) * k, r = h * .75 + (.11 - h * .75) * M; c.fillStyle = ink; ell(c, 0, 0, r, r * (1 - blink * .9)); c.fill(); }
    else {
      if (sw < .999) { c.save(); c.globalAlpha *= 1 - sw; c.scale(1 - sw * .5, 1 - sw * .5);
        c.fillStyle = ink; c.strokeStyle = ink; c.lineCap = 'round'; c.lineJoin = 'round';
        d.draw(c, { k, s, blink, lx, ly, ink, color: o.color, t: a.t ?? 0 }); c.restore(); }
      if (sw > .001) { c.save(); c.globalAlpha *= sw; spiral(c, .1 * k * (.4 + .6 * sw), (a.t ?? 0) * 7 * s, ink, .04 * k); c.restore(); }
    }
    c.restore();
  }
  const bd = K.get('brow', f.brows);
  if (bd && bd.pose && M < .999) {
    c.save(); c.globalAlpha *= 1 - M; c.translate(ex * .6, ey * .5 - (pop - 1) * .12);
    const by = -eyeHalf(f.eye, k) - .075 * k, bw = .2 * k, bh = .055 * k; c.fillStyle = ink;
    for (const s of [-1, 1]) { const { rot = 0, dy = 0, w = 1, h = 1 } = bd.pose(s, k), W = bw * w, H = bh * h;
      c.save(); c.translate(s * x, by + dy); c.rotate(rot); rrect(c, -W / 2, -H / 2, W, H, H / 2); c.fill(); c.restore(); }
    c.restore();
  }
  const md = K.get('mouth', f.mouth);
  if (md && md.draw) {
    const my = Math.max(eyeHalf(f.eye, k), .08) + .1;
    c.save(); c.globalAlpha *= 1 - clamp(ey / .12, 0, 1); c.translate(lx * .01, my);
    c.fillStyle = ink; c.strokeStyle = ink; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = .045;
    md.draw(c, { ink, color: o.color, t: a.t ?? 0 }); c.restore();
  }
}

/* ---------- one mascot ----------
   opt.u  = body radius as a fraction of W   opt.cy = vertical centre as a fraction of W   opt.hero = draw state extras */
function drawBlob(c, W, o, a, opt = {}) {
  const base = shapeOf(o), melt = a.melt || 0, sh = melt > 0 ? blend(base, puddleOf(compiled(o.shape)), melt, 'melt') : base;
  const C = o.color, ink = inkOf(o), f = faceSpec(o, a.st, !!opt.hero), u = W * (opt.u || .3), sc = a.scale ?? 1;
  if (a.eyeOverride) f.eye = a.eyeOverride; if (a.mouthOverride) f.mouth = a.mouthOverride;
  const tilt = (o.tilt + (a.sway || 0)) * PI / 180, fin = K.get('finish', o.finish), acc = K.get('accessory', o.acc);
  const X = opt.hero ? extrasCtx(W, o, a, u, sh, W * (opt.cy || .5) - (a.hop || 0) * u * .42) : null;
  if (X && a.st && a.st.back) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; a.st.back(c, X); c.restore(); }
  c.save();
  c.translate(W / 2 + ((a.shake || 0) + (a.dx || 0)) * u, W * (opt.cy || .5));
  const baseY = u * (sh.floor ?? sh.bottom);
  c.translate(0, baseY - (a.hop || 0) * u * .42);
  /* flip: horizontal mirror/turn (−1…1, e.g. spinning); faceAlpha hides the face when turned away */
  c.scale((1 + (a.squash || 0)) * sc * (a.flip ?? 1), (1 - (a.squash || 0)) * sc);
  c.translate(0, -baseY);
  c.rotate(tilt);
  c.scale(u, u);
  /* B = what finishes and accessories get to work with */
  const B = { sh, path: sh.path, pts: sh.pts, color: C, ink, t: a.t ?? 0, rim: (deg, off) => rimPt(sh, deg, off),
    top: [0, topAt0(sh)], cc: K.complement(C), dark: K.darken(C, .22), light: K.lighten(C, .55), lum: lum(C) };
  const accA = 1 - clamp((melt - .3) / .35, 0, 1);
  if (acc && acc.back && accA > 0) { c.save(); c.globalAlpha *= accA; acc.back(c, B); c.restore(); }
  if (fin && fin.under) { c.save(); fin.under(c, B); c.restore(); }
  c.fillStyle = C;
  if (sh.handle) { const h = sh.handle; c.strokeStyle = C; c.lineWidth = h.lw; rrect(c, h.x, h.y, h.w, h.h, h.r); c.stroke(); }
  if (fin && fin.body) { c.save(); fin.body(c, B); c.restore(); } else c.fill(sh.path);
  if (sh.decor) { c.save(); sh.decor(c, B); c.restore(); }
  if (fin && fin.over) { c.save(); fin.over(c, B); c.restore(); }
  if (acc && acc.front && accA > 0) { c.save(); c.globalAlpha *= accA; acc.front(c, B); c.restore(); }
  const fa = a.faceAlpha ?? 1;
  if (fa > .01) { c.save(); c.globalAlpha *= fa; c.translate(a.look.x * .1, sh.fy + a.look.y * .07); c.scale(sh.fs * FACE, sh.fs * FACE); drawFace(c, o, f, a, ink); c.restore(); }
  c.restore();
  if (X) drawExtras(c, X, a);
  return sh;
}

/* state extras (thought bubbles, zzz, sparkles…) live in screen space around the body.
   X is shared by st.back (drawn BEHIND the body) and st.extras (drawn in front). */
function extrasCtx(W, o, a, u, sh, cy) {
  const cx = W / 2 + (a.dx || 0) * u, [r0, g0, b0] = hexToRgb(o.color), sq = a.squash || 0, sc = a.scale ?? 1;
  /* where the body really is on screen this frame (after squash/stretch around the floor) */
  const floorY = cy + u * (sh.floor ?? sh.bottom), topY = floorY + (cy + topAt0(sh) * u - floorY) * (1 - sq) * sc;
  return {
    t: a.t ?? 0, p: a.p ?? 0, u, cx, cy, o, a, fg: R.pageInk, topY, floorY, bx: cx + (a.shake || 0) * u,
    tint: `rgb(${[r0, g0, b0].map(v => Math.round(v + (255 - v) * .62)).join(',')})`,
    /* screen point on the rim at `deg`, pushed out by `off` body-radii */
    Q: (deg, off) => { const an = deg * PI / 180, r = edgeR(sh, an) + off; return [cx + Math.sin(an) * r * u, cy - Math.cos(an) * r * u]; },
  };
}
function drawExtras(c, X, a) {
  const st = a.st, u = X.u;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (st && st.extras) st.extras(c, X);
  if (a.hearts != null) { c.fillStyle = '#FF5AA5';
    [-28, 4, 34].forEach((d, k) => { const v = K.span(a.hearts, .04 + k * .1, .75 + k * .08); if (v <= 0 || v >= 1) return; const [x, y] = X.Q(d, .08 + v * .55), r = .075 * u * Math.sin(v * PI);
      c.beginPath(); c.arc(x - r / 2, y, r / 2, PI, 0); c.arc(x + r / 2, y, r / 2, PI, 0); c.lineTo(x, y + r * 1.15); c.closePath(); c.fill(); }); }
  c.restore();
}

const REST = st => ({ t: 0, st, blink: 0, look: { x: 0, y: 0 }, hop: 0, shake: 0, squash: 0, sway: 0 });
/* the choreography of a state at phase p∈[0,1) (T = seconds, for continuous wobbles) */
function choreo(st, p, T) {
  const C = { melt: 0, dx: 0, flip: 1, faceAlpha: 1, look: null, blink: 0, hop: 0, squash: 0, sway: 0, shake: 0, eyeDX: 0, eyeDY: 0, eyeSX: 1, eyeSY: 1, eyePop: 1, merge: 0, mx: 0, my: 0, swirl: 0 };
  if (st && st.move) st.move(C, p, T, st.cycle);
  return C;
}
/* a full animation frame for state st at phase p, ready for drawBlob */
function frameOf(st, p, extra) {
  const T = p * st.cycle, C = choreo(st, p, T);
  return { ...C, t: T, p, st, look: { x: (C.look || [0, 0])[0], y: (C.look || [0, 0])[1] }, scale: 1, ...extra };
}

/* ---------- share token ----------
   "m2" + one base-36 char per field + colour hex. Index = position in the registry. */
const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
const FIELDS = [
  ['shape', () => K.reg.shape], ['eyes', () => K.reg.eye], ['brows', () => K.reg.brow], ['ink', () => INKS],
  ['size', null, v => (v - 60) / 5, n => clamp(60 + n * 5, 60, 150)],
  ['gap', null, v => (v - 55) / 5, n => clamp(55 + n * 5, 55, 160)],
  ['tilt', null, v => v + 15, n => clamp(n - 15, -15, 15)],
  ['state'],
  /* m2 additions */
  ['finish', () => K.reg.finish], ['cheeks', () => K.reg.cheek], ['acc', () => K.reg.accessory], ['mouth', () => K.reg.mouth],
];
function encode(o, stateIdx) {
  return 'm2' + FIELDS.map(([key, list, enc]) => {
    const v = key === 'state' ? stateIdx : list ? Math.max(0, list().findIndex(x => x.id === o[key])) : enc(o[key]);
    return B36[clamp(Math.round(v), 0, 35)];
  }).join('') + o.color.replace('#', '').toLowerCase();
}
function decode(t) {
  const m = /^m([12])([0-9a-z]{8,12})([0-9a-f]{6})$/.exec(t || ''); if (!m) return null;
  const n = m[1] === '1' ? 8 : 12; if (m[2].length !== n) return null;
  const v = [...m[2]].map(ch => B36.indexOf(ch)), o = K.P(null, '#' + m[3].toUpperCase(), null); let state = 0;
  for (let i = 0; i < n; i++) { const [key, list, , dec] = FIELDS[i];
    if (key === 'state') { state = v[i]; continue; }
    if (list) { const it = list()[v[i]]; if (!it) return null; o[key] = it.id; } else o[key] = dec(v[i]); }
  return { o, state };
}
/* same mascot whatever its state (char 9 = state) */
const baseTok = t => t.slice(0, 9) + '0' + t.slice(10);

const R = window.CUTE.R = {
  FACE, INKS, shapeOf, compiled, blend, puddleOf, eyeDef, sideEye, eyeHalf, inkOf, faceSpec, drawFace, drawBlob, drawExtras, REST, choreo, frameOf,
  rimPt, edgeR, encode, decode, baseTok, pageInk: '#18181B',
};
})();
