/**
 * @file Encapsulated actions for concept registry machine
 *
 * Why this module exists:
 * - Keep machine.ts focused on state transitions.
 * - Isolate event parsing and payload mapping for easier unit tests.
 */

import { assertEvent } from "xstate";

import { parseErrorMessage } from "#akigumo/shared/utils/logger.js";

import { EventCode } from "../contract.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
	handleSaveSuccess({ event }: { event: MachineEvents }) {
		assertEvent(event, EventCode.ATTACHER_SUCCESS);
		console.log(event);
		return {
			entrise: event.payload,
		};
	},

	handleFailure({ event }: { event: MachineEvents }) {
		return { error: parseErrorMessage(event.payload) };
	},
};
