import { workflowRegistry } from "#akigumo/kernel/index.js";
import * as kernelProcessorsRegistry from "#akigumo/kernel/processors/registry.js";

import { WORKFLOW_TYPE } from "./contract.js";
import { archiveDeleteProcessor } from "./core/processor.js";
import { machine } from "./machine/machine.js";

export const archiveDeleteCapability = {
	module: "archive-delete",
	version: "1.0.0",
	workflows: [{ type: WORKFLOW_TYPE, machine }],
	processors: [archiveDeleteProcessor],
	routes: [{ method: "POST", path: "/archive/delete" }],
};

export function registerArchiveDeleteCapability() {
	workflowRegistry.registerWorkflow({ workflowType: WORKFLOW_TYPE, machine });
	kernelProcessorsRegistry.registerProcessor(archiveDeleteProcessor);
	return archiveDeleteCapability;
}
