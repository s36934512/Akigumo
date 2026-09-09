import { z } from "@hono/zod-openapi";

import { OutboxModelSchema } from "#generated/zod/schemas/index.js";

const TaskMetadataSchema = z.object({
	version: z.string().default("1.0.0").openapi({
		description: "協議版本號",
		example: "1.0.0",
	}),
	outboxId: z.coerce.bigint().openapi({
		description: "outbox id",
		example: "3343",
	}),
	priority: z.number().openapi({
		description: "優先級，數字越小，優先級越高",
		example: 10,
	}),
});

const TaskContextSchema = z.object({
	workflowId: z.uuid().openapi({
		description: "回覆結果的目標workflow ID",
		example: "019e3695-9a0d-7710-ba0e-5a6c4e7bfd18",
	}),
	operation: z.string().openapi({
		description: "processor action name",
		example: "USER_CREATE",
	}),
});

export const TaskSchema = z.object({
	metadata: TaskMetadataSchema,
	context: TaskContextSchema,
	payload: z.json(),
});

export interface Task<T> {
	metadata: z.infer<typeof TaskMetadataSchema>;
	context: z.infer<typeof TaskContextSchema>;
	payload: T;
}

// 1. 定義 ProcessorDefinition 介面（取代原始 schema 內部的手動推導）
export interface ProcessorDefinition<
	TSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
	name: string;
	inputSchema: TSchema;
	onBefore?: (data: Task<z.output<TSchema>>) => void;
	logic: (data: Task<z.output<TSchema>>) => Promise<unknown>;
}

export const TaskCreateInputFromOutboxSchema = OutboxModelSchema.transform(
	(data) => {
		return {
			metadata: {
				outboxId: data.id,
				priority: data.priority,
			},
			context: {
				workflowId: data.workflowId,
				operation: data.operation,
			},
			payload: data.payload,
		};
	},
);
