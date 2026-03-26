/**
 * @file OpenAPI route definition for user creation API
 *
 * Route metadata is separated from handler logic so request validation,
 * OpenAPI generation, and runtime execution remain decoupled.
 */

import { createRoute } from '@hono/zod-openapi';

import { CreateUserResponseSchema } from './schema';
import { CreateUserInputSchema } from '../core/processors';

/**
 * POST /user/create route contract
 *
 * Response semantics:
 * - 201 means accepted and queued for workflow execution
 * - Persistence and synchronization continue asynchronously
 * - traceId enables status tracking and operational debugging
 */
export const userRegistrationRoute = createRoute({
    method: 'post',
    path: '/user/create',
    summary: '建立新使用者',
    description: '建立一個新使用者，並初始化相關資料。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateUserInputSchema
                }
            }
        }
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: CreateUserResponseSchema
                }
            },
            description: '使用者建立成功，回傳流程追蹤 ID'
        },
        400: {
            description: '請求格式錯誤'
        }
    }
});
