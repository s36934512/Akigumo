# Akigumo 模組總覽

## 模組定位

akigumo 是以 Outbox + Workflow 為核心的後端執行層，負責：

- 受理 API 請求（Hono + OpenAPI）
- 將業務任務轉為可重試的背景工作（Outbox + BullMQ）
- 透過狀態機管理多階段流程（XState）
- 進行跨資料儲存同步（PostgreSQL + Neo4j）

## 啟動入口

- 入口：`akigumo/index.ts`
- 核心啟動：`kernel.bootstrap()`

啟動順序：

1. 啟動 workflow engine（訂閱回饋）
2. 啟動 worker（執行 processor）
3. 啟動 PostgreSQL NOTIFY listener
4. 啟動 outbox polling fallback

## 核心資料流

```text
API Handler
  -> 寫入 outbox + workflow_state（同一 transaction）
  -> Dispatcher 將任務送入 BullMQ
  -> Worker 執行 processor
  -> 回饋事件寫入 Redis Stream
  -> Workflow Engine 套用狀態機轉移並持久化快照
  -> 若有 nextTask，回寫下一筆 outbox
  -> 直到 SUCCESS / FAILED
```

## 目錄與責任

- `db/`: Prisma、Neo4j、Redis、logger、cache
- `delivery/`: SSE、TUS 傳輸介面
- `kernel/`: dispatcher、worker、workflow engine、registry
- `modules/`: 依 Vertical Slice 劃分的業務模組
- `shared/`: 跨切片可重用 schema 與 utilities

## 主要切片

- `modules/entity/tag-provisioning`
- `modules/item/item-provisioning`
- `modules/user/user-registration`
- `modules/file/file-receiver`
- `modules/file/file-integration`
- `modules/file/category-registry`
- `modules/file/extension-registry`

## 文件索引

- `AI_CONTEXT.md`：AI onboarding 與架構重點
- 各切片 `README.md`：切片流程、契約、擴充模式

## 維護規範

- 程式碼註解使用 English
- README 文件使用繁體中文
- 優先描述 Why，再描述 What
- 遵循 Vertical Slice 邊界，避免不必要跨切片耦合
