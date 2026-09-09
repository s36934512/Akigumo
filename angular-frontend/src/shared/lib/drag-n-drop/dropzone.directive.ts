import { Directive, HostListener, output } from '@angular/core';

@Directive({
    selector: '[appDropzone]',
    standalone: true,
})
export class DropzoneDirective {
    private draggingDepth = 0;
    draggingChange = output<boolean>();
    filesDropped = output<DataTransferItemList>();

    @HostListener('dragenter', ['$event'])
    onDragEnter(event: DragEvent) {
        event.preventDefault();
        this.draggingDepth += 1;
        this.setDragging(true);
    }

    @HostListener('dragover', ['$event'])
    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.setDragging(true);
    }

    @HostListener('dragleave', ['$event'])
    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.draggingDepth = Math.max(0, this.draggingDepth - 1);
        if (this.draggingDepth === 0) this.setDragging(false);
    }

    @HostListener('drop', ['$event'])
    async onDrop(event: DragEvent) {
        event.preventDefault();
        this.draggingDepth = 0;
        this.setDragging(false);

        const items = event.dataTransfer?.items;

        if (!items || items.length === 0) return;

        this.filesDropped.emit(items);
    }

    private setDragging(value: boolean) {
        this.draggingChange.emit(value);
    }
}