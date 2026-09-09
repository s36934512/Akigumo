/**
 * @file State machine context and event schemas for user-registration.
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
	correlationId: z.uuid().nullable(),
	userIdList: z.uuid().array(),
});

export type MachineContext = z.infer<typeof ContextSchema>;

const EventsSchema = z.discriminatedUnion("type", [
	successEvent(EventCode.USER_CREATE_SUCCESS, CommonIdSchema.array),
	failureEvent(EventCode.USER_CREATE_FAILURE),

	successEvent("PYTHON_SUCCESS", z.unknown()),
	failureEvent("PYTHON_FAILURE"),
]);

export type MachineEvents = z.infer<typeof EventsSchema>;
