1. item-metadata.routes.ts
職責：實體基本資訊管理
負責處理跟「檔案」無關的純文字/純數據資訊。

功能：

POST /：建立一個新的 Item 條目（例如：建立一個空的圖庫紀錄）。

PATCH /:id：修改基本資訊，如「標題 (Title)」、「原名 (Alternative Title)」、「簡介 (Summary)」。

GET /:id：取得該實體的純屬性資料。

核心邏輯： 單純的資料庫 CRUD。

2. item-state.routes.ts
職責：閱覽狀態與統計 (Status & Analytics)
負責記錄用戶與這個 Item 的互動狀態。

功能：

PATCH /:id/progress：更新閱讀進度（例如：看到第幾頁）。

POST /:id/rate：評分或點擊喜愛（Favorite）。

GET /:id/stats：取得閱讀次數、最後閱讀時間等。