import { workflowRegistry } from "#akigumo/kernel/index.js";
import * as kernelProcessorsRegistry from "#akigumo/kernel/processors/registry.js";

import { WORKFLOW_TYPE } from "./contract.js";
import {
	archiveIntentProcessor,
	archiveSealProcessor,
} from "./core/processor.js";
import { machine } from "./machine/machine.js";

export const archiveUploadCapability = {
	module: "archive-upload",
	version: "1.0.0",
	workflows: [{ type: WORKFLOW_TYPE, machine }],
	processors: [archiveIntentProcessor, archiveSealProcessor],
	routes: [
		{ method: "POST", path: "/archive/tus-intent" },
		{ method: "POST", path: "/archive/tus-seal" },
	],
};

export function registerArchiveUploadCapability() {
	workflowRegistry.registerWorkflow({ workflowType: WORKFLOW_TYPE, machine });
	kernelProcessorsRegistry.registerProcessor(archiveIntentProcessor);
	kernelProcessorsRegistry.registerProcessor(archiveSealProcessor);
	return archiveUploadCapability;
}
