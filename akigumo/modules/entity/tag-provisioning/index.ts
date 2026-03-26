/**
 * @file Entry point for the vertical slice: "Entity Tag Provisioning".
 *
 * Why import side-effects here?
 * This file acts as the module's public interface and initialization trigger.
 * By importing `workflow.init` and `processors`, we ensure that when this slice is loaded
 * by the application, its state machines and background processors are automatically
 * registered with the central kernel. This follows a convention-over-configuration
 * approach for modular components.
 */
export { handleTagProvisioning } from './api/handler';

import './core/processors';
import { WorkflowRegistry } from 'akigumo/kernel';

import { ENTITY_TAG_PROVISIONING_WORKFLOW_NAME as WORKFLOW_NAME } from './contract';
import { tagProvisioningMachine as workflowMachine } from './machine/machine';

WorkflowRegistry.register({
    workflowId: WORKFLOW_NAME,
    machine: workflowMachine
});
