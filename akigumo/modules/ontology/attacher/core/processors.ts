import { prisma } from "#akigumo/db/prisma.js";
import { kernelProcessorsRegistry } from "#akigumo/kernel/index.js";

import { ACTIONS } from "../contract.js";
import { AttachAttributesSchema } from "../schema/schema.js";
import { preProcessing } from "./helper.js";

export const InputSchema = AttachAttributesSchema.array;

/**
 * Processor for the REGISTRY action.
 *
 * Architectural Responsibility:
 * This processor's only job is to ensure all concept texts exist as records in the
 * source-of-truth database (PostgreSQL), stored in the `Concept` table.
 * It is explicitly NOT responsible for storing group relationships, as that
 * logic is handled by Neo4j.
 *
 * It uses `createMany` with `skipDuplicates` to achieve idempotency, making it safe to re-run.
 * This assumes the underlying database is PostgreSQL, which supports this feature.
 */
kernelProcessorsRegistry.registerProcessor({
	name: ACTIONS.ATTACHER.code,
	inputSchema: InputSchema,
	logic: async (input) => {
		const { pool, entrise } = preProcessing(input.payload);

		await prisma.concept.createMany({
			data: pool,
		});

		return entrise;
	},
});
