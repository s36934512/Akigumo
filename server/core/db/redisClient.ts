import Redis from 'ioredis';
import 'dotenv/config';

const options = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
};

const redis = new Redis(options);
const redisListener = new Redis(options);

export { redis, redisListener };
