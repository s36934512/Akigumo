import { Queue } from "bullmq";

import { logger } from "#akigumo/db/pino.js";
import { prisma } from "#akigumo/db/prisma.js";
import { redis } from "#akigumo/db/redisClient.js";
import { OutboxStatus } from "#generated/prisma/enums.js";

import { config } from "../config.js";
import { TaskCreateInputFromOutboxSchema } from "./type.js";

const dispatchQueue = new Queue(config.queue_name, { connection: redis });

/*
 * This function is idempotent at the row level because rows are locked using
 * `FOR UPDATE SKIP LOCKED` before being marked as `PROCESSING`.
 */
async function getTasks() {
	return await prisma.$transaction(async (tx) => {
		const rows = await tx.$queryRaw<{ id: bigint }[]>`
            SELECT id FROM "outbox"
            WHERE status = 'PENDING'
                AND attempts < 5 
                AND (scheduled_at IS NULL OR scheduled_at <= NOW())
            ORDER BY id ASC LIMIT 100 FOR UPDATE SKIP LOCKED
        `;
		if (rows.length === 0) return [];

		return await tx.outbox.updateManyAndReturn({
			where: { id: { in: rows.map((r) => r.id) } },
			data: { status: OutboxStatus.PROCESSING },
		});
	});
}

/**
 * Pulls pending outbox rows, converts them into task, and dispatches
 * them as BullMQ jobs in bulk.
 */
export async function dispatchTasks() {
	const tasks = await getTasks();
	if (tasks.length === 0) return;

	const jobs = tasks.flatMap((task) => {
		const result = TaskCreateInputFromOutboxSchema.safeParse(task);
		if (!result.success) return [];

		return [
			{
				name: result.data.context.operation,
				data: result.data,
				opts: {
					priority: 10,
					removeOnComplete: true,
				},
			},
		];
	});

	try {
		await dispatchQueue.addBulk(jobs);
	} catch (error) {
		logger.error(
			{ label: "Dispatcher", error },
			"Failed to dispatch tasks to kernel worker",
		);
		// Intentionally keep current status so the next polling cycle can retry.
	}
}
