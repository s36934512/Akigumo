/**
 * @file State machine for file-receiver workflow
 *
 * Drives the full lifecycle from upload intent to graph-sync completion.
 * Each phase (intent, initial sync, child dispatch, batch wait, final sync)
 * maps to a discrete state so the workflow can be resumed deterministically
 * from the outbox on process restart.
 */

import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#akigumo/modules/graph/graph-sync/index.js";
import { shouldFailUnhandledEvent } from "#akigumo/shared/utils/machine/guards.js";

import { actions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const machine = setup({
	types: {
		context: {} as MachineContext,
		events: {} as MachineEvents,
	},
	guards: {
		isAllFilesDone: ({ context }) => {
			const { totalIds, successIds, failedIds } =
				context.processingProgress;
			console.log("Checking if all files are done:", {
				totalIds,
				successIds,
				failedIds,
			});
			return (
				totalIds.length > 0 &&
				successIds.length + failedIds.length + 1 === totalIds.length
			);
		},
		shouldFailUnhandledEvent,
	},
	actions: {
		/**
		 * Narrow INTENT response to the fields the machine needs
		 *
		 * We keep only the fields needed for downstream states so workflow
		 * context records stay small and reload quickly on restart.
		 */
		handleIntentSuccess: assign(actions.handleIntentSuccess),

		/**
		 * Parent graph node must exist before child item nodes can reference it
		 *
		 * Enqueuing sync first prevents orphan edges in the graph database
		 * when child items are dispatched in the next state.
		 */
		prepareSyncTask: assign(({ context }) => {
			if (context.fileList.length === 0) {
				return { nextTask: undefined };
			}

			return {
				nextTask: createSyncIntentOutbox(
					"file-registry",
					context.fileList.map((f) => ({
						fileId: f.fileId,
						itemId: f.itemId,
					})),
				),
			};
		}),

		notifyUploadUrlViaSSE: actions.notifyUploadUrlViaSSE,

		/**
		 * Remove the pending task reference after successful enqueue
		 *
		 * Clearing prevents accidental duplicate enqueue when the workflow
		 * state is rehydrated from the database on process restart.
		 */
		clearNextTask: assign({ nextTask: null }),

		/**
		 * Increment per-file completion counter without a DB query
		 *
		 * The `isAllFilesDone` guard reads this counter so batch-completion
		 * can be detected in memory without a database query.
		 */
		completedNotify: assign(actions.completedNotify),

		/**
		 * Persist failure reason and mark workflow as FAILED
		 *
		 * Storing the error message in context enables trace-based diagnostics
		 * without replaying the full workflow from the outbox.
		 */
		handleFailure: assign(actions.handleFailure),
	},
}).createMachine({
	id: "createFile",
	initial: "VALIDATING_INTENT",
	on: {
		ARCHIVE_INTENT_FAILURE: { target: ".FAILED", actions: "handleFailure" },
		ARCHIVE_SEAL_FAILURE: { target: ".FAILED", actions: "handleFailure" },
		PYTHON_FAILURE: { target: ".FAILED", actions: "handleFailure" },
		"*": {
			guard: "shouldFailUnhandledEvent",
			target: ".FAILED",
			actions: "handleFailure",
		},
	},
	context: {
		fileList: [],
		error: null,
		nextTask: null,
		notifyId: null,
		batchId: null,
		processingProgress: {
			totalIds: [],
			successIds: [],
			failedIds: [],
		},
	},
	states: {
		VALIDATING_INTENT: {
			on: {
				ARCHIVE_INTENT_SUCCESS: {
					target: "SYNCING_INTENT",
					actions: ["handleIntentSuccess", "prepareSyncTask"],
				},
			},
		},

		SYNCING_INTENT: {
			on: {
				GRAPH_INTENT_CREATED_SUCCESS: {
					actions: "clearNextTask",
				},
				PYTHON_SUCCESS: {
					target: "WAITING",
					actions: "clearNextTask",
				},
			},
		},

		WAITING: {
			entry: "notifyUploadUrlViaSSE",
			on: {
				ARCHIVE_SEAL_SUCCESS: [
					{
						guard: "isAllFilesDone",
						target: "SUCCESS",
						actions: ["completedNotify"],
					},
					{
						actions: "completedNotify",
					},
				],
			},
		},

		SUCCESS: {
			type: "final",
			entry: "clearNextTask",
		},

		FAILED: {
			type: "final",
			entry: "clearNextTask",
		},
	},
});
