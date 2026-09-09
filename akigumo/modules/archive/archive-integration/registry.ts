import { workflowRegistry } from "#akigumo/kernel/index.js";
import * as kernelProcessorsRegistry from "#akigumo/kernel/processors/registry.js";

import { WORKFLOW_TYPE } from "./contract.js";
import {
	archiveIntegrationDispatchProcessor,
	archiveIntegrationNotifyParentProcessor,
	archiveIntegrationNotifyProcessor,
	archiveIntegrationProcessor,
	archiveIntegrationTranscodeProcessor,
	archiveIntegrationUncompressProcessor,
} from "./core/processor.js";
import { machine } from "./machine/machine.js";

export const archiveIntegrationCapability = {
	module: "archive-integration",
	version: "1.0.0",
	workflows: [{ type: WORKFLOW_TYPE, machine }],
	processors: [
		archiveIntegrationProcessor,
		archiveIntegrationNotifyProcessor,
		archiveIntegrationProcessor,
		archiveIntegrationDispatchProcessor,
		archiveIntegrationTranscodeProcessor,
		archiveIntegrationUncompressProcessor,
	],
};

export function registerArchiveIntegrationCapability() {
	workflowRegistry.registerWorkflow({ workflowType: WORKFLOW_TYPE, machine });
	kernelProcessorsRegistry.registerProcessor(archiveIntegrationProcessor);
	kernelProcessorsRegistry.registerProcessor(
		archiveIntegrationNotifyProcessor,
	);
	kernelProcessorsRegistry.registerProcessor(
		archiveIntegrationNotifyParentProcessor,
	);
	kernelProcessorsRegistry.registerProcessor(
		archiveIntegrationDispatchProcessor,
	);
	kernelProcessorsRegistry.registerProcessor(
		archiveIntegrationTranscodeProcessor,
	);
	kernelProcessorsRegistry.registerProcessor(
		archiveIntegrationUncompressProcessor,
	);
	return archiveIntegrationCapability;
}
