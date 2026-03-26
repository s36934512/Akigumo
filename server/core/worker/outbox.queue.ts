import { Queue, Worker } from 'bullmq';
import { redis } from '../db/redisClient';
import { processPendingTask } from './outbox.worker';

const OUTBOX_QUEUE_NAME = 'outbox-sync-queue';

export const outboxQueue = new Queue(OUTBOX_QUEUE_NAME, { connection: redis });

const outboxWorker = new Worker(
    OUTBOX_QUEUE_NAME,
    async (job) => {
        console.log(`[Worker] 收到觸發訊號，開始處理 Outbox 任務...`);
        console.log(`[Worker] Job Data:`, job.data);

        await processPendingTask();
    },
    {
        connection: redis,
        concurrency: 1, // 建議設為 1，確保 Outbox 處理順序並避免併發衝突
    }
);

outboxWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} 執行失敗: ${err.message}`);
});
