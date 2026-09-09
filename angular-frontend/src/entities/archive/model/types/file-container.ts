import z from "zod";

import { BaseArchiveSchema, ItemTypeSchema } from "./base";

// ============================================================================
// 1. 基礎型別與常量定義 (Enums & Types)
// ============================================================================

export const FileTypeSchema = z.enum(["image", "file"]);
export type FileType = z.infer<typeof FileTypeSchema>;

// ============================================================================
// 2. 共通欄位結構 (Base Structure)
// ============================================================================

export const CommonFileFieldsSchema = z.object({
	id: z.uuid().optional(),
	size: z.coerce.bigint().default(0n),
	url: z.string().optional(),

	status: z.string().optional(),
	conceptIds: z.uuid().array().nullable().optional(),
});

// ============================================================================
// 3. 衍生子類別 Schema (Sub-schemas)
// ============================================================================

export const ImageFileSchema = CommonFileFieldsSchema.extend({
	type: z.literal(FileTypeSchema.enum.image),

	width: z.number().int().nonnegative().default(0),
	height: z.number().int().nonnegative().default(0),
});

export const RegularFileSchema = CommonFileFieldsSchema.extend({
	type: z.literal(FileTypeSchema.enum.file),
});

// ============================================================================
// 4. 最終對外導出的聯合與容器 (Exports)
// ============================================================================

export const FileSchema = z.discriminatedUnion("type", [
	ImageFileSchema,
	RegularFileSchema,
]);
export type File = z.infer<typeof FileSchema>;

export const FileContainerSchema = BaseArchiveSchema.extend({
	type: z.literal(ItemTypeSchema.enum.FILE_CONTAINER),
	file: FileSchema.prefault({ type: "file" }),
});
export type FileContainer = z.infer<typeof FileContainerSchema>;
