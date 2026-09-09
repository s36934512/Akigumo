import type { EVENTS } from "@tus/server";

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

export type ProcessFn<TInput = unknown, TOutput = unknown> = (
	input: TInput,
) => Promise<TOutput>;

class TusHookRegistry {
	private registry = new Map<string, ProcessFn<unknown, unknown>[]>();

	register(event: EventType, category: string, fn: ProcessFn): void {
		const key = this.getKey(event, category);
		const handlers = this.registry.get(key) || [];

		handlers.push(fn);
		this.registry.set(key, handlers);
	}

	getProcessors(event: EventType, category: string): ProcessFn[] {
		const key = this.getKey(event, category);

		return this.registry.get(key) || [];
	}

	private getKey(event: EventType, category: string) {
		return `${event}:${category}`.toLowerCase();
	}
}

export const tusHookRegistry = new TusHookRegistry();
