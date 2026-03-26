import crypto from 'crypto';
import fs from 'fs/promises';

const SHA_TTL = 60 * 60 * 24;

/**
 * HashService 負責檔案 SHA256 雜湊計算與重複檢查
 * 依賴外部注入的 databaseService 作為快取層
 */
class HashService {
    #shaDatabase;

    /**
     * 建構子，注入 databaseService 實例
     *
     * @param {class} databaseService - 資料庫快取服務 class，需支援 get/set/getRedis/setRedis/getPostgres/setPostgres 方法
     */
    constructor(databaseService) {
        this.#shaDatabase = new databaseService('sha256', SHA_TTL);
    }

    /**
     * 取得檔案的 SHA256 雜湊值，優先查快取，無則計算並回寫快取
     *
     * @param {string} filePath - 檔案路徑
     * @returns {Promise<string>} SHA256 雜湊值
     * @throws {Error} 若檔案不存在則丟出錯誤
     */
    async getFileSHA256(filePath) {
        let sha256 = await this.#shaDatabase.getRedis(filePath);
        if (sha256) return sha256;

        const result = await this.#shaDatabase.getPostgres({ value: filePath });
        if (result.rowCount > 0) {
            sha256 = result.rows[0].key;
            await this.#shaDatabase.setRedis(filePath, sha256);
            await this.#shaDatabase.setRedis(sha256, filePath);
            return sha256;
        }

        const fileBuffer = await fs.readFile(filePath);
        if (!fileBuffer) throw new Error('filePath not found');
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    /**
     * 檢查檔案是否重複（根據 SHA256 雜湊值）
     *
     * @param {string} filePath - 檔案路徑
     * @returns {Promise<boolean>} 若重複則回傳 true，否則 false
     */
    async checkDuplicate(filePath) {
        const sha256 = await this.getFileSHA256(filePath);
        return await this.shaExists(sha256);
    }

    /**
     * 檢查指定 SHA256 是否已存在於快取
     *
     * @param {string} sha256 - SHA256 雜湊值
     * @returns {Promise<boolean>} 若存在則回傳 true，否則 false
     */
    async shaExists(sha256) {
        const exists = await this.#shaDatabase.getRedis(sha256) !== undefined;
        if (exists) return true;

        const result = await this.#shaDatabase.getPostgres({ key: sha256 });
        if (result.rowCount > 0) {
            const path = result.rows[0].value;
            await this.#shaDatabase.setRedis(sha256, path);
            await this.#shaDatabase.setRedis(path, sha256);
            return true;
        }

        return false
    }

    /**
     * 設定 SHA256 與 filePath 的雙向快取，並寫入 Postgres
     *
     * @param {string} sha256 - SHA256 雜湊值
     * @param {string} filePath - 檔案路徑
     * @returns {Promise<void>} 無回傳值
     */
    async setSHA256(sha256, filePath) {
        await this.#shaDatabase.setRedis(sha256, filePath);
        await this.#shaDatabase.setRedis(filePath, sha256);
        await this.#shaDatabase.setPostgres(sha256, filePath);
    }
}


export default HashService;
