import { z } from '@hono/zod-openapi'
import { FileCategoryCreateInputObjectZodSchema, FileExtensionCreateInputObjectZodSchema } from "generated/zod/schemas";

const FileCategoryCreateInput = FileCategoryCreateInputObjectZodSchema.extend({
    extensions: FileExtensionCreateInputObjectZodSchema.pick({
        code: true,
        mimeType: true,
        name: true,
        description: true,
    }).array(),
})

export type FileCategoryCreateInput = z.infer<typeof FileCategoryCreateInput>;

export const FILE_CATEGORY_DEFS: Record<string, FileCategoryCreateInput> = {
    IMAGE: {
        code: 'IMAGE',
        name: '圖片',
        description: '各式圖片檔案',
        extensions: [
            { code: 'jpg', mimeType: 'image/jpeg', name: 'JPEG 圖片' },
            { code: 'jpeg', mimeType: 'image/jpeg', name: 'JPEG 圖片' },
            { code: 'png', mimeType: 'image/png', name: 'PNG 圖片' },
            { code: 'gif', mimeType: 'image/gif', name: 'GIF 圖片' },
            { code: 'svg', mimeType: 'image/svg+xml', name: 'SVG 向量圖' },
            { code: 'webp', mimeType: 'image/webp', name: 'WebP 圖片' },
        ],
    },
    DOCUMENT: {
        code: 'DOCUMENT',
        name: '文件',
        description: '文書處理與 PDF',
        extensions: [
            { code: 'pdf', mimeType: 'application/pdf', name: 'PDF 文件' },
            { code: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Word 文件' },
            { code: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'Excel 試算表' },
            { code: 'pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', name: 'PowerPoint 簡報' },
            { code: 'txt', mimeType: 'text/plain', name: '純文字文件' },
        ],
    },
    VIDEO: {
        code: 'VIDEO',
        name: '影片',
        description: '動態影像檔案',
        extensions: [
            { code: 'mp4', mimeType: 'video/mp4', name: 'MP4 影片' },
            { code: 'mov', mimeType: 'video/quicktime', name: 'MOV 影片' },
            { code: 'avi', mimeType: 'video/x-msvideo', name: 'AVI 影片' },
            { code: 'mkv', mimeType: 'video/x-matroska', name: 'MKV 影片' },
        ],
    },
    AUDIO: {
        code: 'AUDIO',
        name: '音訊',
        description: '聲音與音樂檔案',
        extensions: [
            { code: 'mp3', mimeType: 'audio/mpeg', name: 'MP3 音訊' },
            { code: 'wav', mimeType: 'audio/wav', name: 'WAV 音訊' },
            { code: 'ogg', mimeType: 'audio/ogg', name: 'OGG 音訊' },
            { code: 'm4a', mimeType: 'audio/mp4', name: 'M4A 音訊' },
        ],
    },
    ARCHIVE: {
        code: 'ARCHIVE',
        name: '壓縮檔',
        description: '打包與壓縮格式',
        extensions: [
            { code: 'zip', mimeType: 'application/zip', name: 'ZIP 壓縮檔' },
            { code: 'rar', mimeType: 'application/vnd.rar', name: 'RAR 壓縮檔' },
            { code: '7z', mimeType: 'application/x-7z-compressed', name: '7Z 壓縮檔' },
            { code: 'tar', mimeType: 'application/x-tar', name: 'TAR 壓縮檔' },
            { code: 'gz', mimeType: 'application/gzip', name: 'GZ 壓縮檔' },
        ],
    },
    OTHER: {
        code: 'OTHER',
        name: '其他',
        description: '二進位檔或無法辨識的格式',
        extensions: [
            {
                code: 'bin',
                mimeType: 'application/octet-stream',
                name: '二進位檔案',
                description: '通用二進位資料格式'
            },
            {
                code: 'exe',
                mimeType: 'application/x-msdownload',
                name: '執行檔'
            }
        ],
    },
}

export const FILE_CATEGORIES = Object.fromEntries(
    Object.entries(FILE_CATEGORY_DEFS).map(([key, val]) => [key, val.code])
) as { [K in keyof typeof FILE_CATEGORY_DEFS]: typeof FILE_CATEGORY_DEFS[K]['code'] };