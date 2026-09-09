/**
 * @file Encapsulated actions for user-registration machine.
 *
 * Why isolate these handlers?
 * Keeping transition logic separate from machine wiring simplifies tests and
 * makes event-shape changes local to one module.
 */

import { assertEvent } from "xstate";

import { parseErrorMessage } from "#akigumo/shared/utils/logger.js";

import { EventCode } from "../contract.js";
import type { MachineEvents } from "./schema.js";

export const actions = {
	handleSaveSuccess({ event }: { event: MachineEvents }) {
		assertEvent(event, EventCode.USER_CREATE_SUCCESS);
		return { userIdList: event.payload };
	},

	handleFailure({ event }: { event: MachineEvents }) {
		return { error: parseErrorMessage(event.payload) };
	},
};
