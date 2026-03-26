import { AnyStateMachine } from 'xstate';

export interface WorkflowDefinition {
    id: string;
    machine: AnyStateMachine;
}

export class WorkflowRegistry {
    private static registry = new Map<string, AnyStateMachine>();

    static register(definition: WorkflowDefinition) {
        this.registry.set(definition.id, definition.machine);
    }

    static get(workflowId: string): AnyStateMachine {
        const machine = this.registry.get(workflowId);
        if (!machine) {
            throw new Error(`Workflow ${workflowId} 未註冊！`);
        }
        return machine;
    }
}