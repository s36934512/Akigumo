import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { createCache } from 'cache-manager';

// 初始化 Store
const memoryStore = new Keyv({
    store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
});

const redisStore = new Keyv({
    store: new KeyvRedis('redis://redis-cache:6379'),
});

// 建立快取實例
export const cache = createCache({
    stores: [memoryStore, redisStore],
});

/**
 * 💡 小撇步：定義一個強型別的快取包裝器 (可選)
 */
export const cacheService = {
    // 封裝常用操作
    async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl = 3600000): Promise<T> {
        return await cache.wrap(key, fetchFn, ttl);
    },

    async invalidate(key: string) {
        await cache.del(key);
    }
};