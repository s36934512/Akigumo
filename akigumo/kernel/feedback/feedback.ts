import { logger } from "akigumo/db/pino";
import { redis, redisListener } from "akigumo/db/redisClient";
import { Observable, shareReplay } from 'rxjs';

import { StatusUpdate, StatusUpdateSchema } from "../bootstrap/schema";

/**
 * Redis Stream key for workflow feedback events emitted by workers.
 */
const FEEDBACK_STREAM_KEY = 'kernel:feedback_stream';
const POLL_READ_MILLISECONDS = 5000;
const FEEDBACK_STREAM_MAX_LEN = 1000;
const FEEDBACK_REPLAY_BUFFER_SIZE = 100;
const FEEDBACK_REPLAY_WINDOW_TIME = 5000;

/**
 * Pushes one or multiple status updates into Redis Stream.
 *
 * @param tasks A single status update or an array of status updates.
 */
export async function sendStatusUpdate(tasks: StatusUpdate | StatusUpdate[]) {
    const pipeline = redis.pipeline();
    const taskArray = Array.isArray(tasks) ? tasks : [tasks];

    taskArray.forEach(task => {
        pipeline.xadd(
            FEEDBACK_STREAM_KEY,
            'MAXLEN', '~', FEEDBACK_STREAM_MAX_LEN,
            '*',
            'aggregateType', task.aggregateType,
            'aggregateId', task.aggregateId,
            'correlationId', task.correlationId,
            'operation', task.operation,
            'createdTime', task.createdTime.toISOString(),
            'result', JSON.stringify(task.result),
        );
    });

    await pipeline.exec();
}

/**
 * Hot observable stream of workflow status updates.
 *
 * Backed by Redis `XREAD` and shared via `shareReplay` to support multiple
 * subscribers without duplicating stream read loops.
 */
export const feedback$ = new Observable<StatusUpdate>((subscriber) => {
    let lastId = '$';
    let running = true;

    const pull = async () => {
        while (running) {
            try {
                const results = await redisListener.xread(
                    'BLOCK',
                    POLL_READ_MILLISECONDS,
                    'STREAMS',
                    FEEDBACK_STREAM_KEY,
                    lastId
                );

                if (!running) break;
                if (!results) continue;

                for (const [streamName, messages] of results) {
                    for (const [id, fields] of messages) {
                        // 將 Redis 的 [k1, v1, k2, v2] 陣列轉為 Record<string, string>
                        const rawData = Object.fromEntries(
                            fields.reduce((acc, curr, i) => {
                                if (i % 2 === 0) acc.push([curr, fields[i + 1]]);
                                return acc;
                            }, [] as [string, string][])
                        );

                        const result = StatusUpdateSchema.safeParse(rawData);

                        if (running) {
                            if (result.success) {
                                subscriber.next(result.data);
                            } else {
                                logger.warn({ label: 'Feedback', stream: streamName, error: result.error }, '資料格式不符');
                            }
                        }

                        lastId = id; // 更新讀取進度
                    }
                }
            } catch (err) {
                if (running) logger.error({ label: 'Feedback', error: err }, '讀取 Redis Stream 發生錯誤');
            }
        }
    };

    pull();
    return () => { running = false; };
}).pipe(shareReplay({
    bufferSize: FEEDBACK_REPLAY_BUFFER_SIZE,
    windowTime: FEEDBACK_REPLAY_WINDOW_TIME,
    refCount: true
}));