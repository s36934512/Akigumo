import Redis from 'ioredis';
import 'dotenv/config';

const mainOptions = {
    host: process.env.REDIS_HOST || 'redis', // Docker 內用 service name
    port: 6379,
    maxRetriesPerRequest: null,
};
export const redis = new Redis(mainOptions);
export const redisListener = new Redis(mainOptions);
export const createSubscriber = () => redis.duplicate(); // 給 SSE 用

const cacheOptions = {
    host: process.env.REDIS_CACHE_HOST || 'redis-cache',
    port: 6379,
};
export const redisCache = new Redis(cacheOptions);