import { z } from "@hono/zod-openapi";

import { prisma } from "#akigumo/db/prisma.js";

import { handlersRegistry } from "../core/index.js";
import { buildTask } from "../factory/user-registration.js";

const payloadSchema = z
	.uuid()
	.array()
	.openapi({
		description:
			"User registration payload containing the unique identifier of the user.",
		example: ["123e4567-e89b-12d3-a456-426614174000"],
	});

handlersRegistry.registerHandler({
	name: "user-registration",
	schema: payloadSchema,
	logic: async (payload) => {
		const userList = await prisma.user.findMany({
			where: { id: { in: payload } },
		});

		if (userList.length === 0) {
			throw new Error("user not found");
		}

		return {
			taskType: "UserExecutor",
			payload: userList.map((user) => {
				return buildTask({
					userId: user.id,
					userName: user.name,
				});
			}),
		};
	},
});
