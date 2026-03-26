import Neo4jBase from '@core/base.neo-repository';

interface GraphLinkOrchestratorDeps {
    baseNeoRepository: Neo4jBase;
}

export default class GraphLinkOrchestrator {
    constructor(private deps: GraphLinkOrchestratorDeps) { }

    private get neo4jBase(): Neo4jBase { return this.deps.baseNeoRepository; }

    public async getFilesByItem(itemId: string) {
        console.log('[GraphLinkOrchestrator] getFilesByItem itemId:', itemId);
        // --- [註解 A] 從 Neo4j 取得關係資料 ---
        const cypher = `
           MATCH (i:Item {id: $itemId})-[:CONTAINS]->(f:File)
           RETURN f.id AS id
        `;
        const neo4jResult = await this.neo4jBase.executeRead(cypher, { itemId });
        console.log('[GraphLinkOrchestrator] getFilesByItem neo4jResult:', neo4jResult);

        const fileIds = neo4jResult.map(record => record.id);

        return fileIds;
    }
}