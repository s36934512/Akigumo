/**
 * @file State machine context and task schemas
 * Defines Zod schemas for validating state machine context and internal tasks
 */
import { z } from '@hono/zod-openapi';
import {
    ErrorDetailSchema,
    failureEvent,
    successEvent,
    TaskSchema
} from 'akigumo/shared/schemas/machine.schema';
import { FileModelSchema } from 'generated/zod/schemas/variants/pure/File.pure';

import { FileEventCode } from '../../common/contract';
import { ReceiverNotifyPayloadSchema } from '../../file-integration/machine/schema';
import { FileReceiverEventCode as EventCode } from '../contract';

export const FileStatusSchema = z.object({
    fileId: z.uuid(),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
    status: z.enum(['UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED']),
    error: ErrorDetailSchema.nullish(),
    tempScanId: z.string().optional(),
    itemId: z.uuid().nullish(),
    path: z.string().nullish(),
});


const ProcessingProgressSchema = z.object({
    totalIds: z.array(z.uuid()),
    successIds: z.array(z.uuid()).default([]),
    failedIds: z.array(z.uuid()).default([])
});


export const MachineInputSchema = z.object({
    correlationId: z.uuid().nullable(),
    uncompressMaxDepth: z.number().int().min(0).default(3),
});

export type MachineInput = z.infer<typeof MachineInputSchema>;


export const IntentSuccessPayloadSchema = z.object({
    notifyUploadId: z.uuid(),
    files: FileModelSchema.array()
});

/**
 * Schema for state machine context during file creation workflow
 * Maintains workflow state including file IDs, correlation ID, status, and pending tasks
 * 
 * Note: File machine maintains a more complex context structure compared to entity/item
 * due to support for multiple file processing states (archive, image processing, etc.)
 * 
 * @schema
 * @property {string|null} correlationId - Unique correlation ID for tracing
 * @property {Array<object>} files - Array of file status objects
 * @property {object|null} error - Error details if workflow failed
 * @property {string} status - Workflow status: PENDING, SAVING, SUCCESS, or FAILED
 * @property {object|null} nextTask - Pending synchronization task to execute
 */
export const MachineContextSchema = MachineInputSchema.extend({
    notifyUploadId: z.uuid().nullable(),
    files: FileStatusSchema.array().default([]),
    processingProgress: ProcessingProgressSchema.default({
        totalIds: [],
        successIds: [],
        failedIds: []
    }),
    error: ErrorDetailSchema.nullable(),
    nextTask: TaskSchema.nullable(),
});

/**
 * Inferred TypeScript type for state machine context
 * @typedef {z.infer<typeof MachineContextSchema>} MachineContext
 */
export type MachineContext = z.infer<typeof MachineContextSchema>;

export const MachineEventsSchema = z.discriminatedUnion('type', [
    // Intent validation results
    successEvent(EventCode.FILE_CREATE_INTENT_SUCCESS, IntentSuccessPayloadSchema),
    failureEvent(EventCode.FILE_CREATE_INTENT_FAILURE),

    successEvent(EventCode.INTENT_SYNC_TO_GRAPH_SUCCESS, z.any()),
    failureEvent(EventCode.INTENT_SYNC_TO_GRAPH_FAILURE),

    successEvent(EventCode.FILE_INIT_ITEM_SUCCESS, z.any()),
    failureEvent(EventCode.FILE_INIT_ITEM_FAILURE),

    successEvent(EventCode.FILE_START_NOTIFY_SUCCESS, z.any()),
    failureEvent(EventCode.FILE_START_NOTIFY_FAILURE),

    // Child workflow completion notification (aligns with FILE_INTEGRATION_NOTIFY pattern).
    successEvent(FileEventCode.FILE_RECEIVER_NOTIFY_SUCCESS, ReceiverNotifyPayloadSchema),
    failureEvent(FileEventCode.FILE_RECEIVER_NOTIFY_FAILURE),

    // Graph synchronization
    successEvent(EventCode.FILE_SYNC_NEO4J_SUCCESS, z.any()),
    failureEvent(EventCode.FILE_SYNC_NEO4J_FAILURE),
]);

// Exported for XState setup — keeps the type in sync with the Zod schema
export type MachineEvents = z.infer<typeof MachineEventsSchema>;



