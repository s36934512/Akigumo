import { z } from "@hono/zod-openapi";

import { createFlexibleSchema } from "#akigumo/shared/contracts/schema-factory/index.js";
import { ConceptModelSchema } from "#generated/zod/schemas/index.js";

export const CyNodeElementSchema = createFlexibleSchema(
	z.object({
		data: ConceptModelSchema.catchall(z.unknown()),
	}),
);

export const CyEdgeElementSchema = createFlexibleSchema(
	z.object({
		data: z.object({
			id: z.string(),
			source: z.string(),
			target: z.string(),
			label: z.string().nullish(),
		}),
	}),
);

export const CyElementSchema = createFlexibleSchema(
	z.object({
		nodes: CyNodeElementSchema.array,
		edges: CyEdgeElementSchema.array,
	}),
);
