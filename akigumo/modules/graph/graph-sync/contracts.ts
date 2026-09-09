/**
 * @file Domain-level contracts for file graph module.
 *
 * Why: File Graph is a domain module responsible for file-to-graph synchronization.
 * This layer defines what operations are meaningful in the file graph domain.
 */

import {
	createEventCodes,
	type InferActionCode,
	type InferEventCode,
} from "#akigumo/shared/contracts/index.js";
import { ActionCategory, Severity } from "#generated/prisma/enums.js";

export const WORKFLOW_NAME = "GRAPH_SYNC_FLOW_V1" as const;
/**
 * Domain-level actions for file graph synchronization.
 * Why: These represent intent-driven operations in the domain, not implementation details.
 */
export const ACTIONS = {
	/**
	 * Fired when a file intent is created and ready for graph synchronization.
	 * Why: This is the domain event that triggers file-to-graph conversion.
	 * The payload contains only business facts: fileId, itemId, path, and hierarchy.
	 */
	INTENT_CREATED: {
		code: "GRAPH_INTENT_CREATED",
		name: "檔案圖譜意圖已建立",
		category: ActionCategory.DATA_OP,
		severity: Severity.LOW,
	},
} as const;

export const EventCode = createEventCodes(ACTIONS);

export type ActionCode = InferActionCode<typeof ACTIONS>;
export type EventCode = InferEventCode<typeof ACTIONS>;
