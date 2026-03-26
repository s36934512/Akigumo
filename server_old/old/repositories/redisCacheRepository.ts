import Redis from 'ioredis';

export class RedisCacheRepository {
    private redis: Redis;

    constructor(
        redisClient: Redis
    ) {
        this.redis = redisClient;
    }

    /**
     * 寫入或更新快取 (Set)
     */
    async set(namespace: string, key: string, value: any, ttlSeconds?: number) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        await this.redis.hset(namespace, key, stringValue);
        if (ttlSeconds) {
            await this.redis.hexpire(namespace, ttlSeconds, "FIELDS", key);
        }
    }

    /**
     * 讀取快取 (Get)
     */
    async get<T = any>(namespace: string, key: string): Promise<T | null> {
        const value = await this.redis.hget(namespace, key);
        if (value == null) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return value as unknown as T;
        }
    }

    /**
     * 刪除快取 (Delete)
     */
    async delete(namespace: string, key: string) {
        await this.redis.hdel(namespace, key);
    }

    /**
     * 獲取特定命名空間下的所有任務 (Scan)
     */
    async listByNamespace(namespace: string) {
        const result = await this.redis.hgetall(namespace);
        // 轉成 { key, value } 陣列
        return Object.entries(result).map(([key, value]) => {
            try {
                return { key, value: JSON.parse(value) };
            } catch {
                return { key, value };
            }
        });
    }
}