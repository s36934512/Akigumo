import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ComponentsCommunicationService {
    private _isDragging$ = new BehaviorSubject<boolean>(false);
    private _dragStart$ = new BehaviorSubject<{ x: number; y: number }>({ x: 0, y: 0 });
    private _dragOrigin$ = new BehaviorSubject<{ x: number; y: number }>({ x: 0, y: 0 });
    private _pan$ = new BehaviorSubject<{ x: number; y: number }>({ x: 0, y: 0 });

    readonly isDragging$ = this._isDragging$.asObservable();
    readonly pan$ = this._pan$.asObservable();

    get isDragging(): boolean {
        return this._isDragging$.value;
    }

    setDragging(isDragging: boolean) {
        this._isDragging$.next(isDragging);
    }

    setPan(x: number, y: number) {
        this._dragOrigin$.next({ x, y });
        this._pan$.next({ x, y });
    }

    setMouseDownPosition({ x, y }: { x: number; y: number }) {
        this._dragStart$.next({ x, y });
        this._dragOrigin$.next(this._pan$.value);
    }

    setMouseMovePosition({ x, y }: { x: number; y: number }) {
        const origin = this._dragOrigin$.value;
        const start = this._dragStart$.value;
        const pan = { x: origin.x + x - start.x, y: origin.y + y - start.y };
        this._pan$.next(pan);
    }
}