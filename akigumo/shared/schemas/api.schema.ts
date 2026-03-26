import { z } from '@hono/zod-openapi';

export const ResponseSchema = z.object({
    success: z.boolean(),
    traceId: z.string()
}).openapi({
    example: {
        success: true,
        traceId: 'abc123def456'
    }
});
export type Response = z.infer<typeof ResponseSchema>;