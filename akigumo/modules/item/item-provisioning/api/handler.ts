/**
 * @file HTTP handler for item-provisioning endpoint
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

import { ITEM_AGGREGATE } from '../../common/contract';
import { ITEM_ACTIONS, ITEM_CREATE_WORKFLOW_NAME } from '../contract';
import { itemProvisioningRoute } from './route';


const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

/**
 * OpenAPI route handler for item creation
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
export const handleItemProvisioning = app.openapi(itemProvisioningRoute, async (c) => {
    const correlationId = uuidv7();
    const body = c.req.valid('json');
    const dataPayload = Array.isArray(body) ? body : [body];
    const pendingTask = createPendingTask({
        aggregateType: ITEM_AGGREGATE,
        operation: ITEM_ACTIONS.CREATE.code,
        payload: dataPayload,
        correlationId,
    });

    await prisma.$transaction([
        prisma.outbox.create({
            data: {
                correlationId,
                workflowId: ITEM_CREATE_WORKFLOW_NAME,
                ...pendingTask,
            }
        }),
        prisma.workflowState.create({
            data: {
                correlationId,
                workflowId: ITEM_CREATE_WORKFLOW_NAME,
                status: 'INIT',
            }
        })
    ]);

    processPendingTask();

    return c.json({ success: true, traceId: correlationId }, 201);
});
