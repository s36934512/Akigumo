import { z } from '@hono/zod-openapi';
import { prisma } from 'akigumo/db/prisma';
import { redis } from 'akigumo/db/redisClient';
import { Job, Worker } from 'bullmq';

import { KernelExecutor } from './executor';
import { DISPATCH_QUEUE_NAME, KERNEL_WORKER_CONCURRENCY } from '../bootstrap/constants';
import { KernelMessageSchema } from '../bootstrap/schema';
import { kernelProcessorsRegistry } from '../event/registry';

/**
 * Creates and starts the kernel BullMQ worker.
 *
 * The worker parses each queue job into a kernel message, resolves matching
 * processors from the registry, and runs them in parallel.
 *
 * For Zod schema validation failures, the worker marks the outbox record as
 * FAILED, stores a validation error message, and skips retry.
 *
 * For other failures (for example missing processor or processor rejection),
 * the worker increments outbox attempts, schedules retry with exponential
 * backoff, stores the latest error, and rethrows to mark the BullMQ job failed.
 */
export const setupKernelWorker = () => {
    return new Worker(
        DISPATCH_QUEUE_NAME,
        async (job: Job) => {
            try {
                const message = KernelMessageSchema.parse(job.data);
                const processor = kernelProcessorsRegistry.getProcessor(
                    message.context.aggregateType,
                    message.context.operation
                );
                if (!processor) {
                    // 如果找不到，直接拋出一個致命錯誤，這樣就會進入下方的 catch，觸發熔斷處理
                    throw new Error(`CRITICAL_PROCESSOR_NOT_FOUND: ${message.context.aggregateType}:${message.context.operation}`);
                }

                await KernelExecutor.execute(
                    processor,
                    message.rawPayload,
                    message.metadata,
                    message.context
                );
            } catch (error: any) {
                const outboxId = parseInt(job.id!.replace('outbox_', ''));
                // 【關鍵】如果 isFatal 為 true，則標記 FAILED 並直接 return，終止重試
                if (error.isFatal || error instanceof z.ZodError) {
                    await prisma.outbox.update({
                        where: { id: outboxId },
                        data: { status: 'FAILED' }
                    });
                    return;
                }

                const attempt = await prisma.outbox.findUnique({ where: { id: outboxId } });
                const newAttempts = (attempt?.attempts || 0) + 1;
                const delayMinutes = Math.pow(2, newAttempts);
                const nextRetry = new Date(Date.now() + delayMinutes * 60 * 1000);

                await prisma.outbox.update({
                    where: { id: outboxId },
                    data: {
                        attempts: newAttempts,
                        status: 'PENDING',
                        scheduledTime: nextRetry,
                        lastError: error.message
                    }
                });
            }
        },
        {
            connection: redis,
            concurrency: KERNEL_WORKER_CONCURRENCY
        }
    );
};
