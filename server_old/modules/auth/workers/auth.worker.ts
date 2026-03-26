import { Worker, Job } from "bullmq";
// import { TYPES } from "server/old/types/types";
import { AppTransactionClient, ExtensionPrisma } from '@core/infrastructure/database/prisma';
import { Redis } from "ioredis";
import { QUEUE_NAMES } from "@shared/queues/constants";

export class AuthWorker {
    // private worker: Worker;

    constructor(
        private redisClient: Redis,
        private prisma: ExtensionPrisma,
        // 如果你有圖形資料庫的 Service，也可以注入
        // @inject(TYPES.GraphService) private graphService: GraphService 
    ) {
        // 在建構子初始化 Worker
        // this.worker = new Worker(
        //     QUEUE_NAMES.AUDIT,
        //     async (job: Job) => {
        //         await this.process(job);
        //     },
        //     { connection: this.redisClient }
        // );

        // this.worker.on('failed', (job, err) => {
        //     console.error(`Job ${job?.id} failed: ${err.message}`);
        // });
    }

    private async process(job: Job) {
        const { userId, name } = job.data;

        if (job.name === 'INIT_USER_NODE') {
            console.log(`正在為用戶 ${name} (${userId}) 初始化圖形節點...`);

            // 執行實際邏輯，例如：
            // await this.graphService.createUserNode(userId, name);

            // 或者更新資料庫狀態
            // await this.prisma.user.update({ ... });
        }
    }
}