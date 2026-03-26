import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface SortOption {
    name: string;
    code: string;
}

export const SORT_OPTIONS: SortOption[] = [
    { name: '標題', code: 'title' },
    { name: '頁數', code: 'page_count' },
    { name: '標籤', code: 'tags' }
];

export interface ToolbarDataState {
    gridDensity: number;
    maxGridDensity: number;
    minGridDensity: number;
    listMode: 'grid' | 'list';
    sortMode: string;
    sortState: 'asc' | 'desc' | 'custom';
    pageOffset: number;
    totalPages: number;
    searchQuery: string;
    selectedSortIndex: number;
    isFiltering: boolean;
}

export interface ToolbarUIConfig {
    searchPlaceholder: string;
    showDensity: boolean;
    showSort: boolean;
    showViewMode: boolean;
    showPagination: boolean;
    hasAdvancedPanel: boolean;
}

export const INITIAL_TOOLBAR_UI_CONFIG: ToolbarUIConfig = {
    searchPlaceholder: '搜尋漫畫...',
    showDensity: true,
    showSort: true,
    showViewMode: true,
    showPagination: true,
    hasAdvancedPanel: false,
};

export interface ToolbarConfig extends ToolbarDataState {
    ui: ToolbarUIConfig;
}

export interface IToolbarControls {
    toolbarConfig$: Observable<ToolbarConfig>;

    updateState(partial: Partial<ToolbarDataState>): void;
}


export const INITIAL_TOOLBAR: ToolbarConfig = {
    ui: INITIAL_TOOLBAR_UI_CONFIG,
    gridDensity: 5,
    maxGridDensity: 8,
    minGridDensity: 2,
    listMode: 'grid',
    sortMode: 'title',
    sortState: 'asc',
    pageOffset: 0,
    totalPages: 0,
    searchQuery: '',
    selectedSortIndex: 0,
    isFiltering: false,
};

export const TOOLBAR_CONTROLS = new InjectionToken<IToolbarControls>('TOOLBAR_CONTROLS');

