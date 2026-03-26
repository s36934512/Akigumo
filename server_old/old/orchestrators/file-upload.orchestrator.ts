

export class FileUploadOrchestrator {
    static async startUploadFlow(data: any) {
        const { sessionId, upload } = data;
        // 1. 【Zod 驗證】: 立即攔截格式錯誤的請求
        // const validatedData = uploadSchema.parse(data);

        // 2. 【Prisma 預建立】: 在資料庫建立一筆 status 為 'PENDING' 的 Audit Log
        // 這樣萬一 Queue 壞了，你也能追蹤到這筆上傳「開始了但沒下文」。

        // await uploadFlowProducer.add({
        //     name: 'save-to-db-and-audit',
        //     queueName: 'file-audit-queue',
        //     data: { sessionId },
        //     children: [
        //         {
        //             name: 'move-and-checksum', // 第一步
        //             queueName: 'file-processing-queue',
        //             data: { sessionId, upload },
        //         },
        //     ],
        // });
    }
}

// /**
//   * 當 Tus 觸發 POST_FINISH 時呼叫
//   * 負責協調檔案搬動、資料庫狀態更新與啟動後續流程
//   */
// async handleUploadFinished(auth: string, upload: Upload) {

//     // TODO: [Validation] 1. 使用 Zod 再次驗證 metadata 完整性
//     // 確保 batchId, originalName 等關鍵資訊存在，避免後續 Worker 崩潰

//     // TODO: [Audit] 2. 發送 Audit Log 標記「檔案接收完成，準備處理」
//     // await auditService.logTusAction(auth, { id: uploadId, ... }, ActionStatus.RUNNING);

//     // TODO: [Database TX] 3. 開啟 Prisma Transaction 執行核心業務
//     // a. 根據 uploadId 找到 POST_CREATE 時建立的 File Placeholder
//     // b. 更新 File 狀態為 'PROCESSING'
//     // c. (可選) 如果是新檔案，初始化檔案版本紀錄 (FileHistory)
//     // d. 確保上述動作與「用戶配額確認」在同一個 TX 內完成

//     try {
//         // TODO: [Storage] 4. 執行檔案搬動 (Move from TUS temp to Permanent Storage)
//         // a. 根據業務邏輯決定路徑 (例如: /storage/{userId}/{year}/{month}/{fileId})
//         // b. 呼叫 StorageService.move(uploadId, finalPath)
//         // c. 取得檔案的真正 Hash (SHA256) 與大小

//         // TODO: [Database] 5. 更新檔案最終物理資訊
//         // 將步驟 4 取得的 finalPath, hash, size 回填至 Prisma

//     } catch (error) {
//         // TODO: [Error Handling] 6. 如果搬動失敗的補償邏輯
//         // a. 紀錄錯誤 Audit Log
//         // b. 將 Prisma 中的檔案狀態標記為 'FAILED'
//         // throw error;
//     }

//     // TODO: [Flow Control] 7. 啟動 BullMQ 非同步工作流 (UploadFlowService)
//     // 傳送 fileId 與路徑，讓後續的 Worker 處理：
//     // a. 產生縮圖 / 影片轉碼
//     // b. 提取檔案內容 (Text Extraction)
//     // c. 同步至 Neo4j 建立知識圖譜關係

//     // TODO: [Audit] 8. 發送 Audit Log 標記「編排器任務完成，進入後台處理」
// }