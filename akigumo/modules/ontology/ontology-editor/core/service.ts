import { prisma } from "#akigumo/db/prisma.js";

import type { OntologyEditor } from "../api/schema.js";

export async function updateItemList(itemList: OntologyEditor["array"]) {
	const updated = await prisma.$transaction(
		itemList.map((item) =>
			prisma.concept.update({
				where: { id: item.id },
				data: {
					name: item.registry.name,
					description: item.registry.description,
					metadata: item.registry.metadata,
				},
			}),
		),
	);

	return updated.map((r) => r.id);
}
