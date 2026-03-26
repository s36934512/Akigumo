import { z } from '@hono/zod-openapi'

// 初始化上傳
export const InitUploadRequest = z.object({
    filename: z.string().openapi({ description: '檔名' }),
    size: z.number().int().positive().openapi({ description: '檔案大小 (byte)' }),
    mimeType: z.string().openapi({ description: 'MIME 類型' }),
    metadata: z.record(z.string(), z.any()).optional().openapi({ description: '自定義 metadata' }),
})
export type InitUploadRequest = z.infer<typeof InitUploadRequest>

export const InitUploadResponse = z.object({
    uploadId: z.string().openapi({ description: '上傳識別碼' }),
    allowed: z.boolean().openapi({ description: '是否允許上傳' }),
    reason: z.string().optional().openapi({ description: '拒絕原因' }),
})
export type InitUploadResponse = z.infer<typeof InitUploadResponse>

export const SealUploadRequest = z.object({
    batchID: z.string().openapi({ description: '批次識別碼' }),
    totalFiles: z.number().int().openapi({ description: '批次檔案數量' }),
})
export type SealUploadRequest = z.infer<typeof SealUploadRequest>
