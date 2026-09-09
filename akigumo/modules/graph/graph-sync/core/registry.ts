import type { z } from "@hono/zod-openapi";
import type { BaseTask } from "./schema.js";

export interface HandlerDefinition<
	TSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
	name: string;
	schema: TSchema;
	// 修正：使用 z.infer 讓 logic 函式拿到正確的 runtime 資料型別
	logic: (data: z.infer<TSchema>) => Promise<BaseTask>;
}

// 模組私有變數，外部無法直接存取，天然具備封裝性
const registry = new Map<string, HandlerDefinition<z.ZodTypeAny>>();

// 內部私有輔助函式
const getKey = (name: string): string => name.toLowerCase();

/**
 * Registers a handler for the given aggregate and operation.
 */
export function registerHandler<TSchema extends z.ZodTypeAny>(
	handler: HandlerDefinition<TSchema>,
) {
	registry.set(getKey(handler.name), handler);
}

/**
 * Returns the handler configuration for a specific aggregate operation.
 */
export function getHandler<TSchema extends z.ZodTypeAny = z.ZodTypeAny>(
	name: string,
): HandlerDefinition<TSchema> | undefined {
	const handler = registry.get(getKey(name));
	return handler as HandlerDefinition<TSchema> | undefined;
}
