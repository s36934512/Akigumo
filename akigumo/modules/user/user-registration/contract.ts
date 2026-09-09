import {
	createEventCodes,
	type InferActionCode,
	type InferEventCode,
} from "#akigumo/shared/contracts/index.js";
import { ActionCategory, Severity } from "#generated/prisma/enums.js";

export const WORKFLOW_TYPE = "USER_REGISTRATION_FLOW_V1" as const;

export const ACTION_LIST = {
	CREATE: {
		code: "USER_CREATE",
		name: "建立使用者",
		category: ActionCategory.DATA_OP,
		severity: Severity.LOW,
	},
} as const;

export const EventCode = createEventCodes(ACTION_LIST);

export type ActionCode = InferActionCode<typeof ACTION_LIST>;
export type EventCode = InferEventCode<typeof ACTION_LIST>;
