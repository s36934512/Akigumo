import { redis } from "#akigumo/db/redisClient.js";
import { EventType } from "./event-schema/base.js";

import {
	type SseEventInput,
	SseEventInputSchema,
} from "./event-schema/schema.js";

export const EVENT_CHANNEL = "global:events";

/**
 * 專門用於通知前端 (SSE) 的派發器
 */
export const notifyClient = async (event: SseEventInput) => {
	const validatedEvent = SseEventInputSchema.parse(event);

	let finalPayload = validatedEvent.payload;

	switch (validatedEvent.type) {
		case EventType.ARCHIVE_PATCH:
		case EventType.CONCEPT_PATCH: {
			const patchCount = validatedEvent.payload.length;
			const maxSeq = await redis.incrby(
				`seq:${event.notifyId}`,
				patchCount,
			);
			const startSeq = maxSeq - patchCount + 1;

			finalPayload = validatedEvent.payload.map((patch, index) => ({
				...patch,
				seq: startSeq + index, // 讓這批陣列裡的補丁序號依序遞增（例如 41, 42, 43）
			}));

			break;
		}
	}

	const message = JSON.stringify({
		notifyId: event.notifyId,
		type: validatedEvent.type,
		payload: finalPayload,
		timestamp: Date.now(),
	});

	await redis.publish(EVENT_CHANNEL, message);
};
