import { Queue, QueueEvents } from 'bullmq';
import { QUEUE_NAMES } from './constants';
import { Redis } from 'ioredis';
import { asFunction } from 'awilix';

export function getQueueRegistrations() {
    return {
        // 定義一個內部工廠，確保連線共用
        neoSyncPulseQueue: asFunction(({ connection }: { connection: Redis }) =>
            new Queue(QUEUE_NAMES.NEO_SYNC_PULSE, { connection })
        ).singleton(),

        neoSyncSummaryQueue: asFunction(({ connection }: { connection: Redis }) =>
            new Queue(QUEUE_NAMES.NEO_SYNC_SUMMARY, { connection })
        ).singleton(),

        neoSyncQueue: asFunction(({ connection }: { connection: Redis }) =>
            new Queue(QUEUE_NAMES.NEO_SYNC, {
                connection,
                defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 }
            })
        ).singleton(),

        neoSyncQueueEvents: asFunction(({ connection }: { connection: Redis }) =>
            new QueueEvents(QUEUE_NAMES.NEO_SYNC, { connection })
        ).singleton(),

        fileProcessQueue: asFunction(({ connection }: { connection: Redis }) =>
            new Queue(QUEUE_NAMES.FILE_PROCESS, {
                connection,
                defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 }
            })
        ).singleton(),

        authQueue: asFunction(({ connection }: { connection: Redis }) =>
            new Queue(QUEUE_NAMES.AUTH, { connection })
        ).singleton()
    };
}