import { z } from "@hono/zod-openapi";
import { TypeConstrainedRecordSchema } from "./general.js";
import {
	createFlexibleSchema,
	type InferFlexible,
} from "./schema-factory/index.js";

export const ConceptRegistrySchema = createFlexibleSchema(
	z.object({
		name: z.string().min(1, "名稱不能為空").openapi({
			description: "概念名稱，至少 1 個字元",
			example: "Product",
		}),
		description: z.string().optional().openapi({
			description: "概念描述，用於補充說明此概念用途",
			example: "代表產品主檔資料",
		}),
		metadata: TypeConstrainedRecordSchema.optional().openapi({
			description: "自訂鍵值對 metadata，可存放額外設定或標記",
			example: {
				source: "admin-panel",
				version: 1,
				tags: ["core", "catalog"],
			},
		}),
	}),
);
export type ConceptRegistry = InferFlexible<typeof ConceptRegistrySchema>;
