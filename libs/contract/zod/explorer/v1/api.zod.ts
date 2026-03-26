import { z } from '@hono/zod-openapi'
import { create } from 'node:domain';

// GetIndexRequest.ViewMode enum
export const ViewMode = z.enum(["VIEW_MODE_NORMAL", "VIEW_MODE_TRASH", "VIEW_MODE_ALL"]).openapi({
    description: '檢視模式 (0:正常, 1:垃圾桶, 2:全部)'
});
export type ViewMode = z.infer<typeof ViewMode>;

// GetIndexRequest.scope oneof
export const GetIndexScope = z.union([
    z.object({
        is_home: z.boolean().openapi({ description: '根目錄' })
    }),
    z.object({
        item_id: z.uuid().openapi({ description: '特定 item 的 UUID (可為垃圾桶內)' })
    })
]).openapi({ description: '目錄範圍 (根目錄或特定 item)' });
export type GetIndexScope = z.infer<typeof GetIndexScope>;

// GetIndexRequest
export const GetIndexRequest = z.object({
    scope: GetIndexScope.openapi({ description: '在哪個目錄下 (物理/邏輯範圍)' }),
    view_mode: ViewMode.openapi({ description: '檢視模式' }),
    include_hidden: z.boolean().optional().openapi({ description: '是否包含隱藏項' }),
    last_sync_token: z.string().optional().openapi({ description: '同步機制用 token' })
}).openapi({ description: '取得目錄索引的請求' });
export type GetIndexRequest = z.infer<typeof GetIndexRequest>;

// IndexEntry
export const IndexEntry = z.object({
    id: z.uuid().openapi({ description: '索引項目 UUID' }),
    type: z.enum(['WORK', 'SERIES', 'COLLECTION', 'FILE_CONTAINER']).openapi({ description: '項目類型' }),
    name: z.string().openapi({ description: '項目名稱' }),

    is_deleted: z.boolean().optional().openapi({ description: '是否已刪除' }),
    is_hidden: z.boolean().optional().openapi({ description: '是否隱藏' }),
    is_generated: z.boolean().optional().openapi({ description: '是否為自動產生' }),
    is_pinned: z.boolean().optional().openapi({ description: '是否置頂' }),

    created_at: z.number().openapi({ description: '使用者建立日期' }),
    updated_at: z.number().openapi({ description: '使用者更新日期' }),
    published_at: z.number().optional().openapi({ description: '內容發布日期' }),

    pages: z.number().optional().openapi({ description: '總頁數 (只有檔案類有值)' }),
    count: z.number().optional().openapi({ description: '內容數量 (只有容器類有值)' }),
    position: z.number().optional().openapi({ description: '自訂排序權重' }),
    tags: z.array(z.uuid()).optional().openapi({ description: '標籤清單' }),

    metadata: z.record(z.string(), z.any()).default({}).openapi({
        description: '擴充屬性，根據 type 不同存放不同資訊 (例如解析度、ISBN 等)',
        example: { mimeType: "image/png", resolution: "4K" }
    }),
}).openapi({ description: '索引條目 (排序與類型判斷)' });
export type IndexEntry = z.infer<typeof IndexEntry>;

// IndexResponse
export const IndexResponse = z.object({
    entries: z.array(IndexEntry).openapi({ description: '索引條目清單' }),
    total_count: z.number().openapi({ description: '總筆數 (顯示進度條用)' })
}).openapi({ description: '索引條目清單 (MessagePack 格式)' });
export type IndexResponse = z.infer<typeof IndexResponse>;

// BatchFetchRequest
export const BatchFetchRequest = z.object({
    item_ids: z.array(z.uuid()).openapi({ description: '要查詢的 item UUID 清單' }),
    file_ids: z.array(z.uuid()).openapi({ description: '要查詢的 file UUID 清單' })
}).openapi({ description: '批量詳細資料請求' });
export type BatchFetchRequest = z.infer<typeof BatchFetchRequest>;

// ItemDetail
export const ItemDetail = z.object({
    id: z.uuid().openapi({ description: 'Item UUID' }),
    name: z.string().openapi({ description: 'Item 名稱' })
}).openapi({ description: 'Item 詳細資料' });
export type ItemDetail = z.infer<typeof ItemDetail>;

// FileDetail
export const FileDetail = z.object({
    id: z.uuid().openapi({ description: 'File UUID' }),
    name: z.string().openapi({ description: 'File 名稱' })
}).openapi({ description: 'File 詳細資料' });
export type FileDetail = z.infer<typeof FileDetail>;

// BatchFetchResponse
export const BatchFetchResponse = z.object({
    items: z.array(ItemDetail).openapi({ description: '查詢到的 item 詳細資料' }),
    files: z.array(FileDetail).openapi({ description: '查詢到的 file 詳細資料' }),
    not_found_ids: z.array(z.uuid()).openapi({ description: '查無資料的 UUID 清單' })
}).openapi({ description: '批量詳細資料回應' });
export type BatchFetchResponse = z.infer<typeof BatchFetchResponse>;
