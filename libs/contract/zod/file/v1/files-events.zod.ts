import { z } from '@hono/zod-openapi'

export const FileEvent = z.object({
    fileId: z.uuid().openapi({ description: '檔案 UUID' }),
    event: z.enum([
        'thumbnailGenerated',
        'processingFailed',
        'processingStarted',
        'processingCompleted',
    ]).openapi({ description: '事件類型' }),
    message: z.string().optional().openapi({ description: '訊息' }),
    progress: z.number().min(0).max(100).optional().openapi({ description: '進度百分比' }),
})
export type FileEvent = z.infer<typeof FileEvent>
