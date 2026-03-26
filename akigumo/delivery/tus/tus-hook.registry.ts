import { EVENTS } from "@tus/server";
export type EventType = typeof EVENTS[keyof typeof EVENTS];

export type ProcessFn<T = any, R = any> = (input: T) => Promise<R>;

export class TusHookRegistry {
    private registry = new Map<string, ProcessFn[]>();

    register(event: EventType, category: string, fn: ProcessFn) {
        const key = this.getKey(event, category);
        const handlers = this.registry.get(key) || [];
        handlers.push(fn);
        this.registry.set(key, handlers);
    }

    getProcessors<T = any, R = any>(event: EventType, category: string): ProcessFn<T, R>[] {
        const key = this.getKey(event, category);
        return this.registry.get(key) || [];
    }

    private getKey(event: EventType, category: string) {
        return `${event}:${category}`.toLowerCase();
    }
}

export const tusHookRegistry = new TusHookRegistry();