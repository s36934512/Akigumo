/**
 * @file Factory for workflow failure handlers
 *
 * Why this exists:
 * - Keep failure handling consistent across workflow slices.
 * - Avoid duplicating logger + buildWorkflowError boilerplate.
 */

import { logger } from 'akigumo/db/pino';
import { buildWorkflowError } from 'akigumo/shared/schemas/machine.schema';

type FailureCapableContext = {
    status: string;
    error: unknown;
};

/**
 * Creates a failure action handler for state-machine assign actions.
 */
export function createHandleFailureAction<
    TContext extends FailureCapableContext,
    TEvent,
>(machinePath: string) {
    return ({ context, event }: { context: TContext; event: TEvent }) => {
        logger.error({ event }, 'Workflow failed at phase: %s', context.status);

        return {
            ...context,
            error: buildWorkflowError(event as any, machinePath),
            status: 'FAILED' as const,
        };
    };
}
