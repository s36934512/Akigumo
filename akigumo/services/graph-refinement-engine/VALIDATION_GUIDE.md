# File Graph Refinement - 驗證與測試指南

## 前置準備

確保以下環境已就緒：

```bash
# 1. 確認 Python 環境
python3 --version  # 需要 3.9+

# 2. 安裝依賴
cd /workspaces/kpptrproject
pip3 install -r akigumo/services/graph-refinement-engine/python/requirements.txt

# 3. 確認 Neo4j 可連線
# 3. 確認 Redis 可連線
```

## 快速驗證流程

### 步驟 1：啟動 Python Batch Consumer

在終端 A 中執行：

```bash
cd /workspaces/kpptrproject

# 配置環境變數
export NEO4J_URI="neo4j://localhost:7687"
export NEO4J_USERNAME="neo4j"
export NEO4J_PASSWORD="your_password"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"
export BATCH_SIZE="100"
export BATCH_TIMEOUT_MS="200"

# 啟動 consumer
python3 akigumo/services/graph-refinement-engine/python/batch_consumer.py
```

預期輸出：
```
2024-XX-XX XX:XX:XX INFO batch_consumer - Worker started with micro-batching: batch_size=100 timeout_ms=200 queue=graph_tasks
2024-XX-XX XX:XX:XX INFO batch_consumer - Neo4j schema ensured: File|Item|Entity constraints and indexes
```

### 步驟 2：發送測試任務（終端 B）

```bash
cd /workspaces/kpptrproject

python3 << 'EOF'
import json
import redis
from uuid import uuid4
from datetime import datetime

# 連線 Redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# 建立 10 個帶有 Item 的測試任務
item_id = str(uuid4())
for i in range(10):
    task = {
        "taskVersion": 1,
        "taskType": "UPSERT_FILE_GRAPH",
        "fileId": str(uuid4()),
        "itemId": item_id,  # 所有文件歸屬同一個 Item
        "originalName": f"test_file_{i}.pdf",
        "extension": "pdf",
        "checksum": f"checksum_{i:04d}",
        "physicalPath": f"/tmp/test_{i}.pdf",
        "emittedAt": datetime.utcnow().isoformat(),
    }
    r.rpush("graph_tasks", json.dumps(task))
    print(f"✅ Enqueued task {i+1}/10")

print(f"\n📊 Total tasks in queue: {r.llen('graph_tasks')}")
EOF
```

預期輸出（終端 A）：
```
2024-XX-XX XX:XX:XX INFO batch_consumer - Batch processed: count=10 duration=XXXms avg=XXms/task
```

### 步驟 3：驗證結果在 Neo4j

```bash
# 使用 Neo4j Browser 或 cypher 工具

# 1. 驗證 File 節點已建立
MATCH (f:File) RETURN count(*) as fileCount

# 2. 驗證 Item-[:CONTAINS]->File 關係
MATCH (i:Item {id: "YOUR_ITEM_ID"})-[:CONTAINS]->(f:File)
RETURN count(*) as containsCount

# 3. 驗證 Extension 關係
MATCH (f:File)-[:TYPE]->(e:Ext:Entity)
RETURN count(*) as extensionCount

# 4. 驗證 Ghost 標籤（應為 0，因為檔案存在）
MATCH (f:File:Ghost)
RETURN count(*) as ghostCount
```

預期結果：
```
fileCount = 10
containsCount = 10
extensionCount = 10
ghostCount = 0
```

## 單元測試

### 執行完整測試套件

```bash
cd /workspaces/kpptrproject/akigumo/services/graph-refinement-engine/python

# 設定測試環境
export TEST_NEO4J_URI="neo4j://localhost:7687"
export TEST_NEO4J_USER="neo4j"
export TEST_NEO4J_PASS="password"
export TEST_REDIS_HOST="localhost"
export TEST_REDIS_PORT="6379"
export TEST_REDIS_DB="1"  # 使用不同 DB 避免污染

# 執行測試
pytest test_batch_consumer.py -v -s
```

### 測試覆蓋範圍

- ✅ Neo4j 與 Redis 連線驗證
- ✅ 任務入隊（Enqueue）與出隊（Dequeue）
- ✅ File 節點的幂等 MERGE
- ✅ Item-[:CONTAINS]->File 關係
- ✅ 批量重複偵測（Duplicate Detection）
- ✅ DERIVED_FROM 譜系關係
- ✅ 性能基準測試

## 效能基準測試

### 預期效能指標

| 批次大小 | 執行時間 | 單任務時間 | 吞吐量 |
|---------|---------|----------|-------|
| 10 | 15-20ms | 1.5-2ms | ~500 tasks/sec |
| 100 | 80-120ms | 0.8-1.2ms | ~830-1250 tasks/sec |
| 200 | 150-250ms | 0.75-1.25ms | ~800-1333 tasks/sec |

### 執行基準測試

```bash
python3 << 'EOF'
import time
import redis
import json
from uuid import uuid4
from datetime import datetime
from cypher_mutations import GraphMutations
from neo4j import GraphDatabase

driver = GraphDatabase.driver(
    "neo4j://localhost:7687",
    auth=("neo4j", "password"),
    encrypted=False
)

# 清空測試資料
with driver.session() as session:
    session.run("MATCH (f:File) WHERE f.name LIKE 'bench_%' DELETE f")

# 生成 100 個任務
tasks = []
item_id = str(uuid4())
for i in range(100):
    tasks.append({
        "taskVersion": 1,
        "taskType": "UPSERT_FILE_GRAPH",
        "fileId": str(uuid4()),
        "itemId": item_id,
        "originalName": f"bench_{i:04d}.pdf",
        "extension": "pdf",
        "checksum": f"bench_checksum_{i:04d}",
        "physicalPath": "/tmp/bench.pdf",
        "emittedAt": datetime.utcnow().isoformat(),
    })

# 準備 Upsert 資料
upsert_data = [
    {
        "fileId": task["fileId"],
        "originalName": task["originalName"],
        "checksum": task["checksum"],
        "storageStatus": "on_disk",
        "extension": "pdf",
    }
    for task in tasks
]

# 執行並計時
start = time.time()
with driver.session() as session:
    session.execute_write(
        GraphMutations.batch_upsert_files_and_extensions,
        upsert_data,
    )
duration_ms = (time.time() - start) * 1000

print(f"✅ Batch of {len(tasks)} completed in {duration_ms:.1f}ms")
print(f"   = {duration_ms/len(tasks):.2f}ms per task")
print(f"   = {len(tasks)/(duration_ms/1000):.0f} tasks/sec")

driver.close()
EOF
```

## 完整端到端流程驗證

### 場景：創建衍生檔案鏈

```python
python3 << 'EOF'
import json
import redis
from uuid import uuid4
from datetime import datetime

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# 原始檔案
original_id = str(uuid4())
item_id = str(uuid4())

tasks = [
    {
        "taskVersion": 1,
        "taskType": "UPSERT_FILE_GRAPH",
        "fileId": original_id,
        "itemId": item_id,
        "originalName": "original.pdf",
        "extension": "pdf",
        "checksum": "original_checksum",
    },
    # 衍生檔案 1
    {
        "taskVersion": 1,
        "taskType": "UPSERT_FILE_GRAPH",
        "fileId": str(uuid4()),
        "itemId": item_id,
        "originalName": "derived_v1.pdf",
        "extension": "pdf",
        "checksum": "derived_v1_checksum",
        "sourceFileId": original_id,
        "lineageRelation": "DERIVED_FROM",
    },
    # 衍生檔案 2
    {
        "taskVersion": 1,
        "taskType": "UPSERT_FILE_GRAPH",
        "fileId": str(uuid4()),
        "itemId": item_id,
        "originalName": "derived_v2.pdf",
        "extension": "pdf",
        "checksum": "derived_v2_checksum",
        "sourceFileId": original_id,
        "lineageRelation": "VERSION_OF",
        "rank": 2,
    },
]

for task in tasks:
    r.rpush("graph_tasks", json.dumps(task))

print(f"✅ Enqueued {len(tasks)} tasks with lineage")
EOF
```

驗證查詢：
```cypher
# 查看完整譜系
MATCH (f:File)-[r:DERIVED_FROM|VERSION_OF*0..]->(origin:File)
RETURN f.originalName, TYPE(r), origin.originalName
```

## 故障排除

### 問題 1：Batch Consumer 停止運行

**症狀**：Python worker 立即結束

**檢查清單**：
```bash
# 1. 確認環境變數
echo $NEO4J_URI
echo $REDIS_HOST

# 2. 測試連線
python3 -c "from neo4j import GraphDatabase; d=GraphDatabase.driver('neo4j://localhost:7687', auth=('neo4j','pass')); print(d)"

# 3. 查看完整錯誤日誌
LOG_LEVEL=DEBUG python3 batch_consumer.py
```

### 問題 2：任務入隊但未處理

**症狀**：`redis.llen('graph_tasks')` 保持不變

**檢查清單**：
```bash
# 1. 確認 Consumer 已啟動（檢查終端輸出）
# 2. 確認無大量錯誤日誌
# 3. 檢查任務格式
redis-cli LINDEX graph_tasks 0  # 查看第一個任務
```

### 問題 3：Neo4j 約束衝突

**症狀**：`Node with label 'X' and property 'id:Y' already exists`

**解決**：
```bash
# 清空測試資料
python3 << 'EOF'
from neo4j import GraphDatabase
driver = GraphDatabase.driver("neo4j://localhost:7687", auth=("neo4j", "password"), encrypted=False)
with driver.session() as session:
    session.run("MATCH (n:File|Item|Entity) DELETE n")
print("✅ Cleaned up test data")
driver.close()
EOF
```

## 性能調優建議

### 高吞吐量配置（預計 1000+ tasks/sec）

```bash
export BATCH_SIZE=200          # 增大批次
export BATCH_TIMEOUT_MS=500    # 容許更長延遲
export NEO4J_POOL_SIZE=10      # 增加連線池
```

### 低延遲配置（預計 <100ms/task）

```bash
export BATCH_SIZE=50
export BATCH_TIMEOUT_MS=100
export NEO4J_POOL_SIZE=5
```

## 下一步

- [ ] 集成到 CI/CD 管道
- [ ] 添加 Prometheus 效能指標
- [ ] 實施死信佇列（Dead Letter Queue）
- [ ] 添加分佈式追蹤（Distributed Tracing）
