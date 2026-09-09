import { z } from "@hono/zod-openapi";
import { ConceptRegistrySchema } from "#akigumo/shared/contracts/concept.js";

export interface Neo4jImportRow {
	targetId: string;
	keyId: string;
	keyType: string;
	values: string[];
}

const PoolSchema = ConceptRegistrySchema.single.extend({
	id: z.uuid(),
});
type Pool = z.infer<typeof PoolSchema>;

export const EntrySchema = z.object({
	pool: PoolSchema.array(),
	entryList: z
		.object({
			targetIdList: z.uuid().array(),
			metadataList: z
				.object({
					key: z.uuid(),
					value: z.uuid().array(),
				})
				.array(),
		})
		.array(),
});

export const MapEntrySchema = z
	.object({
		key: z.object({
			id: z.uuid(),
			type: z.string().optional(),
		}),
		value: z.uuid().array(),
	})
	.array();
export type MapEntry = z.infer<typeof MapEntrySchema>;

const InputSchema = z.object({
	targetId: z.uuid(),
	keyId: z.uuid(),
	keyType: z.string(),
	values: z.uuid().array(),
});

const TaskPayloadSchema = InputSchema.transform((data) => {
	data;
});

type InputPayload = z.infer<typeof InputSchema>;

export function buildArchiveConceptTask(payload: InputPayload) {
	return TaskPayloadSchema.parse(payload);
}

const PoolTaskPayloadSchema = PoolSchema.transform((data) => {
	return {
		conceptId: data.id,
		conceptProps: {
			name: data.name ?? null,
		},
	};
});
export function buildArchiveConceptPoolTask(payload: Pool) {
	return PoolTaskPayloadSchema.parse(payload);
}
