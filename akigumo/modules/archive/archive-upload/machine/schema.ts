/**
 * @file State machine context and task schemas
 * Defines Zod schemas for validating state machine context and internal tasks
 */

import { z } from "@hono/zod-openapi";

import { MachineContextSchema } from "#akigumo/shared/schemas/machine.js";
import {
	failureEvent,
	successEvent,
} from "#akigumo/shared/schemas/machine.schema.js";

import { EventCode } from "../contract.js";

export const FileStateSchema = z.object({
	fileId: z.uuid(),
	fileName: z.string().optional(),
	mimeType: z.string().optional(),
	status: z.enum([
		"UPLOADING",
		"UPLOADED",
		"PROCESSING",
		"COMPLETED",
		"FAILED",
	]),
	error: z.unknown().nullish(),
	tempScanId: z.string().optional(),
	itemId: z.uuid().nullish(),
	path: z.string().nullish(),
});

const ProcessingProgressSchema = z.object({
	totalIds: z.array(z.uuid()),
	successIds: z.array(z.uuid()),
	failedIds: z.array(z.uuid()),
});

/**
 * Schema for state machine context during file creation workflow
 * Maintains workflow state including file IDs, correlation ID, status, and pending tasks
 *
 * Note: File machine maintains a more complex context structure compared to entity/item
 * due to support for multiple file processing states (archive, image processing, etc.)
 *
 * @schema
 * @property {string|null} correlationId - Unique correlation ID for tracing
 * @property {Array<object>} files - Array of file status objects
 * @property {object|null} error - Error details if workflow failed
 * @property {string} status - Workflow status: PENDING, SAVING, SUCCESS, or FAILED
 * @property {object|null} nextTask - Pending synchronization task to execute
 */
export const ContextSchema = MachineContextSchema.extend({
	notifyId: z.uuid().nullable(),
	batchId: z.uuid().nullable(),
	fileList: FileStateSchema.array(),
	processingProgress: ProcessingProgressSchema,
});

/**
 * Inferred TypeScript type for state machine context
 * @typedef {z.infer<typeof ContextSchema>} MachineContext
 */
export type MachineContext = z.infer<typeof ContextSchema>;

const EventsSchema = z.discriminatedUnion("type", [
	// Intent validation results
	successEvent(
		EventCode.ARCHIVE_INTENT_SUCCESS,
		z.object({
			notifyId: z.uuid(),
			batchId: z.uuid(),
			fileList: FileStateSchema.array(),
		}),
	),
	failureEvent(EventCode.ARCHIVE_INTENT_FAILURE),

	successEvent(EventCode.ARCHIVE_SEAL_SUCCESS, z.uuid()),
	failureEvent(EventCode.ARCHIVE_SEAL_FAILURE),

	successEvent("PYTHON_SUCCESS", z.unknown()),
	failureEvent("PYTHON_FAILURE"),
]);

// Exported for XState setup — keeps the type in sync with the Zod schema
export type MachineEvents = z.infer<typeof EventsSchema>;
