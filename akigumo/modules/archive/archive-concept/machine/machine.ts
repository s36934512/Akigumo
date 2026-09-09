/**
 * @file State machine for archive concept registration.
 */
import { assign, setup } from "xstate";
import { createSyncIntentOutbox } from "#akigumo/modules/graph/graph-sync/index.js";
import { shouldFailUnhandledEvent } from "#akigumo/shared/utils/machine/guards.js";
import { machineActions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const machine = setup({
	types: {
		context: {} as MachineContext,
		events: {} as MachineEvents,
	},
	guards: {
		shouldFailUnhandledEvent,
	},
	actions: {
		handleSaveSuccess: assign(machineActions.handleSaveSuccess),
		handleFailure: assign(machineActions.handleFailure),
		clearNextTask: assign({ nextTask: undefined }),
		prepareSyncTask: assign(({ context }) => {
			if (!context.pool && !context.entryList) {
				return { nextTask: undefined };
			}

			return {
				nextTask: createSyncIntentOutbox("archive-concept", {
					pool: context.pool,
					entryList: context.entryList,
				}),
			};
		}),
	},
}).createMachine({
	id: "archive-concept-index",
	initial: "INDEXING",
	on: {
		"*": {
			guard: "shouldFailUnhandledEvent",
			target: ".FAILED",
			actions: "handleFailure",
		},
	},
	context: {
		error: null,
		nextTask: null,
	},
	states: {
		INDEXING: {
			on: {
				ARCHIVE_CONCEPT_PAIR_SUCCESS: {
					target: "SYNCING_CONCEPT",
					actions: ["handleSaveSuccess", "prepareSyncTask"],
				},
			},
		},
		SYNCING_CONCEPT: {
			on: {
				GRAPH_INTENT_CREATED_SUCCESS: {
					actions: "clearNextTask",
				},
				PYTHON_SUCCESS: {
					target: "SUCCESS",
					actions: "clearNextTask",
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
