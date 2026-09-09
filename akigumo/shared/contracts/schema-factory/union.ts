import { z } from "@hono/zod-openapi";

/**
 * 建立一個型別工廠，用來將額外的屬性安全地注入到特徵聯集（discriminatedUnion）中。
 * @param baseUnion 原始的 ZodDiscriminatedUnion
 * @param extension 要額外添加的屬性物件（例如 { notifyId: ... }）
 */
export function extendDiscriminatedUnion<
	Discriminator extends string,
	Options extends [
		z.ZodObject<z.ZodRawShape>,
		...z.ZodObject<z.ZodRawShape>[],
	],
	Shape extends z.ZodRawShape,
>(
	discriminator: Discriminator,
	baseUnion: z.ZodDiscriminatedUnion<Options>,
	extension: Shape,
) {
	// 利用 map 遍歷原本聯集裡面的每一個子 Schema，並使用 .extend() 安全注入
	const extendedOptions = baseUnion.options.map((schema) =>
		schema.extend(extension),
	) as unknown as {
		[K in keyof Options]: Options[K] extends z.ZodObject<
			infer RawShape,
			infer Config
		>
			? z.ZodObject<RawShape & Shape, Config>
			: Options[K] extends z.ZodObject<infer RawShape>
				? z.ZodObject<RawShape & Shape>
				: never;
	};

	return z.discriminatedUnion(discriminator, extendedOptions);
}

/**
 * 建立一個型別工廠，用來將額外的屬性安全地注入到特徵聯集（discriminatedUnion）中。
 * @param discriminator 判別欄位的名稱（例如 'type'）
 * @param baseUnion 原始的 ZodDiscriminatedUnion
 * @param extensionSchema 要額外添加的 ZodObject 實例（例如 z.object({ notifyId: ... })）
 */
export function extendObjectDiscriminatedUnion<
	Discriminator extends string,
	Options extends [
		z.ZodObject<z.ZodRawShape>,
		...z.ZodObject<z.ZodRawShape>[],
	],
	ExtensionShape extends z.ZodRawShape,
>(
	discriminator: Discriminator,
	baseUnion: z.ZodDiscriminatedUnion<Options>,
	extensionSchema: z.ZodObject<ExtensionShape>,
) {
	// 從 z.object 中提取出內部的 shape 屬性
	const extension = extensionSchema.shape;

	// 利用 map 遍歷原本聯集裡面的每一個子 Schema，並使用 .extend() 安全注入
	const extendedOptions = baseUnion.options.map((schema) =>
		schema.extend(extension),
	) as unknown as {
		[K in keyof Options]: Options[K] extends z.ZodObject<
			infer RawShape,
			infer Config
		>
			? z.ZodObject<RawShape & ExtensionShape, Config>
			: Options[K] extends z.ZodObject<infer RawShape>
				? z.ZodObject<RawShape & ExtensionShape>
				: never;
	};

	return z.discriminatedUnion(discriminator, extendedOptions);
}
