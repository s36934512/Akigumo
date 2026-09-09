import { z } from "@hono/zod-openapi";

import {
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/schema-factory/index.js";

import { BasePatchSchema } from "./base.js";

const PatchOperateSchema = z.enum([
	"UPSERT_PROP",
	"REPLACE_PROP",
	"REMOVE_PROP",
	"OVERWRITE_OBJ",
	"DELETE_OBJ",
]);
export const ArchivePatchOperate = PatchOperateSchema.enum;

export const ArchivePatchPayloadInputSchema = createFlexibleSchema(
	z.object({
		op: PatchOperateSchema,
		entry: z.object({ id: z.string() }).catchall(z.unknown()),
	}),
);
export type ArchivePatchPayloadInput = InferFlexible<
	typeof ArchivePatchPayloadInputSchema
>;

export const ArchivePatchPayloadOutputSchema = createFlexibleSchema(
	BasePatchSchema.extend({
		op: PatchOperateSchema,
		entry: z.object({ id: z.string() }).catchall(z.unknown()),
	}),
);

export type ArchivePatchPayloadOutput = InferFlexible<
	typeof ArchivePatchPayloadOutputSchema
>;
