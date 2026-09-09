import type { JsonValue } from "@prisma/client/runtime/client";
import { type AnyStateMachine, createActor, type Snapshot } from "xstate";

import { prisma } from "#akigumo/db/prisma.js";
import { SUCCESS } from "#akigumo/shared/schemas/common.js";
import {
	DataPoolSchema,
	type MachineEvent,
} from "#akigumo/shared/schemas/machine.js";
import type { WorkflowStateModel } from "#generated/prisma/models.js";
import * as workflowRegistry from "./registry.js";
import type { WorkflowReceive } from "./schema.js";

/**
 * Converts persisted snapshot payload into XState snapshot object when valid.
 */
function hydrateSnapshot(snapshot: JsonValue): Snapshot<unknown> | undefined {
	if (!snapshot || typeof snapshot !== "object") return undefined;

	// 這裡你可以做進一步的 Schema 驗證，例如檢查 snapshot 是否有 status 欄位
	// 如果資料庫真的存了 null，這裡會被過濾掉
	return snapshot as Snapshot<unknown>;
}

function createActorFromState(
	machine: AnyStateMachine,
	workflow: WorkflowStateModel,
) {
	const result = DataPoolSchema.safeParse(workflow.dataPool);
	const input = result.success ? result.data.input : {};

	return createActor(machine, {
		input: {
			...input,
		},
		snapshot: hydrateSnapshot(workflow.snapshot),
	});
}

export async function createWorkflowMachine(id: string) {
	const workflow = await prisma.workflowState.findUnique({
		where: { id },
	});
	if (!workflow) return;

	const machine = workflowRegistry.getWorkflow(workflow.workflowType);
	if (!machine) return;

	return createActorFromState(machine, workflow);
}

export function createEventMessage(event: WorkflowReceive): MachineEvent {
	const eventType = `${event.sender.action}_${event.status.status}`;
	const payload =
		event.status.status === SUCCESS
			? event.status.data
			: event.status.error;

	return { type: eventType, payload };
}
