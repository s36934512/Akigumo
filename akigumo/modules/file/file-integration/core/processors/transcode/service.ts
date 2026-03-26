/**
 * @file Business logic for FILE_TRANSCODE action
 *
 * Converts the original upload to a WebP derivative and persists the
 * new file record in PostgreSQL.
 *
 * Why Promise.allSettled?
 * A single image failure must not abort the entire batch; each rejected item
 * is logged individually while successful conversions are still persisted.
 */

import { z } from '@hono/zod-openapi';
import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';
import Paths from 'akigumo/kernel/paths';
import {
    ITEM_FILE_SYNC_ACTIONS,
    ITEM_FILE_SYNC_AGGREGATE
} from 'akigumo/modules/item/item-file-sync/contract';
import {
    GRAPH_REFINEMENT_ENGINE_ACTIONS,
    GRAPH_REFINEMENT_ENGINE_AGGREGATE,
} from 'akigumo/services/graph-refinement-engine/contract';
import { calculateChecksum } from 'akigumo/shared/utils';
import { getFileExtensionId } from 'akigumo/shared/utils/seed-file-extension';
import { FileStatus } from 'generated/prisma/client';
import sharp from 'sharp';

import { TranscodePayload, TranscodeResult } from './schema';

const ItemIdSchema = z.uuid();

function extractItemIdFromMetadata(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return null;
    }

    const value = (metadata as Record<string, unknown>).itemId;
    if (typeof value !== 'string') {
        return null;
    }

    const parsed = ItemIdSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
}

/**
 * Convert the original file at basePath to a WebP derivative.
 */
export async function convertToWebp(basePath: string): Promise<TranscodeResult> {
    const sourcePath = Paths.concat(basePath, 'original');
    const targetPath = Paths.concat(basePath, 'compressed.webp');

    const info = await sharp(sourcePath).webp().toFile(targetPath);
    const checksum = await calculateChecksum(targetPath);

    return {
        id: Paths.basename(basePath),
        size: BigInt(info.size),
        checksum,
    };
}

/**
 * Run the full transcode pipeline: convert to WebP, then persist derived records.
 */
export async function transcodeFile(
    data: TranscodePayload,
    metadata: { traceId: string },
) {
    const fileIds = [data.fileId];
    const settledResults = await Promise.allSettled(
        fileIds.map(() => convertToWebp(data.basePath)),
    );

    settledResults.forEach((res, index) => {
        if (res.status === 'rejected') {
            logger.error(
                {
                    label: 'FILE_TRANSCODE',
                    // Promise.allSettled preserves ordering, so index maps to the source ID.
                    fileId: fileIds[index],
                    traceId: metadata.traceId,
                    error: res.reason,
                },
                `Transcode failed for file: ${fileIds[index]}`,
            );
        }
    });

    const successfulTasks = settledResults
        .filter((res): res is PromiseFulfilledResult<TranscodeResult> => res.status === 'fulfilled')
        .map((res) => res.value);

    const extensionId = await getFileExtensionId('webp', 'image/webp');
    if (successfulTasks.length === 0) {
        return [];
    }

    return prisma.$transaction(async (tx) => {
        const sourceFile = await tx.file.findUnique({
            where: { id: data.fileId },
            select: {
                id: true,
                metadata: true,
            },
        });
        if (!sourceFile) {
            throw new Error(`SOURCE_FILE_NOT_FOUND: ${data.fileId}`);
        }

        const sourceItemId = extractItemIdFromMetadata(sourceFile.metadata);

        const createdFiles = await tx.file.createManyAndReturn({
            data: successfulTasks.map((task) => ({
                systemName: 'compressed.webp',
                // physicalPath points to the exact location written by convertToWebp,
                // so file-serve can locate the file without guessing.
                physicalPath: Paths.concat(data.basePath, 'compressed.webp'),
                size: task.size,
                checksum: task.checksum,
                status: FileStatus.AVAILABLE,
                fileExtensionId: extensionId,
                metadata: {
                    originalFileId: task.id,
                    itemId: sourceItemId,
                    isDerived: true,
                },
            })),
        });

        const outboxRows = createdFiles.flatMap((file) => {
            const rows: Array<Record<string, unknown>> = [
                {
                    aggregateType: GRAPH_REFINEMENT_ENGINE_AGGREGATE,
                    aggregateId: file.id,
                    correlationId: metadata.traceId,
                    operation: GRAPH_REFINEMENT_ENGINE_ACTIONS.DISPATCH_GRAPH_TASK.code,
                    payload: {
                        taskType: 'UPSERT_FILE_GRAPH',
                        fileId: file.id,
                        itemId: sourceItemId ?? undefined,
                        sourceFileId: sourceFile.id,
                        lineageRelation: 'DERIVED_FROM',
                        checksum: file.checksum ?? undefined,
                        originalName: file.systemName ?? undefined,
                    },
                    status: 'PENDING' as const,
                },
            ];

            if (sourceItemId) {
                rows.unshift({
                    aggregateType: ITEM_FILE_SYNC_AGGREGATE,
                    aggregateId: sourceItemId,
                    correlationId: metadata.traceId,
                    operation: ITEM_FILE_SYNC_ACTIONS.SWITCH_PRIMARY_FILE.code,
                    payload: {
                        itemId: sourceItemId,
                        newFileId: file.id,
                        markOldLogicalOnly: true,
                        itemPath: sourceItemId,
                        itemIsFolder: false,
                    },
                    status: 'PENDING' as const,
                });
            }

            return rows;
        });

        if (outboxRows.length > 0) {
            await tx.outbox.createMany({ data: outboxRows as any[] });
        }

        return createdFiles;
    });
}
