import { Directive, HostListener } from '@angular/core';

import { ContentExplorerStore } from '../+state/content-explorer.store';

@Directive({
    selector: '[appContentExplorerDropzone]',
    standalone: true,
})
export class ContentExplorerDropzoneDirective {
    constructor(private readonly store: ContentExplorerStore) { }

    @HostListener('dragenter', ['$event'])
    onDragEnter(event: DragEvent) {
        event.preventDefault();
        this.store.onDragEnter();
    }

    @HostListener('dragover', ['$event'])
    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.store.onDragOver();
    }

    @HostListener('dragleave', ['$event'])
    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.store.onDragLeave();
    }

    @HostListener('drop', ['$event'])
    async onDrop(event: DragEvent) {
        event.preventDefault();
        await this.store.onDrop(event.dataTransfer?.items ?? null);
    }
}