import { z } from "@hono/zod-openapi";

const InputSchema = z.object({
	fileId: z.uuid(),
	storageStatus: z.enum(["PENDING", "on_disk"]).nullish(),
	width: z.number().int().nullish(),
	height: z.number().int().nullish(),
	fileExtensionCode: z.string().nullish(),

	originalFileId: z.uuid(),
	originalFileExtensionCode: z.string().nullish(),
	originalFileWidth: z.number().int().nullish(),
	originalFileHeight: z.number().int().nullish(),
});

const TaskPayloadSchema = InputSchema.transform((data) => ({
	fileId: data.fileId,
	fileProps: {
		storageStatus: data.storageStatus ?? null,
		fileType: data.fileExtensionCode ?? null,
		width: data.width ?? null,
		height: data.height ?? null,
	},
	originalFileId: data.originalFileId,
	originalFileProps: {
		fileType: data.originalFileExtensionCode ?? null,
		width: data.originalFileWidth ?? null,
		height: data.originalFileHeight ?? null,
	},
}));

export function buildArchiveTranscodeTask(
	payload: z.infer<typeof InputSchema>,
) {
	return TaskPayloadSchema.parse(payload);
}
