import type { z } from "@hono/zod-openapi";

import {
	CommonIdSchema,
	extendDiscriminatedUnion,
} from "#akigumo/shared/contracts/index.js";

import { QuerySchema } from "../contract/cypher.js";
import { CyElementSchema } from "../contract/cytoscape.js";

export const OntologyResolverSchema = extendDiscriminatedUnion(
	"operate",
	QuerySchema,
	{
		notifyId: CommonIdSchema.single,
	},
);

export type OntologyResolver = z.infer<typeof OntologyResolverSchema>;

export const RequestSchema = OntologyResolverSchema;

export const ResponseSchema = CyElementSchema.single;
