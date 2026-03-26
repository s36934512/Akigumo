import shortid from 'shortid';

const DEFAULT_EXPIRE = 60 * 60;


/**
 * MetaService 負責管理檔案路徑與唯一 ID 的對應關係
 * 依賴外部注入的 databaseService 作為快取層
 */
class MetaService {
    #metaDatabase;

    /**
     * 建構子，注入 databaseService 實例
     * @param {class} databaseService - 資料庫快取服務 class
     */
    constructor(databaseService) {
        this.#metaDatabase = new databaseService('meta', DEFAULT_EXPIRE);
    }

    /**
     * 將檔案路徑編碼成唯一 ID，並建立雙向對應
     * @param {string} filePath - 檔案路徑
     * @returns {Promise<string>} - 對應的唯一 ID
     */
    async encodePath(filePath) {
        let fileID = await this.#metaDatabase.get(filePath);
        if (fileID) return fileID;

        fileID = shortid.generate();
        while (await this.#metaDatabase.get(fileID)) {
            fileID = shortid.generate();
        }

        await this.#metaDatabase.set(filePath, fileID);
        await this.#metaDatabase.set(fileID, filePath);
        return fileID;
    }

    /**
     * 根據唯一 ID 反查檔案路徑
     * @param {string} fileID - 唯一 ID
     * @returns {Promise<string>} - 對應的檔案路徑
     */
    async decodePath(fileID) {
        return await this.#metaDatabase.get(fileID);
    }
}

export default MetaService;
