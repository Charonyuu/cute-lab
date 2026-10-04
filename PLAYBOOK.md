# Cute Lab · 製作邏輯手冊

Cute Lab 的製作方式：「引擎 + 樣式外掛」。
**以後新增任何樣式 = 寫一個物件、呼叫一次 `CUTE.define()`**，畫面、隨機、預設、分享連結、SVG / PNG / GIF / ZIP 匯出全部自動支援。

```
index.html        UI 外殼（CSS + 版面），載入下面所有 script
app.js            UI 邏輯：全部從 registry 生成（選單、預覽、骰子、團隊、匯出按鈕）
lab.html          樣式 QA 牆：每個已註冊樣式一格，可並排比對 canvas / SVG
engine/kit.js     registry + 數學 + 繪圖原語 + 動畫工具
engine/render.js  drawBlob()：把「描述 + 動畫幀」畫出來；分享 token 編解碼
engine/export.js  SvgCtx（假 canvas → SVG）、動態 SVG、GIF、ZIP
styles/*.js       ← 你以後只改這裡（actions.js = 新增動作）
```

本地預覽：`python3 -m http.server 8765` → http://localhost:8765/ 與 /lab.html
（純 `<script src>`，沒有 build step；直接雙擊 index.html 也能跑。）

---

## 1. 核心思想（七條）

### ① 一個角色 = 一個小物件
```js
{ shape:'cat', color:'#FFC20E', eyes:'uwu', brows:'none', mouth:'cat', ink:'auto',
  size:100, gap:100, tilt:0, finish:'glossy', cheeks:'blush', acc:'antenna' }
```
所有東西都是「從清單裡選一個 id」+ 幾個數值。所以能隨機、能存、能塞進網址。

### ② 單位座標系
身體畫在 `[-1,1]²`，中心 (0,0)，y 向下。引擎先做「位移 → 彈跳 → 擠壓 → 傾斜 → 縮放 u」，
樣式只管在單位空間裡畫，自動跟著跳、跟著擠、任何尺寸都清晰。
臉在更小的「臉空間」：一隻眼睛中心在 (0,0)，所有長度乘以 `k`（眼睛大小 × 狀態放大）。

### ③ 形狀 = 數學產生的點
不畫 SVG path，而是用函式產生輪廓點，再自動 **置中 → 縮放到單位框 → 平滑 → 等距重取樣 220 點**：
| 產生器 | 用途 | 例 |
|---|---|---|
| `superE(n,a,b,N)` | 超橢圓（n=2 圓，越大越方） | Round, Pebble, Capsule |
| `rpoly(V,t)` | 圓角多邊形（每角換成二次曲線） | Triangle, Cat, Hexagon |
| `discs([[x,y,r]…],N)` | 圓的聯集（從原點看出去） | Cloud, Clover, Bunny, Peanut |
| `polar(N, a=>r)` | 極座標半徑函式 | Flower, Flame |
| `param(N, t=>[x,y])` | 參數曲線 | Heart, Drop |
預先算好 `edge[72]`（每 5° 中心到邊緣的距離），讓配件、思考泡泡能「貼著輪廓」放。

### ④ 一次繪製，所有格式
`drawBlob()` 只呼叫 canvas 2D API。`SvgCtx` 是一個**假的 canvas context**，接收同樣的呼叫但輸出 SVG 字串。
所以：螢幕、PNG、GIF 用真 canvas；SVG 用 SvgCtx——**同一份程式碼**。
👉 代價：樣式只能用 SvgCtx 支援的 API（見 §3 限制）。

### ⑤ 狀態 = 相位函式（choreography）
每個狀態是 `move(C, p)`：給定迴圈相位 `p ∈ [0,1)`，寫入一組「動作通道」：
`look[x,y] · blink · hop · squash · sway · shake · eyeDX/DY · eyeSX/SY · eyePop · swirl`。
純函式 → 可以任意取樣：即時預覽、取 20fps 做動態 SVG、做 GIF、取 `pose` 做靜態圖。
動畫手感守則：
- 絕不線性：用 `easeIO`、`easeBack`（會過衝再回來）
- 眨眼不對稱：閉 90ms、睜 140ms（`blinkAmt`）
- 視線用關鍵幀軌道 `track()`，到點先過衝再停
- 所有通道在 p=1 回到起點 → 無縫循環
- 錯誤狀態：眼睛掉下來 + 3 次衰減彈跳（`fallH`）

### ⑥ 互動的「果凍感」
- 換形狀：整體彈簧縮放 `1 - .18·e^(-t/150)·cos(19t)`
- 換表情：眼睛 pop 一下
- 換顏色：每幀 18% 逼近（顏色漸變）
- 點角色：boing / 咯咯笑 / 愛心 三種反應輪替
- 背景點陣：反應時從角色發出一圈漣漪，推開點並短暫連線
- 所有 UI 轉場都用 `cubic-bezier(.34,1.56,.64,1)`（spring）

### ⑧ 變形 = 同一套點的「錯拍」插值
`compile()` 把每個形狀都正規化成 **220 點、順時針、第 0 點在正上方**，所以任兩個形狀第 i 點都能一一對應。
`R.blend(A, B, t, mode)` 不是直接線性插值：
- 每個點有自己的延遲 `d_i`（沿輪廓的慢波），所以一邊先縮、另一邊還在鼓 → 果凍感
- 沿半徑加一點 `sin(π·q)` 的過衝（有的地方鼓出、有的凹進）
- 臉的位置/大小 (`fy`,`fs`) 跟著平滑插值；`decor`、把手淡入淡出
- 用法：`o.morph = { from: 'round' 或某個已混合的形狀, t: 0…1, seed }`，`drawBlob` 會回傳當下的輪廓，可拿來當下一次變形的起點（中途切換也不跳）
- `melt` 模式：延遲改成「底部先動、頂部最後」，目標是 `puddleOf(shape)`（扁平、上凸下平、邊緣不規則的水灘）；任何狀態只要設 `C.melt = 0…1` 就能融化（見 Dead 狀態）

### ⑨ 自動變形 / 錄影 = 純時間函式
`morphAt(τ)`：清單 n 個形狀，每段 = 停留 hold + 變形 dur，回傳「停在某形狀」或「from→to 進度 k」，整輪無縫循環。
即時預覽與錄影共用同一個函式；錄影用離屏 canvas + `captureStream` + `MediaRecorder`（VP9 WebM 支援透明 alpha）。

### ⑦ 分享連結 = 序列化 index
`#m2` + 每個欄位 1 個 base-36 字元（= 它在 registry 的位置）+ 顏色 hex。
**所以 registry 只能往後加（append-only）**，不要重排、不要刪，否則舊連結會開出別的角色。每類最多 36 個。
舊版 `#m1…` 連結仍可讀。

---

## 2. 每種樣式的介面

| kind（`CUTE.define(kind, …)`） | 檔案 | 必填 | 選填 |
|---|---|---|---|
| `shape` | styles/shapes.js | `id,label,gen(N)` | `smooth,k,fy,fs,decor(c,B),handle` |
| `eye` | styles/face.js | `id,label,gap,hw,draw(c,e)` | `half,lightInk,sides,ring,hidden` |
| `brow` | styles/face.js | `id,label,pose(s,k)` | 回傳 `{rot,dy,w,h}` |
| `mouth` | styles/face.js | `id,label,draw(c,m)` | `hidden` |
| `cheek` | styles/face.js | `id,label,draw(c,ch)` | 每側呼叫一次 |
| `finish` | styles/body.js | `id,label` | `under/body/over(c,B)` |
| `accessory` | styles/body.js | `id,label` | `back/front(c,B)` |
| `state` | styles/states.js | `id,label,cycle,pose,move(C,p,T,cyc)` | `face(f,live),extras(c,X),follow`；通道含 `melt`、`eyeOverride`、`mouthOverride` |
| `color` | styles/palette.js | `id,hex,label,ring` | |
| `family` | styles/palette.js | `id,label,items:[CUTE.P(…)]` | |

各參數的完整說明寫在每個 styles 檔案頂部註解。常用：
- **眼睛 e** = `{k, s(-1左/+1右), blink, lx, ly, ink, color, t}`；畫之前 fill/stroke 已設成 ink、圓角線帽
- **身體 B** = `{path, pts, color, ink, t, cc(互補色), dark, light, lum, top:[x,y], rim(deg,off)}`
  `rim(38,-.06)` = 輪廓上 38° 那點往內 0.06 → 放蝴蝶結的位置
- **狀態 extras X** = `{t,p,u,cx,cy,Q(deg,off),tint,fg,o}`（螢幕像素）

---

## 3. 限制（SVG 匯出能吃的 API）
✅ `save/restore · translate/scale/rotate · beginPath/moveTo/lineTo/quadraticCurveTo/bezierCurveTo/arc/ellipse/rect/closePath · fill/stroke（可傳 B.path）· fillRect · clip · globalAlpha · fillStyle/strokeStyle（hex 或 rgb()）· lineWidth/lineCap/lineJoin`
❌ 漸層、陰影 shadowBlur、filter、文字、圖片、`fill('evenodd')`、`arcTo`
→ 要陰影？畫一個偏移的半透明黑色同形（見 Sticker）。要立體？深色底 + 縮小偏移的本色（見 Glossy）。
現成小工具：`ell, rrect, star, heart, sparkle, poly`；顏色：`mixHex, darken, lighten, complement, lum`。

---

## 4. 新增樣式 SOP（5 分鐘）
1. 打開對應的 `styles/*.js`，**在該類最後面**加一個 `define(...)`（照抄鄰居改）
2. 開 `lab.html`，找到新格子：沒紅框 = 沒錯誤
3. 勾「SVG side by side」：左右一致 = 匯出 OK
4. 換 Base shape / Colour 看極端情況（深色身體、細長形狀、星形）
5. 開 `index.html`：新選項已自動出現在選單、骰子、預覽裡

範例——加一個「眼鏡」配件：
```js
define('accessory', { id: 'glasses', label: 'Glasses',
  front(c, B) { c.strokeStyle = '#1A1A1E'; c.lineWidth = .05;
    for (const s of [-1, 1]) { CUTE.ell(c, s * .3, .02, .2, .17); c.stroke(); }
    c.beginPath(); c.moveTo(-.1, 0); c.lineTo(.1, 0); c.stroke(); } });
```
（配件畫在身體單位空間；若要對準眼睛，用 `B.sh.fy`、`B.sh.fs` 換算臉的位置。）

---

## 5. 更新紀錄
- **形狀 +7**：Ghost、Cat、Bunny、Hexagon、Flower、Peanut、Mushroom（含 `decor` 白點）
- **眼睛 +5**：Anime（互補色光暈 + 跟隨視線的高光）、Hearts（會跳）、Stars、Sleepy、UwU
- **眉毛 +2**：Raised、Dots（麻呂眉）
- **嘴巴**：開放選擇，並 +4：Cat ω、Tongue、Fang、Grin
- **全新類別**：Finish（Flat/Glossy/Sticker/Outline）、Cheeks（Blush/Freckles/Lines/Shine）、Accessory（Antenna/Sprout/Crown/Bow/Halo/Headphones）
- **狀態 +1**：Dance（四拍跳 + 音符）
- **預設 +2 系列**：Kawaii、Agents
- 主頁新增「Style」卡片（每個選項附即時迷你預覽）、`lab.html` QA 牆

### 第二輪
- **自然變形**：手動換形狀也會變形（不再瞬間切換）；可在半途再換
- **自動變形模式**：停留/速度/順序/輪播清單可調；舞台背景可換（柔光、點點、格線、素色、綠幕）
- **錄成影片**：720/1080 WebM，背景透明（VP9 alpha）/綠幕/白/舞台色，一鍵錄一整輪
- **形狀 +2**：Spark（放射星芒，Claude 風）、Knot（六瓣結，ChatGPT 風）＋顏色 Clay、Jade ＋ AI 預設組（皆為神似剪影，非官方 logo）
- **狀態 +1**：Dead（發抖 → 由下往上融化成一灘 → × 眼、小幽靈飄走、冒泡 → 復活）
- **全新 UI**：奶油紙 + 粗墨線 + 位移陰影的貼紙風；左舞台、右分頁檢視器（形狀/臉/風格/動態/預設）全部縮圖即時預覽；中文介面

### 第三輪
- **狀態 +1：Sword（拔劍）**：劍柄從頭頂冒出 → 憋氣用力拔三下（身體被拉長）→ 啵！拔出 → 空中轉圈 → 身體長出黏液小手接住 → 揮兩刀（含刀光）→ 往上一丟、翻轉、插回身體吞掉（無縫循環）
- **引擎新掛鉤 `state.back(c, X)`**：畫在身體「後面」，用來做「從身體裡拔出／插回去」；`X` 新增 `topY`、`floorY`（這一幀真實的頭頂與地板，含拉伸）、`bx`（含抖動的中心）
- **桌機版面**：整頁剛好一個畫面不捲動，只有右側面板、狀態列內部捲動；舞台用 container query 自動維持正方形
- script 加上 `?v=` 版本號避免瀏覽器快取舊檔（改檔後記得遞增）

### 第四輪
- **狀態 +1：Goo Blade（黏液劍）**：劍是「身體長出來的」——頭頂擠出一坨黏液 → 果凍般變形成劍（跟身體同色、同質感，套用目前 Finish，加深色外框）→ 拉出黏液絲斷開、滴回 → 黏液手接住揮兩刀（刀光是身體淡色）→ 落回頭上融回一坨被吸收
  - 技巧：劍輪廓與黏液團用同樣 160 點、依角度對齊，所以能逐點變形（同形狀變形原理）；用 `fin.under/body/over` 把身體的質感套在劍上
- 兩把劍做了出框檢查：23 種形狀 × 60 幀全部不超出舞台
- **版面 v3**：收藏（原團隊）改成左側直立欄；三顆按鈕放進舞台底部；狀態改兩排格狀不用橫捲；移除底部致謝行

- Goo Blade 改版：頭頂右上「甩出一顆黏液球」→ 球飛到右上方、空中變形成劍 → 掉下來被黏液手接住 → 揮兩刀 → 變回球飛回身體被吸收
- 黏液手加外框：外框（深色粗線）畫在 `st.back`（身體後面），本體畫在前面 → 身體外的部分有框、跟身體接合處無縫；手掌也有外框。金屬劍同樣套用

### 第五輪：30 種動作
- **揮劍改用「肩膀＋手臂」骨架**（`CUTE.act.rig`）：手 = 肩膀 + 手臂長 ×（cos θ, sin θ），劍接在手臂延長線上，整隻手臂繞肩膀轉；刀光以肩膀為圓心畫大弧
- Goo Blade 改回「從身體擠出」版本，位置改到左上（避開所有配件）；甩球版本保留為 **Goo Throw**（球從右側 62° 冒出、飛到右上角）
- **引擎新通道**：`C.dx`（左右移動，走路/躲貓貓）、`C.flip`（水平翻轉，轉圈）、`C.faceAlpha`（轉到背面時臉淡出）
- **新檔 `styles/actions.js`，+17 個動作**：法杖、跳跳走路、搖擺走路、揮手、開心跳、轉圈、點頭、搖頭、大笑、哭哭、生氣、戀愛、吃餅乾、打噴嚏、打哈欠、躲貓貓、撐傘
- 每個狀態都有中文名 `zh`，介面顯示中文；狀態區最多顯示兩排，其餘在框內捲動
- 出框檢查：除了躲貓貓（刻意滑出畫面）、撐傘（雨本來就滿版），全部狀態 × 23 形狀 × 有無配件都不出框

- 揮劍改成**往外揮**：第一刀劍舉過頭往右外劈下、第二刀反手往上撩，弧線都在身體外側不經過臉；肩膀移到 42°、手臂 .5、黏液劍縮成 .78
- **舞台加寬**：桌機版版面放寬到 1600px，舞台可比高還寬（最多 1.6:1），角色畫在中間的正方形區域（`app.js` frame 裡的置中 translate）
- **JobPocket 吉祥物**：新形狀 `pocket`（App icon 口袋輪廓 + 口袋縫線 + 右側釦子）、新配件 `jobcard`（JOB 卡片插在身體後面露出頂端、筆畫畫字、右上兩條閃光）、新顏色 `#F4F7FD` Paper、新預設組 `jobpocket`（6 款）
- `actions.js` 道具動作（法杖/揮手/吃餅乾/撐傘）改用**側邊肩膀** `Q(100,-.12)`、手臂 .55：手從身體右側長出，不再從頭頂冒出

## 6. 部署
純靜態：整個資料夾丟 Cloudflare Pages / Vercel / GitHub Pages 即可（不需 build）。
