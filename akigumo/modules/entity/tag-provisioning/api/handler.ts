/**
 * @file HTTP handler for tag provisioning requests.
 *
 * This handler implements the "fast accept" pattern: it writes to the Outbox
 * within a single transaction and immediately returns 201 to the caller.
 * The actual provisioning work happens asynchronously in a background worker.
 */
import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { prisma } from 'akigumo/db/prisma';
import { processPendingTask } from 'akigumo/kernel';
import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import { v7 as uuidv7 } from 'uuid';

import { tagProvisioningRoute } from './route';
import { ENTITY_AGGREGATE } from '../../common/contract';
import {
    ENTITY_TAG_PROVISIONING_ACTIONS,
    ENTITY_TAG_PROVISIONING_WORKFLOW_NAME as WORKFLOW_NAME
} from '../contract';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleTagProvisioning = app.openapi(tagProvisioningRoute, async (c) => {
    // UUIDv7 is time-sortable, making it efficient for database indexing and
    // useful for chronological tracing across logs, outbox, and audit records.
    const correlationId = uuidv7();
    const body = c.req.valid('json');
    // Normalize to array so processors always deal with a consistent batch shape.
    const dataPayload = Array.isArray(body) ? body : [body];
    const pendingTask = createPendingTask({
        aggregateType: ENTITY_AGGREGATE,
        operation: ENTITY_TAG_PROVISIONING_ACTIONS.PROVISION_TAGS.code,
        payload: dataPayload,
        correlationId: correlationId,
    });

    // Write Outbox and WorkflowState atomically. If either fails, neither is
    // persisted — preventing orphaned tasks that have no tracking record, or
    // workflow records that have no associated task to execute.
    await prisma.$transaction([
        prisma.outbox.create({
            data: {
                correlationId,
                workflowId: WORKFLOW_NAME,
                ...pendingTask,
            }
        }),
        prisma.workflowState.create({
            data: {
                correlationId: correlationId,
                workflowId: WORKFLOW_NAME,
                status: 'INIT',
            }
        })
    ]);

    // Signal the in-process worker to check for new tasks immediately,
    // reducing latency without blocking the HTTP response on execution.
    processPendingTask();

    return c.json({ success: true, traceId: correlationId }, 201);
});