import { z } from "@hono/zod-openapi";

const OperateSchema = z.enum(["CHILDREN", "ROOT", "ALL"]);
export const QueryOperate = OperateSchema.enum;

export const BaseQuerySchema = z.object({
	showDeleted: z.boolean().default(false),
});

export const GetChildrenQuerySchema = BaseQuerySchema.extend({
	operate: z.literal(QueryOperate.CHILDREN),
	parentId: z.uuid(),
});

export const GetRootQuerySchema = BaseQuerySchema.extend({
	operate: z.literal(QueryOperate.ROOT),
});

export const GetAllQuerySchema = BaseQuerySchema.extend({
	operate: z.literal(QueryOperate.ALL),
});

export const QuerySchema = z.discriminatedUnion("operate", [
	GetChildrenQuerySchema,
	GetRootQuerySchema,
	GetAllQuerySchema,
]);
export type QueryInput = z.infer<typeof QuerySchema>;
