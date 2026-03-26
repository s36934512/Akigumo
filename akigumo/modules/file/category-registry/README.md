# Create File Category 模組

## 概述

category-registry 負責建立檔案分類（FileCategory）基礎資料。

此模組定位為「參考資料（reference data）寫入端點」，採用同步寫入 PostgreSQL，不走工作流程狀態機。

## 為什麼是同步寫入

相較於 user-registration/item-provisioning 這類需要跨資料庫同步的流程，分類建立只有單一資料庫寫入，且不涉及後續非同步任務。

因此同步寫入可帶來：

- 較低實作複雜度
- 明確且即時的 API 回應
- 更直觀的錯誤語義（例如代碼重複）

## API 路徑

- POST /file/category/create

## 請求與回應

### 請求欄位

- code: 分類代碼（必填，唯一）
- name: 分類名稱（必填）
- description: 分類描述（選填）

### 成功回應

- 201: 回傳建立完成的 FileCategory 資料

### 錯誤回應

- 400: 請求格式不符合 schema
- 409: code 已存在（Prisma P2002）
- 500: 非預期伺服器錯誤

## 設計重點

### 1. 唯一鍵衝突映射為 409

資料重複不是伺服器當機，而是業務衝突，使用 409 可讓前端清楚區分可修正錯誤與系統錯誤。

### 2. 回應 schema 省略關聯欄位

建立分類時不回傳 extensions 關聯，避免寫入端點因關聯資料膨脹導致不必要的 payload 成本。

### 3. 契約與實作分離

route/schema 與 handler 拆分，讓 OpenAPI、驗證規則、執行邏輯各自演進，降低耦合。

## 檔案結構

- api/category-registry.route.ts: OpenAPI 與回應碼契約
- api/category-registry.handler.ts: 寫入邏輯與錯誤碼映射
- schema/api.schema.ts: 請求/回應資料驗證
- index.ts: 模組輸出入口

## 擴充建議

若未來分類需要審計、事件發布或快取同步，可考慮升級為 outbox + processor 模式，並保留目前 API 契約不變。