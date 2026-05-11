# 喘息服務時段排班

線上版：

https://kerwinkuo.github.io/nursing-journal/

## 功能

- 選日期後可直接點選每一小時時段。
- 可用開始時間、結束時間微調，支援 15 分鐘級距。
- 已選時段可直接修改或刪除。
- 可用「查班表日期」查詢指定日期的班表，也可以看全部。
- 可產生一行日期、縮排時段的申請文字並複製。

## 檔案

- `index.html`：GitHub Pages 首頁，導向排班器。
- `respite-scheduler.html`：排班器主畫面。
- `scheduler-core.js`：時間計算、班表查詢、申請文字產生邏輯。
- `scheduler-core.test.cjs`：核心邏輯測試。
- `care-journal.html`：原本照護紀錄頁面備份。
- `manifest.webmanifest`、`sw.js`、`icon.svg`：PWA 相關檔案。
