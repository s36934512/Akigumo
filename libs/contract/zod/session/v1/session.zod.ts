import { z } from '@hono/zod-openapi'

export const sessionIdSchema = z.uuid();
export type SessionId = z.infer<typeof sessionIdSchema>;

export const HashSchema = z.hash("sha256");
export type Hash = z.infer<typeof HashSchema>;
