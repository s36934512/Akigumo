import { prisma } from "#akigumo/db/prisma.js";
import type {
	FileCreateManyInput,
	ItemCreateManyInput,
} from "#generated/prisma/models.js";

import { ARCHIVE_INTEGRATION_ACTION_LIST } from "../../archive-integration/index.js";
import { ARCHIVE_AGGREGATE } from "../../common/contract.js";

export async function updateFileAndIntegrationRequest({
	fileId,
	checksum,
	fileName,
	originalFilePath,
}: {
	fileId: string;
	checksum: string;
	fileName: string;
	originalFilePath: string;
}) {
	await prisma.$transaction([
		prisma.file.update({
			where: { id: fileId },
			data: {
				physicalPath: originalFilePath,
				checksum,
				originalName: fileName,
			},
		}),

		prisma.outbox.create({
			data: {
				workflowId: fileId,
				aggregateType: ARCHIVE_AGGREGATE,
				operation: ARCHIVE_INTEGRATION_ACTION_LIST.DISPATCH_TASKS.code,
				payload: {
					fileId,
					uncompressMaxDepth: 3,
				},
			},
		}),
	]);
}

export async function createItemFile({
	fileList,
	itemList,
}: {
	fileList: FileCreateManyInput[];
	itemList: ItemCreateManyInput[];
}) {
	await prisma.$transaction([
		prisma.file.createMany({
			data: fileList,
		}),
		prisma.item.createMany({
			data: itemList,
		}),
	]);
}
