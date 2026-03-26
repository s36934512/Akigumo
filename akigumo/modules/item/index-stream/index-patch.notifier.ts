import { notifyClient } from 'akigumo/kernel/event/notifier';

import { itemRepository } from './core/repository';
import { IndexEntryPatch } from './core/schema';

/**
 * 根據項目 ID 列表推送 INDEX_PATCH UPSERT 事件。
 * 這是連接 Explorer (結構) 與 Index-Stream (內容) 的關鍵橋樑。
 */
export const notifyIndexPatchesForLinkedItems = async (
    notifyUploadId: string,
    itemIds: string[]
) => {
    if (!itemIds.length) return;

    // 1. 使用 Repository 進行高效的批次補完 (Hydration)
    // 這會自動處理 Prisma 查詢、Neo4j 封面快取與 Zod 轉換
    const entries = await itemRepository.getHydratedEntries(itemIds);

    // 2. 封裝成增量更新補丁 (Patches)
    const patches: IndexEntryPatch[] = entries.map((entry) => ({
        op: 'UPSERT',
        id: entry.id,
        entry: entry,
    }));

    if (!patches.length) return;

    console.debug('notifyIndexPatchesForLinkedItems', { notifyUploadId, itemIds, patches });
    // 3. 透過內核的通知機制推送到前端的 SSE 頻道
    await notifyClient({
        notifyUploadId,
        type: 'INDEX_PATCH',
        payload: { patches },
    });
};