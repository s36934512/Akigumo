import { createRoute, z } from '@hono/zod-openapi'

export const getThumbnailRoute = createRoute({
    method: 'get',
    path: '/thumbnail/:id',
    summary: '取得縮圖',
    description: '回傳檔案縮圖，若無則現場產生',
    request: {
        params: z.object({ id: z.string().openapi({ description: '檔案 UUID' }) }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.any(),
                }
            },
            description: '縮圖檔案流'
        },
        404: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            },
            description: '找不到縮圖'
        },
    },
})

export const getPageImageRoute = createRoute({
    method: 'get',
    path: '/view/:id/page/:pageNumber',
    summary: '取得特定頁面圖片',
    description: '針對 PDF/Zip，回傳特定頁面的圖片',
    request: {
        params: z.object({
            id: z.uuid().openapi({ description: '檔案 UUID' }),
            pageNumber: z.string().openapi({ description: '頁碼' }),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.any(),
                }
            },
            description: '回傳特定頁面圖片流'
        },
        404: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            },
            description: '找不到頁面'
        },
    },
})

export const downloadFileRoute = createRoute({
    method: 'get',
    path: '/download/:id',
    summary: '安全下載原檔',
    description: '檢查權限後下載原始檔案',
    request: {
        params: z.object({ id: z.uuid().openapi({ description: '檔案 UUID' }) }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.any()
                }
            },
            description: '安全下載原始檔案流'
        },
        403: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            },
            description: '權限不足'
        },
        404: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            },
            description: '找不到檔案'
        },
    },
})
