import { z } from '@hono/zod-openapi';

/**
 * Processor input: array of item IDs to upsert into MeiliSearch.
 * Validated at dispatch time so invalid payloads fail fast in task.factory.
 */
export const UpsertIndexPayloadSchema = z.array(z.uuid()).min(1);
export type UpsertIndexPayload = z.infer<typeof UpsertIndexPayloadSchema>;

/**
 * Shape of each document stored in the 'items' MeiliSearch index.
 * Timestamps are stored as epoch milliseconds for efficient sorting.
 */
export const ItemSearchDocSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    status: z.string(),
    metadata: z.record(z.string(), z.any()).default({}),
    publishedTime: z.number().nullable(),
    createdTime: z.number(),
    modifiedTime: z.number(),
});
export type ItemSearchDoc = z.infer<typeof ItemSearchDocSchema>;

/** Search API request body */
export const SearchRequestSchema = z.object({
    q: z.string().default('').openapi({ description: '搜尋關鍵字，空字串回傳所有結果' }),
    filter: z.string().optional().openapi({ description: 'MeiliSearch 過濾語法，例如 type = "WORK"' }),
    limit: z.number().int().min(1).max(100).default(20).openapi({ description: '每頁筆數' }),
    offset: z.number().int().min(0).default(0).openapi({ description: '分頁位移' }),
}).openapi('SearchRequest');

/** Single search result hit */
export const SearchHitSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    status: z.string(),
    metadata: z.record(z.string(), z.any()),
    publishedTime: z.number().nullable(),
    createdTime: z.number(),
    modifiedTime: z.number(),
}).openapi('SearchHit');

/** Search API response */
export const SearchResponseSchema = z.object({
    hits: z.array(SearchHitSchema),
    total: z.number().openapi({ description: '估計總筆數' }),
    limit: z.number(),
    offset: z.number(),
}).openapi('SearchResponse');
