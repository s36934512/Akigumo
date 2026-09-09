import {
	createEventCodes,
	type InferActionCode,
	type InferEventCode,
} from "#akigumo/shared/contracts/index.js";
import { ActionCategory, Severity } from "#generated/prisma/enums.js";

export const WORKFLOW_TYPE = "ONTOLOGY_DELETE_FLOW_V1" as const;

export const ACTION_LIST = {
	DELETE: {
		code: "ONTOLOGY_DELETE",
		name: "概念刪除",
		category: ActionCategory.DATA_OP,
		severity: Severity.MEDIUM,
	},
} as const;

export const EventCode = createEventCodes(ACTION_LIST);

export type ActionCode = InferActionCode<typeof ACTION_LIST>;
export type EventCode = InferEventCode<typeof ACTION_LIST>;
