import { z } from '@hono/zod-openapi';
import { Severity } from 'generated/zod/schemas';

export interface ActionDef<T extends z.ZodType> {
    code: string;           // 對應 DB 的 Action.code
    severity: Severity;
    payloadSchema: T;
    description: string;
}

// 統一管理所有動作
export const GLOBAL_ACTIONS = {
    USER: {
        LOGIN: {
            code: 'USER_LOGIN',
            severity: 'MEDIUM',
            payloadSchema: z.object({ userId: z.string() }),
            description: '使用者登入',
        },
        LOGOUT: {
            code: 'USER_LOGOUT',
            severity: 'LOW',
            payloadSchema: z.object({ userId: z.string() }),
            description: '使用者登出',
        },
        CREATED: {
            code: 'USER_CREATED',
            severity: 'HIGH',
            payloadSchema: z.object({ userId: z.string() }),
            description: '使用者帳號建立',
        },
    },
    FILE: {
        CREATED: {
            code: 'FILE_CREATE',
            severity: 'INFO',
            payloadSchema: z.object({ fileId: z.string() }),
            description: '檔案已建立',
        },
        PROCESSED: {
            code: 'FILE_PROCESS',
            severity: 'LOW',
            payloadSchema: z.object({ fileId: z.string() }),
            description: '檔案處理完成',
        },
    },
} as const;