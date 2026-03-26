import { AnyStateMachine } from 'xstate';

/**
 * Workflow registration descriptor.
 */
export interface WorkflowDefinition {
    workflowId: string
    machine: AnyStateMachine;
}

/**
 * In-memory registry for workflow state machines.
 */
export class WorkflowRegistry {
    private static registry = new Map<string, AnyStateMachine>();

    /**
     * Registers a workflow machine by workflow ID.
     */
    static register(definition: WorkflowDefinition) {
        const key = definition.workflowId;
        this.registry.set(key, definition.machine);
    }

    /**
     * Gets workflow machine by ID.
     *
     * @throws Error when workflow ID has not been registered.
     */
    static get(workflowId: string): AnyStateMachine {
        const machine = this.registry.get(workflowId);
        if (!machine) {
            throw new Error(`[WorkflowRegistry] 找不到 ID 為 ${workflowId} 的狀態機，請檢查註冊清單。`);
        }
        return machine;
    }
}