import Paths from '../core/paths.js';
import archiveUtils from '../utils/archiveUtils.js';
import imageUtils from '../utils/imageUtils.js';
import fs from 'fs/promises';

/**
 * FileSystemService
 * 檔案操作核心服務
 * 用於讀寫、搬移、壓縮、解壓縮、圖片檔案處理等
 */
class FileSystemService {
    /**
     * @param {object} dependencies - 依賴物件
     * @param {object} dependencies.hashService - 檔案雜湊服務
     * @param {object} dependencies.metaService - 路徑編碼服務
     */
    constructor({ hashService, metaService }) {
        this.hashService = hashService;
        this.metaService = metaService;
    }


    /**
     * 讀取檔案內容
     * @param {string} filePath - 檔案路徑
     * @param {string|object} [options='utf8'] - 讀取選項
     * @returns {Promise<string|Buffer>} 檔案內容
     */
    async readFile(filePath, options = 'utf8') {
        return fs.readFile(filePath, options);
    }


    /**
     * 寫入檔案內容
     * @param {string} filePath - 檔案路徑
     * @param {string|Buffer} data - 寫入資料
     * @param {string|object} [options='utf8'] - 寫入選項
     * @returns {Promise<void>}
     */
    async writeFile(filePath, data, options = 'utf8') {
        return fs.writeFile(filePath, data, options);
    }


    /**
     * 刪除檔案
     * @param {string} filePath - 檔案路徑
     * @returns {Promise<void>}
     */
    async deleteFile(filePath) {
        return fs.unlink(filePath);
    }


    /**
     * 搬移檔案
     * @param {string} src - 原始路徑
     * @param {string} dest - 目標路徑
     * @returns {Promise<void>}
     */
    async moveFile(src, dest) {
        await fs.rename(src, dest);
    }


    /**
     * 複製檔案
     * @param {string} src - 原始路徑
     * @param {string} dest - 目標路徑
     * @returns {Promise<void>}
     */
    async copyFile(src, dest) {
        await fs.copyFile(src, dest);
    }


    /**
     * 建立目錄
     * @param {string} dirPath - 目錄路徑
     * @param {object} [options={ recursive: true }] - 建立選項
     * @returns {Promise<void>}
     */
    async makeDir(dirPath, options = { recursive: true }) {
        await fs.mkdir(dirPath, options);
    }


    /**
     * 檢查檔案是否存在
     * @param {string} filePath - 檔案路徑
     * @returns {Promise<boolean>} 是否存在
     */
    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }


    /**
     * 取得檔案資訊 stat
     * @param {string} filePath - 檔案路徑
     * @returns {Promise<fs.Stats>} 檔案資訊
     */
    async stat(filePath) {
        return fs.stat(filePath);
    }


    /**
     * 將目錄下所有檔案拉平到同一層
     * @param {string} dirPath - 目錄路徑
     * @returns {Promise<void>}
     */
    async flattenDirectoryInPlace(dirPath) {
        const list = await fs.readdir(dirPath, { withFileTypes: true });
        for (const dirent of list) {
            const fullPath = Paths.concat(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                await this.flattenDirectoryInPlace(fullPath);
                const subList = await fs.readdir(fullPath, { withFileTypes: true });
                for (const subDirent of subList) {
                    if (subDirent.isFile()) {
                        const src = Paths.concat(fullPath, subDirent.name);
                        let dest = Paths.concat(dirPath, subDirent.name);
                        let count = 1;
                        const ext = Paths.extname(subDirent.name, false);
                        const base = Paths.basename(subDirent.name);
                        while (await this.exists(dest)) {
                            dest = Paths.concat(dirPath, `${base}(${count})${ext}`);
                            count++;
                        }
                        await fs.rename(src, dest);
                    }
                }
                await fs.rmdir(fullPath);
            }
        }
    }


    /**
     * 遞迴取得目錄下所有檔案（拉平成陣列）
     * @param {string} dirPath - 目錄路徑
     * @returns {Promise<string[]>} 檔案路徑陣列
     */
    async flattenDirectory(dirPath) {
        let results = [];
        const list = await fs.readdir(dirPath, { withFileTypes: true });
        for (const dirent of list) {
            const fullPath = Paths.concat(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                const subFiles = await this.flattenDirectory(fullPath);
                results = results.concat(subFiles);
            } else if (dirent.isFile()) {
                results.push(fullPath);
            }
        }
        return results;
    }


    /**
     * 遞迴取得目錄下所有圖片檔案
     * @param {string} dirPath - 目錄路徑
     * @returns {Promise<string[]>} 圖片檔案路徑陣列
     */
    async getImageFilesInDirectory(dirPath) {
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];
        let results = [];
        const list = await fs.readdir(dirPath, { withFileTypes: true });
        for (const dirent of list) {
            const fullPath = Paths.concat(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                const subFiles = await this.getImageFilesInDirectory(fullPath);
                results = results.concat(subFiles);
            } else if (dirent.isFile()) {
                const ext = Paths.extname(dirent.name)
                if (imageExts.includes(ext)) {
                    results.push(fullPath);
                }
            }
        }
        return results;
    }


    /**
     * 依序將檔案重新命名為 001.ext、002.ext ...（非同步）
     * @param {string[]} files - 檔案完整路徑陣列
     * @returns {Promise<string[]>} - 重新命名後的新檔名陣列
     */
    async renameFilesToSequential(files) {
        const renamedFiles = [];
        const padLen = files.length.toString().length < 2 ? 2 : files.length.toString().length;
        for (let i = 0; i < files.length; i++) {
            const oldPath = files[i];
            const dir = Paths.dirname(oldPath);
            const ext = Paths.extname(oldPath, false);
            const newName = (i + 1).toString().padStart(padLen, '0') + ext;
            const newPath = Paths.concat(dir, newName);
            if (Paths.basename(oldPath) !== newName) {
                await fs.rename(oldPath, newPath);
            }
            renamedFiles.push(newPath);
        }
        return renamedFiles;
    }


    /**
     * 刪除目錄下不屬於陣列的檔案（非同步）
     * @param {string} dir - 目錄路徑
     * @param {string[]} list - 要保留的檔名陣列
     * @returns {Promise<void>}
     */
    async removeFilesNotInList(dir, list) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            if (!list.includes(file)) {
                await fs.rm(Paths.concat(dir, file));
            }
        }
    }

    async removeDirectory(dirPath) {
        return fs.rm(dirPath, { recursive: true, force: true });
    }


    /**
     * 解壓縮檔案並取得圖片清單
     * @param {string} filePath - 壓縮檔路徑
     * @param {boolean} force - 是否強制跳過重複檢查
     * @returns {Promise<object>} - { fileId, images } 或錯誤物件
     */
    async extractToTmp(filePath, force = false) {
        if (!await this.isArchiveFile(filePath)) {
            return { error: '請上傳壓縮檔（zip/rar）', status: 400 };
        }
        if (!force && await this.hashService.checkDuplicate(filePath)) {
            return { error: '檔案重複', status: 409 };
        }
        const fileId = await this.metaService.encodePath(filePath);
        const destDirPath = Paths.concat('TMP_PROCESS', fileId);
        console.log(await this.extract(filePath, destDirPath));
        const imageNames = await this.getImageFilesInDirectory(destDirPath);
        const imageUrls = imageNames.map(name => Paths.relative('TMP_PROCESS', name));
        return {
            fileId: fileId,
            images: imageUrls
        };
    }

    async isArchiveFile(filename) {
        return archiveUtils.isArchiveFile(filename);
    }

    async extract(archivePath, destDir) {
        return archiveUtils.extract(archivePath, destDir);
    }

    async createTar(dirPath, files = []) {
        return archiveUtils.createTar(dirPath, files);
    }

    async convertImagesToWebp(imagePaths, outputDirPath = null) {
        return imageUtils.convertImagesToWebp(imagePaths, outputDirPath);
    }
}

export default FileService;
