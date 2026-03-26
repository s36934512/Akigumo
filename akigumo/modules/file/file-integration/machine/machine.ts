/**
 * @file State machine definition for file-integration child workflow
 *
 * Each file item runs its own instance of this machine so one slow or failed
 * item cannot block the rest of the batch. The machine drives a linear
 * DECIDING_PROCESS branch that routes to archive extraction, image
 * transcoding, or direct graph-sync depending on the strategy flags set by
 * the SEAL processor.
 */

import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';
import { setup, assign, assertEvent } from 'xstate';

import { FILE_AGGREGATE } from '../../common/contract';
import {
    FileIntegrationEventCode,
} from '../contract';
import { FILE_INTEGRATION_ACTIONS } from '../contract';
import { machineActions } from './logic';
import {
    MachineContext,
    MachineEvents,
    MachineInput,
} from './schema';
import { SyncFilePayloadSchema } from '../core/processors/sync.schema';
import { TranscodePayloadSchema } from '../core/processors/transcode/schema';
import { UncompressPayloadSchema } from '../core/processors/uncompress/schema';


export const processFileItemMachine = setup({
    types: {
        input: {} as MachineInput,
        context: {} as MachineContext,
        events: {} as MachineEvents
    },
    guards: {
        shouldStartProcessing: ({ context }) => {
            const { isSealSuccess, isNotifyStartSuccess } = context;
            return isSealSuccess && isNotifyStartSuccess;
        },
        shouldStartUncompress: ({ context }) => {
            if (!context.strategy.shouldUncompress) return false;
            return context.processingProgress.totalIds.length === 0;
        },
        shouldWaitSubTaskCompletion: ({ context }) => {
            if (!context.strategy.shouldUncompress) return false;

            const { totalIds, successIds, failedIds } = context.processingProgress;
            if (totalIds.length === 0) return false;

            return (successIds.length + failedIds.length) < totalIds.length;
        },
        shouldStartTranscode: ({ context }) => {
            if (!context.strategy.shouldTranscode) return false;
            return context.processingProgress.totalIds.length === 0;
        },
        shouldSkipRecursiveDispatch: ({ context }) => {
            return context.nextTask === null;
        },
        shouldFailUnhandledEventWithPendingTask: ({ context, event }) => {
            const eventType = event.type || '';
            if (eventType.startsWith('xstate.')) return false;
            return context.nextTask !== null;
        }
    },
    actions: {
        /**
         * Extract processing strategy from the SEAL processor result
         *
         * Strategy flags (shouldUncompress, shouldTranscode) are derived from
         * the file's detected category and must be stored before
         * DECIDING_PROCESS so the guards can route without another DB look-up.
         */
        handleSealSuccess: assign(machineActions.handleSealSuccess),

        handleStartNotifySuccess: assign(({ isNotifyStartSuccess: true })),
        /**
         * Archive extraction must precede graph sync
         *
         * Graph labels and child-file metadata cannot be determined until the
         * archive contents are known, so extraction always runs before sync.
         */
        prepareUncompressTask: assign(({ context }) => {
            const payload = UncompressPayloadSchema.parse({ fileId: context.fileId });
            return {
                status: 'UNCOMPRESSING',
                nextTask: createPendingTask({
                    aggregateType: FILE_AGGREGATE,
                    operation: FILE_INTEGRATION_ACTIONS.UNCOMPRESS.code,
                    payload,
                    correlationId: context.correlationId,
                }),
            };
        }),

        prepareRecursiveUncompressTask: assign(machineActions.prepareRecursiveUncompressTask),

        completedNotify: assign(machineActions.completedNotify),

        /**
         * Derived WebP assets must exist before the node is considered complete
         *
         * The source image alone cannot fulfill display requirements; at least
         * one transcoded derivative must be produced before graph sync runs.
         */
        prepareTranscodeTask: assign(({ context }) => {
            const payload = TranscodePayloadSchema.parse({ fileId: context.fileId, basePath: context.basePath });
            return {
                status: 'TRANSCODING',
                nextTask: createPendingTask({
                    aggregateType: FILE_AGGREGATE,
                    operation: FILE_INTEGRATION_ACTIONS.TRANSCODE.code,
                    payload,
                    correlationId: context.correlationId,
                }),
            };
        }),

        /**
         * Track derived file IDs so syncNode can record all assets
         *
         * Accumulating IDs here avoids a second DB read in syncNode
         * to discover which files were produced by transcoding.
         */
        saveTranscodeResult: assign(({ context: { processingProgress }, event }) => {
            assertEvent(event, FileIntegrationEventCode.FILE_TRANSCODE_SUCCESS);
            return {
                processingProgress: {
                    ...processingProgress,
                    totalIds: [...processingProgress.totalIds, ...event.data.map(f => f.id)]
                }
            };
        }),

        /**
         * Schedule a Neo4j MERGE for the completed file node
         *
         * Sync runs before notifying the parent so the parent's
         * completion count only increments once the graph node is durable.
         */
        prepareSyncNodeTask: assign(({ context }) => {
            const payload = SyncFilePayloadSchema.parse([{
                fileId: context.fileId,
                labels: [],
            }]);
            return {
                status: 'SYNCING_NODE',
                nextTask: createPendingTask({
                    aggregateType: FILE_AGGREGATE,
                    operation: FILE_INTEGRATION_ACTIONS.SYNC.code,
                    payload,
                    correlationId: context.fileId,
                }),
            };
        }),

        /**
         * Enqueue a completion event routed to the parent receiver workflow
         *
         * Setting correlationId to parentId directs the outbox task to the
         * parent machine, enabling decoupled batch-completion tracking without
         * a direct function call between machines.
         */
        notifyParentComplete: assign(machineActions.notifyParentComplete),

        /**
         * Signal FAILED to the parent so the batch can track partial failures
         *
         * Mirrors notifyParentComplete but with FAILED status, allowing the
         * parent to distinguish individual item failures from full batch success.
         */
        notifyParentFailure: assign(machineActions.notifyParentFailure),

        /**
         * Persist failure reason and mark workflow as FAILED
         *
         * Capturing the error message in context enables targeted diagnostics
         * without replaying intermediate workflow states from the outbox.
         */
        handleFailure: assign(machineActions.handleFailure),

        /**
         * Remove the pending task reference after successful enqueue
         *
         * Clearing prevents accidental double-enqueue when workflow state is
         * rehydrated from the database on process restart.
         */
        clearNextTask: assign({ nextTask: null }),
    }
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AxnWAxAlgDZgCSALmALYDEuJAMgKID6AyowIL3O4cMCqAJUYBtAAwBdRCnSx8ZfOgB20kAA9EAFgBMAGhABPRAEYA7AGYAdADYArGIenr188c2aAHOYC+3-WiwcAmJyKloGFn4AOQBhAHkAWQAFYVZWHj56IVFJVWRZeUUVJHUtPUNEbWsATksHB20Pao9bJ3NTX38MbFg8IlIKGjomZgAVQQ4o1niAERZeAWFxKRL8uQVlVQ0EHX0jBHNrTUtzezFTMXNqsWrzRs1OkACevpDB8JGZklYkjlGYgASbH4ACExhxWABpdILLJLXKrAobYqgba7Co7Wy1C4OdwtHTWUy2R7PIL9UJDCJsACasWYUTicwyixyKxk6yKWzKe0Qtj5dTOzjM1g8HhcJO6ZLeYWGLBIUVGjAA4hNRiQ4lF6XE1bhqcy4ay8kjOSU0eV9nYxJZNPUPKZNNVqvZiX4npLesEBmEAFTLI0czam7kY+22SxEhzWYzVayNK7WCWBD3k96+4xsp7GwOo4P7DzGSzaR2OjxiTSE0zaWwPV2k5PSyiWOYxEhfKJKtijDiCUbUP2IgMo0oIYzGMTWSzGM6tTSHDyNDw8hCV7Q2Kvjo5YsU6RMvT0UpuMFttjusLs9vvp-2FbPD0xTwvtcsO7TaJwipdHWotMRj6rCu4ml3KUvUbAB1Pg1XbTtu17WU2E4bhWH4GIYkYNJ+3ZG8hzRDxjjHBxDm0HRiPzUwl1Ma5rXqbQn3MK5bmA+tQMsCCSCg09zzgql5UVFU-nVTUz1grUdT1ZDUPQ1hMMzQcuR2SjJ3qIiSM8MxPydAUHCadxbGMOway6JNXhY5tW3lDsUjiNC0j7BEsOReT9NFSx8yqUcalnejFwxUUrE0Ww8KnUwml-aoOlrd0TIPMyT2YKybNYS8MzWbCnOMO5XPXW5iM0aNqiXecw1LPCy0re0Wg8JjosGQ9jws+LBGsqS+20FKsxwkwRQ8VzjHc-Tqi88wfP2C4CyJPDPB0JxX20ar91q2KGoSlqRHMdq5KDEdut6-rPPo4aKOqVdrDEPC7jHLxtDO+aUyoSxoniZJUlYCyPkiWJEhSKTgUkjD7NktKtucnq3KjAahpGkwMtXONhtaY6xBdIy9zuxsvh+P5AWBMEuyhJL4PldjmGEGIhFegA1FgJMSmTUscrapqUwjY1UsjCpacMzgCjdf3nW6Gybb5fn+IFkNxiFoTsjagZzHY8OZy5WdfNTyIxMcrkLQK8qjPDbFogWWLYjjGuatI3sJhVlVVQTRJIXVftpgH6ZNOXR3HSdp3tOcF0K+86jO4aHRjO4Dci4yFvu8ZJmmRkLapaOplmamUKdmWGbdsbrXafXLlLKovE-D2bTwt8xzOejDYPVhaRbaDZXemk6QZJkaakumOvk7QzCsGcfyaDKXEKjLJy8HXnBFdoItdJR0AgOA8iiyPKGvDPhwAWmsJdN4D+o973twq8Wo9zOg4Se1X13h1FUwbBuYavCnMrjAo67rQjMbTHvVwqvD1HBeNg1c+oxL63m2FWHqFgiQXBcF4OwBVfJiFXDzJGmgv5NHnL-FGIEYonziitNIoDOojgCrUO4elxznCuh+Xy-5LCBXolie0xFoxYLdBHNGD1PrPSkhZIhTlwpWBuMWJ0SCkZ4SXKONBk51xuXMGWf8bC6w1XuhjEW2Nxbgnxvwra3dVz63sMNKsU0xTmmhqOcMB1ArdT5OFI+91AHQQIa9dsOi5Z2lvm+bmTo8rHShggUUxUzgq2MD+Ik9jGyJ1jieNxw5owWDqCI0R11tYUX0q5ewfV7ABQ1tUCJlga6xAarKWJ2x4lCKSfYFJEiQxNFcl4K4Hju7tDmn-HBtU26EIHLLYcuUrAiiJOWbuoT9KaAokSGw9EdC-mdG0fJsJGAzFKVoBWBElbERVuzDEs4eo5yRn1HxlYay+CAA */
    id: 'processFileItem',
    initial: 'WAITING_START',
    on: {
        FILE_SEAL_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        FILE_UNCOMPRESS_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        FILE_TRANSCODE_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        FILE_DISPATCH_SUB_TASKS_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        FILE_SYNC_NODE_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        FILE_INTEGRATION_NOTIFY_FAILURE: { target: '.FAILED', actions: 'handleFailure' },
        '*': [".FAILED", {
            guard: 'shouldFailUnhandledEventWithPendingTask',
            target: '.FAILED',
            actions: 'handleFailure'
        }]
    },
    context: ({ input }) => ({
        status: 'WAITING_START',
        files: [],
        processingProgress: {
            totalIds: [],
            successIds: [],
            failedIds: []
        },
        strategy: {
            shouldUncompress: false,
            shouldTranscode: false
        },
        nextTask: null,
        error: null,
        isSealSuccess: false,
        isNotifyStartSuccess: false,
        ...input
    }),
    states: {
        DECIDING_START: {
            always: [
                {
                    guard: 'shouldStartProcessing',
                    target: 'DECIDING_PROCESS',
                },
                {
                    target: 'WAITING_START',
                }
            ]
        },
        WAITING_START: {
            on: {
                FILE_SEAL_SUCCESS: {
                    target: 'DECIDING_START',
                    actions: 'handleSealSuccess'
                },
                FILE_INTEGRATION_START_NOTIFY_SUCCESS:
                {
                    target: 'DECIDING_START',
                    actions: 'handleStartNotifySuccess'
                },
            }
        },
        DECIDING_PROCESS: {
            always: [
                {
                    guard: 'shouldStartUncompress',
                    target: 'UNCOMPRESSING',
                    actions: 'prepareUncompressTask',
                },
                {
                    guard: 'shouldWaitSubTaskCompletion',
                    target: 'WAITING_PROCESSING'
                },
                {
                    guard: 'shouldStartTranscode',
                    target: 'TRANSCODING',
                    actions: 'prepareTranscodeTask'
                },
                {
                    target: 'SYNCING_FILE',
                    actions: 'prepareSyncNodeTask'
                }
            ]
        },
        UNCOMPRESSING: {
            on: {
                FILE_UNCOMPRESS_SUCCESS: {
                    target: 'DISPATCH_SUB_TASKS',
                    actions: 'prepareRecursiveUncompressTask'
                },
            }
        },
        DISPATCH_SUB_TASKS: {
            exit: 'clearNextTask',
            always: [
                {
                    guard: 'shouldSkipRecursiveDispatch',
                    target: 'DECIDING_PROCESS'
                }
            ],
            on: {
                FILE_INIT_RECURSIVE_SUCCESS: {
                    target: 'WAITING_PROCESSING',
                },
            }
        },
        WAITING_PROCESSING: {
            on: {
                FILE_INTEGRATION_NOTIFY_SUCCESS: {
                    target: 'DECIDING_PROCESS',
                    actions: 'completedNotify'
                },
            }
        },

        TRANSCODING: {
            on: {
                FILE_TRANSCODE_SUCCESS: {
                    target: 'DECIDING_PROCESS',
                    actions: 'saveTranscodeResult'
                },
            }
        },
        SYNCING_FILE: {
            exit: 'clearNextTask',
            on: {
                FILE_SYNC_NODE_SUCCESS: 'SUCCESS',
            }
        },
        SUCCESS: {
            type: 'final',
            entry: ['clearNextTask', 'notifyParentComplete']
        },
        FAILED: {
            type: 'final',
            entry: ['clearNextTask', 'notifyParentFailure']
        }
    }
});
