import { createRoute, z } from '@hono/zod-openapi'
import { FileListRequest, FileListResponse, FileDetailResponse, FileEditRequest, FileEditResponse, FileDeleteResponse } from 'libs/contract/zod/file/v1/file-manager.zod'

export const fileListRoute = createRoute({
    method: 'get',
    path: '/list',
    summary: '取得檔案列表',
    description: '支援分頁、搜尋、標籤篩選',
    request: {
        query: FileListRequest.openapi({ description: '檔案列表查詢參數' }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: FileListResponse
                }
            },
            description: '檔案列表回應'
        },
        400: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            },
            description: '錯誤訊息'
        },
    },
})

export const fileDetailRoute = createRoute({
    method: 'get',
    path: '/:id',
    summary: '取得單一檔案資訊',
    description: '取得檔案詳細資訊（標籤、上傳時間、解析度）',
    request: {
        params: z.object({ id: z.string().openapi({ description: '檔案 UUID' }) }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: FileDetailResponse
                }
            },
            description: '單一檔案詳細資訊'
        },
        404: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            },
            description: '找不到檔案'
        }
    },
})

export const fileEditRoute = createRoute({
    method: 'patch',
    path: '/:id',
    summary: '編輯檔案',
    description: '編輯檔名、分類、標籤',
    request: {
        body:
        {
            content: {
                'application/json': {
                    schema: FileEditRequest.openapi({ description: '檔案編輯內容' }),
                }
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: FileEditResponse
                }
            },
            description: '編輯結果'
        },
        400: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            },
            description: '錯誤訊息'
        },
    },
})

export const fileDeleteRoute = createRoute({
    method: 'delete',
    path: '/:id',
    summary: '刪除檔案',
    description: '軟/硬刪除檔案',
    request: {
        params: z.object({ id: z.uuid().openapi({ description: '檔案 UUID' }) }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: FileDeleteResponse
                }
            },
            description: '刪除結果'
        },
        400: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            },
            description: '錯誤訊息'
        },
    },
})
