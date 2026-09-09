import { driver } from "#akigumo/db/neo4j.js";
import { prisma } from "#akigumo/db/prisma.js";

import { type QueryInput, QueryOperate } from "../contract/cypher.js";
import {
	getAllCypher,
	getAllCypherB,
	getChildrenCypher,
	getRootCypher,
} from "./cypher.js";

export async function getConceptStructure(input: QueryInput) {
	const { operate, showDeleted } = input;

	let cypherQuery = getAllCypherB;
	const params: Record<string, unknown> = { showDeleted: !!showDeleted };

	switch (operate) {
		case QueryOperate.ROOT:
			cypherQuery = getRootCypher;
			break;
		case QueryOperate.CHILDREN:
			cypherQuery = getChildrenCypher;
			params.parentId = input.parentId;
			break;
	}

	const { records: recordList } = await driver.executeQuery(
		cypherQuery,
		params,
		{
			database: "neo4j",
		},
	);

	const nodeMap = new Map();
	const edgeMap = new Map();

	for (const r of recordList) {
		const nodeId = r.get("id");
		const position = Number(r.get("position"));
		const relId = r.get("relId");

		// 1. 收集節點 (避免重複)
		if (nodeId && !nodeMap.has(nodeId)) {
			nodeMap.set(nodeId, {
				data: {
					id: nodeId,
					position: position,
				},
			});
		}

		// 2. 收集關係 (存在關係才放入)
		if (relId !== null && relId !== undefined) {
			const edgeKey = String(relId);
			if (!edgeMap.has(edgeKey)) {
				edgeMap.set(edgeKey, {
					data: {
						id: `e${relId}`, // 確保 ID 是字串
						source: r.get("sourceId"),
						target: r.get("targetId"),
						label: r.get("relType"), // 可選：顯示關係類型
					},
				});
			}
		}
	}

	// 回傳符合 Cytoscape elements 的格式
	return {
		nodeIdList: Array.from(nodeMap.keys()),
		nodeList: Array.from(nodeMap.values()),
		edgeList: Array.from(edgeMap.values()),
	};
}

export async function findConcept(conceptIdList: string[]) {
	const conceptList = await prisma.concept.findMany({
		where: {
			id: { in: conceptIdList },
		},
	});

	return conceptList;
}
