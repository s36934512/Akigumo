import { z } from '@hono/zod-openapi';
import { Observable, pipe } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';

import { OutboxModelSchema } from 'generated/zod/schemas';
import { redisListener } from './redisClient';

/**
 * 定義狀態更新的基礎 Schema
 * 從 Prisma 自動生成的 Zod Schema 擴展，並處理 Redis 特有的字串轉型
 */
export const StatusSchema = OutboxModelSchema.extend({
    createdTime: z.coerce.date(), // Redis Stream 傳回的是字串，強制轉為 Date
}).pick({
    operation: true,
    createdTime: true,
    payload: true,
    aggregateType: true,
    aggregateId: true,
});
export type StatusUpdate = z.infer<typeof StatusSchema>;

/**
 * 核心狀態串流 status$
 * 使用 Redis XREAD 實作Hot Observable
 */
export const status$ = new Observable<StatusUpdate>((subscriber) => {
    let lastId = '$';
    let running = true;

    const pull = async () => {
        while (running) {
            try {
                const results = await redisListener.xread('BLOCK', 5000, 'STREAMS', 'outbox:status', lastId);

                if (!running) break;
                if (!results) continue;

                for (const [streamName, messages] of results) {
                    for (const [id, fields] of messages) {
                        // 將 Redis 的 [k1, v1, k2, v2] 陣列轉為 Record<string, string>
                        const rawData: Record<string, string> = {};
                        for (let i = 0; i < fields.length; i += 2) {
                            rawData[fields[i]] = fields[i + 1];
                        }

                        const result = StatusSchema.safeParse(rawData);
                        if (running) {
                            if (result.success) {
                                subscriber.next(result.data);
                            } else {
                                console.warn(`[Stream: ${streamName}] 資料格式不符:`, result.error);
                            }
                        }

                        lastId = id; // 更新讀取進度
                    }
                }
            } catch (err) {
                if (running) subscriber.error(err);
            }
        }
    };

    pull();
    return () => { running = false; };
}).pipe(shareReplay({
    bufferSize: 100,
    windowTime: 5000,
    refCount: true
}));

export function parseOutboxPayload<T>(schema: z.Schema<T>) {
    return pipe(
        map((data: any) => {
            try {
                // 自動處理 Redis Stream 可能傳回的 JSON 字串或已解析物件
                const raw = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
                return schema.safeParse(raw);
            } catch (e) {
                return { success: false as const };
            }
        }),
        // 使用 Type Guard 強制收窄型別，移除失敗的結果
        filter((result): result is { success: true; data: T } => result.success),
        map(result => result.data)
    );
}