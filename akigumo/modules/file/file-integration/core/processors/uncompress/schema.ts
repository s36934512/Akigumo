/**
 * @file Payload and result schemas for the FILE_UNCOMPRESS action
 */

import { z } from '@hono/zod-openapi';

// fileId identifies the per-file process workspace under tmp/process/{fileId}.
export const UncompressPayloadSchema = z.object({
    fileId: z.uuid(),
});
export type UncompressPayload = z.infer<typeof UncompressPayloadSchema>;

// extractedFiles are relative paths under outputDir to keep the payload portable.
export const UncompressResultSchema = z.object({
    fileId: z.uuid(),
    outputDir: z.string(),
    extractedFiles: z.array(z.string()),
});
export type UncompressResult = z.infer<typeof UncompressResultSchema>;
