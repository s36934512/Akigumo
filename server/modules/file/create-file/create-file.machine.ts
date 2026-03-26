import { setup, assign, fromPromise, waitFor } from 'xstate';
import {
    CreateFileContext,
    CreateFileInput,
    SaveFileInput,
    SaveFileInputSchema,
    SaveIntentInput,
    SaveIntentInputSchema,
    WaitSyncInputSchema
} from './create-file.schema';
import { prisma } from '@server/core/db/prisma';
import { FileStatus, ItemStatus, ItemType } from 'generated/prisma/enums';
import { fileTypeFromFile } from 'file-type';
import mime from 'mime-types';
import { getFileExtensionId } from '@server/scripts/seed-file-extension';
import Paths from '@server/core/paths';
import fs from 'fs-extra';
import { waitProcActor } from './actors/wait-proc.actor';
import { waitSyncActor } from './actors/wait-sync.actor';
import { DiskGuard } from './disk-guard.utils';
import { AggregateType, FILE_ACTIONS } from './create-file.contract';

export const createFileMachine = setup({
    types: {
        input: {} as CreateFileInput,
        context: {} as CreateFileContext,
    },
    guards: {
        isProcessable: ({ event }) => {
            return event.output?.needsProcessing ?? false;
        }
    },
    actions: {
        logSuccess: () => console.log('完成！'),
        logError: ({ context, event }) => {
            console.log('=== [createFile logError Action 觸發] ===');
            console.log('當前 Context:', context);
            console.log('錯誤來源 Event:', event);

            if ('error' in event) {
                console.error('具體錯誤原因:', event.error);
            }
        },
    },
    actors: {
        // 'SAVE_INTENT': fromPromise(async ({ input }: { input: SaveIntentInput }) => {
        //     const { originalName, size, checksum, metadata } = input;

        //     const hasEnoughSpace = await DiskGuard.hasEnoughSpace(Paths.TMP_TUS, Number(size));
        //     if (!hasEnoughSpace) {
        //         throw new Error('磁碟空間不足，無法上傳檔案');
        //     }

        //     return await prisma.$transaction(async (tx) => {
        //         const file = await tx.file.create({
        //             data: {
        //                 originalName: originalName,
        //                 size: size,
        //                 checksum: checksum,
        //                 isOriginal: true,
        //                 metadata: metadata,
        //                 status: FileStatus.UPLOADING,
        //                 fileExtension: {
        //                     connect: { code: 'bin' }
        //                 }
        //             }
        //         });
        //         const item = await tx.item.create({
        //             data: {
        //                 title: originalName,
        //                 type: ItemType.FILE_CONTAINER,
        //                 status: ItemStatus.PROCESSING,
        //             }
        //         });
        //         await tx.outbox.create({
        //             data: {
        //                 aggregateType: AggregateType,
        //                 operation: FILE_ACTIONS.INITIALIZED.code,
        //                 payload: { fileId: file.id, itemId: item.id },
        //             }
        //         });

        //         return { fileId: file.id, itemId: item.id };
        //     });
        // }),
        'SAVE_FILE': fromPromise(async ({ input }: { input: SaveFileInput }) => {
            const { fileId, originalName, uploadId } = input;
            if (!fileId) throw new Error('File ID is missing in input');

            const jsonName = Paths.changeExt(fileId, "json");
            const sourcePath = Paths.concat('TMP_TUS', fileId);
            const sourceJsonPath = Paths.concat('TMP_TUS', jsonName);
            const targetDir = Paths.concat('STORAGE_ORIGINALS', fileId);
            const targetPath = Paths.concat(targetDir, "original");
            const targetJsonPath = Paths.concat(targetDir, jsonName);

            await fs.move(sourcePath, targetPath, { overwrite: true });
            await fs.move(sourceJsonPath, targetJsonPath, { overwrite: true });

            const result = await fileTypeFromFile(targetPath);
            const finalExt = result?.ext || Paths.ext(targetPath) || 'bin';
            const finalMime = result?.mime || mime.lookup(targetPath) || 'application/octet-stream';
            const fileExtensionId = await getFileExtensionId(finalExt, finalMime);

            await prisma.$transaction(async (tx) => {
                await tx.file.update({
                    where: { id: fileId },
                    data: {
                        status: FileStatus.PROCESSING,
                        fileExtension: {
                            connect: { id: fileExtensionId }
                        }
                    }
                });
                const item = await tx.item.create({
                    data: {
                        title: originalName,
                        type: ItemType.FILE_CONTAINER,
                        status: ItemStatus.ACTIVE,
                    }
                });
                await tx.outbox.create({
                    data: {
                        aggregateType: AggregateType,
                        operation: FILE_ACTIONS.UPLOADED.code,
                        payload: {
                            fileId: fileId,
                            itemId: item.id,
                            mimeType: finalMime,
                        },
                    }
                });
            });

            return { success: true, needsProcessing: true };
        }),
        'WAIT_PROC': waitProcActor,
        'WAIT_SYNC': waitSyncActor,
    }
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QDMCWAbMBhATmAhgC6oD2AdgHQDKAggGoCSAcgOID6zAKgKJOcDEEcmAqoyANxIBrEWky4CxctXrN2XXpwRjJAYyKkyAbQAMAXVNnEoAA4lYqJWWsgAHogBMAVgCcFAOwAbB4ALD4eJv4AzIE+AByBIQA0IACeniZxFCaBuXFRXv6+-nEJAL5lKXLYeAbKtIysHHya-GA4OCQ4FDboRMhdALYU1Qp1lA1qzTx82hIk+k6Wli52Dk4u7gjefkGh4ZEx8Ykp6QhxAIwUUSa3Fya+JiEXgSUVVRg1ioYUAKoACgAZADyNAAImp+ACQeC2FhgQBZIHcHgrJAgNaOQybRC+QIBLy3LxxHw+KLhLweU6IKL+DwUHy3TIeQK3Uq0wLvECjWpOP5A0EQ1hQgWw7gADX+DAAStwwWjbPYseQcQg8QSiSSyRSqWlPB56T4iiZvFELrSWU8uTzvvVVE0AGIMQHcQTCUTzGQjT5jPmTR3O7hzPTjZbmVZKjborb3C5ea6Ep6UuIhFPk6kIML4umE-xhEIlSLWn28n7+9hOl1usgiHTSWQl20Te0VwPBhah8xGC5WdGYqOgGMmOMJ24hZOpkLpvUIApRbLGum3eI+QJeYvyUt2xqtqvtTrdXr9IbezdNlQ7tiVoN1xaGMO9xXrbHRxCx+MFMcTtM+DP+Edss8XivAaZIbl84wUP80rAlg3BUFQkJCDWHqSF6NqQdBsHwYhrDtne5APhGz4qq+CBxuS1zBAW-j+D4hIkv4GYFvGIRMl4Fzmh4KZkiE4G+j8WFwQhkL7l0PR9IQAw4MMGF8kJOFqPhnYWOGfaRi+g5vl4lExKEtF0QxRoZl4YQUOOKYeEE5qsuO-FbpQCkicKriwIQRAiPgyCEO0AAUNxMiYACU-ByYJMHCbhLAKhiGmkVp5E6X4ek0YZmTGTO6pximdGhBEsT+PZ55UAAmkwWBIe6dboY2kGleVSm3ipMX9ppbhvuE+JeImU5REczyBBmc4MpkIRWYEJIeFEBpFXVZUVcKYmHpJ0mybVfrzY18wEcYXZqU+yrOGRFydRQ3Vjn1-UvMxNwUKy+TZTpESMnxXJkCQEBwC4YXxbFJFHQlAC0g0zsDs1+i20yaMRh2qmNGZkmdA2MiaFwlMBcTgz80KCmoMMDu1mamQE7H5E8gQxDkGageZPgvGS00XJcHFY9uUzXvjbVbHEmQMhc3hjYkQS0kxM5RGZrK3BTsTAWaPis45EWKawnO-TG00hOZcR5nEBqRE8zH-gy3iRKZJT868CvUJtKvqf9qpox4VzPCbwQJAaQ1TtcJseKS0QhBTmOVNy61lr8WCRarAOE073EUO73W63EHGkiDZwFFc3gphcqbRJSsRRFbDo0IGYJR6qsdZAnxLcSnq7MfzFBZ2xVlhOS00VBUQA */
    id: 'fileCreation',
    initial: 'UPLOADING',
    context: ({ input }) => ({
        ...input,
        itemId: null,
        fileId: null,
        fileName: null,
        filePath: null,
        error: null,
    }),
    states: {
        // 1. 意圖階段：在 DB 建立初步記錄 (INITIALIZED)
        // 'SAVING_INTENT': {
        //     invoke: {
        //         src: 'SAVE_INTENT',
        //         input: ({ context }) => (SaveIntentInputSchema.parse(context)),
        //         onDone: {
        //             target: 'UPLOADING',
        //             actions: assign({
        //                 fileId: ({ event }) => event.output.fileId,
        //                 itemId: ({ event }) => event.output.itemId,
        //             })
        //         },
        //         onError: {
        //             target: 'FAILED',
        //             actions: assign({ error: ({ event }) => String(event.error) })
        //         }
        //     }
        // },
        // 2. 上傳階段：等待 tus 完成上傳
        // 這裡通常由 tus hook 觸發一個 'UPLOAD_COMPLETE' 事件給這個 Actor
        'UPLOADING': {
            on: {
                UPLOAD_COMPLETE: {
                    target: 'SAVING_FILE'
                },
                UPLOAD_EXPIRED: 'FAILED'
            },
            after: {
                36000000: 'FAILED' // 10小時超時補償 (防止上傳過程中斷)
            }
        },

        // 3. 持久化階段：更新檔案狀態為 UPLOADED 並寫入 Outbox 任務
        'SAVING_FILE': {
            invoke: {
                src: 'SAVE_FILE',
                input: ({ context }) => (SaveFileInputSchema.parse(context)),
                onDone: [
                    {
                        guard: 'isProcessable',
                        target: 'PROCESSING'
                    },
                    { target: 'SYNCING' }
                ],
                onError: 'FAILED'
            }
        },

        // 4. 異步等待階段：利用 RxJS 監聽 Worker 執行結果
        'PROCESSING': {
            invoke: {
                src: 'WAIT_PROC',
                input: ({ context }) => (SaveFileInputSchema.parse(context)),
                onDone: {
                    target: 'SYNCING',
                },
                onError: 'FAILED'
            },
            after: {
                300000: 'FAILED' // 5分鐘超時補償 (防止 Worker 掛掉)
            }
        },

        // 5. 圖譜同步階段：最後寫入 Neo4j 關係
        'SYNCING': {
            invoke: {
                src: 'WAIT_SYNC',
                input: ({ context }) => (WaitSyncInputSchema.parse(context)),
                onDone: 'SUCCESS',
                onError: 'FAILED'
            }
        },
        'SUCCESS': { type: 'final' },
        'FAILED': {
            entry: 'logError',
            // 可在此加入重試邏輯或手動恢復狀態
        }
    }
});