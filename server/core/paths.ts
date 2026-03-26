import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 根據你的目錄結構，從 server/core 往上兩層是 ROOT
const ROOT_DIR = path.resolve(__dirname, '../../');

/**
 * 集中管理專案核心路徑，支援型別安全的路徑組合與轉換
 */
export class Paths {
    // --- 核心根目錄 ---
    public static readonly ROOT = ROOT_DIR;
    public static readonly SERVER = path.join(ROOT_DIR, 'server');
    public static readonly STORAGE = path.join(ROOT_DIR, 'storage');
    public static readonly TMP = path.join(ROOT_DIR, 'tmp');

    // --- 內部架構路徑 ---
    public static readonly CORE = path.join(Paths.SERVER, 'core');
    public static readonly MODULES = path.join(Paths.SERVER, 'modules');

    // --- 具體模組 (對應你的目錄結構) ---
    public static readonly MODULE_USER = path.join(Paths.MODULES, 'user');
    public static readonly MODULE_FILE = path.join(Paths.MODULES, 'file');
    public static readonly MODULE_ENTITY = path.join(Paths.MODULES, 'entity');
    public static readonly MODULE_ITEM = path.join(Paths.MODULES, 'item');

    // --- 臨時檔案路徑 ---
    public static readonly TMP_UPLOADS = path.join(Paths.TMP, 'uploads');
    public static readonly TMP_PROCESS = path.join(Paths.TMP, 'process');
    public static readonly TMP_ERRORS = path.join(Paths.TMP, 'errors');
    public static readonly TMP_TUS = path.join(Paths.TMP, 'tus-uploads');

    // --- 永久儲存路徑 ---
    public static readonly STORAGE_ORIGINALS = path.join(Paths.STORAGE, 'originals');
    public static readonly STORAGE_THUMBNAILS = path.join(Paths.STORAGE, 'thumbnails');
    public static readonly STORAGE_RECORD = path.join(Paths.STORAGE, 'tus-record');

    /**
     * 解析輸入參數：如果是 Paths 的 key 則回傳路徑，否則回傳原字串
     */
    private static resolve(arg: string): string {
        return (Paths as any)[arg] || arg;
    }

    /**
     * 安全地組合路徑片段
     * 範例：Paths.concat('TMP', 'uploads', 'temp.jpg')
     */
    public static concat(...args: (keyof typeof Paths | string)[]): string {
        const resolved = args.map(arg => this.resolve(arg as string));
        return path.join(...resolved);
    }

    /**
     * 取得相對於指定目錄（預設為 ROOT）的相對路徑，並確保以 / 開頭
     * 適合存入資料庫，確保跨環境一致性
     */
    public static relative(to: string, from: string = ROOT_DIR): string {
        const rel = path.relative(from, to);
        return rel.startsWith('.') ? rel : `/${rel}`;
    }

    /**
     * 取得純檔名或含副檔名的名稱
     */
    public static basename(filePath: string, withExt: boolean = true): string {
        return withExt
            ? path.basename(filePath)
            : path.basename(filePath, path.extname(filePath));
    }

    /**
     * 取得副檔名（統一小寫且不含點）
     */
    public static ext(filePath: string): string {
        return path.extname(filePath).slice(1).toLowerCase();
    }

    /**
     * 清理字串，使其適合作為檔名（移除非法字元，防止路徑穿越）
     */
    public static sanitize(name: string): string {
        return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    }

    /**
     * 【換名但不換副檔名】
     * 變更路徑中的檔名，自動保留原始副檔名
     * 範例：Paths.renameFilename('/tmp/img.jpg', 'avatar') -> '/tmp/avatar.jpg'
     */
    public static renameFilename(filePath: string, newBaseName: string): string {
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath); // 取得如 '.jpg'
        const safeName = this.sanitize(newBaseName);
        return path.join(dir, `${safeName}${ext}`);
    }

    /**
     * 【換副檔名但不換名稱】
     * 常用於轉檔後的路徑計算
     * 範例：Paths.changeExt('/tmp/img.jpg', 'webp') -> '/tmp/img.webp'
     */
    public static changeExt(filePath: string, newExt: string): string {
        const dir = path.dirname(filePath);
        const nameWithoutExt = this.basename(filePath, false);
        const formattedExt = newExt.startsWith('.') ? newExt : `.${newExt}`;
        return path.join(dir, `${nameWithoutExt}${formattedExt}`);
    }
}

export type PathKeys = keyof typeof Paths;
export default Paths;