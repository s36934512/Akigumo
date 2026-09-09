import { z } from "@hono/zod-openapi";

import { ItemType } from "#generated/prisma/enums.js";
import {
	FileExtensionModelSchema,
	FileModelSchema,
	ItemModelSchema,
} from "#generated/zod/schemas/index.js";

const FileMetadataSchema = z.object({
	width: z.number(),
	height: z.number(),
});

const FileSchema = FileModelSchema.pick({
	id: true,
	size: true,
	status: true,
	metadata: true,
}).extend({
	fileExtension: FileExtensionModelSchema.pick({
		mimeType: true,
	}),
});

const InputSchema = z.object({
	file: FileSchema,
	item: ItemModelSchema,
});

function ToFileContainer(input: z.infer<typeof FileSchema>) {
	const commonFileFields = {
		id: input.id,
		size: input.size,
		url: `/api/v1/raw/${input.id}`,

		status: input.status,
	};

	const type = input.fileExtension.mimeType?.split("/")[0];
	switch (type) {
		case "image": {
			const result = FileMetadataSchema.safeParse(input.metadata);
			const metadata = result.success
				? result.data
				: { width: 0, height: 0 };

			return {
				...commonFileFields,
				type: "image",
				width: metadata.width,
				height: metadata.height,
			};
		}
		default:
			return {
				...commonFileFields,
				type: "file",
			};
	}
}

export function ToItemIndexEntry(input: z.infer<typeof InputSchema>) {
	const file = input.file;
	const item = input.item;

	const baseArchive = {
		id: item.id,
		name: item.name,
		type: item.type,
		flag: {
			isPinned: false,
			isHidden: false,
			isDeleted: false,
		},
		createdAt: item.createdAt.getTime(),
		updatedAt: item.updatedAt.getTime(),
	};

	switch (item.type) {
		case ItemType.FILE_CONTAINER: {
			const container = ToFileContainer(file);
			return {
				...baseArchive,
				file: container,
			};
		}
		default:
			return {
				...baseArchive,
			};
	}
}
