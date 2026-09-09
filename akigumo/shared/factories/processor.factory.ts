import type { z } from "@hono/zod-openapi";

import type {
	ProcessorDefinition,
	Task,
} from "#akigumo/kernel/processors/type.js";

export function defineProcessor<TInput extends z.ZodTypeAny, TResult>(
	action: string,
	inputSchema: TInput,
	logic: (task: Task<z.infer<TInput>>) => Promise<TResult>,
): ProcessorDefinition<TInput> {
	return {
		name: action,
		inputSchema,
		logic,
	};
}
