import { prisma } from "#akigumo/db/prisma.js";

import type { ArchiveDelete } from "../api/schema.js";

export async function updateItemList(itemList: ArchiveDelete["array"]) {
	const updated = await prisma.item.updateManyAndReturn({
		where: {
			id: { in: itemList.map((item) => item.id) },
			deletedAt: null,
		},
		data: { deletedAt: new Date() },
	});

	return updated.map((r) => r.id);
}
