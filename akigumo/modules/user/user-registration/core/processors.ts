/**
 * @file Processor registration and payload contracts for user-registration.
 *
 * Why keep API input schema here?
 * The outbox payload consumed by processors should share one validation source
 * with route contracts to avoid drift between accepted HTTP data and async jobs.
 */

import { z } from '@hono/zod-openapi';
import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';
import { syncUsersToGraph } from 'akigumo/services/graph-refinement-engine';
import { UserStatus } from 'generated/prisma/enums';

import { registerUserProcessor } from '../../common/registry.helper';
import { USER_ACTIONS as ACTIONS } from '../contract';

const CreateUserSchema = z.object({
    name: z.string().min(1, '名稱不能為空').openapi({
        description: '使用者名稱，至少 1 個字元',
        example: 'Akigumo',
    }),
    redundancy: z.record(z.string(), z.any()).optional().openapi({
        description: '自訂鍵值對 redundancy，可存放額外資訊',
        example: {
            source: 'admin-panel',
            locale: 'zh-TW',
        },
    }),
    status: z.enum(UserStatus).optional().openapi({
        description: '使用者狀態，未提供時由資料庫使用預設值',
        example: UserStatus.ACTIVE,
    }),
}).openapi({
    description: '單一待建立使用者資料',
});

const CreateUserBatchSchema = z.array(CreateUserSchema).openapi({
    description: '批次建立使用者的輸入資料，陣列中的每一筆皆會建立一個使用者',
    example: [
        {
            name: 'Akigumo',
            redundancy: {
                source: 'admin-panel',
                locale: 'zh-TW',
            },
            status: 'ACTIVE',
        },
    ],
});

export const CreateUserInputSchema = z.union([
    CreateUserBatchSchema,
    CreateUserSchema,
]).openapi({
    description: '單筆或批次建立使用者輸入',
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const SyncUserPayloadSchema = z.array(z.uuid()).min(1);

registerUserProcessor(
    ACTIONS.CREATE,
    CreateUserInputSchema,
    async (data) => {
        const preparedData = Array.isArray(data) ? data : [data];
        return prisma.user.createManyAndReturn({ data: preparedData });
    }
);

registerUserProcessor(
    ACTIONS.SYNC,
    SyncUserPayloadSchema,
    async (data, metadata) => {
        if (!data || data.length === 0) {
            logger.warn(
                { label: ACTIONS.SYNC.code, traceId: metadata.traceId },
                'No user IDs found in trace.',
            );
            return { synced: 0 };
        }

        const syncedCount = await syncUsersToGraph(data);
        return { synced: syncedCount };
    },
);
