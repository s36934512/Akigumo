import Neo4jBase from '@core/base.neo-repository';

interface UserNeoRepositoryDeps {
    baseNeoRepository: Neo4jBase;
}

export default class UserNeoRepository {
    constructor(private deps: UserNeoRepositoryDeps) { }

    private get neo4jBase() { return this.deps.baseNeoRepository; }


    async upsertUserNode(id: string) {
        const cypher = `
            MERGE (u:User {id: $id})
            RETURN u
        `;
        return this.neo4jBase.executeWrite(cypher, { id });
    }

    async upsertUserNodes(ids: string[]) {
        const cypher = `
            UNWIND $ids AS id
            MERGE (u:User { id: id })
            RETURN u
        `;
        return this.neo4jBase.executeWrite(cypher, { ids });
    }

    async deleteUserNode(id: string) {
        const cypher = `
      MATCH (u:User {id: $id})
      DETACH DELETE u
    `;
        return this.neo4jBase.executeWrite(cypher, { id });
    }
};
