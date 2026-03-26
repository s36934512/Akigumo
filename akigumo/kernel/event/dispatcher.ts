
import { logger } from "akigumo/db/pino";
import { prisma } from "akigumo/db/prisma";
import { redis } from "akigumo/db/redisClient";
import { Queue } from "bullmq";
import { OutboxStatus } from 'generated/prisma/enums';
import { v7 as uuidv7 } from 'uuid';

import { DISPATCH_QUEUE_NAME } from "../bootstrap/constants";
import { KernelMessage } from "../bootstrap/schema";


/**
 * Shared BullMQ queue instance used to dispatch normalized kernel jobs.
 */
export const dispatchQueue = new Queue(DISPATCH_QUEUE_NAME, { connection: redis });

/**
 * Pulls pending outbox rows, converts them into kernel messages, and dispatches
 * them as BullMQ jobs in bulk.
 *
 * This function is idempotent at the row level because rows are locked using
 * `FOR UPDATE SKIP LOCKED` before being marked as `PROCESSING`.
 */
export async function processPendingTask() {
    const tasks = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ id: bigint }[]>`
            SELECT id FROM "outbox"
            WHERE status = 'PENDING'
                AND attempts < 5 
                AND (scheduled_time IS NULL OR scheduled_time <= NOW())
            ORDER BY id ASC LIMIT 100 FOR UPDATE SKIP LOCKED
        `;
        if (rows.length === 0) return [];

        return await tx.outbox.updateManyAndReturn({
            where: { id: { in: rows.map(r => r.id) } },
            data: { status: OutboxStatus.PROCESSING }
        });
    });

    if (tasks.length === 0) return;

    const jobs = tasks.map(task => {
        const message: KernelMessage = {
            metadata: {
                version: "1.0",
                traceId: uuidv7(),
                timestamp: new Date(),
            },
            context: {
                workflowId: task.workflowId || 'unknown-workflow',
                correlationId: task.correlationId || uuidv7(),
                aggregateId: task.aggregateId || uuidv7(),
                aggregateType: task.aggregateType,
                operation: task.operation,
            },
            rawPayload: task.payload,
        };

        return {
            name: task.operation,
            data: message,
            opts: {
                jobId: `outbox_${task.id}`,
                priority: 10,
                removeOnComplete: true
            }
        };
    });

    try {
        await dispatchQueue.addBulk(jobs);
    } catch (error) {
        logger.error({ label: 'Dispatcher', error }, 'Failed to dispatch tasks to kernel worker');
        // Intentionally keep current status so the next polling cycle can retry.
    }
}
