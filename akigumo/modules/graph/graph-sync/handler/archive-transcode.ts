import { z } from "@hono/zod-openapi";

import { prisma } from "#akigumo/db/prisma.js";

import { handlersRegistry } from "../core/index.js";
import { buildArchiveTranscodeTask } from "../factory/archive-transcode.js";

const InputSchema = z
	.object({
		fileId: z.uuid(),
		derivedFileId: z.uuid(),
	})
	.openapi({
		description:
			"Item contain payload containing the unique identifier of the item.",
		example: {
			itemId: "123e4567-e89b-12d3-a456-426614174000",
			childrenItemIds: ["123e4567-e89b-12d3-a456-426614174000"],
		},
	});

handlersRegistry.registerHandler({
	name: "archive-transcode",
	schema: InputSchema,
	logic: async (input) => {
		const { fileId, derivedFileId } = input;

		const files = await prisma.file.findMany({
			where: {
				id: { in: [fileId, derivedFileId] },
			},
			include: { fileExtension: true },
		});

		// 分離結果
		const file = files.find((f) => f.id === fileId) || null;
		const derivedFile = files.find((f) => f.id === derivedFileId) || null;

		if (!file || !derivedFile) {
			throw new Error("file not found");
		}

		const getDimensions = (metadata: unknown) => {
			if (
				metadata &&
				typeof metadata === "object" &&
				"width" in metadata &&
				"height" in metadata
			) {
				return metadata as { width?: number; height?: number };
			}
			return undefined;
		};
		const fileMeta = getDimensions(file.metadata);
		const derivedMeta = getDimensions(derivedFile.metadata);

		const task = buildArchiveTranscodeTask({
			fileId: derivedFile.id,
			width: derivedMeta?.width,
			height: derivedMeta?.height,
			storageStatus: "on_disk",
			fileExtensionCode: derivedFile.fileExtension.code,

			originalFileId: file.id,
			originalFileWidth: fileMeta?.width,
			originalFileHeight: fileMeta?.height,
			originalFileExtensionCode: file.fileExtension.code,
		});

		return {
			taskType: "ArchiveExecutor",
			payload: task,
		};
	},
});
