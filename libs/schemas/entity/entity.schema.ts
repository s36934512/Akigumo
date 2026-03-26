import { z } from '@hono/zod-openapi'

export const EntityCreateSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
});
export type EntityCreate = z.infer<typeof EntityCreateSchema>;

export const EntityUpdateSchema = z.object({
    entityId: z.uuid(),
    name: z.string().optional(),
    description: z.string().optional(),
});
export type EntityUpdate = z.infer<typeof EntityUpdateSchema>;