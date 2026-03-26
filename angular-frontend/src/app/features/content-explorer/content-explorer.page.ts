import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UploadService } from '@core/services/upload.service';
import { LayoutComponent } from '@features/shell/layout';

import { ContentExplorerStore } from './+state';
import { ExplorerListComponent } from './containers/explorer-list';
import { TOOLBAR_CONTROLS } from './containers/toolbar';
import { ContentExplorerDropzoneDirective } from './directives';

@Component({
    selector: 'app-content-explorer-page',
    standalone: true,
    imports: [CommonModule, LayoutComponent, ExplorerListComponent, ContentExplorerDropzoneDirective],
    providers: [
        ContentExplorerStore,
        { provide: TOOLBAR_CONTROLS, useExisting: ContentExplorerStore },
    ],
    template: `
        <app-layout>
            <!-- Stage: Main orchestrator -->
            <div class="h-full flex flex-col overflow-hidden bg-[#f7f9fc] rounded-bl-[24px] rounded-tl-[24px] relative" 
                 appContentExplorerDropzone>
                
                <!-- Gallery Stage: Toolbar sticky at top + Gallery scrollable (internal flex layout) -->
                <main class="flex-1 min-h-0 overflow-hidden flex flex-col bg-white">
                    <app-explorer-list />
                </main>

                <!-- Overlay Layer 1: Dropzone indicator (appears on drag, full coverage) -->
                <div
                    *ngIf="store.isDragging()"
                    class="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-white/75 bg-[rgba(37,99,235,0.9)] pointer-events-none text-center text-white">
                    <h2 class="text-xl font-bold">Drop files to upload</h2>
                    <p class="text-sm opacity-90">Files will be queued automatically.</p>
                </div>

                <!-- Overlay Layer 2: Upload progress (top-right corner) -->
                <div class="fixed right-6 top-[90px] z-50" *ngIf="(uploadService.pendingCount$ | async) as pendingCount">
                    <div class="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-[14px] py-2 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] animate-pulse" 
                         *ngIf="pendingCount > 0">
                        <span class="font-bold">{{ pendingCount }}</span>
                        <span>uploading...</span>
                    </div>
                </div>
            </div>
        </app-layout>
    `
})
export class ContentExplorerPage {
    constructor(
        public readonly uploadService: UploadService,
        public readonly store: ContentExplorerStore,
    ) {
        this.store.initialize();
    }
}
