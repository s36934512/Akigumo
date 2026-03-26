import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, OnDestroy } from '@angular/core';
import { FileIdAssigned } from '@core/schemas/upload.schema';
import { BehaviorSubject, Subscription, firstValueFrom } from 'rxjs';

import { SseMessage, SseService } from './sse.service';
import { UploadService } from './upload.service';

// --- Schema 定義 ---

export interface IndexEntry {
    id: string;
    type: 'WORK' | 'SERIES' | 'COLLECTION' | 'FILE_CONTAINER';
    name: string;
    status: 'NORMAL' | 'HIDDEN' | 'DELETED';
    isPinned: boolean;
    createdAt: number;
    updatedAt: number;
    pages?: number;
    count?: number;
    tags?: string[];
    coverUrl?: string;
    metadata: Record<string, any>;
}

export interface ExplorerItem {
    id: string;
    type: string;
    position: number;
}

export interface BrowseExplorerResponse {
    items: ExplorerItem[];
    breadcrumbs: Array<{ id: string; name: string }>;
}

export interface IndexEntryPatch {
    op: 'UPSERT' | 'DELETE';
    id: string;
    entry?: IndexEntry;
}

interface IndexPatchPayload {
    patches: IndexEntryPatch[];
}

interface ProgressPayload {
    processedDelta: number;
    fileId?: string;
    status?: string;
}

type SsePayload = IndexPatchPayload | FileIdAssigned[] | ProgressPayload;

@Injectable({ providedIn: 'root' })
export class IndexSyncService implements OnDestroy {
    private readonly _entryMap = new BehaviorSubject<Map<string, IndexEntry>>(new Map());
    private sseSub: Subscription | null = null;
    private currentNotifyId: string | null = null;

    readonly indexEntries$ = this._entryMap.asObservable();

    constructor(
        private http: HttpClient,
        private sseService: SseService,
        private injector: Injector
    ) {
        console.debug('[IndexSync] Service initialized');
    }

    private get uploadService(): UploadService {
        return this.injector.get(UploadService);
    }

    async getExplorerStructure(params: {
        parentId?: string;
        notifyUploadId: string;
        showDeleted?: boolean;
    }): Promise<BrowseExplorerResponse> {
        // 呼叫後端 API 取得骨架
        return firstValueFrom(
            this.http.post<BrowseExplorerResponse>('/api/v1/browse', params)
        );
    }

    connectStream(notifyUploadId: string): Promise<void> { // 改回傳 Promise
        if (this.currentNotifyId === notifyUploadId && this.sseSub && !this.sseSub.closed) {
            return Promise.resolve();
        }

        this.currentNotifyId = notifyUploadId;
        this.sseSub?.unsubscribe();

        return new Promise((resolve, reject) => {
            let isConnected = false;

            this.sseSub = this.sseService.connect<any>(`/api/v1/trace/${notifyUploadId}`).subscribe({
                next: (msg) => {
                    // 1. 握手邏輯：收到任何有效訊息即代表後端 Redis 訂閱成功
                    if (!isConnected) {
                        console.debug('[IndexSync] SSE Stream Connected:', notifyUploadId);
                        isConnected = true;
                        resolve();
                    }

                    // --- 分流邏輯 ---
                    console.debug('[IndexSync] Received SSE message:', msg);
                    // 1. 處理實體補全 (INDEX_PATCH)
                    if (msg.type === 'INDEX_PATCH' && msg.payload?.patches) {
                        this.applyPatches(msg.payload.patches); // 更新本地實體池
                    }

                    // 2. 處理上傳 ID 分配 (FILE_ID_ASSIGNED)
                    if (msg.type === 'FILE_ID_ASSIGNED') {
                        this.uploadService.handleFileIdAssigned(msg.payload as FileIdAssigned[]);
                    }

                    // 3. 處理進度條更新 (PROGRESS)
                    if (msg.type === 'PROGRESS' && msg.payload?.processedDelta) {
                        this.uploadService.handleProgressUpdate(msg.payload.processedDelta);
                    }
                },
                error: (err) => console.error('[IndexSync] SSE Error:', err),
            });

            setTimeout(() => {
                if (!isConnected) {
                    console.warn('[IndexSync] 連線逾時，強行繼續...');
                    resolve();
                }
            }, 5000);
        });
    }

    private applyPatches(patches: IndexEntryPatch[]) {
        const nextMap = new Map(this._entryMap.value);
        let changed = false;

        for (const patch of patches) {
            if (patch.op === 'DELETE') {
                if (nextMap.delete(patch.id)) changed = true;
                continue;
            }

            if (patch.op === 'UPSERT' && patch.entry) {
                // 取得現有資料進行合併，避免 metadata 被覆蓋
                const existing = nextMap.get(patch.id);
                nextMap.set(patch.id, {
                    ...existing,
                    ...patch.entry,
                    metadata: {
                        ...(existing?.metadata || {}),
                        ...(patch.entry.metadata || {})
                    }
                });
                changed = true;
            }
        }

        if (changed) {
            this._entryMap.next(nextMap);
        }
    }

    ngOnDestroy(): void {
        this.sseSub?.unsubscribe();
    }
}