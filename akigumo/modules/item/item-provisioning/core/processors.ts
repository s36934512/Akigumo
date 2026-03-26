/**
 * @file Processor registration and payload contracts for item-provisioning.
 */

import { z } from '@hono/zod-openapi';
import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';
import { registerItemProcessor } from 'akigumo/modules/item/common/registry.helper';
import { syncItemsToGraph } from 'akigumo/services/graph-refinement-engine';
import { ItemStatus, ItemType } from 'generated/prisma/enums';

import { ITEM_ACTIONS as ACTIONS } from '../contract';

const CreateItemSchema = z.object({
    name: z.string().min(1, '標題不能為空').openapi({
        description: '項目標題，至少 1 個字元',
        example: '我的第一個作品',
    }),
    description: z.string().optional().openapi({
        description: '項目描述，用於補充說明此項目內容',
        example: '這是一個測試作品項目',
    }),
    metadata: z.record(z.string(), z.any()).optional().openapi({
        description: '自訂鍵值對 metadata，可存放額外設定或標記',
        example: {
            source: 'admin-panel',
            version: 1,
            tags: ['demo', 'item'],
        },
    }),
    type: z.enum(ItemType).openapi({
        description: '項目類型',
        example: ItemType.WORK,
    }),
    status: z.enum(ItemStatus).openapi({
        description: '項目狀態',
        example: ItemStatus.ACTIVE,
    }),
    publishedTime: z.iso.datetime().optional().openapi({
        description: '發布時間 (ISO-8601)',
        example: '2026-03-08T12:00:00.000Z',
    }),
}).openapi({
    description: '單一待建立項目資料',
});

const CreateItemBatchSchema = z.array(CreateItemSchema).openapi({
    description: '批次建立項目的輸入資料，陣列中的每一筆皆會建立一個項目',
});

export const CreateItemInputSchema = z.union([
    CreateItemBatchSchema,
    CreateItemSchema,
]).openapi({
    description: '單一或批次建立項目的輸入資料',
});

export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;

const SyncItemPayloadSchema = z.array(z.uuid()).min(1);

registerItemProcessor(
    ACTIONS.CREATE,
    CreateItemInputSchema,
    async (data) => {
        const preparedData = Array.isArray(data) ? data : [data];
        return prisma.item.createManyAndReturn({ data: preparedData });
    }
);

registerItemProcessor(
    ACTIONS.SYNC,
    SyncItemPayloadSchema,
    async (data, metadata) => {
        if (!data || data.length === 0) {
            logger.warn(
                { label: ACTIONS.SYNC.code, traceId: metadata.traceId },
                'No item IDs found in trace.',
            );
            return { synced: 0 };
        }

        const syncedCount = await syncItemsToGraph(data);
        return { synced: syncedCount };
    }
);
