// import { z } from '@hono/zod-openapi'
// import { argon2id } from 'argon2';

// import { SessionCreateInputObjectSchema } from 'generated/zod/schemas';
// import { v7 as uuidv7 } from 'uuid';

// interface SessionServiceDeps {
//     sessionRepository: any; // Replace with actual SessionRepository type
//     redisCache: any; // Replace with actual RedisCacheRepository type
// }

// export default class SessionService {
//     constructor(private deps: SessionServiceDeps) { }

//     private get sessionRepository() { return this.deps.sessionRepository; }
//     private get redisCache() { return this.deps.redisCache; }

//     //Cookie 設定： 如果使用 Cookie 儲存 ID，務必加上 HttpOnly（防止 XSS 攻擊讀取）和 Secure（確保只在 HTTPS 傳輸）。
//     async createSession(
//         userId: string,
//         accountId: string,
//         ipAddress: string,
//         rawUserAgent: string
//     ) {
//         // 1. 產生必要欄位
//         const sessionId = uuidv7();
//         const rawRefreshToken = uuidv7();
//         // const refreshToken = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
//         argon2id
//         const expiresTime = new Date(Date.now() + 1000 * 60 * 60 * 12); // 12小時後過期

//         // 產生 JWT accessToken
//         const jwtPayload = {
//             userId,
//             sessionId,
//             accountId,
//         };
//         // 請根據實際專案引入 JWT 函式庫（如 jsonwebtoken）與密鑰
//         const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
//         const accessToken = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '15m' });

//         // 2. 解析 UA 並組裝 Prisma/Zod 格式
//         const parser = new UAParser(rawUserAgent).getResult();
//         const deviceType = parser.device.type || 'desktop';
//         const osName = parser.os.name || '';
//         const browserName = parser.browser.name || '';

//         const sessionData = {
//             id: sessionId,
//             ipAddress,
//             rawUserAgent,
//             deviceType,
//             osName,
//             browserName,
//             loginTime: new Date(),
//             isRevoked: false,
//             user: { connect: { id: userId } },
//             account: { connect: { id: accountId } },
//             redundancy: { refreshToken, expiresAt: expiresTime },
//         };

//         // 3. Zod 驗證
//         const parseResult = SessionCreateInputObjectSchema.safeParse(sessionData);
//         if (!parseResult.success) {
//             throw new Error('Session 格式驗證失敗: ' + JSON.stringify(z.treeifyError(parseResult.error)));
//         }

//         // 4. 寫入資料庫
//         const createdSession = await this.sessionRepository.create(parseResult.data);

//         // 5. 寫入 Redis 快取（可自訂欄位，refreshToken 不建議快取）
//         const cacheSession = {
//             userId: createdSession.userId,
//             accountId: createdSession.accountId,
//             ipAddress: createdSession.ipAddress,
//             isRevoked: createdSession.isRevoked,
//         };
//         await this.redisCache.set(NAMESPACE, sessionId, cacheSession, 60 * 60 * 12); // 12小時

//         // 6. 回傳 session 及 token
//         return {
//             session: cacheSession,
//             accessToken,
//             refreshToken: rawRefreshToken,
//             expiresAt: expiresTime,
//         };
//     }

//     /**
//      * 取得 Session，優先從快取，失效時自動回填
//      * @param {string} id
//      * @returns {Promise<any>} session 物件
//      * @throws {UnauthorizedError} 若 session 不存在或已撤銷
//      */
//     async getSession(id: string) {
//         // 1. 先從 Redis 拿 (Cache-Aside Pattern)
//         const cachedSession = await this.redisCache.get(NAMESPACE, id);
//         if (cachedSession) {
//             if (cachedSession.isRevoked) throw new UnauthorizedError('Session 已失效');
//             return cachedSession;
//         }

//         // 2. 如果 Redis 沒拿到，去 Postgres 拿
//         const session = await this.sessionRepository.findById(id);
//         if (!session || session.isRevoked) {
//             throw new UnauthorizedError('Session 已失效');
//         }

//         // 3. 如果 Postgres 有，則回填到 Redis 方便下次使用
//         await this.redisCache.set(NAMESPACE, id, session, 3600); // 存 1 小時
//         return session;
//     }

//     /**
//      * 撤銷 Session，資料庫與快取都要處理
//      * @param {string} id
//      */
//     async revokeSession(id: string) {
//         await Promise.all([
//             this.sessionRepository.delete(id),
//             this.redisCache.delete(NAMESPACE, id)
//         ]);
//     }
// }

// export class UnauthorizedError extends Error {
//     constructor(message: string) {
//         super(message);
//         this.name = 'UnauthorizedError';
//     }
// }