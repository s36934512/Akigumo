import { WorkflowStateModel } from "generated/prisma/models";
import { AnyStateMachine, createActor, Snapshot } from "xstate";

/**
 * Converts persisted snapshot payload into XState snapshot object when valid.
 */
function hydrateSnapshot(snapshot: any): Snapshot<any> | undefined {
    if (!snapshot || typeof snapshot !== 'object') return undefined;

    // 這裡你可以做進一步的 Schema 驗證，例如檢查 snapshot 是否有 status 欄位
    // 如果資料庫真的存了 null，這裡會被過濾掉
    return snapshot as Snapshot<any>;
}


export const createActorFromState = (machine: AnyStateMachine, dbState: WorkflowStateModel) => {
    const isFreshStart = !dbState.snapshot;
    const baseInput = { correlationId: dbState.correlationId };
    const taskInput = (typeof dbState.tasks === 'object' && dbState.tasks !== null)
        ? dbState.tasks
        : {};

    return createActor(machine, {
        input: {
            ...baseInput,
            ...taskInput
        },
        snapshot: !isFreshStart ? hydrateSnapshot(dbState.snapshot) : undefined
    });
};