import { computed, Service, signal } from "@angular/core";
import { Uppy } from "@uppy/core";
import Tus from "@uppy/tus";
import type { GetApiV1ArchiveUploadTask200Item } from "@/shared/api/model";

// 定義全域共享的檔案狀態模型
export interface SharedFileState {
	id: string;
	name: string;
	progress: number;
	status: "uploading" | "paused" | "success" | "error";
}

@Service()
export class UppyStoreService {
	// 1. 持有 Uppy 實體
	readonly uppy: Uppy;

	// 2. 利用 Signal 管理全域上傳列表，供所有獨立元件訂閱
	private filesState = signal<Record<string, SharedFileState>>({});

	// 3. 唯讀的衍生狀態：例如全域是否正在上傳、總進度
	readonly activeUploads = computed(() => Object.values(this.filesState()));
	readonly isUploading = computed(() =>
		this.activeUploads().some((f) => f.status === "uploading"),
	);

	constructor() {
		// 初始化 Uppy
		this.uppy = new Uppy({
			id: "global-uppy",
			autoProceed: false,
		}).use(Tus, {
			endpoint: "/api/v1/tus/files",
			retryDelays: [0, 1000, 3000, 5000],
		});

		this.registerUppyEvents();
	}

	// 4. 監聽 Uppy 事件並同步到 Angular Signal
	private registerUppyEvents() {
		// 當檔案被加入時
		this.uppy.on("file-added", (file) => {
			this.updateSingleFileState(file.id, {
				id: file.id,
				name: file.name,
				progress: 0,
				status: "paused",
			});
		});

		// 當進度更新時
		this.uppy.on("upload-progress", (file, progress) => {
			if (!file || !progress.bytesTotal) return;
			const pct = Math.round(
				(progress.bytesUploaded / progress.bytesTotal) * 100,
			);
			this.updateSingleFileState(file.id, {
				progress: pct,
				status: "uploading",
			});
		});

		// 當特定檔案上傳成功
		this.uppy.on("upload-success", (file) => {
			if (file)
				this.updateSingleFileState(file.id, {
					progress: 100,
					status: "success",
				});
		});

		// 當上傳出錯
		this.uppy.on("upload-error", (file) => {
			if (file) this.updateSingleFileState(file.id, { status: "error" });
		});

		// 當檔案被移除
		this.uppy.on("file-removed", (file) => {
			this.filesState.update((state) => {
				const newState = { ...state };
				delete newState[file.id];
				return newState;
			});
		});
	}

	/**
	 * 外部元件調用：觸發斷點續傳任務
	 */
	resumeTask(task: GetApiV1ArchiveUploadTask200Item, file: File) {
		// 檢查是否重複加入
		const existingFile = Object.values(this.uppy.getFiles()).find(
			(f) => f.name === file.name,
		);
		if (existingFile) return;

		// A. 加入 Uppy 佇列
		const uppyFileId = this.uppy.addFile({
			name: file.name,
			type: file.type,
			data: file,
			meta: { taskId: task.id }, // 綁定後端任務 ID
		});

		// B. ⚠️ 關鍵：強制灌入後端的續傳網址
		this.uppy.setFileState(uppyFileId, {
			tus: { uploadUrl: task.tusUrl },
		});

		// C. 啟動上傳
		this.uppy.upload();
	}

	private updateSingleFileState(id: string, patch: Partial<SharedFileState>) {
		this.filesState.update((state) => ({
			...state,
			[id]: { ...(state[id] || {}), ...patch } as SharedFileState,
		}));
	}
}
