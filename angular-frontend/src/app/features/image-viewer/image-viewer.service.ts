import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { ComicFile, INITIAL_COMICFILE, INITIAL_EDIT_INFO } from '@models/comic.types';
import { DisplayPageItem } from '@models/display.types';
import { THEME } from '@shared/themes/theme';

export interface ToolbarConfig {
    originalZoom: number;
    zoom: number;
    rotation: number;
    isDragging: boolean;
}

export const INITIAL_TOOLBAR: ToolbarConfig = {
    originalZoom: 0,
    zoom: 1,
    rotation: 0,
    isDragging: false
};

@Injectable()
export class ImageViewerDataService {
    private _visible$ = new BehaviorSubject<boolean>(false);
    private _comicFile$ = new BehaviorSubject<ComicFile>(INITIAL_COMICFILE);
    private _displayPageItems$ = new BehaviorSubject<DisplayPageItem[]>([]);
    private _currentPage$ = new BehaviorSubject<DisplayPageItem | null>(null);
    private _toolbarConfig$ = new BehaviorSubject<ToolbarConfig>(INITIAL_TOOLBAR);
    private _sortState$ = new BehaviorSubject<'custom' | 'asc' | 'desc'>('asc');
    private _resetSignal$ = new BehaviorSubject<boolean>(false);

    readonly comicFile$ = this._comicFile$.asObservable();
    readonly currentPage$ = this._currentPage$.asObservable();
    readonly sortState$ = this._sortState$.asObservable();

    readonly toolbarConfig$ = this._toolbarConfig$.asObservable();
    readonly resetSignal$ = this._resetSignal$.asObservable();
    readonly visible$ = this._visible$.asObservable();

    baseComic = INITIAL_COMICFILE;
    theme = THEME;

    readonly totalPages$ = this.comicFile$.pipe(
        map(file => file.pages ? file.pages.length : 0)
    );

    readonly sortIcon$ = this.sortState$.pipe(
        map(state => {
            switch (state) {
                case 'asc': return 'pi-arrow-up';
                case 'desc': return 'pi-arrow-down';
                default: return 'pi-sort-alt';
            }
        })
    );

    readonly sortLabel$ = this.sortState$.pipe(
        map(state => {
            switch (state) {
                case 'asc': return '升序';
                case 'desc': return '降序';
                default: return '自訂';
            }
        })
    );

    readonly currentPageUrl$ = this.currentPage$.pipe(
        map(page => page ? page.url : '')
    );

    readonly leftbound$ = this.currentPage$.pipe(
        map(page => page ? page.serialNumber == 0 : false)
    );

    readonly rightbound$ = combineLatest([this.currentPage$, this.comicFile$]).pipe(
        map(([page, file]) => {
            if (!page || !file.pages) return true;
            return page.serialNumber >= file.pages.length - 1;
        })
    )

    readonly zoomPercent$ = this.toolbarConfig$.pipe(
        map(config => Math.round(config.zoom * config.originalZoom * 100))
    );

    get comicFileValue(): ComicFile {
        return this._comicFile$.value;
    }

    get currentPageValue(): DisplayPageItem | null {
        return this._currentPage$.value;
    }

    get zoomValue(): number {
        return this._toolbarConfig$.value.zoom;
    }

    get rotationValue(): number {
        return this._toolbarConfig$.value.rotation;
    }

    get isDragging(): boolean {
        return this._toolbarConfig$.value.isDragging;
    }

    // setComicFile(file: ComicFile) {
    //     this._comicFile$.next(file);
    //     this._currentPage$.next(file.pages && file.pages.length > 0 ? DisplayModel.fromPageItem(file.pages[0], 0) : null);
    //     this._displayPageItems$.next(DisplayModel.fromPageItems(file.pages || []));
    // }

    setCurrentPage(page: DisplayPageItem | null) {
        this._currentPage$.next(page);
    }

    setPreviousPage() {
        const file = this._displayPageItems$.value;
        const currentPage = this.currentPageValue;
        if (!file || !currentPage) return;

        if (currentPage.serialNumber > 0) {
            this._currentPage$.next(file[currentPage.serialNumber - 1]);
        }
    }

    setNextPage() {
        const file = this._displayPageItems$.value;
        const currentPage = this._currentPage$.value;
        if (!file || !currentPage) return;

        if (currentPage.serialNumber < file.length - 1) {
            this._currentPage$.next(file[currentPage.serialNumber + 1]);
        }
    }

    setDragging(isDragging: boolean) {
        this._toolbarConfig$.next(
            { ...this._toolbarConfig$.value, isDragging }
        )
    }

    setVisible(visible: boolean) {
        this._visible$.next(visible);
    }

    toggleSort() {
        const currentState = this._sortState$.value;
        let nextState: 'asc' | 'desc' | 'custom';

        nextState = (currentState === 'asc') ? 'desc' : 'asc';
        this._sortState$.next(nextState);

        this.applySort(nextState);
    }

    applySort(state: 'asc' | 'desc') {
        const file = this.comicFileValue;
        if (!file.pages) return;

        const sortedPages = [...file.pages].sort((a, b) => {
            return state === 'asc' ? a.id - b.id : b.id - a.id;
        });

        // this.setComicFile({
        //     ...file,
        //     pages: sortedPages
        // });
    }

    setOriginalZoom(zoom: number) {
        this._toolbarConfig$.next(
            { ...this._toolbarConfig$.value, originalZoom: zoom }
        );
    }

    zoomIn() {
        this._toolbarConfig$.next(
            { ...this._toolbarConfig$.value, zoom: Math.min(this._toolbarConfig$.value.zoom + 0.2, 3) }
        );
    }

    zoomOut() {
        this._toolbarConfig$.next(
            { ...this._toolbarConfig$.value, zoom: Math.max(this._toolbarConfig$.value.zoom - 0.2, 0.2) }
        );
    }

    resetZoom() {
        this._toolbarConfig$.next(
            { ...this._toolbarConfig$.value, zoom: 1 }
        );
        this._resetSignal$.next(true);
    }

    setZoomPercent(percent: number) {
        const originalZoom = this._toolbarConfig$.value.originalZoom;
        this._toolbarConfig$.next(
            { ...this._toolbarConfig$.value, zoom: percent / 100 / originalZoom }
        );
    }

    rotateLeft() {
        this._toolbarConfig$.next(
            { ...this._toolbarConfig$.value, rotation: (this._toolbarConfig$.value.rotation - 90) % 360 }
        );
    }

    rotateRight() {
        this._toolbarConfig$.next(
            { ...this._toolbarConfig$.value, rotation: (this._toolbarConfig$.value.rotation + 90) % 360 }
        );
    }
}
