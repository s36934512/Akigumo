const Redis = require('ioredis');
const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
});

const TTL = 60 * 10; // 10分鐘（秒）


/**
 * 設定一個 Redis 鍵值（自動轉為 JSON 字串）
 * @param {string} key - Redis 鍵名
 * @param {any} value - 要儲存的值
 * @param {number} [ttl=TTL] - 過期時間（秒）
 * @returns {Promise<void>}
 */
async function set(key, value, ttl = TTL) {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
}


/**
 * 取得 Redis 鍵值（自動解析為物件）
 * @param {string} key - Redis 鍵名
 * @returns {Promise<any|undefined>} - 取得的值，若不存在則為 undefined
 */
async function get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : undefined;
}


/**
 * 刪除 Redis 鍵值
 * @param {string} key - Redis 鍵名
 * @returns {Promise<void>}
 */
async function del(key) {
    await redis.del(key);
}

module.exports = { set, get, del };
