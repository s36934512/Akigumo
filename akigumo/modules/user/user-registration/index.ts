/**
 * @file Entry point for user-registration module
 *
 * Why import side-effects here?
 * This file is the module's public interface and initialization trigger.
 * By registering the workflow and importing processors here, runtime boot only
 * needs to import this slice once for deterministic handler availability.
 */
export { handleUserRegistration } from './api/handler';

import './core/processors';
import { WorkflowRegistry } from 'akigumo/kernel';

import { USER_CREATE_WORKFLOW_NAME as WORKFLOW_NAME } from './contract';
import { userRegistrationMachine as workflowMachine } from './machine/machine';

WorkflowRegistry.register({
    workflowId: WORKFLOW_NAME,
    machine: workflowMachine,
});

