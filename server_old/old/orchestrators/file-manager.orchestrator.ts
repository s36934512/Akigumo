import Paths from '@core/paths';
import FileQueryService from '../domain/services/file-query.service';
import { file } from 'zod';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export class FileManagerOrchestrator {
    public static async getMediaLibrary(itemId: string) {
        // 1. 從 Repository 撈取原始數據
        console.log(`[FileManagerOrchestrator] Fetching files for itemId: ${itemId}`);
        // const files = await FileQueryService.getFilesByItem(itemId);

        // 2. 業務邏輯處理 (例如：拼接完整的網址路徑)
        // 這裡可以決定要回傳原始檔還是 Processor 處理過的縮圖路徑

        // return (files ?? [])
        //     .filter((file): file is NonNullable<typeof file> => file !== undefined && file !== null)
        //     .map(file => ({
        //         id: file.id,
        //         name: file.originalName,
        //         url: this.parseFilePath(file.physicalPath),
        //         size: file.size
        //     }));
    }

    private static parseFilePath(physicalPath: string | null): string | null {
        if (!physicalPath) return null;

        const storagePath = Paths.concat('STORAGE', 'originals');
        const filePath = Paths.relative(storagePath, physicalPath);
        return Paths.concat('http://localhost:3000/', 'STORAGE', filePath);
    }
}