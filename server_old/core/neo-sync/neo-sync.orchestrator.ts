import { FlowProducer, Queue, QueueEvents } from 'bullmq';
import { ExtensionPrisma } from '@core/infrastructure/database/prisma';
import DatabaseCacheRepository from '@core/database-cache.repository';
import { QUEUE_NAMES } from '@shared/queues/constants';
import { neoSyncMachine } from './neo-sync.machine';
import { createActor, fromPromise } from 'xstate';

const BATCH_SIZE = 500;
const CHUNK_SIZE = 50;
const NAMESPACE_MAPPING: Record<string, string> = {
    file: 'outbox:neo4j:file',
    user: 'outbox:neo4j:user',
    item: 'outbox:neo4j:item',
};

interface JobPayloadMap {
    UPLOAD: { filePath: string; bucket: string };
    CLEANUP: { jobId: string; force: boolean };
    NOTIFY: { userId: string; message: string };
    // 可以在這裡輕鬆擴充新任務
    file: undefined; // 這裡的 undefined 代表這類任務不需要額外參數，僅靠 type 區分即可
    user: undefined;
    item: undefined;
}

interface NeoSyncOrchestratorDeps {
    databaseCacheRepository: DatabaseCacheRepository;
    prisma: ExtensionPrisma;
    neoSyncFlowProducer: FlowProducer;
    neoSyncQueue: Queue;
    neoSyncQueueEvents: QueueEvents;
}

class NeoSyncOrchestrator {
    constructor(private deps: NeoSyncOrchestratorDeps) { }

    private get cacheRepository(): DatabaseCacheRepository { return this.deps.databaseCacheRepository; }
    private get prisma(): ExtensionPrisma { return this.deps.prisma; }
    private get flowProducer(): FlowProducer { return this.deps.neoSyncFlowProducer; }
    private get queue(): Queue { return this.deps.neoSyncQueue; }
    private get queueEvents(): QueueEvents { return this.deps.neoSyncQueueEvents; }

    private createSyncActor() {
        return neoSyncMachine.provide({
            actions: {
                logError: ({ context, event }) => {
                    console.log('=== [Sync logError Action 觸發] ===');
                    console.log('當前 Context:', context);
                    console.log('錯誤來源 Event:', event);

                    // 如果 event 是由 onError 觸發的，錯誤會在 event.error
                    if ('error' in event) {
                        console.error('具體錯誤原因:', event.error);
                    }
                },
            },
            actors: {
                addNeoSyncJob: fromPromise(async ({ input }) => {
                    const jobId = `neo-sync-${input.fileId}`;
                    await this.queue.add(
                        'neo-sync',
                        {
                            type: input.type,
                            fileId: input.fileId
                        },
                        {
                            jobId: jobId,
                            removeOnComplete: true
                        }
                    );
                    return { id: jobId };
                }),
                observeJobStatus: fromPromise(async ({ input }) => {
                    const job = await this.queue.getJob(input.jobId);
                    if (!job) throw new Error('Job not found');

                    return await job.waitUntilFinished(this.queueEvents);
                })
            }
        });
    }

    async executeSync<K extends keyof JobPayloadMap>(
        type: K,
        ...args: JobPayloadMap[K] extends undefined ? [] : [JobPayloadMap[K]]
    ) {
        const machineWithDeps = this.createSyncActor();
        const actor = createActor(machineWithDeps, {
            input: {
                type,
                ...args[0]
            },
        });

        actor.subscribe((state) => {
            console.log('目前狀態:', state.value);
        });

        actor.start();
    }

    // async executeSync(type: string) {
    //     const namespace = NAMESPACE_MAPPING[type.toLowerCase()];

    //     while (true) {
    //         const tasks = await this.prisma.$transaction(async (tx) => {
    //             const fetchedTasks = await this.cacheRepository.listByNamespace(
    //                 {
    //                     namespace,
    //                     version: 0,
    //                     limit: BATCH_SIZE,
    //                 },
    //                 tx
    //             );

    //             if (!fetchedTasks?.length) return [];

    //             await this.cacheRepository.updateBatchVersion(
    //                 {
    //                     namespace,
    //                     keys: fetchedTasks.map(t => t.key),
    //                     version: 1
    //                 },
    //                 tx
    //             );

    //             return fetchedTasks;
    //         });

    //         if (tasks.length === 0) return;

    //         const cleanedTasks = tasks
    //             .filter(t => t && t.key)
    //             .map(({ key, value }) => ({ key, value }));
    //         const chunks = this.chunkArray(cleanedTasks, CHUNK_SIZE);

    //         await this.flowProducer.add({
    //             name: 'sync-orchestrator-batch',
    //             queueName: QUEUE_NAMES.NEO_SYNC_SUMMARY,
    //             data: { namespace, ids: cleanedTasks.map(t => t.key) },
    //             children: chunks.map(chunk => ({
    //                 name: 'sync-worker-chunk',
    //                 queueName: QUEUE_NAMES.NEO_SYNC,
    //                 data: { chunk, type },
    //                 opts: { removeOnComplete: true }
    //             }))
    //         });
    //     }
    //     // const service = interpret(
    //     //     neoSyncMachine.withContext({
    //     //         type,
    //     //         namespace,
    //     //         error: null,
    //     //         tasks: [],
    //     //     })
    //     // ).onTransition((state) => {
    //     //     if (state.matches('failed')) {
    //     //         console.error('NeoSync 狀態機失敗:', state.context.error);
    //     //     }
    //     // });

    //     //     service.start();
    //     //     service.send({ type: 'START', syncType: type });
    //     //     // 這裡可根據狀態機設計，將 fetchTasks/syncTasks 實作綁定到 invoke src
    //     //     // 例如：service.onEvent(...) 或 service.subscribe(...)
    //     //     // 目前原本的 while (true) 流程可逐步遷移到狀態機 invoke srcs
    // }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }
}

export default NeoSyncOrchestrator;