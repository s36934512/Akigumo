/**
 * @file Business logic for FILE_UNCOMPRESS action
 *
 * Archive extraction is delegated to a Python helper so the processor stays
 * thin; it only logs progress boundaries and surfaces failures back to the
 * state machine.
 *
 * Why execFile over exec?
 * execFile avoids shell injection risks since scriptPath/archivePath are
 * internally constructed and never derived from user input.
 */

import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';

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
import { getFileExtensionId } from 'akigumo/shared/utils/seed-file-extension';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs-extra';
import { FileStatus } from 'generated/prisma/client';

import { UncompressPayload } from './schema';

const execFileAsync = promisify(execFile);
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

async function listFilesRecursively(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await listFilesRecursively(fullPath)));
            continue;
        }
        if (entry.isFile()) {
            results.push(fullPath);
        }
    }

    return results;
}

async function extractArchive(fileId: string) {
    const archivePath = Paths.concat('TMP_PROCESS', fileId, 'original');
    const outputDir = Paths.concat('TMP_PROCESS', fileId, 'extracted');
    const scriptPath = Paths.concat('ROOT', 'akigumo', 'shared', 'utils', 'utils_py', 'extract_archive.py');

    await fs.ensureDir(outputDir);

    const detectedType = await fileTypeFromFile(archivePath);
    const detectedExt = detectedType?.ext ? `.${detectedType.ext.toLowerCase()}` : '';
    if (detectedExt !== '.zip' && detectedExt !== '.rar') {
        throw new Error(`Unsupported archive format: ${detectedExt || 'unknown'}`);
    }

    const normalizedArchivePath = Paths.concat('TMP_PROCESS', fileId, `archive${detectedExt}`);
    await fs.copy(archivePath, normalizedArchivePath, { overwrite: true });

    // Keep python binary configurable for local/dev-container differences.
    const pythonCommand = process.env.PYTHON_BIN || 'python3';
    try {
        await execFileAsync(pythonCommand, [scriptPath, normalizedArchivePath, outputDir]);
    } finally {
        await fs.remove(normalizedArchivePath);
    }

    const absoluteFiles = await listFilesRecursively(outputDir);
    const extractedFiles = absoluteFiles
        .map((absolutePath) => path.relative(outputDir, absolutePath))
        .sort();

    return { fileId, outputDir, extractedFiles };
}

/**
 * Extract the archive and persist derived file records to PostgreSQL.
 */
export async function uncompressFile(
    data: UncompressPayload,
    metadata: { traceId: string },
) {
    const { fileId } = data;

    logger.info(
        { label: 'FILE_UNCOMPRESS', fileId, traceId: metadata.traceId },
        'Start extracting archive file',
    );

    const result = await extractArchive(fileId);
    const fileExtensionId = await getFileExtensionId('bin');
    const sourceFile = await prisma.file.findUnique({
        where: { id: fileId },
        select: { metadata: true },
    });
    const sourceItemId = extractItemIdFromMetadata(sourceFile?.metadata);

    const files = await prisma.$transaction(async (tx) => {
        const createdFiles = await tx.file.createManyAndReturn({
            data: result.extractedFiles.map((relativePath) => ({
                systemName: Paths.basename(relativePath),
                size: BigInt(0),
                checksum: '',
                status: FileStatus.AVAILABLE,
                fileExtensionId,
                metadata: {
                    originalFileId: fileId,
                    itemId: sourceItemId,
                    isDerived: true,
                    extractedFiles: result.extractedFiles,
                },
            })),
        });

        if (sourceItemId && createdFiles.length > 0) {
            const primaryFile = createdFiles[0];

            await tx.outbox.create({
                data: {
                    aggregateType: ITEM_FILE_SYNC_AGGREGATE,
                    aggregateId: sourceItemId,
                    correlationId: sourceItemId,
                    operation: ITEM_FILE_SYNC_ACTIONS.SWITCH_PRIMARY_FILE.code,
                    payload: {
                        itemId: sourceItemId,
                        newFileId: primaryFile.id,
                        markOldLogicalOnly: false,
                        itemPath: sourceItemId,
                        itemIsFolder: false,
                    },
                    status: 'PENDING',
                },
            });
        }

        if (createdFiles.length > 0) {
            await tx.outbox.createMany({
                data: createdFiles.map((file) => ({
                    aggregateType: GRAPH_REFINEMENT_ENGINE_AGGREGATE,
                    aggregateId: file.id,
                    correlationId: metadata.traceId,
                    operation: GRAPH_REFINEMENT_ENGINE_ACTIONS.DISPATCH_GRAPH_TASK.code,
                    payload: {
                        taskType: 'UPSERT_FILE_GRAPH',
                        fileId: file.id,
                        itemId: sourceItemId ?? undefined,
                        sourceFileId: fileId,
                        lineageRelation: 'EXTRACTED_FROM',
                        originalName: file.systemName ?? undefined,
                        checksum: file.checksum ?? undefined,
                    },
                    status: 'PENDING' as const,
                })),
            });
        }

        return createdFiles;
    });

    await Promise.all(
        files
            .filter((f) => f.systemName)
            .map((f) => {
                const sourcePath = Paths.concat(result.outputDir, f.systemName!);
                const targetPath = Paths.concat(result.outputDir, f.id, 'original');
                return fs.move(sourcePath, targetPath, { overwrite: true });
            }),
    );

    logger.info(
        {
            label: 'FILE_UNCOMPRESS',
            fileId,
            extractedCount: result.extractedFiles.length,
            traceId: metadata.traceId,
        },
        'Archive extraction finished',
    );

    return {
        fileId: result.fileId,
        outputDir: result.outputDir,
        files,
    };
}
