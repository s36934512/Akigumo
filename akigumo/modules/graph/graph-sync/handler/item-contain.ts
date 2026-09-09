import { z } from "@hono/zod-openapi";

import { prisma } from "#akigumo/db/prisma.js";

import { handlersRegistry } from "../core/index.js";
import { buildItemContainTask } from "../factory/item-contain.js";

export const ItemContainPayloadSchema = z
	.object({
		itemId: z.uuid(),
		childrenItemIds: z.array(z.uuid()).min(1, "至少包含一個子項目"),
	})
	.openapi({
		description:
			"Item contain payload containing the unique identifier of the item.",
		example: {
			itemId: "123e4567-e89b-12d3-a456-426614174000",
			childrenItemIds: ["123e4567-e89b-12d3-a456-426614174000"],
		},
	});

export type ItemContainPayload = z.infer<typeof ItemContainPayloadSchema>;

async function itemContainHandler(payload: ItemContainPayload) {
	const { itemId, childrenItemIds } = payload;

	const item = await prisma.item.findUnique({
		where: {
			id: itemId,
		},
	});

	if (!item) {
		throw new Error("Item not found");
	}

	const childrenItems = await prisma.item.findMany({
		where: {
			id: {
				in: childrenItemIds,
			},
		},
	});

	if (!childrenItems || childrenItems.length === 0) {
		throw new Error("Children items not found");
	}

	const task = buildItemContainTask({
		itemId,
		itemName: item.name,
		childrenItemIds: childrenItems.map((item) => item.id),
	});

	return {
		taskType: "ItemExecutor",
		payload: task,
	};
}

handlersRegistry.registerHandler({
	name: "item-contain",
	schema: ItemContainPayloadSchema,
	logic: itemContainHandler,
});
