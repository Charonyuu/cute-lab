/* =====================================================================
   SHAPES · the body outline
   { id, label,
     gen(N) → [[x,y],…]  outline points (any scale; auto-centred and fit to [-1,1])
     smooth?  extra smoothing passes (corners → curves)        default 2
     k?       final size (1 = touches the unit box)             default 1
     fy?      face vertical offset (+ = lower)                  default 0
     fs?      face scale                                        default 1
     decor?(c,B)  drawn on top of the body, under the face (spots, stripes…) }
   Generators in CUTE: superE, param, polar, rpoly, discs, gauss, resample.
   APPEND ONLY — the index is stored in share links.
   ===================================================================== */
(function () {
const { define, superE, param, polar, rpoly, discs, gauss, resample, ell, PI } = CUTE;

/* ---- original 12 ---- */
define('shape', { id: 'round', label: 'Round', gen: N => superE(2, 1, 1, N) });
define('shape', { id: 'pebble', label: 'Pebble', gen: N => superE(2.3, 1, .88, N) });
define('shape', { id: 'pill', label: 'Capsule', gen: N => superE(3.2, 1, .6, N), fs: .8 });
define('shape', { id: 'drop', label: 'Drop', gen: N => param(N, t => [1.1 * Math.sin(t) * Math.pow(Math.sin(t / 2), .9), -Math.cos(t)]), fy: .26, fs: .82, smooth: 12 });
define('shape', { id: 'flame', label: 'Flame', gen: N => polar(N, a => .72 + .52 * gauss(a, -.22, .36) + .2 * gauss(a, .5, .16)).map(([x, y]) => [x, y > 0 ? y * .92 : y]), fy: .2, fs: .84, smooth: 10 });
define('shape', { id: 'triangle', label: 'Triangle', gen: () => rpoly([[0, -1], [1, .72], [-1, .72]], .3), fy: .3, fs: .74, smooth: 6 });
define('shape', { id: 'square', label: 'Square', gen: () => rpoly([[-.94, -.9], [.96, -.95], [.93, .92], [-.95, .94]], .26), fy: .02, fs: .95, smooth: 4 });
define('shape', { id: 'bag', label: 'Briefcase', gen: () => rpoly([[-1, -.56], [1, -.56], [1, .72], [-1, .72]], .16), fy: .12, fs: .9, smooth: 4, handle: 1, k: .94 });
define('shape', { id: 'star', label: 'Star', gen: () => rpoly(Array.from({ length: 10 }, (_, i) => { const a = i * PI / 5, r = i % 2 ? .54 : 1; return [r * Math.sin(a), -r * Math.cos(a)]; }), .26), fy: .08, fs: .76, smooth: 6 });
define('shape', { id: 'heart', label: 'Heart', gen: N => param(N, t => { const s = Math.sin(t); return [16 * s * s * s, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; }), fy: -.1, fs: .88, smooth: 10 });
define('shape', { id: 'cloud', label: 'Cloud', gen: N => discs([[-.62, .1, .4], [-.26, -.2, .46], [.24, -.22, .44], [.62, .08, .4], [.24, .3, .4], [-.24, .3, .4]], N), fy: .04, fs: .8, smooth: 3 });
define('shape', { id: 'clover', label: 'Clover', gen: N => discs([[-.36, -.36, .46], [.36, -.36, .46], [-.36, .36, .46], [.36, .36, .46]], N), fy: .02, fs: .88, smooth: 3 });

/* ---- new ---- */
/* dome on top, three little tails at the bottom */
define('shape', { id: 'ghost', label: 'Ghost', fy: .02, fs: .9, smooth: 3, gen: () => {
  const p = [];
  for (let i = 0; i <= 60; i++) { const a = PI + PI * i / 60; p.push([Math.cos(a), -.15 + Math.sin(a)]); }
  for (let i = 1; i < 10; i++) p.push([1, -.15 + .93 * i / 10]);
  for (let i = 0; i <= 80; i++) { const x = 1 - 2 * i / 80; p.push([x, .78 + .16 * Math.pow(Math.abs(Math.cos(1.5 * PI * x)), .7)]); }
  for (let i = 9; i > 0; i--) p.push([-1, -.15 + .93 * i / 10]);
  return resample(p, 200);
} });
/* rounded body with two pointy ears */
define('shape', { id: 'cat', label: 'Cat', fy: .14, fs: .9, smooth: 4,
  gen: () => rpoly([[-1, -.2], [-.86, -1], [-.34, -.62], [.34, -.62], [.86, -1], [1, -.2], [.96, .86], [-.96, .86]], .24) });
/* round body, two long ears (union of discs) */
define('shape', { id: 'bunny', label: 'Bunny', fy: .26, fs: .8, smooth: 3,
  gen: N => discs([[0, .3, .72], [-.3, -.45, .2], [-.31, -.68, .2], [-.32, -.9, .19], [.3, -.45, .2], [.31, -.68, .2], [.32, -.9, .19]], N) });
define('shape', { id: 'hexagon', label: 'Hexagon', fs: .92, smooth: 4,
  gen: () => rpoly(Array.from({ length: 6 }, (_, i) => { const a = i * PI / 3; return [Math.sin(a), -Math.cos(a)]; }), .22) });
/* scalloped edge, 6 round petals */
define('shape', { id: 'flower', label: 'Flower', fs: .82, smooth: 2,
  gen: N => polar(N, a => .76 + .24 * Math.pow(Math.abs(Math.cos(3 * a)), .6)) });
define('shape', { id: 'peanut', label: 'Peanut', fs: .78, smooth: 4,
  gen: N => discs([[-.44, 0, .56], [.44, 0, .56], [0, 0, .42]], N) });
/* cap + stem, white spots on the cap, face on the stem */
define('shape', { id: 'mushroom', label: 'Mushroom', fy: .5, fs: .58, smooth: 5,
  gen: () => {
    const p = [];
    for (let i = 0; i <= 50; i++) { const a = PI + PI * i / 50; p.push([Math.cos(a), -.1 + Math.sin(a) * .85]); }
    p.push([.94, .06], [.55, .14], [.5, .5], [.52, .82], [.36, .93], [-.36, .93], [-.52, .82], [-.5, .5], [-.55, .14], [-.94, .06]);
    return resample(p, 200);
  },
  decor(c) { c.fillStyle = '#FFFFFF'; c.globalAlpha *= .92;
    [[-.5, -.42, .15, .12], [.08, -.7, .12, .09], [.55, -.35, .13, .11], [-.08, -.3, .08, .07]].forEach(([x, y, rx, ry]) => { ell(c, x, y, rx, ry); c.fill(); }); } });
/* ---- AI-flavoured silhouettes (evocative, not the official logos) ---- */
/* radiating burst: 11 tapered rays of uneven length around a round core (Claude-ish) */
const RAYS = [1, .84, .95, .8, .98, .86, .92, .82, 1, .88, .9];
define('shape', { id: 'spark', label: 'Spark', fs: .66, smooth: 5,
  gen: N => polar(Math.max(N, 330), a => { const n = RAYS.length, k = Math.round(a * n / (2 * PI)) % n, c = (1 + Math.cos(n * a)) / 2; return .5 + (RAYS[k] - .5) * Math.pow(c, 1.5); }) });
/* six-lobed rosette, flat-topped hexagon of lobes around a core (ChatGPT-ish) */
define('shape', { id: 'knot', label: 'Knot', fs: .86, smooth: 3,
  gen: N => discs([[0, 0, .62], ...Array.from({ length: 6 }, (_, i) => { const a = (i * 60 + 30) * PI / 180; return [Math.sin(a) * .56, -Math.cos(a) * .56, .4]; })], N) });
/* ---- brand mascots ---- */
/* JobPocket: the app-icon pocket — flat top with soft corners, deep rounded bottom (≈ 1.25 : 1, like the icon).
   decor: the pocket lip (a sagging seam under the opening) + the snap button on the right. Pair with acc 'jobcard'. */
define('shape', { id: 'pocket', label: 'Pocket', fy: .14, fs: .86, smooth: 3,
  gen() { const p = [], arc = (cx, cy, r, a0, a1) => { for (let i = 0; i <= 24; i++) { const a = a0 + (a1 - a0) * i / 24; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(.86, -.66, .14, -PI / 2, 0); arc(.4, .3, .6, 0, PI / 2); arc(-.4, .3, .6, PI / 2, PI); arc(-.86, -.66, .14, PI, PI * 1.5);
    return resample(p, 200); },
  decor(c, B) { c.strokeStyle = B.dark; c.lineWidth = .06; c.lineCap = 'round'; c.globalAlpha *= .55;
    c.beginPath(); c.moveTo(-.84, -.58); c.quadraticCurveTo(0, -.38, .84, -.58); c.stroke(); c.globalAlpha /= .55;
    c.fillStyle = B.lum > .6 ? '#2F6BF0' : '#FFFFFF'; ell(c, .64, .3, .1, .1); c.fill(); } });
})();
