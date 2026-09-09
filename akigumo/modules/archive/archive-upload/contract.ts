import {
	createEventCodes,
	type InferActionCode,
	type InferEventCode,
} from "#akigumo/shared/contracts/index.js";
import { ActionCategory, Severity } from "#generated/prisma/enums.js";

export const WORKFLOW_TYPE = "ARCHIVE_UPLOAD_FLOW_V1" as const;

export const ACTION_LIST = {
	INTENT: {
		code: "ARCHIVE_INTENT",
		name: "建立上傳意圖",
		category: ActionCategory.DATA_OP,
		severity: Severity.LOW,
	},
	SEAL: {
		code: "ARCHIVE_SEAL",
		name: "上傳完成處理",
		category: ActionCategory.DATA_OP,
		severity: Severity.MEDIUM,
	},
} as const;

export const EventCode = createEventCodes(ACTION_LIST);

export type ActionCode = InferActionCode<typeof ACTION_LIST>;
export type EventCode = InferEventCode<typeof ACTION_LIST>;
