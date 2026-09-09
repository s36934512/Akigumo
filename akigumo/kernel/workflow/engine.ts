import { logger } from "#akigumo/db/pino.js";
import { prisma } from "#akigumo/db/prisma.js";
import {
	type JobDict,
	workflowExecutionWorker,
} from "#akigumo/infrastructure/message-queue/index.js";

import { createEventMessage, createWorkflowMachine } from "./helper.js";
import { WorkflowReceiveSchema } from "./schema.js";

async function workflowEngine(job: JobDict) {
	try {
		const result = WorkflowReceiveSchema.safeParse(job.data);
		if (!result.success) {
			logger.warn(
				{ label: "WorkflowEngine", error: result.error, jobId: job.id },
				"回饋資料格式錯誤，跳過",
			);
			return;
		}

		const Event = result.data;
		const eventMessage = createEventMessage(Event);

		const actor = await createWorkflowMachine(Event.workflowId);
		if (!actor) {
			logger.warn(
				{ label: "WorkflowEngine", workflowId: Event.workflowId },
				"未找到對應的狀態機，跳過",
			);
			return;
		}
		actor.start();
		actor.send(eventMessage);

		const nextSnapshot = actor.getSnapshot();
		const nextTask = nextSnapshot.context.nextTask;

		await prisma.$transaction(async (tx) => {
			await tx.workflowState.update({
				where: { id: Event.workflowId },
				data: {
					status: nextSnapshot.value,
					snapshot: nextSnapshot,
				},
			});

			if (nextTask) {
				await tx.outbox.create({
					data: {
						workflowId: Event.workflowId,
						...nextTask,
					},
				});
			}
		});

		actor.stop();
	} catch (error) {
		logger.error(
			{
				label: "WorkflowEngine",
				jobId: job.id,
				error: error instanceof Error ? error.message : error,
			},
			"處理單個任務時發生錯誤",
		);
		// 這裡拋出錯誤會導致 BatchWorker 不 ACK，觸發重試
		throw error;
	}
}

/*
 * event, persists next snapshot, and enqueues
 * follow-up outbox task when `nextTask` is present.
 */
export const startWorkflowEngine = async () => {
	logger.info({ label: "WorkflowEngine" }, "狀態機引擎啟動，開始監聽回饋...");

	await workflowExecutionWorker.run(async (jobs: JobDict[]) => {
		for (const job of jobs) {
			await workflowEngine(job);
		}
	});
};
