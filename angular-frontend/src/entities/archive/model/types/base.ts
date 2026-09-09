import z from "zod";

/** ============================================================================
 *  1. 列舉型別定義 (Enums)
 *  ============================================================================
 *  定義系統中所有封存項目的核心類型標籤。
 */
export const ItemTypeSchema = z.enum([
	"WORK",
	"SERIES",
	"COLLECTION",
	"FILE_CONTAINER",
]);
export type ItemType = z.infer<typeof ItemTypeSchema>;

/** ============================================================================
 *  2. 狀態標記定義 (Flags)
 *  ============================================================================
 *  管理項目的布林狀態管理（置頂、隱藏、刪除）。
 */
export const ItemFlagsSchema = z.object({
	isPinned: z.boolean().default(false),
	isHidden: z.boolean().default(false),
	isDeleted: z.boolean().default(false),
});

/** ============================================================================
 *  3. 基礎檔案結構 (Base Archive Schema)
 *  ============================================================================
 *  所有檔案物件皆須繼承的通用基礎欄位。
 */
export const BaseArchiveSchema = z.object({
	id: z.uuid(),
	name: z.string().default("sys default"),

	flag: ItemFlagsSchema.prefault({}),

	createdAt: z.coerce.date().default(() => new Date()),
	updatedAt: z.coerce.date().default(() => new Date()),
	conceptList: z
		.object({
			conceptId: z.uuid().nullable(),
			type: z.string().nullable(),
		})
		.array(),
	parentId: z.uuid().optional(),
});
