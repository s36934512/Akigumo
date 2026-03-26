/**
 * @file Processor that bridges outbox jobs to Python graph worker queue.
 *
 * The processor only serializes payload to Redis list and returns quickly,
 * keeping the TypeScript worker path lightweight.
 */

import path from 'path';

import { logger } from 'akigumo/db/pino';
import { redis } from 'akigumo/db/redisClient';

import {
    DispatchGraphTaskPayload,
    DispatchGraphTaskResult,
} from '../schema';

const GRAPH_TASK_QUEUE = process.env.FILE_GRAPH_TASK_QUEUE || 'graph_tasks';

function normalizeExtension(input: DispatchGraphTaskPayload): string {
    if (input.extension && input.extension.trim().length > 0) {
        return input.extension.replace(/^\./, '').toLowerCase();
    }

    if (!input.originalName) {
        return '';
    }

    return path.extname(input.originalName).replace(/^\./, '').toLowerCase();
}

export async function dispatchPythonGraphTask(
    data: DispatchGraphTaskPayload,
    metadata: { traceId: string },
): Promise<DispatchGraphTaskResult> {
    const task = {
        taskVersion: data.taskVersion ?? 1,
        taskType: data.taskType ?? 'UPSERT_FILE_GRAPH',
        fileId: data.fileId,
        itemId: data.itemId,
        parentChain: data.parentChain,
        originalName: data.originalName,
        extension: normalizeExtension(data),
        checksum: data.checksum,
        physicalPath: data.physicalPath,
        sourceFileId: data.sourceFileId,
        originalSourceId: data.originalSourceId,
        markLogicalOnly: data.markLogicalOnly,
        rank: data.rank,
        lineageRelation: data.lineageRelation,
        correlationId: data.correlationId,
        traceId: metadata.traceId,
        emittedAt: data.emittedAt ?? new Date().toISOString(),
        enqueuedAt: new Date().toISOString(),
    };

    await redis.rpush(GRAPH_TASK_QUEUE, JSON.stringify(task));

    logger.info(
        {
            label: 'FILE_GRAPH_REFINEMENT_DISPATCH',
            traceId: metadata.traceId,
            queue: GRAPH_TASK_QUEUE,
            fileId: data.fileId,
        },
        'Dispatched file graph task to Python queue',
    );

    return { queuedCount: 1 };
}
