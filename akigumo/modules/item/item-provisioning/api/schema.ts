import { z } from '@hono/zod-openapi';
import { ResponseSchema } from 'akigumo/shared/schemas/api.schema';

export const CreateItemResponseSchema = ResponseSchema;

export type CreateItemResponse = z.infer<typeof CreateItemResponseSchema>;
