import { Component, ElementRef } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';

import { ImageViewerDataService } from '../../image-viewer.service';
import { ComponentsCommunicationService } from './viewer.communication';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, switchMap, takeUntil, tap } from 'rxjs';

@Component({
    selector: 'app-viewer',
    templateUrl: './viewer.component.html',
    standalone: true,
    imports: [ButtonModule, ToolbarModule, ButtonGroupModule, FormsModule, AsyncPipe, DecimalPipe],
    providers: [ComponentsCommunicationService]
})
export class ViewerComponent {
    constructor(
        private el: ElementRef,
        public imageViewerDataService: ImageViewerDataService,
        public componentsCommunicationService: ComponentsCommunicationService
    ) {
        this.imageViewerDataService.resetSignal$.pipe(takeUntilDestroyed()).subscribe(signal => {
            if (signal === true) {
                this.componentsCommunicationService.setPan(0, 0);
            }
        });

        this._setupDragging();
    }

    private _setupDragging() {
        const mouseDown$ = fromEvent<MouseEvent>(this.el.nativeElement, 'mousedown');
        const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');
        const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');

        mouseDown$.pipe(
            tap(e => {
                e.preventDefault();
                this.componentsCommunicationService.setDragging(true);
                this.componentsCommunicationService.setMouseDownPosition({ x: e.clientX, y: e.clientY });
            }),
            switchMap(() => mouseMove$.pipe(takeUntil(mouseUp$))),
            takeUntilDestroyed()
        ).subscribe(e => {
            this.componentsCommunicationService.setMouseMovePosition({ x: e.clientX, y: e.clientY });
        });

        mouseUp$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.componentsCommunicationService.setDragging(false);
        });
    }

    onImageLoad(event: Event) {
        const img = event.target as HTMLImageElement;

        // 1. 取得原始尺寸
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;

        // 2. 取得實際顯示尺寸
        const renderedW = img.offsetWidth;
        const renderedH = img.offsetHeight;

        // 3. 計算比例
        const scaleX = renderedW / naturalW;
        const scaleY = renderedH / naturalH;

        const scale = Math.min(scaleX, scaleY);
        this.imageViewerDataService.setOriginalZoom(scale);
    }
}
