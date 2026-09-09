import { Service, signal } from "@angular/core";
import { Tus, Uppy } from "uppy";

import type {
	UppyFileMeta,
	UppyFileResponse,
} from "@/features/upload-file/models/schema";

import type { GetApiV1ArchiveUploadTask200Item } from "@/shared/api/model";

@Service()
export class TusResumeService {
	private _uppy: Uppy<UppyFileMeta, UppyFileResponse> | null = null;

	private readonly authToken = signal<string>(
		"019c1d69-84c4-7349-94e4-7086aa735867",
	);

	constructor() {
		this.initializeUppy();
	}

	private initializeUppy() {
		if (!this._uppy) {
			this._uppy = new Uppy<UppyFileMeta, UppyFileResponse>({
				restrictions: { maxFileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
				autoProceed: false,
			}).use(Tus, {
				endpoint: "/api/v1/tus/files",
				chunkSize: 5 * 1024 * 1024, // 5MB
				retryDelays: [0, 1000, 3000, 5000],
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

	resumeTask(
		task: GetApiV1ArchiveUploadTask200Item,
		file: File,
		onProgressCallback: (progress: number) => void,
	) {
		if (!this._uppy) return;

		// 1. 將使用者重新選取的檔案加入 Uppy，並取得 Uppy 產生的 fileId
		const uppyFileId = this._uppy.addFile({
			name: file.name,
			type: file.type,
			data: file,
		});

		// 2. 核心黑魔法：強制將後端的 tusUploadUrl 覆寫進 Uppy 的檔案狀態中
		this._uppy.setFileState(uppyFileId, {
			tus: {
				uploadUrl: task.tusUrl, // 讓 Uppy/Tus 知道這不是新上傳，是續傳
			},
		});

		// 3. 監聽該檔案的進度更新
		this._uppy.on("upload-progress", (uppyFile, progress) => {
			if (
				uppyFile?.id === uppyFileId &&
				progress.bytesTotal &&
				progress.bytesTotal > 0
			) {
				const percentage = Math.round(
					(progress.bytesUploaded / progress.bytesTotal) * 100,
				);
				onProgressCallback(percentage);
			}
		});

		// 4. 監聽完成事件
		this._uppy.on("upload-success", (uppyFile) => {
			if (this._uppy && uppyFile?.id === uppyFileId) {
				onProgressCallback(100);
				this._uppy.removeFile(uppyFileId); // 清理
			}
		});

		// 5. 啟動 Uppy 上傳 (Tus 內部會自動發送 HEAD 請求確認斷點)
		this._uppy.upload();
	}
}
