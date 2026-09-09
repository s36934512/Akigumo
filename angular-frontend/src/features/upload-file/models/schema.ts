import z from "zod";

export const UppyFileMetaSchema = z
	.object({
		fileId: z.uuid(),
		batchId: z.string(),
		checksum: z.string().optional(),
	})
	.catchall(z.unknown());
export type UppyFileMeta = z.infer<typeof UppyFileMetaSchema>;

export const UppyFileResponseSchema = z
	.object({
		data: z.instanceof(File),
	})
	.catchall(z.unknown());
export type UppyFileResponse = z.infer<typeof UppyFileResponseSchema>;
