/**
 * @file State machine for entity creation workflow
 *
 * The workflow is modeled as explicit states because entity creation spans
 * multiple systems with different consistency guarantees.
 */

import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import { assign, setup } from 'xstate';

import { machineActions } from './logic';
import {
    MachineContext,
    MachineEvents
} from './schema';
import { ENTITY_AGGREGATE } from '../../common/contract';
import { ENTITY_TAG_PROVISIONING_ACTIONS } from '../contract';

/**
 * XState machine for entity creation orchestration
 *
 * Why stateful orchestration instead of a single async handler?
 * - Context is persisted and can be resumed after process restarts
 * - CREATE and SYNC have distinct failure/retry semantics
 * - Runtime can expose deterministic terminal states (SUCCESS or FAILED)
 * - Monitoring can correlate each transition via correlationId
 */
export const tagProvisioningMachine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents
    },
    guards: {
        shouldFailUnhandledEventWithPendingTask: ({ context, event }) => {
            const eventType = event.type || '';
            if (eventType.startsWith('xstate.')) return false;
            return context.nextTask !== null;
        }
    },
    actions: {
        handleSaveSuccess: assign(machineActions.handleSaveSuccess),

        handleFailure: assign(machineActions.handleFailure),
        /**
         * Build pending SYNC task for asynchronous processor execution
         *
         * This decouples transition timing from worker execution timing.
         */
        prepareSyncTask: assign(({ context }) => ({
            nextTask: createPendingTask({
                aggregateType: ENTITY_AGGREGATE,
                operation: ENTITY_TAG_PROVISIONING_ACTIONS.SYNC_TAGS_TO_GRAPH.code,
                payload: context.entityList,
            })
        })),
        /**
         * Clear pending task after successful sync
         *
         * Removing nextTask prevents accidental duplicate dispatch.
         */
        clearNextTask: assign({ nextTask: undefined })
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMBRAdlgJZYCeAxACoCCA4gPoAKASgPIBqAkgMqesBy9AGLVOAGQCqzXAG0ADAF1EoAA4B7WCSJr8ykAA9EAFgBMAGhClEJgGwBOAHRzncgIw2bAZjtHnRgL7+FmiYOATEZFR09NwAmvwAwvSUrPS0zNSMABLCopLS8kpIIOqaxDp6hgimFlYIrgDsng42AKzOrUbuRg12ng0NgcHo2HiEJBQAVIV6pVoVxVU1logAHK4Oni6urR6dDa0mQyAho+ETDtzUXPwMuPyUnJSxUQwsHDx8gtwSCQm43G4M2Kc3KukWiE8qxsDjs7TcDRMbmhh1atUhUKc21WJgaRlWRiMbWOpzC4zIl3iCU4t3o90ez1eMSpyVS6UyOR+fwBQMUsw083BoCqq08Jgc+IOrjkPlMJjsrnRCE8rQ2pnaJk1q1arQJJlagSCIHwaggcD0pLGETqqgFYMqiAAtDYlc6SSMydbLtcaXcHk9YvyytohQZrK4jC0TEY7LHWnZVs4Gl4lf1IyrnCZXLYVa0Gjt3aErRc4olfXT-c8g4KHQgbD0o+1vKYE70Gqm8Zt4Vmczr8wajZbzhSuf9AdX7RD6q5MXYXFnVW08e2VsqYw4GvOZ84VYmbIWzuTSA4ROJcAARCch2veDZw5yNJGuFH6pWNO-6uRi6U9OzR1aGv4QA */
    id: 'createEntity',
    initial: 'SAVING_ENTITY',
    on: {
        TAG_PROVISION_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        TAG_SYNC_TO_GRAPH_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        '*': {
            guard: 'shouldFailUnhandledEventWithPendingTask',
            target: '.FAILED',
            actions: 'handleFailure'
        }
    },
    context: {
        correlationId: null,
        entityList: [],
        error: null,
        nextTask: null
    },
    states: {
        SAVING_ENTITY: {
            on: {
                TAG_PROVISION_SUCCESS: {
                    target: 'SYNCING_ENTITY',
                    actions: ['handleSaveSuccess', 'prepareSyncTask']
                }
            }
        },
        SYNCING_ENTITY: {
            on: {
                TAG_SYNC_TO_GRAPH_SUCCESS: {
                    target: 'SUCCESS',
                    actions: 'clearNextTask'
                }
            }
        },
        SUCCESS: {
            entry: 'clearNextTask',
            type: 'final'
        },
        FAILED: {
            entry: 'clearNextTask',
            type: 'final'
        }
    }
});