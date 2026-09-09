import { driver } from "#akigumo/db/neo4j.js";
import { prisma } from "#akigumo/db/prisma.js";
import { cacheService } from "#akigumo/services/cache/cache.service.js";

import { getFileInfosCypher } from "./cypher.js";
import { ToItemIndexEntry } from "./helper.js";
import { IndexEntrySchema } from "./schema.js";

export const itemRepository = {
	/**
	 * 核心：批次補完詳細資料 (Hydration)
	 * 供 Explorer 呼叫 notifyIndexPatches 時使用
	 */
	async getHydratedEntries(itemIds: string[]) {
		if (!itemIds.length) return [];

		const fileInfos = await this.getBatchFileInfos(itemIds);
		const [files, items] = await Promise.all([
			prisma.file.findMany({
				where: {
					id: { in: Object.values(fileInfos) },
				},
				select: {
					id: true,
					size: true,
					status: true,
					metadata: true,
					fileExtension: {
						select: {
							mimeType: true,
						},
					},
				},
			}),
			prisma.item.findMany({
				where: { id: { in: Object.keys(fileInfos) } },
			}),
		]);

		return Object.entries(fileInfos).map(([itemId, fileId]) => {
			const file = files.find((f) => f.id === fileId);
			const item = items.find((i) => i.id === itemId);

			if (!file || !item) return null;
			const indexEntry = ToItemIndexEntry({ file, item });
			const result = IndexEntrySchema.safeParse(indexEntry);
			return result.success ? result.data : null;
		});
	},

	/**
	 * 批次獲取封面資訊 (優化效能，防止 N+1)
	 */
	async getBatchFileInfos(
		itemIds: string[],
	): Promise<Record<string, string>> {
		const uniqueIds = Array.from(new Set(itemIds));
		const results: Record<string, string> = {};
		const misses: string[] = [];

		// 1. 嘗試從 Redis 讀取
		const cacheResults = await Promise.all(
			uniqueIds.map(async (id) => {
				const cached = await cacheService.get<string | null>({
					module: "ItemFileInfo",
					key: `file-info:${id}`,
				});
				return { id, cached };
			}),
		);

		for (const { id, cached } of cacheResults) {
			if (cached === undefined) {
				// 快取完全不存在（真正的 Miss）
				misses.push(id);
			} else if (cached === null) {
				// 快取存在，但紀錄為「此項目無對應檔案」（命中空快取）
				// 依據你的業務邏輯，這裡通常不放入 results，也不放入 misses
			} else {
				// 正常命中快取
				results[id] = cached;
			}
		}

		// 2. 處理快取失效，一發 Neo4j 解決所有 missing
		if (misses.length > 0) {
			console.log("misses", misses);
			const { records } = await driver.executeQuery(
				getFileInfosCypher,
				{ misses },
				{ database: "neo4j" },
			);
			const foundIds = new Set<string>();

			for (const record of records) {
				const itemId = record.get("itemId");
				const fileId = record.get("fileId");

				foundIds.add(itemId);
				results[itemId] = fileId;

				await cacheService.set(
					{
						module: "ItemFileInfo",
						key: `file-info:${itemId}`,
						ttl: 86_400_000,
					},
					fileId,
				);
			}

			const stillMissing = misses.filter((id) => !foundIds.has(id));
			if (stillMissing.length > 0) {
				await Promise.all(
					stillMissing.map((id) =>
						cacheService.set(
							{
								module: "ItemFileInfo",
								key: `file-info:${id}`,
								ttl: 300_000, // 設較短的 TTL（例如 5 分鐘），防範惡意攻擊即可
							},
							null, // 或者放 { itemId: id, fileId: null, isNull: true }
						),
					),
				);
			}
		}

		return results;
	},

	/**
	 * 失效快取
	 */
	async invalidateItem(itemId: string) {
		await cacheService.invalidate([
			{ module: "Item", key: itemId },
			{ module: "ItemFileInfo", key: `file-info:${itemId}` },
		]);
	},
};
