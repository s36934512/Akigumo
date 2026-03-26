import FileQueryService from '@server/modules/file/domain/services/file-query.service';
import ItemQueryService from '@server/modules/item/domain/services/item-query.service';
import { GetIndexRequest, IndexResponse } from 'libs/contract/zod/explorer/v1/api.zod';
import { cacheService } from '@server/core/infrastructure/cache/cache-manager';
import { ContextService } from '@server/core/context/context.service';

interface ExplorerOrchestratorDeps {
    itemQueryService: ItemQueryService;
    fileQueryService: FileQueryService;
    cacheService: typeof cacheService;
}

// [TODO] 這個 orchestrator 主要負責處理 explorer 相關的複雜邏輯，目前先實作 index 的部分，之後可以再擴充其他功能
export default class ExplorerOrchestrator {
    constructor(private deps: ExplorerOrchestratorDeps) { }

    private get itemQueryService() { return this.deps.itemQueryService; }
    private get fileQueryService() { return this.deps.fileQueryService; }
    private get cacheService() { return this.deps.cacheService; }

    private async getUserId() {
        const ctx = ContextService.getContext();
        return ctx?.userId;
    }

    async handleIndex(query: GetIndexRequest): Promise<IndexResponse> {
        const userId = await this.getUserId();
        if (!userId) {
            throw new Error('User ID not found in context');
        }

        // 判斷 scope
        if ('is_home' in query.scope) {
            switch (query.view_mode) {
                case 'VIEW_MODE_NORMAL':
                    // 顯示該 user root 下的檔案
                    // [TODO]: 實作取得 root 下正常檔案
                    const result = await this.itemQueryService.getRootSummary(userId);
                    return { entries: [], total_count: result.total_count };
                case 'VIEW_MODE_TRASH':
                    // 顯示垃圾桶檔案
                    // [TODO]: 實作取得垃圾桶檔案
                    return {
                        entries: [], // 填入垃圾桶檔案資料
                        total_count: 0
                    };
                case 'VIEW_MODE_ALL':
                    // 顯示 root 下正常檔案與已刪除檔案
                    // [TODO]: 實作取得所有檔案
                    return {
                        entries: [], // 填入所有檔案資料
                        total_count: 0
                    };
            }
        } else if ('item_id' in query.scope) {
            // 處理 item_id 查詢
            // [TODO]: 實作 item_id 查詢邏輯
            return {
                entries: [], // 填入 item_id 對應檔案資料
                total_count: 0
            };
        } else {
            const _exhaustiveCheck: never = query.scope;
            throw new Error(`Unhandled scope: ${JSON.stringify(_exhaustiveCheck)}`);
        }
    }
}
