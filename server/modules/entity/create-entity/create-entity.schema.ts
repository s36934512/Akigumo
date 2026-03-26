import { z } from '@hono/zod-openapi';
import { EntityCreateInputObjectSchema, EntityCreateInputObjectZodSchema } from 'generated/zod/schemas';
import { meta } from 'zod/v4/core';



export const EntityIdSchema = z.uuid();
export type EntityId = z.infer<typeof EntityIdSchema>;

export const SessionIdSchema = z.uuid();
export type SessionId = z.infer<typeof SessionIdSchema>;

export const CreateEntityLogInputSchema = z.object({
    message: z.string().optional().nullable(),
    payload: z.union([z.null(), z.record(z.string(), z.any())]).optional(),
    correlationId: z.string(),
    sessionId: z.string(),
    entityId: z.string(),
});
export type CreateEntityLogInput = z.infer<typeof CreateEntityLogInputSchema>;

export const CreateEntityInputSchema = z.object({
    name: z.string(),
    description: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
});
export type CreateEntityInput = z.infer<typeof CreateEntityInputSchema>;

export const CreateEntityContextSchema = CreateEntityInputSchema.extend({
    error: z.string().nullable(),
    entityId: z.uuid().nullable(),
});
export type CreateEntityContext = z.infer<typeof CreateEntityContextSchema>;

export const PersistEntityToDbInputSchema = CreateEntityInputSchema;
export type PersistEntityToDbInput = z.infer<typeof PersistEntityToDbInputSchema>;

export const SyncEntityToGraphInputSchema = z.object({
    entityIds: z.uuid().array()
});
export type SyncEntityToGraphInput = z.infer<typeof SyncEntityToGraphInputSchema>;

export const CreateEntityPayloadSchema = z.object({
    entityId: z.uuid(),
});
export type CreateEntityPayload = z.infer<typeof CreateEntityPayloadSchema>;

export const CreateEntityAuditPayloadSchema = CreateEntityPayloadSchema;
export type CreateEntityAuditPayload = z.infer<typeof CreateEntityAuditPayloadSchema>;

export const CreateEntityGraphPayloadSchema = CreateEntityAuditPayloadSchema;
export type CreateEntityGraphPayload = z.infer<typeof CreateEntityGraphPayloadSchema>;

export const PayloadSchema = CreateEntityPayloadSchema;
export type Payload = z.infer<typeof PayloadSchema>;
