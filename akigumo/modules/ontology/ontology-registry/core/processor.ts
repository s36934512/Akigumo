import { defineProcessor } from "#akigumo/shared/factories/index.js";

import { OntologyRegistrySchema } from "../api/schema.js";
import { ACTION_LIST } from "../contract.js";
import * as svc from "./service.js";

export const ontologyRegistryProcessor = defineProcessor(
	ACTION_LIST.REGISTRY.code,
	OntologyRegistrySchema.single,
	async (input) => {
		const idList = await svc.createItemList(input.payload.registryList);

		return { notifyId: input.payload.notifyId, idList };
	},
);
