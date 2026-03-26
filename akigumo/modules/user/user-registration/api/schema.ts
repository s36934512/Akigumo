import { z } from '@hono/zod-openapi';
import { ResponseSchema } from 'akigumo/shared/schemas/api.schema';

export const CreateUserResponseSchema = ResponseSchema;

export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
