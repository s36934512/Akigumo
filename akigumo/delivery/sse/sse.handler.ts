import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { streamSSE } from 'hono/streaming';

import { sseTraceRoute } from './sse.route';
import { logger } from '../../db/pino';
import { createSubscriber } from '../../db/redisClient';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const sseHandler = app.openapi(sseTraceRoute, async (c) => {
    const correlationId = c.req.param('id'); // 這裡對應 API 傳進來的 trace id
    if (!correlationId) return c.text('Missing Correlation ID', 400);

    const channel = `trace:${correlationId}`;

    return streamSSE(c, async (stream) => {
        const subClient = createSubscriber();

        subClient.on('message', (chan, message) => {
            if (chan === channel) {
                // Hono 的 stream.writeSSE 會自動處理 "data: " 格式與換行
                stream.writeSSE({
                    data: message,
                });
            }
        });

        try {
            await subClient.subscribe(channel);
            logger.info({ correlationId }, 'SSE Client connected via Hono');

            // 發送初始訊息確認連線
            await stream.writeSSE({
                data: JSON.stringify({ status: 'connected', correlationId }),
            });

            // 4. 重要：當客戶端斷開連線時的清理邏輯
            stream.onAbort(async () => {
                await subClient.unsubscribe(channel);
                await subClient.quit();
                logger.info({ correlationId }, 'SSE Client disconnected, Redis cleaned up');
            });

            while (true) {
                // 發送一個空的 comment 作為心跳包，避免逾時
                await stream.write(':keepalive\n\n');

                await stream.sleep(15000);
            }
        } catch (err) {
            logger.error({ err }, 'SSE Stream Error');
            await subClient.quit();
        }
    });
});
