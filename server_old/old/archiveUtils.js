import { spawn } from 'child_process';
import { fileTypeFromFile } from 'file-type';
import Paths from '../core/paths.js';
import * as tar from 'tar';

const archiveUtils = {
    /**
     * 判斷檔案是否為支援的壓縮檔（zip 或 rar）
     * @param {string} filename - 檔案名稱
     * @returns {boolean} - 是否為壓縮檔
     */
    async isArchiveFile(filename) {
        const archiveExts = ['zip', 'rar'];
        const type = await fileTypeFromFile(filename);
        return archiveExts.includes(type.ext);
    },

    /**
     * 解壓縮指定的壓縮檔到目標資料夾
     * @async
     * @param {string} archivePath - 壓縮檔路徑
     * @param {string} destDir - 解壓縮目標資料夾
     * @returns {Promise<string>} - 解壓縮結果（extract_archive.py 的 stdout，通常為 JSON 字串）
     * @throws {Error} - 執行失敗時丟出錯誤
     */
    async extract(archivePath, destDir) {
        if (!await this.isArchiveFile(archivePath)) {
            throw new Error('請上傳壓縮檔（zip/rar）');
        }

        const scriptPath = Paths.concat('UTILS_PY', 'extract_archive.py');
        return new Promise((resolve, reject) => {
            const child = spawn('python', [scriptPath, archivePath, destDir], { encoding: 'utf-8' });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => { stdout += data; });
            child.stderr.on('data', (data) => { stderr += data; });
            child.on('error', (err) => reject(err));
            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(stderr || `Process exited with code ${code}`));
                } else {
                    resolve(stdout);
                }
            });
        });
    },

    /**
     * 將指定目錄下的檔案打包成 tar 壓縮檔
     * @param {string} dirPath - 要打包的目錄路徑
     * @param {string[]} files - 要打包的檔案（檔名陣列，需在 dirPath 內）
     * @returns {Promise<string>} - tar 檔案的完整路徑
     */
    async createTar(dirPath, files = []) {
        const tarPath = Paths.concat(dirPath + '.tar');
        const _files = files.length > 0 ? files : [Paths.basename(dirPath)];
        await tar.c({ cwd: Paths.dirname(dirPath), file: tarPath }, _files);
        return tarPath;
    }
};

export default archiveUtils;
