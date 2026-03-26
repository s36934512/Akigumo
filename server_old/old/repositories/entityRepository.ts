import { z } from 'zod';
import { EntityCreateInputObjectSchema } from 'generated/zod/schemas';
import { Prisma } from 'generated/prisma/client';
import { ExtensionPrisma } from '@core/infrastructure/database/prisma';

export class EntityRepository {
    private prismaClient: ExtensionPrisma;

    constructor(
        prismaClient: ExtensionPrisma
    ) {
        this.prismaClient = prismaClient;
    }

    async create(
        data: z.infer<typeof EntityCreateInputObjectSchema>,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        return await client.entity.create({
            data,
        });
    }

    async findById(id: string, tx?: Prisma.TransactionClient) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        const client = tx ?? this.prismaClient;
        return client.entity.findUnique({ where: { id } });
    }

    async findMany(
        params: {
            where?: Prisma.EntityWhereInput;
            orderBy?: Prisma.EntityOrderByWithRelationInput | Prisma.EntityOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        const { where, orderBy, take, skip } = params;
        return client.entity.findMany({ where, orderBy, take, skip });
    }

    async update(
        id: string,
        data: Partial<z.infer<typeof EntityCreateInputObjectSchema>>,
        tx?: Prisma.TransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        const client = tx ?? this.prismaClient;
        return client.entity.update({ where: { id }, data });
    }

    async delete(id: string, tx?: Prisma.TransactionClient) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        const client = tx ?? this.prismaClient;
        return client.entity.delete({ where: { id } });
    }
}
