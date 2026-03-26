import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi'
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import "dotenv/config";
import { refreshRoute } from '../routes/auth.route';
import { container } from '@server/ioc';
import { hasErrorMessage } from '@server/shared/utils/error-message.utils';

type Variables = {
    userId: string;
};

const app = new OpenAPIHono<{ Bindings: HttpBindings; Variables: Variables }>()
// export const loginHandler = async (c: Context) => {
//     export const registerHandler = async (c: Context) => {
//         const { name, providerUserId, password } = await c.req.json();

//         // 1. 在一個 Database Transaction 中完成 User 與 Account 的建立
//         const result = await prisma.$transaction(async (tx) => {
//             // 建立 User 主體
//             const user = await tx.user.create({
//                 data: {
//                     name,
//                     status: 'ACTIVE',
//                 }
//             });

//             // 建立對應的 Account (憑證)
//             const account = await tx.account.create({
//                 data: {
//                     provider: 'LOCAL',
//                     providerUserId,
//                     passwordHash: await hashPassword(password),
//                     userId: user.id,
//                     status: 'ACTIVE'
//                 }
//             });

//             return { user, account };
//         });

//         // 2. 派發非同步任務到 BullMQ：在 Neo4j 中建立使用者節點
//         // 我們不需要等 Neo4j 寫完才回覆前端，這就是 Worker 的好處
//         await userQueue.add('init-user-node', {
//             userId: result.user.id,
//             name: result.user.name
//         });

//         return c.json({ message: '註冊成功', userId: result.user.id }, 201);
//     };

app.openAPIRegistry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'sid_long' // 指定瀏覽器要帶的 Cookie 名稱
})

export const refreshHandler = app.openapi(refreshRoute, async (c) => {
    const cookieSecret = process.env.COOKIE_SECRET!;

    const sid_long = await getSignedCookie(c, cookieSecret, 'sid_long');

    if (!sid_long) {
        return c.json({ error: 'Missing or invalid refresh session' }, 401);
    }

    const authService = container.resolve('authService');

    try {
        const { nextShortId, nextLongId } = await authService.refreshSession(sid_long);

        // 4. 發放新 Cookie
        await setSignedCookie(c, 'sid_short', nextShortId, cookieSecret, { path: '/', httpOnly: true });
        await setSignedCookie(c, 'sid_long', nextLongId, cookieSecret, {
            path: '/auth/refresh',
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 3 // 延長 3 天
        });
    } catch (error) {
        console.error('Error refreshing session:', error);

        if (hasErrorMessage(error)) {
            switch (error.message) {
                case 'Session not found':
                    return c.json({ error: 'Invalid refresh session' }, 401);
                case 'Session Expired':
                    return c.json({ error: 'Refresh session expired' }, 401);
                case 'Security Breach: Session Revoked':
                    // 這裡我們可以選擇性地清除用戶端的 Cookie，因為 Session 已經被封殺了
                    // 可能是重放攻擊或其他安全問題，建議清除用戶端的 Cookie
                    await deleteCookie(c, 'sid_short', { path: '/' });
                    await deleteCookie(c, 'sid_long', { path: '/auth/refresh' });
                    return c.json({ error: 'Session revoked due to security concerns' }, 403);
            }

            return c.json({ error: 'Failed to refresh session' }, 500);
        }
    }

    return c.json({ success: true, message: 'Access token refreshed' });
})
