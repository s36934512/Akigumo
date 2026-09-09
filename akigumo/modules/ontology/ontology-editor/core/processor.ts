import { defineProcessor } from "#akigumo/shared/factories/index.js";

import { OntologyEditorSchema } from "../api/schema.js";
import { ACTION_LIST } from "../contract.js";
import * as svc from "./service.js";

export const ontologyEditorProcessor = defineProcessor(
	ACTION_LIST.EDIT.code,
	OntologyEditorSchema.array,
	async (input) => {
		const idList = svc.updateItemList(input.payload);

		return idList;
	},
);
