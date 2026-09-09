/**
 * @file Encapsulated actions for concept registry machine
 *
 * Why this module exists:
 * - Keep machine.ts focused on state transitions.
 * - Isolate event parsing and payload mapping for easier unit tests.
 */

import { assertEvent } from "xstate";
import { logger } from "#akigumo/db/pino.js";
import { notifyClient } from "#akigumo/delivery/sse/index.js";
import { PatchOperate } from "#akigumo/shared/schemas/sse.js";
import { parseErrorMessage } from "#akigumo/shared/utils/logger.js";
import { EventCode } from "../contract.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const machineActions = {
	handleSaveSuccess({ event }: { event: MachineEvents }) {
		assertEvent(event, EventCode.ONTOLOGY_REGISTRY_SUCCESS);
		return {
			notifyId: event.payload.notifyId,
			idList: event.payload.idList,
		};
	},

	handleFailure({ event }: { event: MachineEvents }) {
		return { error: parseErrorMessage(event.payload) };
	},

	notifyUpdateViaSSE({ context }: { context: MachineContext }) {
		// Client needs server-assigned file IDs before it can start TUS streaming.
		// SSE avoids polling and delivers IDs as soon as the dispatcher confirms them.

		const payload = context.idList.flatMap((item) => {
			return [
				{
					op: PatchOperate.DELETE_OBJ,
					entry: { id: item },
				},
			];
		});

		notifyClient({
			notifyId: context.notifyId || "unknown",
			type: "CONCEPT_PATCH",
			payload,
		}).catch((err) => {
			logger.error(
				{ err },
				"Failed to publish FILE_ID_ASSIGNED SSE event",
			);
		});
	},
};
