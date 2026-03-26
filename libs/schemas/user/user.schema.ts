import { z } from '@hono/zod-openapi'

export const UserRegisterSchema = z.object({
    username: z.string(),
});
export type UserRegister = z.infer<typeof UserRegisterSchema>;

export const UserLoginSchema = z.object({
    username: z.string().optional(),
    password: z.string().optional(),
});
export type UserLogin = z.infer<typeof UserLoginSchema>;
