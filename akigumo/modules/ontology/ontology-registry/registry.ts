import { workflowRegistry } from "#akigumo/kernel/index.js";
import * as kernelProcessorsRegistry from "#akigumo/kernel/processors/registry.js";

import { WORKFLOW_TYPE } from "./contract.js";
import { ontologyRegistryProcessor } from "./core/processor.js";
import { machine } from "./machine/machine.js";

export const ontologyRegistryCapability = {
	module: "ontology-registry",
	version: "1.0.0",
	workflows: [{ type: WORKFLOW_TYPE, machine }],
	processors: [ontologyRegistryProcessor],
	routes: [{ method: "POST", path: "/ontology/registry" }],
};

export function registerOntologyRegistryCapability() {
	workflowRegistry.registerWorkflow({ workflowType: WORKFLOW_TYPE, machine });
	kernelProcessorsRegistry.registerProcessor(ontologyRegistryProcessor);
	return ontologyRegistryCapability;
}
