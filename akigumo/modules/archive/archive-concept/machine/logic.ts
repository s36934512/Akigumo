import { assertEvent } from "xstate";

import { parseErrorMessage } from "#akigumo/shared/utils/logger.js";

import { EventCode } from "../contract.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
	handleSaveSuccess({ event }: { event: MachineEvents }) {
		assertEvent(event, EventCode.ARCHIVE_CONCEPT_PAIR_SUCCESS);
		return { pool: event.payload.pool, entryList: event.payload.entryList };
	},

	handleFailure({ event }: { event: MachineEvents }) {
		return { error: parseErrorMessage(event.payload) };
	},
};
