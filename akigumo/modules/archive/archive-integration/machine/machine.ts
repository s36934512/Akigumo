/**
 * @file State machine definition for file-integration child workflow
 *
 * Each file item runs its own instance of this machine so one slow or failed
 * item cannot block the rest of the batch. The machine drives a linear
 * DECIDING_PROCESS branch that routes to archive extraction, image
 * transcoding, or direct graph-sync depending on the strategy flags set by
 * the SEAL processor.
 */

import { assign, setup } from "xstate";

import { logger } from "#akigumo/db/pino.js";
import { ARCHIVE_AGGREGATE } from "#akigumo/modules/archive/common/contract.js";
import { createSyncIntentOutbox } from "#akigumo/modules/graph/graph-sync/index.js";
import { shouldFailUnhandledEvent } from "#akigumo/shared/utils/machine/guards.js";
import { ACTION_LIST } from "../contract.js";
import { actions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const machine = setup({
	types: {
		context: {} as MachineContext,
		events: {} as MachineEvents,
	},
	guards: {
		shouldStartUncompress: ({ context }) => {
			if (!context.strategy.shouldUncompress) return false;
			return context.processingProgress.totalIds.length === 0;
		},
		shouldStartTranscode: ({ context }) => {
			if (!context.strategy.shouldTranscode) return false;
			return context.processingProgress.totalIds.length === 0;
		},
		shouldFailUnhandledEvent,
		isAllFilesDone: ({ context }) => {
			const { totalIds, successIds, failedIds } =
				context.processingProgress;
			return (
				totalIds.length > 0 &&
				successIds.length + failedIds.length + 1 === totalIds.length
			);
		},
	},
	actions: {
		handleDispatchSuccess: assign(actions.handleDispatchSuccess),

		handleTranscodeSuccess: assign(actions.handleTranscodeSuccess),

		handleUncompressSuccess: assign(actions.handleUncompressSuccess),

		/**
		 * Archive extraction must precede graph sync
		 *
		 * Graph labels and child-file metadata cannot be determined until the
		 * archive contents are known, so extraction always runs before sync.
		 */
		prepareUncompressTask: assign(({ context }) => {
			return {
				nextTask: {
					aggregateType: ARCHIVE_AGGREGATE,
					operation: ACTION_LIST.UNCOMPRESS.code,
					payload: {
						fileId: context.fileId,
						extensionCode: context.extensionCode,
					},
				},
			};
		}),

		prepareRecursiveUncompressTask: assign(({ context }) => {
			return {
				nextTask: {
					aggregateType: ARCHIVE_AGGREGATE,
					operation: ACTION_LIST.INIT_RECURSIVE.code,
					payload: {
						fileId: context.fileId,
						fileList: context.processingProgress.totalIds,
						uncompressMaxDepth: context.uncompressMaxDepth - 1,
					},
				},
			};
		}),

		/**
		 * Derived WebP assets must exist before the node is considered complete
		 *
		 * The source image alone cannot fulfill display requirements; at least
		 * one transcoded derivative must be produced before graph sync runs.
		 */
		prepareTranscodeTask: assign(({ context }) => {
			return {
				nextTask: {
					aggregateType: ARCHIVE_AGGREGATE,
					operation: ACTION_LIST.TRANSCODE.code,
					payload: {
						id: context.fileId,
					},
				},
			};
		}),

		prepareStorageTask: assign(({ context }) => {
			return {
				nextTask: {
					aggregateType: ARCHIVE_AGGREGATE,
					operation: ACTION_LIST.STORAGE.code,
					payload: {
						fileId: context.fileId,
						fileList: context.processingProgress.totalIds,
					},
				},
			};
		}),

		/**
		 * Schedule a Neo4j MERGE for the completed file node
		 *
		 * Sync runs before notifying the parent so the parent's
		 * completion count only increments once the graph node is durable.
		 */
		prepareSyncTask: assign(({ context }) => {
			if (context.processingProgress.totalIds.length === 0) {
				logger.warn(
					{ context },
					"No files to sync for fileId: %s",
					context.fileId,
				);
				return {};
			}

			if (context.processingProgress.totalIds.length > 1) {
				return {
					nextTask: createSyncIntentOutbox("archive-uncompress", {
						fileId: context.fileId,
						derivedFileIds: context.processingProgress.totalIds,
					}),
				};
			}

			return {
				nextTask: createSyncIntentOutbox("archive-transcode", {
					fileId: context.fileId,
					derivedFileId: context.processingProgress.totalIds[0],
				}),
			};
		}),

		prepareSyncIntentTask: assign(({ context }) => {
			if (context.processingProgress.totalIds.length === 0) {
				return { nextTask: undefined };
			}

			return {
				nextTask: createSyncIntentOutbox(
					"file-registry",
					context.processingProgress.totalIds.map((f) => ({
						fileId: f,
						itemId: f,
					})),
				),
			};
		}),

		prepareNotifyParent: assign(({ context }) => {
			return {
				nextTask: {
					aggregateType: ARCHIVE_AGGREGATE,
					operation: ACTION_LIST.NOTIFY_PARENT.code,
					payload: {
						fileId: context.fileId,
					},
				},
			};
		}),

		completedNotify: assign(actions.completedNotify),

		/**
		 * Persist failure reason and mark workflow as FAILED
		 *
		 * Capturing the error message in context enables targeted diagnostics
		 * without replaying intermediate workflow states from the outbox.
		 */
		handleFailure: assign(actions.handleFailure),

		/**
		 * Remove the pending task reference after successful enqueue
		 *
		 * Clearing prevents accidental double-enqueue when workflow state is
		 * rehydrated from the database on process restart.
		 */
		clearNextTask: assign({ nextTask: null }),
	},
}).createMachine({
	/** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AxnWAxAlgDZgCSALmALYDEAVANoAMAuoiurPmfugHZsgAHogAsAJgA0IAJ6IAjAE4FAOhFKFagMxyArI0YA2TQA4AvqalosOAsXJVlAdQCCJACokAcgHEA+gGU3ZwAlN2oQgGEACRIANQBRXwAREn8ABWc3aN8g-wBpfwCAVQiI+P9-JlYkEGQOLh5+GuEEMTkAdmVNAzEdOWMFYzkRTREdTSlZBAVGZQVexnbGHSUDAwVR80sMbFg8IlIKSmUk+IiSFJ9fNOCAeTKK6iqBOs5uPgEW9vaDZSX9RYiIHiETtSaIEw6ZQA5YKb6DEyaHRbWo7GwHezHU7nS5+G73cr+J5yarsN6NT6Ib6-f76drAkFgmSIYyaZQ6PSMYYiYx9IZclFWXb7OxHE5nC5ePF3B5E+hiUm1ervJqgL4-P4w+nAsSg8EIHTiZQGdp6XUKNY6MRiBSCtF7WyHBxFTwRW4AWRuhKl4WC0TiiRdbs9wUJxVKhOeNVeDQ+zXk1s6Q11S0NVrEy313RUmgW6xmPxNIjt1gdGLF-gAmq6pb4vG54p4wt5gs40lE603G25fBFQ5l4klw7Ko2TY6qhPJDWyDHJdXp2ppRusDFm5+z6YMdAYxh1liXhY7McoqzWrvXu9Q0pW3FFbp5h5GWC9lRT4wh+utVLrjENNHD-zWLMZmhAEkUMJZtEYYsLFRUsRSdY4XHcWt8VlH0vHcXxQwiIpgn8ANHwqUclXJOM1UQa1llUAxjAMRgNh0U02jXFRjDzQZjEYZdkVgoV0VFBxkI8K40O9HxfX9BJfE8W4PFwSsiMqZ9o1fcjJ1aK02TkOcRDkbjumtJFgM6BYdI2RgqNTA8BMQpxXBE6UCQqH1IhiaTZPkxT-BKEcSRfMiJxaNoRj+TRtUMOEdGMdpjH1a0RFUU0uUUbRFEWXjtngo8xTcVtPH8N1cUk9zEjy5wCqKxIfIjYiVLHFVKQ-bdfnNYwRDpOcYqZKYhmUG0lHYhQWq69obLLQTjkCW5W28eISsI6bZuq3yn0VGNGvfbQuNUGLFjEbVdCA5kEH-UzOT038DvmQxxoQ49T3OK5cBIAAZeaWzbDsLybXt+wbIcapHerSPHJrlzkP5dTWb4GPSnqIQO6FTV0PTdHTQ07pyhxHtrF73qvG87wfIG1oCsGttizpxnaXU5E0LkxFouKTo6xLOWguitytOisfLBxPJIBTrhCS83MIwXhYyUNftJur1rUoLRHnZQdKowEBkNfVxE6XM+ks9Y6I6ORzFg3h0AgOAXnte6jnJzaKIQABaVcTpdvnJvslCrkCEI3Htt9HfEfUdLZXkAT3U01D0j27OxSVRJlQkA-UlptzEfq50NA64fEFmplD5Rw-0SPDQ0E2+Jt7HjiDD0vRcnwU6Vj9oNmH5oYMcZc3mERteok09G6b5eU7mCssPfmpurJ6-B+-3VMCpq5FnMO5yRTvGFZXVtfXeY9BGFYRiZzRY+PYTUKThvvCbprrTaXbFwGDLxl71mM1V5L9-0zf2gr8fbOPOVSqtxcQ33fPTSycxtBiCHr0HoB0Q7QX6gsMQe1QRcV-qfCsbgZrODmmAx2NoGbQlWLycQbR2gKGAjSZKf5rTpTMJXbKk8TzTzxm9eIBCNJIiBP1JQsVQ4jEXNrJG4g9BMWtNFHk0EsECzkkLRS0tuxcJaP+DYxo5z9HmOvZer8phs2hAsX89NKF9CYrIqaq0KgqNENFWY6hvj9A6mQvuGdvh6GGvpPoIwkQWOULgVw70kg2NaNaLoPQ+SDGGKMcYIcLT9U3IuJY6geQwXMEAA */
	id: "processFileItem",
	initial: "WAITING_START",
	on: {
		"*": {
			target: ".FAILED",
			actions: "handleFailure",
		},
	},
	context: {
		fileId: null,
		extensionCode: null,
		conceptId: null,
		uncompressMaxDepth: 0,
		strategy: {
			shouldUncompress: false,
			shouldTranscode: false,
		},
		processingProgress: {
			totalIds: [],
			successIds: [],
			failedIds: [],
		},
		nextTask: null,
		error: null,
	},
	states: {
		WAITING_START: {
			on: {
				ARCHIVE_DISPATCH_TASKS_SUCCESS: {
					target: "DECIDING_PROCESS",
					actions: "handleDispatchSuccess",
				},
			},
		},
		DECIDING_PROCESS: {
			always: [
				{
					guard: "shouldStartUncompress",
					target: "UNCOMPRESSING",
					actions: "prepareUncompressTask",
				},
				{
					guard: "shouldStartTranscode",
					target: "TRANSCODING",
					actions: "prepareTranscodeTask",
				},
				{
					target: "STORAGE",
					actions: "prepareStorageTask",
				},
			],
		},
		UNCOMPRESSING: {
			on: {
				ARCHIVE_UNCOMPRESS_SUCCESS: {
					target: "SYNCING_INTENT",
					actions: [
						"handleUncompressSuccess",
						"prepareSyncIntentTask",
					],
				},
			},
		},
		SYNCING_INTENT: {
			on: {
				GRAPH_INTENT_CREATED_SUCCESS: {
					actions: "clearNextTask",
				},
				PYTHON_SUCCESS: {
					target: "WAITING_PROCESSING",
					actions: "prepareRecursiveUncompressTask",
				},
			},
		},
		WAITING_PROCESSING: {
			on: {
				INIT_RECURSIVE_SUCCESS: {
					actions: "clearNextTask",
				},
				ARCHIVE_NOTIFY_SUCCESS: [
					{
						guard: "isAllFilesDone",
						target: "STORAGE",
						actions: "completedNotify",
					},
					{
						actions: "completedNotify",
					},
				],
			},
		},
		TRANSCODING: {
			on: {
				ARCHIVE_TRANSCODE_SUCCESS: {
					target: "STORAGE",
					actions: "handleTranscodeSuccess",
				},
			},
		},
		STORAGE: {
			entry: "prepareStorageTask",
			on: {
				ARCHIVE_STORAGE_SUCCESS: {
					target: "SYNCING_FILE",
					actions: "prepareSyncTask",
				},
			},
		},
		SYNCING_FILE: {
			on: {
				GRAPH_INTENT_CREATED_SUCCESS: {
					actions: "clearNextTask",
				},
				PYTHON_SUCCESS: {
					target: "NOTIFY_PARENT",
					actions: "clearNextTask",
				},
			},
		},
		NOTIFY_PARENT: {
			entry: "prepareNotifyParent",
			on: {
				ARCHIVE_NOTIFY_PARENT_SUCCESS: {
					target: "SUCCESS",
				},
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
