import { z } from 'zod';
import { SystemEventCreateInputObjectSchema, SystemEventLogCreateInputObjectSchema, SystemEventTypeCreateInputObjectSchema } from 'generated/zod/schemas';
import { Prisma } from 'generated/prisma/client';
import { ExtensionPrisma } from '@core/infrastructure/database/prisma';

export class SystemRepository {
    private prismaClient: ExtensionPrisma;

    constructor(
        prismaClient: ExtensionPrisma
    ) {
        this.prismaClient = prismaClient;
    }

    async createEventLog(
        data: z.infer<typeof SystemEventLogCreateInputObjectSchema>,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        return client.systemEventLog.create({ data });
    }

    async findEventLogById(id: number, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.systemEventLog.findUnique({ where: { id } });
    }

    async findEventLogs(
        params: {
            where?: Prisma.SystemEventLogWhereInput;
            orderBy?: Prisma.SystemEventLogOrderByWithRelationInput | Prisma.SystemEventLogOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        const { where, orderBy, take, skip } = params;
        return client.systemEventLog.findMany({ where, orderBy, take, skip });
    }

    async deleteEventLog(id: number, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.systemEventLog.delete({ where: { id } });
    }

    // SystemEvent CRUD
    async createEvent(
        data: z.infer<typeof SystemEventCreateInputObjectSchema>,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        return client.systemEvent.create({ data });
    }

    async findEventById(id: number, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.systemEvent.findUnique({ where: { id } });
    }

    async findEvents(
        params: {
            where?: Prisma.SystemEventWhereInput;
            orderBy?: Prisma.SystemEventOrderByWithRelationInput | Prisma.SystemEventOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        const { where, orderBy, take, skip } = params;
        return client.systemEvent.findMany({ where, orderBy, take, skip });
    }

    async updateEvent(
        id: number,
        data: z.infer<typeof SystemEventCreateInputObjectSchema>,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        return client.systemEvent.update({ where: { id }, data });
    }

    async deleteEvent(id: number, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.systemEvent.delete({ where: { id } });
    }

    // SystemEventType CRUD
    async createEventType(
        data: z.infer<typeof SystemEventTypeCreateInputObjectSchema>,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        return client.systemEventType.create({ data });
    }

    async findEventTypeById(id: number, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.systemEventType.findUnique({ where: { id } });
    }

    async findEventTypes(
        params: {
            where?: Prisma.SystemEventTypeWhereInput;
            orderBy?: Prisma.SystemEventTypeOrderByWithRelationInput | Prisma.SystemEventTypeOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        const { where, orderBy, take, skip } = params;
        return client.systemEventType.findMany({ where, orderBy, take, skip });
    }

    async updateEventType(
        id: number,
        data: z.infer<typeof SystemEventTypeCreateInputObjectSchema>,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? this.prismaClient;
        return client.systemEventType.update({ where: { id }, data });
    }

    async deleteEventType(id: number, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.prismaClient;
        return client.systemEventType.delete({ where: { id } });
    }
}
