/**
 * @file Payload schemas for item-file sync module.
 *
 * Schemas are shared by factory and processor to enforce stable contracts
 * between PostgreSQL outbox writes and worker execution.
 */

import { z } from '@hono/zod-openapi';
import { FileStatus, ItemStatus, ItemType } from 'generated/prisma/enums';

export const CreateItemInputSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    type: z.enum(ItemType),
    status: z.enum(ItemStatus),
    publishedTime: z.coerce.date().optional(),
});

export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;

export const CreateFileInputSchema = z.object({
    originalName: z.string().optional(),
    systemName: z.string().optional(),
    physicalPath: z.string().optional(),
    size: z.bigint().optional(),
    checksum: z.string().optional(),
    isOriginal: z.boolean().default(false),
    metadata: z.record(z.string(), z.any()).optional(),
    status: z.enum(FileStatus),
    fileExtensionId: z.number().int().positive(),
});

export type CreateFileInput = z.infer<typeof CreateFileInputSchema>;

export const SwitchPrimaryFilePayloadSchema = z.object({
    itemId: z.uuid(),
    newFileId: z.uuid(),
    markOldLogicalOnly: z.boolean().default(false),
    itemPath: z.string().optional(),
    itemIsFolder: z.boolean().optional(),
});

export type SwitchPrimaryFilePayload = z.infer<typeof SwitchPrimaryFilePayloadSchema>;

export const CreateItemFileBundleSchema = z.object({
    item: CreateItemInputSchema,
    file: CreateFileInputSchema,
});

export type CreateItemFileBundle = z.infer<typeof CreateItemFileBundleSchema>;

export const SwitchPrimaryFileResultSchema = z.object({
    switched: z.boolean(),
    oldFileIds: z.array(z.uuid()),
    newFileId: z.uuid(),
});

export type SwitchPrimaryFileResult = z.infer<typeof SwitchPrimaryFileResultSchema>;

export const PrimaryFileNodeSchema = z.object({
    id: z.uuid(),
    checksum: z.string().nullable().optional(),
    physicalPath: z.string().nullable().optional(),
    storageStatus: z.string().nullable().optional(),
});

export type PrimaryFileNode = z.infer<typeof PrimaryFileNodeSchema>;
