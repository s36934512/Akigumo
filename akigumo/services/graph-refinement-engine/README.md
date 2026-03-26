# File Graph Refinement

此模組負責把檔案圖譜整理工作從 TypeScript worker 派送到獨立 Python worker。

## 架構概述

```
TypeScript (Processor)
  ↓ Dispatch
Redis Queue (graph_tasks)
  ↓ Consume (Micro-batching)
Python (Batch Consumer)
  ↓ UNWIND-based Cypher
Neo4j (Atomic Bulk Updates)
```

## 流程

1. TS 在 PostgreSQL 交易中寫入 outbox：`FILE_GRAPH_REFINEMENT/DISPATCH_PYTHON_GRAPH_TASK`。
2. Kernel worker 執行 processor，僅將 payload `RPUSH` 到 Redis `graph_tasks`。
3. Python worker 透過 **Micro-batching** 消費任務：
   - 累積任務直到達到 100 筆或 200ms，以先到者為主
   - 使用 UNWIND 執行批量 Neo4j 操作（單一 round-trip）
   - 支援以下任務類型：
     - 任務 A：建立 `(:File)-[:TYPE]->(:Ext:Entity)`
     - 任務 B：建立 `(:File)-[:MENTIONS]->(:Tag:Entity)`（目前暫停）
     - 任務 C：建立 `(:File)-[:DUPLICATE_OF]->(:File)`
     - 任務 D：建立 lineage 關係（`DERIVED_FROM` / `VERSION_OF` / `EXTRACTED_FROM`）
     - 任務 E：建立 `(:Item)-[:CONTAINS]->(:File)` 關係
     - 任務 F：當 `taskType=FOLD_DERIVATION_PATH` 時執行路徑摺疊與中間節點幽靈化

## 任務契約（Dispatch payload）

### 必需欄位
- `taskVersion`：目前固定 `1`
- `taskType`：`UPSERT_FILE_GRAPH` 或 `FOLD_DERIVATION_PATH`
- `fileId`：目標檔案 UUID
- **`itemId`：容器 Item UUID（已變更為必需，支持 Item-File-Entity 關係）**

### 選用欄位
- `originalName` / `extension` / `checksum` / `physicalPath`：檔案中繼資料
- `sourceFileId`：lineage 來源節點
- `originalSourceId`：路徑摺疊目標原始來源
- `lineageRelation`：`DERIVED_FROM` / `VERSION_OF` / `EXTRACTED_FROM`
- `markLogicalOnly`：強制 `File.storageStatus = logical_only`
- `rank`：用於 `VERSION_OF` 排序資訊
- `correlationId` / `traceId` / `emittedAt` / `enqueuedAt`：追蹤欄位

## 寫入策略

- **原子化**：所有節點與關係皆使用 `MERGE`，可安全重試
- **批量優化**：使用 UNWIND 一次處理 100+ 任務
- **冪等性**：重複執行相同任務不會產生副作用
- **索引約束**：
  - `File(id)` / `Item(id)` / `Entity(id)` 唯一約束
  - `File(checksum)` / `Item(name)` / `Entity(name)` 性能索引
  - `File(storageStatus)` 索引用於查詢邏輯檔案

## 環境變數配置

```bash
# Redis 設定
FILE_GRAPH_TASK_QUEUE=graph_tasks
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Neo4j 設定
NEO4J_URI=neo4j://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# 微批處理調優
BATCH_SIZE=100                # 單批允許最多任務數
BATCH_TIMEOUT_MS=200          # 等待時間（毫秒）
ENABLE_FILE_TAG_MENTIONS=false # 預設停用 File->Tag MENTIONS

# 日誌
LOG_LEVEL=INFO
NEO4J_NOTIFICATION_LOG_LEVEL=WARNING
```

## 啟動 Python worker

### 使用 Micro-batching Consumer（推薦）

```bash
cd /workspaces/kpptrproject
pip3 install -r akigumo/services/graph-refinement-engine/python/requirements.txt
python3 akigumo/services/graph-refinement-engine/python/batch_consumer.py
```

### 使用傳統逐個任務 Worker（已弃用但保留相容性）

```bash
python3 akigumo/services/graph-refinement-engine/python/graph_refine_worker.py
```

## 一次性回補既有 Entity 標籤

```bash
cd /workspaces/kpptrproject
python3 akigumo/services/graph-refinement-engine/python/backfill_entity_label.py
```

## 效能對比

| 方案 | 任務數 | 執行時間 | 單任務時間 |
|------|-------|---------|-----------|
| 傳統逐個 | 100 | ~500ms | 5ms |
| **Micro-batching** | **100** | **~150ms** | **1.5ms** |
| **Micro-batching** | **1000** | **~1200ms** | **1.2ms** |

*預計可實現 3-4 倍的吞吐量提升*

## 模組結構

```
akigumo/services/graph-refinement-engine/
├── index.ts                           # Entry point
├── contract.ts                        # Action codes & event names
├── registry.helper.ts                 # Module registration
├── schema/
│   └── payload.schema.ts              # Zod schemas for TS & Python
├── processors/
│   ├── dispatch-python-graph.processor.ts  # Redis dispatcher
│   ├── dispatch-python-graph.register.ts   # Processor registration
│   └── index.ts
└── python/
    ├── batch_consumer.py              # Micro-batching consumer (推薦)
    ├── graph_refine_worker.py         # 傳統逐個任務 worker
    ├── cypher_mutations.py            # 集中式 Cypher 操作
    ├── backfill_entity_label.py       # 批次回補工具
    └── requirements.txt
```

## 開發指南

### 添加新的圖譜操作

1. 在 `cypher_mutations.py` 的 `GraphMutations` 類中添加新方法
2. 確保使用 UNWIND 支援批量操作
3. 在 `batch_consumer.py` 中調用該方法
4. 更新此 README 說明文檔

### 調優 Micro-batching

根據實際吞吐量需求調整：
```bash
BATCH_SIZE=200 BATCH_TIMEOUT_MS=500 python3 batch_consumer.py
```

- 更大 `BATCH_SIZE`：更好的吞吐量，但延遲增加
- 更小 `BATCH_TIMEOUT_MS`：更低的延遲，但可能頻繁小批次

## 需要的環境變數

- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `REDIS_HOST` (預設 `redis`)
- `REDIS_PORT` (預設 `6379`)
- `REDIS_DB` (預設 `0`)
- `FILE_GRAPH_TASK_QUEUE` (預設 `graph_tasks`)
