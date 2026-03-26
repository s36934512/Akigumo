/**
 * @file Encapsulated actions for file-receiver machine
 *
 * Why this module exists:
 * - Keep machine.ts focused on state transitions.
 * - Isolate event parsing, payload mapping, and side effects for easier unit tests.
 */

import { logger } from 'akigumo/db/pino';
import { notifyClient } from 'akigumo/kernel/event/notifier';
import { notifyIndexPatchesForLinkedItems } from 'akigumo/modules/item/index-stream';
import { IndexEntryPatch } from 'akigumo/modules/item/index-stream/core/schema';
import { buildWorkflowError } from 'akigumo/shared/schemas/machine.schema';
import { assertEvent } from 'xstate';

import { FileReceiverEventCode as EventCode } from '../contract';
import { notifyIndexPatchesForFileIds } from '../index-patch.notifier';
import { MachineContext, MachineEvents } from './schema';
import { FileEventCode } from '../../common/contract';

export const machineActions = {
    handleIntentSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, EventCode.FILE_CREATE_INTENT_SUCCESS);
        const files = event.data.files || [];

        const processedFiles = files.map((f) => {
            const meta = f.metadata && typeof f.metadata === 'object' && !Array.isArray(f.metadata)
                ? (f.metadata as Record<string, unknown>)
                : {};
            const itemId = typeof meta['itemId'] === 'string' ? meta['itemId'] : null;
            const tempScanId = typeof meta['tempScanId'] === 'string' ? meta['tempScanId'] : undefined;
            const path = typeof meta['path'] === 'string' ? meta['path'] : f.originalName;

            return {
                fileId: f.id,
                tempScanId,
                status: 'UPLOADING' as const,
                itemId,
                path,
            };
        });

        return {
            notifyUploadId: event.data.notifyUploadId,
            files: processedFiles,
        };
    },

    completedNotify(
        { context, event }: { context: MachineContext; event: MachineEvents }
    ) {
        assertEvent(event, FileEventCode.FILE_RECEIVER_NOTIFY_SUCCESS);
        const { fileId, status } = event.data;
        const { successIds, failedIds } = context.processingProgress;

        if (successIds.includes(fileId) || failedIds.includes(fileId)) return context;

        // 修正：不再手動組裝 PATCH，直接呼叫統一的補全通知器
        // 這樣當檔案狀態變更為 COMPLETED 時，前端能收到包含新 Metadata 的完整實體
        notifyIndexPatchesForFileIds(
            context.notifyUploadId || 'unknown',
            [fileId]
        ).catch((err) => {
            logger.error({ err, fileId }, 'Failed to publish refreshed file INDEX_PATCH');
        });

        // PROGRESS 事件保持，用於進度條
        notifyClient({
            notifyUploadId: context.notifyUploadId || 'unknown',
            type: 'PROGRESS',
            payload: { processedDelta: 1, fileId, status },
        }).catch((err) => {
            logger.error({ err, fileId }, 'Failed to publish PROGRESS SSE event');
        });

        return {
            ...context,
            processingProgress: {
                ...context.processingProgress,
                successIds: status === 'COMPLETED' ? [...successIds, fileId] : successIds,
                failedIds: status !== 'COMPLETED' ? [...failedIds, fileId] : failedIds,
            },
        };
    },

    notifyUploadUrlViaSSE(
        { context }: { context: MachineContext }
    ) {
        // Client needs server-assigned file IDs before it can start TUS streaming.
        // SSE avoids polling and delivers IDs as soon as the dispatcher confirms them.
        notifyClient({
            notifyUploadId: context.notifyUploadId || 'unknown',
            type: 'FILE_ID_ASSIGNED',
            payload: context.files,
        }).catch((err) => {
            logger.error({ err }, 'Failed to publish FILE_ID_ASSIGNED SSE event');
        });

        notifyIndexPatchesForFileIds(
            context.notifyUploadId || 'unknown',
            context.files.map((file) => file.fileId)
        ).catch((err) => {
            logger.error({ err }, 'Failed to publish file index UPSERT patches');
        });

        // Push INDEX_PATCH for the parent items auto-created during intent so
        // the explorer gallery shows new entries without requiring a page reload.
        // Extract itemIds from context.files which were populated in handleIntentSuccess
        const linkedItemIds = context.files
            .map((file) => file.itemId)
            .filter((id): id is string => id !== null);

        if (linkedItemIds.length > 0) {
            notifyIndexPatchesForLinkedItems(
                context.notifyUploadId || 'unknown',
                linkedItemIds
            ).catch((err) => {
                logger.error({ err }, 'Failed to publish linked item index UPSERT patches');
            });
        }
    },

    handleFailure({ event }: { event: MachineEvents }) {
        logger.error({ event }, 'Handling failure in file receiver machine');
        return {
            error: buildWorkflowError(event, 'FileReceiverMachine'),
        };
    },
};
