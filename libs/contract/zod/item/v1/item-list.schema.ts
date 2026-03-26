import { z } from '@hono/zod-openapi'

// 1. 定義檔案的介面
export const FileSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    mimeType: z.string().openapi({ example: 'image/jpeg' }),
}).openapi('File')

// 2. 定義 Item 的介le面
export const ItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(['ITEM', 'FILE']).openapi({ description: '判斷是獨立檔案還是複合項目' }),
    files: z.array(FileSchema).optional(),
    createdAt: z.string().datetime(),
}).openapi('Item')

// 3. 定義分頁回應（前端無限滾動最需要的介面）
export const InfiniteScrollSchema = z.object({
    data: z.array(ItemSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
}).openapi('ItemPagination')