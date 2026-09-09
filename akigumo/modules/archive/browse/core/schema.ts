import { z } from "@hono/zod-openapi";

import { ItemTypeSchema } from "#generated/zod/schemas/index.js";

const toSnakeUpperCase = (str: string): string => {
	return str
		.replace(/([a-z])([A-Z])/g, "$1_$2") // 在小寫與大寫字母間插入底線
		.toUpperCase();
};

export const RecordTypesToItemType = z
	.array(z.any())
	.transform((items, ctx) => {
		// 1. 先將陣列內的所有字串轉換格式
		const formattedItems = items.map((item) =>
			typeof item === "string" ? toSnakeUpperCase(item) : "",
		);

		// 2. 尋找符合 ItemTypeSchema 的項目
		const found = formattedItems.find(
			(item) => ItemTypeSchema.safeParse(item).success,
		);

		// 3. 如果找不到，使用 Zod 規範回報錯誤
		if (!found) {
			ctx.addIssue({
				code: "custom",
				message: `無法對應到合法的 ItemType。原始資料: [${items.join(", ")}]，轉換後: [${formattedItems.filter(Boolean).join(", ")}]`,
			});
			return z.NEVER;
		}

		return found;
	})
	.pipe(ItemTypeSchema);

export const BrowseItemSchema = z
	.object({
		id: z.uuid().openapi({ description: "項目 UUID" }),
		conceptList: z
			.object({
				conceptId: z.uuid(),
				type: z.string(),
			})
			.array()
			.openapi({ description: "項目的屬性 種類:標籤UUID" }),
		type: ItemTypeSchema.openapi({ description: "項目類型" }),
		position: z
			.number()
			.openapi({ description: "在當前層級的排序權重 (Neo4j r.order)" }),
	})
	.openapi("BrowseItem");

export type BrowseItem = z.infer<typeof BrowseItemSchema>;

export const GetStructureFromNeo4jSchema = z
	.object({
		parentId: z
			.uuid()
			.nullish()
			.openapi({ description: "父節點 ID，省略則為頂層" }),
		showDeleted: z
			.boolean()
			.default(false)
			.openapi({ description: "是否顯示已刪除項目" }),
	})
	.openapi("GetStructureFromNeo4j");

export type GetStructureFromNeo4j = z.infer<typeof GetStructureFromNeo4jSchema>;

export const BrowseRequestSchema = GetStructureFromNeo4jSchema.extend({
	notifyId: z
		.uuid()
		.openapi({ description: "SSE 連線 ID，用於觸發內容補全" }),
});

export type BrowseRequest = z.infer<typeof BrowseRequestSchema>;

export const BrowseResponseSchema = z.object({
	items: z.array(BrowseItemSchema),
	breadcrumbs: z
		.array(
			z.object({
				id: z.uuid(),
				name: z.string(),
			}),
		)
		.openapi({ description: "導覽路徑" }),
});

export type BrowseResponse = z.infer<typeof BrowseResponseSchema>;
