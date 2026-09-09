import { z } from "@hono/zod-openapi";

import {
	CommonIdSchema,
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/index.js";
import { BaseResponseSchema } from "#akigumo/shared/schemas/api.schema.js";

export const OntologyDeleteSchema = createFlexibleSchema(
	z.object({ notifyId: CommonIdSchema.single, idList: CommonIdSchema.array }),
);

export type OntologyDelete = InferFlexible<typeof OntologyDeleteSchema>;

export const RequestSchema = OntologyDeleteSchema.single;

export const ResponseSchema = BaseResponseSchema;
