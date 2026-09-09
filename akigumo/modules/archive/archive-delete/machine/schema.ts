/**
 * @file State machine context and task schemas
 *
 * These schemas define persisted workflow context for tag provisioning.
 * Explicit persisted shape enables reliable rehydration after restarts.
 */

import { z } from "@hono/zod-openapi";

import { CommonIdSchema } from "#akigumo/shared/contracts/index.js";
import { MachineContextSchema } from "#akigumo/shared/schemas/machine.js";
import {
	failureEvent,
	successEvent,
} from "#akigumo/shared/schemas/machine.schema.js";

import { EventCode } from "../contract.js";

const ContextSchema = MachineContextSchema.extend({
	idList: CommonIdSchema.array,
});

/**
 * TypeScript type for machine context
 */
export type MachineContext = z.infer<typeof ContextSchema>;

const EventsSchema = z.discriminatedUnion("type", [
	successEvent(EventCode.ARCHIVE_DELETE_SUCCESS, CommonIdSchema.array),
	failureEvent(EventCode.ARCHIVE_DELETE_FAILURE),

	successEvent("PYTHON_SUCCESS", z.unknown()),
	failureEvent("PYTHON_FAILURE"),
]);

export type MachineEvents = z.infer<typeof EventsSchema>;
