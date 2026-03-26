import { Injectable } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { EditInfo, PageItem, UploadFile, INITIAL_EDIT_INFO } from '@models/comic.types';

export interface FieldConfig {
    id: string;
    label: string;
    key: keyof EditInfo; // 這裡限制 key 必須是 EditInfo 裡有的屬性
}

@Injectable()
export class ComicEditDataService {
    // 1. 使用 BehaviorSubject 儲存狀態 (私有)
    private _selectedFile$ = new BehaviorSubject<UploadFile | null>(null);
    private _focusedPage$ = new BehaviorSubject<PageItem | null>(null);
    private _sortState$ = new BehaviorSubject<'custom' | 'asc' | 'desc'>('asc');
    private _deleteMode$ = new BehaviorSubject<boolean>(false);
    private _gridCols$ = new BehaviorSubject<number>(5);
    private _visible$ = new BehaviorSubject<boolean>(false);

    // 2. 暴露 Observable 供組件訂閱 (唯讀)
    readonly selectedFile$ = this._selectedFile$.asObservable();
    readonly focusedPage$ = this._focusedPage$.asObservable();
    readonly sortState$ = this._sortState$.asObservable();
    readonly deleteMode$ = this._deleteMode$.asObservable();
    readonly gridCols$ = this._gridCols$.asObservable();
    readonly visible$ = this._visible$.asObservable();

    readonly editFields: FieldConfig[] = [
        { id: 'author', key: 'author', label: '作者（逗號分隔）' },
        { id: 'group', key: 'group', label: '社團/出版社' },
        { id: 'type', key: 'type', label: '類型' },
        { id: 'language', key: 'language', label: '語言' },
        { id: 'series', key: 'series', label: '原作' },
        { id: 'category', key: 'category', label: '年齡分級' },
        { id: 'characters', key: 'characters', label: '角色（逗號分隔）' },
        { id: 'tags', key: 'tags', label: '標籤（逗號分隔）' }
    ];

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

    readonly editInfo$ = this.selectedFile$.pipe(
        map(draft => draft?.editInfo || INITIAL_EDIT_INFO)
    );

    readonly description$ = this.selectedFile$.pipe(
        map(draft => draft?.editInfo?.description ?? '')
    );

    get selectedFileValue() { return this._selectedFile$.value; }
    get focusedPageValue() { return this._focusedPage$.value; }

    setSelectedFile(file: UploadFile | null) {
        this._selectedFile$.next(file);
        this.setVisible(file != null);
    }

    setVisible(val: boolean) {
        this._visible$.next(val);
    }

    setFocusedPage(page: PageItem | null) {
        this._focusedPage$.next(page);
    }

    toggleDeleteMode() {
        const current = this._deleteMode$.value;
        this._deleteMode$.next(!current);
    }

    toggleSort() {
        const currentState = this._sortState$.value;
        let nextState: 'asc' | 'desc' | 'custom';

        nextState = (currentState === 'asc') ? 'desc' : 'asc';
        this._sortState$.next(nextState);

        this.applySort(nextState);
    }

    applySort(state: 'asc' | 'desc') {
        const file = this.selectedFileValue;
        if (!file?.pages) return;

        const sortedPages = [...file.pages].sort((a, b) => {
            return state === 'asc' ? a.id - b.id : b.id - a.id;
        });

        this.setSelectedFile({
            ...file,
            pages: sortedPages
        });
    }

    setDefaults() {
        this._selectedFile$.next(null);
        this._focusedPage$.next(null);
        this._deleteMode$.next(false);
        this._sortState$.next('asc');
        this._gridCols$.next(5);
        this._visible$.next(false);
    }

    updateEditInfo(partial: Partial<EditInfo>) {
        const file = this.selectedFileValue;
        if (file && file.editInfo) {
            this._selectedFile$.next({
                ...file,
                editInfo: { ...file.editInfo, ...partial }
            });
        }
    }

    updatePageOrder(previousIndex: number, currentIndex: number) {
        const file = this.selectedFileValue;
        if (!file || !file.pages) return;

        const newPages = [...file.pages];
        moveItemInArray(newPages, previousIndex, currentIndex);
        this._sortState$.next('custom');
        this.setSelectedFile({
            ...file,
            pages: newPages
        });
    }

    updateDescription(newDescription: string) {
        const file = this.selectedFileValue;
        if (file && file.editInfo) {
            this.setSelectedFile({
                ...file,
                editInfo: {
                    ...file.editInfo,
                    description: newDescription
                }
            });
        }
    }

    deletePage(pageId: number) {
        const file = this.selectedFileValue;
        if (!file || !file.pages) return;

        const updatedPages = file.pages.filter((p: PageItem) => p.id !== pageId);

        this.setSelectedFile({
            ...file,
            pages: updatedPages
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