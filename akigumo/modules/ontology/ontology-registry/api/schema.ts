import { z } from "@hono/zod-openapi";

import {
	CommonIdSchema,
	ConceptRegistrySchema,
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/index.js";
import { BaseResponseSchema } from "#akigumo/shared/schemas/api.schema.js";

export const OntologyRegistrySchema = createFlexibleSchema(
	z.object({
		notifyId: CommonIdSchema.single,
		registryList: ConceptRegistrySchema.array,
	}),
);

export type OntologyRegistry = InferFlexible<typeof OntologyRegistrySchema>;

export const RequestSchema = OntologyRegistrySchema.single;

export const ResponseSchema = BaseResponseSchema;
