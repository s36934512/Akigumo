import { z } from '@hono/zod-openapi';

export const FileProperties = z.object({
    id: z.uuid(),
});
export type FileProperties = z.infer<typeof FileProperties>;