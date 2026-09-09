import { z } from "@hono/zod-openapi";

import { CommonIdSchema } from "#akigumo/shared/contracts/common.js";

export const StorageInputSchema = z.object({
	fileId: CommonIdSchema.single,
	fileList: CommonIdSchema.array,
});

export const DispatchInputSchema = z.object({
	fileId: CommonIdSchema.single,
	uncompressMaxDepth: z.number().default(3),
	correlationId: CommonIdSchema.single.optional(),
});

export const UncompressInputSchema = z.object({
	fileId: z.uuid(),
	extensionCode: z.string(),
});
