/* =====================================================================
   Cute Lab · i18n (中文 / English)
   The Chinese UI text is the key: T('分享') → 'Share' in English, itself in 中文.
   Template strings work too: T`已收藏 · ${n}` looks up '已收藏 · {}'.
   Static HTML text is translated once on load (see translateDom); switching
   language stores the choice and reloads — the character lives in the URL hash.
   ===================================================================== */
(() => {
'use strict';
const KEY = 'cute-lab-lang';
let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
const LANG = saved === 'zh' || saved === 'en' ? saved : /^zh\b/i.test(navigator.language || '') ? 'zh' : 'en';

const EN = {
  /* index.html */
  'Cute Lab：設計會動的可愛角色，自動變形、錄成影片，匯出 PNG / SVG / GIF。': 'Cute Lab: design cute animated characters, morph between shapes, record videos, export PNG / SVG / GIF.',
  '會動的可愛角色工作室': 'A studio for cute animated characters',
  '分享': 'Share', '匯出': 'Export', '收藏': 'Saved',
  '按「收藏」把角色存起來': 'Press “Save” to keep a character here',
  '角色預覽：點一下互動，拖曳調整眼睛': 'Character preview: click to interact, drag to adjust the eyes',
  '自動變形中': 'Morphing', '點我互動 · 拖曳調眼睛': 'Click me · drag to adjust the eyes',
  '舞台背景': 'Stage background', '自動變形': 'Auto morph', '隨機': 'Random', '狀態': 'States', '設定': 'Settings',
  '身體形狀': 'Body shape', '換形狀會自然變形': 'shapes morph into each other',
  '眼睛': 'Eyes', '眉毛': 'Brows', '嘴巴': 'Mouth', '臉頰': 'Cheeks', '微調': 'Fine-tune',
  '眼睛大小': 'Eye size', '眼距': 'Eye spacing', '歪頭': 'Head tilt', '五官顏色': 'Face colour',
  '顏色': 'Colour', '質感': 'Finish', '配件': 'Accessory',
  '停留': 'Hold', '變形速度': 'Morph time', '順序': 'Order', '變形清單': 'Morph playlist', '全選': 'All', '清空': 'None',
  '點選要輪播的形狀（至少 2 個）。': 'Pick the shapes to cycle through (at least 2).',
  '錄成影片': 'Record a video', '背景': 'Background', '尺寸': 'Size', '錄製一整輪': 'Record one loop',
  '錄出 WebM（Chrome 支援透明背景）。綠幕可直接在剪輯軟體去背。錄製時請保持此分頁在前景。':
    'Records WebM (Chrome supports a transparent background). Key out the green screen in any video editor. Keep this tab in front while recording.',
  '關閉': 'Close', '匯出的角色': 'Exported character', 'SVG 程式碼': 'SVG code',
  '語言': 'Language', '原始碼（GitHub）': 'Source code (GitHub)',

  /* app.js */
  '形狀': 'Shape', '臉': 'Face', '風格': 'Style', '動態': 'Motion', '預設': 'Presets',
  '自動': 'Auto', '黑': 'Dark', '白': 'White', '白色': 'White', '透明': 'Transparent', '綠幕': 'Green screen', '舞台色': 'Stage colour',
  '依序': 'In order', '自訂顏色': 'Custom colour', '柔光': 'Soft light', '點點': 'Dots', '格線': 'Grid', '素色': 'Plain',
  '背景：': 'Background: ', '狀態：': 'State: ', '載入': 'Load', '移出收藏': 'Remove from saved',
  ' 秒': 's', '停止變形': 'Stop morphing', '停止錄製': 'Stop recording', '錄製中': 'Recording',
  '至少保留 2 個形狀': 'Keep at least 2 shapes', '變形清單至少要 2 個形狀': 'The morph playlist needs at least 2 shapes',
  '圖片': 'Image', '複製 PNG': 'Copy PNG', '目前狀態': 'Current state',
  '複製 SVG': 'Copy SVG', '下載 SVG': 'Download SVG', '下載 GIF': 'Download GIF', 'GIF 製作中…': 'Making the GIF…', 'Figma / Slack 用': 'for Figma / Slack',
  '複製 SVG 總表': 'Copy SVG sheet', '下載全部 (.zip)': 'Download all (.zip)', '已下載 SVG + PNG + GIF': 'Downloaded SVG + PNG + GIF',
  '複製收藏總表': 'Copy saved sheet', '下載收藏 (.zip)': 'Download saved (.zip)', '收藏已下載': 'Saved characters downloaded',
  'SVG 樣式': 'SVG style', '靜態': 'Static', 'GIF 背景': 'GIF background', '🎬 錄製變形影片': '🎬 Record a morph video',
  '瀏覽器擋住了複製圖片，請右鍵（或長按）圖片另存。': 'The browser blocked copying the image. Right-click (or long-press) it to save.',
  '無法自動複製，內容已選取，請按 Ctrl/⌘ + C。': 'Could not copy automatically. The content is selected: press Ctrl/⌘ + C.',
  '無法自動複製，連結已選取，請按 Ctrl/⌘ + C。': 'Could not copy automatically. The link is selected: press Ctrl/⌘ + C.',
  '連結已複製 · 打開就是這隻角色': 'Link copied · it opens this exact character',
  '這隻已經收藏了': 'Already saved', '已取消錄製': 'Recording cancelled',
  '這個瀏覽器不支援錄影，請用 Chrome': 'This browser cannot record video. Please use Chrome.',
  '找不到可用的影片格式': 'No supported video format found',
  '{} 個形狀 · 一輪 {} 秒': '{} shapes · {}s per loop', '{} 秒': '{}s',
  'PNG {}×{} 已複製': 'PNG {}×{} copied', 'SVG「{}」已複製 · {}': 'SVG “{}” copied · {}',
  '全部 {} 個狀態': 'All {} states', '全部狀態已複製 · {}': 'All states copied · {}',
  '已下載 GIF · {}px · {}': 'GIF downloaded · {}px · {}', '已下載「{}」SVG': 'Downloaded “{}” SVG',
  '已收藏 · {}': 'Saved · {}', '影片已下載 · {} 秒 · {} MB': 'Video downloaded · {}s · {} MB',
  '收藏已滿（{}），先移除一隻': 'Saved is full ({}). Remove one first.',
  '收藏總表已複製 · {} 隻 × {} 狀態 · {}': 'Saved sheet copied · {} × {} states · {}',
  '準備 {} 個狀態…': 'Preparing {} states…', '準備收藏 {}/{}…': 'Preparing saved {}/{}…',
  '目前狀態 · {}': 'Current state · {}', '眼睛 {}% · 眼距 {}%': 'Eyes {}% · spacing {}%',
};

function T(s, ...vals) {
  if (Array.isArray(s) && s.raw) {                     // tagged template
    const key = s.join('{}');
    const out = LANG === 'en' && EN[key] != null ? EN[key] : key;
    let i = 0; return out.replace(/\{\}/g, () => String(vals[i++]));
  }
  return LANG === 'en' && EN[s] != null ? EN[s] : s;
}

function setLang(l) { if (l === LANG) return; try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }

/* translate the static page once: text nodes and a few attributes, keeping surrounding whitespace */
function translateDom(root = document) {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hant' : 'en';
  if (LANG !== 'en') return;
  const walk = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());) {
    const t = n.nodeValue.trim(); if (t && EN[t] != null) n.nodeValue = n.nodeValue.replace(t, EN[t]);
  }
  for (const a of ['aria-label', 'title', 'alt', 'content'])
    for (const e of document.querySelectorAll(`[${a}]`)) { const v = e.getAttribute(a); if (EN[v] != null) e.setAttribute(a, EN[v]); }
  /* same Chinese word, different English: <span data-en="Save">收藏</span> (the button) vs. 收藏 → Saved (the list) */
  for (const e of document.querySelectorAll('[data-en]')) e.textContent = e.dataset.en;
}

window.CUTE_I18N = { LANG, T, setLang, translateDom };
window.T = T;
})();
