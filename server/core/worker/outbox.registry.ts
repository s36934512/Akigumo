import { OutboxModel } from "generated/prisma/models";

export type ProcessFn = (input: OutboxModel[]) => Promise<any>;

export class OutboxRegistry {
    private registry = new Map<string, ProcessFn[]>();

    register(aggregateType: string, operation: string, fn: ProcessFn) {
        const key = this.getKey(aggregateType, operation);
        const handlers = this.registry.get(key) || [];
        handlers.push(fn);
        this.registry.set(key, handlers);
    }

    getProcessors(aggregateType: string, operation: string): ProcessFn[] {
        const key = this.getKey(aggregateType, operation);
        return this.registry.get(key) || [];
    }

    private getKey(aggregateType: string, operation: string) {
        return `${aggregateType}:${operation}`.toLowerCase();
    }
}

export const outboxRegistry = new OutboxRegistry();