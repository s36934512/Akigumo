import { z } from "@hono/zod-openapi";

// 1. 定義操作枚舉並導出 .enum 以便外部使用 (替代字串字面量)
export const PatchOperateSchema = z.enum([
	"UPSERT_PROP",
	"REPLACE_PROP",
	"REMOVE_PROP",
	"OVERWRITE_OBJ",
	"DELETE_OBJ",
]);
export const PatchOperate = PatchOperateSchema.enum; // 💡 外部可直接引用

// 2. 定義共用欄位
const BasePatch = { seq: z.number(), ts: z.number().optional() };

// 3. 建立判別式聯合 Schema (使用符合 Zod v4 規範的 catchall(z.unknown()))
export const PatchPayloadSchema = z.discriminatedUnion("op", [
	// 使用 catchall 替代 passthrough 消除警告
	z
		.object({
			op: z.literal(PatchOperate.OVERWRITE_OBJ),
			id: z.string(),
			entry: z.object({ id: z.string() }).catchall(z.unknown()),
		})
		.extend(BasePatch),
	z
		.object({
			op: z.literal(PatchOperate.DELETE_OBJ),
			id: z.string(),
			entry: z.null().optional(),
		})
		.extend(BasePatch),
	z
		.object({
			op: z.enum([PatchOperate.UPSERT_PROP, PatchOperate.REPLACE_PROP]),
			id: z.string(),
			entry: z.record(z.string(), z.any()),
		})
		.extend(BasePatch),
	z
		.object({
			op: z.literal(PatchOperate.REMOVE_PROP),
			id: z.string(),
			entry: z.array(z.string()),
		})
		.extend(BasePatch),
]);

export type PatchPayload = z.infer<typeof PatchPayloadSchema>;
