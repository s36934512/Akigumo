import { createContainer, asClass, InjectionMode, asValue, asFunction } from 'awilix';
import { redis } from '@server/core/infrastructure/cache/redisClient';
import { prisma } from '@core/infrastructure/database/prisma';
import { getQueueRegistrations } from '@shared/queues/queues';
// import { getDriver } from '@core/infrastructure/database/neo4j';
import { neogma } from '@core/infrastructure/database/neogma';
import { FlowProducer } from 'bullmq';
import { ItemModel } from 'libs/models/item.neogma';

// Use redis options instead of redis instance to avoid type mismatch
export const uploadFlowProducer = new FlowProducer({ connection: redis });
export const neoSyncFlowProducer = new FlowProducer({ connection: redis });

// 1. 建立容器
export const container = createContainer({
    // 推薦使用 PROXY 模式，它會根據建構函式的參數名稱來注入
    injectionMode: InjectionMode.PROXY,
});

container.register({
    // 名稱可以自己定，建議叫 redis 或 connection
    connection: asValue(redis),
    prisma: asValue(prisma),
    neoSyncFlowProducer: asValue(neoSyncFlowProducer),
    uploadFlowProducer: asValue(uploadFlowProducer),
    neogma: asValue(neogma),
    neo4jDriver: asValue(neogma.driver),
    ItemModel: asValue(ItemModel),
    ...getQueueRegistrations(),
});

export const setupIoC = async () => {
    // 2. 自動載入所有 Service 與 Worker
    console.time('IoC_LoadModules');
    await container.loadModules(
        [
            'server/core/base.repository.ts',
            'server/core/base.neo-repository.ts',
            'server/core/neo-sync/neo-sync.service.ts',
            'server/core/neo-sync/neo-sync.orchestrator.ts',
            'server/core/neo-sync/neo-sync.worker.ts',
            'server/core/neo-sync/neo-sync.processor.ts',
            'server/core/audit/**/*.ts',
            'server/modules/file/data/repositories/*.ts',
            'server/modules/item/data/repositories/*.ts',
            'server/modules/user/data/repositories/*.ts',
            'server/modules/file/domain/services/*.ts',
            'server/modules/item/domain/services/*.ts',
            'server/modules/user/domain/services/*.ts',
            'server/core/database-cache.repository.ts',
            'server/modules/file/processors/*.ts',
            'server/modules/file/workers/*.ts',
            'server/orchestrators/*.ts',
            'server/orchestrators/file/file-upload.orchestrator.ts',
            'server/modules/file/domain/services/file-query.service.ts',
            ['server/modules/item/infrastructure/item-default.init.ts', { register: asFunction }],
            ['server/modules/user/infrastructure/user-default.init.ts', { register: asFunction }],
            ['server/modules/file/infrastructure/file-cache.init.ts', { register: asFunction }],
            ['server/core/audit/audit-init.ts', { register: asFunction }], // 加入 Audit 啟動器
        ],
        {
            resolverOptions: {
                lifetime: 'SINGLETON', // 預設全部單例
                register: asClass,
            },
            formatName: 'camelCase', // 檔名 EmailWorker.ts 會變成 emailWorker 供注入
            esModules: true,
        }
    );
    console.timeEnd('IoC_LoadModules');

    console.time('IoC_Workers');
    // 3. 解決你「Worker 沒被用到就不會啟動」的問題
    // 遍歷所有註冊項，找出名稱結尾是 "Worker" 的並強制解析（即實例化）
    Object.keys(container.registrations).forEach((name) => {
        if (name.toLowerCase().endsWith('worker')) {
            container.resolve(name);
            console.log(`[IoC] 自動啟動 Worker: ${name}`);
        }
    });

    container.resolve('userDefaultInit'); // 啟動 User 預設資料同步
    container.resolve('itemDefaultInit'); // 啟動 Item 預設資料同步
    container.resolve('fileCacheInit'); // 啟動 File 預設資料同步
    container.resolve('auditInit'); // 啟動 Audit 預設資料同步
    console.timeEnd('IoC_Workers');
};
