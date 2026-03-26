import { z } from '@hono/zod-openapi'
import { UserCreateInputObjectZodSchema } from 'generated/zod/schemas/objects/UserCreateInput.schema';
import { UserSchema } from './user.schema';

/**
 * 建立 User 的請求規範 (Input)
 */
export const CreateUserRequestSchema = z.object({
    name: z.string().min(1).openapi({ example: '小明' }),
    providerUserId: z.string().min(1).openapi({ example: 'user_12345' }),
    password: z.string().min(8).openapi({ example: 'password123' }),
}).openapi('CreateUserRequest');
/**
 * 建立 User 的回應規範 (Output)
 * 通常我們直接回傳「建立成功後的 User 全貌」
 */
export const CreateUserResponseSchema = UserSchema.openapi('CreateUserResponse');