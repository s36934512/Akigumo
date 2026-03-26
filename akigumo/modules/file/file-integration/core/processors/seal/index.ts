/**
 * @file Registers the FILE_SEAL processor with the kernel registry.
 *
 * Binding happens at module-load time so outbox workers can resolve the
 * handler deterministically across retries and process restarts.
 */

import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';
import { Paths } from 'akigumo/kernel/paths';
import { registerFileProcessor } from 'akigumo/modules/file/common/registry.helper';
import { calculateChecksum } from 'akigumo/shared/utils/integrity.tool';

import { SealFilePayloadSchema as PayloadSchema } from './schema';
import { analyzeFile, resolveStrategyKey } from './service';
import { FILE_CATEGORY_STRATEGIES, FILE_INTEGRATION_ACTIONS } from '../../../contract';

registerFileProcessor(
    FILE_INTEGRATION_ACTIONS.SEAL,
    PayloadSchema,
    async (data, metadata) => {
        const { fileId, fileName, checksum, basePath } = data;

        const originalFilePath = Paths.concat(basePath, 'original');
        const analysis = await analyzeFile(originalFilePath, fileName);

        const actualChecksum = await calculateChecksum(originalFilePath);
        if (actualChecksum !== checksum) {
            logger.warn(
                { label: 'Seal', fileId, traceId: metadata.traceId },
                `Checksum mismatch for file ${fileId} in trace ${metadata.traceId}`,
            );
        }

        const strategy = FILE_CATEGORY_STRATEGIES[resolveStrategyKey(analysis.categoryCode)];

        await prisma.file.update({
            where: { id: fileId },
            data: {
                fileExtensionId: analysis.extensionId,
                checksum: actualChecksum,
                physicalPath: originalFilePath,
            },
        });

        return {
            fileId,
            strategy: {
                shouldUncompress: strategy.shouldUncompress,
                shouldTranscode: strategy.shouldTranscode,
            },
            mimeType: analysis.mimeType,
            fileCategory: analysis.categoryCode,
            basePath,
        };
    }
);
