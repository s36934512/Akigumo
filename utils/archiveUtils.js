const { spawnSync } = require('child_process');
const paths = require('./paths');
const tar = require('tar');

const archiveUtils = {
    /**
     * 判斷檔案是否為支援的壓縮檔（zip 或 rar）
     * @param {string} filename - 檔案名稱
     * @returns {boolean} - 是否為壓縮檔
     */
    isArchiveFile(filename) {
        const archiveExts = ['.zip', '.rar'];
        const ext = paths.extname(filename);
        return archiveExts.includes(ext);
    },

    /**
     * 解壓縮指定的壓縮檔到目標資料夾
     * @param {string} archivePath - 壓縮檔路徑
     * @param {string} destDir - 解壓縮目標資料夾
     * @returns {object} - 解壓縮結果（由 extract_archive.py 回傳的 JSON）
     * @throws {Error} - 執行失敗時丟出錯誤
     */
    extract(archivePath, destDir) {
        const scriptPath = paths.concat('UTILS', 'extract_archive.py');
        const result = spawnSync('python', [scriptPath, archivePath, destDir], { encoding: 'utf-8' });
        if (result.error) throw result.error;
        if (result.status !== 0) throw new Error(result.stderr);
    },

    /**
     * 將指定目錄下的檔案打包成 tar 壓縮檔
     * @param {string} dirPath - 要打包的目錄路徑
     * @param {string[]} files - 要打包的檔案（檔名陣列，需在 dirPath 內）
     * @returns {Promise<string>} - tar 檔案的完整路徑
     */
    async createTar(dirPath, files = []) {
        const tarPath = paths.concat(dirPath + '.tar');
        const _files = files.length > 0 ? files : [paths.basename(dirPath)];
        await tar.c({ cwd: paths.dirname(dirPath), file: tarPath }, _files);
        return tarPath;
    }
};

module.exports = archiveUtils;
