import { z } from "@hono/zod-openapi";
import { AttachAttributesSchema } from "./schema.js";

export const AttachAttributesNoCustomAttributesSchema =
	AttachAttributesSchema.single.omit({
		customAttributes: true,
	});

export type AttachAttributesNoCustomAttributes = z.infer<
	typeof AttachAttributesNoCustomAttributesSchema
>;

export const AttachAttributesUuidCustomAttributesSchema =
	AttachAttributesSchema.single.extend({
		customAttributes: z.uuid().array(),
	});

export type AttachAttributesUuidCustomAttributes = z.infer<
	typeof AttachAttributesUuidCustomAttributesSchema
>;

export const AttachSplitSchema = z.object({
	target: z.uuid(),
	systemProperties: z.record(z.string(), z.string()).optional(),
	directConceptIds: z.uuid().array().optional(),
	customAttributes: z.uuid().array().optional(),
});
export type AttachSplit = z.infer<typeof AttachSplitSchema>;

export const AttachSplitSetSchema = AttachSplitSchema.extend({
	directConceptIds: z.set(z.uuid()),
	customAttributes: z.set(z.uuid()),
});
export type AttachSplitSet = z.infer<typeof AttachSplitSetSchema>;
