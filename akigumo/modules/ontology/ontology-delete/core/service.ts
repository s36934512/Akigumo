import { prisma } from "#akigumo/db/prisma.js";
import type { CommonId } from "#akigumo/shared/contracts/common.js";

export async function updateItemList(itemList: CommonId["array"]) {
	const updated = await prisma.concept.updateManyAndReturn({
		where: {
			id: { in: itemList },
			deletedAt: null,
		},
		data: { deletedAt: new Date() },
	});

	return updated.map((r) => r.id);
}
