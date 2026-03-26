import { z } from '@hono/zod-openapi';

export const ItemProperties = z.object({
    id: z.uuid(),
    title: z.string(),
});
export type ItemProperties = z.infer<typeof ItemProperties>;