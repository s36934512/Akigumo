import { z } from "@hono/zod-openapi";

import {
	CommonIdSchema,
	ConceptRegistrySchema,
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/index.js";
import { BaseResponseSchema } from "#akigumo/shared/schemas/api.schema.js";

const ConceptEditSchema = createFlexibleSchema(
	ConceptRegistrySchema.single.extend({
		name: z.string().optional(),
	}),
);

export const OntologyEditorSchema = createFlexibleSchema(
	z.object({
		id: CommonIdSchema.single,
		notifyId: CommonIdSchema.single,
		registry: ConceptEditSchema.single,
	}),
);

export type OntologyEditor = InferFlexible<typeof OntologyEditorSchema>;

export const RequestSchema = OntologyEditorSchema.array;

export const ResponseSchema = BaseResponseSchema;
