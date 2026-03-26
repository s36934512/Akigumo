/**
 * @file OpenAPI route definition for the entity creation endpoint.
 *
 * This file only declares the HTTP contract (method, path, request/response schemas).
 * It is intentionally free of business logic — the handler in handler.ts consumes
 * this definition to register actual request processing.
 */
import { createRoute } from '@hono/zod-openapi';

import { EntityCreateResponseSchema } from './schema';
import { EntityCreateInputSchema } from '../core/processors';

export const tagProvisioningRoute = createRoute({
    method: 'post',
    path: '/entity/create',
    summary: '建立新實體',
    description: '建立一個新實體，並初始化相關資料。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: EntityCreateInputSchema
                }
            }
        }
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: EntityCreateResponseSchema
                }
            },
            description: '實體建立成功，回傳流程追蹤 ID'
        },
        400: {
            description: '請求格式錯誤'
        }
    }
});