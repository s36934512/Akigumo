import { z } from "zod";
import { createFlexibleSchema, type InferFlexible } from "@/shared/lib/schema";

export const ScannedFileSchema = createFlexibleSchema(
	z.object({
		name: z.string(),
		size: z.coerce.string(),
		metadata: z.object({
			tempScanId: z.uuid(),
			path: z.string().min(1),
			batchId: z.uuid(),
		}),
	}),
);
export type ScannedFile = InferFlexible<typeof ScannedFileSchema>;

export const FileIdAssignedSchema = createFlexibleSchema(
	z.object({
		tempScanId: z.uuid(),
		fileId: z.uuid(),
		batchId: z.uuid(),
	}),
);

export type FileIdAssigned = InferFlexible<typeof FileIdAssignedSchema>;
