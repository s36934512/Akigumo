import path from 'path';
import { fileURLToPath } from 'url';

interface ExtOptions {
    filePath: string;
    lowerCase?: boolean;
    dot?: boolean;
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

type PathKeys = keyof typeof Paths

/**
 * Paths 類別，集中管理專案中常用的路徑
 */
export class Paths {
    // --- 靜態屬性 ---
    public static readonly ROOT = ROOT_DIR;

    public static readonly SERVER = path.join(ROOT_DIR, 'server');
    public static readonly CORE = path.join(Paths.SERVER, 'core');
    public static readonly ROUTES = path.join(Paths.SERVER, 'routes');
    public static readonly MODULES = path.join(Paths.SERVER, 'modules');
    public static readonly MODULES_FILE = path.join(Paths.MODULES, 'file');
    public static readonly MODULES_USER = path.join(Paths.MODULES, 'user');

    public static readonly INFRASTRUCTURE = path.join(Paths.SERVER, 'infrastructure');
    public static readonly DATABASE = path.join(Paths.INFRASTRUCTURE, 'database');
    public static readonly NEO4J = path.join(Paths.INFRASTRUCTURE, 'neo4j');

    public static readonly REPOSITORIES = path.join(Paths.SERVER, 'repositories');
    public static readonly SERVICES = path.join(Paths.SERVER, 'services');

    public static readonly UTILS = path.join(Paths.SERVER, 'utils');
    public static readonly UTILS_PY = path.join(Paths.SERVER, 'utils_py');

    public static readonly STORAGE = path.join(ROOT_DIR, 'storage');
    public static readonly TMP = path.join(ROOT_DIR, 'tmp');
    public static readonly TMP_UPLOADS = path.join(Paths.TMP, 'uploads');
    public static readonly TMP_PROCESS = path.join(Paths.TMP, 'process');
    public static readonly TMP_ERRORS = path.join(Paths.TMP, 'errors');
    public static readonly TMP_TUS = path.join(Paths.TMP, 'tus-uploads');

    public static readonly PUBLIC = path.join(ROOT_DIR, 'public');

    /**
         * 私有輔助方法：解析單一片段
         * 如果是 "/KEY" 形式且 KEY 存在於 Paths 中，則轉換為絕對路徑
         */
    private static resolve(arg: string): string {
        if (arg in Paths) {
            const value = (Paths as any)[arg];
            if (typeof value === 'string') return value;
        }
        return arg;
    }
    /**
     * 組合多個路徑片段，支援以 paths 物件屬性名稱作為參數
     * 例如 paths.concat('UTILS', 'A') 等同於 path.join(paths.UTILS, 'A')
     *
     * @param args 路徑片段或 paths 屬性名稱
     * @returns 組合後的路徑
     */
    public static concat(...args: string[]): string {
        const resolved = args.map(arg => this.resolve(arg));
        return path.join(...resolved);
    }

    /**
     * 取得相對路徑，支援以 paths 物件屬性名稱作為參數
     * 回傳以 / 開頭的相對路徑
     *
     * @param args 路徑片段或 paths 屬性名稱
     * @returns 以 / 開頭的相對路徑
     */
    public static relative(...args: string[]): string {
        // 若參數為本類屬性名稱則取屬性值，否則直接使用原值
        const resolved = args.map(arg => this.resolve(arg));
        if (resolved.length === 0) return '';

        const from = resolved.length >= 2 ? resolved[0] : this.ROOT;
        const to = resolved.length >= 2 ? resolved[1] : resolved[0];

        return `/${path.relative(from, to)}`;
    }

    /**
     * 取得檔案副檔名
     *
     * @param filePath 檔案路徑
     * @param LowerCase 是否轉小寫
     * @returns 副檔名（不含 .）
     */
    public static extname({ filePath, lowerCase = true, dot = false }: ExtOptions): string {
        const ext = path.extname(filePath); // path.extname 總是回傳以 . 開頭的字串或空字串

        // 處理點的邏輯
        const finalExt = dot ? ext : ext.slice(1);

        return lowerCase ? finalExt.toLowerCase() : finalExt;
    }

    /**
     * 變更檔案所在目錄，保留原檔名
     *
     * @param filePath 原始檔案路徑
     * @param newDir 新目錄路徑
     * @returns 新目錄下的檔案完整路徑
     */
    public changeDir(filePath: string, newDir: string): string {
        const baseName = path.basename(filePath);
        return path.join(newDir, baseName);
    }

    /**
     * 變更檔案副檔名
     *
     * @param filePath 原始檔案路徑
     * @param newExt 新副檔名（可含 .）
     * @returns 更換副檔名後的完整路徑
     */
    public static changeExt(filePath: string, newExt: string): string {
        const dir = path.dirname(filePath);
        const baseName = this.basename(filePath);
        const extWithDot = newExt.startsWith('.') ? newExt : `.${newExt}`;
        return path.join(dir, baseName + extWithDot);
    }

    /**
     * 取得檔案路徑的上層目錄
     * 可指定上溯層數，預設為 1 層
     *
     * @param filePath 檔案路徑
     * @param level 上溯層數，預設 1
     * @returns 上層目錄路徑
     */
    public static dirname(filePath: string, level: number = 1): string {
        let dir = filePath;
        for (let i = 0; i < level; i++) {
            dir = path.dirname(dir);
        }
        return dir;
    }

    /**
     * 取得檔案名稱
     *
     * @param filePath 檔案路徑
     * @param ext 是否保留副檔名，預設 false
     * @returns 檔案名稱
     */
    public static basename(filePath: string, ext: boolean = false): string {
        return ext ? path.basename(filePath) : path.basename(filePath, path.extname(filePath));
    }
}

export default Paths;
