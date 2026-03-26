import { z } from '@hono/zod-openapi';
import { createHash } from 'node:crypto';
import { SessionCreateInputObjectSchema } from "generated/zod/schemas";
import AuthRepository from "../../data/repositories/auth.repository";
import { SessionId } from 'libs/contract/zod/session/v1/session.zod';

interface AuthServiceDeps {
    authRepository: AuthRepository;
}

export class AuthService {
    constructor(private deps: AuthServiceDeps) { }

    private get authRepository(): AuthRepository { return this.deps.authRepository; }

    private generateHash(input: SessionId) {
        return createHash('sha256').update(input).digest('hex');
    }

    async createSession(data: z.infer<typeof SessionCreateInputObjectSchema>) {
        return await this.authRepository.createSession(data);
    }

    async refreshSession(sessionId: SessionId) {
        const refreshHash = this.generateHash(sessionId);
        const session = await this.authRepository.findByHash(refreshHash);
        if (!session) {
            throw new Error('Session not found');
        }

        if (session.currentHash !== refreshHash || session.isRevoked) {
            console.warn(`[SECURITY ALERT] Token reuse detected for User: ${session.userId}`);
            await this.authRepository.revokeSession(session.id);

            throw new Error('Security Breach: Session Revoked');
        }

        if (session.expiresTime < new Date()) {
            throw new Error('Session Expired');
        }

        const nextLongId = crypto.randomUUID();
        const nextHashed = this.generateHash(nextLongId);
        const nextShortId = crypto.randomUUID();

        this.authRepository.updateSession({
            currentHash: nextHashed,
            expiresTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 延長 3 天
            historyHashes: { push: refreshHash }
        }, {
            where: { id: session.id }
        });
        // [TODO] 同步更新 Redis 中的短期 Access Session
        // redis.set(`session:${nextShortId}`, session.userId, 'EX', 900)

        return { nextShortId, nextLongId };
    }
}