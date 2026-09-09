import z from "zod";
import type { ArchiveSchema } from "./archive";

export const ExtendedItemStatusSchema = z.enum([
	"ONGOING",
	"COMPLETED",
	"HIATUS",
	"UPCOMING",
	"DRAFT",
	"PRIVATE",
	"ACTIVE",
	"ARCHIVED",
	"LOCKED",
	"HIDDEN",
	"PROCESSING",
	"DELETED",
	"FAILED",
	"NORMAL",
	"HIDDEN",
	"DELETED",
]);

export type ArchiveEntry = z.infer<typeof ArchiveSchema>;
