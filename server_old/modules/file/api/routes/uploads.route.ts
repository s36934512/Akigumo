import { createRoute, z } from '@hono/zod-openapi'
import { InitUploadRequest, InitUploadResponse, SealUploadRequest } from 'libs/contract/zod/file/v1/uploads.zod'

export const uploadStartRoute = createRoute({
    method: 'post',
    path: '/start',
    security: [{ bearerAuth: [] }],
    summary: '初始化上傳',
    description: '檢查權限、接收 metadata，回傳 uploadId',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: InitUploadRequest
                }
            }
        }
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: InitUploadResponse
                }
            },
            description: '上傳初始化成功回應'
        },
        400: {
            description: '請求格式錯誤 (例如缺少 sessionId)'
        }
    },
})

export const uploadSealRoute = createRoute({
    method: 'post',
    path: '/seal',
    summary: '批次結算',
    description: '記錄批次資訊，回傳成功結果',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: SealUploadRequest
                }
            },
            description: '批次結算請求，包含 batchID 與 totalFiles'
        }
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({ success: z.boolean() })
                }
            },
            description: '批次結算成功回應'
        },
        400: {
            description: '請求格式錯誤 (例如缺少 batchID 或 totalFiles)'
        }
    },
})
