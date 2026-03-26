/**
 * @file Processor for FILE_SYNC_NODE action
 *
 * We use Neo4j MERGE so retries remain idempotent and do not create duplicate
 * graph nodes when a task is reprocessed after a partial failure.
 */

import { z } from '@hono/zod-openapi';
import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';
import { FILE_ACTIONS } from 'akigumo/modules/file/common/contract';
import { registerFileProcessor } from 'akigumo/modules/file/common/registry.helper';
import { syncFileNodesToGraph } from 'akigumo/services/graph-refinement-engine';
import {
    GRAPH_REFINEMENT_ENGINE_ACTIONS,
    GRAPH_REFINEMENT_ENGINE_AGGREGATE,
} from 'akigumo/services/graph-refinement-engine/contract';

import { SyncFilePayloadSchema } from './sync.schema';
import { FILE_INTEGRATION_ACTIONS } from '../../contract';

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

function isDerivedFile(metadata: unknown): boolean {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return false;
    }

    return (metadata as Record<string, unknown>).isDerived === true;
}

registerFileProcessor(
    FILE_INTEGRATION_ACTIONS.SYNC,
    SyncFilePayloadSchema,
    async (data, metadata) => {
        if (data.length === 0) {
            logger.warn({ label: 'FILE_SYNC' }, `No file IDs found in trace: ${metadata.traceId}`);
            return { synced: 0 };
        }

        const createdCount = await syncFileNodesToGraph(data);

        const fileIds = data.map((entry) => entry.fileId);
        const files = await prisma.file.findMany({
            where: { id: { in: fileIds } },
            select: {
                id: true,
                originalName: true,
                systemName: true,
                checksum: true,
                physicalPath: true,
                metadata: true,
            },
        });

        const graphOutboxRows = files
            .filter((file) => !isDerivedFile(file.metadata))
            .map((file) => ({
                aggregateType: GRAPH_REFINEMENT_ENGINE_AGGREGATE,
                aggregateId: file.id,
                correlationId: metadata.traceId,
                operation: GRAPH_REFINEMENT_ENGINE_ACTIONS.DISPATCH_GRAPH_TASK.code,
                payload: {
                    taskType: 'UPSERT_FILE_GRAPH',
                    fileId: file.id,
                    itemId: extractItemIdFromMetadata(file.metadata) ?? undefined,
                    originalName: file.originalName ?? file.systemName ?? undefined,
                    checksum: file.checksum ?? undefined,
                    physicalPath: file.physicalPath ?? undefined,
                    emittedAt: new Date().toISOString(),
                },
                status: 'PENDING' as const,
            }));

        if (graphOutboxRows.length > 0) {
            await prisma.outbox.createMany({ data: graphOutboxRows });
        }

        logger.info({ label: 'FILE_SYNC' }, `Synced ${createdCount} files in trace: ${metadata.traceId}`);

        return {
            synced: createdCount,
            queuedGraphRefinement: graphOutboxRows.length,
        };
    }
);

registerFileProcessor(
    FILE_ACTIONS.INTEGRATION_START_NOTIFY,
    z.any(),
    async (data) => {
        logger.info({ label: 'INTEGRATION_START_NOTIFY' }, `Received integration start notification for file ID: ${data.fileId}`);
        return data;
    }
);
