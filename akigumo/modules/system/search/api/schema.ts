import { z } from "@hono/zod-openapi";

/**
 * Schema for the standard API response envelope.
 *
 * Why: Ensures all responses conform to a consistent structure for error handling and client parsing.
 */
export const ResponseSchema = z.object({ key: z.string().optional() });
