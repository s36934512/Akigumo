import { z } from '@hono/zod-openapi';
import KeyvRedis from '@keyv/redis';
import { Cache, createCache } from 'cache-manager';
import { CacheableMemory } from 'cacheable';
import { Keyv } from 'keyv';

// --- 配置與常數 ---
const DEFAULT_MEMORY_TTL_MS = 60_000;
const DEFAULT_MEMORY_LRU_SIZE = 5_000;
const DEFAULT_REDIS_CACHE_URL = process.env.REDIS_CACHE_URL ?? 'redis://redis-cache:6379';
const APP_PREFIX = 'akigumo';
const CHUNK_SIZE = 50;

// --- Zod Schema 定義 ---
const ModuleEnum = z.enum(['File', 'Item', 'ItemFileInfo', 'Entity', 'User', 'Auth']);

const SingleParamSchema = z.discriminatedUnion('module', [
    z.object({ module: z.literal('File'), key: z.uuid(), ttl: z.number().default(3_600_000) }),
    z.object({ module: z.literal('Item'), key: z.uuid(), ttl: z.number().default(3_600_000) }),
    z.object({ module: z.literal('ItemFileInfo'), key: z.string(), ttl: z.number().default(3_600_000) }),
    z.object({ module: z.literal('Entity'), key: z.uuid(), ttl: z.number().default(3_600_000) }),
    z.object({ module: z.literal('User'), key: z.uuid(), ttl: z.number().default(1_800_000) }),
    z.object({ module: z.literal('Auth'), key: z.string().min(10), ttl: z.number().default(600_000) }),
]);
type CacheParam = z.input<typeof SingleParamSchema>;

const InvalidateSchema = z.union([
    SingleParamSchema,
    z.array(SingleParamSchema),
    z.object({ module: ModuleEnum, keys: z.array(z.string()) })
]).transform((val) => {
    // 統一轉換成 [{ module, key }] 格式
    if (Array.isArray(val)) return val;
    if ('keys' in val) return val.keys.map(k => ({ module: val.module, key: k }));
    return [val];
});

type InvalidateInput = z.input<typeof InvalidateSchema>;

// --- 初始化 Stores ---
const memoryStore = new Keyv({
    store: new CacheableMemory({ ttl: DEFAULT_MEMORY_TTL_MS, lruSize: DEFAULT_MEMORY_LRU_SIZE }),
});

const redisStore = new Keyv({
    store: new KeyvRedis(DEFAULT_REDIS_CACHE_URL),
});

redisStore.on('error', (err) => console.error(`[Cache] Redis Error: ${err.message}`));

export const cache: Cache = createCache({
    stores: [memoryStore, redisStore],
});

// --- Cache Service 實作 ---
export const cacheService = {
    /**
     * 獲取完整 Key (內部使用)
     */
    getFullKey(module: string, key: string): string {
        return `${APP_PREFIX}:${module}:${key}`;
    },

    /**
     * 核心刪除邏輯：分片批次處理
     */
    async executeBatchDelete(fullKeys: string[]): Promise<void> {
        const uniqueKeys = Array.from(new Set(fullKeys));
        for (let i = 0; i < uniqueKeys.length; i += CHUNK_SIZE) {
            const chunk = uniqueKeys.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(key => cache.del(key)));
        }
    },

    /**
     * 自動包裝 (L1 + L2)
     */
    async getOrSet<T>(param: CacheParam, fetchFn: () => Promise<T>): Promise<T> {
        const validated = SingleParamSchema.parse(param);
        const fullKey = this.getFullKey(validated.module, validated.key);
        try {
            // param.ttl 優先級高於 Schema 預設值
            return await cache.wrap(fullKey, fetchFn, param.ttl ?? validated.ttl);
        } catch (error) {
            console.warn(`[Cache] getOrSet fallback: ${fullKey}`, error);
            return await fetchFn();
        }
    },

    async get<T>(param: CacheParam): Promise<T | undefined> {
        const validated = SingleParamSchema.parse(param);
        return (await cache.get<T>(this.getFullKey(validated.module, validated.key))) ?? undefined;
    },

    async set<T>(param: CacheParam, value: T): Promise<void> {
        const validated = SingleParamSchema.parse(param);
        await cache.set(this.getFullKey(validated.module, validated.key), value, param.ttl ?? validated.ttl);
    },

    /**
     * 萬用失效方法：支援單個物件或物件陣列
     */
    async invalidate(params: CacheParam | CacheParam[]): Promise<void> {
        const items = Array.isArray(params) ? params : [params];
        const fullKeys = items.map(p => {
            const v = SingleParamSchema.parse(p);
            return this.getFullKey(v.module, v.key);
        });
        await this.executeBatchDelete(fullKeys);
    },

    /**
     * 批次失效：單一模組 + 多個 Keys
     */
    async invalidateMany(input: InvalidateInput): Promise<void> {
        const items = InvalidateSchema.parse(input);
        const fullKeys = items.map(({ module, key }) => this.getFullKey(module, key));
        await this.executeBatchDelete(fullKeys);
    },
};
