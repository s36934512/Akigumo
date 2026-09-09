import { defineProcessor } from "#akigumo/shared/factories/index.js";

import { UserRegistrationSchema } from "../api/schema.js";
import { ACTION_LIST } from "../contract.js";
import * as svc from "./service.js";

export const userRegistrationProcessor = defineProcessor(
	ACTION_LIST.CREATE.code,
	UserRegistrationSchema.array,
	async (input) => {
		const idList = await svc.createItemList(input.payload);

		return idList;
	},
);
