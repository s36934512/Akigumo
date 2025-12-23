const path = require('path');

/**
 * 專案根目錄的絕對路徑
 * @type {string}
 */
const ROOT = path.resolve(__dirname, '..');

/**
 * 專案常用路徑集中管理類別
 * @class Paths
 */
/**
 * 專案常用路徑集中管理類別
 * @class Paths
 * @property {string} ROOT 專案根目錄
 * @property {string} TMP 臨時檔案目錄
 * @property {string} TMP_UPLOADS 臨時上傳目錄
 * @property {string} TMP_EXTRACTED 臨時解壓縮目錄
 * @property {string} UPLOADS 上傳檔案目錄
 * @property {string} UPLOADS_TRASH 上傳檔案垃圾桶
 * @property {string} PUBLIC 公開靜態檔案目錄
 * @property {string} SERVICES services 目錄
 * @property {string} SERVICES_UPLOADS services/upload 目錄
 * @property {string} UTILS utils 目錄
 */
class Paths {
    constructor() {
        /**
         * 專案根目錄
         * @type {string}
         */
        this.ROOT = ROOT;
        /**
         * 臨時檔案目錄
         * @type {string}
         */
        this.TMP = path.join(ROOT, 'tmp');
        /**
         * 臨時上傳目錄
         * @type {string}
         */
        this.TMP_UPLOADS = path.join(ROOT, 'tmp/uploads');
        /**
         * 臨時解壓縮目錄
         * @type {string}
         */
        this.TMP_EXTRACTED = path.join(ROOT, 'tmp/uploads/extracted');
        /**
         * 上傳檔案目錄
         * @type {string}
         */
        this.UPLOADS = path.join(ROOT, 'uploads');
        /**
         * 上傳檔案垃圾桶
         * @type {string}
         */
        this.UPLOADS_TRASH = path.join(ROOT, 'uploads/trash');
        /**
         * 公開靜態檔案目錄
         * @type {string}
         */
        this.PUBLIC = path.join(ROOT, 'public');
        /**
         * services 目錄
         * @type {string}
         */
        this.SERVICES = path.join(ROOT, 'services');
        /**
         * services/upload 目錄
         * @type {string}
         */
        this.SERVICES_UPLOADS = path.join(ROOT, 'services/upload');
        /**
         * utils 目錄
         * @type {string}
         */
        this.UTILS = path.join(ROOT, 'utils');
    }

    /**
     * 組合多個路徑片段，支援以 paths 物件屬性名稱作為參數
     *
     * @param {...string} args 路徑片段或 paths 屬性名稱
     * @returns {string} 組合後的路徑
     * @example
     * paths.concat('UTILS', 'A') // 等同於 path.join(paths.UTILS, 'A')
     */
    concat(...args) {
        const resolved = args.map(arg => (typeof arg === 'string' && this[arg]) ? this[arg] : arg);
        return path.join(...resolved);
    }

    /**
     * 取得相對路徑，支援以 paths 物件屬性名稱作為參數
     *
     * @param {...string} args 路徑片段或 paths 屬性名稱
     * @returns {string} 以 / 開頭的相對路徑
     */
    relative(...args) {
        const resolved = args.map(arg => (typeof arg === 'string' && this[arg]) ? this[arg] : arg);
        return `/${path.relative(...resolved)}`;
    }

    /**
     * 取得檔案副檔名
     *
     * @param {string} filePath 檔案路徑
     * @param {boolean} [LowerCase=true] 是否轉小寫
     * @returns {string} 副檔名（含 .）
     */
    extname(filePath, LowerCase = true) {
        const ext = path.extname(filePath);
        return LowerCase ? ext.toLowerCase() : ext;
    }

    /**
     * 變更檔案所在目錄
     *
     * @param {string} filePath 原始檔案路徑
     * @param {string} newDir 新目錄路徑
     * @returns {string} 新目錄下的檔案完整路徑
     */
    changeDir(filePath, newDir) {
        const baseName = path.basename(filePath);
        return path.join(newDir, baseName);
    }

    /**
     * 變更檔案副檔名
     *
     * @param {string} filePath 原始檔案路徑
     * @param {string} newExt 新副檔名（含 .）
     * @returns {string} 更換副檔名後的完整路徑
     */
    changeExt(filePath, newExt) {
        const dir = path.dirname(filePath);
        const baseName = path.basename(filePath, path.extname(filePath));
        return path.join(dir, baseName + newExt);
    }

    /**
     * 取得檔案路徑的上層目錄
     *
     * @param {string} filePath 檔案路徑
     * @param {number} [level=1] 上溯層數，預設 1
     * @returns {string} 上層目錄路徑
     */
    dirname(filePath, level = 1) {
        let dir = filePath;
        for (let i = 0; i < level; i++) {
            dir = path.dirname(dir);
        }
        return dir;
    }

    /**
     * 取得檔案名稱
     *
     * @param {string} filePath 檔案路徑
     * @param {boolean} [ext=false] 是否保留副檔名，預設 false
     * @returns {string} 檔案名稱
     */
    basename(filePath, ext = false) {
        return ext ? path.basename(filePath) : path.basename(filePath, path.extname(filePath));
    }
}

module.exports = new Paths();
