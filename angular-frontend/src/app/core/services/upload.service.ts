import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import {
    FileIdAssigned,
    FileIdAssignedArray,
    ScannedFilesArray,
    ScannedFileSchema
} from '@core/schemas/upload.schema';
import { INITIAL_UPLOAD_FILE, UploadFile } from '@models/comic.types';
import { DefaultService } from '@orval/default/default.service';
import { PostApiV1FileTusIntentBody } from '@orval/zod/myAPI';
import {
    BehaviorSubject,
    combineLatest,
    firstValueFrom,
    Subscription
} from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Tus, Uppy } from 'uppy';

import { IndexSyncService } from './index-sync.service';
import { SseService } from './sse.service';



@Injectable({
    providedIn: 'root'
})
export class UploadService implements OnDestroy {
    private queueSubject = new BehaviorSubject<UploadFile[]>([]);
    private editingIdSubject = new BehaviorSubject<string | null>(null);

    queue$ = this.queueSubject.asObservable();
    editingId$ = this.editingIdSubject.asObservable();

    totalCount$ = this.queue$.pipe(map(q => q.length));
    activeFile$ = combineLatest([this.queue$, this.editingId$]).pipe(
        map(([queue, id]) => queue.find(f => f.id === id) || null),
        shareReplay(1)
    );

    private readonly _pendingCount = new BehaviorSubject<number>(0);
    private readonly _processedCount = new BehaviorSubject<number>(0);

    readonly pendingCount$ = this._pendingCount.asObservable();
    readonly processedCount$ = this._processedCount.asObservable();

    private uppy: Uppy | null = null;
    private sseSub: Subscription | null = null;

    private notifyUploadId = crypto.randomUUID();

    // Holds scanned files awaiting a server-assigned fileId before Tus upload starts
    private fileScanMap = new Map<string, File>();

    constructor(
        private http: HttpClient,
        private sseService: SseService, // 如果不再這裡連線，這個可以移除
        private defaultService: DefaultService,
        private indexSync: IndexSyncService // 注入 IndexSyncService
    ) {
        this.initUppy();
        // 修正：不要在這裡 connectSSE，交給 IndexSync 或 Store
        this.setupUppyListeners();
    }

    get currentNotifyUploadId(): string {
        return this.notifyUploadId;
    }

    handleFileIdAssigned(payload: FileIdAssignedArray): void {
        console.log('[UploadService] 接收到 ID 分配:', payload);
        payload.forEach(item => {
            this.startUppyUpload(item); // 啟動 Uppy 上傳流程 [cite: 118-120]
        });
    }

    /**
     * 提供給 IndexSyncService 調用的進度更新入口
     */
    handleProgressUpdate(delta: number): void {
        this.changeToProcessed(delta); // 更新進度條狀態 [cite: 144-145]
    }

    /**
     * 初始化 Uppy 實例
     * @returns Uppy 實例 (明確標註類型)
     */
    initUppy(): Uppy {
        if (!this.uppy) {
            this.uppy = new Uppy({
                restrictions: { maxFileSize: 10 * 1024 * 1024 * 1024 },
                autoProceed: true,
            }).use(Tus, {
                endpoint: '/api/v1/tus/files',
                uploadDataDuringCreation: true,
                chunkSize: 5 * 1024 * 1024,
                retryDelays: [0, 1000, 3000, 5000],
                headers: {
                    authorization: "019c1d69-84c4-7349-94e4-7086aa735867" //  TODO: 這裡先 hardcode 測試，之後改成從後端拿 token 或其他驗證方式
                },
            });
        }

        // 這裡使用類型斷言，因為我們確定此時 this.uppy 絕對不是 null
        return this.uppy as Uppy;
    }

    private setupUppyListeners() {
        if (!this.uppy) return;

        this.uppy.on('upload-success', (file) => {
            console.log('[upload service] Upload success:', file);
            const fileId = file?.meta['fileId'];
            if (fileId) {
                // 當單一檔案 Tus 上傳完成，立即送出 seal
                this.http.post('/api/v1/file/tus-seal', {
                    fileId: fileId,
                    checksum: file?.meta['checksum'] || 'd3c617d9527eb9c0c6297e60319aef64c022059a47dfbfdef92ab45464720016',
                    // TODO: 上面這個 checksum 之後要改成真正的檔案 checksum。Uppy 的 Tus plugin 並沒有內建計算 checksum 的功能，所以可能需要額外實作一個功能來計算檔案的 checksum，或者在上傳前就由前端計算好並放在 meta 裡面。
                    // Why: file.data may be undefined or not have a 'name' property, so we need a type guard
                    fileName: (file?.data && typeof file.data === 'object' && 'name' in file.data)
                        ? (file.data as File).name
                        : 'unknown'
                }).subscribe({
                    next: () => console.log(`[upload service] 檔案 ${fileId} 已密封`),
                    error: (err) => console.error(`[upload service] 檔案 ${fileId} Seal 失敗:`, err)
                });
            }
        });
    }

    // --- 核心流程：掃描 -> Intent -> SSE -> Upload ---

    async addFilesFromDataTransfer(items: DataTransferItemList) {
        if (!this.uppy) return;

        const batchId = crypto.randomUUID();

        const scannedFiles: ScannedFilesArray = [];

        const entries = Array.from(items)
            .map(item => item.webkitGetAsEntry())
            .filter((entry): entry is FileSystemEntry => entry !== null);

        await this.traverseFileTree(entries, (file, entry) => {
            const tempScanId = crypto.randomUUID();
            this.fileScanMap.set(tempScanId, file); // 暫存在記憶體
            scannedFiles.push(ScannedFileSchema.parse({
                name: file.name,
                size: file.size,
                metadata: {
                    tempScanId,
                    path: entry.fullPath.replace(/^\//, ''),
                    batchId
                }
            }));
        });

        this.setPending(scannedFiles.length);

        const payload = {
            notifyUploadId: this.notifyUploadId,
            files: scannedFiles
        };

        console.log('[upload service] 掃描完成，送出 Intent:', payload);
        try {
            await this.defaultService.postApiV1FileTusIntent(payload);
            console.log('[upload service] Intent 已送出，等待 SSE 分配 fileId...');
        } catch (err) {
            console.error('[upload service] 送出 Intent 失敗:', err);
        }
    }

    /**
     * 當 SSE 收到 fileId 後，由該方法正式啟動 Uppy 上傳
     */
    private startUppyUpload(fileIdAssigned: FileIdAssigned) {
        const { tempScanId, fileId, batchId } = fileIdAssigned;

        const file = this.fileScanMap.get(tempScanId);
        if (!file || !this.uppy) return;

        this.uppy.addFile({
            source: 'drag-n-drop',
            name: file.name,
            type: file.type,
            data: file,
            meta: {
                batchId,
                fileId, // 這邊帶入後端給的正式 ID
            }
        });

        this.fileScanMap.delete(tempScanId);
    }

    /**
     * Accepts a FileList from a <input webkitdirectory> element and queues all
     * files for upload, preserving the relative folder path via webkitRelativePath.
     */
    async addFilesFromFolderInput(fileList: FileList) {
        if (!this.uppy || fileList.length === 0) return;
        const batchId = crypto.randomUUID();

        const scannedFiles: ScannedFilesArray = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const tempScanId = crypto.randomUUID();
            this.fileScanMap.set(tempScanId, file);
            scannedFiles.push(ScannedFileSchema.parse({
                name: file.name,
                size: file.size,
                metadata: {
                    tempScanId,
                    // webkitRelativePath includes the top-level folder name, e.g. "myFolder/sub/file.jpg"
                    path: file.webkitRelativePath || file.name,
                    batchId,
                },
            }));
        }

        this.setPending(scannedFiles.length);

        const payload = {
            notifyUploadId: this.notifyUploadId,
            files: scannedFiles
        };
        try {
            await this.defaultService.postApiV1FileTusIntent(payload);
        } catch (err) {
            console.error('[upload service] 送出 Intent 失敗:', err);
        }
    }

    // --- 輔助方法：遞迴掃描 ---
    private async traverseFileTree(entries: FileSystemEntry[], onFile: (file: File, entry: FileSystemFileEntry) => void) {
        for (const entry of entries) {
            if (entry.isFile) {
                const file = await this.getFileFromEntry(entry as FileSystemFileEntry);
                onFile(file, entry as FileSystemFileEntry);
            } else if (entry.isDirectory) {
                const dirEntries = await this.readAllDirectoryEntries(entry as FileSystemDirectoryEntry);
                await this.traverseFileTree(dirEntries, onFile);
            }
        }
    }

    private getFileFromEntry(fileEntry: FileSystemFileEntry): Promise<File> {
        return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
    }

    private async readAllDirectoryEntries(dirEntry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
        const reader = dirEntry.createReader();
        let results: FileSystemEntry[] = [];
        const read = async (): Promise<FileSystemEntry[]> => {
            return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        };

        let entries = await read();
        while (entries.length > 0) {
            results = results.concat(entries);
            entries = await read();
        }
        return results;
    }

    // --- 狀態管理與清理 ---
    get editingIdValue() {
        return this.editingIdSubject.value;
    }

    get queue() {
        return this.queueSubject.value;
    }

    setEditingId(id: string) {
        this.editingIdSubject.next(id);
    }

    getFileById(id: string): UploadFile | null {
        const file = this.queue.find(f => f.id === id);
        return file || null;
    }

    updateFile(file: Partial<UploadFile>) {
        const currentQueue = this.queueSubject.getValue();
        const idx = currentQueue.findIndex(f => f.id === file.id);
        if (idx > -1) {
            currentQueue[idx] = { ...currentQueue[idx], ...file };
            this.queueSubject.next([...currentQueue]);
        } else {
            const newfile = { ...INITIAL_UPLOAD_FILE, ...file };
            this.queueSubject.next([newfile, ...currentQueue]);
        }
    }

    setPending(count: number) { this._pendingCount.next(count); }
    changeToProcessed(delta: number) {
        this._pendingCount.next(Math.max(0, this._pendingCount.value - delta));
        this._processedCount.next(this._processedCount.value + delta);
    }

    ngOnDestroy() {
        if (this.uppy) this.uppy.cancelAll();
        this.sseSub?.unsubscribe();
        this.fileScanMap.clear();
    }
}