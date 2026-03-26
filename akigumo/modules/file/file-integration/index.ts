/**
 * @file Entry point for file-integration module
 *
 * Module-level side effects register the child-workflow and processors early
 * so outbox tasks dispatched by the parent file-receiver workflow can resolve
 * handlers deterministically across process restarts.
 */
import './core';
import { WorkflowRegistry } from 'akigumo/kernel';

import { processFileItemMachine as workflowMachine } from './machine/machine';
import { FILE_PROCESS_ITEM_WORKFLOW_NAME as WORKFLOW_NAME } from '../common/contract';

WorkflowRegistry.register({
    workflowId: WORKFLOW_NAME,
    machine: workflowMachine
});
