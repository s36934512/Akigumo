import { ProcessorDefinition } from "../bootstrap/schema";

class KernelProcessorsRegistry {
    private registry = new Map<string, ProcessorDefinition<any>>();

    /**
     * Registers a processor for the given aggregate and operation.
     */
    register<T>(aggregateType: string, operation: string, spec: ProcessorDefinition<T>) {
        this.registry.set(this.getKey(aggregateType, operation), spec);
    }

    /**
     * Returns the processor configuration for a specific aggregate operation.
     */
    getProcessor(aggregateType: string, operation: string): ProcessorDefinition<any> | undefined {
        return this.registry.get(this.getKey(aggregateType, operation));
    }

    /**
     * Builds normalized registry key.
     */
    private getKey(aggregateType: string, operation: string) {
        return `${aggregateType}:${operation}`.toLowerCase();
    }
}

/**
 * Shared singleton registry instance.
 */
export const kernelProcessorsRegistry = new KernelProcessorsRegistry();