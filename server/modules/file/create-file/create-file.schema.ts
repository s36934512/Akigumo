import { z } from '@hono/zod-openapi';

// 這是核心，所有的欄位定義只在這裡出現一次
export const FileMasterSchema = z.object({
    // ID 類
    fileId: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    itemId: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    uploadId: z.string().optional().openapi({ example: '6bfaf7a24a5470d702202ce5601be1ac' }),
    sessionId: z.uuid(),
    correlationId: z.string(),

    // 檔案元數據
    originalName: z.string().min(1),
    fileName: z.string().min(1),
    filePath: z.string(),
    size: z.bigint().nonnegative(),
    offset: z.bigint().nonnegative(),
    checksum: z.string().optional(),
    mimeType: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),

    // 狀態與時間
    creationDate: z.iso.datetime().openapi({ example: '2024-01-01T12:00:00Z' }),
    error: z.any().nullable(),
    message: z.string().optional().nullable(),
});

export const CreateFileInputSchema = FileMasterSchema.pick({
    fileName: true,
    size: true,
    checksum: true,
    metadata: true,
    mimeType: true,
}).openapi('CreateFileInput');
export type CreateFileInput = z.infer<typeof CreateFileInputSchema>;


export const CreateFileTusResponseSchema = FileMasterSchema.pick({
    metadata: true,
    creationDate: true,
}).extend({
    id: FileMasterSchema.shape.fileId, // 重用定義
    size: z.coerce.bigint(),           // 特殊處理轉型
    offset: z.coerce.bigint(),
}).openapi('CreateFileTusResponse');
export type CreateFileTusResponse = z.infer<typeof CreateFileTusResponseSchema>;

// --- Action Input Schemas
// --- Intent 
export const SaveIntentInputSchema = FileMasterSchema.pick({
    fileName: true,
    size: true,
    checksum: true,
    metadata: true,
}).openapi('SaveIntentInput');
export type SaveIntentInput = z.infer<typeof SaveIntentInputSchema>;

// --- File
export const SaveFileInputSchema = FileMasterSchema.pick({
    fileId: true,
    originalName: true,
    metadata: true,
    uploadId: true,
}).openapi('SaveFileInput');
export type SaveFileInput = z.infer<typeof SaveFileInputSchema>;

// --- Wait Sync
export const WaitSyncInputSchema = FileMasterSchema.pick({
    fileId: true,
});
export type WaitSyncInput = z.infer<typeof WaitSyncInputSchema>;

export const CreateFileContextSchema = CreateFileInputSchema.extend({
    itemId: FileMasterSchema.shape.itemId.nullable(),
    fileId: FileMasterSchema.shape.fileId.nullable(),
    fileName: FileMasterSchema.shape.fileName.nullable(),
    filePath: FileMasterSchema.shape.filePath.nullable(),
    uploadId: FileMasterSchema.shape.uploadId.nullable(),
    error: FileMasterSchema.shape.error,
}).openapi('CreateFileContext');
export type CreateFileContext = z.infer<typeof CreateFileContextSchema>;


// --- 下面是專門為 Action 定義的 Payload，從 Master 挑選並命名
// --- InitializedFilePayloadSchema
export const InitializedFilePayloadSchema = FileMasterSchema.pick({
    fileId: true,
    itemId: true,
    mimeType: true,
}).extend({
    mimeType: FileMasterSchema.shape.mimeType.nonoptional(),
}).openapi('InitializedFilePayload');
export type InitializedFilePayload = z.infer<typeof InitializedFilePayloadSchema>;

export const InitializedFileAuditPayloadSchema = InitializedFilePayloadSchema;
export type InitializedFileAuditPayload = z.infer<typeof InitializedFileAuditPayloadSchema>;

export const InitializedFileGraphPayloadSchema = InitializedFilePayloadSchema;
export type InitializedFileGraphPayload = z.infer<typeof InitializedFileGraphPayloadSchema>;


// --- UploadedFilePayloadSchema
export const UploadedFilePayloadSchema = FileMasterSchema.pick({
    fileId: true,
}).openapi('UploadedFilePayload');
export type UploadedFilePayload = z.infer<typeof UploadedFilePayloadSchema>;

export const UploadedFileAuditPayloadSchema = UploadedFilePayloadSchema;
export type UploadedFileAuditPayload = z.infer<typeof UploadedFileAuditPayloadSchema>;

export const UploadedFileGraphPayloadSchema = UploadedFilePayloadSchema;
export type UploadedFileGraphPayload = z.infer<typeof UploadedFileGraphPayloadSchema>;


// ---ProcessFilePayloadSchema
export const ProcessFilePayloadSchema = FileMasterSchema.pick({
    fileId: true,
    mimeType: true,
}).extend({
    mimeType: FileMasterSchema.shape.mimeType.nonoptional(),
}).openapi('ProcessFilePayload');
export type ProcessFilePayload = z.infer<typeof ProcessFilePayloadSchema>;

export const ProcessFileAuditPayloadSchema = ProcessFilePayloadSchema;
export type ProcessFileAuditPayload = z.infer<typeof ProcessFileAuditPayloadSchema>;

export const ProcessFileGraphPayloadSchema = ProcessFilePayloadSchema;
export type ProcessFileGraphPayload = z.infer<typeof ProcessFileGraphPayloadSchema>;


// --- SyncFilePayloadSchema
export const SyncFilePayloadSchema = FileMasterSchema.pick({
    fileId: true,
}).openapi('SyncFilePayload');
export type SyncFilePayload = z.infer<typeof SyncFilePayloadSchema>;

export const SyncFileAuditPayloadSchema = SyncFilePayloadSchema;
export type SyncFileAuditPayload = z.infer<typeof SyncFileAuditPayloadSchema>;

export const SyncFileGraphPayloadSchema = SyncFilePayloadSchema;
export type SyncFileGraphPayload = z.infer<typeof SyncFileGraphPayloadSchema>;