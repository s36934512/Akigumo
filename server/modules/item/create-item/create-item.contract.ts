import { z } from "@hono/zod-openapi";
import { ActionCategory, Severity } from "generated/prisma/enums";
import { CreateItemAuditPayloadSchema, CreateItemGraphPayloadSchema, CreateItemPayloadSchema } from "./create-item.schema";

export interface ActionInput<
    P extends z.ZodType = z.ZodType,
    A extends z.ZodType = z.ZodType,
    G extends z.ZodType = z.ZodType,
> {
    name: string;
    category: ActionCategory;
    severity: Severity;
    description?: string;

    payloadSchema: P;
    schemas?: {
        audit?: A;
        graph?: G;
    };
}

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

export const ITEM_ACTIONS = createActions({
    CREATED: {
        name: '建立項目',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
        payloadSchema: CreateItemPayloadSchema,
        schemas: {
            audit: CreateItemAuditPayloadSchema,
            graph: CreateItemGraphPayloadSchema,
        }
    },
});

export const AggregateType = "ITEM" as const;

export type ActionCode = Extract<keyof typeof ITEM_ACTIONS, string>;

export type GetPayload<
    C extends ActionCode,
    P extends keyof NonNullable<typeof ITEM_ACTIONS[C]['schemas']> | 'default' = 'default'
> = P extends 'default'
    ? (typeof ITEM_ACTIONS[C] extends { payloadSchema: z.ZodType<infer T> } ? T : never)
    : (typeof ITEM_ACTIONS[C] extends { schemas: { [K in P]: z.ZodType<infer T> } } ? T : never);

export type ActionKey = `${typeof AggregateType}:${ActionCode}`;