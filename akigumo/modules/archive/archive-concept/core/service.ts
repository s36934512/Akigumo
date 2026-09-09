import { prisma } from "#akigumo/db/prisma.js";

import type { ConceptRegistryWithId } from "./type.js";

export async function createItemList(itemList: ConceptRegistryWithId[]) {
	await prisma.concept.createMany({
		data: itemList,
	});
}
