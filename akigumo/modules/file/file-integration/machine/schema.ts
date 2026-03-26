/**
 * @file State machine context and event schemas for process-file-item workflow
 * Defines persisted context shape and event contract for item-level file processing
 */

import { error } from 'node:console';

import { z } from '@hono/zod-openapi';
import {
    ErrorDetailSchema,
    TaskSchema,
    failureEvent,
    successEvent,
} from 'akigumo/shared/schemas/machine.schema';
import { FileModelSchema } from 'generated/zod/schemas';

import { FileEventCode } from '../../common/contract';
import { FileIntegrationEventCode as EventCode } from '../contract';
import { StrategySchema } from '../core/processors/seal/schema';

const ProcessingStrategySchema = z.object({
    shouldUncompress: z.boolean().default(false),
    shouldTranscode: z.boolean().default(false)
});

const ProcessingProgressSchema = z.object({
    totalIds: z.array(z.uuid()),
    successIds: z.array(z.uuid()).default([]),
    failedIds: z.array(z.uuid()).default([])
});

const FileIntegrationWorkflowStatusSchema = z.enum([
    'WAITING_START',
    'UNCOMPRESSING',
    'TRANSCODING',
    'SYNCING_NODE',
    'FAILED'
]);

export const SealSuccessSchema = z.object({
    strategy: StrategySchema.optional(),
    basePath: z.string().min(1),
});


export const MachineInputSchema = z.object({
    fileId: z.uuid(),
    correlationId: z.uuid(),
    parentId: z.uuid(),
    operationCode: z.string(),
    uncompressMaxDepth: z.number().default(3),
    basePath: z.string().optional().default('')
});

export type MachineInput = z.infer<typeof MachineInputSchema>;

export const FileStatusSchema = z.object({
    fileId: z.uuid(),
    fileName: z.string().optional(),
    mimeType: z.string(),
    status: z.enum(['UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED']),
    // isDerived: z.boolean().default(false), // Produced by extraction/transcoding flow.
    error: z.string().nullable().optional(),
    tempScanId: z.string().optional()
});

/**
 * Schema for process-file-item machine context
 *
 * Context captures the minimum data required to resume workflow execution:
 * - fileId: target file being processed
 * - parentId: parent workflow correlation ID for callback signaling
 * - strategy: probe result that decides archive/image handling path
 * - status: high-level execution status for observability
 * - nextTask: pending task consumed by async processor
 */
export const MachineContextSchema = MachineInputSchema.extend({
    /**
     * Business intent:
     * Nullable because machine can be restored before file snapshot is materialized.
     */
    files: z.array(FileStatusSchema).default([]),

    processingProgress: ProcessingProgressSchema.default({
        totalIds: [],
        successIds: [],
        failedIds: []
    }),
    status: FileIntegrationWorkflowStatusSchema.default('WAITING_START'),
    strategy: ProcessingStrategySchema,
    nextTask: TaskSchema.nullable(),
    error: ErrorDetailSchema.nullable(),
    isSealSuccess: z.boolean().default(false),
    isNotifyStartSuccess: z.boolean().default(false),
});

export type MachineContext = z.infer<typeof MachineContextSchema>;

export const ReceiverNotifyPayloadSchema = z.object({
    status: z.enum(['COMPLETED', 'FAILED']),
    fileId: z.uuid(),
});

export const MachineEventsSchema = z.discriminatedUnion('type', [
    // ---- Seal ----
    successEvent(EventCode.FILE_SEAL_SUCCESS, SealSuccessSchema),
    failureEvent(EventCode.FILE_SEAL_FAILURE),

    // ---- Uncompress / Transcode (similar shape; can be unified later) ----
    successEvent(EventCode.FILE_UNCOMPRESS_SUCCESS,
        z.object({
            fileId: z.string(),
            outputDir: z.string(),
            files: FileModelSchema.array()
        })
    ),
    failureEvent(EventCode.FILE_UNCOMPRESS_FAILURE),

    // ---- Transcode ----
    successEvent(
        EventCode.FILE_TRANSCODE_SUCCESS,
        FileModelSchema.array()
    ),
    failureEvent(EventCode.FILE_TRANSCODE_FAILURE),

    successEvent(
        EventCode.FILE_DISPATCH_SUB_TASKS_SUCCESS,
        z.object({
            fileId: z.uuid(),
            parentId: z.uuid()
        })
    ),
    failureEvent(EventCode.FILE_DISPATCH_SUB_TASKS_FAILURE),

    successEvent(
        FileEventCode.FILE_INTEGRATION_NOTIFY_SUCCESS,
        ReceiverNotifyPayloadSchema
    ),
    failureEvent(FileEventCode.FILE_INTEGRATION_NOTIFY_FAILURE),

    // ---- Graph Sync ----
    successEvent(EventCode.FILE_SYNC_NODE_SUCCESS, z.object({})),
    failureEvent(EventCode.FILE_SYNC_NODE_FAILURE),
]);

export type MachineEvents = z.infer<typeof MachineEventsSchema>;