/* =====================================================================
   Cute Lab · export
   SvgCtx is a fake CanvasRenderingContext2D: drawBlob() runs on it unchanged and
   it writes SVG instead of pixels. Animated SVG = the state's choreography sampled
   at N fps, each distinct frame toggled by SMIL <animate> (no script, works in <img>).
   GIF = same frames rendered to a canvas, 256-colour palette, LZW.
   ===================================================================== */
(function () {
'use strict';
const K = CUTE, R = K.R, { TAU, PI } = K;
const EXP = 512, BRAND = 'Cute Lab';

class SvgCtx {
  /* shared: defs, reusable body paths and the id counter, common to every frame of one animation */
  constructor(shared) { this.sh = shared || { defs: [], ids: new Map(), n: 0 }; this.m = [1, 0, 0, 1, 0, 0]; this.stack = []; this.fillStyle = '#000'; this.strokeStyle = '#000'; this.lineWidth = 1; this.lineCap = 'butt'; this.lineJoin = 'miter'; this.globalAlpha = 1; this.clipId = null; this.body = []; this.d = ''; this.has = false; this.el = null; this._in = false; }
  save() { this.stack.push([this.m.slice(), this.fillStyle, this.strokeStyle, this.lineWidth, this.lineCap, this.lineJoin, this.globalAlpha, this.clipId]); }
  restore() { const s = this.stack.pop(); if (s) [this.m, this.fillStyle, this.strokeStyle, this.lineWidth, this.lineCap, this.lineJoin, this.globalAlpha, this.clipId] = s; }
  _mul(a2, b2, c2, d2, e2, f2) { const [a, b, c, d, e, f] = this.m; this.m = [a * a2 + c * b2, b * a2 + d * b2, a * c2 + c * d2, b * c2 + d * d2, a * e2 + c * f2 + e, b * e2 + d * f2 + f]; }
  translate(x, y) { this._mul(1, 0, 0, 1, x, y); } scale(x, y) { this._mul(x, 0, 0, y, 0, 0); } rotate(t) { const c = Math.cos(t), s = Math.sin(t); this._mul(c, s, -s, c, 0, 0); }
  setTransform(a, b, c, d, e, f) { this.m = [a, b, c, d, e, f]; } clearRect() {}
  _p(x, y) { const [a, b, c, d, e, f] = this.m; return (a * x + c * y + e).toFixed(1) + ' ' + (b * x + d * y + f).toFixed(1); }
  _mx(m) { return `matrix(${m.map((v, i) => v.toFixed(i < 4 ? 3 : 1)).join(' ')})`; }
  beginPath() { this.d = ''; this.has = false; this.el = null; }
  moveTo(x, y) { this.d += 'M' + this._p(x, y); this.has = true; if (!this._in) this.el = null; }
  lineTo(x, y) { this.d += (this.has ? 'L' : 'M') + this._p(x, y); this.has = true; if (!this._in) this.el = null; }
  closePath() { this.d += 'Z'; this.el = null; }
  quadraticCurveTo(cx, cy, x, y) { this.d += 'Q' + this._p(cx, cy) + ' ' + this._p(x, y); this.el = null; }
  bezierCurveTo(c1x, c1y, c2x, c2y, x, y) { this.d += 'C' + this._p(c1x, c1y) + ' ' + this._p(c2x, c2y) + ' ' + this._p(x, y); this.el = null; }
  rect(x, y, w, h) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); }
  arc(x, y, r, a0, a1, ccw) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
    let sw = a1 - a0;
    if (!ccw) { if (sw >= TAU) sw = TAU; else if (sw < 0) sw = sw % TAU + TAU; } else { if (sw <= -TAU) sw = -TAU; else if (sw > 0) sw = sw % TAU - TAU; }
    const full = !this.has && Math.abs(sw) >= TAU - 1e-9, N = Math.max(6, Math.ceil(Math.abs(sw) / TAU * 72)), cr = Math.cos(rot), sr = Math.sin(rot);
    this._in = true; for (let i = 0; i <= N; i++) { const t = a0 + sw * i / N, ex = Math.cos(t) * rx, ey = Math.sin(t) * ry; this.lineTo(x + ex * cr - ey * sr, y + ex * sr + ey * cr); } this._in = false;
    this.el = full ? { x, y, rx, ry, rot, m: this.m.slice() } : null;
  }
  _a() { return this.globalAlpha < 1 ? ` opacity="${this.globalAlpha.toFixed(3)}"` : ''; }
  /* the clip goes on a parent <g>: on the element itself it would be transformed twice */
  _push(tag) { this.body.push(this.clipId ? `<g clip-path="url(#${this.clipId})">${tag}</g>` : tag); }
  primRect(x, y, w, h, r) { this.rect(x, y, w, h); this.el = { rect: 1, x, y, w, h, r, m: this.m.slice() }; }
  _ellTag(extra) { const e = this.el; if (e.rect) return `<rect x="${e.x.toFixed(4)}" y="${e.y.toFixed(4)}" width="${e.w.toFixed(4)}" height="${e.h.toFixed(4)}" rx="${e.r.toFixed(4)}" transform="${this._mx(e.m)}"${extra}/>`; return `<ellipse cx="${e.x.toFixed(4)}" cy="${e.y.toFixed(4)}" rx="${e.rx.toFixed(4)}" ry="${e.ry.toFixed(4)}" transform="${this._mx(e.m)}${e.rot ? ` rotate(${(e.rot * 180 / PI).toFixed(2)} ${e.x.toFixed(4)} ${e.y.toFixed(4)})` : ''}"${extra}/>`; }
  /* a Path2D from a shape (the body) is written once in <defs>, then reused with its matrix */
  _use(p, extra) {
    let id = this.sh.ids.get(p);
    if (!id) { id = (this.sh.pre || '') + 's' + (this.sh.n++); this.sh.ids.set(p, id); this.sh.defs.push(`<path id="${id}" d="${p.pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(3) + ' ' + y.toFixed(3)).join('')}Z"/>`); }
    return `<use href="#${id}" transform="${this._mx(this.m)}"${extra}/>`;
  }
  fill(p) { const f = ` fill="${this.fillStyle}"${this._a()}`; this._push(p && p.pts ? this._use(p, f) : !p && this.el ? this._ellTag(f) : `<path d="${this.d}"${f}/>`); }
  stroke(p) {
    const [a, b, c, d] = this.m, k = Math.sqrt(Math.abs(a * d - b * c)), cap = ` stroke-linecap="${this.lineCap}" stroke-linejoin="${this.lineJoin}"${this._a()}`;
    if (p && p.pts) this._push(this._use(p, ` fill="none" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth.toFixed(4)}"` + cap));
    else if (this.el) this._push(this._ellTag(` fill="none" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth.toFixed(4)}"` + cap));
    else this._push(`<path d="${this.d}" fill="none" stroke="${this.strokeStyle}" stroke-width="${(this.lineWidth * k).toFixed(2)}"` + cap + '/>');
  }
  fillRect(x, y, w, h) { const d = this.d, h0 = this.has, e = this.el; this.beginPath(); this.rect(x, y, w, h); this.fill(); this.d = d; this.has = h0; this.el = e; }
  clip() { const id = (this.sh.pre || '') + 'k' + (this.sh.n++), inner = this.el ? this._ellTag('') : `<path d="${this.d}"/>`;
    this.sh.defs.push(`<clipPath id="${id}"${this.clipId ? ` clip-path="url(#${this.clipId})"` : ''}>${inner}</clipPath>`); this.clipId = id; }
  svg(n) { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${n}" height="${n}">${this.sh.defs.length ? '<defs>' + this.sh.defs.join('') + '</defs>' : ''}${this.body.join('')}</svg>`; }
}

const HERO = { hero: true, u: .3, cy: .58 };
const wrap = (title, q) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EXP} ${EXP}" width="${EXP}" height="${EXP}"><title>${BRAND} · ${title}</title><defs>${q.defs}</defs>${q.body}</svg>`;
/* animated: sample the loop, merge identical consecutive frames, toggle them with discrete SMIL opacity */
function animParts(st, o, pre = '', fps = 20) {
  const cyc = st.cycle, N = Math.round(cyc * fps), sh = { defs: [], ids: new Map(), n: 0, pre }, frames = [];
  for (let i = 0; i < N; i++) { const x = new SvgCtx(sh); R.drawBlob(x, EXP, o, R.frameOf(st, i / N), HERO); frames.push(x.body.join('')); }
  const runs = []; frames.forEach((f, i) => { const r = runs[runs.length - 1]; if (r && r.html === f) r.e = i + 1; else runs.push({ s: i, e: i + 1, html: f }); });
  const kt = v => (v / N).toFixed(4);
  const body = runs.map(r => { if (runs.length === 1) return r.html;
    const [vals, kts] = r.s === 0 ? ['1;0', `0;${kt(r.e)}`] : r.e === N ? ['0;1', `0;${kt(r.s)}`] : ['0;1;0', `0;${kt(r.s)};${kt(r.e)}`];
    return `<g${r.s ? ' opacity="0"' : ''}><animate attributeName="opacity" values="${vals}" keyTimes="${kts}" dur="${cyc}s" calcMode="discrete" repeatCount="indefinite"/>${r.html}</g>`; }).join('');
  return { defs: sh.defs.join(''), body };
}
/* static: the state's most telling pose (st.pose) */
const drawPose = (c, st, o) => R.drawBlob(c, EXP, o, R.frameOf(st, st.pose || 0), HERO);
function staticParts(st, o, pre = '') { const sh = { defs: [], ids: new Map(), n: 0, pre }, x = new SvgCtx(sh); drawPose(x, st, o); return { defs: sh.defs.join(''), body: x.body.join('') }; }
const animSvg = (st, o) => wrap(st.label, animParts(st, o));
const stateSvg = (st, o) => wrap(st.label, staticParts(st, o));
/* plain mascot at rest, bigger in the frame (Copy PNG / plain SVG) */
const drawPlain = (c, o) => R.drawBlob(c, EXP, o, R.REST(K.reg.state[0]), { u: .4, cy: .5 });
function plainSvg(o) { const x = new SvgCtx(); drawPlain(x, o); return x.svg(EXP); }
function png(o, n) { const cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d'); c.scale(n / EXP, n / EXP); drawPlain(c, o); return cv; }

/* every state on one sheet, 4 per row, label underneath */
function sheet(anim, o, pre = 'e') {
  const S = K.reg.state, cell = 256, lab = 34, cols = 4, W = cell * cols, H = (cell + lab) * Math.ceil(S.length / cols); let defs = '', body = '';
  S.forEach((st, i) => { const q = anim ? animParts(st, o, pre + i, 12) : staticParts(st, o, pre + i), x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + lab); defs += q.defs;
    body += `<g transform="translate(${x} ${y}) scale(.5)">${q.body}</g><text x="${x + cell / 2}" y="${y + cell + 18}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="16" font-weight="600" fill="#5B5B62" text-anchor="middle">${st.label}</text>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><title>${BRAND} · all states</title><defs>${defs}</defs>${body}</svg>`;
}
/* a team: one row per mascot, one column per state */
function teamSheet(anim, list) {
  const S = K.reg.state, cell = 160, lab = 32, W = cell * S.length, H = lab + cell * list.length; let defs = '', body = '';
  S.forEach((st, j) => { body += `<text x="${j * cell + cell / 2}" y="${lab - 10}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="15" font-weight="600" fill="#5B5B62" text-anchor="middle">${st.label}</text>`; });
  list.forEach((o, i) => S.forEach((st, j) => { const q = anim ? animParts(st, o, `t${i}e${j}`, 12) : staticParts(st, o, `t${i}e${j}`); defs += q.defs;
    body += `<g transform="translate(${j * cell} ${lab + i * cell}) scale(${cell / EXP})">${q.body}</g>`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><title>${BRAND} · team</title><defs>${defs}</defs>${body}</svg>`;
}

/* ---------- zip, stored (no compression): text + already-compressed PNG/GIF ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(d) { let c = ~0; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return ~c >>> 0; }
function zip(files) {
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  for (const f of files) { const nm = enc.encode(f.name), d = f.data, crc = crc32(d), h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46));
    [[0, 0x04034b50, 4], [4, 20], [6, 0x0800], [12, 0x21], [14, crc, 4], [18, d.length, 4], [22, d.length, 4], [26, nm.length]].forEach(([o, v, s]) => s ? h.setUint32(o, v, true) : h.setUint16(o, v, true));
    [[0, 0x02014b50, 4], [4, 20], [6, 20], [8, 0x0800], [14, 0x21], [16, crc, 4], [20, d.length, 4], [24, d.length, 4], [28, nm.length], [42, off, 4]].forEach(([o, v, s]) => s ? c.setUint32(o, v, true) : c.setUint16(o, v, true));
    parts.push(h, nm, d); cen.push(c, nm); off += 30 + nm.length + d.length; }
  const csz = cen.reduce((s, x) => s + x.byteLength, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csz, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, e], { type: 'application/zip' });
}

/* ---------- GIF: pass 1 counts colours (15-bit histogram → 255 most frequent), pass 2 indexes + LZW ---------- */
const GIF_FPS = 20, GIF_MAX = 512;
const LZW_T = new Int32Array(1 << 20), LZW_G = new Int32Array(1 << 20); let lzwGen = 0;
function lzw(ix, out) {
  const min = 8, clear = 256, eoi = 257; let size = 9, next = 258, cur = 0, nb = 0, gen = ++lzwGen; const bytes = [];
  const put = c => { cur |= c << nb; nb += size; while (nb >= 8) { bytes.push(cur & 255); cur >>>= 8; nb -= 8; } };
  put(clear); let p = ix[0];
  for (let i = 1; i < ix.length; i++) { const k = ix[i], key = p << 8 | k; if (LZW_G[key] === gen) { p = LZW_T[key]; continue; }
    put(p); if (next === 4096) { put(clear); next = 258; size = 9; gen = ++lzwGen; } else { if (next >= 1 << size) size++; LZW_T[key] = next++; LZW_G[key] = gen; } p = k; }
  put(p); put(eoi); if (nb > 0) bytes.push(cur & 255);
  out.push(min); for (let i = 0; i < bytes.length; i += 255) { const n = Math.min(255, bytes.length - i); out.push(n); for (let j = 0; j < n; j++) out.push(bytes[i + j]); } out.push(0);
}
const tick = () => new Promise(r => setTimeout(r, 0));
async function gif(st, o, n, bg) {
  const N = Math.round(st.cycle * GIF_FPS), T = bg === 'transparent', cv = document.createElement('canvas'); cv.width = cv.height = n;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const render = i => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, n, n); if (!T) { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, n, n); } c.scale(n / EXP, n / EXP); R.drawBlob(c, EXP, o, R.frameOf(st, i / N), HERO); return c.getImageData(0, 0, n, n).data; };
  const cnt = new Uint32Array(32768), sum = new Float64Array(32768 * 3);
  for (let i = 0; i < N; i++) { const d = render(i); for (let j = 0; j < d.length; j += 4) { if (d[j + 3] < 128) continue; const b = (d[j] >> 3) << 10 | (d[j + 1] >> 3) << 5 | d[j + 2] >> 3; cnt[b]++; sum[b * 3] += d[j]; sum[b * 3 + 1] += d[j + 1]; sum[b * 3 + 2] += d[j + 2]; } if (i % 8 === 7) await tick(); }
  const top = [...cnt.keys()].filter(b => cnt[b]).sort((a, b) => cnt[b] - cnt[a]).slice(0, 255);
  const pal = top.map(b => [0, 1, 2].map(k => Math.round(sum[b * 3 + k] / cnt[b]))), TR = 255, lut = new Int16Array(32768).fill(-1);
  const near = b => { const r = (b >> 10) * 8 + 4, g = (b >> 5 & 31) * 8 + 4, bl = (b & 31) * 8 + 4; let m = 0, md = 1e9; pal.forEach(([pr, pg, pb], i) => { const d = (pr - r) ** 2 * 2 + (pg - g) ** 2 * 4 + (pb - bl) ** 2 * 3; if (d < md) { md = d; m = i; } }); return m; };
  top.forEach((b, i) => lut[b] = i);
  const out = [...'GIF89a'].map(ch => ch.charCodeAt(0)), w16 = v => out.push(v & 255, v >> 8 & 255);
  w16(n); w16(n); out.push(0xF7, 0, 0); for (let i = 0; i < 256; i++) { const q = pal[i] || [255, 255, 255]; out.push(q[0], q[1], q[2]); }
  out.push(0x21, 0xFF, 11, ...[...'NETSCAPE2.0'].map(ch => ch.charCodeAt(0)), 3, 1, 0, 0, 0);
  const frames = []; let prev = null;
  for (let i = 0; i < N; i++) { const d = render(i), ix = new Uint8Array(n * n);
    for (let j = 0, q = 0; q < ix.length; j += 4, q++) { if (T && d[j + 3] < 128) { ix[q] = TR; continue; } const b = (d[j] >> 3) << 10 | (d[j + 1] >> 3) << 5 | d[j + 2] >> 3; ix[q] = lut[b] >= 0 ? lut[b] : (lut[b] = near(b)); }
    if (prev && ix.every((v, q) => v === prev.ix[q])) { prev.len++; continue; } prev = { ix, len: 1 }; frames.push(prev); if (i % 8 === 7) await tick(); }
  for (const f of frames) { const delay = Math.round(f.len * 100 / GIF_FPS);
    out.push(0x21, 0xF9, 4, T ? (2 << 2) | 1 : (1 << 2), delay & 255, delay >> 8 & 255, T ? TR : 0, 0);
    out.push(0x2C); w16(0); w16(0); w16(n); w16(n); out.push(0); lzw(f.ix, out); await tick(); }
  out.push(0x3B); return new Uint8Array(out);
}
/* one mascot's states as files: svg/ (animated or static), png/ (pose), gif/, plus the sheet */
async function stateFiles(o, dir, n, opt) {
  const enc = new TextEncoder(), files = [];
  for (const [i, st] of K.reg.state.entries()) { const base = `${String(i + 1).padStart(2, '0')}-${st.id}`;
    files.push({ name: `${dir}svg/${base}.svg`, data: enc.encode(opt.anim ? animSvg(st, o) : stateSvg(st, o)) });
    const cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d'); c.scale(n / EXP, n / EXP); drawPose(c, st, o);
    const b = await new Promise(r => cv.toBlob(r, 'image/png')); files.push({ name: `${dir}png/${base}.png`, data: new Uint8Array(await b.arrayBuffer()) });
    files.push({ name: `${dir}gif/${base}.gif`, data: await gif(st, o, Math.min(n, GIF_MAX), opt.gifBg) }); }
  files.push({ name: `${dir}all-states.svg`, data: enc.encode(sheet(opt.anim, o, dir.replace(/\W/g, '') + 'e')) });
  return files;
}

K.X = { EXP, BRAND, GIF_MAX, SvgCtx, animSvg, stateSvg, plainSvg, png, sheet, teamSheet, zip, gif, stateFiles };
})();
