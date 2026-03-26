1. upload-sessions.ts (或 uploads.ts)
職責：上傳的門衛與編排
這個路由不處理實際的檔案位元組（Byte），而是處理上傳的「意圖」。

功能：

POST /：初始化上傳（取得 uploadId）。

權限檢查： 檢查這個人能不能上傳檔案、空間夠不夠。

掃描/預處理： 接收前端關於檔案的 Metadata（如檔名、預期大小）。

調用： file-upload.orchestrator.ts

2. tus.ts
職責：斷點續傳協議處理
這是一個專門處理 TUS 協議 的端點。它通常是標準化的，與業務邏輯解耦。

功能：

PATCH /:uploadId：接收分塊數據。

HEAD /:uploadId：回傳目前已上傳的進度（讓前端斷點續傳）。

備註： 當 TUS 完成最後一塊上傳時，它會觸發 Hook 通知 Orchestrator 去做後續動作（算 Checksum、建 Neo4j 關係）。

3. file-manager.routes.ts
職責：檔案的 CRUD 與中繼資料管理
這是前端管理後台最常使用的 API。

功能：

GET /：列出所有檔案（支援分頁、搜尋、標籤篩選）。

GET /:id：取得單一檔案的詳細資訊（標籤、上傳時間、解析度）。

PATCH /:id：編輯檔名、重新分類、修改標籤。

DELETE /:id：刪除檔案（觸發 Repo 的軟/硬刪除）。

調用： file-query.service.ts

4. files-events.ts (或 files-stream.ts)
職責：即時狀態更新 (Optional)
因為你的檔案處理（PDF 轉圖、Zip 封面提取）是異步的，前端需要知道進度。

功能：

使用 Server-Sent Events (SSE) 或 WebSocket。

推播：「檔案 A 的封面已產生」、「檔案 B 處理失敗」等通知。

5. content.ts (或 delivery.ts) —— 最重要的部分
職責：安全地將內容噴給前端
這就是我們討論的 img src 指向的地方。它不回傳 JSON，而是回傳 檔案流 (Stream)。

功能：

GET /thumbnail/:id：回傳縮圖（若無縮圖則現場叫 Processor 做）。

GET /view/:id/page/:pageNumber：針對 PDF 或 Zip，回傳特定頁面的圖片。

GET /download/:id：安全下載原檔（檢查權限後執行 res.sendFile）。