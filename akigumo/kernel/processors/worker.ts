import { type Job, Worker } from "bullmq";

import { logger } from "#akigumo/db/pino.js";
import { redis } from "#akigumo/db/redisClient.js";

import { config } from "../config.js";
import * as KernelExecutor from "./executor.js";
import { handleFatalError } from "./helper.js";
import * as kernelProcessorsRegistry from "./registry.js";
import { TaskSchema } from "./type.js";

/**
 * Creates and starts the kernel BullMQ worker.
 *
 * The worker parses each queue job into a task, resolves matching
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
		config.queue_name,
		async (job: Job) => {
			const result = TaskSchema.safeParse(job.data);
			if (!result.success) {
				logger.error(
					{ label: "KernelWorker", jobId: job.id },
					result.error.message,
				);
				return;
			}

			const task = result.data;
			const processor = kernelProcessorsRegistry.getProcessor(
				task.context.operation,
			);
			if (!processor) {
				await handleFatalError(
					task.metadata.outboxId,
					`未找到對應的處理器: ${task.context.operation}`,
				);
				return;
			}

			await KernelExecutor.executeKernelTask(processor, task);
		},
		{
			connection: redis,
			concurrency: config.worker_concurrency,
		},
	);
};
