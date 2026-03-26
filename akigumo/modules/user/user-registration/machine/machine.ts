/**
 * @file State machine for user registration workflow.
 */

import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import { assign, setup } from 'xstate';

import { machineActions } from './logic';
import {
    MachineContext,
    MachineEvents,
} from './schema';
import { USER_AGGREGATE } from '../../common/contract';
import { USER_ACTIONS } from '../contract';

export const userRegistrationMachine = setup({
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
                aggregateType: USER_AGGREGATE,
                operation: USER_ACTIONS.SYNC.code,
                payload: context.userIds,
            }),
        })),
        clearNextTask: assign({ nextTask: undefined }),
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMBVWYqAxLgMoCiASgPoDCl5AggCrnUBijAkgDK4MBtAAwBdRKAAOAe1gBLLLKkA7cSAAeiACwAmADQgAnom0A2ABwA6AJw2rZgKzbtAdgDMARmfuAvt-1pMHHxCEgoaUgBNADlaDm4+QVFVaTkFZVUNBB19IwRPVwsTeyES7U0rIXsPK19-dGw8AmIAKmExJBAU+UUVDszsw0QzdwtXEqF3d1d7ZxM7ex8-EACG4NQLUkYANS4ogHFqMipQqjoGFjZSXFpaclJSNuSZbvS+xFczE2tioU0hMzGLiEekGCFcHws4wmbncmjcf2ctWW9SCTQ20VouwOR0oJ3CGOoVxudweSQ6XTSvVAmTME0K4ysJk0zI80xy7wWFh0xQ89hMzjKpl8SyUUggcFUK1RhCeqR6GUQAFoTOyEMqkVLGoQNtssYcwrKXlT1MYxqN3NpHCZzH9PppVa5nJpRj9TFYFs4hJ7NBqUVr1pEYnqcYbKQqECZXNouZahCZ3ACbFVXA6nS7SnMPV7fr7Av6NtdbvdQ-K3nkhB5Ic4FvyHF6zM5nA7yhZPSUPNWFr8qrnVmjOLxyAAREuvanvKwjd0lW2Az0g3KeKex4G11xWD7C7xAA */
    id: 'createUser',
    initial: 'SAVING_USER',
    on: {
        USER_CREATE_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        USER_SYNC_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        '*': {
            guard: 'shouldFailUnhandledEventWithPendingTask',
            target: '.FAILED',
            actions: 'handleFailure',
        },
    },
    context: {
        correlationId: null,
        userIds: [],
        error: null,
        nextTask: null,
    },
    states: {
        SAVING_USER: {
            on: {
                USER_CREATE_SUCCESS: {
                    target: 'SYNCING_USER',
                    actions: ['handleSaveSuccess', 'prepareSyncTask'],
                },
            },
        },
        SYNCING_USER: {
            on: {
                USER_SYNC_SUCCESS: {
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
