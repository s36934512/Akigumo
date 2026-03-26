import { createRoute } from '@hono/zod-openapi'
import { GetItemsQuerySchema, InfiniteScrollResponseSchema } from 'libs/contract/zod/item/v1/item.schema'

export const queryItemRoute = createRoute({
    method: 'get',
    path: '/items',
    summary: '查詢項目列表',
    description: '查詢項目（支援分頁、模式切換、可混合檔案與項目）',
    request: {
        query: GetItemsQuerySchema
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: InfiniteScrollResponseSchema
                }
            },
            description: '查詢成功，回傳分頁資料'
        },
        400: {
            description: '查詢參數錯誤'
        }
    }
})
