import { Injectable } from '@angular/core';
import { combineLatest, filter, map, shareReplay } from 'rxjs';

import { PreviewPortalControllerService } from './preview-portal-controller.service';

@Injectable()
export class PreviewPortalViewModelService {
    layout$
    totalPages$;
    title$;
    visible$;
    targetElement$;

    constructor(private controllerService: PreviewPortalControllerService) {
        this.totalPages$ = this.controllerService.gallery$.pipe(
            map(gallery => gallery ? gallery.urls.length : 0)
        );

        this.title$ = this.controllerService.gallery$.pipe(
            map(gallery => gallery ? gallery.title : '')
        );

        const galleryState$ = combineLatest([
            this.controllerService.gallery$,
            this.controllerService.imageIndex$
        ]).pipe(
            filter(
                ([gallery, page]) =>
                    !!(gallery?.urls && gallery.urls.length > 0 && gallery.urls[page])
            ),
            shareReplay(1)
        );

        this.layout$ = galleryState$.pipe(
            filter(
                ([gallery, page]) =>
                    !!(gallery?.urls && gallery.urls.length > 0 && gallery.urls[page])
            ),
            map(([gallery, index]) => {
                const img = gallery!.urls[index];
                const ratio = this.calculateScaleRatio(
                    window.innerWidth - 2,
                    window.innerHeight - 38,
                    img.width,
                    img.height
                );

                return {
                    url: img.url,
                    index,
                    ratio,
                    width: Number((img.width * ratio).toFixed(2)),
                    height: Number((img.height * ratio).toFixed(2))
                };
            })
        );

        this.visible$ = this.controllerService.visible$;
        this.targetElement$ = this.controllerService.targetElement$;
    }

    nextImage() {
        this.controllerService.nextImage();
    }

    previousImage() {
        this.controllerService.previousImage();
    }

    calculateScaleRatio(maxWidth: number, maxHeight: number, imgWidth: number, imgHeight: number): number {
        const widthRatio = maxWidth / imgWidth;
        const heightRatio = maxHeight / imgHeight;
        return Math.min(widthRatio, heightRatio, 1);
    }

    setVisible(visible: boolean) {
        this.controllerService.setVisible(visible);
    }

    setTargetElement(element: HTMLElement | null) {
        this.controllerService.setTargetElement(element);
    }
}