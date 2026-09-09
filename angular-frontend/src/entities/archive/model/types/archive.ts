import z from "zod";
import { BaseArchiveSchema, ItemTypeSchema } from "./base";
import { FileContainerSchema } from "./file-container";

/** ============================================================================
 *  1. 基礎組合檔案類型 (Base Composite Schema)
 *  ============================================================================
 *  擴充自基礎檔案結構，提供包含子項目計數的通用基底。
 */
export const CompositeArchiveSchema = BaseArchiveSchema.extend({
	count: z.number().default(0),
});

/** ============================================================================
 *  2. 具體檔案類型 (Concrete Archive Schemas)
 *  ============================================================================
 *  定義各種獨特的檔案類型與其對應的 TypeScript 型別。
 */

// --- 作品 (Work) -------------------------------------------------------------
export const WorkSchema = CompositeArchiveSchema.extend({
	type: z.literal(ItemTypeSchema.enum.WORK),
});
export type Work = z.infer<typeof WorkSchema>;

// --- 系列 (Series) -----------------------------------------------------------
export const SeriesSchema = CompositeArchiveSchema.extend({
	type: z.literal(ItemTypeSchema.enum.SERIES),
});
export type Series = z.infer<typeof SeriesSchema>;

// --- 合集 (Collection) -------------------------------------------------------
export const CollectionSchema = CompositeArchiveSchema.extend({
	type: z.literal(ItemTypeSchema.enum.COLLECTION),
});
export type Collection = z.infer<typeof CollectionSchema>;

/** ============================================================================
 *  3. 聯集入口 (Discriminated Union)
 *  ============================================================================
 *  使用 'type' 欄位作為識別標籤，將所有檔案類型整合為單一聯集型別。
 */
export const ArchiveSchema = z.discriminatedUnion("type", [
	FileContainerSchema,
	WorkSchema,
	SeriesSchema,
	CollectionSchema,
]);
export type Archive = z.infer<typeof ArchiveSchema>;
