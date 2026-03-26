import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PreviewPortalViewModel } from './preview-portal.component';

@Injectable()
export class PreviewPortalControllerService {
    private _gallery = new BehaviorSubject<PreviewPortalViewModel | null>(null);
    private _imageIndex = new BehaviorSubject<number>(0);
    private _targetElement = new BehaviorSubject<HTMLElement | null>(null);
    private _isVisible = new BehaviorSubject<boolean>(false);

    setGallery(gallery: PreviewPortalViewModel) {
        this._gallery.next(gallery);
        this._imageIndex.next(0);
    }

    setImageIndex(index: number) {
        const gallery = this._gallery.getValue();
        if (gallery && index >= 0 && index < gallery.urls.length) {
            this._imageIndex.next(index);
        }
    }

    setTargetElement(element: HTMLElement | null) {
        this._targetElement.next(element);
    }

    setVisible(visible: boolean) {
        this._isVisible.next(visible);
        if (!visible) {
            this._targetElement.next(null);
        }
    }

    setTargetElementAndVisible(element: HTMLElement | null, visible: boolean) {
        this._targetElement.next(element);
        this._isVisible.next(visible);
        if (!visible) {
            this._targetElement.next(null);
        }
    }

    nextImage() {
        const gallery = this._gallery.getValue();
        const currentIndex = this._imageIndex.getValue();
        if (gallery && currentIndex < gallery.urls.length - 1) {
            this._imageIndex.next(currentIndex + 1);
        }
    }

    previousImage() {
        const currentIndex = this._imageIndex.getValue();
        if (currentIndex > 0) {
            this._imageIndex.next(currentIndex - 1);
        }
    }

    get gallery$() {
        return this._gallery.asObservable();
    }

    get imageIndex$() {
        return this._imageIndex.asObservable();
    }

    get targetElement$() {
        return this._targetElement.asObservable();
    }

    get visible$() {
        return this._isVisible.asObservable();
    }
}