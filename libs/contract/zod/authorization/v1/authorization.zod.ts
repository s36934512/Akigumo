import { z } from '@hono/zod-openapi'
import { session } from 'neo4j-driver';

export const AuthorizationHeaderSchema = z.string()
    .regex(/^Bearer [0-9a-fA-F-]{36}$/, 'Invalid Bearer token format')
    .openapi({
        example: 'Bearer 018db2f4-8a12-7ac1-a4d3-78f929316d56',
        description: 'Session ID in UUIDv7 format'
    });

export const AuthorizationHeader = z.object({
    authorization: AuthorizationHeaderSchema
}).openapi('AuthorizationHeader');
export type AuthorizationHeader = z.infer<typeof AuthorizationHeader>;

export const cookieSchema = z.object({
    sessionId: z.uuid()
}).openapi('CookieSchema');
export type CookieSchema = z.infer<typeof cookieSchema>;


export const RefreshResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: 'Session refreshed successfully' })
}).openapi('RefreshResponse');
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;