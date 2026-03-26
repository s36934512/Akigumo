# Create File Extension 模組

## 概述

extension-registry 負責建立副檔名設定（FileExtension），並關聯到既有的檔案分類（FileCategory）。

此模組同樣屬於參考資料維護端點，採同步寫入 PostgreSQL。

## 為什麼同時支援 categoryId 與 categoryCode

API 允許以 categoryId 或 categoryCode 連結分類，目的是兼顧不同呼叫端場景：

- 內部工具通常已有主鍵 ID
- 外部管理端通常只知道業務代碼（code）

同一端點支援兩種識別方式，可避免重複 API 與轉換層。

## API 路徑

- POST /file/extension/create

## 請求與回應

### 請求欄位

- code: 副檔名代碼（必填，唯一）
- mimeType: MIME 類型（選填）
- name: 顯示名稱（選填）
- description: 說明（選填）
- categoryId: 分類 ID（與 categoryCode 擇一必填）
- categoryCode: 分類代碼（與 categoryId 擇一必填）

### 驗證規則

schema 透過 refine 強制 categoryId/categoryCode 至少提供一個，確保關聯目標可被解析。

### 成功回應

- 201: 回傳建立完成的 FileExtension 資料

### 錯誤回應

- 400: 請求格式錯誤，或關聯分類不存在（Prisma P2025）
- 409: 副檔名 code 重複（Prisma P2002）
- 500: 非預期伺服器錯誤

## 設計重點

### 1. 關聯不存在視為 400

categoryId/categoryCode 指向不存在資料時，屬於輸入無效而非系統故障，回傳 400 讓呼叫端可直接修正。

### 2. 建立回應省略關聯欄位

回應 schema 省略 files 與 category，避免寫入端點回傳過重資料，並降低關聯查詢耦合。

### 3. 契約清晰分層

- route.ts: HTTP 契約與回應碼
- schema.ts: 欄位驗證與型別推導
- handler.ts: 寫入與錯誤碼轉換

此分層可讓 OpenAPI、驗證與商業邏輯各自維護。

## 檔案結構

- api/extension-registry.route.ts: OpenAPI 契約
- api/extension-registry.handler.ts: 建立邏輯與錯誤處理
- schema/api.schema.ts: 請求/回應 schema
- index.ts: 模組輸出入口

## 擴充建議

若未來需要依副檔名觸發額外任務（例如快取失效、規則同步），可在不破壞既有契約下新增 outbox 事件流程。