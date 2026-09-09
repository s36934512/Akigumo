import { z } from "@hono/zod-openapi";

const FileRegistryInputSchema = z.object({
	fileId: z.uuid(),
	itemId: z.uuid(),
	fileExtensionCode: z.string().nullish(),
	originalName: z.string().nullish(),
	storageStatus: z.enum(["PENDING", "on_disk"]).nullish(),
});

const TaskPayloadSchema = FileRegistryInputSchema.transform((data) => ({
	fileId: data.fileId,
	fileProps: {
		originalName: data.originalName ?? null,
		storageStatus: data.storageStatus ?? null,
		fileType: data.fileExtensionCode ?? null,
	},
	itemId: data.itemId,
	itemProps: {
		name: data.originalName ?? data.fileId,
	},
}));

type FileRegistryInputPayload = z.infer<typeof FileRegistryInputSchema>;

export function buildFileRegistryTask(payload: FileRegistryInputPayload) {
	return TaskPayloadSchema.parse(payload);
}
