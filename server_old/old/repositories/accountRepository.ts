import { z } from 'zod';
import { Prisma } from 'generated/prisma/client'
import { AccountCreateInputObjectSchema, AccountUpdateInputObjectSchema } from 'generated/zod/schemas';
import { ExtensionPrisma } from '@core/infrastructure/database/prisma';

export class AccountRepository {
    private prismaClient: ExtensionPrisma;

    constructor(
        prismaClient: ExtensionPrisma
    ) {
        this.prismaClient = prismaClient;
    }

    async create(
        data: z.infer<typeof AccountCreateInputObjectSchema>,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        return client.account.create({ data });
    }

    async findById(id: string, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.account.findUnique({ where: { id } });
    }

    async findMany(params: { where?: Prisma.AccountWhereInput; orderBy?: Prisma.AccountOrderByWithRelationInput | Prisma.AccountOrderByWithRelationInput[]; take?: number; skip?: number } = {}, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        const { where, orderBy, take, skip } = params;
        return client.account.findMany({ where, orderBy, take, skip });
    }

    async update(
        id: string,
        data: z.infer<typeof AccountUpdateInputObjectSchema>,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        return client.account.update({ where: { id }, data });
    }
}
