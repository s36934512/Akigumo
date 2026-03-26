
export class checksumOrchestrator {
    async dispatchUploadTask(fileInfo: any) {
        // 1. 根據邏輯計算優先度
        let priority = 10; // 預設中等

        if (fileInfo.size < 1 * 1024 * 1024) {
            priority = 1; // 小檔案（例如大頭貼、文件）火速處理
        } else if (fileInfo.type.startsWith('video/')) {
            priority = 20; // 影片轉檔或大檔案往後排
        }

        // 2. 統一由這裡派發任務
        // await queues.fileAuditQueue.add('file-process-job',
        //     { ...fileInfo },
        //     { priority } // 這裡決定誰先在隊列中被 Pick
        // );
    }
}