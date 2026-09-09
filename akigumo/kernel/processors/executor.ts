import type { z } from "@hono/zod-openapi";

import { prisma } from "#akigumo/db/prisma.js";
import type {
	ProcessorDefinition,
	Task,
} from "#akigumo/kernel/processors/type.js";
import { OutboxStatus } from "#generated/prisma/enums.js";

import { NonRetryableError } from "./error.js";
import {
	exponentialBackoff,
	handleFatalError,
	sendFailureEventToWorkflow,
	sendSuccessEventToWorkflow,
} from "./helper.js";

/**
 * Type guard used to safely check for non-retryable error markers without using `any`.
 */
function isNonRetryable(error: unknown): boolean {
	if (error instanceof NonRetryableError) return true;
	if (typeof error === "object" && error !== null && "retryable" in error) {
		return (error as { retryable?: unknown }).retryable === false;
	}
	return false;
}

/**
 * Executes a processor task and handles validation, lifecycle hooks, and error state transitions.
 */
export async function executeKernelTask<TSchema extends z.ZodTypeAny>(
	processor: ProcessorDefinition<TSchema>,
	task: Task<unknown>,
): Promise<void> {
	const outboxId = task.metadata.outboxId;

	const result = processor.inputSchema.safeParse(task.payload);
	if (!result.success) {
		await handleFatalError(outboxId, result.error.message);
		return;
	}

	// 透過驗證後的資料建立型別安全的 Task 實例
	const validatedTask: Task<z.output<TSchema>> = {
		...task,
		payload: result.data,
	};

	try {
		if (processor.onBefore) processor.onBefore(validatedTask);
		const logicResult = await processor.logic(validatedTask);

		await sendSuccessEventToWorkflow(validatedTask, logicResult);
		await prisma.outbox.update({
			where: { id: outboxId },
			data: { status: OutboxStatus.COMPLETED },
		});
	} catch (error: unknown) {
		const isFatal = isNonRetryable(error);

		if (isFatal) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			await handleFatalError(outboxId, errorMessage);
			await sendFailureEventToWorkflow(validatedTask, error);
		} else {
			const serializedError =
				error instanceof Error
					? (error.stack ?? error.message)
					: JSON.stringify(error);

			await exponentialBackoff(outboxId, serializedError);
		}
	}
}
