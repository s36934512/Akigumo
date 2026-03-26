import { z } from '@hono/zod-openapi'

export const FileContentMeta = z.object({
    fileId: z.uuid().openapi({ description: '檔案 UUID' }),
    type: z.enum(['thumbnail', 'page', 'original']).openapi({ description: '內容類型' }),
    pageNumber: z.number().int().optional().openapi({ description: '頁碼 (如適用)' }),
    filename: z.string().openapi({ description: '檔名' }),
    mimeType: z.string().openapi({ description: 'MIME 類型' }),
    size: z.number().int().openapi({ description: '檔案大小 (byte)' }),
})
export type FileContentMeta = z.infer<typeof FileContentMeta>
