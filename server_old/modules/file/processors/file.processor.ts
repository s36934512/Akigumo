import { fileTypeFromFile } from 'file-type';
import { Upload } from '@tus/server';
import mime from 'mime-types';
import fsExtra from 'fs-extra';

import Paths from '@core/paths';
import { fileCategoryIdMap, fileExtensionIdMap } from '../infrastructure/file-cache.init';
import FileRepository from '../data/repositories/file.repository';

interface FileProcessorDeps {
    fileRepository: FileRepository;
}

export default class FileProcessor {

    constructor(private deps: FileProcessorDeps) { }

    private get fileRepository(): FileRepository { return this.deps.fileRepository; }

    parser(upload: Upload) {
        const metadata = upload.metadata || {};
        const fileName = metadata.filename || metadata.name || upload.id;
        const path = upload.storage?.path || fileName;

        return {
            name: fileName,
            path,
            size: upload.size,
            metadata: metadata
        };
    }

    /**
     * 自動偵測並取得副檔名資訊 (自動學習)
     */
    async getOrRegisterExtension(filePath: string) {
        // 1. 內容偵測
        const result = await fileTypeFromFile(filePath);

        // 2. 降級策略：偵測不到就用檔名去查
        const finalExt = result?.ext || Paths.extname({ filePath }) || 'bin';
        const finalMime = result?.mime || mime.lookup(filePath) || 'application/octet-stream';

        // 3. 檢查快取 (Map)
        let extensionId = fileExtensionIdMap.get(finalExt);
        if (extensionId) return { extensionId, mimeType: finalMime };

        // 4. 快取找不到，嘗試去資料庫找（防止多個 Worker 同時跑，Map 還沒更新）
        const existingExt = await this.fileRepository.findExtensionByCode(finalExt);

        if (existingExt) {
            fileExtensionIdMap.set(finalExt, existingExt.id);
            return { extensionId: existingExt.id, mimeType: finalMime };
        }

        // 5. 資料庫也沒有，執行自動註冊 (Auto-register)
        const mimePrefix = finalMime.split('/')[0].toUpperCase();
        const categoryId = fileCategoryIdMap.get(mimePrefix) ?? fileCategoryIdMap.get('OTHER');

        if (!categoryId) {
            throw new Error('系統錯誤：找不到檔案分類定義，請確認 Seed 資料是否完整。');
        }

        const newExt = await this.fileRepository.createExtension({
            code: finalExt,
            mimeType: finalMime,
            categoryId: categoryId
        });

        // 6. 更新快取並回傳
        fileExtensionIdMap.set(finalExt, newExt.id);
        console.log(`[System] Auto-registered new extension: .${finalExt}`);

        return { extensionId: newExt.id, mimeType: finalMime };
    }

    async processingFile(data: Upload) {
        const batchId = data.metadata?.batchid || '';
        const { name, path, size, metadata } = this.parser(data);

        const processingPath = Paths.concat('TMP_PROCESS', data.id, name);
        await fsExtra.move(path, processingPath, { overwrite: true });

        const { extensionId, mimeType } = await this.getOrRegisterExtension(processingPath);

        const systemName = Paths.changeExt(data.id, Paths.extname({ filePath: name, dot: true }));
        const fileDestDir = Paths.concat('STORAGE', 'originals', batchId);
        const fileDestPath = Paths.concat(fileDestDir, systemName);
        await fsExtra.move(processingPath, fileDestPath, { overwrite: true });

        const jsonFilePath = Paths.changeExt(path, '.json');
        const jsonFile = Paths.basename(jsonFilePath, true);
        await fsExtra.move(jsonFilePath, Paths.concat('STORAGE', 'tus-record', jsonFile), { overwrite: true });

        return {
            originalName: name,
            systemName,
            physicalPath: fileDestPath,
            size,
            metadata: { ...metadata, mimeType, batchId },
            extensionId,
        }
    }
}