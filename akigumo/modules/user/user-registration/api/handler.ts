/**
 * @file HTTP handler for user-registration endpoint
 *
 * This handler translates HTTP requests into workflow tasks using the
 * transactional outbox pattern.
 */

import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { prisma } from 'akigumo/db/prisma';
import { processPendingTask } from 'akigumo/kernel';
import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import { v7 as uuidv7 } from 'uuid';

import { USER_ACTIONS, USER_CREATE_WORKFLOW_NAME } from '../contract';
import { userRegistrationRoute } from './route';
import { USER_AGGREGATE } from '../../common/contract';


const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

/**
 * OpenAPI route handler for user creation
 *
 * Why transactional outbox here?
 * - We must acknowledge requests quickly without waiting for multi-system writes
 * - Task and workflow state must be committed atomically to avoid task loss
 * - Background workers can safely pick up pending work after crashes/restarts
 *
 * Why return traceId only?
 * - Creation continues asynchronously after the HTTP response
 * - Clients should track workflow completion via status endpoint
 * - Returning partial entity data at this stage can be misleading
 */
export const handleUserRegistration = app.openapi(userRegistrationRoute, async (c) => {
    const correlationId = uuidv7();
    const body = c.req.valid('json');
    const dataPayload = Array.isArray(body) ? body : [body];
    const pendingTask = createPendingTask({
        aggregateType: USER_AGGREGATE,
        operation: USER_ACTIONS.CREATE.code,
        payload: dataPayload,
        correlationId,
    });

    await prisma.$transaction([
        prisma.outbox.create({
            data: {
                correlationId,
                workflowId: USER_CREATE_WORKFLOW_NAME,
                ...pendingTask,
            }
        }),
        prisma.workflowState.create({
            data: {
                correlationId,
                workflowId: USER_CREATE_WORKFLOW_NAME,
                status: 'INIT',
            }
        })
    ]);

    processPendingTask();

    return c.json({ success: true, traceId: correlationId }, 201);
});
