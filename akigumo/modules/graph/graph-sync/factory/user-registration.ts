import { z } from "@hono/zod-openapi";

const InputSchema = z.object({
	userId: z.uuid(),
	userName: z.string().nullish(),
});

const TaskPayloadSchema = InputSchema.transform((data) => ({
	userId: data.userId,
	userProps: {
		name: data.userName,
	},
}));

type InputPayload = z.infer<typeof InputSchema>;

export function buildTask(payload: InputPayload) {
	return TaskPayloadSchema.parse(payload);
}
