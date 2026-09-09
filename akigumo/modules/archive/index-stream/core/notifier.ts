import { notifyClient } from "#akigumo/delivery/sse/index.js";
import { PatchOperate } from "#akigumo/shared/schemas/sse.js";

import { itemRepository } from "./repository.js";

/**
 * 根據項目 ID 列表推送 INDEX_PATCH UPSERT 事件。
 * 這是連接 Explorer (結構) 與 Index-Stream (內容) 的關鍵橋樑。
 */
export async function notifyIndexPatches(notifyId: string, itemIds: string[]) {
	if (!itemIds.length) return;

	// 1. 使用 Repository 進行高效的批次補完 (Hydration)
	// 這會自動處理 Prisma 查詢、Neo4j 封面快取與 Zod 轉換
	const entries = await itemRepository.getHydratedEntries(itemIds);
	if (!entries.length) return;

	// 2. 封裝成增量更新補丁 (Patches)
	const patches = entries.flatMap((entry) => {
		if (!entry) return [];

		return [
			{
				op: PatchOperate.UPSERT_PROP,
				id: entry.id,
				entry: entry,
			},
		];
	});
	if (!patches.length) return;

	// 3. 透過內核的通知機制推送到前端的 SSE 頻道
	await notifyClient({
		notifyId,
		type: "ARCHIVE_PATCH",
		payload: patches,
	});
}
