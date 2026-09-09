import { z } from "@hono/zod-openapi";

import {
	CommonIdSchema,
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/index.js";
import { BaseResponseSchema } from "#akigumo/shared/schemas/api.schema.js";

export const ArchiveDeleteSchema = createFlexibleSchema(
	z.object({ id: CommonIdSchema.single }),
);

export type ArchiveDelete = InferFlexible<typeof ArchiveDeleteSchema>;

export const RequestSchema = ArchiveDeleteSchema.array;

export const ResponseSchema = BaseResponseSchema;
