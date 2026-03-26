import FileNeoRepository from "@modules/file/data/repositories/file.neo-repository";
import ItemNeoRepository from "@modules/item/data/repositories/item.neo-repository";
import UserNeoRepository from "@modules/user/data/repositories/user.neo-repository";

export default class NeoSyncProcessor {
    constructor(private deps: any) { }

    private get itemNeoRepository(): ItemNeoRepository { return this.deps.itemNeoRepository; }
    private get fileNeoRepository(): FileNeoRepository { return this.deps.fileNeoRepository; }
    private get userNeoRepository(): UserNeoRepository { return this.deps.userNeoRepository; }

    /**
     * 取得同步策略配置
     * 這裡使用 private method 代替外部 const，才能正確存取注入的 repository
     */
    private getSyncStrategy(type: string) {
        const strategies: Record<string, {
            namespace: string;
            action: (tasks: any) => Promise<void>;
        }> = {
            file: {
                namespace: 'outbox:neo4j:file',
                action: async (tasks) => {
                    const fileNodes = tasks.map((t: any) => ({ key: t.key, value: t.value }));
                    const links = tasks.map((t: any) => ({ fileId: t.key, itemIds: t.value.itemId })).filter((t: any) => t.itemIds);

                    console.log(`[NeoSyncProcessor] Processing file sync, fileNodes: ${JSON.stringify(fileNodes)}, links: ${JSON.stringify(links)}`);
                    // 1. 批次更新檔案節點
                    await this.fileNeoRepository.upsertFileNodes(fileNodes);

                    // 2. 處理關聯邏輯 (過濾出有 itemId 的資料進行批次關聯)
                    if (links.length > 0) {
                        await this.fileNeoRepository.linkToContainers(links);
                    }
                },
            },
            user: {
                namespace: 'outbox:neo4j:user',
                action: async (tasks) => {
                    await this.userNeoRepository.upsertUserNodes(tasks.ids);
                },
            },
            item: {
                namespace: 'outbox:neo4j:item',
                action: async (tasks) => {
                    await this.itemNeoRepository.upsertItemNodes(tasks.ids)
                },
            },
        };

        console.log(`[NeoSyncProcessor] Selected strategy for type: ${type}`);
        return strategies[type.toLowerCase()];
    }

    async processSync(type: string, tasks: any) {
        const strategy = this.getSyncStrategy(type);
        if (!strategy) {
            throw new Error(`No sync strategy found for type: ${type}`);
        }

        try {
            await strategy.action(tasks);
        } catch (error) {
            console.error(`[NeoSyncProcessor] Error processing sync for type: ${type}, tasks: ${JSON.stringify(tasks)}, error: ${error}`);
            throw error;
        }
    }
}
