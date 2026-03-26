/**
 * @file State machine for file-receiver workflow
 *
 * Drives the full lifecycle from upload intent to graph-sync completion.
 * Each phase (intent, initial sync, child dispatch, batch wait, final sync)
 * maps to a discrete state so the workflow can be resumed deterministically
 * from the outbox on process restart.
 */

import { logger } from 'akigumo/db/pino';
import { SyncFilePayloadSchema } from 'akigumo/modules/file/file-integration/core/processors/sync.schema';
import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import { setup, assign } from 'xstate';

import { MachineContext, MachineEvents, MachineInput } from './schema';
import { FILE_AGGREGATE } from '../../common/contract';
import { FILE_RECEIVER_ACTIONS } from '../contract';
import { machineActions } from './logic';

export const fileReceiverMachine = setup({
    types: {
        input: {} as MachineInput,
        context: {} as MachineContext,
        events: {} as MachineEvents
    },
    guards: {
        isAllFilesDone: ({ context }) => {
            const { totalIds, successIds, failedIds } = context.processingProgress;
            console.log('Checking if all files are done:', { totalIds, successIds, failedIds });
            return totalIds.length > 0 && (successIds.length + failedIds.length + 1) === totalIds.length;
        },
        shouldFailUnhandledEventWithPendingTask: ({ context, event }) => {
            const eventType = event.type || '';
            if (eventType.startsWith('xstate.')) return false;
            return context.nextTask !== null;
        }
    },
    actions: {
        /**
         * Narrow INTENT response to the fields the machine needs
         *
         * We keep only the fields needed for downstream states so workflow
         * context records stay small and reload quickly on restart.
         */
        handleIntentSuccess: assign(machineActions.handleIntentSuccess),

        /**
         * Parent graph node must exist before child item nodes can reference it
         *
         * Enqueuing sync first prevents orphan edges in the graph database
         * when child items are dispatched in the next state.
         */
        prepareSyncTask: assign(({ context }) => ({
            nextTask: createPendingTask({
                aggregateType: FILE_AGGREGATE,
                operation: FILE_RECEIVER_ACTIONS.SYNC_INTENT_TO_GRAPH.code,
                payload: context
            })
        })),

        /**
         * Each file gets its own child workflow to isolate failures
         *
         * Decoupling each file into its own child workflow lets individual items
         * fail and retry without blocking the rest of the batch.
         */
        prepareSubTasks: assign(({ context }) => ({
            processingProgress: {
                totalIds: context.files.map(f => f.fileId),
                successIds: [],
                failedIds: []
            },
            nextTask: createPendingTask({
                aggregateType: FILE_AGGREGATE,
                operation: FILE_RECEIVER_ACTIONS.INIT_ITEM.code,
                payload: context.files.map((f) => ({
                    fileId: f.fileId,
                    parentId: context.correlationId,
                    uncompressMaxDepth: context.uncompressMaxDepth,
                })),
                correlationId: context.correlationId || undefined,
            })
        })),

        /**
         * Derived labels are only available after all items complete
         *
         * Labels and relationship properties depend on item processing results,
         * so this sync must run after all child workflows have confirmed completion.
         */
        prepareFinalizeTask: assign(({ context }) => ({
            workflowStatus: 'SYNCING',
            nextTask: createPendingTask({
                aggregateType: FILE_AGGREGATE,
                operation: FILE_RECEIVER_ACTIONS.SYNC.code,
                payload: SyncFilePayloadSchema.parse(
                    context.files.map((file) => ({ fileId: file.fileId, uploading: false }))
                ),
                correlationId: context.correlationId || undefined,
            })
        })),

        notifyUploadUrlViaSSE: machineActions.notifyUploadUrlViaSSE,

        notifyIntegrationStart: assign(({ context }) => ({
            nextTask: createPendingTask({
                aggregateType: FILE_AGGREGATE,
                operation: FILE_RECEIVER_ACTIONS.START_NOTIFY.code,
                payload: context.files,
            })
        })),

        /**
         * Remove the pending task reference after successful enqueue
         *
         * Clearing prevents accidental duplicate enqueue when the workflow
         * state is rehydrated from the database on process restart.
         */
        clearNextTask: assign({ nextTask: null }),

        /**
         * Increment per-file completion counter without a DB query
         *
         * The `isAllFilesDone` guard reads this counter so batch-completion
         * can be detected in memory without a database query.
         */
        completedNotify: assign(machineActions.completedNotify),

        /**
         * Persist failure reason and mark workflow as FAILED
         *
         * Storing the error message in context enables trace-based diagnostics
         * without replaying the full workflow from the outbox.
         */
        handleFailure: assign(machineActions.handleFailure),

        loggerContext: (context) => {
            logger.debug({ label: 'FileReceiverMachine', context }, 'Current machine context');
        }
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMAxAlgDZgDEuAkgDICiA+gMIBK1AggCp3kByHPtuLKgFVmAbQAMAXUSgADgHtY+LPnkA7GSAAeiACwAmADQgAnnoAcANgB0ugJx3zdgKx3dAZg9uA7AF9fxmiYOATEZFR0AMoAmlz0tFzUAPK6AFL8gpQi1BLSSCAKSirqmjoIBsZmCM7mAIzW5vZutR7ulm2W-oHo2HhEpBQ0tNzkbMMcALIZwmJSmoXKqhr5ZRWmiJbe3ta1DnYte7ridl0gQb2hAxG0zPTU5ABq1IwJSWzkuNHTWbN5coqLEorPRGdYILb6azOezmWHOSzOWp1XSnc4hfokABUuXmAOKy1Aq1BVSs2ycdm8SP05n0tXEuj8ATOPXRYWxtT+BTxS1KIMqiDa230DnMlMsbns8M6TLRfWI1geLEo5AAIuxuABxYY8ag8cJDJisDja3hjSJCeh3SKRHH5Bb43nlbx2HbiN2WOruaHC8TefkIfT2az0xzwxG6XSWXaollysDWFXkSIABXY9AAErRzQAhWhsFiRADSkX1nC4o3G1Cm5st1Gttv+RR5wIQIts3mc4lF5lcdn0-f9gZdIZ7CJakejMtjl2sMTimpNurYJG4pqzsXibCStA1jBYyczNatNrmdu5QMJiBa7Ws3lFnec-fcDm8lkHlkhDN0os2dg9+30GNgjjawAHVBHeLgtWTRgkmPTVSyzfNGDGLg3g+L4jzrE9OXtZtLwQJEalvDtxH0MjA0sBl-VqV9rHFRxGkseldn0D0gIufowIghcYLg7CEMGOhbnuJ4XjQ95PizC1jwbLkmwvbREH7WpIX7TtfS7dxaio99dGDEVXFpOw2nMDjWXjcDRl42D4KgxCRMeZ5XkkzCZOw0QOVxBSCSUwi7xdL03VqNodKsFx-TqaxPEcZ9ahChxnFccyQLnegFyExC0oSZI0mk2t61PRtAV8spqRvJFvHcWF9GcbxxFqZx-XcN1ophLZ4o9arxGlJk1HkCA4E0WVLm8krHQAWjfMEpuDN15oW+bnBSmdFWVNVIK1VclzGh0W37fSezdKVVOOO9pqqNj6j2HtoQRcRkqnYCZ0TFM00PIRc3zItIl2-C-K2Gw7HmkyO28b97Hfa7DLuh8Tiezj5TShdtp4P7FLKVSg2cdwO2Y45AwMcxB2-awbvMNovUDaEVq4qzNtoPi7I1dHSqvWFzAaJoKV9JKWuJZStmDGEah0hwEUAhGLNnDcMoiVnHTYj9b1Uzse1owNGsHIWR2adxaS2GmpdS9zrQVlttKOYMP30UiPDq3RtecW9DO0qjGlhaVumeriBAiFVzYIiHXXdT1vWBv0wXMLtbx6qxYVxt3lv8XwgA */
    id: 'createFile',
    initial: 'VALIDATING_INTENT',
    on: {
        FILE_CREATE_INTENT_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        FILE_SYNC_NEO4J_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        FILE_INIT_ITEM_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        FILE_RECEIVER_NOTIFY_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        '*': [".FAILED", {
            guard: 'shouldFailUnhandledEventWithPendingTask',
            target: '.FAILED',
            actions: ['loggerContext', 'handleFailure']
        }]
    },
    context: ({ input }) => ({
        files: [],
        error: null,
        nextTask: null,
        notifyUploadId: null,
        processingProgress: {
            totalIds: [],
            successIds: [],
            failedIds: []
        },
        ...input
    }),
    states: {
        VALIDATING_INTENT: {
            entry: 'loggerContext',
            on: {
                FILE_CREATE_INTENT_SUCCESS: {
                    target: 'DISPATCH_SUB_TASKS',
                    actions: ['handleIntentSuccess', 'prepareSubTasks']
                },
            }
        },

        DISPATCH_SUB_TASKS: {
            entry: 'loggerContext',
            on: {
                FILE_INIT_ITEM_SUCCESS: {
                    target: 'SYNCING_INTENT',
                    actions: ['notifyUploadUrlViaSSE', 'prepareSyncTask']
                },
            }
        },

        SYNCING_INTENT: {
            entry: 'loggerContext',
            exit: 'clearNextTask',
            on: {
                INTENT_SYNC_TO_GRAPH_SUCCESS: {
                    target: 'WAITING_PROCESSING',
                    actions: 'notifyIntegrationStart'
                },
            }
        },

        WAITING_PROCESSING: {
            entry: 'loggerContext',
            on: {
                FILE_START_NOTIFY_SUCCESS: {
                    actions: 'clearNextTask'
                },
                FILE_RECEIVER_NOTIFY_SUCCESS: [
                    {
                        guard: 'isAllFilesDone',
                        target: 'SYNCING_FILE',
                        actions: ['completedNotify', 'prepareFinalizeTask']
                    },
                    {
                        actions: 'completedNotify'
                    }
                ],
            }
        },

        SYNCING_FILE: {
            exit: 'clearNextTask',
            on: {
                FILE_SYNC_NEO4J_SUCCESS: 'SUCCESS',
            }
        },

        SUCCESS: {
            type: 'final',
            entry: 'clearNextTask'
        },

        FAILED: {
            type: 'final',
            entry: 'clearNextTask'
        }
    }
});