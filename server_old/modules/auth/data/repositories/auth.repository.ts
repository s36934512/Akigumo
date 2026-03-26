import { z } from '@hono/zod-openapi';
import { AppTransactionClient } from '@core/infrastructure/database/prisma';
import PrismaBase from '@core/base.repository';
import { SessionCreateInputObjectSchema } from 'generated/zod/schemas/objects/SessionCreateInput.schema';
import { SessionUpdateInputObjectSchema } from 'generated/zod/schemas/objects/SessionUpdateInput.schema';
import { Hash, SessionId } from 'libs/contract/zod/session/v1/session.zod';
import { Prisma } from 'generated/prisma/client';

interface AuthRepositoryDeps {
    baseRepository: PrismaBase;
}

export default class AuthRepository {
    constructor(private deps: AuthRepositoryDeps) { }

    private get prismaBase(): PrismaBase { return this.deps.baseRepository; }

    /**
     * 建立認證紀錄
     */
    async createSession(
        data: z.infer<typeof SessionCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('session', (model) => model.create({ data }), tx);
    }

    /**
     * 根據 hash 查詢認證紀錄
     */
    async findByHash(
        hash: Hash,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('session', (model) => model.findFirst({
            where: {
                OR: [
                    { currentHash: hash },
                    { historyHashes: { has: hash } }
                ]
            }
        }), tx);
    }

    async updateSession(
        data: z.infer<typeof SessionUpdateInputObjectSchema>,
        params: { where: Prisma.SessionWhereUniqueInput },
        tx?: AppTransactionClient
    ) {
        const { where } = params;

        return await this.prismaBase.execute('session', (model) => model.update({
            data,
            where
        }), tx);
    }

    async revokeSession(
        id: SessionId,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('session', (model) => model.update({
            where: { id },
            data: { isRevoked: true }
        }), tx);
    }
}
