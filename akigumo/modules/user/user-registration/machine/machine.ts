/**
 * @file State machine for user registration workflow.
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
		shouldFailUnhandledEvent,
	},
	actions: {
		handleSaveSuccess: assign(actions.handleSaveSuccess),
		handleFailure: assign(actions.handleFailure),
		prepareSyncTask: assign(({ context }) => {
			if (context.userIdList.length === 0) {
				return { nextTask: undefined };
			}

			return {
				nextTask: createSyncIntentOutbox(
					"user-registration",
					context.userIdList,
				),
			};
		}),
		clearNextTask: assign({ nextTask: undefined }),
	},
}).createMachine({
	/** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMBVWYqAxLgMoCiASgPoDCl5AggCrnUBijAkgDK4MBtAAwBdRKAAOAe1gBLLLKkA7cSAAeiACwAmADQgAnls1CAdAGZtAViFCAHNrvmAjA7sBfd-rSYc+QkQACgCazAASAPIAchzcfIKiqtJyCsqqGgg6+kYI5pqapgCcAOw2zs5CVhXFecWe3ujYeATEAFTCYkggyfKKKl0ZWYaI1tqmAGzamoVO1uPjDoXa9SA+Tf6opqSMAGpcUQDi1GRUJBQ09Eys1KS4tLTkpKQdSTK9aQMjhWaapbbaxRqvzsVk02UQdmcpm0hVhhU0TnGxV+xWcKzWfhaW12+yOJ0oZyodAYLDYt3uj2ezk6kjeqX6oAyjispl+NiEAKBxRBYOGCG05mKpjscMhQk0VmKAu0yy8q0amMIW2CUVouOO5yCoUiMXJDyeLy6PXp6QhznMRUm0zskyEqOcej58NMUumJQWdglNUKnjlSikEDgqgxzUIrxSfVNCAAtONwTHxqZbMmU6m6nKQxtsXtDhqqOH3gz1IgHXZhYKbNzxg7CuZ5vGHQUhPN5i4rRVzOiFaHNqQVWrc-iCybPghxvkXXZkSVioVXHlHTlykLx3DxlY5+YN5o0Rnu1m9ZTh5HRxVtGYhILpo5inbrHYG-ZWS3JuZvpe8uMu74e6ZOLxyAAEWPD5GS+H4-g5QFah5eM8gtaxkynQpQTPX13CAA */
	id: "createUser",
	initial: "SAVING_USER",
	on: {
		"*": {
			target: ".FAILED",
			actions: "handleFailure",
		},
	},
	context: {
		correlationId: null,
		userIdList: [],
		error: null,
		nextTask: null,
	},
	states: {
		SAVING_USER: {
			on: {
				USER_CREATE_SUCCESS: [
					{
						guard: ({ event }) => event.payload.length > 0,
						target: "SYNCING_USER",
						actions: ["handleSaveSuccess", "prepareSyncTask"],
					},
					{
						target: "SUCCESS",
						actions: "clearNextTask",
					},
				],
			},
		},
		SYNCING_USER: {
			on: {
				PYTHON_SUCCESS: {
					target: "SUCCESS",
					actions: "clearNextTask",
				},
			},
		},
		SUCCESS: {
			entry: "clearNextTask",
			type: "final",
		},
		FAILED: {
			entry: "clearNextTask",
			type: "final",
		},
	},
});
