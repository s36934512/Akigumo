import { ExtensionPrisma } from '@core/infrastructure/database/prisma';
import { Prisma } from 'generated/prisma/client';

export class SessionRepository {
    private prismaClient: ExtensionPrisma;

    constructor(
        prismaClient: ExtensionPrisma
    ) {
        this.prismaClient = prismaClient;
    }

    async create(data: Prisma.SessionCreateInput, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.session.create({ data });
    }
    async findById(id: string, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.session.findUnique({ where: { id } });
    }
    async findMany(params: { where?: Prisma.SessionWhereInput; orderBy?: Prisma.SessionOrderByWithRelationInput | Prisma.SessionOrderByWithRelationInput[]; take?: number; skip?: number } = {}, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        const { where, orderBy, take, skip } = params;
        return client.session.findMany({ where, orderBy, take, skip });
    }
    async update(id: string, data: Partial<Prisma.SessionUpdateInput>, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.session.update({ where: { id }, data });
    }
    async delete(id: string, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.session.delete({ where: { id } });
    }
}
