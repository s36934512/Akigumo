import { createRoute, z } from '@hono/zod-openapi'
import { CreateItemRequestSchema, CreateItemResponseSchema } from 'libs/contract/zod/item/v1/create-item.schema';

export const createItemRoute = createRoute({
    method: 'post',
    path: '/items',
    summary: '建立新項目',
    description: '建立一個新的實體（作品、系列或合集），並在 Neo4j 中建立對應的關聯節點。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateItemRequestSchema
                }
            }
        }
    },
    responses: {
        201: { // 建立成功通常回傳 201 Created
            content: {
                'application/json': {
                    schema: CreateItemResponseSchema
                }
            },
            description: '項目建立成功'
        },
        400: {
            description: '請求格式錯誤 (例如標題為空或 ID 格式不正確)'
        }
    }
})