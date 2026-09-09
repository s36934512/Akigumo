/**
 * @file State machine for concept creation workflow
 *
 * The workflow is modeled as explicit states because concept creation spans
 * multiple systems with different consistency guarantees.
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
		/**
		 * Build pending SYNC task for asynchronous processor execution
		 *
		 * This decouples transition timing from worker execution timing.
		 */
		prepareSyncTask: assign(({ context }) => {
			if (context.idList.length === 0) {
				return { nextTask: undefined };
			}

			return {
				nextTask: createSyncIntentOutbox(
					"concept-delete",
					context.idList,
				),
			};
		}),
		/**
		 * Clear pending task after successful sync
		 *
		 * Removing nextTask prevents accidental duplicate dispatch.
		 */
		clearNextTask: assign({ nextTask: undefined }),

		notifyUpdateViaSSE: machineActions.notifyUpdateViaSSE,
	},
}).createMachine({
	/** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMBRAdlgJZYCeAxAFQDaADALqKgAOA9rCUa-kyAB6IALACYANCFKIAHIIB0AVmGCAnMqkA2dSvUBmKcoC+B8Wkw4CxMrIDKAQQBqASQByAcQD6uZwBVH3gJrk3rYeAAoASgDyTtaOkc7u1gCqAMIpuNbWdIxIIGwcxNy8AgjCAIzKsjpKaoqawsq0wgDs4pIIZfqyZbS9tJ06grRStOrNRibo2HiEJKQ2Di4eXr4BQSHuEdGOsfGJqemZ1GU5LOycRbkl5XLVKlJ16g1NrRKIOoqyyvK9ZeoPf2E6kMxhApmmFjmNn8zhSS08Pj8gVc4VsoQAEu4XN4Vu4UuFcLYcQARfZpDJZBi8fIXHhXRDyKQ6WRM5qKWiDZrNMo6V7tHnCKoqVRSZpjBpleSCCZgqbmWZWawwuFuBGrQKhfzedF7ZLko5U3I0wp00AlRqVdQ-UaCMqCfT9HRtRDCWiVLk-V1PWiCdRlYTyIyg-CsCBwXjg+WWdpnApcU38RAAWnUzoQKZlkZm0YWTlVKyR1POJuKQjEb1KOjKLM0-0E8jGZTZbMzcuzUKVsPhBYCRbjlzNiCtt398l5dp0-XraeE1VkzT6o80OirD1bZnbioOFL7tNLHTKkvnAZ9oqryg+fJds4UfzGDv9yn+64hCvmADFbI4ADK4Ym7kt6VKCoqhqB4gSeRoWjTKRqwaVQ1CtO1BBUaUgyAA */
	id: "createConcept",
	initial: "SAVING_CONCEPT",
	on: {
		"*": {
			target: ".FAILED",
			actions: "handleFailure",
		},
	},
	context: {
		notifyId: null,
		idList: [],
		error: null,
		nextTask: null,
	},
	states: {
		SAVING_CONCEPT: {
			on: {
				ONTOLOGY_DELETE_SUCCESS: [
					{
						guard: ({ event }) => event.payload.idList.length > 0,
						target: "SYNCING_CONCEPT",
						actions: ["handleSaveSuccess", "prepareSyncTask"],
					},
					{
						target: "SUCCESS",
						actions: "clearNextTask",
					},
				],
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
			entry: ["notifyUpdateViaSSE", "clearNextTask"],
			type: "final",
		},

		FAILED: {
			entry: "clearNextTask",
			type: "final",
		},
	},
});
