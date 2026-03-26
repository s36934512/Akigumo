import { z } from '@hono/zod-openapi'

// 檔案列表查詢
export const FileListRequest = z.object({
    page: z.number().int().min(1).default(1).openapi({ description: '頁碼' }),
    pageSize: z.number().int().min(1).max(100).default(20).openapi({ description: '每頁筆數' }),
    search: z.string().optional().openapi({ description: '搜尋關鍵字' }),
    tags: z.array(z.string()).optional().openapi({ description: '標籤篩選' }),
})
export type FileListRequest = z.infer<typeof FileListRequest>

export const FileListResponse = z.object({
    files: z.array(z.object({
        id: z.uuid().openapi({ description: '檔案 UUID' }),
        filename: z.string().openapi({ description: '檔名' }),
        tags: z.array(z.string()).openapi({ description: '標籤' }),
        uploadedAt: z.string().openapi({ description: '上傳時間 (ISO)' }),
        resolution: z.string().optional().openapi({ description: '解析度' }),
    })).openapi({ description: '檔案清單' }),
    total: z.number().int().openapi({ description: '總筆數' }),
})
export type FileListResponse = z.infer<typeof FileListResponse>

// 單檔案查詢
export const FileDetailResponse = z.object({
    id: z.uuid().openapi({ description: '檔案 UUID' }),
    filename: z.string().openapi({ description: '檔名' }),
    tags: z.array(z.string()).openapi({ description: '標籤' }),
    uploadedAt: z.string().openapi({ description: '上傳時間 (ISO)' }),
    resolution: z.string().optional().openapi({ description: '解析度' }),
    metadata: z.record(z.string(), z.any()).optional().openapi({ description: '自定義 metadata' }),
})
export type FileDetailResponse = z.infer<typeof FileDetailResponse>

// 編輯檔案
export const FileEditRequest = z.object({
    filename: z.string().optional().openapi({ description: '新檔名' }),
    tags: z.array(z.string()).optional().openapi({ description: '新標籤' }),
    category: z.string().optional().openapi({ description: '新分類' }),
})
export type FileEditRequest = z.infer<typeof FileEditRequest>

export const FileEditResponse = z.object({
    success: z.boolean().openapi({ description: '是否成功' }),
})
export type FileEditResponse = z.infer<typeof FileEditResponse>

// 刪除檔案
export const FileDeleteResponse = z.object({
    success: z.boolean().openapi({ description: '是否成功' }),
})
export type FileDeleteResponse = z.infer<typeof FileDeleteResponse>
