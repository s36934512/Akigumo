import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { EditInfo, PageItem, ComicFile, INITIAL_COMICFILE, INITIAL_EDIT_INFO } from '@models/comic.types';
import { ImageViewerDataService } from '@features/image-viewer/image-viewer.service';

export interface FieldConfig {
    id: string;
    label: string;
    key: keyof EditInfo; // 這裡限制 key 必須是 EditInfo 裡有的屬性
}

export const editFields: FieldConfig[] = [
    { id: 'author', key: 'author', label: '作者（逗號分隔）' },
    { id: 'group', key: 'group', label: '社團/出版社' },
    { id: 'type', key: 'type', label: '類型' },
    { id: 'language', key: 'language', label: '語言' },
    { id: 'series', key: 'series', label: '原作' },
    { id: 'category', key: 'category', label: '年齡分級' },
    { id: 'characters', key: 'characters', label: '角色（逗號分隔）' },
    { id: 'tags', key: 'tags', label: '標籤（逗號分隔）' }
];

@Injectable()
export class CommunicationService {
    private _comicFile$ = new BehaviorSubject<ComicFile>(INITIAL_COMICFILE);
    private _currentPage$ = new BehaviorSubject<PageItem | null>(null);
    private _sortState$ = new BehaviorSubject<'custom' | 'asc' | 'desc'>('asc');
    private _gridCols$ = new BehaviorSubject<number>(5);
    private _activeImageViewer$ = new BehaviorSubject<boolean>(false);

    readonly comicFile$ = this._comicFile$.asObservable();
    readonly currentPage$ = this._currentPage$.asObservable();
    readonly sortState$ = this._sortState$.asObservable();
    readonly gridCols$ = this._gridCols$.asObservable();
    readonly activeImageViewer$ = this._activeImageViewer$.asObservable();

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

    readonly editInfo$ = this.comicFile$.pipe(
        map(file => file?.editInfo || INITIAL_EDIT_INFO)
    );

    readonly description$ = this.comicFile$.pipe(
        map(file => file?.editInfo?.description ?? '')
    );


    get comicFileValue(): ComicFile {
        return this._comicFile$.value;
    }

    get currentPageValue(): PageItem | null {
        return this._currentPage$.value;
    }

    constructor(private imageViewerDataService: ImageViewerDataService) {
        // this.comicFile$.subscribe(file => {
        //     this.imageViewerDataService.setComicFile(file);
        // });

        this.imageViewerDataService.visible$.subscribe(visible => {
            this._activeImageViewer$.next(visible);
        });
    }

    setComicFile(file: ComicFile) {
        this._comicFile$.next(file);
    }

    setCurrentPage(page: PageItem | null) {
        this._currentPage$.next(page);
        this._activeImageViewer$.next(true);
        this.imageViewerDataService.setVisible(true);
    }

    setActiveImageViewer(active: boolean) {
        this.imageViewerDataService.setVisible(active);
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

        this.setComicFile({
            ...file,
            pages: sortedPages
        });
    }

    incrementGridCols() {
        const current = this._gridCols$.value;
        if (current < 8) {
            this._gridCols$.next(current + 1);
        }
    }

    decreaseGridCols() {
        const current = this._gridCols$.value;
        if (current > 2) {
            this._gridCols$.next(current - 1);
        }
    }
}