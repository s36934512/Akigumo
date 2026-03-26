/**
 * @file Payload and result schemas for the FILE_TRANSCODE action
 */

import { z } from '@hono/zod-openapi';

export const TranscodePayloadSchema = z.object({
    fileId: z.uuid(),
    basePath: z.string(),
});
export type TranscodePayload = z.infer<typeof TranscodePayloadSchema>;

export const TranscodeResultSchema = z.object({
    id: z.string(),
    size: z.bigint(),
    checksum: z.string(),
});
export type TranscodeResult = z.infer<typeof TranscodeResultSchema>;
