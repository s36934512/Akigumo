import { z } from "@hono/zod-openapi";

import { prisma } from "#akigumo/db/prisma.js";
import { NonRetryableError } from "#akigumo/kernel/index.js";
import * as Paths from "#akigumo/kernel/paths.js";
import { ItemStatus, ItemType } from "#generated/prisma/enums.js";

import { handlersRegistry } from "../core/index.js";
import { buildArchiveUncompressTask } from "../factory/archive-uncompress.js";

const InputSchema = z
	.object({
		fileId: z.uuid(),
		derivedFileIds: z.uuid().array(),
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
	name: "archive-uncompress",
	schema: InputSchema,
	logic: async (input) => {
		const { fileId, derivedFileIds } = input;

		const { item, file, derivedFiles } = await prisma.$transaction(
			async (tx) => {
				const [file, derivedFiles] = await Promise.all([
					tx.file.findUnique({
						where: { id: fileId },
						include: { fileExtension: true },
					}),
					tx.file.findMany({
						where: { id: { in: derivedFileIds } },
						include: { fileExtension: true },
					}),
				]);

				if (!file || !derivedFiles.length) {
					throw new NonRetryableError("file not found");
				}

				const item = await tx.item.create({
					data: {
						name: file.originalName ?? "Uncompressed Archive",
						type: ItemType.WORK,
						status: ItemStatus.ACTIVE,
					},
				});

				return { item, file, derivedFiles };
			},
		);

		const task = buildArchiveUncompressTask({
			fileId: file.id,
			itemId: item.id,
			itemName: Paths.basename(item.name, false),
			childrenFileIds: derivedFiles.map((f) => f.id),
			fileExtensionCode: file.fileExtension?.code,
		});

		return {
			taskType: "ArchiveUncompressExecutor",
			payload: task,
		};
	},
});
