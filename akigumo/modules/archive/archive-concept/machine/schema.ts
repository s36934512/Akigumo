import { z } from "@hono/zod-openapi";

import { ConceptRegistrySchema } from "#akigumo/shared/contracts/concept.js";
import {
	CommonIdSchema,
	createFlexibleSchema,
} from "#akigumo/shared/contracts/index.js";
import { MachineContextSchema } from "#akigumo/shared/schemas/machine.js";
import {
	failureEvent,
	successEvent,
} from "#akigumo/shared/schemas/machine.schema.js";

import { EventCode } from "../contract.js";

const PoolSchema = ConceptRegistrySchema.single.extend({
	id: CommonIdSchema.single,
});

const ArchiveConceptEntrySchema = createFlexibleSchema(
	z.object({
		targetIdList: z.uuid().array(),
		metadataList: z
			.object({
				key: z.uuid(),
				value: z.uuid().array(),
			})
			.array(),
	}),
);

const ContextSchema = MachineContextSchema.extend({
	pool: PoolSchema.array().optional(),
	entryList: ArchiveConceptEntrySchema.array.optional(),
});

export type MachineContext = z.infer<typeof ContextSchema>;

const EventsSchema = z.discriminatedUnion("type", [
	successEvent(
		EventCode.ARCHIVE_CONCEPT_PAIR_SUCCESS,
		z.object({
			pool: PoolSchema.array(),
			entryList: ArchiveConceptEntrySchema.array,
		}),
	),
	failureEvent(EventCode.ARCHIVE_CONCEPT_PAIR_FAILURE),

	successEvent("PYTHON_SUCCESS", z.unknown()),
	failureEvent("PYTHON_FAILURE"),
]);

export type MachineEvents = z.infer<typeof EventsSchema>;
