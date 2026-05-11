# 喘息服務時段排班

線上版：

https://kerwinkuo.github.io/respite-scheduler/

## 功能

- 選日期後可直接點選每一小時時段。
- 可用開始時間、結束時間微調，支援 5 分鐘級距。
- 單位換算固定為 2 小時 = 1 單位。
- 已選時段可直接修改或刪除。
- 可標記「調整已申請時段」，填入原申請時間與調整後時間。
- 申請文字會清楚列出原申請、調整後、調整說明，方便個管與長官理解。
- 可用「查班表日期」查詢指定日期的班表，也可以看全部。
- 可產生一行日期、縮排時段的申請文字並複製。

## 檔案

- `index.html`：排班器主畫面。
- `respite-scheduler.html`：同一份排班器頁面，保留相容入口。
- `scheduler-core.js`：時間計算、單位換算、班表查詢、調整文字與申請文字產生邏輯。
- `scheduler-core.test.cjs`：核心邏輯測試。
- `manifest.webmanifest`、`sw.js`、`icon.svg`：PWA 相關檔案。
