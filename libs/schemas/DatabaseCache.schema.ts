import { z } from '@hono/zod-openapi'
import { DatabaseCacheCreateInputObjectZodSchema } from 'generated/zod/schemas';

export const DatabaseCacheUpdateBatchVersionObjectSchema = DatabaseCacheCreateInputObjectZodSchema.extend({
    keys: z.array(z.string()),
}).omit({ key: true, value: true })
export type DatabaseCacheUpdateBatchVersion = z.infer<typeof DatabaseCacheUpdateBatchVersionObjectSchema>

export const DatabaseCacheFindUniqueObjectSchema = DatabaseCacheCreateInputObjectZodSchema.pick({
    namespace: true,
    key: true,
}).required();
export type DatabaseCacheFindUnique = z.infer<typeof DatabaseCacheFindUniqueObjectSchema>;

export const DatabaseCacheFindBatchUniqueObjectSchema = DatabaseCacheUpdateBatchVersionObjectSchema.pick({
    namespace: true,
    keys: true,
}).required();
export type DatabaseCacheFindBatchUnique = z.infer<typeof DatabaseCacheFindBatchUniqueObjectSchema>;

export const DatabaseCacheListObjectSchema = DatabaseCacheCreateInputObjectZodSchema.extend({
    limit: z.number().int().min(1).optional().default(100),
    version: z.number().optional().default(0),
}).omit({ key: true, value: true });
export type DatabaseCacheList = z.infer<typeof DatabaseCacheListObjectSchema>;