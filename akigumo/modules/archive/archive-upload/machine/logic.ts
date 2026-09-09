/**
 * @file Encapsulated actions for file-receiver machine
 *
 * Why this module exists:
 * - Keep machine.ts focused on state transitions.
 * - Isolate event parsing, payload mapping, and side effects for easier unit tests.
 */

import { assertEvent } from "xstate";

import { logger } from "#akigumo/db/pino.js";
import { notifyClient } from "#akigumo/delivery/sse/index.js";
import { notifyIndexPatches } from "#akigumo/modules/archive/index-stream/index.js";
import { parseErrorMessage } from "#akigumo/shared/utils/logger.js";

import { EventCode } from "../contract.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const actions = {
	handleIntentSuccess({ event }: { event: MachineEvents }) {
		assertEvent(event, EventCode.ARCHIVE_INTENT_SUCCESS);

		return {
			notifyId: event.payload.notifyId,
			batchId: event.payload.batchId,
			fileList: event.payload.fileList,
			processingProgress: {
				totalIds: event.payload.fileList.map((f) => f.fileId),
				successIds: [],
				failedIds: [],
			},
		};
	},

	completedNotify({
		context,
		event,
	}: {
		context: MachineContext;
		event: MachineEvents;
	}) {
		assertEvent(event, EventCode.ARCHIVE_SEAL_SUCCESS);
		const fileId = event.payload;
		const { successIds, failedIds } = context.processingProgress;

		if (successIds.includes(fileId) || failedIds.includes(fileId))
			return context;

		// 修正：不再手動組裝 PATCH，直接呼叫統一的補全通知器
		// 這樣當檔案狀態變更為 COMPLETED 時，前端能收到包含新 Metadata 的完整實體
		notifyIndexPatches(context.notifyId || "unknown", [fileId]).catch(
			(err) => {
				logger.error(
					{ err, fileId },
					"Failed to publish refreshed file INDEX_PATCH",
				);
			},
		);

		// PROGRESS 事件保持，用於進度條
		notifyClient({
			notifyId: context.notifyId || "unknown",
			type: "PROGRESS",
			payload: { progress: 100, message: `檔案 ${fileId} 已完成歸檔` },
		}).catch((err) => {
			logger.error(
				{ err, fileId },
				"Failed to publish PROGRESS SSE event",
			);
		});

		return {
			processingProgress: {
				...context.processingProgress,
				successIds: [...successIds, fileId],
			},
		};
	},

	notifyUploadUrlViaSSE({ context }: { context: MachineContext }) {
		// Client needs server-assigned file IDs before it can start TUS streaming.
		// SSE avoids polling and delivers IDs as soon as the dispatcher confirms them.
		notifyClient({
			notifyId: context.notifyId || "unknown",
			type: "FILE_ID_ASSIGNED",
			payload: context.fileList.map((f) => ({
				fileId: f.fileId,
				tempScanId: f.tempScanId,
				batchId: context.batchId,
			})),
		}).catch((err) => {
			logger.error(
				{ err },
				"Failed to publish FILE_ID_ASSIGNED SSE event",
			);
		});

		notifyIndexPatches(
			context.notifyId || "unknown",
			context.fileList.map((f) => f.fileId),
		).catch((err) => {
			logger.error(
				{ err },
				"Failed to publish file index UPSERT patches",
			);
		});

		// Push INDEX_PATCH for the parent items auto-created during intent so
		// the explorer gallery shows new entries without requiring a page reload.
		// Extract itemIds from context.files which were populated in handleIntentSuccess
		// const linkedItemIds =

		// if (linkedItemIds.length > 0) {
		//     notifyIndexPatches(
		//         context.notifyUploadId || 'unknown',
		//         linkedItemIds
		//     ).catch((err) => {
		//         logger.error({ err }, 'Failed to publish linked item index UPSERT patches');
		//     });
		// }
	},

	handleFailure({ event }: { event: MachineEvents }) {
		return { error: parseErrorMessage(event.payload) };
	},
};
