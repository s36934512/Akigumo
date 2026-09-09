import { z } from "@hono/zod-openapi";

const ItemContainInputSchema = z.object({
	itemId: z.uuid(),
	itemName: z.string().nullish(),
	childrenItemIds: z.array(z.uuid()).min(1, "至少包含一個子項目"),
});

const TaskPayloadSchema = ItemContainInputSchema.transform((data) => ({
	itemId: data.itemId,
	itemProps: {
		name: data.itemName,
	},
	childrenIds: data.childrenItemIds,
}));

type ItemContainInputPayload = z.infer<typeof ItemContainInputSchema>;

export function buildItemContainTask(payload: ItemContainInputPayload) {
	return TaskPayloadSchema.parse(payload);
}
