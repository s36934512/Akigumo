import { z } from '@hono/zod-openapi';
import { KernelContext, KernelMetadata } from 'akigumo/kernel';
import { ActionDefinition } from 'akigumo/shared/contracts';
import { registerWorkflowProcessor } from 'akigumo/shared/utils';

import { GRAPH_REFINEMENT_ENGINE_AGGREGATE } from './contract';

export const registerGraphRefinementEngineProcessor = <TInput, TOutput>(
    action: ActionDefinition,
    schema: z.ZodSchema<TInput>,
    logic: (data: TInput, metadata: KernelMetadata, context: KernelContext) => Promise<TOutput>,
) => {
    return registerWorkflowProcessor(GRAPH_REFINEMENT_ENGINE_AGGREGATE, action, schema, logic);
};
