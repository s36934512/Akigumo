import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ToolbarStateService {
    private isExpanded = new BehaviorSubject<boolean>(false);
    readonly isExpanded$ = this.isExpanded.asObservable();

    togglePanel() {
        this.isExpanded.next(!this.isExpanded.value);
    }
}