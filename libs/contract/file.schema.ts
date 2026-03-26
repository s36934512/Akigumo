import { z } from '@hono/zod-openapi'

export const FileSchema = z.object({
    id: z.uuid(),
    name: z.string().openapi({ example: 'photo.jpg' }),
    url: z.url(),
    mimeType: z.string().openapi({ example: 'image/jpeg' }),
    size: z.number().int().optional().openapi({ description: '檔案大小(bytes)' }),
}).openapi('File')

// 未歸屬檔案的回應格式
export const OrphanFileResponseSchema = FileSchema.extend({
    kind: z.literal('FILE'),
}).openapi('OrphanFile')