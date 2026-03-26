import { prisma } from "../db/prisma";
import { outboxRegistry } from "./outbox.registry";
import { Prisma } from "generated/prisma/client";
import { sendStatusUpdate } from "../db/stream-publisher";

export async function processPendingTask() {
    const allTasks = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ id: bigint }[]>`
            SELECT id FROM "outbox"
            WHERE status = 'PENDING' AND attempts < 5 AND (scheduled_time IS NULL OR scheduled_time <= NOW())
            ORDER BY id ASC
            LIMIT 100
            FOR UPDATE SKIP LOCKED
        `;

        if (rows.length === 0) return [];

        const ids = rows.map(r => r.id);
        return await tx.outbox.findMany({ where: { id: { in: ids } } });
    });

    if (allTasks.length === 0) {
        console.log("[OutboxWorker] No pending tasks found.");
        return;
    }

    const groupedTasks = allTasks.reduce<Record<string, typeof allTasks>>((acc, task) => {
        const key = `${task.aggregateType}:${task.operation}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {});

    for (const [type, tasks] of Object.entries(groupedTasks)) {
        console.log(`[OutboxWorker] Processing ${tasks.length} task(s) for ${type}...`);
        console.log('Sample Task Payload:', tasks);
        const [aggregateType, operation] = type.split(":");

        const processors = outboxRegistry.getProcessors(aggregateType, operation);

        if (processors.length === 0) {
            console.warn(`[OutboxWorker] No processors found for ${type}`);
            continue;
        }

        try {
            await Promise.all(processors.map(processor => processor(tasks)));

            await prisma.outbox.updateMany({
                where: { id: { in: tasks.map(t => t.id) } },
                data: { status: "COMPLETED" }
            });

            await sendStatusUpdate(tasks);
            console.log(`[OutboxWorker] Successfully processed ${aggregateType}:${operation}`);
        } catch (error) {
            const ids = tasks.map(t => t.id);

            // 退避公式：10秒 * 2^新嘗試次數
            await prisma.$executeRaw`
                UPDATE "outbox"
                SET 
                    "attempts" = "attempts" + 1,
                    "scheduled_time" = NOW() + (POWER(2, "attempts" + 1) * INTERVAL '10 seconds')
                WHERE "id" IN (${Prisma.join(ids)})
            `;
            console.error(`[OutboxWorker] Error processing ${aggregateType}:${operation} -`, error);
        }
    }
}

// 每 5 秒檢查一次待處理任務
setInterval(processPendingTask, 5000);

// 啟動時立即檢查一次
// processPendingTask();