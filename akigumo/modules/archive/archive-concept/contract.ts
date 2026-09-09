import {
	createEventCodes,
	type InferActionCode,
	type InferEventCode,
} from "#akigumo/shared/contracts/index.js";
import { ActionCategory, Severity } from "#generated/prisma/enums.js";

export const WORKFLOW_TYPE = "ARCHIVE_CONCEPT_FLOW_V1" as const;

export const ACTION_LIST = {
	CONCEPT_PAIR: {
		code: "ARCHIVE_CONCEPT_PAIR",
		name: "建立 描述檔案 的 配對標記",
		category: ActionCategory.DATA_OP,
		severity: Severity.MEDIUM,
	},
	CONCEPT_TAG: {
		code: "ARCHIVE_CONCEPT_TAG",
		name: "建立 檔案的標籤標記",
		category: ActionCategory.DATA_OP,
		severity: Severity.LOW,
	},
} as const;

export const EventCode = createEventCodes(ACTION_LIST);

export type ActionCode = InferActionCode<typeof ACTION_LIST>;
export type EventCode = InferEventCode<typeof ACTION_LIST>;
