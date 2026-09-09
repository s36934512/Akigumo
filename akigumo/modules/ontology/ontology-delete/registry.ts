import { workflowRegistry } from "#akigumo/kernel/index.js";
import * as kernelProcessorsRegistry from "#akigumo/kernel/processors/registry.js";

import { WORKFLOW_TYPE } from "./contract.js";
import { ontologyDeleteProcessor } from "./core/processor.js";

import { machine } from "./machine/machine.js";

export const ontologyDeleteCapability = {
	module: "ontology-delete",
	version: "1.0.0",
	workflows: [{ type: WORKFLOW_TYPE, machine }],
	processors: [ontologyDeleteProcessor],
	routes: [{ method: "POST", path: "/ontology/delete" }],
};

export function registerOntologyDeleteCapability() {
	workflowRegistry.registerWorkflow({ workflowType: WORKFLOW_TYPE, machine });
	kernelProcessorsRegistry.registerProcessor(ontologyDeleteProcessor);
	return ontologyDeleteCapability;
}
