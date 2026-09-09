import { statfs } from "node:fs/promises";

/**
 * 磁碟空間資訊介面
 */
export interface DiskSpaceInfo {
	free: number; // 剩餘可用空間 (Bytes)
	total: number; // 總空間 (Bytes)
	usagePercent: string; // 使用率 (%)
}

/**
 * 檢查指定路徑是否有足夠空間存放預計大小的檔案
 * @param path 要檢查的目錄路徑 (建議傳入 Docker Volume 掛載點)
 * @param expectedSizeInBytes 預計要寫入的檔案大小 (Byte)
 * @param bufferMB 額外保留的安全緩衝空間 (預設 50MB)
 * @param coefficient 安全係數，考慮到其他進程可能佔用空間 (預設 1.5，表示至少要有 150% 的空間)
 */
export async function hasEnoughSpace(
	path: string,
	expectedSizeInBytes: number,
	bufferMB: number = 50,
	coefficient: number = 1.5,
): Promise<boolean> {
	try {
		const stats = await statfs(path);

		// bsize: 區塊大小
		// bavail: 非 root 用戶可用的剩餘區塊 (比 bfree 更精確)
		const availableBytes =
			stats.bsize * stats.bavail - stats.bsize * stats.bavail * 0.1;
		const availableBytesWithCoefficient = availableBytes / coefficient;
		const bufferBytes = bufferMB * 1024 * 1024;

		return (
			availableBytesWithCoefficient > expectedSizeInBytes + bufferBytes
		);
	} catch (error) {
		// 已將此處重構為模板字面量
		console.error(`[DiskGuard] 無法讀取路徑 ${path} 的磁碟狀態:`, error);
		return false; // 發生錯誤時預設回傳 false 確保安全
	}
}

/**
 * 取得詳細的磁碟狀態報告
 */
export async function getSpaceReport(
	path: string,
): Promise<DiskSpaceInfo | null> {
	try {
		const stats = await statfs(path);
		const free = stats.bsize * stats.bavail;
		const total = stats.bsize * stats.blocks;
		// 註：末尾的 "%" 為單一字串附加，並未涉及變數拼接，因此維持原樣或改用模板字面量均符合規範
		const usagePercent = `${(((total - free) / total) * 100).toFixed(2)}%`;

		return { free, total, usagePercent };
	} catch (error) {
		return null;
	}
}

export const DiskGuard = {
	hasEnoughSpace,
	getSpaceReport,
} as const;
