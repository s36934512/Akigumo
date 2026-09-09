import { z } from "@hono/zod-openapi";

import {
	CommonIdSchema,
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/index.js";
import { BaseResponseSchema } from "#akigumo/shared/schemas/api.schema.js";

export const IntentFileSchema = createFlexibleSchema(
	z.object({
		name: z.string(),
		size: z.coerce.bigint().pipe(z.bigint().positive()),
		checksum: z.string().optional(),
		metadata: z
			.object({
				tempScanId: z.uuid(),
			})
			.catchall(z.unknown()),
	}),
);
export type IntentFile = InferFlexible<typeof IntentFileSchema>;

export const ArchiveIntentSchema = createFlexibleSchema(
	z.object({
		notifyId: z.uuid(), // SSE通知頻道
		batchId: z.uuid(), // 批次ID，用於上傳流程workflow的追蹤與管理
		fileList: IntentFileSchema.array,
	}),
);

export type ArchiveIntent = InferFlexible<typeof ArchiveIntentSchema>;

export const IntentRequestSchema = ArchiveIntentSchema.single;

export const IntentResponseSchema = BaseResponseSchema;

export const ArchiveSealSchema = createFlexibleSchema(
	z.object({
		fileId: CommonIdSchema.single.openapi({
			example: "019ce974-70b1-7b43-9be1-79e9579f7b12",
		}),
		checksum: z.string().openapi({
			example:
				"d3c617d9527eb9c0c6297e60319aef64c022059a47dfbfdef92ab45464720016",
		}),
		fileName: z.string().openapi({
			example: "HApnFc4bcAAA77i.jpg",
		}),
	}),
);

export type ArchiveSeal = InferFlexible<typeof ArchiveSealSchema>;

export const SealRequestSchema = ArchiveSealSchema.single.extend({
	notifyId: CommonIdSchema.single.openapi({
		example: "123e4567-e89b-12d3-a456-426614174000",
	}),
	batchId: CommonIdSchema.single,
});

export const SealResponseSchema = BaseResponseSchema;
