import { z } from "@hono/zod-openapi";

import { createFlexibleSchema } from "#akigumo/shared/contracts/schema-factory/index.js";

const BaseTaskSchema = z.object({
	taskType: z.string(),
	payload: z.any(),
});

export type BaseTask = z.infer<typeof BaseTaskSchema>;

export const InputSchema = createFlexibleSchema(
	z.object({
		handlerName: z.string(),
		payload: z.unknown(),
	}),
).either;

export const TaskSchema = BaseTaskSchema.extend({
	id: z.uuid(),
}).transform((data) => {
	return {
		id: data.id,
		taskVersion: 1,
		taskType: data.taskType,
		taskPayload: data.payload,
	};
});
