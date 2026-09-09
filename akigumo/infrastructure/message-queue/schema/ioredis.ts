import { z } from "@hono/zod-openapi";

export const MessageSchema = z.tuple([
	// 訊息 ID: string
	z.string(),
	// 訊息內容: string[]
	z.array(z.string()),
]);

export const MessagesSchema = MessageSchema.array();

export type Messages = z.infer<typeof MessagesSchema>;

export const XReadGroupResponseSchema = z.array(
	z.tuple([
		// 1. streamName: string
		z.string(),

		// 2. messages: Array<[id, fields]>
		MessagesSchema,
	]),
);

export type XReadGroupResponse = z.infer<typeof XReadGroupResponseSchema>;
