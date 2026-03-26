import { createRoute } from '@hono/zod-openapi'
import { BatchGetItemsByIdSchema, BatchGetItemsByIdResponseSchema } from 'libs/contract/zod/item/v1/item.zod'

export const batchGetItemsByIdRoute = createRoute({
    method: 'post',
    path: '/items/batch',
    summary: '批量查詢項目',
    description: '根據 ID 陣列批量查詢項目',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: BatchGetItemsByIdSchema
                }
            }
        }
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: BatchGetItemsByIdResponseSchema
                }
            },
            description: '查詢成功，回傳項目陣列'
        },
        400: {
            description: '查詢參數錯誤'
        }
    }
})
