import { z } from '@hono/zod-openapi'
import { ItemStatusSchema } from 'generated/zod/schemas/enums/ItemStatus.schema'
import { ItemTypeSchema } from 'generated/zod/schemas/enums/ItemType.schema'
import { ItemCreateInputObjectZodSchema } from 'generated/zod/schemas/objects/ItemCreateInput.schema';

// --- 1. 定義 Enums (對應你的 Prisma Enum) ---

export const ItemTypeSchemaOpenApi = ItemTypeSchema.openapi({
    description: '項目的物理類型',
    example: 'COLLECTION'
});

export const ItemStatusSchemaOpenApi = ItemStatusSchema.openapi({
    description: '項目的狀態，包含內容狀態、生命週期與系統狀態',
    example: 'ACTIVE'
});

// --- 2. 定義基礎預覽對象 (用於浮框預覽的簡化版) ---

export const ItemPreviewSchema = z.object({
    id: z.uuid(),
    title: z.string(),
    type: ItemTypeSchemaOpenApi,
    status: ItemStatusSchemaOpenApi
}).openapi('ItemPreview')

// --- 3. 定義核心 Item Schema ---

export const ItemSchema = ItemCreateInputObjectZodSchema.extend({
    // 關鍵：為了「浮框預覽」增加的欄位
    // 當查詢 API 帶上擴展參數時，後端會從 Neo4j 抓取前幾個子項目放進這裡
    children_preview: z.array(ItemPreviewSchema).optional().openapi({
        description: '子項目摘要（用於浮框預覽），通常僅包含前 5-10 個項目'
    }),
    children_count: z.number().int().optional().openapi({
        description: '總子項目數量',
        example: 12
    }),
    metadata: z.record(z.string(), z.any()).optional().openapi({
        example: { color: 'red', size: 10 },
        description: '自定義 JSON 格式的元數據'
    })
}).openapi('Item')

// --- 4. 定義 API Request / Response 規範 ---

// 取得列表的 Request Query
export const GetItemsQuerySchema = z.object({
    parentId: z.uuid().optional().openapi({
        description: '父層 ID，若為空則查詢根目錄'
    }),
    expand: z.enum(['preview']).optional().openapi({
        description: '是否展開子項目預覽（浮框預覽需求）'
    }),
    limit: z.coerce.number().int().default(20),
    offset: z.coerce.number().int().default(0)
})

// 封裝 Response (含分頁)
export const ItemsResponseSchema = z.object({
    items: z.array(ItemSchema),
    total: z.number().int(),
    breadcrumbs: z.array(z.object({
        id: z.uuid(),
        title: z.string()
    })).openapi({ description: '麵包屑導航路徑' })
})