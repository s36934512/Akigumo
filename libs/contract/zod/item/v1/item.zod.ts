import { z } from '@hono/zod-openapi'

// Schema for batch querying items by IDs
export const BatchGetItemsByIdSchema = z.object({
    ids: z.array(z.uuid()).min(1).openapi({
        description: '要查詢的項目 ID 陣列',
        example: ['b3b7e8e2-1c2d-4e5f-8a9b-123456789abc', 'c4c7e8e2-1c2d-4e5f-8a9b-987654321def']
    })
}).openapi('BatchGetItemsByIdRequest')

export const BatchGetItemsByIdResponseSchema = z.object({
    items: z.array(z.any()).openapi({
        description: '查詢到的項目陣列'
    })
}).openapi('BatchGetItemsByIdResponse')
