# 神經科 OSCE 鑑別診斷推理訓練（PWA）

## 檔案結構
- `index.html`／`style.css`／`app.js`：共用外殼（首頁選單、線索流程、計分、結果頁）
- `exam.js`：OSCE 模擬考（隨機病例、計時、評分與講解）
- `figs.js`：手繪風病灶示意圖（腦中風主題；在診斷資料加 `fig` 欄位即可顯示）
- `topics/index.json`：主題清單（`"ready":true` 才會出現並被離線快取）
- `topics/<主題>.json`：每個主題的線索、鑑別診斷、範例情境、教學提醒
- `manifest.webmanifest`、`sw.js`、`icons/`：PWA 設定

## 新增主題（例如頭痛）
1. 複製 `topics/headache.json`（有原發型／次發型分類與 ICHD-3 欄位 `group`、`ichd`，可省略）為新檔名，改 `steps`（線索與選項）與 `dx`（診斷：`match` 填各線索符合的選項、`red` 標紅旗、`missing` 填〔還缺〕）
2. 在 `topics/index.json` 把該主題的 `"ready"` 改成 `true`
3. 執行 `node tools/validate.js` 檢查選項是否拼錯
4. 把 `sw.js` 的 `V='osce-v1'` 版本號加 1，然後上傳 (v11 now)

## 本機預覽
在此資料夾執行 `python3 -m http.server 8000`，開啟 http://localhost:8000
（不能直接雙擊 index.html，瀏覽器會擋住 JSON 載入與 Service Worker）

## 部署（GitHub Pages）
把整個資料夾內容放進 repo 的一個子資料夾或獨立 repo，啟用 Pages 即可。所有路徑皆為相對路徑，放在子路徑下也能運作。

## iPhone 安裝
用 Safari 開啟網址 → 分享 → 加入主畫面。第一次連線後即可離線使用。
