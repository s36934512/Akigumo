import { z } from "@hono/zod-openapi";

import { ItemTypeSchema } from "#generated/zod/schemas/index.js";

import { BaseArchiveSchema } from "./base.js";

export const FileType = z.enum(["image", "file"]);
export type FileType = z.infer<typeof FileType>;

const CommonFileFieldsSchema = z.object({
	id: z.uuid(),
	size: z.bigint(),
	url: z.string(),

	status: z.string(),
	conceptIds: z.uuid().array().nullish(),
	type: FileType,
});

export const ImageFileSchema = CommonFileFieldsSchema.extend({
	type: z.literal(FileType.enum.image),

	width: z.number(),
	height: z.number(),
});

export const BaseFileSchema = CommonFileFieldsSchema.extend({
	type: z.literal(FileType.enum.file),
});

export const FileSchema = z.discriminatedUnion("type", [
	ImageFileSchema,
	BaseFileSchema,
]);
export type File = z.infer<typeof FileSchema>;

export const FileContainerSchema = BaseArchiveSchema.extend({
	type: z.literal(ItemTypeSchema.enum.FILE_CONTAINER),

	file: FileSchema,
});
export type FileContainer = z.infer<typeof FileContainerSchema>;
