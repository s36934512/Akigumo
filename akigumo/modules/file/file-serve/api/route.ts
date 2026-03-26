import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';

export const fileServeRoute = createRoute({
    method: 'get',
    path: '/files/:fileId/serve',
    summary: '讀取檔案原始內容',
    description:
        '以 fileId 從磁碟讀取原始檔案，回傳 binary content 與正確的 Content-Type。' +
        '圖片類型可直接作為 <img src="..."> 使用。',
    request: {
        params: z.object({
            fileId: z.uuid().openapi({ description: '檔案 UUID' }),
        }),
    },
    responses: {
        200: {
            content: { 'application/octet-stream': { schema: z.any() } },
            description: 'Binary file content',
        },
        404: {
            content: { 'application/json': { schema: z.object({ error: z.string() }) } },
            description: 'File not found or not accessible',
        },
    },
});
