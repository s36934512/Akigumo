import { z } from '@hono/zod-openapi'
import { ItemCreateInputObjectZodSchema } from 'generated/zod/schemas/objects/ItemCreateInput.schema';
import { ItemSchema } from './item-old.schema';
import { ItemStatusSchema, ItemTypeSchema } from 'generated/zod/schemas';

/**
 * 建立 Item 的請求規範 (Input)
 */
export const CreateItemRequestSchema = ItemCreateInputObjectZodSchema.extend({
    parentId: z.uuid().optional().openapi({
        description: '父節點 ID，用於在 Neo4j 建立包含關係。若不傳則視為根目錄項目。',
    }),
    title: z.string().min(1).trim().openapi({
        description: '標題',
    }),
    metadata: z.record(z.string(), z.any()).optional().openapi({
        example: { color: 'red', size: 10 },
        description: '自定義 JSON 格式的元數據'
    }),
    type: ItemTypeSchema.openapi({
        description: '項目類型',
    }),
    status: ItemStatusSchema.openapi({
        description: '項目狀態',
    }),
}).omit({
    id: true,
    createdTime: true,
}).openapi('CreateItemRequest');

/**
 * 建立 Item 的回應規範 (Output)
 * 通常我們直接回傳「建立成功後的 Item 全貌」
 */
export const CreateItemResponseSchema = ItemSchema.openapi('CreateItemResponse')