import { z } from "@hono/zod-openapi";

import { ArchiveSchema } from "#akigumo/shared/schemas/archive/index.js";
import { PatchOperateSchema } from "#akigumo/shared/schemas/sse.js";

export const ExtendedItemStatusSchema = z.enum([
	"ONGOING",
	"COMPLETED",
	"HIATUS",
	"UPCOMING",
	"DRAFT",
	"PRIVATE",
	"ACTIVE",
	"ARCHIVED",
	"LOCKED",
	"HIDDEN",
	"PROCESSING",
	"DELETED",
	"FAILED",
	"NORMAL",
	"HIDDEN",
	"DELETED",
]);

/**
 * 最終對外輸出的索引條目
 */
export const IndexEntrySchema = ArchiveSchema;
export type IndexEntry = z.infer<typeof IndexEntrySchema>;

/**
 * 增量更新指令 (SSE)
 */
export const IndexEntryPatchSchema = z
	.object({
		op: PatchOperateSchema.openapi({ description: "操作型別" }),
		id: z.uuid().openapi({ description: "目標 ID" }),
		entry: IndexEntrySchema.optional().openapi({
			description: "詳細資料包",
		}),
	})
	.openapi("IndexEntryPatch");

export type IndexEntryPatch = z.infer<typeof IndexEntryPatchSchema>;
