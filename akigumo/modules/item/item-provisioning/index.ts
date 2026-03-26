/**
 * @file Entry point for item-provisioning module
 *
 * This file is the module's public interface and initialization trigger.
 * Importing this slice once ensures its workflow and processors are registered.
 */

export { handleItemProvisioning } from './api/handler';

import './core/processors';
import { WorkflowRegistry } from 'akigumo/kernel';

import { ITEM_CREATE_WORKFLOW_NAME as WORKFLOW_NAME } from './contract';
import { itemProvisioningMachine as workflowMachine } from './machine/machine';

WorkflowRegistry.register({
    workflowId: WORKFLOW_NAME,
    machine: workflowMachine,
});
