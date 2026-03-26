import { Job, Queue, Worker } from 'bullmq';
import { redis } from '../db/redisClient';
import { WorkflowRegistry } from './workflow.registry';
import { WorkflowRepository } from './workflow.repository';
import { createActor, Snapshot } from 'xstate';

const _QUEUE_NAME = 'workflow-tasks';

function hydrateSnapshot(snapshot: any): Snapshot<any> | undefined {
    if (!snapshot || typeof snapshot !== 'object') return undefined;

    // 這裡你可以做進一步的 Schema 驗證，例如檢查 snapshot 是否有 status 欄位
    // 如果資料庫真的存了 null，這裡會被過濾掉
    return snapshot as Snapshot<any>;
}

export const workflowQueue = new Queue(_QUEUE_NAME, { connection: redis, });

export const setupWorkflowWorker = () => {
    return new Worker(
        _QUEUE_NAME,
        async (job: Job) => {
            const { workflowId, correlationId, event } = job.data;
            if (!workflowId || !correlationId || !event) {
                console.warn(`缺少必要參數，無法處理工作: ${job.id}`);
                return;
            }

            // 1. 從 DB 撈取現場 (持久化的 Snapshot)
            const dbState = await WorkflowRepository.find(correlationId);
            if (!dbState) {
                console.warn(`找不到 workflow 狀態，correlationId: ${correlationId}`);
                return;
            }

            // 2. 從 Registry 獲取機器定義，並與現場合併
            const machine = WorkflowRegistry.get(workflowId);
            const actor = createActor(machine, { snapshot: hydrateSnapshot(dbState.snapshot) });

            try {
                actor.start();
                actor.send(event);

                // 持久化新現場
                const nextSnapshot = actor.getSnapshot();
                await WorkflowRepository.persist(workflowId, correlationId, nextSnapshot);
            } finally {
                // 無論中間是否發生錯誤，確保機台被釋放
                actor.stop();
            }
        },
        { connection: redis }
    );
};

export async function initializeWorkflow(workflowId: string, correlationId: string, input: any) {
    const machine = WorkflowRegistry.get(workflowId);

    // 1. 建立一個全新的 actor
    const actor = createActor(machine, { input });

    // 2. 啟動它，產生第 0 號 Snapshot
    actor.start();

    // 3. 立即存入資料庫
    const snapshot = actor.getSnapshot();
    await WorkflowRepository.persist(workflowId, correlationId, snapshot);

    // 4. 釋放
    actor.stop();

    return snapshot;
}