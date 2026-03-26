import { z } from 'zod';


const ScannedFileMetadataSchema = z.object({
    tempScanId: z.uuid(),
    path: z.string().min(1),
    batchId: z.uuid(),
});


export const ScannedFileSchema = z.object({
    name: z.string(),
    size: z.coerce.string(),
    metadata: ScannedFileMetadataSchema,
});

export type ScannedFile = z.infer<typeof ScannedFileSchema>;


export const ScannedFilesArraySchema = z.array(ScannedFileSchema);

export type ScannedFilesArray = z.infer<typeof ScannedFilesArraySchema>;


export const FileIdAssignedSchema = z.object({
    tempScanId: z.uuid(),
    fileId: z.uuid(),
    batchId: z.uuid(),
});

export type FileIdAssigned = z.infer<typeof FileIdAssignedSchema>;


export const FileIdAssignedArraySchema = z.array(FileIdAssignedSchema);

export type FileIdAssignedArray = z.infer<typeof FileIdAssignedArraySchema>;



