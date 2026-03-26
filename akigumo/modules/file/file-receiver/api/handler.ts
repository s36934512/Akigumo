/**
 * File Creation HTTP Request Handlers
 * 
 * Implements the two-phase TUS resumable upload workflow:
 * 1. Intention Phase (POST /file/tus-intent) - Validate metadata before streaming
 * 2. Seal Phase (POST /file/tus-seal) - Finalize upload after chunks complete
 * 
 * Why two phases:
 * - Intent phase prepares state and validates disk space early
 * - Seal phase confirms completion and triggers async processing
 * - Separation allows efficient streaming without blocking validation
 * 
 * Architecture pattern:
 * - Uses event sourcing (Outbox pattern) for durable state transitions
 * - Creates workflowState entries for progress tracking across services
 * - Delegates processing logic to registered processors via processPendingTask()
 */

import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { prisma } from 'akigumo/db/prisma';
import { processPendingTask } from 'akigumo/kernel';
import Paths from 'akigumo/kernel/paths';
import { toPrismaJson } from 'akigumo/kernel/utils/json';
import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import fs from 'fs-extra';
import { Prisma } from 'generated/prisma/client';
import { v7 as uuidv7 } from 'uuid';

import { FILE_RECEIVER_ACTIONS, FILE_CREATE_WORKFLOW_NAME as WORKFLOW_NAME } from '../contract';
import { tusIntentRoute, tusSealRoute } from './route';
import { FILE_AGGREGATE, FILE_PROCESS_ITEM_WORKFLOW_NAME } from '../../common/contract';
import { FILE_INTEGRATION_ACTIONS } from '../../file-integration/contract';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleTusIntent = app.openapi(tusIntentRoute, async (c) => {
    const correlationId = uuidv7();
    const body = c.req.valid('json');
    const pendingTask = createPendingTask({
        aggregateType: FILE_AGGREGATE,
        operation: FILE_RECEIVER_ACTIONS.INTENT.code,
        payload: body,
        correlationId,
    });

    await prisma.$transaction([
        prisma.outbox.create({
            data: {
                correlationId: correlationId,
                workflowId: WORKFLOW_NAME,
                ...pendingTask,
                payload: toPrismaJson(pendingTask.payload) as unknown as Prisma.InputJsonValue,
            }
        }),
        prisma.workflowState.create({
            data: {
                correlationId,
                workflowId: WORKFLOW_NAME,
                status: 'INIT',
            }
        })
    ]);

    processPendingTask();

    return c.json({ success: true, traceId: correlationId }, 201);
});


/**
 * HTTP request handler for TUS file upload completion
 * 
 * Finalizes a completed file upload and triggers synchronization.
 * This is the second phase of the two-phase TUS upload workflow.
 * 
 * Workflow orchestration steps:
 * 
 * 1. **Request Validation**: Hono validates request body against TusSealRequestSchema
 *    - Must include correlationId from prior TusIntentResponse
 *    - Correlates this seal operation with the initial intent
 * 
 * 2. **Correlation ID Extraction**: Retrieve traceId from request
 *    - Links seal operation to the original file upload intent
 *    - Ensures all events are grouped in the same trace
 * 
 * 3. **Normalize Input**: Convert single file object to batch array
 *    - Allows flexible request format
 * 
 * 4. **Event Sourcing - Outbox Pattern**:
 *    - Create outbox entry with SEAL_FILE operation
 *    - Uses correlationId from intent (not creating a new one)
 *    - Processor handles filesize finalization and state updates
 * 
 * 5. **Transaction Write**:
 *    - Outbox entry created (no separate workflowState on seal)
 *    - Seal operation updates existing workflow state
 *    - Minimal transaction scope for faster completion
 * 
 * 6. **Async Processor Trigger**:
 *    - Call processPendingTask() to execute seal operation
 *    - Returns immediately (non-blocking)
 * 
 * 7. **Response to Caller**:
 *    - Returns 202 Accepted with same traceId
 *    - Upload stream processing continues asynchronously
 * 
 * @handler POST /file/tus-seal
 * @param {object} c Hono context containing request/response
 * @param {TusSealRequest} body Validated request body (file metadata + correlationId)
 * @returns {Promise<Response>} 202 Accepted response with traceId
 * 
 * @example
 * // Request
 * POST /file/tus-seal
 * {
 *   "originalName": "document.pdf",
 *   "size": "1024000",
 *   "checksum": "f0d9ab11c2aa5f67",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * 
 * // Response (202 Accepted)
 * {
 *   "success": true,
 *   "traceId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * 
 * // Workflow completion (async):
 * // 1. Processor finalizes upload state in database
 * // 2. File marked as AVAILABLE
 * // 3. Event emitted (SEAL_FILE_SUCCESS)
 * // 4. Outbox entries created for content processing if needed
 * // 5. State machine transitions to processing phase
 * // 6. Archive extraction, transcoding, or other processing starts
 * // 7. Final sync to Neo4j occurs after processing
 */
export const handleTusSeal = app.openapi(tusSealRoute, async (c) => {
    const correlationId = uuidv7();
    const body = c.req.valid('json');

    const sourcePath = Paths.concat('TMP_TUS', body.fileId);
    const sourceMetadataPath = `${sourcePath}.json`;
    const targetDir = Paths.concat('TMP_PROCESS', body.fileId);
    const originalFilePath = Paths.concat(targetDir, 'original');

    const task = createPendingTask({
        aggregateType: FILE_AGGREGATE,
        operation: FILE_INTEGRATION_ACTIONS.SEAL.code,
        payload: {
            fileId: body.fileId,
            fileName: body.fileName,
            checksum: body.checksum,
            basePath: targetDir,
        },
        correlationId: body.fileId,
    });

    await fs.move(sourcePath, originalFilePath, { overwrite: true });
    await fs.remove(sourceMetadataPath);

    await prisma.outbox.create({
        data: {
            aggregateType: task.aggregateType,
            correlationId: body.fileId,
            workflowId: FILE_PROCESS_ITEM_WORKFLOW_NAME,
            operation: task.operation,
            payload: task.payload,
            status: task.status
        }
    });

    processPendingTask();

    return c.json({ success: true, traceId: correlationId }, 202);
});

export default app;