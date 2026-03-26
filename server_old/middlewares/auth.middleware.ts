import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { sessionIdSchema } from 'libs/contract/zod/session/v1/session.zod';
import { ContextService } from '@server/core/context/context.service';

export const authMiddleware = async (c: Context, next: Next) => {
    // const sessionId = getCookie(c, 'sid_short');
    const sessionId = "019ca6fd-2f57-723c-9ac4-b547b765e06b"; // 模擬從 cookie 取得 sessionId，實際應使用 getCookie(c, 'sid_short')
    console.log('Extracted Session ID:', sessionId); // Debug: 查看提取的 Session ID
    if (!sessionId) {
        return c.json({ error: 'Missing Session' }, 401);
    }

    const result = sessionIdSchema.safeParse(sessionId);
    if (!result.success) {
        return c.json({ error: 'Invalid Session' }, 401);
    }

    // 這裡實作你的 Session 換 UserID 邏輯
    // const sessionService = container.resolve('sessionService');
    // const userId = await sessionService.getUserIdBySession(sessionId);
    const userId = '019c6bdc-e277-7caf-b595-30c19a3ab8ab'; // 模擬取得 userId，實際應從 sessionService 拿
    if (!userId) {
        return c.json({ error: 'Invalid Session' }, 401);
    }

    return await ContextService.setContext({ userId, sessionId }, async () => {
        await next();
    });
};