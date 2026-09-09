import { prisma } from "#akigumo/db/prisma.js";

import type { UserRegistration } from "../api/schema.js";

export async function createItemList(itemList: UserRegistration["array"]) {
	const created = await prisma.user.createManyAndReturn({
		data: itemList.map((item) => ({
			name: item.name,
			redundancy: item.redundancy,
			status: item.status,
		})),
	});

	return created.map((r) => r.id);
}
