import { redis } from "./redisClient";
import { StatusUpdate } from "./stream-listener";

export async function sendStatusUpdate(tasks: StatusUpdate | StatusUpdate[]) {
    const pipeline = redis.pipeline();
    const taskArray = Array.isArray(tasks) ? tasks : [tasks];

    taskArray.forEach(task => {
        pipeline.xadd(
            'outbox:status',
            'MAXLEN', '~', 1000,
            '*',
            'operation', task.operation,
            'createdTime', task.createdTime.toISOString(),
            'payload', JSON.stringify(task.payload),
            'aggregateType', task.aggregateType,
            'aggregateId', task.aggregateId ?? '',
        );
    });

    await pipeline.exec();
}