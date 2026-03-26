import { z } from '@hono/zod-openapi';
import { KernelContext, KernelMetadata } from "akigumo/kernel";
import { ActionDefinition } from "akigumo/shared/contracts";
import { registerWorkflowProcessor } from "akigumo/shared/utils";

import { ITEM_AGGREGATE } from "./contract";

export const registerItemProcessor = <TInput, TOutput>(
    action: ActionDefinition,
    schema: z.ZodSchema<TInput>,
    logic: (data: TInput, metadata: KernelMetadata, context: KernelContext) => Promise<TOutput>
) => {
    return registerWorkflowProcessor(ITEM_AGGREGATE, action, schema, logic);
};