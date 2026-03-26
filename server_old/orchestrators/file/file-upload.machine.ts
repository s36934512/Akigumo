import { FileUploadMachineInput, FileUploadContext } from 'libs/contract/zod/file/v1/file-upload.zod';
import { createMachine, assign } from 'xstate';

export const fileUploadMachine = createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QDMCWAbMBVADug9gIYQB0qEmAxAMoAqAggEq0D6AkgHJu0DaADAF1EoHPlioALqnwA7YSAAeiAMx8SADgDsAFgCc65QDYATAEZlAVgsmLAGhABPFcc0lNu05pfLNFzeu0LAF8g+zRMXAJiEgBjAAswGIBrVBkoABFUWCTKCFkwMhkAN3wkgvDsPCJSeMSUtMzshFSSmMIpWX4BLvlRcQ65JEVEAFptZRIPYws+VRNDQwt1O0dEC0DJhc1TPj9lU211ELCMSqiahOTUjKycvJkCltLy08jq2Mv6m6antoGunimIRDPqSaSDUBKBDTbQkPgeLSmYz6azKYz2JwISzGEjaYwuKzKHyGXQ6Y4gCpvaK1K4NW6UMAAJ0Z+EZJDw7WQrIAtiRKVVqZ9ro0ks1ivg-uCAYJemIwbJ5FDjPCSMotHp4VpNNrtRjEGYcWZDJo+AZdGqLGjjOT+ecSIzEqyINdcvlCiUynzXgLSA6Yk7rmLWu0pYIeiC5QNFYhFrpcXwTAFPOpDJZTHqENos5NVJa+C5TJ5lFmbd67X6A2kGczWez0JyeV6Ij77Y7Gc60kGJSHOmGZRH+uDo5ntK5fAYsynNKm+DoM4tTCQrKP1NMdjpjaXm3aAK4+l0AMU4bGoAAkWFgAAoAGQA8vR0uGRJGh0MoUmSAaLMZtKYDAYM0LWFzSJE18x-dQpy3M53hwFkYjgcQq3uR5xU9W1YPgxDA1+HsZGlYFn0HBU30QJFtDUZEfF0cYEXhdNVgQTwlxmBMfATb8TW0aCqVIOCJWwqsmRZNkOQkLlGV5DDon4hDYCQqAu0lXtun7Ij5QhYYmJ-NRdBsCijHUGjR0A1QSEWPg+F-X9jRo2cQlCEAZHwCA4HkaSIFlYjNKhEYPEmJEZjmYwFiWFZMRGEk3D0GjLV0b8KN0HiW3ITAvI04c8QzH8Jm0LZTH0PQkVnYJHI8j46mFW50qjUiED4DNxgsXF8sKqYSuS8s2w7KAatfSFRlMQwSELdVC10eLjR-ecDiXIbtg8AqTSMzr3j3c5rj6kiBoQbZms8GYht-S1U0MQDTGa2YiWNQxR2nPKkrKstMIE+TNoHDK6p2ZUNF8fNvz4HZV3CxB-NTIk-G1Y1VDy1bqXwbk8DACRIC2nyyPGdRP2mKzCx8axPAzdRF1USyrOVKwlgOOHSGQQhTk8j7ap2g41WxmZf3MXxDEJxizDjYwiSMVjNGF6YHKCIA */
    id: 'fileUpload',
    initial: 'idle',
    types: {} as {
        input: FileUploadMachineInput;
        context: FileUploadContext;
    },
    context: ({ input }) => ({
        ...input,
        fileId: null, // Prisma 中的 ID
        error: null,
    }),
    states: {
        idle: {
            on: { START_INIT: 'checkingDisk' }
        },
        checkingDisk: {
            invoke: {
                src: 'checkDiskSpace',
                input: ({ context }) => ({
                    fileSize: context.fileSize
                }),
                onDone: [
                    {
                        guard: ({ event }) => event.output === true,
                        target: 'recording',
                    },
                    {
                        target: 'failed',
                        actions: assign({ error: () => '磁碟空間不足' })
                    }
                ],
                onError: {
                    target: 'failed',
                    actions: assign({ error: ({ event }) => String(event.error) })
                }
            }
        },
        recording: {
            invoke: {
                src: 'recordFilePlaceholder',
                input: ({ context }) => ({
                    fileName: context.fileName,
                    fileSize: context.fileSize,
                    mimetype: context.mimetype,
                    userId: context.userId,
                    sessionId: context.sessionId,
                }),
                onDone: 'uploading',
                onError: {
                    target: 'failed',
                    actions: assign({ error: ({ event }) => String(event.error) })
                }
            }
        },
        uploading: {
            // 這裡對應 TUS 正在傳輸的過程
            on: { FINISH_UPLOAD: 'processing' }
        },
        processing: {
            invoke: {
                src: 'runProcessors', // 這裡跑 Checksum, Neo4j Sync 等
                onDone: 'completed',
                onError: {
                    target: 'failed',
                    actions: assign({ error: ({ event }) => String(event.error) })
                }
            }
        },
        completed: { type: 'final' },
        failed: {
            entry: 'logError'
        }
    }
});