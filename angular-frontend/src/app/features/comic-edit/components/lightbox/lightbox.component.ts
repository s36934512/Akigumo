import { Component, HostListener, model, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LightboxModule, Lightbox } from '@jjmhalew/ngx-lightbox';
import { ComicEditDataService } from '../../comic-edit-data.service';
import { UploadService } from '@core/services/upload.service';
import { map } from 'rxjs/operators';
import { GalleriaModule } from 'primeng/galleria';

@Component({
    selector: 'app-lightbox',
    templateUrl: './lightbox.component.html',
    styleUrls: ['./lightbox.component.scss'],
    imports: [AsyncPipe, GalleriaModule],
})
export class LightboxComponent {
    images!: import('rxjs').Observable<{ itemImageSrc: string; thumbnailImageSrc: string; }[]>;
    zoomLevel = signal<number>(1);
    constructor(public comicEditData: ComicEditDataService, public uploadService: UploadService) {
        this.comicEditData.focusedPage$.subscribe(focusedPage => {
            if (focusedPage) {
                this.images = this.comicEditData.selectedFile$.pipe(
                    map(file => file?.pages?.map((page: { url: string; thumbnail: string }) => ({
                        itemImageSrc: page.url,
                        thumbnailImageSrc: page.thumbnail
                    })) ?? [])
                );
            }
        });
    }

    setCover() {
        const file = this.comicEditData.selectedFileValue;
        const page = this.comicEditData.focusedPageValue;
        if (!file || !file.pages || !page) return;

        this.uploadService.updateFile({
            ...file,
            previewUrl: page.thumbnail
        });
    }

    close() {
        // this.focusedPageIndex.set(null);
    }

    // 上下頁邏輯
    prevPage() {
        // const current = this.focusedPageIndex();
        // if (current !== null && current > 0) {
        //     this.focusedPageIndex.set(current - 1);
        //     this.resetZoom();
        // }
    }

    nextPage() {
        // const current = this.focusedPageIndex();
        // if (current !== null && current < this.pages().length - 1) {
        //     this.focusedPageIndex.set(current + 1);
        //     this.resetZoom();
        // }
    }

    // 縮放邏輯
    zoomIn() {
        this.zoomLevel.update(z => Math.min(z + 0.2, 3)); // 最高 3 倍
    }

    zoomOut() {
        this.zoomLevel.update(z => Math.max(z - 0.2, 0.5)); // 最低 0.5 倍
    }

    resetZoom() {
        this.zoomLevel.set(1);
    }

    // 滾輪縮放支援
    onWheel(event: WheelEvent) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.deltaY < 0) this.zoomIn();
            else this.zoomOut();
        }
    }

    // 鍵盤監聽
    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        // if (this.focusedPageIndex() === null) return;

        if (event.key === 'ArrowLeft') this.prevPage();
        if (event.key === 'ArrowRight') this.nextPage();
        if (event.key === 'Escape') this.close();
    }
}
