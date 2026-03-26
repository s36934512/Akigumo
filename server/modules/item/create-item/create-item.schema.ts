import { z } from '@hono/zod-openapi'

export const ItemIdSchema = z.uuid();
export type ItemId = z.infer<typeof ItemIdSchema>;

export const SessionIdSchema = z.uuid();
export type SessionId = z.infer<typeof SessionIdSchema>;

export const CreateItemLogInputSchema = z.object({
    message: z.string().optional().nullable(),
    payload: z.union([z.null(), z.record(z.string(), z.any())]).optional(),
    correlationId: z.string(),
    sessionId: z.string(),
    itemId: z.string(),
});
export type CreateItemLogInput = z.infer<typeof CreateItemLogInputSchema>;

export const CreateItemInputSchema = z.object({
    name: z.string(),
    targetItemId: z.uuid(),
});
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;

export const CreateItemContextSchema = CreateItemInputSchema.extend({
    error: z.string().nullable(),
    itemId: z.uuid().nullable(),
});
export type CreateItemContext = z.infer<typeof CreateItemContextSchema>;

export const PersistItemToDbInputSchema = CreateItemInputSchema;
export type PersistItemToDbInput = z.infer<typeof PersistItemToDbInputSchema>;

export const SyncItemToGraphInputSchema = z.object({
    itemIds: z.uuid().array()
});
export type SyncItemToGraphInput = z.infer<typeof SyncItemToGraphInputSchema>;

export const CreateItemPayloadSchema = z.object({
    itemId: z.uuid(),
    targetItemId: z.uuid(),
});
export type CreateItemPayload = z.infer<typeof CreateItemPayloadSchema>;

export const CreateItemAuditPayloadSchema = CreateItemPayloadSchema;
export type CreateItemAuditPayload = z.infer<typeof CreateItemAuditPayloadSchema>;

export const CreateItemGraphPayloadSchema = CreateItemAuditPayloadSchema;
export type CreateItemGraphPayload = z.infer<typeof CreateItemGraphPayloadSchema>;
