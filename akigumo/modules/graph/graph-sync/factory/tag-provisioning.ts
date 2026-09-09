import { z } from "@hono/zod-openapi";

const InputSchema = z.object({
	conceptId: z.uuid(),
	conceptName: z.string().nullish(),
});

const TaskPayloadSchema = InputSchema.transform((data) => ({
	conceptId: data.conceptId,
	conceptProps: {
		name: data.conceptName,
	},
}));

type InputPayload = z.infer<typeof InputSchema>;

export function buildTask(payload: InputPayload) {
	return TaskPayloadSchema.parse(payload);
}
