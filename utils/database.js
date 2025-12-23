const redis = require('./redisClient');
const { pool } = require('../postgres');
const DEFAULT_EXPIRE = 60 * 60;

/**
 * 資料庫快取服務，支援 Redis + Postgres 雙層快取
 * @class databaseService
 */
class databaseService {
    /**
     * @type {string} #namespace - 命名空間（私有屬性）
     * @type {number} #ttl - Redis 預設過期秒數（私有屬性）
     */
    #namespace;
    #ttl;

    /**
     * 建立一個資料庫快取服務實例
     * @param {string} namespace - 命名空間（用於區分不同類型快取）
     * @param {number} [ttl=DEFAULT_EXPIRE] - Redis 預設過期秒數
     */
    constructor(namespace, ttl = DEFAULT_EXPIRE) {
        this.#namespace = namespace;
        this.#ttl = ttl;
    }

    /**
     * 取得命名空間（唯讀屬性）
     * @returns {string} 命名空間字串
     */
    get namespace() {
        return this.#namespace;
    }

    /**
     * 取得 Redis 預設過期秒數（唯讀屬性）
     * @returns {number} 預設過期秒數（秒）
     */
    get ttl() {
        return this.#ttl;
    }

    /**
     * 取得快取值，優先查 Redis，miss 時查 Postgres 並回寫 Redis
     *
     * @param {string} key - 欲查詢的鍵名
     * @returns {Promise<any|undefined>} 取得的值，若不存在則為 undefined
     */
    async get(key) {
        let value = await this.getRedis(`${this.namespace}:${key}`);
        if (value) return value;

        let result = await this.getPostgres({ key });
        if (result.rows.length === 0) return undefined;

        value = result.rows[0].value;
        await this.setRedis(`${this.namespace}:${key}`, value);

        return value;
    }

    /**
     * 設定快取值，同步寫入 Redis 與 Postgres
     *
     * @param {string} key - 欲設定的鍵名
     * @param {any} value - 要儲存的值
     * @param {number} [expire=this.ttl] - Redis 過期秒數（秒）
     * @returns {Promise<void>} 無回傳值
     */
    async set(key, value, expire = this.ttl) {
        await this.setRedis(`${this.namespace}:${key}`, value, expire);
        await this.setPostgres(key, value);
    }

    /**
     * 刪除快取值（僅刪 Redis，不動 Postgres）
     *
     * @param {string} key - 欲刪除的鍵名
     * @returns {Promise<void>} 無回傳值
     */
    async del(key) {
        await this.delRedis(`${this.namespace}:${key}`);
    }

    /**
     * 取得 Redis 快取值（僅查 Redis，不查 Postgres）
     *
     * @param {string} key - 欲查詢的鍵名
     * @returns {Promise<any|undefined>} 取得的值，若不存在則為 undefined
     */
    async getRedis(key) {
        return redis.get(`${this.namespace}:${key}`);
    }

    /**
     * 設定 Redis 快取值
     *
     * @param {string} key - 欲設定的鍵名
     * @param {any} value - 要儲存的值
     * @param {number} [expire=this.ttl] - 過期秒數（秒）
     * @returns {Promise<void>} 無回傳值
     */
    async setRedis(key, value, expire = this.ttl) {
        await redis.set(`${this.namespace}:${key}`, value, expire);
    }

    /**
     * 刪除 Redis 快取值
     *
     * @param {string} key - 欲刪除的鍵名
     * @returns {Promise<void>} 無回傳值
     */
    async delRedis(key) {
        await redis.del(`${this.namespace}:${key}`);
    }

    /**
     * 以 key 或 value 查詢 Postgres 快取
     *
     * 用法：
     *   - getPostgres({ key })   // 以 key 查 value
     *   - getPostgres({ value }) // 以 value 查 key
     *
     * @param {object} param0 - 查詢參數，必須包含 key 或 value 其中之一
     * @param {string} [param0.key]   - 欲查詢的 key，回傳 value
     * @param {string} [param0.value] - 欲查詢的 value，回傳 key
     * @returns {Promise<object>} Postgres 查詢結果 (pg.Result)
     * @throws {Error} 若未提供 key 或 value 會丟出錯誤
     *
     * 注意：若同時提供 key 與 value，會以 key 為主。
     */
    async getPostgres({ key, value }) {
        let sql, params;
        if (key !== undefined) {
            sql = `
                SELECT value FROM database_cache
                WHERE namespace = $1 AND key = $2
            `;
            params = [this.namespace, key];
        } else if (value !== undefined) {
            sql = `
                SELECT key FROM database_cache
                WHERE namespace = $1 AND value = $2
            `;
            params = [this.namespace, value];
        } else {
            throw new Error('Must provide key or value');
        }
        return pool.query(sql, params);
    }

    /**
     * 設定 Postgres 快取值（同步 upsert）
     *
     * @param {string} key - 欲設定的鍵名
     * @param {any} value - 要儲存的值
     * @returns {Promise<void>} 無回傳值
     */
    async setPostgres(key, value) {
        const sql = `
            INSERT INTO database_cache (namespace, key, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (namespace, key) DO UPDATE SET value = EXCLUDED.value
        `;
        await pool.query(sql, [this.namespace, key, value]);
    }
}

module.exports = databaseService;