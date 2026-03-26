import { z } from '@hono/zod-openapi'

export const ItemCreateSchema = z.object({
    itemId: z.uuid(),
    name: z.string(),
    description: z.string().optional(),
});
export type ItemCreate = z.infer<typeof ItemCreateSchema>;

export const ItemMoveSchema = z.object({
    itemId: z.uuid(),
    fromSessionId: z.uuid(),
    toSessionId: z.uuid(),
});
export type ItemMove = z.infer<typeof ItemMoveSchema>;