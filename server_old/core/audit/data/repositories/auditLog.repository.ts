import { z } from '@hono/zod-openapi'
import { Prisma } from 'generated/prisma/client';
import { AuditLogCreateInputObjectSchema } from 'generated/zod/schemas';
import { AppTransactionClient } from '@core/infrastructure/database/prisma';
import PrismaBase from '@core/base.repository';

interface AuditLogRepositoryDeps {
    baseRepository: PrismaBase;
}

export default class AuditLogRepository {
    constructor(private deps: AuditLogRepositoryDeps) { }

    private get prismaBase(): PrismaBase { return this.deps.baseRepository; }

    /**
     * 建立 Audit Log 紀錄
     */
    async create(
        data: z.infer<typeof AuditLogCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute(
            'auditLog',
            (model) => model.create({ data }),
            tx
        );
    }

    /**
     * 根據 ID 查詢 Audit Log
     */
    async findById(
        id: number,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute(
            'auditLog',
            (model) => model.findUnique({ where: { id } }),
            tx
        );
    }

    /**
     * 查詢單筆 Audit Log (通用條件，例如透過 sessionId 查詢)
     */
    async findFirst(
        params: {
            where?: Prisma.AuditLogWhereInput;
            orderBy?: Prisma.AuditLogOrderByWithRelationInput | Prisma.AuditLogOrderByWithRelationInput[];
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, skip } = params;
        return await this.prismaBase.execute(
            'auditLog',
            (model) => model.findFirst({ where, orderBy, skip }),
            tx
        );
    }

    /**
     * 查詢多筆 Audit Log
     */
    async findMany(
        params: {
            where?: Prisma.AuditLogWhereInput;
            orderBy?: Prisma.AuditLogOrderByWithRelationInput | Prisma.AuditLogOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, take, skip } = params;
        return await this.prismaBase.execute(
            'auditLog',
            (model) => model.findMany({ where, orderBy, take, skip }),
            tx
        );
    }

    /**
     * 刪除 Audit Log (通常用於清理舊資料)
     */
    async delete(
        id: number,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute(
            'auditLog',
            (model) => model.delete({ where: { id } }),
            tx
        );
    }
}