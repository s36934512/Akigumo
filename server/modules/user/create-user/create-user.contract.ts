import { z } from "@hono/zod-openapi";
import { ActionCategory, Severity } from "generated/prisma/enums";
import { CreateUserAuditPayloadSchema, CreateUserGraphPayloadSchema, CreateUserPayloadSchema } from "./create-user.schema";

// 定義單個 Action 的結構（不含 code，因為 code 由 Key 決定）
export interface ActionInput<
    P extends z.ZodType = z.ZodType,
    A extends z.ZodType = z.ZodType,
    G extends z.ZodType = z.ZodType,
> {
    name: string;
    category: ActionCategory;
    severity: Severity;
    description?: string;

    payloadSchema: P; // 預設 Payload
    schemas?: {
        audit?: A;    // 審計專用
        graph?: G;    // 圖形資料庫專用
    };
}

// 工廠函式：將 Key 注入為 code 欄位
function createActions<T extends Record<string, ActionInput<any, any, any>>>(actions: T) {
    return Object.freeze(
        Object.fromEntries(
            Object.entries(actions).map(([key, value]) => [
                key,
                { ...value, code: key }
            ])
        )
    ) as { readonly [K in keyof T]: T[K] & { readonly code: K } } & ActionInput<any, any, any>;
}

export const USER_ACTIONS = createActions({
    CREATED: {
        name: '建立使用者',
        category: ActionCategory.DATA_OP,
        severity: Severity.HIGH,
        // 分門別類定義不同用途的 Schema
        payloadSchema: CreateUserPayloadSchema, // 預設用於一般用途
        schemas: {
            audit: CreateUserAuditPayloadSchema, // 用於 AuditLog 表
            graph: CreateUserGraphPayloadSchema, // 用於 Outbox -> Neo4j
        }
    },
    // LOGIN: {
    //     name: '使用者登入',
    //     category: ActionCategory.AUTH,
    //     severity: Severity.MEDIUM,
    //     payloadSchema: z.object({ userId: z.string() }),
    // },
    // LOGOUT: {
    //     name: '使用者登出',
    //     category: ActionCategory.AUTH,
    //     severity: Severity.LOW,
    //     payloadSchema: z.object({ userId: z.string() }),
    // },
});

export const AggregateType = "USER" as const;

// 取得特定領域下的所有動作: ActionCode<"ITEM"> -> "CREATE" | "MOVE"
export type ActionCode = Extract<keyof typeof USER_ACTIONS, string>;

// 自動推導 Payload 型別: GetPayload<"ITEM", "CREATE">
export type GetPayload<
    C extends ActionCode,
    P extends keyof NonNullable<typeof USER_ACTIONS[C]['schemas']> | 'default' = 'default'
> = P extends 'default'
    ? (typeof USER_ACTIONS[C] extends { payloadSchema: z.ZodType<infer T> } ? T : never)
    : (typeof USER_ACTIONS[C] extends { schemas: { [K in P]: z.ZodType<infer T> } } ? T : never);

// 用於 Outbox 表的統一 Action String (例如 "ITEM:CREATE")
export type ActionKey = `${typeof AggregateType}:${ActionCode}`;