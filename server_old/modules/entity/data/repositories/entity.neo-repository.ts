import Neo4jBase from '@core/base.neo-repository';

interface EntityNeoRepositoryDeps {
    neo4jBase: Neo4jBase;
}

class EntityNeoRepository {
    constructor(private deps: EntityNeoRepositoryDeps) { }

    private get neo4jBase(): Neo4jBase { return this.deps.neo4jBase; }

    async createEntity(data: Record<string, any>) {
        const cypher = `CREATE (e:Entity $props) RETURN e`;
        return await this.neo4jBase.executeWrite(cypher, { props: data });
    }

    async findById(id: string) {
        const cypher = `MATCH (e:Entity {id: $id}) RETURN e`;
        return await this.neo4jBase.executeRead(cypher, { id });
    }

    async updateEntity(id: string, updates: Record<string, any>) {
        const cypher = `MATCH (e:Entity {id: $id}) SET e += $updates RETURN e`;
        return await this.neo4jBase.executeWrite(cypher, { id, updates });
    }

    async deleteEntity(id: string) {
        const cypher = `MATCH (e:Entity {id: $id}) DETACH DELETE e`;
        return await this.neo4jBase.executeWrite(cypher, { id });
    }

    async findMany(where: Record<string, any> = {}) {
        // where 可擴充為 cypher 查詢條件
        const cypher = `MATCH (e:Entity) RETURN e`;
        return await this.neo4jBase.executeRead(cypher, where);
    }
}

export default EntityNeoRepository;
