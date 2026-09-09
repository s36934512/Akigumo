import { z } from "@hono/zod-openapi";

import { MessageSchema } from "./ioredis.js";

/**
 * 定義將被推送到佇列的任務結構。
 * @template T 任務負載的類型。
 */
export const JobDictSchema = z.object({
	id: z.string(),
	data: z.record(z.string(), z.any()),
});

export type JobDict = z.infer<typeof JobDictSchema>;

// fields內是[field1, value1, field2, value2, ...]
// 預設只有一組 ['payload', string]
export const DecodeMessagesSchema = MessageSchema.transform(([id, fields]) => {
	return { id, data: JSON.parse(fields[1]) };
}).pipe(JobDictSchema);
