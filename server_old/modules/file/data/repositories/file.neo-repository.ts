import Neo4jBase from '@core/base.neo-repository';

interface FileNeoRepositoryDeps {
    baseNeoRepository: Neo4jBase;
}

export default class FileNeoRepository {

    constructor(private deps: FileNeoRepositoryDeps) { }

    private get neo4jBase() { return this.deps.baseNeoRepository; }

    async upsertFileNode(id: string) {
        const cypher = `
            MERGE (f:File { id: $id })
            RETURN f
        `;
        return this.neo4jBase.executeWrite(cypher, { id });
    }

    async upsertFileNodes(batch: { key: string, value: any }[], defaultLabels: string[] = ['File']) {
        // 預處理資料：確保屬性乾淨
        const sanitizedBatch = batch.map(item => {
            // 合併兩者：將動態標籤與預設標籤放入同一個陣列
            const dynamicLabels = Array.isArray(item.value.labels) ? item.value.labels : [];

            // 使用 Set 確保標籤不重複 (例如預設標籤剛好也在動態標籤裡時)
            const combinedLabels = [...new Set([...dynamicLabels, ...defaultLabels])];

            return {
                id: item.key,
                labels: combinedLabels, // 結果：['Image', 'Thumbnail', 'File']
                properties: this.sanitizeProperties(item.value)
            };
        });

        const cypher = `
            CALL apoc.periodic.iterate(
                "UNWIND $batch AS row RETURN row",
                "CALL apoc.merge.node(row.labels, {id: row.id}, row.properties, row.properties) YIELD node RETURN node",
                { batchSize: 1000, parallel: false, params: { batch: $sanitizedBatch } }
            )
        `;
        return this.neo4jBase.executeWrite(cypher, { sanitizedBatch });
    }

    async linkToContainers(relations: { fileId: string; itemIds: string | string[] }[]) {
        // 1. 預處理：確保 itemIds 統一為陣列，並進行去重 (dedupe)
        const sanitizedRelations = relations.map(rel => ({
            fileId: rel.fileId,
            itemIds: Array.isArray(rel.itemIds)
                ? [...new Set(rel.itemIds)]
                : [rel.itemIds]
        }));

        const cypher = `
            CALL apoc.periodic.iterate(
                "UNWIND $relations AS rel RETURN rel",
                "
                    MATCH (f:File { id: rel.fileId })
                    WITH f, rel.itemIds AS ids
                    UNWIND ids AS itemId
                    MATCH (i:Item { id: itemId })
                    MERGE (i)-[:CONTAINS]->(f)
                ",
                { 
                    batchSize: 1000, 
                    parallel: false, 
                    params: { relations: $sanitizedRelations } 
                }
            )
        `;

        return this.neo4jBase.executeWrite(cypher, { sanitizedRelations });
    }

    // 輔助方法：移除不需要存入節點屬性的欄位
    private sanitizeProperties(value: any) {
        const { labels, itemId, ...props } = value;
        return props;
    }
};