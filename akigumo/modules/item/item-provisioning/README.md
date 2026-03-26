# Create Item Module

## 概述

此模組實作非同步項目建立工作流程，目標是在多資料庫環境下兼顧快速回應、可重試性與資料一致性。

## 架構概念

### 為什麼是非同步？

Item 建立涉及兩個資料存放層：
- PostgreSQL：主要寫入來源（source of truth）
- Neo4j：關係查詢與圖同步（eventual consistency）

若在單次 HTTP 請求中同步完成兩邊寫入，常見問題是：
- API 延遲上升，尖峰時吞吐下降
- 任一外部系統抖動會放大為端點失敗
- 部分成功（PG 成功、Neo4j 失敗）難以恢復

非同步方案：
- HTTP 快速回傳 `201 + traceId`
- 背景處理器執行 `CREATE_ITEM` 與 `SYNC_ITEM`
- Neo4j 失敗可獨立重試，不回捲已成功的 PostgreSQL 寫入

### 兩階段工作流程

```text
HTTP Request
		↓
[1] Transactional Outbox Write
		• 寫入 outbox
		• 寫入 workflow_state
		• 同一 transaction 提交
		↓
HTTP 201 Response (traceId)
		↓
[2] Event Processor (Async)
		• CREATE_ITEM → PostgreSQL
		• SYNC_ITEM → Neo4j
		• 狀態機進入 SUCCESS 或 FAILED
```

### 為什麼使用 Outbox Pattern？

Outbox 主要解決 at-least-once 處理語義下的任務遺失問題：

| 場景 | 問題 |
|------|------|
| 無 Outbox | HTTP 成功後服務崩潰，背景任務可能遺失 |
| 有 Outbox | HTTP 成功後即使崩潰，處理器仍可回收待處理任務 |

## 檔案結構

```text
item-provisioning/
├── index.ts                  # 模組匯出點
├── README.md                 # 本檔
├── workflow.init.ts          # 啟動時註冊 workflow
├── contract.ts               # Aggregate / action / event 常數
├── machine.ts                # XState 狀態機
├── actions.ts                # Processor 註冊（CREATE / SYNC）
├── schema/
│   ├── index.ts              # Schema 匯出
│   ├── api.schema.ts         # HTTP 請求/回應契約
│   ├── payload.schema.ts     # 內部動作 payload/result 契約
│   └── machine.schema.ts     # 狀態機 context/events 契約
└── api/
		├── route.ts              # OpenAPI route 定義
		└── handler.ts            # HTTP handler + outbox 寫入
```

### 核心檔案說明

#### `contract.ts`
定義 ITEM 聚合的穩定識別：
- `ITEM_AGGREGATE`
- `ITEM_CREATE_WORKFLOW_NAME`
- `ITEM_ACTIONS`（`CREATE_ITEM`、`SYNC_ITEM`）
- `ItemEventCode`（例如 `CREATE_ITEM_SUCCESS`、`CREATE_ITEM_FAILURE`）

**為什麼集中在同一檔？**
- 避免 machine、processor、engine 事件名稱漂移
- 讓審計與追蹤依賴穩定常數，而不是散落字串

#### `machine.ts`
XState 狀態機，負責兩階段轉移與錯誤收斂。

**狀態轉移：**
```text
SAVING_ITEM ─→ CREATE_ITEM_SUCCESS ─→ SYNCING_ITEM ─→ SYNC_ITEM_SUCCESS ─→ SUCCESS
		↓                                      ↓
		└─ CREATE_ITEM_FAILURE ─→ FAILED       └─ SYNC_ITEM_FAILURE ─→ FAILED
```

**設計重點：**
- `handleSaveSuccess` 只抽取 `itemIds`，減少 context 負載
- 第一階段成功後狀態為 `SYNCING`，避免過早標記 `SUCCESS`
- `'*'` wildcard 將未知事件收斂到 `FAILED`，降低卡死風險

#### `actions.ts`
向 `kernelProcessorsRegistry` 註冊動作執行器：

```typescript
// CREATE_ITEM: PostgreSQL 寫入
kernelProcessorsRegistry.register<CreateItemPayload>(...)

// SYNC_ITEM: Neo4j 同步
kernelProcessorsRegistry.register<SyncItemPayload>(...)
```

**設計重點：**
- `CREATE_ITEM` 先用 `CreateItemPayloadSchema.parse(data)` 驗證 payload
- `SYNC_ITEM` 只接收 UUID 陣列，保持任務小且可重試
- Neo4j 使用 `MERGE`，重試不會建立重複節點

#### `api/route.ts` 與 `api/handler.ts`

**`route.ts`**
- 對外使用 `CreateItemInputSchema`（支援單筆與批次）
- 回應統一 `ResponseSchema`

**`handler.ts`**
- 將單筆轉為陣列後寫入 outbox
- outbox 與 workflow_state 以同一 transaction 寫入
- 回傳 `traceId` 給客戶端追蹤流程

## 使用流程

### 基本請求（批次）

```bash
curl -X POST http://localhost:8080/item/create \
	-H "Content-Type: application/json" \
	-d '[
		{
			"name": "我的第一個作品",
			"description": "這是一個測試作品項目",
			"metadata": { "source": "admin-panel" },
			"type": "WORK",
			"status": "ACTIVE"
		}
	]'
```

### 基本請求（單筆）

```bash
curl -X POST http://localhost:8080/item/create \
	-H "Content-Type: application/json" \
	-d '{
		"name": "單筆建立",
		"type": "WORK",
		"status": "ACTIVE"
	}'
```

### 立即回應

```json
{
	"success": true,
	"traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 請求驗證

### CreateItemRequestSchema

| 欄位 | 類型 | 必填 | 驗證 |
|------|------|------|------|
| `name` | string | ✓ | `min(1)` |
| `description` | string | × | 選填文字描述 |
| `metadata` | object | × | 任意鍵值對 |
| `type` | enum(ItemType) | ✓ | 必須合法 enum |
| `status` | enum(ItemStatus) | ✓ | 必須合法 enum |
| `publishedTime` | date | × | 允許 ISO 字串 coercion |

### CreateItemInputSchema

`CreateItemInputSchema` 是 union：

```typescript
CreateItemRequestSchema | CreateItemBatchRequestSchema
```

讓呼叫端可依場景選擇單筆或批次而不需兩個端點。

## 內部契約

### CREATE_ITEM 動作

**輸入** → `CreateItemPayload`
```typescript
[{ name, description?, metadata?, type, status, publishedTime? }, ...]
```

**輸出** → `CreateItemResult[]`
```typescript
[{ id, name, metadata }, ...]
```

### SYNC_ITEM 動作

**輸入** → `SyncItemPayload`
```typescript
[uuid, uuid, ...]
```

**輸出** → `SyncItemResult`
```typescript
3 // 成功 merge 的節點數
```

## 錯誤處理

### 第一階段失敗（CREATE_ITEM）

```text
SAVING_ITEM → CREATE_ITEM_FAILURE → FAILED
```

PostgreSQL 寫入未成功，流程可安全重試。

### 第二階段失敗（SYNC_ITEM）

```text
SYNCING_ITEM → SYNC_ITEM_FAILURE → FAILED
```

Item 已存在 PostgreSQL，Neo4j 同步失敗。

恢復策略：
- 由事件處理器重試（可搭配 backoff）
- 使用 traceId 查詢失敗狀態並人工介入
- `MERGE` 確保重試時不產生重複圖節點

## 監控建議

1. 追蹤 workflow_state 中 `correlationId = traceId` 的狀態演進
2. 監控長時間停留在 `SAVING` 或 `SYNCING` 的工作流程
3. 監控 outbox `PENDING` 堆積量，檢查事件處理器是否延遲

## 擴展模式

若要新增 item 建立後的額外階段（例如索引或通知）：

1. 在 `contract.ts` 新增 action
2. 在 `machine.ts` 新增狀態與轉移（含 `*_SUCCESS` / `*_FAILURE`）
3. 在 `actions.ts` 註冊 processor
4. 視需求擴充 `schema/payload.schema.ts` 與 `schema/machine.schema.ts`

此模式可維持 Vertical Slice 封裝，降低跨模組耦合與事件命名漂移。