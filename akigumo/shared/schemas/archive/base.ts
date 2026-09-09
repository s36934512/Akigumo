import { z } from "@hono/zod-openapi";

import { ItemTypeSchema } from "#generated/zod/schemas/index.js";

export const ItemFlagsSchema = z.object({
	isPinned: z.boolean(),
	isHidden: z.boolean(),
	isDeleted: z.boolean(),
});

export const BaseArchiveSchema = z.object({
	type: ItemTypeSchema.openapi({ description: "項目類型" }),

	id: z.uuid().openapi({ description: "項目 UUID" }),
	name: z.string().openapi({ description: "項目名稱" }),

	flag: ItemFlagsSchema,
	createdAt: z.number().openapi({ description: "建立時間 (ms)" }),
	updatedAt: z.number().openapi({ description: "更新時間 (ms)" }),

	conceptIds: z.uuid().array().nullish(),
	parentId: z.uuid().optional(),
});
