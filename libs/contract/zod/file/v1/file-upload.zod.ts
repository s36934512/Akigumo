import { z } from '@hono/zod-openapi'

export const FileUploadMachineInputSchema = z.object({
    userId: z.uuid().openapi({ description: '使用者 ID' }),
    sessionId: z.uuid().openapi({ description: '使用者 Session ID' }),
    fileSize: z.number().openapi({ description: '檔案大小 (bytes)' }),
    fileName: z.string().openapi({ description: '原始檔名' }),
    mimetype: z.string().openapi({ description: '檔案 MIME 類型' }),
    metadata: z.any().optional().openapi({ description: '自訂 metadata' }),
}).openapi('FileUploadMachineInput')
export type FileUploadMachineInput = z.infer<typeof FileUploadMachineInputSchema>

export const FileUploadContextSchema = FileUploadMachineInputSchema.extend({
    fileId: z.uuid().nullable().openapi({ description: '建立 Placeholder 後存回來的檔案 ID' }),
    error: z.string().nullable().openapi({ description: '錯誤訊息' }),
}).openapi('FileUploadContext')
export type FileUploadContext = z.infer<typeof FileUploadContextSchema>

export const CheckDiskSpaceInputSchema = z.object({
    fileSize: z.number().openapi({ description: '檔案大小' }),
}).openapi('CheckDiskSpaceInput')
export type CheckDiskSpaceInput = z.infer<typeof CheckDiskSpaceInputSchema>

export const FilePlaceholderSchema = z.object({
    fileId: z.uuid().openapi({ description: '檔案 ID' }),
    originalName: z.string().optional().nullable(),
    size: z.bigint().optional().nullable(),
    checksum: z.string().optional().nullable(),
}).openapi('FilePlaceholder')
export type FilePlaceholder = z.infer<typeof FilePlaceholderSchema>
