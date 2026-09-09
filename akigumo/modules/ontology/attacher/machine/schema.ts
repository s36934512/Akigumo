/**
 * @file State machine context and task schemas
 *
 * These schemas define persisted workflow context for tag provisioning.
 * Explicit persisted shape enables reliable rehydration after restarts.
 */

import { z } from "@hono/zod-openapi";

import { MachineContextSchema } from "#akigumo/shared/schemas/machine.js";
import {
	failureEvent,
	successEvent,
} from "#akigumo/shared/schemas/machine.schema.js";

import { EventCode } from "../contract.js";
import { TargetIdSchema } from "../schema/schema.js";

const EntrySchema = z.object({
	targetIds: TargetIdSchema.array().min(1, "目標不能為空"),
	systemProperties: z.record(z.string(), z.string()).nullish(),
	directConceptIds: z.uuid().array().nullish(),
	customAttributes: z
		.object({
			key: z.string(),
			value: z.uuid().array(),
		})
		.array()
		.nullish(),
});

const ContextSchema = MachineContextSchema.extend({
	entrise: EntrySchema.nullish(),
});

/**
 * TypeScript type for machine context
 */
export type MachineContext = z.infer<typeof ContextSchema>;

/**
 * Event schema for concept registry state machine transitions.
 */
const EventsSchema = z.discriminatedUnion("type", [
	successEvent(EventCode.ATTACHER_SUCCESS, EntrySchema),
	failureEvent(EventCode.ATTACHER_FAILURE),

	successEvent("PYTHON_SUCCESS", z.unknown()),
	failureEvent("PYTHON_FAILURE"),
]);

export type MachineEvents = z.infer<typeof EventsSchema>;
