/* =====================================================================
   STATES · what the agent is doing, each one a looping choreography
   { id, label,
     cycle   loop length in seconds
     pose    phase 0…1 of the most telling frame (static SVG / PNG export)
     follow? { k, always?, sway? }  eyes follow the pointer (k = strength; always = even
             when the pointer is idle; sway = extra body lean toward it)
     face?(f, live)   override the face: f = { eye, brows, mouth, k (eye boost) }
                      live = true on the big interactive preview
     move(C, p, T, cycle)  set the motion channels for phase p∈[0,1) (T = seconds):
        look [x,y] −1…1 · blink 0…1 · hop (up, in body radii) · squash (+ wide/− tall)
        sway (degrees) · shake · eyeDX/eyeDY · eyeSX/eyeSY · eyePop · swirl (spiral eyes)
     extras?(c, X)  little signs drawn around the body, in screen pixels (in FRONT of the body)
     back?(c, X)    same, drawn BEHIND the body (things coming out of / going into it)
        X = { t, p, u (body radius px), cx, cy, bx (cx incl. shake), topY / floorY (real head top and floor
              this frame, after stretch), Q(deg, off) → [x,y] on the rim, tint, fg, o, a (the frame) } }
   Rules of thumb:  never move linearly — easeIO / easeBack;
   blinks close fast (90 ms) and open slower (140 ms); looks overshoot then settle;
   every channel returns to rest by p = 1 so the loop is seamless.
   ORDER = order in the dock and in exports. Index is stored in share links: APPEND ONLY.
   ===================================================================== */
(function () {
const { define, TAU, PI, clamp, ell, rrect, sparkle, easeIO, easeBack, span, bump, blinkAmt, track, fallH, FALL_T } = CUTE;
const STATUS = { alert: '#FFA42B', error: '#F2545B' };

define('state', { id: 'idle', label: 'Idle', cycle: 5.5, pose: 0, follow: { k: .75 },
  move(C, p, T, cyc) {
    C.look = track([[0, 0, 0], [.12, 0, 0], [.2, .75, -.55, easeBack], [.42, .75, -.55], [.5, -.65, .3, easeBack], [.7, -.65, .3], [.78, 0, 0, easeBack], [1, 0, 0]], p);
    C.blink = blinkAmt(p, [{ c: .3 }, { c: .8 }, { c: .87, q: 1 }], cyc); C.squash = Math.sin(TAU * T / 3.2) * .02; C.sway = Math.sin(T * 1.1) * 1.5; } });

define('state', { id: 'listen', label: 'Listening', cycle: 4, pose: .2, follow: { k: 1, always: 1, sway: 7 },
  face(f) { f.k = 1.08; },
  move(C, p, T, cyc) { const nod = bump(p, .12, .24) + bump(p, .28, .4); C.hop = -nod * .1; C.squash = nod * .05 + Math.sin(TAU * T / 3) * .015; C.blink = blinkAmt(p, [{ c: .62 }], cyc); C.look = [0, .1]; } });

define('state', { id: 'think', label: 'Thinking', cycle: 5.5, pose: .3,
  move(C, p, T, cyc) {
    const lk = track([[0, 0, 0], [.08, .65, -.7, easeBack], [.46, .65, -.7], [.54, -.6, -.65, easeBack], [.84, -.6, -.65], [.9, 0, -.05, easeBack], [1, 0, 0]], p),
      sq = easeIO(span(p, .56, .64)) * (1 - easeIO(span(p, .8, .86))), aha = bump(p, .88, .97);
    C.look = lk; C.sway = lk[0] * 6; C.eyeSY = 1 - .28 * sq; C.eyePop = 1 + .14 * aha; C.hop = .08 * aha;
    C.squash = -.05 * aha + .05 * (bump(p, .24, .3) + bump(p, .34, .4)) + Math.sin(TAU * T / 3.4) * .012; C.blink = blinkAmt(p, [{ c: .5 }], cyc); },
  /* thought bubbles in a light tint of the body, growing from the rim */
  extras(c, { p, t, u, Q, tint }) {
    [[36, .1, .05], [41, .27, .075], [46, .5, .12]].forEach(([d, off, r], i) => { const k = easeBack(span(p, .1 + .07 * i, .22 + .07 * i)) * (1 - easeIO(span(p, .84, .92))); if (k <= 0) return;
      const [X, Y] = Q(d, off); ell(c, X, Y + Math.sin(t * 2.2 + i) * .015 * u, r * u * k * (i === 2 ? 1.3 : 1), r * u * k); c.fillStyle = tint; c.fill(); }); } });

define('state', { id: 'write', label: 'Writing', cycle: 3.75, pose: .1,
  move(C, p, T, cyc) {
    const fr = (p * 3) % 1, row = Math.floor(p * 3) % 3, ry = [-.5, -.1, .3], dx = fr < .82 ? -1 + 2 * (fr / .82) : 1 - 2 * easeIO((fr - .82) / .18),
      dy = fr < .82 ? ry[row] : ry[row] + (ry[(row + 1) % 3] - ry[row]) * easeIO((fr - .82) / .18);
    C.look = [dx * .8, dy]; C.sway = -2.2 * dx; C.squash = Math.max(0, Math.sin(T * 9)) * .02; C.blink = blinkAmt(p, [{ c: .303, q: 1 }, { c: .637, q: 1 }, { c: .97, q: 1 }], cyc); },
  /* typing bubble with three bouncing dots */
  extras(c, { t, u, Q, tint, o }) { const [X, Y] = Q(45, .08), w = .5 * u, h = .24 * u; rrect(c, X - w / 2, Y - h / 2, w, h, h / 2); c.fillStyle = tint; c.fill();
    c.fillStyle = o.color; for (let k = 0; k < 3; k++) { ell(c, X + (k - 1) * .13 * u, Y - Math.max(0, Math.sin(t * 8 - k * .9)) * .04 * u, .032 * u, .032 * u); c.fill(); } } });

define('state', { id: 'success', label: 'Success', cycle: 3.2, pose: .3,
  face(f) { f.eye = 'happy'; f.mouth = 'open'; },
  move(C, p) {
    const j = span(p, .08, .4), land = span(p, .4, .62), cel = easeIO(span(p, .45, .55)) * (1 - easeIO(span(p, .86, .97)));
    C.hop = j > 0 && j < 1 ? Math.sin(j * PI) : 0;
    C.squash = p < .08 ? .14 * Math.sin(span(p, 0, .08) * PI / 2) : j < 1 ? -.09 * Math.sin(j * PI) + .14 * (1 - span(p, .08, .14)) : .17 * Math.exp(-land * 5) * Math.cos(land * 16);
    C.eyeDX = cel * .07 * Math.sin(TAU * 7 * p); C.eyeDY = -cel * .05 - C.hop * .04; C.sway = cel * 9 * Math.sin(TAU * 7 * p); C.look = [0, -.2]; },
  extras(c, { p, u, Q }) { c.fillStyle = '#FFC20E';
    [-60, -35, -12, 12, 35, 60].forEach((d, i) => { const v = span(p, .1 + .03 * i, .62 + .03 * i); if (v <= 0 || v >= 1) return; const k = Math.sin(v * PI), [X, Y] = Q(d, .12 + .3 * easeIO(v)); sparkle(c, X, Y, (.09 + .04 * (i % 2)) * u * k); c.fill(); }); } });

/* status badge (!, ×) on the shoulder */
function badge(c, kind, k, t, u, Q) {
  const r = .17 * u * k * (1 + .05 * Math.sin(t * 6)), [X, Y] = Q(45, .02); if (r <= 0) return;
  c.fillStyle = STATUS[kind]; ell(c, X, Y, r, r); c.fill(); c.save(); c.translate(X, Y); c.scale(k * .9, k * .9); c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = .05 * u;
  if (kind === 'alert') { c.beginPath(); c.moveTo(0, -.09 * u); c.lineTo(0, .02 * u); c.stroke(); ell(c, 0, .08 * u, .03 * u, .03 * u); c.fill(); }
  else { c.beginPath(); c.moveTo(-.06 * u, -.06 * u); c.lineTo(.06 * u, .06 * u); c.moveTo(.06 * u, -.06 * u); c.lineTo(-.06 * u, .06 * u); c.stroke(); }
  c.restore();
}

define('state', { id: 'alert', label: 'Alert', cycle: 3, pose: .3,
  face(f) { f.k = 1.22; if (f.brows !== 'none') f.brows = 'worried'; f.mouth = 'o'; },
  move(C, p, T, cyc) {
    const pop = easeBack(span(p, .05, .17)) * (1 - easeIO(span(p, .78, .92))); C.eyePop = 1 + .28 * pop;
    C.hop = bump(p, .05, .2) * .28; C.squash = p < .05 ? .1 * Math.sin(span(p, 0, .05) * PI / 2) : -.08 * bump(p, .05, .2);
    C.shake = p > .17 && p < .3 ? .018 * Math.sin(T * 70) * (1 - span(p, .17, .3)) : 0;
    C.look = track([[0, 0, 0], [.3, 0, 0], [.36, -.85, -.1, easeBack], [.5, -.85, -.1], [.56, .85, -.1, easeBack], [.7, .85, -.1], [.78, 0, 0, easeBack], [1, 0, 0]], p);
    C.blink = blinkAmt(p, [{ c: .9 }], cyc); },
  extras(c, { p, t, u, Q }) { badge(c, 'alert', easeBack(span(p, .05, .2)), t, u, Q); } });

define('state', { id: 'error', label: 'Error', cycle: 5.5, pose: .6,
  /* on the live preview the eyes fall off and bounce; in exports they become × */
  face(f, live) { if (!live) f.eye = 'x'; if (f.brows !== 'none') f.brows = 'worried'; f.mouth = 'frown'; },
  move(C, p, T, cyc) {
    const v = span(p, .1, .45), h = v <= 0 ? 1 : fallH(v), drop = .24, up = easeBack(span(p, .82, .95));
    C.eyeDY = drop * (1 - h) * (1 - up);
    if (v > 0 && v < 1) { const cq = clamp(1 - h / .07, 0, 1); C.eyeSY = 1.12 + (.55 - 1.12) * cq; C.eyeSX = 1 / Math.sqrt(C.eyeSY); }
    const p0 = .1 + .35 / FALL_T, w = span(p, p0, p0 + .13); if (w > 0 && w < 1) { const dec = (1 - w) * (1 - w); C.shake = .06 * dec * Math.sin(TAU * 8 * w + 1); C.hop = -.12 * dec * Math.sin(TAU * 9 * w); }
    C.swirl = easeIO(span(p, .45, .55)) * (1 - easeIO(span(p, .72, .82))); C.squash = .05 * span(p, .2, .3) * (1 - span(p, .82, .9)); C.sway = -3 * span(p, .2, .3) * (1 - span(p, .82, .9));
    C.blink = blinkAmt(p, [{ c: .07 }], cyc); C.look = [0, .15]; },
  extras(c, { p, t, u, Q }) { if (p > .2) badge(c, 'error', easeBack(span(p, .21, .33)), t, u, Q); } });

define('state', { id: 'sleep', label: 'Asleep', cycle: 3.4, pose: .5,
  face(f) { f.eye = 'closed'; },
  move(C, p) { C.squash = .035 * Math.sin(TAU * p); C.sway = -3 + Math.sin(TAU * p); C.eyeDY = .04; C.look = [0, .35]; },
  extras(c, { p, u, Q, fg }) { c.strokeStyle = fg; c.lineWidth = .04 * u;
    for (let k = 0; k < 3; k++) { const ph = (p + k / 3) % 1, s = (.04 + k * .012) * u, [X, Y] = Q(30 + ph * 14, .05 + ph * .4);
      c.globalAlpha = .55 * (ph < .16 ? ph / .16 : ph < .72 ? 1 : 1 - (ph - .72) / .28); c.beginPath(); c.moveTo(X - s, Y - s); c.lineTo(X + s, Y - s); c.lineTo(X - s, Y + s); c.lineTo(X + s, Y + s); c.stroke(); }
    c.globalAlpha = 1; } });
/* ---- new ---- */
/* 4 beats per loop: hop on every beat, lean left/right every two, music notes float up */
define('state', { id: 'dance', label: 'Dance', cycle: 2.4, pose: .12,
  face(f) { if (f.mouth === 'none') f.mouth = 'smile'; },
  move(C, p, T, cyc) { const beat = (p * 4) % 1, side = Math.sin(TAU * p * 2);
    C.hop = Math.sin(beat * PI) * .22; C.squash = beat < .15 ? .1 * (1 - beat / .15) : -.05 * Math.sin(beat * PI);
    C.sway = side * 11; C.look = [side * .55, -.25]; C.eyeDY = -C.hop * .03; C.blink = blinkAmt(p, [{ c: .6, q: 1 }], cyc); },
  extras(c, { p, u, Q, fg }) { c.fillStyle = fg; c.strokeStyle = fg; c.lineWidth = .028 * u;
    for (let k = 0; k < 2; k++) { const ph = (p * 2 + k * .5) % 1, side = k ? 1 : -1, [X, Y] = Q(side * (48 + ph * 10), .12 + ph * .45), r = .05 * u;
      c.globalAlpha = .7 * (ph < .15 ? ph / .15 : ph < .7 ? 1 : 1 - (ph - .7) / .3);
      ell(c, X, Y, r * 1.15, r * .85, -.4); c.fill(); c.beginPath(); c.moveTo(X + r, Y); c.lineTo(X + r, Y - r * 3.2); c.quadraticCurveTo(X + r * 2.4, Y - r * 2.6, X + r * 2.2, Y - r * 1.4); c.stroke(); }
    c.globalAlpha = 1; } });
/* shiver → melt from the bottom up into a puddle (C.melt 0…1, see R.blend 'melt') → × eyes,
   a little ghost drifts up, bubbles pop → the puddle pulls itself back together (seamless loop) */
define('state', { id: 'dead', label: 'Dead', cycle: 6.5, pose: .62,
  move(C, p, T, cyc) {
    const down = span(p, .1, .5), up = easeIO(span(p, .82, .96));
    C.melt = Math.min(down, 1 - up);
    C.shake = p < .1 ? .025 * Math.sin(T * 60) * bump(p, 0, .1) : 0; C.eyePop = 1 + .2 * bump(p, 0, .1);
    if (p > .1 && p < .93) { C.eyeOverride = 'x'; C.mouthOverride = C.melt > .55 ? 'none' : C.melt > .2 ? 'frown' : null; }
    C.eyeSY = 1 - .35 * C.melt; C.look = [0, .3 * C.melt];
    C.squash = C.melt > .95 ? .02 * Math.sin(TAU * p * 6) : 0;
    const pop = bump(p, .95, 1); C.hop = .25 * pop; C.squash += -.06 * pop + .08 * bump(p, .9, .95);
    C.blink = blinkAmt(p, [{ c: .05, q: 1 }], cyc); },
  extras(c, { p, t, u, cx, cy, o, tint }) {
    const floor = cy + CUTE.R.compiled(o.shape).bottom * u;
    /* the soul */
    const v = span(p, .5, .86); if (v > 0 && v < 1) { const g = CUTE.R.compiled('ghost'), s = .32 * u, x = cx + Math.sin(v * 9) * .12 * u, y = floor - u * (.35 + v * 1.7);
      c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = .9 * Math.sin(v * PI); c.fillStyle = tint; c.strokeStyle = CUTE.darken(o.color, .15); c.lineWidth = .08; c.fill(g.path); c.stroke(g.path);
      c.fillStyle = '#141416'; ell(c, -.28, -.12, .09, .12); c.fill(); ell(c, .28, -.12, .09, .12); c.fill(); c.restore(); }
    /* bubbles popping on the puddle */
    c.strokeStyle = CUTE.darken(o.color, .2); c.lineWidth = .025 * u;
    [[-.7, .52], [.35, .6], [.95, .68]].forEach(([dx, ph], i) => { const w = span(p, ph - .04 + i * .03, ph + .1 + i * .03); if (w <= 0 || w >= 1) return;
      c.globalAlpha = 1 - w; ell(c, cx + dx * u, floor - .08 * u - w * .25 * u, (.04 + w * .05) * u, (.04 + w * .05) * u); c.stroke(); });
    c.globalAlpha = 1; } });
/* ---- slime pulls a sword out of its own body, swings it twice, swallows it back ----
   Sword local space: origin = middle of the grip, +y = towards the blade tip, lengths × u.
   rot 0 = blade pointing down (stuck in the body), rot π = blade up. Blade direction angle on screen = rot + π/2.
   Pull & swallow are drawn in st.back (behind the body, so the buried part is hidden); flight, hold and swings in st.extras. */
const SWORD_K = .86, SWORD = { blade: '#E9F0F7', edge: '#9FB2C6', fuller: '#C3D0DD', gold: '#FFC20E', grip: '#8A5A3A', wrap: '#5E3B24' };
function drawSword(c, x, y, rot, u, gem, glint) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = SWORD.edge; c.beginPath(); c.moveTo(-.1 * u, .04 * u); c.lineTo(-.1 * u, 1.04 * u); c.lineTo(0, 1.28 * u); c.lineTo(.1 * u, 1.04 * u); c.lineTo(.1 * u, .04 * u); c.closePath(); c.fill();
  c.fillStyle = SWORD.blade; c.beginPath(); c.moveTo(-.068 * u, .06 * u); c.lineTo(-.068 * u, 1.03 * u); c.lineTo(0, 1.21 * u); c.lineTo(.068 * u, 1.03 * u); c.lineTo(.068 * u, .06 * u); c.closePath(); c.fill();
  c.strokeStyle = SWORD.fuller; c.lineWidth = .026 * u; c.beginPath(); c.moveTo(0, .12 * u); c.lineTo(0, .98 * u); c.stroke();
  c.fillStyle = SWORD.grip; rrect(c, -.05 * u, -.33 * u, .1 * u, .32 * u, .04 * u); c.fill();
  c.strokeStyle = SWORD.wrap; c.lineWidth = .022 * u; for (const k of [-.25, -.16, -.07]) { c.beginPath(); c.moveTo(-.05 * u, k * u); c.lineTo(.05 * u, (k + .045) * u); c.stroke(); }
  c.fillStyle = SWORD.gold; ell(c, 0, -.37 * u, .075 * u, .075 * u); c.fill(); rrect(c, -.25 * u, -.035 * u, .5 * u, .085 * u, .042 * u); c.fill();
  c.fillStyle = gem; ell(c, 0, .007 * u, .045 * u, .045 * u); c.fill();
  if (glint > 0) { c.fillStyle = '#FFFFFF'; c.globalAlpha *= glint; sparkle(c, .02 * u, .95 * u, .2 * u * glint, .28); c.fill(); }
  c.restore();
}
const lerp2 = (A, B, k) => [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k];
const quad2 = (A, Cc, B, k) => lerp2(lerp2(A, Cc, k), lerp2(Cc, B, k), k);
/* where the sword is at phase p */
function swordPose(p, X) {
  const { u, bx, cy, topY } = X, U = u * SWORD_K, G = d => [bx, topY + d * U];
  const HOLD = [bx + 1.02 * u, cy - .3 * u], UP1 = [bx + .82 * u, cy - .55 * u], DN1 = [bx + 1.08 * u, cy + .05 * u], UP2 = [bx + .92 * u, cy - .45 * u];
  const R = { layer: 'back', pos: G(.45), rot: 0, trail: null, glint: 0 };
  if (p < .4) { let d = .45 + (-.02 - .45) * easeBack(span(p, .04, .12));
    d -= .25 * (easeBack(span(p, .15, .21)) + easeBack(span(p, .23, .29)) + easeBack(span(p, .31, .38)));
    R.pos = G(d); R.rot = .05 * Math.sin(p * 260) * span(p, .14, .2) * (1 - span(p, .38, .4)); return R; }
  if (p < .44) { const d = -.77 + (-1.31 + .77) * (1 - Math.pow(1 - span(p, .4, .44), 3)); R.pos = G(d); R.layer = d < -1.3 ? 'front' : 'back'; return R; }
  R.layer = 'front';
  if (p < .56) { const f = span(p, .44, .56), e = easeIO(f); R.pos = quad2(G(-1.31), [bx + .7 * u, topY - .9 * u], HOLD, e); R.rot = (PI + .4 + TAU) * e; return R; }
  if (p < .62) { R.pos = [HOLD[0], HOLD[1] + Math.sin(p * 60) * .015 * u]; R.rot = PI + .4; R.glint = bump(p, .565, .62); return R; }
  if (p < .74) { const w = easeIO(span(p, .62, .66)), s = easeBack(span(p, .66, .7)); R.pos = lerp2(lerp2(HOLD, UP1, w), DN1, s); R.rot = PI + .4 + (-.6) * w + (2.1) * s;
    const fade = 1 - span(p, .68, .76); if (s > 0 && fade > 0) R.trail = { a0: PI - .2 + PI / 2, a1: R.rot + PI / 2, alpha: fade }; return R; }
  if (p < .84) { const w = easeIO(span(p, .74, .77)), s = easeBack(span(p, .77, .81)), DN2 = [DN1[0] - .03 * u, DN1[1] + .05 * u]; R.pos = lerp2(lerp2(DN1, DN2, w), UP2, s);
    const r0 = PI + 1.9, r1 = r0 + .3 * w; R.rot = r1 + (PI - .5 - r1) * s;
    const fade = 1 - span(p, .79, .87); if (s > 0 && fade > 0) R.trail = { a0: r1 + PI / 2, a1: R.rot + PI / 2, alpha: fade }; return R; }
  if (p < .92) { const e = easeIO(span(p, .84, .92)); R.pos = quad2(UP2, [bx + .7 * u, topY - .9 * u], G(-1.31), e); R.rot = (PI - .5) + (TAU - (PI - .5)) * e; return R; }
  { const q = span(p, .92, .97); R.layer = 'back'; R.pos = G(-1.31 + 1.8 * q * q); R.rot = 0; return R; }
}
/* the little goo arm that grows out of the body to hold the sword */
/* the little goo arm that grows out of the body to hold the sword.
   mode 'outline' (draw in st.back, behind the body): a darker, wider stroke — only the part outside the body shows.
   mode 'fill' (draw in st.extras): the arm itself in body colour, merging seamlessly into the body. */
function gooArm(c, X, hand, k, mode = 'fill', root = X.Q(72, -.18), bend = 1) {
  if (k <= 0) return; const { u, o } = X, end = lerp2(root, hand, k), mid = [(root[0] + end[0]) / 2 + .1 * u * bend, (root[1] + end[1]) / 2 + .12 * u * bend];
  c.strokeStyle = mode === 'outline' ? CUTE.darken(o.color, .3) : o.color; c.lineWidth = (mode === 'outline' ? .3 : .22) * u; c.lineCap = 'round';
  c.beginPath(); c.moveTo(root[0], root[1]); c.quadraticCurveTo(mid[0], mid[1], end[0], end[1]); c.stroke();
}
function gooHand(c, X, pos) { const { u, o } = X; c.fillStyle = o.color; c.strokeStyle = CUTE.darken(o.color, .3); c.lineWidth = .04 * u; ell(c, pos[0], pos[1] - .02 * u, .15 * u, .15 * u); c.fill(); c.stroke(); }
const swordArm = p => span(p, .5, .56) * (1 - span(p, .84, .88));
define('state', { id: 'sword', label: 'Sword', cycle: 4.6, pose: .59,
  move(C, p, T, cyc) {
    const tugs = bump(p, .15, .21) + bump(p, .23, .29) + bump(p, .31, .38), strain = span(p, .13, .16) * (1 - span(p, .39, .41));
    C.squash = -.12 * tugs - .03 * strain; C.shake = .01 * Math.sin(T * 55) * strain;
    if (p > .14 && p < .4) { C.eyeOverride = 'squint'; C.mouthOverride = 'flat'; }
    const v = span(p, .4, .56); if (v > 0 && v < 1) { C.squash += .2 * Math.exp(-v * 5) * Math.cos(v * 20); C.eyePop = 1 + .3 * bump(p, .4, .47); }
    C.hop = .14 * bump(p, .54, .6) + .07 * bump(p, .66, .71) + .07 * bump(p, .77, .82);
    const w1 = easeIO(span(p, .62, .66)) * (1 - span(p, .66, .7)), s1 = span(p, .66, .7) * (1 - span(p, .71, .75));
    const w2 = easeIO(span(p, .74, .77)) * (1 - span(p, .77, .81)), s2 = span(p, .77, .81) * (1 - span(p, .82, .86));
    C.sway = -7 * w1 + 11 * s1 + 6 * w2 - 9 * s2 + Math.sin(TAU * p * 2);
    if (bump(p, .66, .72) > .2 || bump(p, .77, .83) > .2) C.mouthOverride = 'open';
    C.squash += .06 * (bump(p, .66, .7) + bump(p, .77, .81)) + .14 * bump(p, .93, .97) - .06 * bump(p, .96, 1);
    if (p > .94 && p < .99) C.eyeOverride = 'happy';
    C.look = p < .14 ? [0, -.6 * span(p, .03, .1)] : p < .44 ? [0, -.85] : p < .56 ? [.4, -.9] : p < .62 ? [.7, -.45] : p < .84 ? [.8, .05] : p < .93 ? [.2, -.9] : [0, 0];
    C.blink = blinkAmt(p, [{ c: .1 }, { c: .6, q: 1 }], cyc); },
  back(c, X) { const P = swordPose(X.p, X); if (P.layer === 'back') drawSword(c, P.pos[0], P.pos[1], P.rot, X.u * SWORD_K, CUTE.complement(X.o.color), 0); else gooArm(c, X, P.pos, swordArm(X.p), 'outline'); },
  extras(c, X) {
    const { p, u } = X, P = swordPose(p, X), arm = swordArm(p), holding = p > .555 && p < .845;
    if (P.layer === 'back') { const pop = bump(p, .4, .5); if (pop > 0) { c.fillStyle = '#FFC20E'; [-40, -15, 15, 40].forEach((d, i) => { const [x, y] = X.Q(d, .15 + .35 * span(p, .4, .5)); sparkle(c, x, y, (.08 + .03 * (i % 2)) * u * pop); c.fill(); }); } return; }
    if (P.trail) { const { a1, alpha } = P.trail, ccw = a1 < P.trail.a0, a0 = ccw ? Math.min(P.trail.a0, a1 + 1.4) : Math.max(P.trail.a0, a1 - 1.4), U = u * SWORD_K;
      c.strokeStyle = '#FFFFFF'; c.globalAlpha = .3 * alpha; c.lineWidth = .32 * U; c.beginPath(); c.arc(P.pos[0], P.pos[1], .85 * U, a0, a1, ccw); c.stroke();
      c.globalAlpha = .8 * alpha; c.lineWidth = .07 * U; c.beginPath(); c.arc(P.pos[0], P.pos[1], 1.15 * U, a0, a1, ccw); c.stroke(); c.globalAlpha = 1; }
    gooArm(c, X, P.pos, arm);
    drawSword(c, P.pos[0], P.pos[1], P.rot, u * SWORD_K, CUTE.complement(X.o.color), P.glint);
    if (holding || arm > .95) gooHand(c, X, P.pos); } });
/* ---- Goo Blade: the sword is grown OUT OF the body — same colour, same finish, darker outline ----
   One outline of GOO_N points that morphs between a goo lump and a sword silhouette (point i ↔ point i,
   matched by angle around a shared centre), so the lump can wobble into a blade and melt back. */
const GOO_N = 160, GOO_K = .78;
const GOO_SWORD = (() => {
  const { PI } = CUTE, p = [];
  /* local space as drawSword: origin = grip middle, +y towards the tip. Clockwise outline starting at the tip. */
  /* chunkier than the metal sword: it's made of goo */
  p.push([0, 1.26], [.15, 1.0], [.15, .08], [.32, .08], [.33, -.06], [.08, -.06], [.08, -.28]);
  for (let i = 1; i < 12; i++) { const a = PI * i / 12; p.push([.11 * Math.cos(a), -.36 - .11 * Math.sin(a)]); }
  p.push([-.08, -.28], [-.08, -.06], [-.33, -.06], [-.32, .08], [-.15, .08], [-.15, 1.0]);
  return CUTE.resample(CUTE.smooth(CUTE.resample(p, GOO_N), 2), GOO_N);
})();
const GOO_C = [0, .45];
/* goo lump with the same point order: each sword point's angle around GOO_C → a point on a wobbly ellipse */
const GOO_LUMP = GOO_SWORD.map(([x, y]) => { const a = Math.atan2(y - GOO_C[1], x), r = .42; return [GOO_C[0] + Math.cos(a) * r, GOO_C[1] + Math.sin(a) * r]; });
function gooOutline(k, t) {
  return GOO_SWORD.map(([sx, sy], i) => { const [lx, ly] = GOO_LUMP[i], d = 1 - clamp(sy / 1.28, 0, 1), q = clamp(k * 1.5 - d * .5, 0, 1), e = easeIO(q) + .08 * Math.sin(PI * q);
    const wob = .012 * Math.sin(PI * q) * Math.sin(i * .12 + t * 7); return [lx + (sx - lx) * e + wob, ly + (sy - ly) * e]; });
}
/* draw the goo blade with the body's own colour + finish, plus a darker rim */
function drawGooBlade(c, X, pos, rot, k, scale) {
  if (scale <= 0) return;
  const { o, u, t } = X, U = u * GOO_K * scale, pts = gooOutline(k, t), path = CUTE.pathOf(pts), fin = CUTE.get('finish', o.finish);
  const B = { path, pts, color: o.color, ink: CUTE.R.inkOf(o), t, cc: CUTE.complement(o.color), dark: CUTE.darken(o.color, .22), light: CUTE.lighten(o.color, .55), lum: CUTE.lum(o.color),
    top: [0, -.37], rim: (deg, off = 0) => { const an = deg * PI / 180; return [Math.sin(an) * .05, .62 - Math.cos(an) * (.3 + off * .3)]; } };
  c.save(); c.translate(pos[0], pos[1]); c.rotate(rot); c.scale(U, U); c.lineJoin = 'round';
  if (fin && fin.under) { c.save(); fin.under(c, B); c.restore(); }
  if (fin && fin.body) { c.save(); fin.body(c, B); c.restore(); } else { c.fillStyle = o.color; c.fill(path); }
  /* the blade's own shine + rim, so it reads as a sword while staying "made of body" */
  if (k > .6) { c.save(); c.globalAlpha = (k - .6) / .4 * .55; c.strokeStyle = B.light; c.lineWidth = .035; c.lineCap = 'round'; c.beginPath(); c.moveTo(-.025, .15); c.lineTo(-.025, .95); c.stroke(); c.restore(); }
  if (fin && fin.over && fin.id !== 'glossy') { c.save(); fin.over(c, B); c.restore(); }
  c.strokeStyle = B.dark; c.lineWidth = .05; c.stroke(path);
  c.restore();
}
/* ---- the swing rig: a real arm growing from a shoulder on the upper right of the body ----
   hand = shoulder + L·(cos θ, sin θ); the blade continues the arm (rot = θ − π/2), so the whole arm
   sweeps around the shoulder. Chop: from upper right, back, over the head, down to the left;
   backhand: from lower left back up to the right. Angles chosen so the tip never leaves the stage. */
const DEG = PI / 180, TH_HOLD = -55 * DEG;
const rig = X => ({ S: X.Q(42, -.2), L: .5 * X.u });
const handAt = (S, L, th) => [S[0] + Math.cos(th) * L, S[1] + Math.sin(th) * L];
const softBack = x => { const k = 1.15; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
function swings(p, a, b) {
  /* both swings stay on the OUTSIDE (right) of the body: overhead chop outward, then a rising backhand */
  const q = span(p, a, b), W1 = -118 * DEG, C1 = 38 * DEG, W2 = 50 * DEG, C2 = TH_HOLD;
  if (q < .12) return { th: TH_HOLD + (W1 - TH_HOLD) * easeIO(q / .12), trail: null, hit: 0 };
  if (q < .45) { const s = softBack(clamp((q - .12) / .18, 0, 1)), f = 1 - clamp((q - .27) / .16, 0, 1); return { th: W1 + (C1 - W1) * s, trail: f > 0 ? { a0: W1, alpha: f } : null, hit: bump(q, .12, .32) }; }
  if (q < .55) return { th: C1 + (W2 - C1) * easeIO((q - .45) / .1), trail: null, hit: 0 };
  { const s = softBack(clamp((q - .55) / .17, 0, 1)), f = 1 - clamp((q - .7) / .16, 0, 1); return { th: W2 + (C2 - W2) * s, trail: f > 0 ? { a0: W2, alpha: f } : null, hit: bump(q, .55, .75) }; }
}
/* body reaction to the arm: lean with the sword, squash on each hit */
function swingBody(C, p, a, b) {
  if (p < a || p > b) return; const { th, hit } = swings(p, a, b), w = bump(p, a, a + .03) * 0 + 1;
  C.sway += 7 * Math.cos(th) * w; C.squash += .07 * hit; C.hop += .05 * hit; C.look = [Math.cos(th) * .85, Math.sin(th) * .7];
  if (hit > .3) C.mouthOverride = 'open';
}
/* trail: two arcs around the shoulder, only the last ~90° behind the blade */
function drawTrail(c, X, S, L, th, tr, U) {
  if (!tr) return; const ccw = th < tr.a0, a0 = ccw ? Math.min(tr.a0, th + 1.6) : Math.max(tr.a0, th - 1.6);
  c.strokeStyle = X.tint; c.globalAlpha = .4 * tr.alpha; c.lineWidth = .4 * U; c.beginPath(); c.arc(S[0], S[1], L + .7 * U, a0, th, ccw); c.stroke();
  c.globalAlpha = .9 * tr.alpha; c.lineWidth = .07 * U; c.beginPath(); c.arc(S[0], S[1], L + 1.12 * U, a0, th, ccw); c.stroke(); c.globalAlpha = 1;
}
/* shared drawing for both goo states */
function gooBack(c, X, P, armK) { if (P.layer === 'back') drawGooBlade(c, X, P.pos, P.rot, P.k, P.scale); const { S } = rig(X); gooArm(c, X, P.reach, armK, 'outline', S, .3); }
function gooFront(c, X, P, armK, holding) {
  const { u } = X, { S, L } = rig(X), U = u * GOO_K;
  gooArm(c, X, P.reach, armK, 'fill', S, .3);
  if (P.layer !== 'front') return;
  if (P.th != null) drawTrail(c, X, S, L, P.th, P.trail, U);
  drawGooBlade(c, X, P.pos, P.rot, P.k, P.scale);
  if (holding) gooHand(c, X, P.pos);
}
const ROT_HOLD = TH_HOLD - PI / 2 + TAU;

/* ======== Goo Blade: squeezed out of the head, wobbles into a sword, snaps off, swung with a real arm ======== */
function gooPose(p, X) {
  const { u, bx } = X, U = u * GOO_K, E = X.Q(-32, 0), topY = E[1], G = h => [E[0], topY + h * U], { S, L } = rig(X), H = handAt(S, L, TH_HOLD);
  const R = { layer: 'back', pos: G(1.4), rot: PI, k: 0, scale: .55, trail: null, th: null, reach: H };
  if (p < .1) return R;
  if (p < .3) { const g = easeBack(span(p, .1, .3)); R.pos = G(1.4 + (-.02 - 1.4) * g); R.scale = .55 + .45 * g; return R; }
  if (p < .45) { R.pos = G(-.02); R.scale = 1; R.k = span(p, .3, .45); return R; }
  R.k = 1; R.scale = 1;
  if (p < .52) { const e = 1 - Math.pow(1 - span(p, .45, .52), 3); R.pos = G(-.02 - .45 * e); R.layer = e > .8 ? 'front' : 'back'; return R; }
  R.layer = 'front';
  if (p < .6) { const e = easeIO(span(p, .52, .6)); R.pos = quad2(G(-.47), [bx + .5 * u, topY - .55 * u], H, e); R.rot = PI + (ROT_HOLD - PI) * e; return R; }
  if (p < .84) { const sw = swings(p, .6, .84); R.th = sw.th; R.trail = sw.trail; R.pos = handAt(S, L, sw.th); R.rot = sw.th - PI / 2; R.reach = R.pos; return R; }
  if (p < .9) { const e = easeIO(span(p, .84, .9)); R.pos = quad2(H, [bx + .5 * u, topY - .55 * u], G(-.45), e); R.rot = ROT_HOLD + (PI + TAU - ROT_HOLD) * e; return R; }
  { const m = span(p, .9, .97); R.layer = m > .15 ? 'back' : 'front'; R.k = 1 - easeIO(span(p, .9, .94)); R.scale = 1 - .65 * span(p, .91, .97); R.pos = G(-.45 + 1.2 * easeIO(m)); R.rot = PI; return R; }
}
const gooArmA = p => span(p, .5, .6) * (1 - span(p, .84, .89));
define('state', { id: 'gooblade', label: 'Goo Blade', cycle: 5.6, pose: .6,
  move(C, p, T, cyc) {
    const grow = span(p, .1, .3) * (1 - span(p, .45, .5)), push = bump(p, .1, .2) + bump(p, .2, .3);
    C.squash = .07 * grow + .05 * push + .03 * Math.sin(TAU * p * 8) * bump(p, .02, .1); C.shake = .008 * Math.sin(T * 50) * grow;
    if (p > .1 && p < .3) C.eyeOverride = 'squint';
    if (p >= .3 && p < .45) { C.eyePop = 1 + .15 * Math.sin((p - .3) / .15 * PI); C.mouthOverride = 'o'; }
    const v = span(p, .45, .6); if (v > 0 && v < 1) C.squash += -.16 * Math.exp(-v * 5) * Math.cos(v * 20);
    C.hop = .1 * bump(p, .56, .62); C.sway = Math.sin(TAU * p * 2);
    C.look = p < .1 ? [0, -.5 * span(p, .02, .08)] : p < .52 ? [0, -.9] : p < .6 ? [.6, -.7] : p < .84 ? [.6, -.4] : p < .9 ? [.2, -.9] : [0, 0];
    swingBody(C, p, .6, .84);
    C.squash += .15 * bump(p, .9, .95) - .06 * bump(p, .94, 1); if (p > .93 && p < .99) C.eyeOverride = 'happy';
    C.blink = blinkAmt(p, [{ c: .05 }, { c: .57, q: 1 }], cyc); },
  back(c, X) { gooBack(c, X, gooPose(X.p, X), gooArmA(X.p)); },
  extras(c, X) {
    const { p, u, o } = X, P = gooPose(p, X), U = u * GOO_K, [bx, topY] = X.Q(-32, 0);
    const sv = span(p, .45, .53);
    if (sv > 0 && sv < 1) { const pom = [P.pos[0] + .37 * U * Math.sin(P.rot), P.pos[1] - .37 * U * Math.cos(P.rot)], w = .2 * u * (1 - sv);
      c.strokeStyle = o.color; c.lineWidth = Math.max(w, .01 * u); c.beginPath(); c.moveTo(bx, topY + .05 * u); c.quadraticCurveTo(bx + .06 * u * Math.sin(sv * 9), (topY + pom[1]) / 2, pom[0], pom[1]); c.stroke(); }
    const dv = span(p, .52, .62); if (dv > 0 && dv < 1) { c.fillStyle = o.color; [[-.18, 0], [.14, .3]].forEach(([dx, del]) => { const q = clamp((dv - del) / (1 - del), 0, 1); if (q <= 0 || q >= 1) return;
      const y = topY - .5 * U + (q * q) * (.55 * U), r = .07 * u * (1 - q * .5); ell(c, bx + dx * u, y, r, r * 1.25); c.fill(); }); }
    gooFront(c, X, P, gooArmA(p), p > .595 && p < .84); } });

/* ======== Goo Throw: a ball is flung out to the upper right, turns into a sword mid-air, drops into the hand ======== */
const GOO_T = { emerge: [.1, .16], fly: [.16, .3], form: [.3, .46], fall: [.46, .53], swing: [.58, .8], home: [.8, .88], sink: [.88, .95] };
function throwPose(p, X) {
  const { u, bx, topY } = X, U = u * GOO_K, T = GOO_T, { S, L } = rig(X), H = handAt(S, L, TH_HOLD);
  const APEX = [bx + 1.45 * u, topY - .3 * u];
  const at = (c, sc) => [c[0], c[1] + .45 * U * sc];
  const R = { layer: 'back', pos: at(X.Q(62, -.4), .5), rot: PI, k: 0, scale: .5, trail: null, ball: null, th: null, reach: H };
  if (p < T.emerge[0]) { R.scale = 0; return R; }
  if (p < T.emerge[1]) { const e = easeBack(span(p, ...T.emerge)); R.scale = .5 + .3 * e; R.pos = at(lerp2(X.Q(62, -.45), X.Q(62, .05), e), R.scale); return R; }
  if (p < T.fly[1]) { const e = easeIO(span(p, ...T.fly)), c0 = X.Q(62, .05), c = quad2(c0, [APEX[0] - .1 * u, APEX[1] - .55 * u], APEX, e);
    R.layer = 'front'; R.scale = .8 + .2 * e; R.pos = at(c, R.scale); R.ball = c; return R; }
  R.layer = 'front';
  if (p < T.form[1]) { const f = span(p, ...T.form), bob = Math.sin(f * PI * 2) * .04 * u; R.scale = 1; R.k = easeIO(f); R.pos = at([APEX[0], APEX[1] + bob], 1); R.pos[1] -= .45 * U * R.k; return R; }
  R.k = 1; R.scale = 1;
  if (p < T.fall[1]) { const f = span(p, ...T.fall); R.pos = lerp2(APEX, H, f * f); R.rot = PI + (ROT_HOLD - PI) * f; return R; }
  if (p < T.swing[0]) { R.pos = [H[0], H[1] + .03 * u * bump(p, T.fall[1], T.swing[0])]; R.rot = ROT_HOLD; return R; }
  if (p < T.swing[1]) { const sw = swings(p, ...T.swing); R.th = sw.th; R.trail = sw.trail; R.pos = handAt(S, L, sw.th); R.rot = sw.th - PI / 2; R.reach = R.pos; return R; }
  if (p < T.home[1]) { const e = easeIO(span(p, ...T.home)), home = X.Q(62, .05), c = quad2(H, [APEX[0] - .2 * u, APEX[1] - .3 * u], home, e);
    R.k = 1 - easeIO(span(p, T.home[0], T.home[0] + .05)); R.scale = 1 - .2 * e; R.rot = ROT_HOLD + (PI + TAU - ROT_HOLD) * Math.min(1, e * 3); R.pos = at(c, R.scale); R.pos[1] -= .45 * U * R.k; R.ball = c; return R; }
  { const e = easeIO(span(p, ...T.sink)); R.layer = e > .1 ? 'back' : 'front'; R.k = 0; R.scale = .8 - .3 * e; R.pos = at(lerp2(X.Q(62, .05), X.Q(62, -.45), e), R.scale); if (p >= T.sink[1]) R.scale = 0; return R; }
}
const throwArm = p => span(p, .44, .52) * (1 - span(p, .8, .85));
define('state', { id: 'goothrow', label: 'Goo Throw', cycle: 5.6, pose: .56,
  move(C, p, T, cyc) {
    const crouch = bump(p, .02, .14);
    C.squash = .1 * crouch + .03 * Math.sin(TAU * p * 8) * bump(p, .0, .08);
    const fling = span(p, .12, .3); if (fling > 0 && fling < 1) C.squash += -.16 * Math.exp(-fling * 5) * Math.cos(fling * 20);
    C.hop = .1 * bump(p, .12, .2) + .1 * bump(p, .52, .58); C.sway = -4 * crouch + 6 * bump(p, .12, .22);
    if (p > .04 && p < .13) C.eyeOverride = 'squint';
    if (p >= .3 && p < .46) { C.eyePop = 1 + .18 * Math.sin((p - .3) / .16 * PI); C.mouthOverride = 'o'; }
    C.look = p < .12 ? [.4 * span(p, .02, .1), -.4 * span(p, .02, .1)] : p < .46 ? [.95, -.85] : p < .53 ? [.7, -.2] : p < .58 ? [.6, -.5] : p < .9 ? [.5, -.6] : [0, 0];
    swingBody(C, p, ...GOO_T.swing);
    C.squash += .14 * bump(p, .88, .94) - .06 * bump(p, .93, .99); if (p > .93 && p < .99) C.eyeOverride = 'happy';
    C.blink = blinkAmt(p, [{ c: .4, q: 1 }, { c: .96, q: 1 }], cyc); },
  back(c, X) { gooBack(c, X, throwPose(X.p, X), throwArm(X.p)); },
  extras(c, X) {
    const { p, u, o } = X, P = throwPose(p, X), U = u * GOO_K;
    const sv = span(p, .16, .23);
    if (sv > 0 && sv < 1 && P.ball) { const h = X.Q(62, -.1), w = .18 * u * (1 - sv);
      c.strokeStyle = o.color; c.lineWidth = Math.max(w, .01 * u); c.beginPath(); c.moveTo(h[0], h[1]); c.quadraticCurveTo((h[0] + P.ball[0]) / 2, (h[1] + P.ball[1]) / 2 + .1 * u, P.ball[0], P.ball[1]); c.stroke(); }
    const dv = span(p, .22, .32); if (dv > 0 && dv < 1) { c.fillStyle = o.color; const h = X.Q(62, .2);
      [[-.1, 0], [.12, .35]].forEach(([dx, del]) => { const q = clamp((dv - del) / (1 - del), 0, 1); if (q <= 0 || q >= 1) return;
        const r = .06 * u * (1 - q * .5); ell(c, h[0] + dx * u, h[1] - .3 * u + q * q * .4 * u, r, r * 1.25); c.fill(); }); }
    const fv = bump(p, .3, .48); if (fv > 0) { c.fillStyle = X.tint; const ctr = [P.pos[0], P.pos[1] - .6 * U]; [0, 1, 2, 3].forEach(i => { const a = i * PI / 2 + p * 20, r = .7 * U; sparkle(c, ctr[0] + Math.cos(a) * r, ctr[1] + Math.sin(a) * r * .8, .07 * u * fv); c.fill(); }); }
    gooFront(c, X, P, throwArm(p), p > .525 && p < .8); } });
/* helpers shared with styles/actions.js */
CUTE.act = { rig, handAt, gooArm, gooHand, lerp2, quad2, swings, swingBody, drawTrail, DEG, TH_HOLD };
})();
