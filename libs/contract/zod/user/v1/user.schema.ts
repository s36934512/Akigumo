import { z } from '@hono/zod-openapi'
import { UserCreateInputObjectZodSchema } from 'generated/zod/schemas';

export const UserSchema = UserCreateInputObjectZodSchema.pick({
    id: true,
    name: true,
    createdTime: true,
}).openapi('User')

// --- 4. 定義 API Request / Response 規範 ---

// 取得列表的 Request Query
export const GetUsersQuerySchema = z.object({
    limit: z.coerce.number().int().default(20).openapi({ description: '每頁顯示的使用者數量' }),
    offset: z.coerce.number().int().default(0).openapi({ description: '分頁偏移量' })
})

// 封裝 Response (含分頁)
export const UsersResponseSchema = z.object({
    items: z.array(UserSchema).openapi({ description: '使用者列表' }),
    total: z.coerce.number().int().openapi({ description: '總數量' }),
    breadcrumbs: z.array(z.object({
        id: z.uuid(),
        title: z.string()
    })).openapi({ description: '麵包屑導航路徑' })
})