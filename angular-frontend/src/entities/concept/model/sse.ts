import z from "zod";
import { createFlexibleSchema, type InferFlexible } from "@/shared/lib/schema";

// 1. 定義操作枚舉並導出 .enum 以便外部使用 (替代字串字面量)
export const PatchOperateSchema = z.enum([
	"UPSERT_PROP",
	"REPLACE_PROP",
	"REMOVE_PROP",
	"OVERWRITE_OBJ",
	"DELETE_OBJ",
]);
export const PatchOperate = PatchOperateSchema.enum;

// 2. 定義共用欄位
const BasePatch = z.object({ seq: z.number() });

const createPatchBranch = <
	T extends keyof typeof PatchOperate,
	P extends z.ZodTypeAny,
>(
	op: T,
	entry: P,
) => {
	return BasePatch.extend({
		op: z.literal(op),
		entry,
	});
};

// 3. 建立判別式聯合 Schema
export const PatchPayloadSchema = createFlexibleSchema(
	z.discriminatedUnion("op", [
		createPatchBranch(
			PatchOperate.OVERWRITE_OBJ,
			z.object({ id: z.string() }).catchall(z.unknown()),
		),
		createPatchBranch(
			PatchOperate.DELETE_OBJ,
			z.object({ id: z.string() }).catchall(z.unknown()),
		),
		createPatchBranch(
			PatchOperate.UPSERT_PROP,
			z.object({ id: z.string() }).catchall(z.unknown()),
		),
		createPatchBranch(
			PatchOperate.REPLACE_PROP,
			z.object({ id: z.string() }).catchall(z.unknown()),
		),
		createPatchBranch(
			PatchOperate.REMOVE_PROP,
			z.object({ id: z.string() }).catchall(z.unknown()),
		),
	]),
);

export type PatchPayload = InferFlexible<typeof PatchPayloadSchema>;
