import type { OntologyResolver } from "../api/schema.js";
import { CyElementSchema } from "../contract/cytoscape.js";
import * as svc from "./service.js";

export async function ontologyResolverProcessor(input: OntologyResolver) {
	const { notifyId, ...obj } = input;

	const { nodeIdList, nodeList, edgeList } =
		await svc.getConceptStructure(obj);

	const conceptList = await svc.findConcept(nodeIdList);

	const conceptMap = new Map(conceptList.map((item) => [item.id, item]));
	const finalNodeList = nodeList.flatMap((node) => {
		const conceptDetail = conceptMap.get(node.data.id);

		if (!conceptDetail) return [];
		return [
			{
				...node,
				data: {
					...node.data,
					...conceptDetail,

					// 如果 Prisma 裡也有名為 position 的欄位，
					// 且與 Neo4j 的不同，記得在這裡明確指定你要用哪一個，例如：
					// sortOrder: node.data.position
				},
			},
		];
	});

	const result = CyElementSchema.single.safeParse({
		nodes: finalNodeList,
		edges: edgeList,
	});

	const cytoscapeElements = result.success
		? result.data
		: { nodes: [], edges: [] };

	return cytoscapeElements;
}
