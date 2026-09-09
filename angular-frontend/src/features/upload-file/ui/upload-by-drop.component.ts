import { Component, inject, signal } from "@angular/core";

import { DropzoneDirective } from "@/shared/lib/drag-n-drop";
import { UploadService } from "../api/upload";

@Component({
	selector: "feature-upload-by-drop",
	standalone: true,
	imports: [DropzoneDirective],
	templateUrl: "./upload-by-drop.component.html",
	providers: [UploadService],
})
export class UploadByDropComponent {
	readonly uploadService = inject(UploadService);

	readonly isDragging = signal(false);

	onDraggingChange(isDragging: boolean) {
		this.isDragging.set(isDragging);
	}

	async onFilesDropped(items: DataTransferItemList) {
		await this.uploadService.addFilesFromDataTransfer(items);
	}
}
