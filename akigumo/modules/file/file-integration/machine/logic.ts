/**
 * @file State machine action handlers for file-integration child workflow
 *
 * Why this module exists:
 * - Keep machine.ts focused on state structure and transitions.
 * - Isolate event parsing and payload mapping for easier unit testability.
 * - Actions are responsible for computing next context given events and current context.
 */

import { logger } from 'akigumo/db/pino';
import Paths from 'akigumo/kernel/paths';
import { buildWorkflowError, createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import { assertEvent } from 'xstate';

import { FileIntegrationEventCode as EventCode } from '../contract';
import { FILE_INTEGRATION_ACTIONS } from '../contract';
import {
    MachineContext,
    MachineEvents,
    ReceiverNotifyPayloadSchema,
    SealSuccessSchema,
} from './schema';
import { FILE_AGGREGATE, FileEventCode } from '../../common/contract';
import { RecursiveUncompressPayloadSchema, } from '../core/processors/init-recursive/schema';

type ParentNotifyStatus = 'COMPLETED' | 'FAILED';

function buildParentNotifyUpdate(context: MachineContext, status: ParentNotifyStatus) {
    if (context.parentId === null) return {};

    const payload = ReceiverNotifyPayloadSchema.parse({
        status,
        fileId: context.fileId,
    });

    return {
        nextTask: createPendingTask({
            aggregateType: FILE_AGGREGATE,
            operation: context.operationCode,
            payload,
            correlationId: context.parentId,
        }),
    };
}

export const machineActions = {
    handleSealSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, EventCode.FILE_SEAL_SUCCESS);
        const data = SealSuccessSchema.parse(event.data);
        const { shouldUncompress = false, shouldTranscode = false } = data.strategy || {};

        logger.info(
            { event },
            'Received FILE_SEAL_SUCCESS with strategy: %o',
            { shouldUncompress, shouldTranscode },
        );

        return {
            strategy: { shouldUncompress, shouldTranscode },
            basePath: data.basePath,
            isSealSuccess: true,
        };
    },

    prepareRecursiveUncompressTask(
        { context, event }: { context: MachineContext; event: MachineEvents }
    ) {
        assertEvent(event, EventCode.FILE_UNCOMPRESS_SUCCESS);

        const derivedFiles = event.data.files.map((f) => f.id);
        if (derivedFiles.length === 0) {
            logger.info(
                { event },
                'No derived files found in FILE_UNCOMPRESS_SUCCESS for fileId: %s',
                context.fileId,
            );
            return {
                processingProgress: {
                    totalIds: [],
                    successIds: [],
                    failedIds: [],
                },
                nextTask: null,
            };
        }

        if (context.uncompressMaxDepth <= 0) {
            logger.warn(
                { event },
                'Reached maximum uncompress depth for fileId: %s',
                context.fileId,
            );
            return {
                processingProgress: {
                    totalIds: [],
                    successIds: [],
                    failedIds: [],
                },
                nextTask: null,
            };
        }

        const payload = RecursiveUncompressPayloadSchema.parse(
            derivedFiles.map((fileId) => ({
                fileId,
                parentId: context.correlationId,
                uncompressMaxDepth: context.uncompressMaxDepth - 1,
                basePath: Paths.concat(context.basePath, 'extracted', fileId),
            })),
        );

        return {
            status: 'UNCOMPRESSING' as const,
            processingProgress: {
                totalIds: derivedFiles,
                successIds: [],
                failedIds: [],
            },
            nextTask: createPendingTask({
                aggregateType: FILE_AGGREGATE,
                operation: FILE_INTEGRATION_ACTIONS.INIT_RECURSIVE.code,
                payload,
                correlationId: context.correlationId,
            }),
        };
    },

    completedNotify(
        { context, event }: { context: MachineContext; event: MachineEvents }
    ) {
        assertEvent(event, FileEventCode.FILE_INTEGRATION_NOTIFY_SUCCESS);

        const { fileId, status } = ReceiverNotifyPayloadSchema.parse(event.data);
        const { successIds, failedIds } = context.processingProgress;

        // Ignore duplicated notifications to keep progress accounting stable.
        if (successIds.includes(fileId) || failedIds.includes(fileId)) return {};

        return {
            processingProgress: {
                ...context.processingProgress,
                successIds: status === 'COMPLETED' ? [...successIds, fileId] : successIds,
                failedIds: status !== 'COMPLETED' ? [...failedIds, fileId] : failedIds,
            },
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        return {
            error: buildWorkflowError(event, 'FileIntegrationMachine'),
            status: 'FAILED' as const,
        };
    },

    notifyParentComplete({ context }: { context: MachineContext }) {
        return buildParentNotifyUpdate(context, 'COMPLETED');
    },

    notifyParentFailure({ context }: { context: MachineContext }) {
        return buildParentNotifyUpdate(context, 'FAILED');
    },
};
