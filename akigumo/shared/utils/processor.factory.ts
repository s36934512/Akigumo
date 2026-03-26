import { z } from '@hono/zod-openapi';
import { KernelContext, KernelMetadata, kernelProcessorsRegistry } from "akigumo/kernel";

import { ActionDefinition } from "../contracts/action.types";

export const registerWorkflowProcessor = <TInput, TOutput>(
    aggregate: string,
    action: ActionDefinition,
    schema: z.ZodSchema<TInput>,
    logic: (data: TInput, metadata: KernelMetadata, context: KernelContext) => Promise<TOutput>
) => {
    kernelProcessorsRegistry.register(aggregate, action.code, {
        actionName: action.code,
        schema,
        logic: async (data, metadata, context) => {
            return await logic(data, metadata, context);
        }
    });
};