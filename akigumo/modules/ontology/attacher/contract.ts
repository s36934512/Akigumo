import {
	createEventCodes,
	type InferActionCode,
	type InferEventCode,
} from "#akigumo/shared/contracts/index.js";
import { ActionCategory, Severity } from "#generated/prisma/enums.js";

// A unique, versioned name for the state machine associated with this workflow.
// "V1" indicates that future, non-backward-compatible changes will require a new name.
export const WORKFLOW_TYPE = "CONCEPT_ATTACHER_FLOW_V1" as const;

export const ACTIONS = {
	ATTACHER: {
		code: "ATTACHER",
		name: "更新屬性",
		category: ActionCategory.DATA_OP,
		severity: Severity.LOW,
	},
} as const;

export const EventCode = createEventCodes(ACTIONS);

export type ActionCode = InferActionCode<typeof ACTIONS>;
export type EventCode = InferEventCode<typeof ACTIONS>;
