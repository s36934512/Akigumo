import type { z } from "@hono/zod-openapi";

import type { ProcessorDefinition } from "#akigumo/kernel/processors/type.js";

const registry = new Map<string, ProcessorDefinition<z.ZodTypeAny>>();

const getKey = (name: string) => `${name}`.toLowerCase();

/**
 * Registers a processor for the given aggregate and operation.
 */
export function registerProcessor<TSchema extends z.ZodTypeAny>(
	processor: ProcessorDefinition<TSchema>,
) {
	registry.set(
		getKey(processor.name),
		processor as ProcessorDefinition<z.ZodTypeAny>,
	);
}

/**
 * Returns the processor configuration for a specific aggregate operation.
 */
export function getProcessor<TSchema extends z.ZodTypeAny = z.ZodTypeAny>(
	name: string,
): ProcessorDefinition<TSchema> | undefined {
	return registry.get(getKey(name)) as
		| ProcessorDefinition<TSchema>
		| undefined;
}
