import { workflowRegistry } from "#akigumo/kernel/index.js";
import * as kernelProcessorsRegistry from "#akigumo/kernel/processors/registry.js";

import { WORKFLOW_TYPE } from "./contract.js";
import { ontologyEditorProcessor } from "./core/processor.js";
import { machine } from "./machine/machine.js";

export const ontologyEditorCapability = {
	module: "ontology-editor",
	version: "1.0.0",
	workflows: [{ type: WORKFLOW_TYPE, machine }],
	processors: [ontologyEditorProcessor],
	routes: [{ method: "POST", path: "/ontology/editor" }],
};

export function registerOntologyEditorCapability() {
	workflowRegistry.registerWorkflow({ workflowType: WORKFLOW_TYPE, machine });
	kernelProcessorsRegistry.registerProcessor(ontologyEditorProcessor);
	return ontologyEditorCapability;
}
