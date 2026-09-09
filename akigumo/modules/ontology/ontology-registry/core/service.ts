import { v5 as uuidv5 } from "uuid";

import { prisma } from "#akigumo/db/prisma.js";
import {
	type ConceptRegistry,
	ONTOLOGY_NAMESPACE,
} from "#akigumo/shared/contracts/index.js";

export async function createItemList(itemList: ConceptRegistry["array"]) {
	const created = await prisma.concept.createManyAndReturn({
		data: itemList.map((item) => ({
			id: uuidv5(item.name, ONTOLOGY_NAMESPACE),
			name: item.name,
			description: item.description,
			metadata: item.metadata,
		})),
		skipDuplicates: true,
	});

	return created.map((r) => r.id);
}
