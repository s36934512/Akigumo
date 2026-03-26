import { Worker } from 'bullmq';
import Redis from 'ioredis';
import archiveUtils from '@server/old/archiveUtils';
import { v7 as uuidv7 } from 'uuid';
import FileProcessor from '../processors/file.processor';
import NeoSyncService from '@core/neo-sync/neo-sync.service';
import FileRepository from '../data/repositories/file.repository';
import { FileStatusSchema } from 'generated/zod/schemas/enums/FileStatus.schema';
import { ACTION_REGISTRY } from '@core/audit/audit-actions.config';
import { ExtensionPrisma } from '@core/infrastructure/database/prisma';
import { ActionStatus } from 'generated/prisma/enums';
import AuditLogRepository from '@server/core/audit/data/repositories/auditLog.repository';
import { QUEUE_NAMES } from '@shared/queues/constants';
import DatabaseCacheRepository from '@server/core/database-cache.repository';

interface FileProcessingWorkerDeps {
    connection: Redis;
    prisma: ExtensionPrisma;
    fileRepository: FileRepository;
    fileProcessor: FileProcessor;
    neoSyncService: NeoSyncService;
    auditLogRepository: AuditLogRepository;
    databaseCacheRepository: DatabaseCacheRepository;
}

export default class FileProcessingWorker {
    private worker: Worker;

    constructor(private deps: FileProcessingWorkerDeps) {
        const { connection } = this.deps;

        this.worker = new Worker(
            QUEUE_NAMES.FILE_PROCESS,
            async (job) => {
                this.fileProcessing(job.data);
            },
            { connection }
        );
    }

    private get prisma() { return this.deps.prisma; }
    private get auditLogRepository() { return this.deps.auditLogRepository; }
    private get fileProcessor() { return this.deps.fileProcessor; }
    private get fileRepository() { return this.deps.fileRepository; }
    private get neoSyncService() { return this.deps.neoSyncService; }
    private get databaseCacheRepository() { return this.deps.databaseCacheRepository; }

    getWorker() {
        return this.worker;
    }

    async fileProcessing(data: any) {
        // 1. 【判斷是否處理】: 
        //    - 檢查檔案是否已存在 (Hash check)？
        //    - 檢查該用戶是否有權限上傳到此路徑？
        const { sessionId, upload } = data;
        console.log('Starting file processing for upload:', upload);

        // 2. 【檔案保存】: 
        //    - 將暫存檔移至正式儲存空間 (S3 / Local Storage)。
        //    - 取得最終檔案路徑與 Meta Data。


        // 目標儲存路徑，根據 relativePath 還原結構
        // if (await archiveUtils.isArchiveFile('path')) {
        // Uncomment and refactor the archive handling logic here
        // } else {
        console.log('Processing regular file for upload ID:', upload.id);
        await this.otherFileHandler()(data);
        // }

        // 3. 【Prisma 寫入】:
        //    - 更新 File 表，記錄檔案大小、MIME Type、路徑。
        //    - 更新 Audit Log 狀態為 'FILE_SAVED'。
        // return { fileId: '...', path: '...' }; // 傳遞給 Parent Job


        // this.neoSyncService.triggerSync('file');
    }

    otherFileHandler() {
        return async (data: any) => {
            console.log('Processing other file for upload ID:', data);
            const result = await this.fileProcessor.processingFile(data.upload);

            const correlationId = data.upload.id;
            const { extensionId, ...rest } = result;

            const fileId = uuidv7();
            await this.prisma.$transaction(async (tx: any) => {
                // 步驟 A: 建立檔案主資料
                await this.fileRepository.create({
                    id: fileId,
                    isOriginal: true,
                    ...rest,
                    status: FileStatusSchema.enum.AVAILABLE,
                    fileExtension: { connect: { id: extensionId } },
                }, tx);

                await this.auditLogRepository.create({
                    correlationId,
                    status: ActionStatus.SUCCESS,
                    payload: { fileId },
                    severity: ACTION_REGISTRY['node_upload'].severity,
                    session: { connect: { id: data.sessionId } },
                    action: { connect: { code: 'node_upload' } },
                }, tx);

                // await this.databaseCacheRepository.set(
                //     `outbox:neo4j:file`,
                //     fileId,
                //     { action: 'CREATE_FILE_NODE', labels: ['public'] },
                //     0,
                //     tx
                // );
            });
        }
    }
}