import { createMachine, assign } from 'xstate';

export interface NeoSyncContext {
    type: string;
    jobId?: string | null;
    error?: string | null;
}

export const neoSyncMachine = createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QDswHsDKBPZBjAdAI4CuYpAlslAMQRqr6UBuaA1mPqpjgSWWJSgJmaXAEMALuXoBtAAwBdeQsSgADmljkp9VSAAeiAEwB2AKz4zARiPWjADgAscq48dWzAGhBZE9gMz4po4AnCFG-kZy-q6uAL5x3lzYeESkFFTUYABO2WjZ+GoANpIAZvkAtpzoKbzpAlTCyCziOsjKynoaWm16hgimFnZ2Ti5uHt6+CP6ORvgAbOZycmaL4XKh8wlJNTz4AO5i2oIAYvkAUmgARrT0HCLs1dyph8dUZ9mXV00tktLtik6SBA3WOumB-RM-hC+BC81sRlM8xW4Umfkc+BMJlCYSMNisLisVm2IGSe1eUneF2utwYDw4ZJeR0pUA+Xx+oj+skBVhUwNBvQhiHC9kx8NW9ixZn8WKsaIQVic+CsSyMIRVAX8ZnsRhJjIIFNO1JuOTyBWKZUqT1qB2ZRs+1w5rX+HUUXU0YOQfUQ8zMJks4uRyJCZmcIXlMTkC1VMpM83joUcCUSpLQEDgen17p6-29CAAtPN5fmLGEy-NFdK5KYQvY9btUnwMlBs5687N5SHLFZ436ZiETB5sfXnga7VSHVdW4LQP1HPZ5kFli5-PZJWujPL7FZ8P5l9XHPHXHj-CObbBiLhcHB4PyPTODIgiZLLDKzO+Zf55o5pVv-ZEcUWTYnF1FN9XwUojiKSBp1zIUFTVDEoSWRNtx7IsfEQPcMQ8ZYrHVOFZjkeNkziIA */
    id: 'neoSync',
    initial: 'queueing', // 進入排隊狀態
    types: {} as {
        input: NeoSyncContext;
        context: NeoSyncContext;
    },
    context: ({ input }) => ({
        ...input,
    }),
    states: {
        queueing: {
            invoke: {
                src: 'addNeoSyncJob',
                input: ({ context }) => ({ fileId: context.jobId }),
                onDone: {
                    target: 'waitingForJob',
                    actions: assign({ jobId: ({ event }) => event.output.id })
                },
                onError: 'failed'
            }
        },
        waitingForJob: {
            invoke: {
                src: 'observeJobStatus',
                input: ({ context }) => ({ jobId: context.jobId }),
                onDone: [
                    {
                        guard: ({ event }) => event.output === 'completed',
                        target: 'success',
                    },
                    {
                        target: 'failed',
                        actions: assign({ error: () => 'Job failed' })
                    }
                ],
                onError: 'failed'
            }
        },
        success: { type: 'final' },
        failed: {
            type: 'final',
            entry: 'logError'
        }
    }
});