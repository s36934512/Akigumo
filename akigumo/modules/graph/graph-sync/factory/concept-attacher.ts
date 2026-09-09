import { z } from "@hono/zod-openapi";

import { TargetIdSchema } from "#akigumo/modules/ontology/attacher/schema/schema.js";

export const EntrySchema = z.object({
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

export const MapEntrySchema = EntrySchema.omit({
	targetIds: true,
}).extend({
	targetId: z.uuid(),
});
export type MapEntry = z.infer<typeof MapEntrySchema>;

const InputSchema = z.object({
	itemList: MapEntrySchema.array(),
	conceptList: MapEntrySchema.array(),
});

const TaskPayloadSchema = InputSchema.transform((data) => ({
	itemList: data.itemList.map((item) => {
		return {
			itemId: item.targetId,
			itemProps: item.systemProperties ?? {},
			directIds: item.directConceptIds ?? [],
			connectList: item.customAttributes ?? [],
		};
	}),
	conceptList: data.conceptList.map((item) => {
		return {
			itemId: item.targetId,
			itemProps: item.systemProperties ?? {},
			directIds: item.directConceptIds ?? [],
			connectList: item.customAttributes ?? [],
		};
	}),
}));

type InputPayload = z.infer<typeof InputSchema>;

export function buildConceptAttacherTask(payload: InputPayload) {
	return TaskPayloadSchema.parse(payload);
}
