import { z } from '@hono/zod-openapi';
import { ItemTypeSchema } from 'generated/zod/schemas';

/**
 * 最終對外輸出的索引條目
 */
export const IndexEntrySchema = z.object({
    id: z.uuid().openapi({ description: '項目 UUID' }),
    type: ItemTypeSchema.openapi({ description: '項目類型' }),
    name: z.string().openapi({ description: '項目名稱' }),

    // 狀態與標記
    status: z.enum(['NORMAL', 'HIDDEN', 'DELETED']).openapi({ description: '項目狀態' }),
    isPinned: z.boolean().default(false),

    // 時間戳記 (使用毫秒數方便前端處理)
    createdAt: z.number().openapi({ description: '建立時間 (ms)' }),
    updatedAt: z.number().openapi({ description: '更新時間 (ms)' }),

    // 內容統計
    pages: z.number().optional().openapi({ description: '總頁數' }),
    count: z.number().optional().openapi({ description: '包含的子項目數量' }),

    // 顯示資訊 (核心)
    coverUrl: z.string().nullable().openapi({ description: '封面圖片 URL' }),
    displayAs: z.enum(['DISPLAY_AS', 'CONTAINS', 'AUTO_DETECT']).nullable(),

    // 擴充屬性
    tags: z.array(z.uuid()).default([]),
    metadata: z.record(z.string(), z.any()).optional(),
}).openapi('IndexEntry');

export type IndexEntry = z.infer<typeof IndexEntrySchema>;

/**
 * 增量更新指令 (SSE)
 */
export const IndexEntryPatchSchema = z.object({
    op: z.enum(['UPSERT', 'DELETE']).openapi({ description: '操作型別' }),
    id: z.uuid().openapi({ description: '目標 ID' }),
    entry: IndexEntrySchema.optional().openapi({ description: '詳細資料包' }),
}).openapi('IndexEntryPatch');

export type IndexEntryPatch = z.infer<typeof IndexEntryPatchSchema>;


const ItemFileInfoSchema = z.object({
    fileId: z.uuid().nullable(),
    coverUrl: z.string().nullable(),
    displayAs: z.enum(['DISPLAY_AS', 'CONTAINS', 'AUTO_DETECT']).nullable(),
}).openapi('ItemFileInfo');

export type ItemFileInfo = z.infer<typeof ItemFileInfoSchema>;


export const ToItemIndexEntry = z.object({
    // 基礎 Item 欄位
    id: z.string(),
    name: z.string(),
    type: z.any(),
    status: z.string(),
    createdTime: z.date(),
    modifiedTime: z.date(),
    metadata: z.any().optional(),

    // 外部注入的 Neo4j 資訊
    neo4j: ItemFileInfoSchema.optional(),
}).transform((row): IndexEntry => {
    const meta = row.metadata || {};

    return {
        id: row.id,
        type: row.type,
        name: row.name,
        status: row.status as any,
        isPinned: !!meta.is_pinned,
        createdAt: row.createdTime.getTime(),
        updatedAt: row.modifiedTime.getTime(),
        pages: meta.pages,
        count: meta.count,

        // 優先使用 Neo4j 算出來的封面
        coverUrl: row.neo4j?.coverUrl || (row.neo4j?.fileId ? `/api/v1/files/${row.neo4j.fileId}/serve` : null),
        displayAs: row.neo4j?.displayAs || null,

        tags: meta.tags || [],
        metadata: meta,
    };
});