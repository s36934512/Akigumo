import { prisma } from "#akigumo/db/prisma.js";
import { workflowExecutionWorker } from "#akigumo/infrastructure/message-queue/index.js";
import { FAILURE, SUCCESS } from "#akigumo/shared/schemas/common.js";

import { WorkflowReceiveSchema } from "../workflow/schema.js";
import { NonRetryableError } from "./error.js";
import type { Task } from "./type.js";

export async function exponentialBackoff(
	id: bigint,
	errorString: string,
): Promise<void> {
	const task = await prisma.outbox.findUnique({ where: { id } });
	if (!task) return;

	const newAttempts = task.attempts + 1;
	const delayMinutes = 2 ** newAttempts;
	const nextRetry = new Date(Date.now() + delayMinutes * 60 * 1000);

	await prisma.outbox.update({
		where: { id },
		data: {
			attempts: newAttempts,
			status: "PENDING",
			scheduledAt: nextRetry,
			lastError: errorString,
		},
	});
}

export async function handleFatalError(
	id: bigint,
	errorString: string,
): Promise<void> {
	await prisma.outbox.update({
		where: { id },
		data: {
			status: "FAILED",
			lastError: errorString,
		},
	});
}

export async function sendSuccessEventToWorkflow<
	TPayload = unknown,
	TResult = unknown,
>(task: Task<TPayload>, result: TResult): Promise<void> {
	const parseResult = WorkflowReceiveSchema.safeParse({
		workflowId: task.context.workflowId,
		sender: {
			action: task.context.operation,
			id: task.metadata.outboxId,
		},
		status: {
			status: SUCCESS,
			data: result,
		},
	});

	if (!parseResult.success) {
		throw new NonRetryableError(parseResult.error.message);
	}

	await workflowExecutionWorker.add(JSON.stringify(parseResult.data));
}

export async function sendFailureEventToWorkflow<TPayload = unknown>(
	task: Task<TPayload>,
	error: unknown,
): Promise<void> {
	// 將未知錯誤轉換為可序列化的格式，避免原生的 Error 物件轉 JSON 時變為 {}
	const normalizedError =
		error instanceof Error
			? {
					name: error.name,
					message: error.message,
					stack: error.stack,
				}
			: typeof error === "object" && error !== null
				? error
				: { message: String(error) };

	const parseResult = WorkflowReceiveSchema.safeParse({
		workflowId: task.context.workflowId,
		sender: {
			action: task.context.operation,
			id: task.metadata.outboxId,
		},
		status: {
			status: FAILURE,
			error: normalizedError,
		},
	});

	if (!parseResult.success) {
		throw new NonRetryableError(parseResult.error.message);
	}

	await workflowExecutionWorker.add(JSON.stringify(parseResult.data));
}
