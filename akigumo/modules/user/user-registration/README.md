# Create User Module

## 概述

此模組實現非同步使用者建立工作流程。設計重點是在分散式系統中確保資料一致性，同時提供快速的 HTTP 回應。

## 架構概念

### 為什麼是非同步？

使用者建立涉及多個獨立的資料庫：
- **PostgreSQL**：可靠的單一真相來源，ACID 保證
- **Neo4j**：圖形資料庫，用於關係查詢，最終一致性

同步執行會強制 HTTP 端點等待 Neo4j 完成，造成：
- 高延遲回應（Neo4j 寫入較慢）
- 耦合風險（Neo4j 宕機時整個端點故障）
- 擴展性差（連線池限制控制吞吐量）

非同步方案：
- HTTP 返回 201 + traceId（毫秒級）
- 背景處理器負責 Neo4j 同步（最終一致）
- Neo4j 失敗可獨立重試，不影響已建立的使用者

### 兩階段工作流程

```
HTTP Request
    ↓
[1] Transactional Outbox Write
    • 寫入 outbox 表
    • 寫入 workflow_state 表
    • 單一事務（atomicity）
    ↓
HTTP 201 Response (traceId)
    ↓
[2] Event Processor (Async)
    • 讀取 outbox 記錄
    • CREATE_USER → PostgreSQL
    • SYNC_USER → Neo4j
    • 標記完成
```

### 為什麼使用 Outbox Pattern？

避免「at-least-once 語義」下的資料不一致：

| 場景 | 問題 |
|------|-------|
| 無 Outbox | HTTP 成功 → 伺服器崩潰 → 未被處理，任務丟失 |
| 有 Outbox | HTTP 成功 → 伺服器崩潰 → 事件處理器最終會找到孤立任務 |

## 檔案結構

```
user-registration/
├── index.ts                          # 模組入口（註冊 workflow + 載入 processors）
├── README.md                         # 本檔
├── contract.ts                       # 常數和契約定義
└── api/
│   ├── route.ts                      # OpenAPI 端點定義
│   ├── handler.ts                    # HTTP 處理器（寫入 outbox）
│   └── schema.ts                     # API 回應契約
├── core/
│   └── processors.ts                 # Processor 註冊與動作輸入契約
└── machine/
    ├── machine.ts                    # XState 狀態機
    ├── logic.ts                      # 狀態機 action 實作
    └── schema.ts                     # 狀態機 context/event 契約
```

### 核心檔案說明

#### `contract.ts`
定義資料領域模型（Domain Model）的身份：
- `USER_AGGREGATE`: 領域事件的聚合根識別碼
- `USER_CREATE_WORKFLOW_NAME`: 帶版本的工作流程 ID
- `USER_ACTIONS`: 所有使用者動作的定義（CREATE、SYNC）

**為什麼要常數化？**
- 審計日誌和工作流程追蹤依賴這些穩定值
- 重構時代碼改但常數保持一致，歷史記錄仍有意義

#### `machine/` 目錄
XState 狀態機相關實作，將狀態圖、行為與型別拆分。

- `machine.ts`: 定義狀態與轉移
- `logic.ts`: 實作 `handleSaveSuccess` / `handleFailure`
- `schema.ts`: 定義 Machine Context 與 Events

**狀態轉移：**
```
SAVING_USER ─→ CREATE_USER_SUCCESS ─→ SYNCING_USER ─→ SYNC_USER_SUCCESS ─→ SUCCESS
    ↓                                      ↓
    └─ CREATE_USER_FAILURE ─→ FAILED       └─ SYNC_USER_FAILURE ─→ FAILED
```

**為什麼用狀態機？**
- 顯式的狀態防止邏輯錯誤（if-else 地獄）
- 狀態機自動序列化到資料庫（恢復能力）
- 每個轉移可綁定動作（emit 事件、更新上下文）

#### `core/processors.ts`
向事件處理器註冊業務邏輯處理器，並提供 API/Outbox 共用的輸入契約。

```typescript
// CREATE_USER: PostgreSQL 持久化
kernelProcessorsRegistry.register(
    USER_AGGREGATE,
    USER_ACTIONS.CREATE.code,
    { /* ... */ }
);

// SYNC_USER: Neo4j 複製
kernelProcessorsRegistry.register(
    USER_AGGREGATE,
    USER_ACTIONS.SYNC.code,
    { /* ... */ }
);
```

**為什麼分開註冊？**
- 處理器由後臺事件處理器執行（非同步）
- 每個動作有不同的重試策略和錯誤處理
- 便於測試和除錯（單一職責）

#### 契約分層

| 檔案 | 目的 | 用者 |
|------|------|------|
| `api/schema.ts` | 公開 API 回應契約 | 外部客戶端 |
| `core/processors.ts` | CREATE/SYNC 動作輸入契約 | 事件處理器 |
| `machine/schema.ts` | 工作流程 context/event 契約 | 狀態機 |

**為什麼分層？**
- API 契約必須穩定（向後相容）
- 處理器契約可隨內部流程演進
- 狀態機契約專注於可恢復執行（rehydration）

#### `api/` 目錄

**`route.ts`**
- 定義 OpenAPI 規格（由 @hono/zod-openapi 自動生成文件）
- 與具體實現分離（便於多個實現共用同一合約）

**`handler.ts`**
- 實現業務邏輯
- 應用 Transactional Outbox Pattern

## 使用流程

### 基本請求

```bash
curl -X POST http://localhost:8080/user/create \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Alice Chen",
      "status": "ACTIVE",
      "redundancy": { "source": "admin-panel" }
    }
  ]'
```

### 立即回應

```json
{
  "success": true,
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 後續輪詢（偽代碼）

```typescript
// 客戶端使用 traceId 輪詢工作流程狀態
const status = await fetch(
  `/workflow/status/${traceId}`
);

// 當 status === 'SUCCESS' 時，使用者已建立到兩個資料庫
```

## 請求驗證

### CreateUserRequestSchema

| 欄位 | 類型 | 必須 | 驗證 |
|------|------|------|------|
| `name` | string | ✓ | `min(1)` - 禁止空字串 |
| `status` | enum | × | 省略時使用資料庫預設值 |
| `redundancy` | object | × | 任意鍵值對，用於擴充 |

**為什麼 status 可選？**
- 資料庫有預設值（唯一真相來源）
- API 不應硬編碼業務邏輯
- 便於未來修改預設狀態而無需 API 版本升級

## 內部契約

### CREATE_USER 動作

**輸入** → `CreateUserInputSchema`
```typescript
{ name: string, status?: UserStatus, redundancy?: object }
or
[{ name: string, status?: UserStatus, redundancy?: object }, ...]
```

**處理器邏輯**
```typescript
await prisma.user.createManyAndReturn({ data })
```

**輸出** → 已建立使用者陣列（供狀態機提取 userIds）
```typescript
[{ id, name, redundancy }, ...]
```

**為什麼只返回 id, name, redundancy？**
- 狀態機只需這些欄位驅動下一階段
- 最小化 workflow_state 表大小
- 完整使用者資料應通過 `/user/:id` 查詢

### SYNC_USER 動作

**輸入** → UUID 陣列（由狀態機 `nextTask.payload` 提供）
```typescript
[uuid, uuid, ...]  // 使用者 ID 清單
```

**Neo4j 查詢**
```cypher
UNWIND $data AS id
MERGE (u: User { id: id })
ON CREATE SET u.createdTime = datetime()
RETURN count(u) AS syncedCount
```

**輸出**
```typescript
{ synced: 3 }  // 同步節點數
```

**為什麼使用 MERGE？**
- 冪等性：重試不會建立重複節點
- `ON CREATE` 只在首次建立時設定時間戳
- 安全處理孤立任務（伺服器崩潰後的恢復）

## 錯誤處理

### 第一階段失敗（CREATE_USER）

```
SAVING_USER → CREATE_USER_FAILURE → FAILED
```

使用者未建立到任何資料庫，可安全重試。

### 第二階段失敗（SYNC_USER）

```
SYNCING_USER → SYNC_USER_FAILURE → FAILED
```

使用者已在 PostgreSQL，但 Neo4j 同步失敗。

**恢復策略：**
- 事件處理器配置重試政策（exponential backoff）
- 操作員可通過 UI 手動重試工作流程
- 不會造成 PostgreSQL 中的重複（idempotent）

## 監控

### 關鍵指標

1. **traceId 追蹤**
   - 查詢 `workflow_state` 表找到其 correlationId
   - 檢視狀態轉移和錯誤訊息

2. **工作流程卡住檢測**
   ```sql
   SELECT * FROM workflow_state
   WHERE workflow_id = 'USER_CREATE_FLOW_V1'
   AND status IN ('SAVING', 'SYNCING')
   AND updated_at < NOW() - INTERVAL '1 hour';
   ```

3. **Outbox 堰積**
   ```sql
   SELECT COUNT(*) FROM outbox
   WHERE workflow_id = 'USER_CREATE_FLOW_V1'
   AND status = 'PENDING';
   ```

## 擴展模式

### 新增動作

若要在使用者建立工作流程中新增階段（如 email 驗証）：

1. 新增常數到 `contract.ts`
   ```typescript
   SEND_EMAIL: {
       code: 'SEND_EMAIL_USER',
       name: '寄送驗証信',
       category: ActionCategory.NOTIFICATION,
       severity: Severity.MEDIUM,
   }
   ```

2. 在 `machine/machine.ts` 新增狀態
   ```typescript
   SENDING_EMAIL: {
       on: {
           SEND_EMAIL_SUCCESS: { target: 'SUCCESS', ... },
           SEND_EMAIL_FAILED: { target: 'FAILED', ... }
       }
   }
   ```

3. 在 `core/processors.ts` 新增處理器
   ```typescript
   kernelProcessorsRegistry.register(
       USER_AGGREGATE,
       USER_ACTIONS.SEND_EMAIL.code,
       { /* ... */ }
   );
   ```

### 版本控制

為了在部署期間運行多個工作流程版本：

- 保留舊魔法值：`USER_CREATE_FLOW_V1`
- 建立新常數：`USER_CREATE_FLOW_V2`
- 新端點使用 V2，舊任務持續使用 V1 執行
- 流量逐漸遷移

## 參考

- [Transactional Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [XState Documentation](https://xstate.js.org/)
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- 相關項目指令：[/workspaces/kpptrproject/.github/copilot-instructions.md](.github/copilot-instructions.md)
