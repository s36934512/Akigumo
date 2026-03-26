import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TemplateRef, ViewContainerRef } from '@angular/core';

const POSITIONS: ConnectedPosition[] = [
    {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center',
    },
    {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center',
    }
];

export class OverlayHelper {
    overlayRef: OverlayRef | null = null;
    portal: TemplatePortal<any> | null = null;

    constructor(
        private overlay: Overlay,
        private vcr: ViewContainerRef,
        private previewTemplate: TemplateRef<any>
    ) { }


    set(targetElement: HTMLElement) {
        this.close();

        const positionStrategy = this.overlay.position()
            .flexibleConnectedTo(targetElement)
            .withPositions(POSITIONS)
            .withPush(true);

        this.overlayRef = this.overlay.create({
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            hasBackdrop: false,
        });

        this.portal = new TemplatePortal(this.previewTemplate, this.vcr);
    }

    open() {
        if (this.overlayRef && this.portal && !this.overlayRef.hasAttached()) {
            this.overlayRef.attach(this.portal);
        }
    }

    close() {
        if (this.overlayRef) {
            this.overlayRef.detach();
        }
        this.vcr.clear();
        this.portal = null;
    }
}