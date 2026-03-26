/**
 * @file Business logic for FILE_SEAL action
 *
 * SEAL bridges raw TUS bytes and structured workflow state:
 * 1. Probe the file to detect its real extension and MIME type.
 * 2. Compute the authoritative SHA-256 checksum for integrity validation.
 * 3. Persist extension + checksum to PostgreSQL before the machine branches.
 * 4. Return the processing strategy so the machine can route without an extra
 *    DB round-trip.
 *
 * Why probe and persist in one function?
 * Moving the file and probing its type are tightly coupled; probing a file
 * that has not yet been relocated would read stale data.
 */
import { prisma } from 'akigumo/db/prisma';
import Paths from 'akigumo/kernel/paths';
import { getFileExtensionId } from 'akigumo/shared/utils/seed-file-extension';
import { fileTypeFromFile } from 'file-type';
import mime from 'mime-types';

import { ProbeResult } from './schema';
import { FILE_CATEGORY_STRATEGIES } from '../../../contract';

export function resolveStrategyKey(categoryCode: string | undefined): keyof typeof FILE_CATEGORY_STRATEGIES {
    const normalized = (categoryCode ?? '').trim().toUpperCase();

    if (normalized === 'IMAGE') return 'IMAGE';
    if (normalized === 'ARCHIVE') return 'ARCHIVE';
    if (normalized === 'VIDEO') return 'VIDEO';
    if (normalized === 'AUDIO') return 'AUDIO';
    if (normalized === 'DOCUMENT' || normalized === 'DOC') return 'DOC';
    if (normalized === 'OTHER' || normalized === 'OTHERS') return 'OTHERS';

    return 'OTHERS';
}

/**
 * Analyze one file and return strategy signals for downstream steps.
 */
export async function analyzeFile(path: string, fileName: string): Promise<ProbeResult> {
    const result = await fileTypeFromFile(path);

    const finalExt = result?.ext || Paths.ext(fileName) || 'bin';
    const finalMime = result?.mime || mime.lookup(fileName) || 'application/octet-stream';

    const extensionId = await getFileExtensionId(finalExt, finalMime);

    const extension = await prisma.fileExtension.findUnique({
        where: { id: extensionId },
        include: { category: true },
    });

    return {
        extensionId,
        mimeType: finalMime,
        categoryCode: extension?.category.code || 'OTHERS',
    };
}
