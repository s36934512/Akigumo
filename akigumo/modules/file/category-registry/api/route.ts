/**
 * @file OpenAPI route contract for file category registry
 *
 * Route metadata is isolated from runtime logic so validation and generated
 * documentation stay consistent as handlers evolve.
 */

import { createRoute, z } from '@hono/zod-openapi';
import { FileCategoryModelSchema } from 'generated/zod/schemas';


/**
 * Request schema for creating file categories
 *
 * We keep the shape minimal (`code`, `name`, `description`) because category
 * rows are reference data and should remain stable and easy to validate.
 */
export const CreateFileCategoryRequestSchema = z.object({
    code: z.string().min(1, '分類代碼不能為空').openapi({
        description: '分類代碼，例如 IMAGE、VIDEO、DOC',
        example: 'IMAGE'
    }),
    name: z.string().min(1, '分類名稱不能為空').openapi({
        description: '分類名稱',
        example: '圖片'
    }),
    description: z.string().optional().openapi({
        description: '分類描述',
        example: '圖片類型檔案'
    }),
}).openapi({ description: '新增檔案分類資料' });

/**
 * TypeScript type inferred from request schema
 */
export type CreateFileCategoryRequest = z.infer<typeof CreateFileCategoryRequestSchema>;

/**
 * Response schema for created category
 *
 * The relation field `extensions` is omitted to keep response payload compact
 * and avoid accidental N+1 style nested expansion in create endpoints.
 */
export const CreateFileCategoryResponseSchema = FileCategoryModelSchema.omit({
    extensions: true,
}).openapi({
    description: '新增檔案分類結果'
});

/**
 * TypeScript type inferred from response schema
 */
export type CreateFileCategoryResponse = z.infer<typeof CreateFileCategoryResponseSchema>;

/**
 * POST /file/category/create route contract
 *
 * This contract is intentionally isolated from handler logic so request schema,
 * OpenAPI generation, and runtime implementation can evolve independently.
 */
export const categoryRegistryRoute = createRoute({
    method: 'post',
    path: '/file/category/create',
    summary: '新增檔案分類',
    description: '新增一筆檔案分類設定（FileCategory）。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateFileCategoryRequestSchema
                }
            }
        }
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: CreateFileCategoryResponseSchema
                }
            },
            description: '檔案分類新增成功，回傳建立的資料'
        },
        400: {
            description: '請求格式錯誤'
        },
        409: {
            description: '檔案分類代碼已存在'
        },
        500: {
            description: '伺服器內部錯誤'
        }
    }
});
