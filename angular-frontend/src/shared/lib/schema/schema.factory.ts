import z from "zod";

export function createFlexibleSchema<T extends z.ZodTypeAny>(schema: T) {
	const arraySchema = z.array(schema);

	return {
		/** 原始的單一 Schema (A) */
		single: schema,
		/** 陣列 Schema (A.array()) */
		array: arraySchema,
		/** 接受單一或陣列的聯集 Schema (z.union([A, A.array()])) */
		either: z.union([schema, arraySchema]),
	};
}

export type InferFlexible<T extends ReturnType<typeof createFlexibleSchema>> = {
	single: z.infer<T["single"]>;
	array: z.infer<T["array"]>;
	either: z.infer<T["either"]>;
};
