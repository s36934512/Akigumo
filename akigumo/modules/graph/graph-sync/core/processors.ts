/**
 * @file Processor registration and payload contracts for user-registration.
 *
 * Why keep API input schema here?
 * The outbox payload consumed by processors should share one validation source
 * with route contracts to avoid drift between accepted HTTP data and async jobs.
 */
import { graphRefinementWorker } from "#akigumo/infrastructure/message-queue/index.js";
import { kernelProcessorsRegistry } from "#akigumo/kernel/index.js";

import { ACTIONS } from "../contracts.js";
import * as handlersRegistry from "./registry.js";
import { InputSchema, TaskSchema } from "./schema.js";

kernelProcessorsRegistry.registerProcessor({
	name: ACTIONS.INTENT_CREATED.code,
	inputSchema: InputSchema,
	logic: async (input) => {
		const data = Array.isArray(input.payload)
			? input.payload
			: [input.payload];

		for (const item of data) {
			const handler = handlersRegistry.getHandler(item.handlerName);
			if (!handler) {
				throw new Error(
					`Handler for task '${item.handlerName}' not found`,
				);
			}

			const task = await handler.logic(
				handler.schema.parse(item.payload),
			);
			const payload = TaskSchema.parse({
				...task,
				id: input.context.workflowId,
			});

			await graphRefinementWorker.add(JSON.stringify(payload));
		}
	},
});
