import { z } from "@hono/zod-openapi";

import { prisma } from "#akigumo/db/prisma.js";

import { handlersRegistry } from "../core/index.js";
import { buildTask } from "../factory/tag-provisioning.js";

const PayloadSchema = z
	.uuid()
	.array()
	.openapi({
		description:
			"Tag Provisioningn payload containing the unique identifier of the concept.",
		example: ["123e4567-e89b-12d3-a456-426614174000"],
	});

handlersRegistry.registerHandler({
	name: "concept-registry",
	schema: PayloadSchema,
	logic: async (payload) => {
		const conceptList = await prisma.concept.findMany({
			where: { id: { in: payload } },
		});

		if (conceptList.length === 0) {
			throw new Error("concept not found");
		}

		return {
			taskType: "ConceptExecutor",
			payload: conceptList.map((concept) => {
				return buildTask({
					conceptId: concept.id,
					conceptName: concept.name,
				});
			}),
		};
	},
});
