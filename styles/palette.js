/* =====================================================================
   PALETTE + PRESET FAMILIES
   COLOR  { id, hex, label, ring: 0 outer wheel (vivid, in hue order) | 1 inner wheel (neutrals, pastels) }
   FAMILY { id, label, items: [ CUTE.P(shape, color, eyes, { brows, mouth, size, gap, tilt, finish, cheeks, acc, ink }) ] }
   Colours are stored as hex in links, so the palette can be reordered freely.
   ===================================================================== */
(function () {
const { define, P } = CUTE;
[
  ['#8A5A3A', 'Hazel', 0], ['#EE7433', 'Orange', 0], ['#FFC20E', 'Sun', 0], ['#A8D13B', 'Lime', 0],
  ['#5CCB77', 'Mint', 0], ['#1ED8C0', 'Lagoon', 0], ['#3F95F5', 'Sky', 0], ['#2F6BF0', 'Royal blue', 0],
  ['#9966FF', 'Lilac', 0], ['#8844EE', 'Violet', 0], ['#FF5AA5', 'Pink', 0], ['#FF5A5A', 'Tomato', 0],
  ['#E4E4E1', 'Chalk', 1], ['#F7B8CF', 'Powder pink', 1], ['#B07350', 'Leather', 1],
  ['#161618', 'Ink', 1], ['#8E8E8E', 'Grey', 1], ['#BFE0F5', 'Pale blue', 1],
  ['#D97757', 'Clay', 1], ['#10A37F', 'Jade', 1], ['#F4F7FD', 'Paper', 1],
].forEach(([hex, label, ring]) => define('color', { id: hex, hex, label, ring }));

/* ---- classic families ---- */
define('family', { id: 'cartoon', label: 'Cartoon', items: [
  P('flame', '#FF5A5A', 'toon', { brows: 'sceptic' }), P('star', '#FFC20E', 'toon'), P('bag', '#B07350', 'toon', { brows: 'sceptic' }),
  P('triangle', '#3F95F5', 'toon', { mouth: 'smile', tilt: -4 }), P('round', '#1ED8C0', 'toon', { brows: 'angry' }), P('heart', '#9966FF', 'wink', { size: 90 }), P('square', '#8E8E8E', 'toon', { mouth: 'open', tilt: 3 })] });
define('family', { id: 'pills', label: 'Pills', items: [
  P('drop', '#8E8E8E', 'pill', { size: 90, gap: 90 }), P('triangle', '#3F95F5', 'pill', { size: 85, gap: 90, tilt: -6 }), P('cloud', '#EE7433', 'dash', { size: 95, gap: 85, tilt: -5 }),
  P('round', '#161618', 'pill', { size: 95, gap: 90 }), P('pill', '#5CCB77', 'pill', { size: 110, gap: 95, tilt: -10 }), P('clover', '#8A5A3A', 'pill', { size: 95, gap: 90, tilt: 4 })] });
define('family', { id: 'glyphs', label: 'Glyphs', items: [
  P('round', '#8844EE', 'ring', { size: 100, gap: 105 }), P('round', '#EE7433', 'slash', { size: 95, gap: 100 }), P('round', '#E4E4E1', 'ring', { size: 75, gap: 80 }),
  P('round', '#5CCB77', 'plus', { size: 90, gap: 95 }), P('round', '#161618', 'happy', { size: 90, gap: 100 }), P('round', '#2F6BF0', 'squint', { size: 85, gap: 95 })] });

/* ---- new families ---- */
define('family', { id: 'kawaii', label: 'Kawaii', items: [
  P('ghost', '#E4E4E1', 'anime', { cheeks: 'blush', finish: 'glossy', size: 90 }), P('cat', '#FFC20E', 'uwu', { mouth: 'cat', cheeks: 'blush' }),
  P('bunny', '#F7B8CF', 'dot', { cheeks: 'blush', mouth: 'smile', acc: 'bow', size: 90 }), P('mushroom', '#FF5A5A', 'sleepy', { cheeks: 'blush', size: 95 }),
  P('flower', '#9966FF', 'stars', { finish: 'sticker', size: 90 }), P('peanut', '#5CCB77', 'happy', { acc: 'sprout', cheeks: 'freckles' })] });
define('family', { id: 'agents', label: 'Agents', items: [
  P('round', '#1ED8C0', 'pill', { acc: 'antenna', finish: 'glossy' }), P('hexagon', '#3F95F5', 'toon', { acc: 'phones', finish: 'outline', mouth: 'fang' }),
  P('square', '#161618', 'dash', { acc: 'antenna', finish: 'sticker', size: 95 }), P('pebble', '#FFC20E', 'heart', { acc: 'crown', cheeks: 'lines' }),
  P('cloud', '#BFE0F5', 'anime', { acc: 'halo', cheeks: 'shine', finish: 'glossy', size: 85 })] });
define('family', { id: 'ai', label: 'AI', items: [
  P('spark', '#D97757', 'toon', { size: 85, gap: 90 }), P('spark', '#D97757', 'pill', { acc: 'none', finish: 'glossy', size: 90 }),
  P('knot', '#10A37F', 'dot', { cheeks: 'blush' }), P('knot', '#161618', 'pill', { finish: 'sticker' })] });
define('family', { id: 'jobpocket', label: 'JobPocket', items: [
  P('pocket', '#F4F7FD', 'pill', { acc: 'jobcard', finish: 'sticker', mouth: 'smile', cheeks: 'blush' }), P('pocket', '#2F6BF0', 'toon', { acc: 'jobcard', finish: 'glossy', mouth: 'smile' }),
  P('pocket', '#3F95F5', 'uwu', { acc: 'jobcard', mouth: 'cat', cheeks: 'blush', finish: 'glossy' }), P('pocket', '#F4F7FD', 'happy', { acc: 'jobcard', finish: 'outline', mouth: 'open', cheeks: 'shine' }),
  P('pocket', '#BFE0F5', 'anime', { acc: 'jobcard', cheeks: 'blush', mouth: 'smile', finish: 'sticker', size: 90 }), P('round', '#2F6BF0', 'dot', { acc: 'jobcard', cheeks: 'blush', mouth: 'smile', finish: 'glossy' })] });
})();
