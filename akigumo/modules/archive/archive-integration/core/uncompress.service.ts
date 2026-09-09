import { prisma } from "#akigumo/db/prisma.js";

import type {
	FileCreateManyInput,
	ItemCreateManyInput,
} from "#generated/prisma/models.js";

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
