import { defineProcessor } from "#akigumo/shared/factories/index.js";

import { ArchiveConceptSchema } from "../api/schema.js";
import { ACTION_LIST } from "../contract.js";
import { preProcessing } from "./helper.js";
import * as svc from "./service.js";

export const archiveConceptProcessor = defineProcessor(
	ACTION_LIST.CONCEPT_PAIR.code,
	ArchiveConceptSchema.array,
	async (input) => {
		const { pool, entryList } = preProcessing(input.payload);

		await svc.createItemList(pool);

		return { pool, entryList };
	},
);
