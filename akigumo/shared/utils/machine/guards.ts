import type { MachineArgs } from "#akigumo/shared/schemas/machine.js";

export const shouldFailUnhandledEvent = ({ context, event }: MachineArgs) => {
	const eventType = event.type || "";
	if (eventType.startsWith("xstate.")) return false;
	return context.nextTask !== null;
};
