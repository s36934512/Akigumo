import { z } from '@hono/zod-openapi'
import { UserCreateInputObjectSchema, UserUpdateInputObjectSchema } from 'generated/zod/schemas';
import { Prisma } from 'generated/prisma/client';
import { AppTransactionClient } from '@core/infrastructure/database/prisma';
import PrismaBase from '@core/base.repository';

interface UserRepositoryDeps {
    baseRepository: PrismaBase;
}

class UserRepository {
    constructor(private deps: UserRepositoryDeps) { }

    private get prismaBase(): PrismaBase { return this.deps.baseRepository; }

    async create(
        data: z.infer<typeof UserCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('user', (model) => model.create({ data }), tx);
    }

    async findFirst(
        params: {
            where?: Prisma.UserWhereInput;
            orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, skip } = params;
        return await this.prismaBase.execute(
            'user',
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
        return await this.prismaBase.execute('user', (model) => model.findUnique({ where: { id } }), tx);
    }

    async findMany(
        params: {
            where?: Prisma.UserWhereInput;
            orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, take, skip } = params;
        return await this.prismaBase.execute(
            'user',
            (model) => model.findMany({ where, orderBy, take, skip }),
            tx
        );
    }

    async update(
        id: string,
        data: z.infer<typeof UserUpdateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('user', (model) => model.update({ where: { id }, data }), tx);
    }

    async delete(
        id: string,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('user', (model) => model.delete({ where: { id } }), tx);
    }
};

export default UserRepository;