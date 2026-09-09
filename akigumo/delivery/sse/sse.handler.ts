import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";

import { logger } from "#akigumo/db/pino.js";
import { createSubscriber } from "#akigumo/db/redisClient.js";

import { EVENT_CHANNEL } from "./notifier.js";
import { sseStreamRoute } from "./sse.route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const sseHandler = app.openapi(sseStreamRoute, async (c) => {
	return streamSSE(c, async (stream) => {
		const subClient = createSubscriber();
		let isAborted = false;

		// 封裝一個統一的清理函式，確保任何極端錯誤下都不會洩漏 Redis 連線
		const cleanup = async () => {
			if (isAborted) return;
			isAborted = true;
			logger.info("[SSE] 執行釋放資源清理...");
			try {
				await subClient.unsubscribe(EVENT_CHANNEL);
				await subClient.quit();
			} catch (cleanupErr) {
				logger.error({ cleanupErr }, "[SSE] 清理 Redis 時發生異常");
			}
		};

		try {
			// 1. 設置消息處理器
			subClient.on("message", (chan, message) => {
				if (!isAborted && chan === EVENT_CHANNEL) {
					stream.writeSSE({ data: message }).catch((err) => {
						logger.error({ err }, "[SSE] 訊息寫入前端失敗");
						cleanup();
					});
				}
			});

			// 2. 訂閱 Redis 頻道
			await subClient.subscribe(EVENT_CHANNEL);

			// 3. 發送握手消息
			const handshakeMsg = JSON.stringify({
				type: "SSE_CONNECTED",
				payload: { connectedAt: new Date().toISOString() },
			});
			await stream.writeSSE({ data: handshakeMsg });

			// 4. 重要：當客戶端主動斷開連線、切換網頁時的清理邏輯
			stream.onAbort(async () => {
				logger.info("[SSE] 客戶端中斷連線 (Stream aborted)");
				await cleanup();
			});

			// 5. 安全的心跳包循環：只要客戶端沒斷開 (isAborted === false) 就持續運作
			while (!isAborted) {
				await stream.write(":keepalive\n\n");
				await stream.sleep(15000);
			}

			logger.debug({ lable: "SSE" }, "心跳包迴圈安全退出");
		} catch (err) {
			logger.error({ err }, "[SSE] 串流發生嚴重錯誤");
			await cleanup();
		}
	});
});
