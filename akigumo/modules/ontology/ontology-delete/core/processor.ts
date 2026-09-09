import { defineProcessor } from "#akigumo/shared/factories/index.js";

import { OntologyDeleteSchema } from "../api/schema.js";
import { ACTION_LIST } from "../contract.js";
import * as svc from "./service.js";

export const ontologyDeleteProcessor = defineProcessor(
	ACTION_LIST.DELETE.code,
	OntologyDeleteSchema.single,
	async (input) => {
		const idList = await svc.updateItemList(input.payload.idList);

		return { notifyId: input.payload.notifyId, idList };
	},
);
