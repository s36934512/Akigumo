import z from "zod";

export const ConceptRegistryInputSchema = z.object({
	name: z.string().min(1, "名稱不能為空"),
	description: z.string().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});
export type ConceptRegistryInput = z.infer<typeof ConceptRegistryInputSchema>;
