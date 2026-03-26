import { z } from '@hono/zod-openapi';
import { ResponseSchema } from 'akigumo/shared/schemas/api.schema';

/**
 * Schema for the standard API response envelope.
 *
 * Why: Ensures all responses conform to a consistent structure for error handling and client parsing.
 */
export const EntityCreateResponseSchema = ResponseSchema;

/**
 * Type for the standard API response envelope.
 */
export type EntityCreateResponse = z.infer<typeof EntityCreateResponseSchema>;
