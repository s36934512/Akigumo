import { z } from "@hono/zod-openapi";
import {
	createFlexibleSchema,
	type InferFlexible,
} from "./schema-factory/index.js";

export const CommonIdSchema = createFlexibleSchema(z.uuid());
export type CommonId = InferFlexible<typeof CommonIdSchema>;

export const CommonIdObjectSchema = createFlexibleSchema(
	z.object({ id: z.uuid() }),
);
export type CommonIdObject = InferFlexible<typeof CommonIdObjectSchema>;

export const CommonIdTypeSchema = createFlexibleSchema(
	z.enum(["archive", "concept"]),
);
export type CommonIdType = InferFlexible<typeof CommonIdTypeSchema>;

export const CommonIdTypeObjectSchema = createFlexibleSchema(
	z.object({
		type: CommonIdTypeSchema.single,
		id: z.uuid(),
	}),
);
export type CommonIdTypeObject = InferFlexible<typeof CommonIdTypeObjectSchema>;
