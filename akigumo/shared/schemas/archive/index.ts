import { z } from "@hono/zod-openapi";

import { CollectionSchema, SeriesSchema, WorkSchema } from "./composite.js";
import { FileContainerSchema } from "./file-container.js";

export * from "./base.js";
export * from "./composite.js";
export * from "./file-container.js";

export const ArchiveSchema = z.discriminatedUnion("type", [
	FileContainerSchema,
	WorkSchema,
	SeriesSchema,
	CollectionSchema,
]);
export type Archive = z.infer<typeof ArchiveSchema>;
