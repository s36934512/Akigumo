1. explorer-nav.routes.ts
職責：導航與目錄結構 (Navigation)
負責處理用戶在 UI 上看到的「資料夾結構」或「圖庫清單」。

功能：

GET /list/:folderId?：取得特定目錄下的所有內容（包括子目錄與 Item）。

GET /breadcrumbs/:id：取得路徑導覽（例如：首頁 > 漫畫 > 日系）。

POST /search：跨目錄的綜合搜尋（整合檔案標籤與 Item 標題）。

核心邏輯： 查詢 Neo4j 的 [:CONTAINS] 關係。

2. item-bridge.routes.ts
職責：Item 與 File 的聯姻 (Relationship Management)
當用戶想把一個檔案歸類到某個 Item，或者想查詢某個 Item 的所有詳細檔案時。

功能：

GET /item/:id/details：聚合數據。它會去問 Item 模組基本資訊，再去問 File 模組有哪些檔案，最後包裝成前端需要的「大 JSON」。

POST /link：手動將現有檔案關聯到特定 Item。

POST /unlink：解除關聯（但不刪除檔案）。

核心邏輯： 協調多個 Repository 進行關係建立。

3. collection.routes.ts
職責：虛擬集合與篩選 (Collections)
處理非物理目錄的分類方式，例如「最近閱讀」、「最愛」、「特定標籤」。

功能：

GET /recent：透過查詢 lastAccessed 屬性回傳列表。

GET /favorites：回傳用戶標記收藏的 Items。

GET /by-tags：根據標籤聚合結果。

4. batch-actions.routes.ts
職責：批次處理編排 (Batch Operations)
這是在 Explorer 層級最需要的功能，因為你可以在這裡同時操作多個 Item 與檔案。

功能：

POST /batch-move：一次把多個 Item 移到另一個分類。

POST /batch-tag：一次幫多個檔案加上同一個標籤。

核心邏輯： 呼叫 FileService 與 ItemService 的原子方法進行循環處理。