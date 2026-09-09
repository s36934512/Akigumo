import { workflowRegistry } from "#akigumo/kernel/index.js";
import * as kernelProcessorsRegistry from "#akigumo/kernel/processors/registry.js";

import { WORKFLOW_TYPE } from "./contract.js";
import { archiveConceptProcessor } from "./core/processor.js";
import { machine } from "./machine/machine.js";

export const archiveConceptCapability = {
	module: "archive-concept",
	version: "1.0.0",
	workflows: [{ type: WORKFLOW_TYPE, machine }],
	processors: [archiveConceptProcessor],
	routes: [{ method: "POST", path: "/archive/concept" }],
};

export function registerArchiveConceptCapability() {
	workflowRegistry.registerWorkflow({ workflowType: WORKFLOW_TYPE, machine });
	kernelProcessorsRegistry.registerProcessor(archiveConceptProcessor);
	return archiveConceptCapability;
}
