import Redis from 'ioredis';
import { Worker } from 'bullmq';
import DatabaseCacheRepository from '@core/database-cache.repository';
import { QUEUE_NAMES } from '@shared/queues/constants';
import NeoSyncOrchestrator from './neo-sync.orchestrator';
import NeoSyncProcessor from './neo-sync.processor';
import { RESOLVER } from 'awilix';

// 1. 【Neo4j 寫入】:
//    - 建立 (User)-[:UPLOADED]->(File) 的關係節點。
//    - 如果有標籤或分類，在此處建立關聯線。

// 2. 【清理與審計】:
//    - 將 Prisma 中的 Audit Log 狀態更新為 'COMPLETED'。

// 3. 【後續動作】: (可選)
//    - 發送通知、清理暫存。

export class NeoSyncTriggerWorker {
    static [RESOLVER] = {};
    private worker: Worker;

    constructor(
        { connection, neoSyncOrchestrator }: { connection: Redis; neoSyncOrchestrator: NeoSyncOrchestrator }
    ) {
        this.worker = new Worker(
            QUEUE_NAMES.NEO_SYNC_PULSE,
            async (job) => {
                const { type, fileId } = job.data;
                await neoSyncOrchestrator.executeSync(type);
            },
            { connection }
        );
    }
    getWorker() {
        return this.worker;
    }
}

export class NeoSyncSummaryWorker {
    static [RESOLVER] = {};
    private worker: Worker;

    constructor(
        { connection, databaseCacheRepository }: { connection: Redis; databaseCacheRepository: DatabaseCacheRepository }
    ) {
        this.worker = new Worker(
            QUEUE_NAMES.NEO_SYNC_SUMMARY,
            async (job) => {
                const { namespace, ids } = job.data;
                if (!ids || ids.length === 0) return;
                await databaseCacheRepository.deleteBatch(ids.map((id: string) => ({ namespace, key: id })));
            },
            { connection }
        );
    }
    getWorker() {
        return this.worker;
    }
}

export class NeoSyncWorkerOld {
    static [RESOLVER] = {};
    private worker: Worker;

    constructor(
        { connection, neoSyncProcessor }: { connection: Redis; neoSyncProcessor: NeoSyncProcessor }
    ) {
        this.worker = new Worker(
            QUEUE_NAMES.NEO_SYNC,
            async (job) => {
                if (!job.data || !job.data.type) return;
                const { chunk, type } = job.data;
                await neoSyncProcessor.processSync(type, chunk);
            },
            {
                connection,
                concurrency: 5,
                lockDuration: 30000,
            }
        );
    }
    getWorker() {
        return this.worker;
    }
}

export class NeoSyncWorker {
    static [RESOLVER] = {};
    private worker: Worker;

    constructor(
        { connection, databaseCacheRepository }: { connection: Redis; databaseCacheRepository: DatabaseCacheRepository }
    ) {
        this.worker = new Worker(
            QUEUE_NAMES.NEO_SYNC,
            async (job) => {
                if (!job.data || !job.data.type) return;
                const { type } = job.data;
                // 取得當前 Job 的 namespace
                const namespace = `${'outbox:neo4j:'}${type}`;
                // 取得所有待處理的 Outbox IDs (version: 0)
                const outboxTasks = await databaseCacheRepository.listByNamespace({
                    namespace,
                    version: 0,
                    limit: 500,
                });
                if (!outboxTasks?.length) return;
                const ids = outboxTasks.map(t => t.key);
                // 處理所有待處理的 Outbox IDs
                // 這裡可依需求批次處理
                console.log(`[NeoSyncWorker] Batch Outbox IDs:`, ids);
                // TODO: 依需求執行 Neo4j 同步、審計、清理等
            },
            {
                connection,
                concurrency: 5,
                lockDuration: 30000,
            }
        );
    }
    getWorker() {
        return this.worker;
    }
}