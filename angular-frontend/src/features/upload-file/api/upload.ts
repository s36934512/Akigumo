import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { Tus, Uppy } from "uppy";
import { v7 as uuidv7 } from "uuid";
import z from "zod";

import {
	type FileIdAssigned,
	type ScannedFile,
	ScannedFileSchema,
} from "@/entities/archive";
import { environment } from "@/environments/environment";
import { DefaultService } from "@/shared/api/default/default.service";
import { createFlexibleSchema } from "@/shared/lib/schema";
import { SseBrokerService } from "@/shared/services/sse-broker.service";

import type { UppyFileMeta, UppyFileResponse } from "../models/schema";

const PatchPayloadSchema = createFlexibleSchema(
	z.object({
		fileId: z.uuid(),
		tempScanId: z.string(),
		batchId: z.uuid(),
	}),
);

@Injectable()
export class UploadService {
	private readonly defaultService = inject(DefaultService);
	private readonly sseBrokerService = inject(SseBrokerService);
	private readonly destroyRef = inject(DestroyRef);

	private _uppy: Uppy<UppyFileMeta, UppyFileResponse> | null = null;
	private fileScanMap = new Map<string, File>();
	private readonly authToken = signal<string>(
		"019c1d69-84c4-7349-94e4-7086aa735867",
	);

	readonly notifyId = uuidv7();

	constructor() {
		const url = `${environment.apiUrl}/api/v1/stream`;
		this.initUppy();
		this.setupUppyListeners();

		const unregister = this.sseBrokerService.registerHandler(
			url,
			"FILE_ID_ASSIGNED",
			(payload) => {
				const newPatches = Array.isArray(payload) ? payload : [payload];
				const result = PatchPayloadSchema.array.safeParse(newPatches);

				if (!result.success) return;

				console.log("[UploadService] 接收到 ID 分配:", result.data);
				result.data.forEach((item) => {
					this.startUppyUpload(item); // 啟動 Uppy 上傳流程 [cite: 118-120]
				});
			},
		);

		this.destroyRef.onDestroy(() => {
			unregister();
			this.disconnect();
		});

		this.sseBrokerService.listen(url);
	}

	/**
	 * 初始化 Uppy 實例
	 * @returns Uppy 實例 (明確標註類型)
	 */
	initUppy() {
		if (!this._uppy) {
			this._uppy = new Uppy<UppyFileMeta, UppyFileResponse>({
				restrictions: { maxFileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
				autoProceed: true,
			}).use(Tus, {
				endpoint: "/api/v1/tus/files",
				uploadDataDuringCreation: true,
				chunkSize: 5 * 1024 * 1024, // 5MB
				retryDelays: [0, 1000, 3000, 5000],
				removeFingerprintOnSuccess: true, // 上傳成功後自動清除快取
				headers: {
					// 未來直接讀取 Signal 值，此處保持唯讀快照或透過方法動態更新
					authorization: this.authToken(),
				},
			});
		}

		if (!this._uppy) {
			throw new Error("Uppy 實例初始化失敗");
		}
	}

	private setupUppyListeners() {
		if (!this._uppy) return;

		this._uppy.on("upload-success", async (file) => {
			console.log("[upload service] Upload success:", file);
			if (!file) return;

			const {
				fileId,
				batchId,
				checksum = "d3c617d9527eb9c0c6297e60319aef64c022059a47dfbfdef92ab45464720016",
			} = file.meta;

			const fileName =
				file?.data instanceof File ? file.data.name : "unknown";

			// 當單一檔案 Tus 上傳完成，立即送出 seal
			try {
				this.defaultService.postApiV1ArchiveTusSeal({
					notifyId: this.notifyId,
					batchId,
					fileId,
					checksum,
					// TODO: 上面這個 checksum 之後要改成真正的檔案 checksum。Uppy 的 Tus plugin 並沒有內建計算 checksum 的功能，所以可能需要額外實作一個功能來計算檔案的 checksum，或者在上傳前就由前端計算好並放在 meta 裡面。
					// Why: file.data may be undefined or not have a 'name' property, so we need a type guard
					fileName,
				});

				console.log(`[upload service] 檔案 ${fileId} 已密封`);
				// 可選：在此更新該檔案在隊列中的後續密封狀態
				// this.updateFile({ id: file.id, status: 'sealed' });
			} catch (err) {
				console.error(
					`[upload service] 檔案 ${fileId} Seal 失敗:`,
					err,
				);
				// 可選：通知 UI 此檔案後續處理失敗
				// this.updateFile({ id: file.id, status: 'seal_error' });
			}
		});
	}
	// --- 核心流程：掃描 -> Intent -> SSE -> Upload ---

	async addFilesFromDataTransfer(items: DataTransferItemList) {
		if (!this._uppy) return;

		const batchId = uuidv7();

		const scannedFiles: ScannedFile["array"] = [];

		const entries = Array.from(items)
			.map((item) => item.webkitGetAsEntry())
			.filter((entry): entry is FileSystemEntry => entry !== null);

		await this.traverseFileTree(entries, (file, entry) => {
			const tempScanId = uuidv7();
			this.fileScanMap.set(tempScanId, file); // 暫存在記憶體
			scannedFiles.push(
				ScannedFileSchema.single.parse({
					name: file.name,
					size: file.size,
					metadata: {
						tempScanId,
						path: entry.fullPath.replace(/^\//, ""),
						batchId,
					},
				}),
			);
		});

		const payload = {
			notifyId: this.notifyId,
			batchId,
			fileList: scannedFiles,
		};

		console.log("[upload service] 掃描完成，送出 Intent:", payload);
		try {
			await this.defaultService.postApiV1ArchiveTusIntent(payload);
			console.log(
				"[upload service] Intent 已送出，等待 SSE 分配 fileId...",
			);
		} catch (err) {
			console.error("[upload service] 送出 Intent 失敗:", err);
		}
	}

	/**
	 * 當 SSE 收到 fileId 後，由該方法正式啟動 Uppy 上傳
	 */
	private startUppyUpload(fileIdAssigned: FileIdAssigned["single"]) {
		const { tempScanId, fileId, batchId } = fileIdAssigned;
		console.log("fileIdAssigned", fileIdAssigned);

		const file = this.fileScanMap.get(tempScanId);
		console.log("file", file);
		if (!file || !this._uppy) return;

		this._uppy.addFile({
			source: "drag-n-drop",
			name: file.name,
			type: file.type,
			data: file,
			meta: {
				batchId,
				fileId, // 這邊帶入後端給的正式 ID
			},
		});

		this.fileScanMap.delete(tempScanId);
	}

	/**
	 * Accepts a FileList from a <input webkitdirectory> element and queues all
	 * files for upload, preserving the relative folder path via webkitRelativePath.
	 */
	async addFilesFromFolderInput(fileList: FileList) {
		if (!this._uppy || fileList.length === 0) return;
		const batchId = uuidv7();

		const scannedFiles: ScannedFile["array"] = [];

		for (let i = 0; i < fileList.length; i++) {
			const file = fileList[i];
			const tempScanId = uuidv7();
			this.fileScanMap.set(tempScanId, file);
			scannedFiles.push(
				ScannedFileSchema.single.parse({
					name: file.name,
					size: file.size,
					metadata: {
						tempScanId,
						// webkitRelativePath includes the top-level folder name, e.g. "myFolder/sub/file.jpg"
						path: file.webkitRelativePath || file.name,
						batchId,
					},
				}),
			);
		}

		const payload = {
			notifyId: this.notifyId,
			batchId: batchId,
			fileList: scannedFiles,
		};
		try {
			await this.defaultService.postApiV1ArchiveTusIntent(payload);
		} catch (err) {
			console.error("[upload service] 送出 Intent 失敗:", err);
		}
	}

	// --- 輔助方法：遞迴掃描 ---
	private async traverseFileTree(
		entries: FileSystemEntry[],
		onFile: (file: File, entry: FileSystemFileEntry) => void,
	) {
		for (const entry of entries) {
			if (entry.isFile) {
				const file = await this.getFileFromEntry(
					entry as FileSystemFileEntry,
				);
				onFile(file, entry as FileSystemFileEntry);
			} else if (entry.isDirectory) {
				const dirEntries = await this.readAllDirectoryEntries(
					entry as FileSystemDirectoryEntry,
				);
				await this.traverseFileTree(dirEntries, onFile);
			}
		}
	}
	private getFileFromEntry(fileEntry: FileSystemFileEntry): Promise<File> {
		return new Promise((resolve, reject) =>
			fileEntry.file(resolve, reject),
		);
	}
	private async readAllDirectoryEntries(
		dirEntry: FileSystemDirectoryEntry,
	): Promise<FileSystemEntry[]> {
		const reader = dirEntry.createReader();
		let results: FileSystemEntry[] = [];
		const read = async (): Promise<FileSystemEntry[]> => {
			return new Promise((resolve, reject) =>
				reader.readEntries(resolve, reject),
			);
		};

		let entries = await read();
		while (entries.length > 0) {
			results = results.concat(entries);
			entries = await read();
		}
		return results;
	}

	disconnect() {
		if (this._uppy) this._uppy.cancelAll();
		this.fileScanMap.clear();
	}
}
