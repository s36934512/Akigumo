import { v7 as uuidv7 } from "uuid";
import { prisma } from "#akigumo/db/prisma.js";
import { dispatchTasks } from "#akigumo/kernel/index.js";
import type { Prisma } from "#generated/prisma/client.js";

interface PublishWorkflowOptions<P extends Prisma.InputJsonValue> {
	workflowType: string;
	aggregateType: string;
	operation: string;
	payload: P;
}

interface PublishHandlerOptions<P extends Prisma.InputJsonValue> {
	traceId: string;
	aggregateType: string;
	operation: string;
	payload: P;
}

export async function publishWorkflow<P extends Prisma.InputJsonValue>(
	options: PublishWorkflowOptions<P>,
): Promise<string> {
	const traceId = uuidv7();

	await prisma.$transaction([
		prisma.workflowState.create({
			data: {
				id: traceId,
				workflowType: options.workflowType,
				status: "INIT",
			},
		}),

		prisma.outbox.create({
			data: {
				workflowId: traceId,
				aggregateType: options.aggregateType,
				operation: options.operation,
				payload: options.payload,
			},
		}),
	]);

	dispatchTasks();

	return traceId;
}

export async function publishHandler<P extends Prisma.InputJsonValue>(
	options: PublishHandlerOptions<P>,
): Promise<void> {
	await prisma.outbox.create({
		data: {
			workflowId: options.traceId,
			aggregateType: options.aggregateType,
			operation: options.operation,
			payload: options.payload,
		},
	});

	dispatchTasks();
}
