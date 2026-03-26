import { z } from '@hono/zod-openapi';
import { Prisma } from 'generated/prisma/client';
import { EntityCreateInputObjectSchema, EntityUpdateInputObjectSchema, EntityTypeCreateInputObjectSchema } from 'generated/zod/schemas';
import { AppTransactionClient } from '@core/infrastructure/database/prisma';
import PrismaBase from '@core/base.repository';

interface EntityRepositoryDeps {
    baseRepository: PrismaBase;
}

class EntityRepository {
    constructor(private deps: EntityRepositoryDeps) { }

    private get prismaBase(): PrismaBase { return this.deps.baseRepository; }

    async create(
        data: z.infer<typeof EntityCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('entity', (model) => model.create({ data }), tx);
    }

    async createEntityType(
        data: z.infer<typeof EntityTypeCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('entityType', (model) => model.create({ data }), tx);
    }

    async findById(
        id: string,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('entity', (model) => model.findUnique({ where: { id } }), tx);
    }

    async findMany(
        params: {
            where?: Prisma.EntityWhereInput;
            orderBy?: Prisma.EntityOrderByWithRelationInput | Prisma.EntityOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, take, skip } = params;
        return await this.prismaBase.execute(
            'entity',
            (model) => model.findMany({ where, orderBy, take, skip }),
            tx
        );
    }

    async update(
        id: string,
        data: z.infer<typeof EntityUpdateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('entity', (model) => model.update({ where: { id }, data }), tx);
    }

    async delete(
        id: string,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('entity', (model) => model.delete({ where: { id } }), tx);
    }
}

export default EntityRepository;
