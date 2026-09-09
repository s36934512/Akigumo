import path from "node:path";

import { prisma } from "#akigumo/db/prisma.js";
import { NonRetryableError } from "#akigumo/kernel/index.js";
import * as Paths from "#akigumo/kernel/paths.js";
import type { CommonIdObject } from "#akigumo/shared/contracts/common.js";
import { getFileExtensionId } from "#akigumo/shared/seed/seed-file-extension.js";
import { FileStatus } from "#generated/prisma/enums.js";

import { convertToWebp } from "./helper.js";

export async function transcode(input: CommonIdObject["single"]) {
	const file = await prisma.file.findUnique({
		where: { id: input.id },
	});

	if (!file?.physicalPath) {
		throw new NonRetryableError(`File not found: ${input.id}`);
	}

	const processDir = path.dirname(file.physicalPath);
	const result = await convertToWebp(processDir);
	const { extensionId, conceptId } = await getFileExtensionId(
		"webp",
		"image/webp",
	);

	const [_, compressed] = await prisma.$transaction([
		prisma.file.update({
			where: {
				id: input.id,
			},
			data: {
				status: FileStatus.AVAILABLE,
			},
		}),
		prisma.file.create({
			data: {
				systemName: "compressed.webp",
				physicalPath: Paths.concat(processDir, "compressed.webp"),
				size: result.size,
				checksum: result.checksum,
				isOriginal: false,
				status: FileStatus.AVAILABLE,
				fileExtensionId: extensionId,
				metadata: {
					width: result.width,
					height: result.height,
				},
			},
		}),
	]);

	return {
		fileId: compressed.id,
		conceptId: conceptId,
	};
}
