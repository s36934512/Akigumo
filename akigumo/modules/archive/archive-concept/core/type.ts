import type { z } from "@hono/zod-openapi";
import {
	CommonIdSchema,
	type ConceptRegistry,
	ConceptRegistrySchema,
} from "#akigumo/shared/contracts/index.js";

export const KeyWithTempIdSchema = ConceptRegistrySchema.single
	.pick({ name: true })
	.extend({
		_tempId: CommonIdSchema.single,
	});
export type KeyWithTempId = z.infer<typeof KeyWithTempIdSchema>;

export const ValueWithTempIdSchema = ConceptRegistrySchema.single.extend({
	_tempId: CommonIdSchema.single,
});
export type ValueWithTempId = z.infer<typeof ValueWithTempIdSchema>;

export type JustIdObject = { id: string };

export type ConceptRegistryWithId = ConceptRegistry["single"] & JustIdObject;
