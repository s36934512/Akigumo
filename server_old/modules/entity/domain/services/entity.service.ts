import { z } from "@hono/zod-openapi";
import EntityRepository from '../../data/repositories/entity.repository';
import EntityNeoRepository from '../../data/repositories/entity.neo-repository';
import { EntityCreateInputObjectSchema, EntityTypeCreateInputObjectSchema } from 'generated/zod/schemas';

interface EntityServiceDeps {
    entityRepository: EntityRepository;
    entityNeoRepository: EntityNeoRepository;
}

export default class EntityService {
    constructor(private deps: EntityServiceDeps) { }

    private get entityRepository(): EntityRepository { return this.deps.entityRepository; }
    private get entityNeoRepository(): EntityNeoRepository { return this.deps.entityNeoRepository; }

    /**
     * 新增 Entity
     */
    async createEntity(data: z.infer<typeof EntityCreateInputObjectSchema>) {
        this.entityRepository.create(data);
    }

    /**
     * 新增 EntityType
     */
    async createEntityType(data: z.infer<typeof EntityTypeCreateInputObjectSchema>) {
        this.entityRepository.createEntityType(data);
    }

    /**
     * 指定兩個 Entity 是相等的
     */
    async setEntitiesEqual(entityId1: string, entityId2: string) {
        // [TODO] 實作指定兩個 Entity 相等
    }
}
