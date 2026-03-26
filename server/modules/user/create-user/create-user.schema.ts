import { z } from '@hono/zod-openapi'

export const UserIdSchema = z.uuid();
export type UserId = z.infer<typeof UserIdSchema>;

export const SessionIdSchema = z.uuid();
export type SessionId = z.infer<typeof SessionIdSchema>;

export const CreateUserLogInputSchema = z.object({
    message: z.string().optional().nullable(),
    payload: z.union([z.null(), z.record(z.string(), z.any())]).optional(),
    correlationId: z.string(),
    sessionId: z.string(),
    userId: z.string(),
});
export type CreateUserLogInput = z.infer<typeof CreateUserLogInputSchema>;

export const CreateUserInputSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const CreateUserContextSchema = CreateUserInputSchema.extend({
    error: z.string().nullable(),
    userId: z.uuid().nullable(),
});
export type CreateUserContext = z.infer<typeof CreateUserContextSchema>;

export const PersistUserToDbInputSchema = CreateUserInputSchema;
export type PersistUserToDbInput = z.infer<typeof PersistUserToDbInputSchema>;

export const SyncUserToGraphInputSchema = z.object({
    userIds: z.uuid().array()
});
export type SyncUserToGraphInput = z.infer<typeof SyncUserToGraphInputSchema>;


export const CreateUserPayloadSchema = z.object({
    userId: z.uuid(),
    rootItemId: z.uuid(),
});
export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;

export const CreateUserAuditPayloadSchema = CreateUserPayloadSchema;
export type CreateUserAuditPayload = z.infer<typeof CreateUserAuditPayloadSchema>;

export const CreateUserGraphPayloadSchema = CreateUserAuditPayloadSchema;
export type CreateUserGraphPayload = z.infer<typeof CreateUserGraphPayloadSchema>;