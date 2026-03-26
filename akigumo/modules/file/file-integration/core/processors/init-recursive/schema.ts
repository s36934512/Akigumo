/**
 * @file Payload schema for the FILE_INIT_RECURSIVE action
 */

import { z } from '@hono/zod-openapi';

// Each item bootstraps one child workflow with its own correlationId (fileId)
// and keeps parentId to report completion back to the parent machine.
export const RecursiveUncompressPayloadSchema = z.array(
    z.object({
        fileId: z.uuid(),
        parentId: z.uuid(),
        uncompressMaxDepth: z.number().default(3),
        basePath: z.string(),
    }),
);
export type RecursiveUncompressPayload = z.infer<typeof RecursiveUncompressPayloadSchema>;
