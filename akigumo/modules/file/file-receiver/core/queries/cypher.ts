export const SYNC_FOLDERS_AND_FILES_WITH_IDS =
    `
    UNWIND $allNodes AS node
    MERGE (n {id: node.id})
    ON CREATE SET 
        n.path = node.path,
        n.name = node.name,
        n.createdTime = datetime()
    WITH n, node
    CALL apoc.create.addLabels(n, node.labels) YIELD node AS labeledNode

    WITH count(*) AS dummy

    UNWIND $chains AS idList
    WITH idList, COLLECT {
        UNWIND range(0, size(idList)-1) AS i
        MATCH (n {id: idList[i]})
        RETURN n 
        ORDER BY i
    } AS sortedNodes
    CALL apoc.nodes.link(sortedNodes, "CONTAINS")
    RETURN count(*)
    `;