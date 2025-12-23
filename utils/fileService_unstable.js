const fs = require('fs').promises;
const path = require('path');

const fileService = {
    async readFile(filePath, options = 'utf8') {
        return fs.readFile(filePath, options);
    },
    async writeFile(filePath, data, options = 'utf8') {
        return fs.writeFile(filePath, data, options);
    },
    async deleteFile(filePath) {
        return fs.unlink(filePath);
    },
    async moveFile(src, dest) {
        await fs.rename(src, dest);
    },
    async copyFile(src, dest) {
        await fs.copyFile(src, dest);
    },
    async makeDir(dirPath, options = { recursive: true }) {
        await fs.mkdir(dirPath, options);
    },
    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    },
    async stat(filePath) {
        return fs.stat(filePath);
    },
    async flattenDirectoryInPlace(dirPath) {
        const list = await fs.readdir(dirPath, { withFileTypes: true });
        for (const dirent of list) {
            const fullPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                await fileService.flattenDirectoryInPlace(fullPath);
                const subList = await fs.readdir(fullPath, { withFileTypes: true });
                for (const subDirent of subList) {
                    if (subDirent.isFile()) {
                        const src = path.join(fullPath, subDirent.name);
                        let dest = path.join(dirPath, subDirent.name);
                        let count = 1;
                        const ext = path.extname(subDirent.name);
                        const base = path.basename(subDirent.name, ext);
                        while (await fileService.exists(dest)) {
                            dest = path.join(dirPath, `${base}(${count})${ext}`);
                            count++;
                        }
                        await fs.rename(src, dest);
                    }
                }
                await fs.rmdir(fullPath);
            }
        }
    },
    async flattenDirectory(dirPath) {
        let results = [];
        const list = await fs.readdir(dirPath, { withFileTypes: true });
        for (const dirent of list) {
            const fullPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                const subFiles = await fileService.flattenDirectory(fullPath);
                results = results.concat(subFiles);
            } else if (dirent.isFile()) {
                results.push(fullPath);
            }
        }
        return results;
    },
    async getImageFilesInDirectory(dirPath) {
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];
        let results = [];
        const list = await fs.readdir(dirPath, { withFileTypes: true });
        for (const dirent of list) {
            const fullPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                const subFiles = await fileService.getImageFilesInDirectory(fullPath);
                results = results.concat(subFiles);
            } else if (dirent.isFile()) {
                const ext = path.extname(dirent.name).toLowerCase();
                if (imageExts.includes(ext)) {
                    results.push(fullPath);
                }
            }
        }
        return results;
    },


    /**
     * 依序將檔案重新命名為 001.ext、002.ext ...
     * @param {string[]} files - 檔案完整路徑陣列
     * @returns {string[]} - 重新命名後的新檔名陣列
     */
    renameFilesToSequential(files) {
        const renamedFiles = [];
        const padLen = files.length.toString().length < 2 ? 2 : files.length.toString().length;
        for (let i = 0; i < files.length; i++) {
            const oldPath = files[i];
            const dir = path.dirname(oldPath);
            const ext = path.extname(oldPath);
            const newName = (i + 1).toString().padStart(padLen, '0') + ext;
            const newPath = path.join(dir, newName);
            if (path.basename(oldPath) !== newName) {
                fs.renameSync(oldPath, newPath);
            }
            renamedFiles.push(newPath);
        }
        return renamedFiles;
    },

    /**
     * 刪除目錄下不屬於陣列的檔案
     * @param {string} dir - 目錄路徑
     * @param {string[]} list - 要保留的檔名陣列
     */
    removeFilesNotInList(dir, list) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (!list.includes(file)) {
                fs.rmSync(path.join(dir, file));
            }
        }
    }
};

module.exports = fileService;
