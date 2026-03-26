/**
 * @file OpenAPI schemas for file extension registry
 *
 * A dedicated schema layer keeps HTTP boundary validation explicit and
 * prevents handler code from duplicating data shape assumptions.
 */

import { z } from '@hono/zod-openapi';
import { FileExtensionModelSchema } from 'generated/zod/schemas';

/**
 * Request schema for creating file extensions
 *
 * Category linkage allows either `categoryId` or `categoryCode` to support
 * different caller contexts without duplicating endpoints.
 */
export const CreateFileExtensionRequestSchema = z.object({
    code: z.string().min(1, '副檔名不能為空').openapi({
        description: '副檔名代碼，例如 jpg、png、pdf',
        example: 'jpg'
    }),
    mimeType: z.string().optional().openapi({
        description: 'MIME 類型',
        example: 'image/jpeg'
    }),
    name: z.string().optional().openapi({
        description: '副檔名顯示名稱',
        example: 'JPEG 圖片'
    }),
    description: z.string().optional().openapi({
        description: '描述說明',
        example: '常見的有損壓縮圖片格式'
    }),
    categoryId: z.number().int().positive().optional().openapi({
        description: '所屬分類 ID（與 categoryCode 擇一提供）',
        example: 1
    }),
    categoryCode: z.string().min(1).optional().openapi({
        description: '所屬分類代碼（與 categoryId 擇一提供），例如 IMAGE、VIDEO、DOC',
        example: 'IMAGE'
    }),
}).refine(
    (data) => data.categoryId !== undefined || data.categoryCode !== undefined,
    { message: '必須提供 categoryId 或 categoryCode 其中一個', path: ['categoryId'] }
).openapi({ description: '新增副檔名資料' });

/**
 * TypeScript type inferred from request schema
 */
export type CreateFileExtensionRequest = z.infer<typeof CreateFileExtensionRequestSchema>;

/**
 * Response schema for created extension
 *
 * Relational fields are omitted to keep create responses lightweight and avoid
 * over-fetching relation data at write time.
 */
export const CreateFileExtensionResponseSchema = FileExtensionModelSchema.omit({
    files: true,
    category: true,
}).openapi({
    description: '新增副檔名結果'
});

/**
 * TypeScript type inferred from response schema
 */
export type CreateFileExtensionResponse = z.infer<typeof CreateFileExtensionResponseSchema>;
