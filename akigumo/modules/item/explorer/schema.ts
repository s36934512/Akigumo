import { z } from '@hono/zod-openapi';
import { ItemTypeSchema } from 'generated/zod/schemas';

export const ExplorerItemSchema = z.object({
    id: z.uuid().openapi({ description: '項目 UUID' }),
    types: z.array(ItemTypeSchema).openapi({ description: '項目類型' }),
    position: z.number().openapi({ description: '在當前層級的排序權重 (Neo4j r.order)' }),
}).openapi('ExplorerItem');

export type ExplorerItem = z.infer<typeof ExplorerItemSchema>;

export const GetStructureFromNeo4jSchema = z.object({
    parentId: z.uuid().optional().openapi({ description: '父節點 ID，省略則為頂層' }),
    showDeleted: z.boolean().default(false).openapi({ description: '是否顯示已刪除項目' }),
}).openapi('GetStructureFromNeo4j');

export type GetStructureFromNeo4j = z.infer<typeof GetStructureFromNeo4jSchema>;


export const BrowseExplorerRequestSchema = GetStructureFromNeo4jSchema.extend({
    notifyUploadId: z.uuid().openapi({ description: 'SSE 連線 ID，用於觸發內容補全' }),
}).openapi('BrowseExplorerRequest');

export type BrowseExplorerRequest = z.infer<typeof BrowseExplorerRequestSchema>;


export const BrowseExplorerResponseSchema = z.object({
    items: z.array(ExplorerItemSchema),
    breadcrumbs: z.array(z.object({
        id: z.uuid(),
        name: z.string(),
    })).openapi({ description: '導覽路徑' }),
}).openapi('BrowseExplorerResponse');

export type BrowseExplorerResponse = z.infer<typeof BrowseExplorerResponseSchema>;
