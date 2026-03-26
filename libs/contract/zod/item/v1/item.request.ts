import { z } from '@hono/zod-openapi'

export const CreateItemRequestSchema = z.object({
    title: z.string().min(1).max(100).openapi({
        example: '2026 跨年攝影集',
        description: '項目的標題'
    }),
    description: z.string().optional().openapi({
        example: '這是在高雄港拍攝的照片...',
        description: '詳細描述'
    }),
    isPublic: z.boolean().default(false).openapi({
        description: '是否公開給所有使用者'
    }),
    // 關鍵：將已透過 Tus 上傳成功的 File ID 傳進來進行關聯
    fileIds: z.array(z.string().uuid()).min(1).openapi({
        example: ['550e8400-e29b-41d4-a716-446655440000'],
        description: '已經上傳成功的 File ID 列表'
    }),
    tags: z.array(z.string()).optional().openapi({
        example: ['攝影', '旅遊'],
        description: '關聯的標籤，會用於 Neo4j 的關係建立'
    })
}).openapi('CreateItemRequest')

export const ListItemQuerySchema = z.object({
    // 游標分頁的核心：上一次最後一筆的 ID
    cursor: z.string().optional().openapi({
        description: '分頁游標 (上一次回傳的 nextCursor)',
        example: 'uuid-of-last-item'
    }),
    limit: z.coerce.number().int().min(1).max(100).default(20).openapi({
        description: '每次載入的數量',
        example: 20
    }),
    mode: z.enum(['all', 'mixed', 'items_only', 'files_only']).default('mixed').openapi({
        description: '顯示模式：全部、混合、僅項目、僅未分類檔案'
    }),
    search: z.string().optional().openapi({
        description: '關鍵字搜尋（對接 MeiliSearch）',
        example: '風景'
    })
}).openapi('ListItemQuery')