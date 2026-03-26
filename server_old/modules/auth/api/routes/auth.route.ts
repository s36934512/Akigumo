import { createRoute } from '@hono/zod-openapi'
// import { RegisterRequestSchema, RegisterResponseSchema } from 'libs/contract/zod/auth/v1/register.schema';
import { RefreshResponseSchema } from 'libs/contract/zod/authorization/v1/authorization.zod';
// import { LoginRequestSchema, LoginResponseSchema } from 'libs/contract/zod/auth/v1/login.schema';

export const registerRoute = createRoute({
    method: 'post',
    path: '/auth/register',
    summary: '註冊新用戶',
    description: '註冊一個新用戶，並建立帳號憑證。',
    request: {
        body: {
            content: {
                'application/json': {
                    // schema: RegisterRequestSchema
                    schema: {} // TODO: Replace with actual schema
                }
            }
        }
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    // schema: RegisterResponseSchema
                    schema: {} // TODO: Replace with actual schema
                }
            },
            description: '註冊成功'
        },
        400: {
            description: '請求格式錯誤'
        }
    }
})

export const loginRoute = createRoute({
    method: 'post',
    path: '/auth/login',
    summary: '用戶登入',
    description: '用戶登入並取得 access token。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: {} // TODO: Replace with actual schema
                }
            }
        }
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: {} // TODO: Replace with actual schema
                }
            },
            description: '登入成功，回傳 token'
        },
        400: {
            description: '請求格式錯誤'
        },
        401: {
            description: '帳號或密碼錯誤'
        }
    }
})

export const refreshRoute = createRoute({
    method: 'post',
    path: '/auth/refresh',
    security: [{ cookieAuth: [] }],
    summary: '刷新 Session ID',
    description: '驗證長效 sid_long 後，在 Redis 產生新的短效 sid_short。',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: RefreshResponseSchema
                }
            },
            description: '刷新成功，回傳新 token'
        },
        400: {
            description: '請求格式錯誤'
        },
        401: {
            description: 'refresh token 無效'
        }
    }
})
