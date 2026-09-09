import type { AnyStateMachine } from "xstate";

/**
 * Workflow registration descriptor.
 */
export interface WorkflowDefinition {
	workflowType: string;
	machine: AnyStateMachine;
}

// 模組私有的 Map，不對外公開以確保封裝性
const registry = new Map<string, AnyStateMachine>();

/**
 * Registers a workflow machine by workflow type.
 */
export function registerWorkflow(definition: WorkflowDefinition): void {
	const key = definition.workflowType;
	registry.set(key, definition.machine);
}

/**
 * Gets workflow machine by type.
 *
 * @throws Error when workflow type has not been registered.
 */
export function getWorkflow(workflowType: string): AnyStateMachine {
	const machine = registry.get(workflowType);
	if (!machine) {
		throw new Error(
			`[workflowRegistry] 找不到 type 為 ${workflowType} 的狀態機，請檢查註冊清單。`,
		);
	}
	return machine;
}
