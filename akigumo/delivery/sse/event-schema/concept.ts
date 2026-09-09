import { z } from "@hono/zod-openapi";

import {
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/schema-factory/index.js";

import { BasePatchSchema } from "./base.js";

const PatchOperateSchema = z.enum(["DELETE_OBJ"]);
export const ConceptPatchOperate = PatchOperateSchema.enum;

export const ConceptPatchPayloadInputSchema = createFlexibleSchema(
	z.object({
		op: PatchOperateSchema,
		entry: z.object({ id: z.string() }).catchall(z.unknown()),
	}),
);
export type ConceptPatchPayloadInput = InferFlexible<
	typeof ConceptPatchPayloadInputSchema
>;

export const ConceptPatchPayloadOutputSchema = createFlexibleSchema(
	BasePatchSchema.extend({
		op: PatchOperateSchema,
		entry: z.object({ id: z.string() }).catchall(z.unknown()),
	}),
);

export type ConceptPatchPayloadOutput = InferFlexible<
	typeof ConceptPatchPayloadOutputSchema
>;
