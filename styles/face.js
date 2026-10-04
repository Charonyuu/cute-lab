/* =====================================================================
   FACE · eyes, brows, mouths, cheeks
   All drawn in FACE space: one eye is centred at (0,0); k = eye scale
   (size slider × state boost), so multiply every length by k.
   Before draw(): fillStyle = strokeStyle = ink, lineCap/lineJoin = round.

   EYE   { id, label, gap, hw, half?, lightInk?, sides?, hidden?, ring?, draw(c,e) }
     gap   centre-to-centre half distance at 100 %          (0.15–0.32)
     hw    half width, used by "Surprise me" to keep eyes apart and on the face
     half  half height (brows sit above it, mouth below)    default .1
     lightInk  auto ink goes white on mid-tone bodies (pills, dashes)
     sides ['left-id','right-id'] → a combo eye (wink)
     ring  brow ids to show in the expression ring with this eye
     e = { k, s (-1 left / +1 right), blink 0…1, lx, ly (look −1…1), ink, color, t }
   BROW  { id, label, pose(s,k) → { rot, dy, w, h } }
   MOUTH { id, label, draw(c,m) }   m = { ink, color, t }   centred under the eyes
   CHEEK { id, label, draw(c,ch) }  ch = { s, k, ink, color, t }, once per side
   APPEND ONLY — indexes are stored in share links.
   ===================================================================== */
(function () {
const { define, ell, rrect, star, heart, sparkle, PI, DARK, WHITE } = CUTE;
/* blink by squashing whatever the eye draws */
const lid = (c, b, f) => { c.save(); c.scale(1, Math.max(.08, 1 - b * .9)); f(); c.restore(); };

/* ---------------- EYES (original 10) ---------------- */
define('eye', { id: 'toon', label: 'Toon', gap: .2, half: .175, hw: .14, ring: ['none', 'angry', 'sceptic', 'worried', 'flat', 'raised'],
  draw(c, { k, s, blink: b, lx, ly }) { const rx = .14 * k, ry = .175 * k * (1 - b * .92); c.fillStyle = WHITE; ell(c, 0, 0, rx, ry); c.fill();
    if (b < .6) { c.save(); ell(c, 0, 0, rx, ry); c.clip(); c.fillStyle = DARK; ell(c, -s * .012 * k + lx * .045 * k, .025 * k + ly * .05 * k, .085 * k, .092 * k); c.fill(); c.restore(); } } });
define('eye', { id: 'pill', label: 'Pills', gap: .15, half: .11, hw: .04, lightInk: 1, ring: ['none', 'flat'],
  draw(c, { k, blink: b }) { const h = .22 * k * (1 - b * .85); rrect(c, -.04 * k, -h / 2, .08 * k, h, .04 * k); c.fill(); } });
define('eye', { id: 'dot', label: 'Dots', gap: .22, half: .09, hw: .085, ring: ['none', 'angry'],
  draw(c, { k, blink: b }) { ell(c, 0, 0, .085 * k, .09 * k * (1 - b * .9)); c.fill(); } });
define('eye', { id: 'ring', label: 'Rings', gap: .32, half: .11, hw: .115, ring: ['none', 'worried'],
  draw(c, { k, blink: b }) { c.lineWidth = .05 * k; ell(c, 0, 0, .09 * k, .105 * k * (1 - b * .85)); c.stroke(); } });
define('eye', { id: 'happy', label: 'Happy', gap: .3, hw: .11, ring: ['none', 'flat'],
  draw(c, { k }) { c.lineWidth = .05 * k; c.beginPath(); c.moveTo(-.085 * k, .05 * k); c.lineTo(0, -.07 * k); c.lineTo(.085 * k, .05 * k); c.stroke(); } });
define('eye', { id: 'plus', label: 'Plus', gap: .32, hw: .128, ring: ['none'],
  draw(c, { k }) { c.lineWidth = .055 * k; c.beginPath(); c.moveTo(-.1 * k, 0); c.lineTo(.1 * k, 0); c.moveTo(0, -.1 * k); c.lineTo(0, .1 * k); c.stroke(); } });
define('eye', { id: 'dash', label: 'Dashes', gap: .2, hw: .11, lightInk: 1, ring: ['none'],
  draw(c, { k }) { const h = .075 * k; rrect(c, -.11 * k, -h / 2, .22 * k, h, h / 2); c.fill(); } });
define('eye', { id: 'slash', label: 'Slashes', gap: .3, hw: .095, ring: ['none'],
  draw(c, { k }) { c.lineWidth = .05 * k; c.beginPath(); c.moveTo(-.07 * k, .11 * k); c.lineTo(.07 * k, -.11 * k); c.stroke(); } });
define('eye', { id: 'squint', label: '> <', gap: .28, hw: .095, ring: ['none'],
  draw(c, { k, s }) { c.lineWidth = .05 * k; c.beginPath(); c.moveTo(-s * .07 * k, -.08 * k); c.lineTo(s * .07 * k, 0); c.lineTo(-s * .07 * k, .08 * k); c.stroke(); } });
define('eye', { id: 'wink', label: 'Wink', gap: .22, sides: ['toon', 'squint'], ring: ['none'] });
/* internal, used by states */
define('eye', { id: 'x', label: 'X', gap: .25, hw: .1, hidden: 1,
  draw(c, { k }) { c.lineWidth = .05 * k; c.beginPath(); c.moveTo(-.075 * k, -.075 * k); c.lineTo(.075 * k, .075 * k); c.moveTo(.075 * k, -.075 * k); c.lineTo(-.075 * k, .075 * k); c.stroke(); } });
define('eye', { id: 'closed', label: 'Closed', gap: .25, hw: .115, hidden: 1,
  draw(c, { k }) { c.lineWidth = .05 * k; c.beginPath(); c.arc(0, -.04 * k, .09 * k, PI * .15, PI * .85); c.stroke(); } });

/* ---------------- EYES (new) ---------------- */
/* big glossy anime eye: ink base, coloured glow at the bottom, two highlights that follow the gaze */
define('eye', { id: 'anime', label: 'Anime', gap: .24, half: .18, hw: .13, ring: ['none', 'worried', 'dots'],
  draw(c, { k, blink: b, lx, ly, ink, color }) {
    const rx = .13 * k, ry = .18 * k * (1 - b * .92), hi = ink === WHITE ? DARK : WHITE;
    ell(c, 0, 0, rx, ry); c.fill();
    if (b < .5) {
      c.save(); ell(c, 0, 0, rx, ry); c.clip(); c.globalAlpha *= .7; c.fillStyle = CUTE.lighten(CUTE.complement(color), .25); ell(c, lx * .02 * k, .12 * k, .11 * k, .08 * k); c.fill(); c.restore();
      c.fillStyle = hi; ell(c, -.045 * k + lx * .03 * k, -.07 * k + ly * .03 * k, .048 * k, .048 * k); c.fill();
      ell(c, .045 * k + lx * .02 * k, .055 * k, .022 * k, .022 * k); c.fill();
    } } });
define('eye', { id: 'heart', label: 'Hearts', gap: .27, half: .12, hw: .12, ring: ['none'],
  draw(c, { k, blink: b, t, color }) { const r = .105 * k * (1 + .07 * Math.sin(t * 6)), [cr, cg, cb] = CUTE.hexToRgb(color), pinkish = cr > 180 && cg < 150 && cb < 190;
    lid(c, b, () => { c.fillStyle = pinkish ? WHITE : '#FF4D8D'; heart(c, 0, .01 * k, r); c.fill(); }); } });
define('eye', { id: 'stars', label: 'Stars', gap: .28, half: .12, hw: .12, ring: ['none'],
  draw(c, { k, blink: b, t }) { lid(c, b, () => { c.save(); c.rotate(Math.sin(t * 1.6) * .12); c.lineWidth = .035 * k; star(c, 0, 0, .11 * k, .48); c.fill(); c.stroke(); c.restore(); }); } });
/* relaxed half-closed eye */
define('eye', { id: 'sleepy', label: 'Sleepy', gap: .26, half: .08, hw: .11, ring: ['none', 'flat'],
  draw(c, { k, blink: b }) { lid(c, b, () => { c.beginPath(); c.arc(0, -.01 * k, .085 * k, 0, PI); c.closePath(); c.fill();
    c.lineWidth = .045 * k; c.beginPath(); c.moveTo(-.11 * k, -.01 * k); c.lineTo(.11 * k, -.01 * k); c.stroke(); }); } });
define('eye', { id: 'uwu', label: 'UwU', gap: .26, half: .08, hw: .09, ring: ['none'],
  draw(c, { k, blink: b }) { lid(c, b, () => { c.lineWidth = .05 * k; c.beginPath(); c.arc(0, -.035 * k, .07 * k, PI * .05, PI * .95); c.stroke(); }); } });

/* ---------------- BROWS ---------------- */
define('brow', { id: 'none', label: 'None' });
define('brow', { id: 'flat', label: 'Straight', pose: () => ({}) });
define('brow', { id: 'angry', label: 'Angry', pose: s => ({ rot: -s * .32 }) });
define('brow', { id: 'worried', label: 'Worried', pose: s => ({ rot: s * .28 }) });
define('brow', { id: 'sceptic', label: 'Skeptical', pose: (s, k) => s < 0 ? { rot: .3 } : { dy: -.05 * k, rot: .06 } });
/* new */
define('brow', { id: 'raised', label: 'Raised', pose: (s, k) => ({ dy: -.06 * k, rot: -s * .14 }) });
/* little round "maro" brows */
define('brow', { id: 'dots', label: 'Dots', pose: (s, k) => ({ dy: -.03 * k, w: .42, h: 1.25 }) });

/* ---------------- MOUTHS ---------------- */
define('mouth', { id: 'none', label: 'None' });
define('mouth', { id: 'smile', label: 'Smile', draw(c) { c.beginPath(); c.arc(0, -.04, .075, PI * .18, PI * .82); c.stroke(); } });
define('mouth', { id: 'open', label: 'Open', draw(c) { c.beginPath(); c.moveTo(-.08, 0); c.lineTo(.08, 0); c.arc(0, 0, .08, 0, PI); c.closePath(); c.fill(); c.save(); c.clip(); c.fillStyle = WHITE; c.fillRect(-.03, -.01, .06, .035); c.restore(); } });
define('mouth', { id: 'o', label: 'Small o', draw(c) { ell(c, 0, .02, .04, .05); c.fill(); } });
define('mouth', { id: 'flat', label: 'Neutral', draw(c) { c.beginPath(); c.moveTo(-.055, .01); c.lineTo(.055, .01); c.stroke(); } });
define('mouth', { id: 'frown', label: 'Frown', hidden: 1, draw(c) { c.beginPath(); c.arc(0, .1, .075, PI * 1.2, PI * 1.8); c.stroke(); } });
/* new */
define('mouth', { id: 'cat', label: 'Cat ω', draw(c) { c.lineWidth = .038; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * .036, -.005, .036, PI * .05, PI * .95); c.stroke(); } } });
define('mouth', { id: 'tongue', label: 'Tongue', draw(c) { c.beginPath(); c.arc(0, -.035, .072, PI * .12, PI * .88); c.stroke();
  c.fillStyle = '#FF7A9A'; c.beginPath(); c.arc(.022, .032, .03, 0, PI); c.closePath(); c.fill(); } });
define('mouth', { id: 'fang', label: 'Fang', draw(c, { ink }) { c.beginPath(); c.arc(0, -.04, .075, PI * .18, PI * .82); c.stroke();
  c.fillStyle = WHITE; c.strokeStyle = ink; c.lineWidth = .014; c.beginPath(); c.moveTo(.014, .032); c.lineTo(.046, .022); c.lineTo(.034, .066); c.closePath(); c.fill(); c.stroke(); } });
define('mouth', { id: 'grin', label: 'Grin', draw(c) { c.beginPath(); c.moveTo(-.1, -.015); c.lineTo(.1, -.015); c.arc(0, -.015, .1, 0, PI); c.closePath(); c.fill();
  c.save(); c.clip(); c.fillStyle = '#FF7A9A'; ell(c, 0, .085, .06, .04); c.fill(); c.restore(); } });

/* ---------------- CHEEKS ---------------- */
define('cheek', { id: 'none', label: 'None' });
define('cheek', { id: 'blush', label: 'Blush', draw(c, { k }) { c.fillStyle = '#FF6F9C'; c.globalAlpha *= .45; ell(c, 0, 0, .075 * k, .045 * k); c.fill(); } });
define('cheek', { id: 'freckles', label: 'Freckles', draw(c, { k, s }) { c.globalAlpha *= .45;
  [[-.04, -.01], [.0, .025], [.045, -.005]].forEach(([x, y]) => { ell(c, x * k * s, y * k, .013 * k, .013 * k); c.fill(); }); } });
/* anime "///" blush */
define('cheek', { id: 'lines', label: 'Lines', draw(c, { k }) { c.strokeStyle = '#FF5A8A'; c.lineWidth = .018 * k; c.globalAlpha *= .8;
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * .035 * k - .012 * k, .028 * k); c.lineTo(i * .035 * k + .012 * k, -.028 * k); c.stroke(); } } });
define('cheek', { id: 'shine', label: 'Shine', draw(c, { k, s, t }) { c.fillStyle = WHITE; c.globalAlpha *= .9; sparkle(c, s * .02 * k, -.01 * k, .045 * k * (.85 + .15 * Math.sin(t * 3 + s)), .32); c.fill(); } });
})();
