import { z } from "@hono/zod-openapi";
import { ActionCategory, Severity } from "generated/prisma/enums";
import { CreateEntityAuditPayloadSchema, CreateEntityGraphPayloadSchema, CreateEntityPayloadSchema } from "./create-entity.schema";

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

export const ENTITY_ACTIONS = createActions({
    CREATED: {
        name: '建立實體',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
        payloadSchema: CreateEntityPayloadSchema,
        schemas: {
            audit: CreateEntityAuditPayloadSchema,
            graph: CreateEntityGraphPayloadSchema,
        }
    },
});

export const AggregateType = "ENTITY" as const;

export type ActionCode = Extract<keyof typeof ENTITY_ACTIONS, string>;

export type GetPayload<
    C extends ActionCode,
    P extends keyof NonNullable<typeof ENTITY_ACTIONS[C]['schemas']> | 'default' = 'default'
> = P extends 'default'
    ? (typeof ENTITY_ACTIONS[C] extends { payloadSchema: z.ZodType<infer T> } ? T : never)
    : (typeof ENTITY_ACTIONS[C] extends { schemas: { [K in P]: z.ZodType<infer T> } } ? T : never);

export type ActionKey = `${typeof AggregateType}:${ActionCode}`;