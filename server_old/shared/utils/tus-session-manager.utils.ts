import { redis } from '@core/infrastructure/cache/redisClient';

// TODO
export class TusSessionManager {
    private redis = redis;
    private readonly PREFIX = 'tus:owner:';
    private readonly DEFAULT_TTL = 60 * 60 * 24; // 24 小時

    /**
     * 綁定 UploadID 與 UserId
     */
    async bindUser(uploadId: string, userId: string, ttl = this.DEFAULT_TTL) {
        await this.redis.set(`${this.PREFIX}${uploadId}`, userId, 'EX', ttl);
    }

    /**
     * 取得檔案擁有者
     */
    async getOwner(uploadId: string): Promise<string | null> {
        return await this.redis.get(`${this.PREFIX}${uploadId}`);
    }

    /**
     * 清理標籤 (上傳完成或取消時)
     */
    async cleanup(uploadId: string) {
        await this.redis.del(`${this.PREFIX}${uploadId}`);
    }
}