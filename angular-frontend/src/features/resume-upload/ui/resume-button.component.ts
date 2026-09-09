import {
	Component,
	type ElementRef,
	inject,
	input,
	viewChild,
} from "@angular/core";

import type { GetApiV1ArchiveUploadTask200Item } from "@/shared/api/model";

import { TusResumeService } from "../api/tus-resume.service";

@Component({
	selector: "feature-resume-button",
	standalone: true,

	templateUrl: "./resume-button.component.html",
})
export class ResumeButtonComponent {
	private tusResumeService = inject(TusResumeService);

	task = input.required<GetApiV1ArchiveUploadTask200Item>();
	fileInput = viewChild.required<ElementRef<HTMLInputElement>>("fileInput");

	triggerFileInput() {
		// 提示使用者選擇對應的檔案以繼續
		alert(`請選取原檔案 [${this.task().fileName}] 以維持斷點續傳`);
		this.fileInput().nativeElement.click();
	}

	onFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;

		const file = input.files[0];

		// 呼叫續傳服務
		this.tusResumeService.resumeTask(
			this.task(),
			file,
			(currentProgress) => {
				// 這裡可以動態更新 Entity 的狀態，讓全域畫面跟著變動
				this.task().progress = currentProgress;
				this.task().status = "uploading";
			},
		);
	}
}
