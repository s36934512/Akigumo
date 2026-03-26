import { Upload } from '@tus/server';
import { createActor, fromPromise } from 'xstate';

import { cacheService } from '@core/infrastructure/cache/cache-manager';
import { ContextService } from '@core/context/context.service';
import { Paths } from '@core/paths';
import { DiskGuard } from '@shared/utils/disk-guard.utils';
import ItemQueryService from '@modules/item/domain/services/item-query.service';
import FileMutationService from '@modules/file/domain/services/file-mutation.service';

import { fileUploadMachine } from './file-upload.machine';
import { CheckDiskSpaceInput } from 'libs/contract/zod/file/v1/file-upload.zod';
import { FileStatus } from 'generated/prisma/client';
import FileQueryService from '@modules/file/domain/services/file-query.service';
import { th } from 'zod/v4/locales';

interface FileUploadOrchestratorDeps {
    itemQueryService: ItemQueryService;
    fileMutationService: FileMutationService;
    fileQueryService: FileQueryService;
    cacheService: typeof cacheService;
}

export default class FileUploadOrchestrator {
    private actors = new Map<string, ReturnType<typeof createActor>>();

    constructor(private deps: FileUploadOrchestratorDeps) { }

    private get itemQueryService() { return this.deps.itemQueryService; }
    private get cacheService() { return this.deps.cacheService; }
    private get fileMutationService() { return this.deps.fileMutationService; }
    private get fileQueryService() { return this.deps.fileQueryService; }

    private createUploadActor() {
        return fileUploadMachine.provide({
            actions: {
                logSuccess: () => console.log('完成！'),
                logError: ({ context, event }) => {
                    console.log('=== [logError Action 觸發] ===');
                    console.log('當前 Context:', context);
                    console.log('錯誤來源 Event:', event);

                    // 如果 event 是由 onError 觸發的，錯誤會在 event.error
                    if ('error' in event) {
                        console.error('具體錯誤原因:', event.error);
                    }
                },
            },
            actors: {
                checkDiskSpace: fromPromise(async ({ input }: { input: CheckDiskSpaceInput }) => {
                    return await DiskGuard.hasEnoughSpace(Paths.TMP_TUS, input.fileSize);
                }),
                recordFilePlaceholder: fromPromise(async ({ input }) => {

                    const fileExtension = await this.fileQueryService.getFileExtensionByType(input.mimetype); // 預先查詢檔案類型，確保有對應的檔案類型紀錄
                    if (!fileExtension?.id) {
                        console.warn(`未找到對應的檔案類型紀錄，MIME type: ${input.mimetype}，將使用預設類型`);
                        return false; // 可以選擇回傳 false 代表不需要建立占位紀錄，或是拋出錯誤讓流程終止
                    }

                    await ContextService.setContext(input, async () => {
                        console.log('=== [recordFilePlaceholder Actor] ===');
                        console.log('接收到的 Input:', input);
                        // 這裡應該呼叫 fileMutationService 在 Prisma 中建立檔案占位紀錄
                        const placeholderData = {
                            originalName: input.fileName,
                            size: BigInt(input.fileSize),
                            status: FileStatus.UPLOADING,
                            fileExtension: {
                                connect: { id: fileExtension.id }
                            }
                        };
                        console.log('準備建立檔案占位紀錄，資料:', placeholderData);
                        await this.fileMutationService.createFilePlaceholder(placeholderData);
                        console.log('檔案占位紀錄建立完成');
                    });
                }),
            }
        });
    }

    // 處理 POST_CREATE
    async initUpload(upload: Upload) {
        const ctx = ContextService.getContext(); // 獲取當前 ALS 內容
        if (!ctx?.userId || !ctx?.sessionId) {
            console.error('User ID or Session ID not found in context');
            return;
        }
        console.log('[FileUploadOrchestrator] initUpload called with context:', ctx, 'and upload:', upload);

        if (!upload.size) {
            console.error('Upload size is missing');
            return;
        }

        if (!upload.metadata?.filename) {
            console.error('Upload filename is missing in metadata');
            return;
        }

        if (!upload.metadata?.filetype) {
            console.error('Upload filetype is missing in metadata');
            return;
        }

        const machineWithDeps = this.createUploadActor();
        const actor = createActor(machineWithDeps, {
            input: {
                userId: ctx.userId,
                sessionId: ctx.sessionId,
                fileSize: upload.size,
                fileName: upload.metadata.filename,
                mimetype: upload.metadata.filetype,
            },
        });

        actor.subscribe((state) => {
            console.log('目前狀態:', state.value);
        });

        actor.start();
        this.actors.set(upload.id, actor);
        actor.send({ type: 'START_INIT' });
    }

    /**
     * 處理檔案上傳
     */
    // async handleUpload(upload: Upload): Promise<UploadFileResponse> {
    //     const userId = await this.getUserId();
    //     if (!userId) {
    //         throw new Error('User ID not found in context');
    //     }
    //     // [TODO]: 實作檔案上傳邏輯
    //     // 可呼叫 fileUploadService 進行檔案儲存
    //     // 可根據 request 內容與 userId 做權限檢查
    //     return {
    //         success: false,
    //         fileId: undefined,
    //         message: '尚未實作',
    //     };
    // }
}
