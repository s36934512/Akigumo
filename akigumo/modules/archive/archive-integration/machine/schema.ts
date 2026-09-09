/**
 * @file State machine context and event schemas for process-file-item workflow
 * Defines persisted context shape and event contract for item-level file processing
 */
import { z } from "@hono/zod-openapi";

import { MachineContextSchema } from "#akigumo/shared/schemas/machine.js";
import {
	failureEvent,
	successEvent,
} from "#akigumo/shared/schemas/machine.schema.js";

import { EventCode } from "../contract.js";

const StrategySchema = z.object({
	shouldUncompress: z.boolean(),
	shouldTranscode: z.boolean(),
});

const ProcessingProgressSchema = z.object({
	totalIds: z.uuid().array(),
	successIds: z.uuid().array(),
	failedIds: z.uuid().array(),
});

/**
 * Schema for process-file-item machine context
 *
 * Context captures the minimum data required to resume workflow execution:
 * - fileId: target file being processed
 * - parentId: parent workflow correlation ID for callback signaling
 * - strategy: probe result that decides archive/image handling path
 * - status: high-level execution status for observability
 * - nextTask: pending task consumed by async processor
 */
export const ContextSchema = MachineContextSchema.extend({
	fileId: z.uuid().nullable(),
	extensionCode: z.string().nullable(),
	conceptId: z.uuid().nullable(),
	uncompressMaxDepth: z.number(),
	strategy: StrategySchema,

	processingProgress: ProcessingProgressSchema,
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EventsSchema = z.discriminatedUnion("type", [
	successEvent(
		EventCode.ARCHIVE_DISPATCH_TASKS_SUCCESS,
		z.object({
			fileId: z.uuid(),
			extensionCode: z.string(),
			conceptId: z.uuid(),
			strategy: StrategySchema,
			uncompressMaxDepth: z.number(),
		}),
	),

	// ---- Uncompress / Transcode (similar shape; can be unified later) ----
	successEvent(
		EventCode.ARCHIVE_UNCOMPRESS_SUCCESS,
		z.object({
			fileIds: z.uuid().array(),
		}),
	),
	failureEvent(EventCode.ARCHIVE_UNCOMPRESS_FAILURE),

	// ---- Transcode ----
	successEvent(
		EventCode.ARCHIVE_TRANSCODE_SUCCESS,
		z.object({
			fileId: z.uuid(),
			conceptId: z.uuid(),
		}),
	),
	failureEvent(EventCode.ARCHIVE_TRANSCODE_FAILURE),

	successEvent(EventCode.ARCHIVE_STORAGE_SUCCESS, z.unknown()),
	failureEvent(EventCode.ARCHIVE_STORAGE_FAILURE),

	successEvent(
		EventCode.ARCHIVE_NOTIFY_SUCCESS,
		z.object({
			fileId: z.uuid(),
		}),
	),

	successEvent(
		EventCode.ARCHIVE_NOTIFY_PARENT_SUCCESS,
		z.object({
			fileId: z.uuid(),
		}),
	),

	// ---- Graph Sync ----
	successEvent("PYTHON_SUCCESS", z.unknown()),
	failureEvent("PYTHON_FAILURE"),
]);

export type MachineEvents = z.infer<typeof EventsSchema>;
