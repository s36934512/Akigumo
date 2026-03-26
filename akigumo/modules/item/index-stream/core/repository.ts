import { neogma } from 'akigumo/db/neogma';
import { prisma } from 'akigumo/db/prisma';
import { cacheService } from 'akigumo/services/cache/cache.service';

import { IndexEntry, ItemFileInfo, ToItemIndexEntry } from './schema';

export const itemRepository = {
    /**
     * 核心：批次補完詳細資料 (Hydration)
     * 供 Explorer 呼叫 notifyIndexPatchesForLinkedItems 時使用
     */
    async getHydratedEntries(itemIds: string[]): Promise<IndexEntry[]> {
        if (!itemIds.length) return [];

        // 1. 併行抓取：Prisma 基礎資料 + Neo4j 封面/關係資料
        const [rows, fileInfos] = await Promise.all([
            prisma.item.findMany({
                where: { id: { in: itemIds } },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    metadata: true,
                    createdTime: true,
                    modifiedTime: true,
                },
            }),
            this.getBatchFileInfos(itemIds),
        ]);

        // 2. 注入 Neo4j 資訊並轉換為標準 IndexEntry
        return rows.map((row) => {
            const fileInfo = fileInfos[row.id];
            const extendedRow = {
                ...row,
                neo4j: {
                    fileId: fileInfo?.fileId ?? null,
                    coverUrl: fileInfo?.coverUrl ?? null,
                    displayAs: fileInfo?.displayAs ?? null,
                },
            };
            return ToItemIndexEntry.parse(extendedRow);
        });
    },

    /**
     * 獲取項目的文件與封面資訊 (帶快取)
     */
    async getItemFileInfo(itemId: string): Promise<ItemFileInfo> {
        return cacheService.getOrSet(
            { module: 'ItemFileInfo', key: `file-info:${itemId}`, ttl: 86_400_000 },
            async () => {
                const result = await neogma.queryRunner.run(
                    `
                    MATCH (root { id: $itemId })
                    OPTIONAL MATCH (root)-[:DISPLAY_AS]->(selfDf:File)
                    OPTIONAL MATCH (root)-[r:CONTAINS]->(child)
                    WITH root, selfDf, child
                    ORDER BY coalesce(r.order, 0) ASC, child.createdAt ASC

                    WITH root, selfDf, head(collect(child)) AS firstChild

                    OPTIONAL MATCH (firstChild)-[:DISPLAY_AS|CONTAINS*1..2]->(cf:File)
                    WITH selfDf, cf
                    ORDER BY cf.createdTime ASC

                    WITH selfDf, head(collect(cf)) AS subFile
                    
                    RETURN coalesce(selfDf.id, subFile.id) AS fileId,
                           CASE WHEN selfDf IS NOT NULL THEN 'DISPLAY_AS'
                                WHEN subFile IS NOT NULL THEN 'AUTO_DETECT'
                                ELSE NULL END AS displayAs
                    `,
                    { itemId }
                );

                const record = result.records[0];
                const fId = record?.get('fileId') as string | null;
                const dAs = record?.get('displayAs') as any;

                return {
                    fileId: fId,
                    coverUrl: fId ? `/api/v1/files/${fId}/serve` : null,
                    displayAs: dAs,
                };
            }
        );
    },

    /**
     * 批次獲取封面資訊 (優化效能，防止 N+1)
     */
    async getBatchFileInfos(itemIds: string[]): Promise<Record<string, ItemFileInfo>> {
        const uniqueIds = Array.from(new Set(itemIds));
        const results: Record<string, ItemFileInfo> = {};
        const misses: string[] = [];

        // 1. 嘗試從 Redis 讀取
        await Promise.all(uniqueIds.map(async (id) => {
            const cached = await cacheService.get<ItemFileInfo>({ module: 'ItemFileInfo', key: `file-info:${id}` });
            if (cached) results[id] = cached;
            else misses.push(id);
        }));

        // 2. 處理快取失效，一發 Neo4j 解決所有 missing
        if (misses.length > 0) {
            const queryResult = await neogma.queryRunner.run(
                `
                UNWIND $misses AS targetId
                MATCH (root { id: targetId })
                
                OPTIONAL MATCH (root)-[:DISPLAY_AS]->(df:File)
                OPTIONAL MATCH (root)-[r:CONTAINS]->(child)
                WITH targetId, df, child
                ORDER BY targetId, coalesce(r.order, 0) ASC, child.createdAt ASC
 
                WITH targetId, df, head(collect(child)) AS firstChild
                
                OPTIONAL MATCH (firstChild)-[:DISPLAY_AS|CONTAINS*1..2]->(cf:File)
                WITH targetId, df, cf
                ORDER BY targetId, cf.createdTime ASC
                
                WITH targetId, df, head(collect(cf)) AS subFile
                
                RETURN targetId AS itemId, 
                       coalesce(df.id, subFile.id) AS fileId,
                       CASE WHEN df IS NOT NULL THEN 'DISPLAY_AS'
                            WHEN subFile IS NOT NULL THEN 'AUTO_DETECT'
                            ELSE NULL END AS displayAs
                `,
                { misses }
            );

            for (const record of queryResult.records) {
                const id = record.get('itemId');
                const fId = record.get('fileId') || null;
                const dAs = record.get('displayAs') || null;

                const info = {
                    fileId: fId,
                    coverUrl: fId ? `/api/v1/files/${fId}/serve` : null,
                    displayAs: dAs
                };

                await cacheService.set({
                    module: 'ItemFileInfo',
                    key: `file-info:${id}`,
                    ttl: 86_400_000
                }, info);
                results[id] = info;
            }
        }

        return results;
    },

    /**
     * 失效快取
     */
    async invalidateItem(itemId: string): Promise<void> {
        await cacheService.invalidate([
            { module: 'Item', key: itemId },
            { module: 'ItemFileInfo', key: `file-info:${itemId}` }
        ]);
    }
};
