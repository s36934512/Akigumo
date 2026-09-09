import { z } from "@hono/zod-openapi";

const InputSchema = z.object({
	fileId: z.uuid(),
	itemId: z.uuid(),
	itemName: z.string().nullish(),
	childrenFileIds: z.uuid().array().min(1, "至少包含一個子項目"),
	fileExtensionCode: z.string().nullish(),
});

const TaskPayloadSchema = InputSchema.transform((data) => ({
	fileId: data.fileId,
	fileProps: {
		fileType: data.fileExtensionCode ?? null,
	},
	itemId: data.itemId,
	itemProps: {
		name: data.itemName ?? null,
	},
	childrenFileIds: data.childrenFileIds,
}));

type InputPayload = z.infer<typeof InputSchema>;

export function buildArchiveUncompressTask(payload: InputPayload) {
	return TaskPayloadSchema.parse(payload);
}
