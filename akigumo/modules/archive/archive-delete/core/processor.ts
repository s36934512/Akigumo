import { defineProcessor } from "#akigumo/shared/factories/index.js";

import { ArchiveDeleteSchema } from "../api/schema.js";
import { ACTION_LIST } from "../contract.js";
import * as svc from "./service.js";

export const archiveDeleteProcessor = defineProcessor(
	ACTION_LIST.DELETE.code,
	ArchiveDeleteSchema.array,
	async (input) => {
		const idList = await svc.updateItemList(input.payload);

		return idList;
	},
);
