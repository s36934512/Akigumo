import { z } from '@hono/zod-openapi';

export const SyncIntentFileSchema = z.object({
    fileId: z.uuid(),
    fileName: z.string().optional(),
    path: z.string().optional(),
});

export const SyncIntentToGraphPayloadSchema = z.object({
    files: z.array(SyncIntentFileSchema),
});

export type SyncIntentToGraphPayload = z.infer<typeof SyncIntentToGraphPayloadSchema>;
