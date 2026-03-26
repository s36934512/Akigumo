import { z } from '@hono/zod-openapi'

/**
 * Item Metadata 基本資訊管理
 * - 用於 item-metadata.routes.ts
 * - 僅處理純文字/純數據資訊
 */
export const ItemMetadataZodSchema = z.object({
    title: z.string().min(1).max(100).openapi({
        description: '標題 (Title)',
        example: '2026 跨年攝影集'
    }),
    alternativeTitle: z.string().max(100).optional().openapi({
        description: '原名 (Alternative Title)',
        example: 'New Year Photo Book'
    }),
    summary: z.string().max(1000).optional().openapi({
        description: '簡介 (Summary)',
        example: '這是在高雄港拍攝的照片...'
    })
});

/**
 * Item State & Analytics Schema
 * - 用於 item-state.routes.ts
 * - 記錄用戶互動狀態
 */
export const ItemProgressZodSchema = z.object({
    progress: z.number().int().min(0).openapi({
        description: '閱讀進度（頁數等）',
        example: 5
    })
});

export const ItemRateZodSchema = z.object({
    rate: z.number().min(1).max(5).openapi({
        description: '評分（1~5）',
        example: 4
    }),
    favorite: z.boolean().optional().openapi({
        description: '是否喜愛',
        example: true
    })
});

export const ItemStatsZodSchema = z.object({
    views: z.number().int().min(0).openapi({
        description: '閱讀次數',
        example: 123
    }),
    lastReadAt: z.string().datetime().optional().openapi({
        description: '最後閱讀時間',
        example: '2026-02-22T12:34:56.000Z'
    })
});
