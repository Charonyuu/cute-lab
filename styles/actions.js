/* =====================================================================
   ACTIONS · more agent states (same interface as styles/states.js)
   Extra motion channels available here:  dx (move sideways, body radii) · flip (−1…1 horizontal turn)
   · faceAlpha (hide the face when turned away).  Props are held with the shoulder rig from
   states.js (CUTE.act): hand = S + L·(cos θ, sin θ), arm outline in back(), arm fill in extras().
   APPEND ONLY (share links store the index).
   ===================================================================== */
(function () {
const { define, TAU, PI, clamp, ell, rrect, sparkle, star, heart, poly, easeIO, easeBack, span, bump, blinkAmt, darken, lighten, mixHex } = CUTE;
const A = CUTE.act, D = A.DEG;
const lerp = (a, b, k) => a + (b - a) * k;
/* side rig: the shoulder sits on the right flank (just below the middle), so arms grow out of the
   body's side, never out of the top of the head. arm helpers: outline behind the body, fill in front; k = how far the arm is out */
const rig = X => ({ S: X.Q(100, -.12), L: .55 * X.u });
const armBack = (c, X, hand, k) => { const { S } = rig(X); A.gooArm(c, X, hand, k, 'outline', S, .3); };
const armFront = (c, X, hand, k, withHand = true) => { const { S } = rig(X); A.gooArm(c, X, hand, k, 'fill', S, .3); if (withHand && k > .95) A.gooHand(c, X, hand); };
const handTh = (X, th) => { const { S, L } = rig(X); return A.handAt(S, L, th); };
const twinkles = (c, x, y, r, n, t, col, size) => { c.fillStyle = col; for (let i = 0; i < n; i++) { const a = i * TAU / n + t; sparkle(c, x + Math.cos(a) * r, y + Math.sin(a) * r, size); c.fill(); } };

/* ---------------- 法杖 Magic Staff: poof → twirl → raise → cast a star ---------------- */
function drawStaff(c, X, hand, rot, s, glow) {
  if (s <= 0) return; const { u, o } = X, cc = CUTE.complement(o.color);
  c.save(); c.translate(hand[0], hand[1]); c.rotate(rot); c.scale(s, s);
  c.strokeStyle = '#6B4424'; c.lineWidth = .16 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, .5 * u); c.lineTo(0, -.68 * u); c.stroke();
  c.strokeStyle = '#A0703C'; c.lineWidth = .1 * u; c.beginPath(); c.moveTo(0, .5 * u); c.lineTo(0, -.68 * u); c.stroke();
  /* curled head holding the orb */
  c.strokeStyle = '#6B4424'; c.lineWidth = .1 * u; c.beginPath(); c.arc(-.02 * u, -.83 * u, .2 * u, PI * .5, PI * 2.1); c.stroke();
  if (glow > 0) { c.globalAlpha = .25 * glow; c.fillStyle = cc; ell(c, 0, -.86 * u, .36 * u * (1 + .1 * glow), .36 * u * (1 + .1 * glow)); c.fill(); c.globalAlpha = 1; }
  c.fillStyle = cc; ell(c, 0, -.86 * u, .16 * u, .16 * u); c.fill(); c.strokeStyle = darken(cc, .3); c.lineWidth = .03 * u; c.stroke();
  c.fillStyle = '#FFFFFF'; c.globalAlpha = .8; ell(c, -.05 * u, -.91 * u, .05 * u, .05 * u); c.fill();
  c.restore();
}
function staffPose(p, X) {
  const arm = span(p, 0, .1) * (1 - span(p, .86, .95)), s = easeBack(span(p, .12, .22)) * (1 - easeIO(span(p, .78, .88)));
  let th = lerp(-20, -62, easeIO(span(p, 0, .12))) * D, rot = 0;
  rot = TAU * easeIO(span(p, .26, .46)) + .15 * Math.sin(p * 30) * bump(p, .2, .26);
  th += -22 * D * easeIO(span(p, .48, .58)) * (1 - span(p, .6, .64)) + 14 * D * easeBack(span(p, .6, .66)) * (1 - easeIO(span(p, .72, .82)));
  rot += -.3 * easeIO(span(p, .48, .58)) * (1 - span(p, .6, .64)) + .3 * easeBack(span(p, .6, .66)) * (1 - easeIO(span(p, .72, .82)));
  return { arm, s, th, rot, glow: bump(p, .5, .72) };
}
define('state', { id: 'staff', label: 'Magic Staff', zh: '法杖', cycle: 4.8, pose: .55,
  move(C, p, T, cyc) { const P = staffPose(p);
    C.look = p < .2 ? [.8, -.2] : p < .48 ? [.6, -.8] : p < .74 ? [.9, -.6] : [0, 0];
    if (p > .12 && p < .22) C.eyeOverride = 'happy';
    if (p > .6 && p < .7) { C.mouthOverride = 'open'; C.eyePop = 1.15; }
    C.squash = .05 * bump(p, .12, .2) - .08 * bump(p, .48, .58) + .1 * bump(p, .6, .66); C.hop = .1 * bump(p, .6, .68);
    C.sway = 6 * P.arm + Math.sin(TAU * p * 2); C.blink = blinkAmt(p, [{ c: .9 }], cyc); },
  back(c, X) { const P = staffPose(X.p); armBack(c, X, handTh(X, P.th), P.arm); },
  extras(c, X) {
    const { p, u, t, tint, o } = X, P = staffPose(p), h = handTh(X, P.th), cc = CUTE.complement(o.color);
    const poof = bump(p, .1, .24); if (poof > 0) { c.globalAlpha = poof * .7; c.fillStyle = tint; [0, 1, 2, 3, 4].forEach(i => { const a = i * TAU / 5 + p * 8; ell(c, h[0] + Math.cos(a) * .35 * u * poof, h[1] - .5 * u + Math.sin(a) * .35 * u * poof, .14 * u, .14 * u); c.fill(); }); c.globalAlpha = 1; }
    armFront(c, X, h, P.arm, false);
    drawStaff(c, X, h, P.rot, P.s, P.glow);
    if (P.arm > .95) A.gooHand(c, X, h);
    const orb = [h[0] + Math.sin(P.rot) * .86 * u * P.s, h[1] - Math.cos(P.rot) * .86 * u * P.s];
    if (P.glow > .2) twinkles(c, orb[0], orb[1], .34 * u, 4, t * 3, cc, .07 * u * P.glow);
    /* the cast: a star flies off, a ring bursts at the orb */
    const sv = span(p, .63, .82); if (sv > 0 && sv < 1) { const sx = orb[0] - sv * .5 * u, sy = orb[1] - sv * .6 * u;
      c.globalAlpha = 1 - sv * .6; c.fillStyle = '#FFC20E'; c.save(); c.translate(sx, sy); c.rotate(sv * 6); star(c, 0, 0, .16 * u, .45); c.fill(); c.restore();
      c.strokeStyle = '#FFC20E'; c.lineWidth = .04 * u; c.globalAlpha = (1 - sv) * .8; ell(c, orb[0], orb[1], .25 * u + sv * .45 * u, .25 * u + sv * .45 * u); c.stroke(); c.globalAlpha = 1; }
    const fade = bump(p, .78, .92); if (fade > 0) twinkles(c, h[0], h[1] - .5 * u, .5 * u * (1 + fade), 6, p * 10, tint, .08 * u * fade); } });

/* ---------------- 跳跳走路 Hop Walk: hops left and right across the stage ---------------- */
define('state', { id: 'hopwalk', label: 'Hop Walk', zh: '跳跳走路', cycle: 3.2, pose: .08,
  move(C, p) { const hops = Math.abs(Math.sin(PI * p * 6)), dir = Math.cos(TAU * p);
    C.dx = .55 * Math.sin(TAU * p); C.hop = .32 * hops; C.squash = hops < .25 ? .12 * (1 - hops / .25) : -.06 * hops;
    C.look = [Math.sign(dir) * .8, -.1]; C.sway = 8 * dir * hops; } });

/* ---------------- 搖擺走路 Waddle: little feet, side to side ---------------- */
const feet = (p, X, c, mode) => {
  const { u, cx, floorY, o } = X; [-1, 1].forEach((s, i) => { const lift = Math.max(0, Math.sin(TAU * p * 4 + i * PI)) * .12 * u, x = cx + s * .36 * u, y = floorY + .02 * u - lift;
    if (mode === 'back') { c.fillStyle = darken(o.color, .32); ell(c, x, y, .21 * u, .13 * u); c.fill(); } else { c.fillStyle = darken(o.color, .12); ell(c, x, y, .17 * u, .09 * u); c.fill(); } }); };
define('state', { id: 'waddle', label: 'Waddle', zh: '搖擺走路', cycle: 2.6, pose: .1,
  move(C, p) { const step = Math.sin(TAU * p * 4); C.dx = .45 * Math.sin(TAU * p); C.hop = .1 + .04 * Math.abs(step); C.sway = 6 * step; C.squash = .02 * Math.abs(step);
    C.look = [Math.sign(Math.cos(TAU * p)) * .7, 0]; },
  back(c, X) { feet(X.p, X, c, 'back'); feet(X.p, X, c, 'fill'); } });

/* ---------------- 揮手 Wave hello ---------------- */
const waveTh = p => (-70 + 30 * Math.sin(TAU * 3 * span(p, .12, .82))) * D;
const waveArm = p => span(p, 0, .12) * (1 - span(p, .84, .96));
define('state', { id: 'wave', label: 'Wave', zh: '揮手', cycle: 2.6, pose: .25,
  face(f) { if (f.mouth === 'none') f.mouth = 'smile'; },
  move(C, p, T, cyc) { C.sway = 5 * waveArm(p) + 3 * Math.sin(TAU * 3 * p); C.squash = .03 * Math.sin(TAU * 6 * p) * waveArm(p); C.look = [.3, -.1];
    if (p > .1 && p < .85) C.eyeOverride = 'happy'; },
  back(c, X) { armBack(c, X, handTh(X, waveTh(X.p)), waveArm(X.p)); },
  extras(c, X) { const h = handTh(X, waveTh(X.p)), k = waveArm(X.p); armFront(c, X, h, k, false);
    if (k > .9) { const { u, o } = X; c.fillStyle = o.color; c.strokeStyle = darken(o.color, .3); c.lineWidth = .04 * u; ell(c, h[0], h[1], .19 * u, .2 * u); c.fill(); c.stroke();
      c.strokeStyle = darken(o.color, .3); c.lineWidth = .025 * u; for (const a of [-.5, 0, .5]) { c.beginPath(); c.moveTo(h[0] + Math.sin(a) * .1 * u, h[1] - Math.cos(a) * .1 * u); c.lineTo(h[0] + Math.sin(a) * .18 * u, h[1] - Math.cos(a) * .18 * u); c.stroke(); }
      c.strokeStyle = X.fg; c.globalAlpha = .4; c.lineWidth = .03 * u; for (const s of [-1, 1]) { c.beginPath(); c.arc(h[0], h[1], .32 * u, -PI / 2 + s * .5 - .25, -PI / 2 + s * .5 + .25); c.stroke(); } c.globalAlpha = 1; } } });

/* ---------------- 開心跳 Jump for joy ---------------- */
define('state', { id: 'jump', label: 'Jump', zh: '開心跳', cycle: 1.9, pose: .3,
  move(C, p) { const q = (p * 2) % 1, air = span(q, .15, .75), up = air > 0 && air < 1 ? Math.sin(air * PI) : 0;
    C.hop = .95 * up; C.squash = q < .15 ? .16 * Math.sin(q / .15 * PI) : q < .75 ? -.05 * Math.sin(air * PI * 2) - .05 * up : .14 * Math.exp(-(q - .75) * 12) * Math.cos((q - .75) * 30);
    if (up > .3) { C.eyeOverride = 'happy'; C.mouthOverride = 'open'; } C.sway = 6 * Math.sin(TAU * p); C.look = [0, -.3 * up]; },
  extras(c, X) { const q = (X.p * 2) % 1, up = bump(q, .3, .6); if (up > 0) { c.fillStyle = '#FFC20E'; [-50, 50].forEach(d => { const [x, y] = X.Q(d, .2 + .2 * up); sparkle(c, x, y, .1 * X.u * up); c.fill(); }); } } });

/* ---------------- 轉圈 Spin: turns all the way around twice, then a dizzy wobble ---------------- */
define('state', { id: 'spin', label: 'Spin', zh: '轉圈', cycle: 2.8, pose: .05,
  move(C, p) { const a = TAU * 2 * easeIO(span(p, .08, .6)), f = Math.cos(a);
    C.flip = Math.abs(f) < .06 ? .06 * Math.sign(f || 1) : f; C.faceAlpha = clamp(f * 3, 0, 1); C.hop = .15 * bump(p, .08, .6);
    C.swirl = easeIO(span(p, .6, .66)) * (1 - easeIO(span(p, .8, .9))); C.sway = 8 * Math.sin(p * 40) * bump(p, .6, .9); C.look = [Math.sin(a) * .8, 0]; },
  extras(c, X) { const v = bump(X.p, .1, .58); if (v <= 0) return; const { u, cx, cy, fg } = X; c.strokeStyle = fg; c.lineWidth = .035 * u; c.globalAlpha = .35 * v;
    for (const s of [-1, 1]) { c.beginPath(); c.arc(cx, cy, 1.25 * u, s > 0 ? -.5 : PI - .5, s > 0 ? .5 : PI + .5); c.stroke(); } c.globalAlpha = 1; } });

/* ---------------- 點頭 Nod yes / 搖頭 Shake no ---------------- */
define('state', { id: 'nod', label: 'Nod', zh: '點頭', cycle: 1.8, pose: .25,
  face(f) { if (f.mouth === 'none') f.mouth = 'smile'; },
  move(C, p, T, cyc) { const n = bump(p, .1, .35) + bump(p, .4, .65); C.look = [0, .9 * n - .1]; C.hop = -.08 * n; C.squash = .06 * n; C.eyeSY = 1 - .2 * n; C.blink = blinkAmt(p, [{ c: .85 }], cyc); } });
define('state', { id: 'nope', label: 'Shake No', zh: '搖頭', cycle: 1.8, pose: .2,
  move(C, p, T, cyc) { const k = bump(p, .05, .75), s = Math.sin(TAU * 3 * span(p, .05, .75)); C.look = [s * .95 * k, 0]; C.sway = 7 * s * k; C.mouthOverride = 'flat'; if (k > .3) C.eyeOverride = 'squint'; C.blink = blinkAmt(p, [{ c: .88 }], cyc); } });

/* ---------------- 大笑 Laugh (tears of joy) ---------------- */
const tears = (c, X, p, rate, big) => { const { u, bx, cy } = X; c.fillStyle = '#7CC8FF';
  [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) { const q = (p * rate + k / 3 + (s > 0 ? .5 : 0)) % 1, x = bx + s * (.42 + q * (big ? .1 : .35)) * u, y = cy - .05 * u + q * q * (big ? .9 : .35) * u;
    c.globalAlpha = 1 - q; ell(c, x, y, .05 * u, .07 * u); c.fill(); } }); c.globalAlpha = 1; };
define('state', { id: 'laugh', label: 'Laugh', zh: '大笑', cycle: 1.6, pose: .3,
  move(C, p) { const b = Math.abs(Math.sin(TAU * 4 * p)); C.eyeOverride = 'happy'; C.mouthOverride = 'grin'; C.hop = .08 * b; C.squash = .06 * b - .03; C.sway = 5 * Math.sin(TAU * 2 * p); C.look = [0, -.3]; },
  extras(c, X) { tears(c, X, X.p, 2, false); } });

/* ---------------- 哭哭 Cry ---------------- */
define('state', { id: 'cry', label: 'Cry', zh: '哭哭', cycle: 2.4, pose: .3,
  move(C, p) { const sob = Math.abs(Math.sin(TAU * 3 * p)); C.eyeOverride = 'closed'; C.mouthOverride = 'frown'; C.squash = .05 * sob; C.hop = -.03 * sob; C.shake = .006 * Math.sin(p * 120); C.look = [0, .4]; },
  extras(c, X) { tears(c, X, X.p, 3, true); } });

/* ---------------- 生氣 Angry: steam puffs + anger mark ---------------- */
define('state', { id: 'angry', label: 'Angry', zh: '生氣', cycle: 2, pose: .3,
  face(f) { f.brows = 'angry'; f.mouth = 'frown'; },
  move(C, p) { C.shake = .012 * Math.sin(p * 160) * bump(p, .1, .9); C.squash = .05 * bump(p, .1, .3) + .03 * Math.sin(TAU * 4 * p); C.look = [0, .1]; },
  extras(c, X) { const { u, p } = X;
    [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) { const q = (p * 2 + k / 3) % 1, [x, y] = X.Q(s * 50, .05 + q * .45); c.globalAlpha = .55 * (1 - q); c.fillStyle = '#BDB5AE'; ell(c, x + s * q * .2 * u, y, (.08 + q * .1) * u, (.07 + q * .08) * u); c.fill(); } });
    c.globalAlpha = 1; const [mx, my] = X.Q(38, -.08), k = .9 + .15 * Math.sin(p * 30); c.strokeStyle = '#E8384F'; c.lineWidth = .045 * u * k;
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; c.beginPath(); c.arc(mx + Math.cos(a) * .12 * u * k, my + Math.sin(a) * .12 * u * k, .07 * u * k, a + PI * .6, a + PI * 1.4); c.stroke(); } } });

/* ---------------- 戀愛 In love: heart eyes, hearts float up ---------------- */
define('state', { id: 'love', label: 'In Love', zh: '戀愛', cycle: 3, pose: .3,
  face(f) { f.eye = 'heart'; if (f.mouth === 'none') f.mouth = 'smile'; },
  move(C, p) { C.sway = 6 * Math.sin(TAU * p); C.squash = .03 * Math.sin(TAU * 2 * p); C.hop = .05 * Math.abs(Math.sin(TAU * p)); C.look = [Math.sin(TAU * p) * .3, -.2]; },
  extras(c, X) { const { u, p, bx, cy } = X;
    c.fillStyle = '#FF6F9C'; c.globalAlpha = .45; [-1, 1].forEach(s => { ell(c, bx + s * .45 * u, cy + .15 * u, .14 * u, .08 * u); c.fill(); });
    c.fillStyle = '#FF5AA5'; for (let k = 0; k < 4; k++) { const q = (p + k / 4) % 1, [x, y] = X.Q(-60 + k * 40, .1 + q * .7); c.globalAlpha = Math.sin(q * PI); heart(c, x + Math.sin(q * 9 + k) * .08 * u, y, .1 * u * (.6 + q * .5)); c.fill(); }
    c.globalAlpha = 1; } });

/* ---------------- 吃餅乾 Eat a cookie ---------------- */
function drawCookie(c, x, y, r, bites, u) {
  if (r <= 0) return; c.fillStyle = '#D9A066'; ell(c, x, y, r, r); c.fill(); c.strokeStyle = '#A8703A'; c.lineWidth = .03 * u; c.stroke();
  c.fillStyle = '#5E3B24'; [[-.35, -.3], [.3, -.1], [-.1, .35], [.4, .4], [-.45, .15]].slice(0, Math.max(1, 5 - bites)).forEach(([a, b]) => { ell(c, x + a * r, y + b * r, r * .13, r * .11); c.fill(); });
}
const eatPose = (p, X) => { const { u, bx, cy } = X, rest = handTh(X, 20 * D), mouth = [bx + .66 * u, cy + .32 * u];
  const near = easeIO(span(p, .1, .2)) * (1 - easeIO(span(p, .82, .9))) - .25 * (bump(p, .3, .4) + bump(p, .48, .58) + bump(p, .66, .76));
  return { hand: A.lerp2(rest, mouth, clamp(near, 0, 1)), arm: span(p, 0, .1) * (1 - span(p, .9, .98)), bites: (p > .35) + (p > .53) + (p > .71) }; };
define('state', { id: 'eat', label: 'Eat', zh: '吃餅乾', cycle: 3.4, pose: .45,
  move(C, p, T, cyc) { const munch = bump(p, .3, .4) + bump(p, .48, .58) + bump(p, .66, .76);
    C.mouthOverride = p > .18 && p < .8 ? (Math.sin(p * 90) > 0 ? 'open' : 'cat') : null; C.squash = .04 * Math.abs(Math.sin(p * 45)) * (p > .2 && p < .8);
    if (p > .8) C.eyeOverride = 'happy'; C.look = [.4, .3]; C.hop = .05 * munch; C.blink = blinkAmt(p, [{ c: .25 }], cyc); },
  back(c, X) { const P = eatPose(X.p, X); armBack(c, X, P.hand, P.arm); },
  extras(c, X) { const { u, p } = X, P = eatPose(p, X); armFront(c, X, P.hand, P.arm, false);
    if (P.arm > .5 && p < .86) drawCookie(c, P.hand[0] - .24 * u, P.hand[1] - .06 * u, .28 * u * (1 - P.bites * .2), P.bites, u);
    if (P.arm > .95) A.gooHand(c, X, P.hand);
    c.fillStyle = '#C08A50'; for (let k = 0; k < 4; k++) { const q = ((p - .3) * 3 + k / 4) % 1; if (p < .3 || p > .8) continue; ell(c, X.bx + (.3 + k * .05) * u, X.cy + (.3 + q * .6) * u, .025 * u, .025 * u); c.fill(); } } });

/* ---------------- 打噴嚏 Sneeze: ah… ah… ACHOO ---------------- */
define('state', { id: 'sneeze', label: 'Sneeze', zh: '打噴嚏', cycle: 2.8, pose: .53,
  move(C, p) { const build = easeIO(span(p, .05, .5)), boom = span(p, .5, .7);
    C.squash = -.12 * build * (p < .5) + (boom > 0 && boom < 1 ? .25 * Math.exp(-boom * 5) * Math.cos(boom * 18) : 0); C.look = [0, -.6 * build * (p < .5)];
    C.shake = .01 * Math.sin(p * 140) * build * (p < .5); C.dx = -.12 * bump(p, .5, .75); C.sway = -10 * bump(p, .5, .7);
    if (p > .2 && p < .5) { C.eyeOverride = 'squint'; C.mouthOverride = 'o'; } if (p >= .5 && p < .62) { C.eyeOverride = 'x'; C.mouthOverride = 'open'; } },
  extras(c, X) { const v = span(X.p, .5, .7); if (v <= 0 || v >= 1) return; const { u, bx, cy, tint } = X;
    c.fillStyle = tint; for (let k = 0; k < 7; k++) { const a = (-25 + k * 9) * D, r = (.6 + v * 1.1) * u; c.globalAlpha = 1 - v; ell(c, bx + Math.cos(a) * r, cy + .15 * u + Math.sin(a) * r, .05 * u, .05 * u); c.fill(); }
    c.strokeStyle = tint; c.lineWidth = .04 * u; for (let k = 0; k < 3; k++) { const a = (-15 + k * 15) * D; c.beginPath(); c.moveTo(bx + Math.cos(a) * .9 * u, cy + .1 * u + Math.sin(a) * .9 * u); c.lineTo(bx + Math.cos(a) * (1 + v * .5) * u, cy + .1 * u + Math.sin(a) * (1 + v * .5) * u); c.stroke(); }
    c.globalAlpha = 1; } });

/* ---------------- 打哈欠 Yawn ---------------- */
define('state', { id: 'yawn', label: 'Yawn', zh: '打哈欠', cycle: 3.4, pose: .4,
  move(C, p) { const st = easeIO(span(p, .08, .4)) * (1 - easeIO(span(p, .6, .75)));
    C.squash = -.13 * st; C.look = [0, -.4 * st]; if (st > .2) { C.eyeOverride = 'closed'; C.mouthOverride = st > .6 ? 'open' : 'o'; } else if (p > .7) C.eyeOverride = 'sleepy';
    C.sway = -4 * st + 2 * Math.sin(TAU * p); C.hop = .04 * st; },
  extras(c, X) { const v = bump(X.p, .45, .8); if (v <= 0) return; const { u, bx, cy } = X; c.fillStyle = '#7CC8FF'; c.globalAlpha = v; ell(c, bx + .4 * u, cy + (.0 + .1 * span(X.p, .45, .8)) * u, .045 * u, .065 * u); c.fill(); c.globalAlpha = 1; } });

/* ---------------- 躲貓貓 Peekaboo: scoots off left, peeks back in, re-enters from the right ---------------- */
define('state', { id: 'peek', label: 'Peekaboo', zh: '躲貓貓', cycle: 4.2, pose: .5,
  move(C, p, T, cyc) {
    let dx = 0, tilt = 0;
    if (p < .25) dx = -3.3 * easeIO(span(p, .08, .25));
    else if (p < .42) dx = -3.3;
    else if (p < .62) { const k = easeBack(span(p, .42, .5)) * (1 - easeIO(span(p, .56, .62))); dx = -3.3 + 1.55 * k; tilt = 18 * k; }
    else if (p < .74) dx = 3.3;
    else dx = 3.3 * (1 - easeBack(span(p, .74, .92)));
    C.dx = dx; C.sway = tilt + (p < .25 || p > .74 ? 6 * Math.sin(p * 60) * (Math.abs(dx) > .1) : 0);
    C.hop = (p < .25 || p > .74) && Math.abs(dx) > .1 ? .12 * Math.abs(Math.sin(p * 60)) : 0;
    C.look = p > .42 && p < .62 ? [.9, 0] : [dx < 0 ? -.8 : dx > 0 ? -.8 : 0, 0];
    if (p > .92) C.eyeOverride = 'happy'; C.blink = blinkAmt(p, [{ c: .53 }], cyc); } });

/* ---------------- 撐傘 Umbrella in the rain ---------------- */
function umbPose(p, X) { const arm = span(p, 0, .12) * (1 - span(p, .88, .98)); return { arm, th: (-82 + 4 * Math.sin(TAU * 2 * p)) * D, open: easeBack(span(p, .1, .22)) * (1 - easeIO(span(p, .8, .9))) }; }
define('state', { id: 'umbrella', label: 'Umbrella', zh: '撐傘', cycle: 3.6, pose: .5,
  face(f) { if (f.mouth === 'none') f.mouth = 'smile'; },
  move(C, p, T, cyc) { C.sway = 3 * Math.sin(TAU * 2 * p) + 4; C.look = [-.3, -.6]; C.squash = .02 * Math.sin(TAU * 4 * p); if (p > .3 && p < .7) C.eyeOverride = 'happy'; C.blink = blinkAmt(p, [{ c: .85 }], cyc); },
  back(c, X) { const P = umbPose(X.p, X); armBack(c, X, handTh(X, P.th), P.arm); },
  extras(c, X) {
    const { u, p, bx, topY, fg } = X, P = umbPose(p, X), h = handTh(X, P.th), cov = P.open * 1.12 * u, canopy = [bx + .5 * u, topY - .28 * u];
    /* rain everywhere except under the canopy */
    c.strokeStyle = '#7CC8FF'; c.lineWidth = .025 * u; c.globalAlpha = .7;
    for (let k = 0; k < 18; k++) { const x = bx + (-2.2 + (k * 0.27) % 4.4) * u, q = (p * 3 + (k * .37) % 1) % 1, y = topY - 1.6 * u + q * 3.2 * u;
      if (Math.abs(x - canopy[0]) < cov && y > canopy[1] - .1 * u) continue; c.beginPath(); c.moveTo(x, y); c.lineTo(x - .05 * u, y + .18 * u); c.stroke(); }
    c.globalAlpha = 1;
    A.gooArm(c, X, h, P.arm, 'fill', rig(X).S, .3);
    if (P.open > .02) {
      c.strokeStyle = '#2B2320'; c.lineWidth = .045 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(h[0], h[1] + .12 * u); c.lineTo(canopy[0], canopy[1]); c.stroke();
      c.beginPath(); c.arc(h[0] + .09 * u, h[1] + .12 * u, .09 * u, 0, PI); c.stroke();
      const r = cov, col = CUTE.complement(X.o.color);
      c.fillStyle = col; c.beginPath(); c.moveTo(canopy[0] - r, canopy[1]); c.quadraticCurveTo(canopy[0] - r, canopy[1] - r * .9, canopy[0], canopy[1] - r * .9); c.quadraticCurveTo(canopy[0] + r, canopy[1] - r * .9, canopy[0] + r, canopy[1]);
      for (let i = 4; i > 0; i--) { const x0 = canopy[0] - r + (i / 4) * 2 * r, x1 = canopy[0] - r + ((i - 1) / 4) * 2 * r; c.quadraticCurveTo((x0 + x1) / 2, canopy[1] - r * .18, x1, canopy[1]); }
      c.closePath(); c.fill(); c.strokeStyle = darken(col, .3); c.lineWidth = .035 * u; c.stroke();
      c.fillStyle = darken(col, .3); ell(c, canopy[0], canopy[1] - r * .92, .05 * u, .05 * u); c.fill();
    }
    if (P.arm > .95) A.gooHand(c, X, h);
    /* splashes on the canopy */
    c.strokeStyle = '#7CC8FF'; c.lineWidth = .02 * u; [-.6, .1, .7].forEach((k, i) => { const q = (p * 4 + i * .3) % 1; if (P.open < .9 || q > .4) return; const x = canopy[0] + k * cov, y = canopy[1] - cov * .9 * (1 - k * k) - .05 * u;
      c.globalAlpha = 1 - q / .4; c.beginPath(); c.arc(x, y, .06 * u + q * .2 * u, PI * 1.1, PI * 1.9); c.stroke(); }); c.globalAlpha = 1; } });

/* ---------------- Chinese names for every state (shown in the UI) ---------------- */
Object.entries({ idle: '待機', listen: '聆聽', think: '思考', write: '打字', success: '成功', alert: '注意', error: '出錯', sleep: '睡覺', dance: '跳舞', dead: '融化', sword: '拔劍', gooblade: '黏液劍', goothrow: '甩出黏液劍' })
  .forEach(([id, zh]) => { if (CUTE.get('state', id)) define('state', { id, zh }); });
})();
