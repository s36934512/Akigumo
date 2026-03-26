import { getDriver } from './infrastructure/database/neo4j';

interface Neo4jBaseDeps {
    neo4jDriver: ReturnType<typeof getDriver>;
}

export default class Neo4jBase {

    constructor(private deps: Neo4jBaseDeps) { }

    private get driver() { return this.deps.neo4jDriver; }

    /**
     * 寫入操作 (CREATE, MERGE, SET, DELETE)
     */
    async executeWrite(cypher: string, params: Record<string, any> = {}) {
        const session = this.driver.session();

        try {
            return await session.executeWrite(async (tx) => {
                const result = await tx.run(cypher, params);

                // 💡 優化：明確將 records 轉換為物件陣列並回傳
                // 這樣可以確保在 session.close() 之前資料已被完全讀取
                return result.records.map(record => record.toObject());
            });
        } catch (error) {
            console.error("Neo4j ExecuteWrite Error:", error);
            throw error;
        } finally {
            await session.close();
        }
    }

    /**
     * 讀取操作 (MATCH RETURN)
     */
    async executeRead(cypher: string, params: Record<string, any> = {}) {
        const session = this.driver.session();
        try {
            return await session.executeRead(async (tx) => {
                const result = await tx.run(cypher, params);
                return result.records.map(record => record.toObject());
            });
        } finally {
            await session.close();
        }
    }
}