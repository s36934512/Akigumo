import { workflowRegistry } from "#akigumo/kernel/index.js";
import * as kernelProcessorsRegistry from "#akigumo/kernel/processors/registry.js";

import { WORKFLOW_TYPE } from "./contract.js";
import { userRegistrationProcessor } from "./core/processor.js";
import { machine } from "./machine/machine.js";

export const userRegistrationCapability = {
	module: "user-registration",
	version: "1.0.0",
	workflows: [{ type: WORKFLOW_TYPE, machine }],
	processors: [userRegistrationProcessor],
	routes: [{ method: "POST", path: "/user/registration" }],
};

export function registerUserRegistrationCapability() {
	workflowRegistry.registerWorkflow({ workflowType: WORKFLOW_TYPE, machine });
	kernelProcessorsRegistry.registerProcessor(userRegistrationProcessor);
	return userRegistrationCapability;
}
