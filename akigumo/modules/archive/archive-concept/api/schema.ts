import { z } from "@hono/zod-openapi";

import {
	CommonIdObjectSchema,
	CommonIdSchema,
} from "#akigumo/shared/contracts/common.js";
import {
	ConceptRegistrySchema,
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/index.js";
import { BaseResponseSchema } from "#akigumo/shared/schemas/api.schema.js";

export const RelationTypeSchema = createFlexibleSchema(
	CommonIdObjectSchema.single.or(
		z.object({ name: z.string(), id: CommonIdSchema.single.optional() }),
	),
);
export type RelationType = InferFlexible<typeof RelationTypeSchema>;

export const MetadataSchema = createFlexibleSchema(
	z.object({
		key: RelationTypeSchema.single,
		value: CommonIdObjectSchema.single
			.or(ConceptRegistrySchema.single)
			.array(),
	}),
);
export type Metadata = InferFlexible<typeof MetadataSchema>;

export const ArchiveConceptSchema = createFlexibleSchema(
	z.object({
		targetIdList: CommonIdSchema.array.min(1, "目標不能為空").openapi({
			description: "目標archive",
			example: ["01a05759-5fea-766a-87ee-ca68fb72a6ca"],
		}),
		metadataList: MetadataSchema.array.optional().openapi({
			description: "動態新增概念，用於增加尚未存在的屬性",
			example: [
				{
					key: {
						id: "048ea356-e8b7-5ff0-a582-1152cda9667a",
					},
					value: [
						{
							name: "eightzhuan",
							metadata: { x: "https://x.com/eightzhuan" },
						},
					],
				},
				{
					key: { name: "原作" },
					value: [
						{
							id: "01a025fa-4524-7660-aa3b-ce104ee37846",
						},
					],
				},
			],
		}),
	}),
);

export type ArchiveConcept = InferFlexible<typeof ArchiveConceptSchema>;

export const RequestSchema = ArchiveConceptSchema.array;

export const ResponseSchema = BaseResponseSchema;
