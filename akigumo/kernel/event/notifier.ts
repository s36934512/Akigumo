import { z } from '@hono/zod-openapi';
import { redis } from 'akigumo/db/redisClient';

const SSEEventSchema = z.object({
    notifyUploadId: z.string(),
    type: z.enum(['PROGRESS', 'COMPLETED', 'FAILED', 'STATUS', 'FILE_ID_ASSIGNED', 'INDEX_PATCH']),
    payload: z.any(),
});

type SSEEvent = z.infer<typeof SSEEventSchema>;

/**
 * 專門用於通知前端 (SSE) 的派發器
 */
export const notifyClient = async (event: SSEEvent) => {
    const channel = `trace:${event.notifyUploadId}`;
    const message = JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
    });

    await redis.publish(channel, message);
};
