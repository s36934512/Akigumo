import { Queue } from 'bullmq';
import { file } from 'zod';

class NeoSyncService {
    constructor(private deps: any) { }

    private get queue(): Queue { return this.deps.neoSyncPulseQueue; }

    /**
     * 核心方法：確保寫入 DB 後才通知 Queue
     */
    async triggerSync(entityType: string) {
        // 2. 發送「通知」脈衝
        // 使用 fixed jobId 確保尖峰時不會重複堆疊 Job
        await this.queue.add(
            'pulse',
            {
                type: entityType,
                fileId: "019ca705-84c8-73bd-a5a2-b6fcd37cf299"
            },
            {
                jobId: `neo-sync-pulse-${entityType.toLowerCase()}`,
                removeOnComplete: true,
                removeOnFail: true
            }
        );
    }
}

export default NeoSyncService;
