import { ITEM_AGGREGATE } from 'akigumo/modules/item/common/contract';
import {
    ITEM_SEARCH_ACTIONS,
    ITEM_SEARCH_AGGREGATE,
} from 'akigumo/modules/item/item-search/contract';
import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import { assign, setup } from 'xstate';

import { ITEM_ACTIONS } from '../contract';
import { machineActions } from './logic';
import {
    MachineContext,
    MachineEvents,
} from './schema';

export const itemProvisioningMachine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },
    guards: {
        shouldFailUnhandledEventWithPendingTask: ({ context, event }) => {
            const eventType = event.type || '';
            if (eventType.startsWith('xstate.')) return false;
            return context.nextTask !== null;
        },
    },
    actions: {
        handleSaveSuccess: assign(machineActions.handleSaveSuccess),
        handleFailure: assign(machineActions.handleFailure),
        prepareSyncTask: assign(({ context }) => ({
            nextTask: createPendingTask({
                aggregateType: ITEM_AGGREGATE,
                operation: ITEM_ACTIONS.SYNC.code,
                payload: context.itemIds,
            }),
        })),
        prepareIndexTask: assign(({ context }) => ({
            nextTask: createPendingTask({
                aggregateType: ITEM_SEARCH_AGGREGATE,
                operation: ITEM_SEARCH_ACTIONS.UPSERT.code,
                payload: context.itemIds,
            }),
        })),
        clearNextTask: assign({ nextTask: undefined }),
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMBJHAtgMS4AqAogLID6AwgErkCCF1AYk7gDICqjA2gAYAuolAAHAPawAllhmSAdmJAAPRABYATABoQAT0RaAbAA4AdAFZBNrZYDMpgJz3r9gL7u9aTDnxhiMipqAGUATQA5WnZOXgERFSlZeSUVdQRtPUMEe2N7c1NrQS17Ess7J1MAdk9vdGw8QhIKGhDmeloACWoeAAU2+lIY7j5yIVEkECS5BWVJ9MyDTUsncy0bYoBGQVNNzeMXWpAfBv9iACpxxOkZ1PnNXSWETarjc02izY190xNBSqOJz8hHMISYADVcBEAOLUIKUZrBBjMVghHi0WjkEIhK6TaYpOagdL2JxvJxFFakrTkrRfLKIXZrJzM0zOSzGTZaDRVDSA+rAgKgyK0KGw+GI1rC0LozHY3ESG4EtIMwRk+yvTambT2GwOekIJwacxVLmVJyCKr-YwaJybPm+RqCqEAEXIAA1RXCWhLQu0uj1+uRBtKMVicQk8YrZsrnut8k47B9LBprM5HtlDcbTc4LVabXajopJBA4CogY6CNdktH7ggALTGfUN+2nEFgyEwr1UKu3QlqIylczGDaWTalTkc0z6vZVIc20mazbkqqmVwtgUEIVRT3wntK2vWwTmQRFUnay3GSzTl5zlmG61VSwrUzrivmF3unctPc1omIbb2EagjqsY1K7BoriWFOTwzreC67Muq6WK+ZygjKYY-ncf7PKObwWqOzjMuS7LpogLjHhswHbFoNHfChIIcNw5DOphfYLIImzmOSurMqBNJ0k8WivMeybMrSxgSdavKeO4QA */
    id: 'createItem',
    initial: 'SAVING_ITEM',
    on: {
        ITEM_CREATE_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        ITEM_SYNC_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        ITEM_SEARCH_UPSERT_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        '*': {
            guard: 'shouldFailUnhandledEventWithPendingTask',
            target: '.FAILED',
            actions: 'handleFailure',
        },
    },
    context: {
        correlationId: null,
        itemIds: [],
        error: null,
        nextTask: null,
    },
    states: {
        SAVING_ITEM: {
            on: {
                ITEM_CREATE_SUCCESS: {
                    target: 'SYNCING_ITEM',
                    actions: ['handleSaveSuccess', 'prepareSyncTask'],
                },
            },
        },
        SYNCING_ITEM: {
            on: {
                ITEM_SYNC_SUCCESS: {
                    target: 'INDEXING_ITEM',
                    actions: 'prepareIndexTask',
                },
            },
        },
        INDEXING_ITEM: {
            on: {
                ITEM_SEARCH_UPSERT_SUCCESS: {
                    target: 'SUCCESS',
                    actions: 'clearNextTask',
                },
            },
        },
        SUCCESS: {
            entry: 'clearNextTask',
            type: 'final',
        },
        FAILED: {
            entry: 'clearNextTask',
            type: 'final',
        },
    },
});
