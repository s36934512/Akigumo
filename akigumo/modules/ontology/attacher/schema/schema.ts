import { z } from "@hono/zod-openapi";
import { ConceptRegistrySchema } from "#akigumo/shared/contracts/index.js";
import {
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/schema-factory/index.js";

export const AttributesSchema = createFlexibleSchema(
	z.object({
		key: z.string(),
		value: ConceptRegistrySchema.array.min(1, "value不能為空"),
	}),
);
export type Attributes = InferFlexible<typeof AttributesSchema>;

export const TargetIdSchema = z.object({
	id: z.uuid(),
	type: z.enum(["item", "concept"]),
});
export type TargetId = z.infer<typeof TargetIdSchema>;

export const AttachAttributesSchema = createFlexibleSchema(
	z.object({
		targetIds: TargetIdSchema.array()
			.min(1, "目標不能為空")
			.openapi({
				description: "目標至少 1 個",
				example: [
					{
						id: "019fec44-6d8d-745f-8541-8dff605f5541",
						type: "item",
					},
				],
			}),
		systemProperties: z
			.record(z.string(), z.string())
			.optional()
			.openapi({
				description: "系統預定屬性 (寫入 Item/Concept Node Property)",
				example: {
					fileType: "pdf",
				},
			}),
		directConceptIds: z
			.uuid()
			.array()
			.optional()
			.openapi({
				description: "將既有concept連結到目標上",
				example: ["019fec44-6d8d-745f-8541-8dff605f5541"],
			}),
		customAttributes: AttributesSchema.array.optional().openapi({
			description: "動態新增概念，用於增加尚未存在的屬性",
			example: [
				{
					key: "繪師",
					value: [
						{
							name: "eightzhuan",
							metadata: { x: "https://x.com/eightzhuan" },
						},
					],
				},
				{
					key: "原作",
					value: [
						{
							name: "Shadowverse",
						},
					],
				},
			],
		}),
	}),
);
export type AttachAttributes = InferFlexible<typeof AttachAttributesSchema>;
