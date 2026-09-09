import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 根據你的目錄結構，從 server/core 往上兩層是 ROOT
export const ROOT = path.resolve(__dirname, "../../");

// --- 核心根目錄 ---
export const SERVER = path.join(ROOT, "server");
export const STORAGE = path.join(ROOT, "storage");
export const TMP = path.join(ROOT, "tmp");

// --- 臨時檔案路徑 ---
export const TMP_UPLOADS = path.join(TMP, "uploads");
export const TMP_PROCESS = path.join(TMP, "process");
export const TMP_ERRORS = path.join(TMP, "errors");
export const TMP_TUS = path.join(TMP, "tus-uploads");

// --- 永久儲存路徑 ---
export const STORAGE_ORIGINALS = path.join(STORAGE, "originals");
export const STORAGE_THUMBNAILS = path.join(STORAGE, "thumbnails");
export const STORAGE_RECORD = path.join(STORAGE, "tus-record");

const pathConstants = {
	ROOT,
	SERVER,
	STORAGE,
	TMP,
	TMP_UPLOADS,
	TMP_PROCESS,
	TMP_ERRORS,
	TMP_TUS,
	STORAGE_ORIGINALS,
	STORAGE_THUMBNAILS,
	STORAGE_RECORD,
} as const;

export namespace Paths {
	export type PathKeys = keyof typeof pathConstants;
}

/**
 * 內部動態解析：如果是定義好的導出 Key 則回傳路徑，否則回傳原字串
 */
function resolveArg(arg: Paths.PathKeys | string): string {
	if (arg in pathConstants) {
		return pathConstants[arg as Paths.PathKeys];
	}
	return arg;
}

/**
 * 安全地組合路徑片段
 * 範例：Paths.concat('TMP', 'uploads', 'temp.jpg')
 */
export function concat(...args: (Paths.PathKeys | (string & {}))[]): string {
	const resolved = args.map((arg) => resolveArg(arg));
	return path.join(...resolved);
}

/**
 * 取得相對於指定目錄（預設為 ROOT）的相對路徑，並確保以 / 開頭
 */
export function relative(to: string, from: string = ROOT): string {
	const rel = path.relative(from, to);
	return rel.startsWith(".") ? rel : `/${rel}`;
}

/**
 * 取得純檔名或含副檔名的名稱
 */
export function basename(filePath: string, withExt: boolean = true): string {
	return withExt
		? path.basename(filePath)
		: path.basename(filePath, path.extname(filePath));
}

/**
 * 取得副檔名（統一小寫且不含點）
 */
export function ext(filePath: string): string {
	return path.extname(filePath).slice(1).toLowerCase();
}

/**
 * 清理字串，使其適合作為檔名（移除非法字元，防止路徑穿越）
 */
export function sanitize(name: string): string {
	return name.replace(/[<>:"/\\|?*\0\n\r\t]/g, "_");
}

/**
 * 【換名但不換副檔名】
 * 變更路徑中的檔名，自動保留原始副檔名
 */
export function renameFilename(filePath: string, newBaseName: string): string {
	const dir = path.dirname(filePath);
	const extname = path.extname(filePath);
	const safeName = sanitize(newBaseName);
	return path.join(dir, `${safeName}${extname}`);
}

/**
 * 【換副檔名但不換名稱】
 * 常用於轉檔後的路徑計算
 */
export function changeExt(filePath: string, newExt: string): string {
	const dir = path.dirname(filePath);
	const nameWithoutExt = basename(filePath, false);
	const formattedExt = newExt.startsWith(".") ? newExt : `.${newExt}`;
	return path.join(dir, `${nameWithoutExt}${formattedExt}`);
}
