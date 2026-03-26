/**
 * @file OpenAPI route contract for file extension registry
 *
 * Contract-first route definitions keep generated docs and runtime validation
 * aligned while allowing handler logic to change independently.
 */

import { createRoute } from '@hono/zod-openapi';

import {
    CreateFileExtensionRequestSchema,
    CreateFileExtensionResponseSchema
} from '../schema';

/**
 * POST /file/extension/create route contract
 *
 * Keeping route metadata separate from the handler gives us a single source
 * for validation and OpenAPI output while preserving handler simplicity.
 */
export const extensionRegistryRoute = createRoute({
    method: 'post',
    path: '/file/extension/create',
    summary: '新增副檔名',
    description: '新增一筆副檔名設定（FileExtension），並關聯至指定的分類。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateFileExtensionRequestSchema
                }
            }
        }
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: CreateFileExtensionResponseSchema
                }
            },
            description: '副檔名新增成功，回傳建立的資料'
        },
        400: {
            description: '請求格式錯誤'
        },
        409: {
            description: '副檔名代碼已存在'
        },
        500: {
            description: '伺服器內部錯誤'
        }
    }
});
