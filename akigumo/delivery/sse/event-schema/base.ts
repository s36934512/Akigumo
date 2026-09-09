import { z } from "@hono/zod-openapi";

export const BaseEventSchema = z.object({});

export const BasePatchSchema = z.object({ seq: z.number() });

export const EventTypeSchema = z.enum([
	"ARCHIVE_PATCH",
	"CONCEPT_PATCH",
	"PROGRESS",
	"STATUS",
	"FILE_ID_ASSIGNED",
	"COMPLETED",
	"FAILED",
]);
export const EventType = EventTypeSchema.enum;
