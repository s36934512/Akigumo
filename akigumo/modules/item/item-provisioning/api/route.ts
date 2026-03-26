/**
 * @file OpenAPI route definition for item creation API
 *
 * Route metadata is separated from handler logic so request validation,
 * OpenAPI generation, and runtime execution remain decoupled.
 */

import { createRoute } from '@hono/zod-openapi';

import { CreateItemResponseSchema } from './schema';
import { CreateItemInputSchema } from '../core/processors';


/**
 * POST /item/create route contract
 *
 * Response semantics:
 * - 201 means accepted and queued for workflow execution
 * - Persistence and synchronization continue asynchronously
 * - traceId enables status tracking and operational debugging
 */
export const itemProvisioningRoute = createRoute({
    method: 'post',
    path: '/item/create',
    summary: '建立新項目',
    description: '建立一個新項目，並初始化相關資料。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateItemInputSchema
                }
            }
        }
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: CreateItemResponseSchema
                }
            },
            description: '項目建立成功，回傳流程追蹤 ID'
        },
        400: {
            description: '請求格式錯誤'
        }
    }
});
