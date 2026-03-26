import { z } from '@hono/zod-openapi'

// 分頁基礎 Request
export const PaginationQuerySchema = z.object({
    cursor: z.string().optional().openapi({ description: '游標 ID', example: 'uuid-last-item' }),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

// 麵包屑導航 (用於資料夾/Item 階層)
export const BreadcrumbSchema = z.object({
    id: z.uuid(),
    title: z.string()
}).openapi('Breadcrumb')