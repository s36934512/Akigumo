import { z } from '@hono/zod-openapi'
import { ItemCreateInputObjectSchema, ItemUpdateInputObjectSchema } from 'generated/zod/schemas';
import { Prisma } from 'generated/prisma/client';
import { AppTransactionClient } from '@core/infrastructure/database/prisma';
import PrismaBase from '@core/base.repository';

interface ItemRepositoryDeps {
    baseRepository: PrismaBase;
}

class ItemRepository {
    constructor(private deps: ItemRepositoryDeps) { }

    private get prismaBase(): PrismaBase { return this.deps.baseRepository; }

    async create(
        data: z.infer<typeof ItemCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('item', (model) => model.create({ data }), tx);
    }

    async findFirst(
        params: {
            where?: Prisma.ItemWhereInput;
            orderBy?: Prisma.ItemOrderByWithRelationInput | Prisma.ItemOrderByWithRelationInput[];
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, skip } = params;
        return await this.prismaBase.execute(
            'item',
            (model) => model.findFirst({ where, orderBy, skip }),
            tx
        );
    }

    async findById(
        id: string,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('item', (model) => model.findUnique({ where: { id } }), tx);
    }

    async findMany(
        params: {
            where?: Prisma.ItemWhereInput;
            orderBy?: Prisma.ItemOrderByWithRelationInput | Prisma.ItemOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, take, skip } = params;
        return await this.prismaBase.execute(
            'item',
            (model) => model.findMany({ where, orderBy, take, skip }),
            tx
        );
    }

    async update(
        id: string,
        data: z.infer<typeof ItemUpdateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('item', (model) => model.update({ where: { id }, data }), tx);
    }

    async delete(
        id: string,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('item', (model) => model.delete({ where: { id } }), tx);
    }
}

export default ItemRepository;