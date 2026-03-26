import { Injectable } from '@angular/core';
import { PreviewPortalViewModel } from './preview-portal.component';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface ComicInteractionData {
    item: PreviewPortalViewModel
    itemType: string;
    event: MouseEvent
}

@Injectable()
export class ComicInteractionService {
    private mouseEnter = new BehaviorSubject<ComicInteractionData | null>(null);
    private mouseLeave = new BehaviorSubject<ComicInteractionData | null>(null);
    private mouseWheel = new BehaviorSubject<WheelEvent | null>(null);

    readonly mouseEnter$ = this.mouseEnter.asObservable();
    readonly mouseLeave$ = this.mouseLeave.asObservable();
    readonly mouseWheel$ = this.mouseWheel.asObservable();

    onMouseEnter(gallery: PreviewPortalViewModel, itemType: string, event: MouseEvent) {
        this.mouseEnter.next({ item: gallery, itemType, event });
    }

    onMouseLeave(gallery: PreviewPortalViewModel, itemType: string, event: MouseEvent) {
        this.mouseLeave.next({ item: gallery, itemType, event });
    }

    onMouseWheel(event: WheelEvent) {
        this.mouseWheel.next(event);
    }
}