import { z } from "@hono/zod-openapi";

import { createFlexibleSchema } from "#akigumo/shared/contracts/schema-factory/index.js";

import { ArchivePatchPayloadInputSchema } from "./archive.js";
import { BaseEventSchema, EventType } from "./base.js";
import { ConceptPatchPayloadInputSchema } from "./concept.js";

const createEventBranch = <
	T extends keyof typeof EventType,
	P extends z.ZodTypeAny,
>(
	type: T,
	payload: P,
) => {
	return BaseEventInputSchema.extend({
		type: z.literal(type),
		payload,
	});
};
const FileIdAssignedPayloadSchema = createFlexibleSchema(
	z.object({
		fileId: z.uuid(),
		tempScanId: z.string().nullish(),
		batchId: z.uuid().nullish(),
	}),
);

const ProgressPayloadSchema = z.object({
	progress: z.number().min(0).max(100),
	message: z.string(),
});

const StatusPayloadSchema = z.object({
	current: z.string(),
	previous: z.string(),
});

const BaseEventInputSchema = BaseEventSchema.extend({
	notifyId: z.string(),
});

export const SseEventInputSchema = z.discriminatedUnion("type", [
	createEventBranch(
		EventType.ARCHIVE_PATCH,
		ArchivePatchPayloadInputSchema.array,
	),
	createEventBranch(
		EventType.CONCEPT_PATCH,
		ConceptPatchPayloadInputSchema.array,
	),
	createEventBranch(EventType.PROGRESS, ProgressPayloadSchema),
	createEventBranch(EventType.STATUS, StatusPayloadSchema),
	createEventBranch(
		EventType.FILE_ID_ASSIGNED,
		FileIdAssignedPayloadSchema.array,
	),
	createEventBranch(EventType.COMPLETED, z.unknown()),
	createEventBranch(EventType.FAILED, z.unknown()),
]);
export type SseEventInput = z.infer<typeof SseEventInputSchema>;
