import { z } from '@hono/zod-openapi'

export const FileIntentSchema = z.object({
    fileId: z.uuid(),
});
export type FileIntent = z.infer<typeof FileIntentSchema>;

export const FileCreateSchema = z.object({
    fileId: z.uuid(),
    originalName: z.string(),
    size: z.bigint().positive(),
    checksum: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    mimeType: z.string().optional(),
});
export type FileCreate = z.infer<typeof FileCreateSchema>;

export const FileBindSchema = z.object({
    fileId: z.uuid(),
    itemId: z.uuid(),
});
export type FileBind = z.infer<typeof FileBindSchema>;

export const FileMetaSchema = z.object({
    physicalPath: z.string().nullable(),
    systemName: z.string().nullable(),
    mimeType: z.string(),
});
export type FileMeta = z.infer<typeof FileMetaSchema>;