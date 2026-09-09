import { z } from "@hono/zod-openapi";

import { prisma } from "#akigumo/db/prisma.js";
import { cacheService } from "#akigumo/services/cache/cache.service.js";
import type { CommonId } from "#akigumo/shared/contracts/common.js";
import {
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/index.js";

const FILE_META_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const FileMetaSchema = createFlexibleSchema(
	z.object({
		physicalPath: z.string().nullable(),
		systemName: z.string().nullable(),
		mimeType: z.string(),
	}),
);
type FileMeta = InferFlexible<typeof FileMetaSchema>;

export async function getFileMatadata(fileId: CommonId["single"]) {
	const metadata = await cacheService.getOrSet<FileMeta["single"]>(
		{
			module: "File",
			key: fileId,
			ttl: FILE_META_CACHE_TTL,
		},
		async () => {
			const file = await prisma.file.findUnique({
				where: { id: fileId },
				select: {
					physicalPath: true,
					systemName: true,
					fileExtension: { select: { mimeType: true } },
				},
			});
			// Throw so cache-manager does NOT cache the miss — retries stay live.
			if (!file) throw new Error(`file_not_found:${fileId}`);

			return {
				physicalPath: file.physicalPath,
				systemName: file.systemName,
				mimeType:
					file.fileExtension?.mimeType ?? "application/octet-stream",
			};
		},
	);

	return metadata;
}
