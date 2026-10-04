/* =====================================================================
   BODY · finishes and accessories
   Drawn in UNIT space (body ≈ [-1,1]², centre 0,0, y down), inside the body
   transform, so they squash, hop and tilt with the mascot automatically.

   B = { path (Path2D of the outline: c.fill(B.path) / c.stroke(B.path)),
         pts, color, ink, t (seconds), cc (complementary colour),
         dark / light (shades of the body colour), lum,
         top: [x,y] top of the outline at x=0,
         rim(deg, off) → [x,y] point on the outline at angle deg (0 = top, clockwise), pushed out by off }

   FINISH    { id, label, under?(c,B), body?(c,B) replaces the flat fill, over?(c,B) }
   ACCESSORY { id, label, back?(c,B) behind the body, front?(c,B) in front of it }
   APPEND ONLY — indexes are stored in share links.
   ===================================================================== */
(function () {
const { define, ell, rrect, star, poly, PI, DARK, WHITE } = CUTE;

/* ---------------- FINISHES ---------------- */
define('finish', { id: 'flat', label: 'Flat' });
/* soft 3D: darker rim bottom-right, highlight + specular dot top-left */
define('finish', { id: 'glossy', label: 'Glossy',
  body(c, B) { c.fillStyle = B.dark; c.fill(B.path); c.save(); c.translate(-.035, -.06); c.scale(.94, .92); c.fillStyle = B.color; c.fill(B.path); c.restore(); },
  over(c, B) { const [x, y] = B.rim(-42, -.32), [x2, y2] = B.rim(-62, -.2);
    c.fillStyle = WHITE; c.globalAlpha = .42; ell(c, x, y, .2, .11, -.75); c.fill(); c.globalAlpha = .9; ell(c, x2, y2, .045, .045); c.fill(); } });
/* die-cut sticker: thick white border + soft drop shadow */
define('finish', { id: 'sticker', label: 'Sticker',
  under(c, B) { c.lineJoin = 'round';
    c.save(); c.translate(.02, .08); c.globalAlpha = .12; c.fillStyle = '#000000'; c.strokeStyle = '#000000'; c.lineWidth = .22; c.fill(B.path); c.stroke(B.path); c.restore();
    c.strokeStyle = WHITE; c.lineWidth = .22; c.stroke(B.path); } });
/* cartoon line art */
define('finish', { id: 'outline', label: 'Outline',
  over(c, B) { c.strokeStyle = '#1A1A1E'; c.lineWidth = .075; c.lineJoin = 'round'; c.stroke(B.path); } });

/* ---------------- ACCESSORIES ---------------- */
define('accessory', { id: 'none', label: 'None' });
/* bobbing antenna with a complementary ball: very "AI agent" */
define('accessory', { id: 'antenna', label: 'Antenna',
  back(c, B) { const [, ty] = B.top, sw = Math.sin(B.t * 2.6) * .06, tip = [sw, ty - .36];
    c.strokeStyle = B.dark; c.lineWidth = .06; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, ty + .12); c.quadraticCurveTo(0, ty - .2, tip[0], tip[1]); c.stroke();
    c.fillStyle = B.cc; ell(c, tip[0], tip[1], .1, .1); c.fill();
    c.fillStyle = WHITE; c.globalAlpha = .7; ell(c, tip[0] - .03, tip[1] - .035, .03, .03); c.fill(); } });
define('accessory', { id: 'sprout', label: 'Sprout',
  back(c, B) { const [, ty] = B.top, [r, g, b] = CUTE.hexToRgb(B.color), leaf = g > r && g > b ? '#2E8B57' : '#5CCB77';
    c.translate(0, ty + .06); c.rotate(Math.sin(B.t * 2) * .12);
    c.strokeStyle = leaf; c.lineWidth = .05; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, .08); c.quadraticCurveTo(.03, -.12, 0, -.24); c.stroke();
    c.fillStyle = leaf; ell(c, -.12, -.28, .13, .065, .55); c.fill(); ell(c, .12, -.3, .13, .065, -.55); c.fill(); } });
define('accessory', { id: 'crown', label: 'Crown',
  front(c, B) { const [, ty] = B.top, y = ty + .07;
    c.translate(.04, 0); c.rotate(.12);
    c.fillStyle = '#FFC20E'; c.strokeStyle = '#FFC20E'; c.lineWidth = .05; c.lineJoin = 'round';
    poly(c, [[-.25, y], [-.27, y - .24], [-.13, y - .12], [0, y - .3], [.13, y - .12], [.27, y - .24], [.25, y]]); c.fill(); c.stroke();
    c.fillStyle = '#FF5A5A'; ell(c, 0, y - .07, .045, .045); c.fill(); } });
define('accessory', { id: 'bow', label: 'Bow',
  front(c, B) { const [x, y] = B.rim(38, -.06), col = B.lum > .35 && B.color.toUpperCase() !== '#FF5AA5' ? '#FF5AA5' : '#FFFFFF';
    c.translate(x, y); c.rotate(.5 + Math.sin(B.t * 2.2) * .05);
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = .06; c.lineJoin = 'round';
    poly(c, [[0, 0], [-.2, -.12], [-.2, .12]]); c.fill(); c.stroke(); poly(c, [[0, 0], [.2, -.12], [.2, .12]]); c.fill(); c.stroke();
    c.fillStyle = CUTE.darken(col, .15); ell(c, 0, 0, .06, .06); c.fill(); } });
define('accessory', { id: 'halo', label: 'Halo',
  back(c, B) { const [, ty] = B.top; c.strokeStyle = '#FFC20E'; c.lineWidth = .06; ell(c, 0, ty - .2 + Math.sin(B.t * 2) * .03, .32, .085); c.stroke(); } });
/* headphones: band over the top, cups on both sides */
define('accessory', { id: 'phones', label: 'Headphones',
  back(c, B) { const R = Math.max(-B.top[1], ...[-60, -30, 30, 60].map(d => Math.hypot(...B.rim(d, 0)))) + .08;
    c.strokeStyle = '#2B2B30'; c.lineWidth = .08; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, R, PI + .5, CUTE.TAU - .5); c.stroke(); },
  front(c, B) { for (const s of [-1, 1]) { const [x, y] = B.rim(s * 80, -.02);
    c.save(); c.translate(x, y); c.rotate(s * .12); c.fillStyle = '#2B2B30'; rrect(c, -.09, -.18, .18, .36, .08); c.fill();
    c.fillStyle = B.cc; rrect(c, -.045, -.12, .09, .24, .04); c.fill(); c.restore(); } } });
/* JobPocket "JOB" card: tucked behind the body so it pokes out of the top like it sits in a pocket,
   letters drawn as strokes (no text), gently bobbing; two sparkle ticks pop at the upper right */
define('accessory', { id: 'jobcard', label: 'Job card',
  back(c, B) { const [, ty] = B.top, bob = Math.sin(B.t * 2.4) * .03, blue = '#2F6BF0';
    c.translate(-.04, ty + bob); c.rotate(.1); c.scale(1.18, 1.18);
    c.fillStyle = '#FFFFFF'; rrect(c, -.42, -.58, .84, .9, .1); c.fill(); c.strokeStyle = '#C9D3E6'; c.lineWidth = .03; c.stroke();
    c.strokeStyle = blue; c.lineWidth = .065; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-.2, -.46); c.lineTo(-.2, -.32); c.quadraticCurveTo(-.2, -.25, -.26, -.25); c.quadraticCurveTo(-.31, -.25, -.32, -.3); c.stroke();
    ell(c, 0, -.355, .085, .105); c.stroke();
    c.beginPath(); c.moveTo(.17, -.46); c.lineTo(.17, -.25); c.moveTo(.17, -.46); c.quadraticCurveTo(.3, -.46, .3, -.41); c.quadraticCurveTo(.3, -.36, .17, -.36);
    c.moveTo(.17, -.36); c.quadraticCurveTo(.32, -.36, .32, -.305); c.quadraticCurveTo(.32, -.25, .17, -.25); c.stroke();
    c.strokeStyle = '#C9D3E6'; c.lineWidth = .05; c.beginPath(); c.moveTo(-.28, -.14); c.lineTo(.28, -.14); c.stroke(); },
  front(c, B) { const [, ty] = B.top, pop = .75 + .25 * Math.sin(B.t * 4); c.strokeStyle = B.lum > .6 || B.lum < .2 ? '#2F6BF0' : '#FFC20E';
    c.lineWidth = .065; c.lineCap = 'round'; c.translate(.62, ty - .38);
    for (const [a, l] of [[-1.1, .2], [-.45, .2]]) { c.beginPath(); c.moveTo(Math.cos(a) * .1, Math.sin(a) * .1); c.lineTo(Math.cos(a) * (.1 + l * pop), Math.sin(a) * (.1 + l * pop)); c.stroke(); } } });
})();
