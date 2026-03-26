# TODO: 遞迴掃描路徑，建立漫畫清單
# TODO: 判斷檔案類型 (如果是壓縮檔則解壓緩存，如果是資料夾則直接讀取)
# TODO: 自動抓取第一張圖作為封面

# TODO: 建立 SQLite Table (manga_id, title, path, current_page, last_read_time)
# TODO: 寫入漫畫時，比對檔案路徑是否已存在，避免重複匯入
# TODO: 實作搜尋功能 (支援標籤搜尋: "熱血", "完結")

# TODO: 建立緩存機制 (將常用的圖片緩存在 Temp，加速下次讀取)
# TODO: 實作分頁讀取 (每次只回傳該章節的圖片 URL 清單)

# TODO: 監聽捲軸位置，快到邊界時載入下一頁
# TODO: 實作閱讀進度紀錄 (每翻一頁就呼叫 API 同步進度)
# TODO: 製作全螢幕切換功能

了解。你已接收完整的「全量快照 + SSE 增量 patch」两阶段同步方案。

已交付内容摘要：

✅ 后端 /api/v1/index/bootstrap API（返回全量 IndexEntry[]）
✅ 后端 INDEX_PATCH SSE 事件类型（3种操作：UPSERT/PATCH/DELETE）
✅ 前端 IndexSyncService（bootstrap + patch apply）
✅ 上传页集成（自动同步 + 即时显示）
✅ 文件流程事件关联（上传开始/完成时推送增量）
关键特性：

前端仅初始化一次全量（降低首屏延迟）
此后全部增量更新仅包含变化字段（节省带宽）
同一 notifyUploadId 复用於 FILE_ID_ASSIGNED、PROGRESS、INDEX_PATCH，单一 SSE 连接
metadata 可扩展（根据 type 存放不同信息）
若后续需要离线感知或断线补差，可加：

本地版本号 + cursor 机制
长连接重连自动补差量
IndexedDB 快取
现在可以启动后端和前端测试完整流程。