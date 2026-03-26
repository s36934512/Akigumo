import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { IndexEntry, IndexSyncService } from '@core/services/index-sync.service';
import { UploadService } from '@core/services/upload.service';
import { THEME } from '@shared/themes/theme';

import { INITIAL_TOOLBAR, IToolbarControls, SORT_OPTIONS, ToolbarConfig, ToolbarDataState } from '../containers/toolbar/interface';

// 定義輕量化骨架接口
interface ExplorerItem {
    id: string;
    type: string;
    position: number;
}

@Injectable()
export class ContentExplorerStore implements IToolbarControls {
    private readonly indexSync = inject(IndexSyncService);
    private readonly uploadService = inject(UploadService);
    private readonly platformId = inject(PLATFORM_ID);

    private readonly pageSize = 120;

    // 1. 骨架狀態：記錄當前層級的所有 ID 與 順序
    private readonly structure = signal<ExplorerItem[]>([]);

    // 2. 血肉狀態：訂閱 SSE 的全域 Patch，並轉換為 Map 方便查詢 [cite: 31, 126]
    private readonly entityMap = toSignal(this.indexSync.indexEntries$, { initialValue: new Map<string, IndexEntry>() });

    private readonly toolbarState = signal<ToolbarConfig>(INITIAL_TOOLBAR);
    private readonly isDraggingState = signal(false);

    private draggingDepth = 0;
    private initialized = false;

    readonly isDragging = this.isDraggingState.asReadonly();

    readonly hydratedEntries = computed(() => {
        const skeleton = this.structure();
        const map = this.entityMap();

        return skeleton.map(item => {
            return map.get(item.id) || ({
                id: item.id,
                type: item.type as any,
                name: 'Loading...', // 佔位標題
                status: 'NORMAL',
                metadata: {}
            } as IndexEntry);
        });
    });

    readonly theme = THEME;

    readonly toolbarConfig = computed<ToolbarConfig>(() => {
        const state = this.toolbarState();
        return { ...state, totalPages: this.totalPages() };
    });

    readonly toolbarConfig$ = toObservable(this.toolbarConfig);

    readonly filteredEntries = computed(() => {
        const all = this.hydratedEntries();
        const config = this.toolbarState();
        const query = config.searchQuery.trim().toLowerCase();

        // 結構已經由後端 Neo4j 排序好 (position)，前端僅處理搜尋過濾
        if (!query) return all;

        return all.filter((entry) => {
            const tags = Array.isArray(entry.tags) ? entry.tags.join(' ').toLowerCase() : '';
            return entry.name.toLowerCase().includes(query) || tags.includes(query);
        });
    });

    readonly visibleEntries = computed(() => {
        const offset = this.toolbarConfig().pageOffset;
        const start = offset * this.pageSize;
        return this.filteredEntries().slice(start, start + this.pageSize);
    });

    readonly totalPages = computed(() => {
        const pages = Math.ceil(this.filteredEntries().length / this.pageSize);
        return Math.max(1, pages);
    });

    /**
     * 重構後的初始化邏輯：
     * 1. 呼叫 Explorer API 拿骨架
     * 2. 自動觸發 SSE 補全
     */
    async initialize(parentId?: string) {
        if (this.initialized) return;
        this.initialized = true;

        if (!isPlatformBrowser(this.platformId)) return;

        const notifyId = this.uploadService.currentNotifyUploadId;

        // 關鍵修正：加上 await，確保水管通了才繼續下一步
        await this.indexSync.connectStream(notifyId);

        const response = await this.indexSync.getExplorerStructure({
            parentId,
            notifyUploadId: notifyId
        });

        this.structure.set(response.items);
    }

    updateState(partial: Partial<ToolbarDataState>): void {
        this.toolbarState.update(current => ({ ...current, ...partial }));
    }

    onDragEnter() {
        this.draggingDepth += 1;
        this.setDragging(true);
    }

    onDragOver() {
        this.setDragging(true);
    }

    onDragLeave() {
        this.draggingDepth = Math.max(0, this.draggingDepth - 1);
        if (this.draggingDepth === 0) {
            this.setDragging(false);
        }
    }

    async onDrop(items: DataTransferItemList | null) {
        this.draggingDepth = 0;
        this.setDragging(false);

        if (!items || items.length === 0) {
            console.error('無法讀取檔案，請檢查檔案是否被其他程式佔用，或嘗試更換資料夾後再拖入。');
            return;
        }
        await this.uploadService.addFilesFromDataTransfer(items);
    }

    private setDragging(value: boolean) {
        this.isDraggingState.set(value);
    }
}