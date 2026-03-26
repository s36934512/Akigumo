import { createRoute } from '@hono/zod-openapi'
import { GetIndexRequest, IndexResponse } from 'libs/contract/zod/explorer/v1/api.zod'

export const indexRoute = createRoute({
    method: 'post',
    path: '/explorer/index',
    security: [{ bearerAuth: [] }],
    summary: '取得目錄索引',
    description: '取得目錄索引（支援檢視模式、根目錄或特定 item）',
    request: {
        body: {
            content: {
                'application/x-msgpack': {
                    schema: GetIndexRequest
                }
            }
        }
    },
    responses: {
        200: {
            content: {
                'application/x-msgpack': {
                    schema: IndexResponse
                }
            },
            description: '查詢成功，回傳 MessagePack 編碼的目錄索引資料'
        }
    }
})

export default indexRoute;
