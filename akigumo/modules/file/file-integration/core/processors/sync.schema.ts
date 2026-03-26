/**
 * @file Payload and result schemas for the FILE_SYNC_NODE action
 */

import { z } from '@hono/zod-openapi';

// labels are reserved for stable graph taxonomy.
// Upload lifecycle is modeled in receiver flow via `uploading` property.
export const SyncFilePayloadSchema = z.array(
    z.object({
        fileId: z.uuid(),
        labels: z.array(z.string()).optional(),
    }),
);
export type SyncFilePayload = z.infer<typeof SyncFilePayloadSchema>;

// Returning an object (not a bare number) leaves room for adding
// per-file details (e.g., failed IDs) without a breaking schema change.
export const SyncFileResultSchema = z.object({
    synced: z.number(),
});
export type SyncFileResult = z.infer<typeof SyncFileResultSchema>;
