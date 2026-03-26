import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, concatMap, filter, Subject, Subscription, tap } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { FileDTO, FileItem, PartialFileInfo } from '@models/file.types';
import { SseService } from '@core/services/sse.service';

@Injectable()
/**
 * 檔案同步服務，支援 SSE 即時推播、分批載入、續傳、資料更新佇列
 */
export class FileSyncService implements OnDestroy {
    /** SSE subscription handle */
    private sseSub: Subscription | null = null;
    /** 部分檔案清單（初次推播用） */
    private _partialFileList = new BehaviorSubject<PartialFileInfo[]>([]);
    /** 完整檔案清單（分批載入/更新用） */
    private _fileList = new BehaviorSubject<FileItem[]>([]);
    /** 待更新的檔案 id 佇列（SSE推播後分批查詢） */
    private _updatedQueue = new Subject<number[]>();
    /** 每批載入數量 */
    private limit = 100;
    /** 是否正在載入 */
    private loading = false;
    /** 是否已載入全部資料 */
    private finished = false;
    /** 當前查詢型態（normal/trash等） */
    private type = '';
    /** 分批載入游標 */
    private nextCursor = 0;

    /** 檔案清單 Observable，供元件訂閱 */
    readonly fileList$ = this._fileList.asObservable();

    /**
     * 建構子，初始化 RxJS 更新佇列處理
     */
    constructor(
        private http: HttpClient,
        private sseService: SseService,
    ) {
        this.updateHandler();
    }

    /**
     * 建立 SSE 連線，監聽後端推播
     * @param type 查詢型態（normal/trash等）
     */
    connectSSE(type: string) {
        this.sseSub?.unsubscribe();
        this.type = type;
        this.sseSub = this.sseService.connect<any>(`/api/files/events?type=${type}`).subscribe({
            next: (msg) => {
                if (msg.type === 'init') {
                    this._partialFileList.next((msg.payload as any).files ?? []);
                    this.loadMore();
                } else if (msg.type === 'data_changed') {
                    this._updatedQueue.next((msg.payload as any).files ?? []);
                }
            },
            error: (err) => console.warn('SSE error', err),
        });
    }

    /**
     * 釋放 SSE 連線資源
     */
    ngOnDestroy() {
        this.sseSub?.unsubscribe();
    }

    /**
     * 分批載入檔案（游標續傳），支援 infinite scroll
     */
    loadMore() {
        if (this.type === '') return;
        if (this.loading || this.finished) return;

        this.loading = true;
        // 用 nextCursor 分批載入，避免重複
        const body = { cursor: this.nextCursor, limit: this.limit, type: this.type };
        this.http.post<FileDTO>(`/api/files`, body).subscribe({
            next: (data) => {
                const newFiles = (data.files as FileItem[]) || [];
                const allFiles = [...this._fileList.value, ...newFiles];
                this._fileList.next(allFiles);

                // 更新 nextCursor，判斷是否已載完
                if (typeof data.nextCursor === 'number') {
                    this.nextCursor = data.nextCursor;
                } else {
                    this.finished = true;
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('發生錯誤', err);
                this.loading = false;
            }
        });
    }

    /**
     * RxJS流式處理：分批查詢待更新檔案，避免 race condition
     */
    private updateHandler() {
        this._updatedQueue.pipe(
            filter(files => files.length > 0),
            concatMap(files => this.loadSpecific$(files))
        )
            .subscribe();
    }

    /**
     * 分批查詢指定 id 的檔案，查到的移除，沒查到的續留佇列
     * @param files 檔案 id 陣列
     */
    private loadSpecific$(files: number[]) {
        const _files = files.slice(0, this.limit);
        const body = { files: _files, limit: _files.length, type: this.type };
        return this.http.post<FileDTO>(`/api/files`, body).pipe(
            tap(fileDTO => {
                const updatedFiles = fileDTO.files;
                let currentFiles = [...this._fileList.value];

                updatedFiles.forEach(updatedFile => {
                    const index = currentFiles.findIndex(f => f.serialNumber === updatedFile.serialNumber);
                    if (index !== -1) {
                        currentFiles[index] = updatedFile;
                    } else {
                        currentFiles.push(updatedFile);
                    }
                });

                this._fileList.next(currentFiles);

                // 沒查到的 id 續留佇列
                const remaining = files.filter(
                    id => !updatedFiles.some(f => f.serialNumber === id)
                );
                this._updatedQueue.next(remaining);
            })
        );
    }
}