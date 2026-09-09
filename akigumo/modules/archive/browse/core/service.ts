import { driver } from "#akigumo/db/neo4j.js";
import { prisma } from "#akigumo/db/prisma.js";
import { notifyIndexPatches } from "#akigumo/modules/archive/index-stream/index.js";

import { getChildrenCypher, getRootItemsCypher } from "./cypher.js";
import {
	type BrowseRequest,
	type GetStructureFromNeo4j,
	RecordTypesToItemType,
} from "./schema.js";

export async function browser(input: BrowseRequest) {
	const { parentId, notifyId, showDeleted } = input;

	const items = await getStructureFromNeo4j({ parentId, showDeleted });

	const breadcrumbs = parentId ? await getBreadcrumbs(parentId) : [];

	const itemIds = items.map((i) => i.id);
	if (itemIds.length > 0) {
		notifyIndexPatches(notifyId, itemIds).catch((err) => {
			console.error("Failed to trigger index patches:", err);
		});
	}

	return { items, breadcrumbs };
}

async function getStructureFromNeo4j(input: GetStructureFromNeo4j) {
	const { parentId, showDeleted } = input;

	const query = parentId ? getChildrenCypher : getRootItemsCypher;
	// const result = await neogma.queryRunner.run(query, { parentId, showDeleted });
	const { records } = await driver.executeQuery(
		query,
		{ parentId, showDeleted },
		{ database: "neo4j" },
	);

	return records.map((r) => ({
		id: r.get("id"),
		conceptList: r.get("concepts"),
		position: Number(r.get("position")),
		type: RecordTypesToItemType.parse(r.get("labels")),
	}));
}

async function getBreadcrumbs(id: string) {
	const item = await prisma.item.findUnique({
		where: { id },
		select: { id: true, name: true },
	});
	return item ? [{ id: item.id, name: item.name }] : [];
}
