import { workflowRegistry } from "#akigumo/kernel/index.js";

import "./core/processors.js";
import { WORKFLOW_TYPE as workflowType } from "./contract.js";
import { machine } from "./machine/machine.js";

workflowRegistry.registerWorkflow({ workflowType, machine });

export { handleOntologyAttacher } from "./api/handler.js";
