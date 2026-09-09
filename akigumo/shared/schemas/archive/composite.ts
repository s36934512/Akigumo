import { z } from "@hono/zod-openapi";

import { ItemTypeSchema } from "#generated/zod/schemas/index.js";

import { BaseArchiveSchema } from "./base.js";

export const CompositeArchiveSchema = BaseArchiveSchema.extend({
	count: z.number().openapi({ description: "包含的子項目數量" }),
});

export const WorkSchema = CompositeArchiveSchema.extend({
	type: z.literal(ItemTypeSchema.enum.WORK),
});
export type Work = z.infer<typeof WorkSchema>;

export const SeriesSchema = CompositeArchiveSchema.extend({
	type: z.literal(ItemTypeSchema.enum.SERIES),
});
export type Series = z.infer<typeof SeriesSchema>;

export const CollectionSchema = CompositeArchiveSchema.extend({
	type: z.literal(ItemTypeSchema.enum.COLLECTION),
});
export type Collection = z.infer<typeof CollectionSchema>;
