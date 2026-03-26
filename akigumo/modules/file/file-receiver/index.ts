/**
 * @file Entry point for file-receiver module
 *
 * Module-level side effects register the workflow, processors, and TUS protocol
 * hooks early so outbox execution and upload events can resolve handlers
 * deterministically across process restarts.
 */

export { default as handlefileReceiver } from './api/handler';

import './core';
import { WorkflowRegistry } from 'akigumo/kernel';

import { FILE_CREATE_WORKFLOW_NAME as WORKFLOW_NAME } from './contract';
import { fileReceiverMachine as workflowMachine } from './machine/machine';

WorkflowRegistry.register({
    workflowId: WORKFLOW_NAME,
    machine: workflowMachine
});
