import { z } from '@hono/zod-openapi'
import { FileSchema, OrphanFileResponseSchema } from '../../../file.schema'
import { PaginationQuerySchema, BreadcrumbSchema } from '../../../common'
import { ItemTypeSchema, ItemStatusSchema } from 'generated/zod/schemas';
import { ItemCreateInputObjectZodSchema } from 'generated/zod/schemas/objects/ItemCreateInput.schema';

/** --- 基礎實體 --- **/
export const ItemBaseSchema = z.object({
    id: z.uuid(),
    title: z.string().min(1).trim(),
    type: ItemTypeSchema.openapi({ description: '項目類型', example: 'COLLECTION' }),
    status: ItemStatusSchema.openapi({ description: '狀態', example: 'ACTIVE' }),
    metadata: z.record(z.string(), z.any()).optional(),
    createdAt: z.iso.datetime(),
})

/** --- 預覽與詳細資料 --- **/
export const ItemDetailSchema = ItemBaseSchema.extend({
    kind: z.literal('ITEM'),
    children_count: z.number().int().optional(),
    // 關鍵：將 File 嵌入 Item
    files: z.array(FileSchema).optional().openapi({ description: '關聯的檔案列表' }),
    // 針對浮框預覽的需求
    children_preview: z.array(ItemBaseSchema).optional().openapi({ description: '子項目摘要' }),
}).openapi('ItemDetail')

/** --- Request (建立/查詢) --- **/
export const CreateItemRequestSchema = ItemCreateInputObjectZodSchema.extend({
    title: z.string().min(1),
    parentId: z.uuid().optional(),
    fileIds: z.array(z.uuid()).optional().openapi({ description: '關聯已上傳檔案' }),
    metadata: z.record(z.string(), z.any()).optional().openapi({
        example: { color: 'red', size: 10 },
        description: '自定義 JSON 格式的元數據'
    }),
}).omit(
    {
        id: true,
        createdTime: true
    }
).openapi('CreateItemRequest')

export const GetItemsQuerySchema = PaginationQuerySchema.extend({
    parentId: z.uuid().optional(),
    mode: z.enum(['all', 'mixed', 'items_only', 'files_only']).default('mixed'),
    // expand: z.enum(['preview']).optional(),
    afterId: z.uuid().optional(),
    limit: z.number().int().min(1).max(100).default(20),
}).openapi('GetItemsQuery')

/** --- Response (無限滾動) --- **/
// 混合節點：可能是 Item 或 獨立檔案
export const MixedNodeSchema = z.discriminatedUnion('kind', [
    ItemDetailSchema,
    OrphanFileResponseSchema
]).openapi('MixedNode')

export const InfiniteScrollResponseSchema = z.object({
    data: z.array(MixedNodeSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
    breadcrumbs: z.array(BreadcrumbSchema).optional(),
}).openapi('ItemPaginationResponse')