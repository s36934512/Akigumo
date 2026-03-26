import { notifyClient } from 'akigumo/kernel/event/notifier';
import { itemRepository } from 'akigumo/modules/item/index-stream/core/repository';
import { IndexEntryPatch } from 'akigumo/modules/item/index-stream/core/schema';

/**
 * 通知前端更新檔案索引資料
 * 重構重點：統一使用 itemRepository 進行補全 (Hydration)
 */
export const notifyIndexPatchesForFileIds = async (
    notifyUploadId: string,
    fileIds: string[]
) => {
    if (!fileIds.length) return;

    // 呼叫新版 repository 獲取標準化、帶有封面資訊的 IndexEntry (血肉)
    const entries = await itemRepository.getHydratedEntries(fileIds);

    const patches: IndexEntryPatch[] = entries.map((entry) => ({
        op: 'UPSERT',
        id: entry.id,
        entry: entry,
    }));

    if (!patches.length) return;

    await notifyClient({
        notifyUploadId,
        type: 'INDEX_PATCH',
        payload: { patches },
    });
};