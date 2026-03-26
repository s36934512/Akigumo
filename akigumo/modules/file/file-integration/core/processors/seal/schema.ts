/**
 * @file Payload and result schemas for the FILE_SEAL action
 */

import { z } from '@hono/zod-openapi';

export const StrategySchema = z.object({
    shouldUncompress: z.boolean(),
    shouldTranscode: z.boolean(),
});

export const SealFilePayloadSchema = z.object({
    fileId: z.uuid(),
    fileName: z.string(),
    checksum: z.string(),
    basePath: z.string(),
});
export type SealFilePayload = z.infer<typeof SealFilePayloadSchema>;

export const ProbeResultSchema = z.object({
    extensionId: z.number(),
    mimeType: z.string(),
    categoryCode: z.string(),
});
export type ProbeResult = z.infer<typeof ProbeResultSchema>;

export const SealFileResultSchema = z.object({
    fileId: z.uuid(),
    strategy: StrategySchema,
    mimeType: z.string(),
    fileCategory: z.string(),
    basePath: z.string(),
});
export type SealFileResult = z.infer<typeof SealFileResultSchema>;
