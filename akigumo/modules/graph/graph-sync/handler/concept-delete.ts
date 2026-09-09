import { z } from "@hono/zod-openapi";

import { handlersRegistry } from "../core/index.js";

const PayloadSchema = z
	.uuid()
	.array()
	.openapi({
		description:
			"Tag Provisioningn payload containing the unique identifier of the concept.",
		example: ["123e4567-e89b-12d3-a456-426614174000"],
	});

handlersRegistry.registerHandler({
	name: "concept-delete",
	schema: PayloadSchema,
	logic: async (payload) => {
		return {
			taskType: "ConceptDeleteExecutor",
			payload: payload.map((concept) => {
				return {
					conceptId: concept,
				};
			}),
		};
	},
});
