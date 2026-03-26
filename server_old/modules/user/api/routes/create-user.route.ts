import { createRoute } from '@hono/zod-openapi'
import { CreateUserRequestSchema, CreateUserResponseSchema } from '../../../../../libs/contract/zod/user/v1/create-user.schema';

export const createUserRoute = createRoute({
    method: 'post',
    path: '/users',
    summary: '建立新用戶',
    description: '建立一個新的用戶，並在 Neo4j 中建立對應的關聯節點。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateUserRequestSchema
                }
            }
        }
    },
    responses: {
        201: { // 建立成功通常回傳 201 Created
            content: {
                'application/json': {
                    schema: CreateUserResponseSchema
                }
            },
            description: '用戶建立成功'
        },
        400: {
            description: '請求格式錯誤 (例如標題為空或 ID 格式不正確)'
        }
    }
})