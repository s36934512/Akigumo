import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, input, TemplateRef, ViewChild, ViewContainerRef, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

import { PreviewPortalViewModelService } from './preview-portal-viewmodel.service';
import { PreviewInfoComponent } from './components/preview-info/preview-info.component';
import { ComicInteractionService } from './comic-interaction.service';
import { ImageWithSizeViewModel } from '@models/image.types';
import { OverlayHelper } from './utility/overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, tap } from 'rxjs';


export interface PreviewPortalViewModel {
    title: string;
    urls: ImageWithSizeViewModel[];
}

@Component({
    selector: 'app-preview-portal',
    templateUrl: './preview-portal.component.html',
    standalone: true,
    imports: [CommonModule, PreviewInfoComponent, NgOptimizedImage],
    providers: [PreviewPortalViewModelService]
})
export class PreviewPortalComponent implements AfterViewInit {
    @ViewChild('previewTemplate') previewTemplate?: TemplateRef<any>;
    overlayHelper?: OverlayHelper;

    constructor(
        public viewModelService: PreviewPortalViewModelService,
        public controllerService: ComicInteractionService,
        private overlay: Overlay,
        private vcr: ViewContainerRef,
    ) {
        this.viewModelService.targetElement$.pipe(takeUntilDestroyed()).subscribe(target => {
            if (target) {
                this.overlayHelper?.set(target);
            }
        });

        this.viewModelService.visible$.pipe(takeUntilDestroyed()).
            subscribe(visible => {
                if (visible) {
                    this.overlayHelper?.open();
                } else {
                    this.overlayHelper?.close();
                }
            });
    }

    ngAfterViewInit() {
        if (this.previewTemplate) {
            this.overlayHelper = new OverlayHelper(this.overlay, this.vcr, this.previewTemplate);
        }
    }

    onMouseEnter(event: MouseEvent) {
        // if (!this.viewModelService.current) return;
        // this.controllerService.onMouseEnter(this.viewModelService.current, 'preview-portal', event);
    }

    onMouseLeave(event: MouseEvent) {
        this.viewModelService.setVisible(false);
    }

    onMouseWheel(event: WheelEvent) {
        if (event.deltaY > 0) {
            this.viewModelService.nextImage();
        } else {
            this.viewModelService.previousImage();
        }
    }
}
