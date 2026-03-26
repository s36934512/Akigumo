import { createMachine, assign } from 'xstate';

export const neoWorkerMachine = createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QDswHsDqaBOBrM2AdAJYQA2YAxACoBKAkgOKMCitA+gMoCaAcgMIBtAAwBdRKAAOaWMQAuxNMgkgAHogDsAVkIBOAMyGALAEZdurQA4NR3SYA0IAJ6IAbEf2ETl-VuGXhACZ-Sy0TAF9wx1RMHHwiUgpKfloAeV52anp+AGkRcSQQaVkFJRV1BBMjV0JDfSNA131dV2E-Vw1HFwQtBsJAn19m1satfUjo9Cw8AkIAMzA5AGMAC2JkKEoIJTASZAA3NHxCGOn4+cXV9agEdcOlgENS5Hz8lWL5RWVCissqwj8piaJn8GmERi6iHqOg05jh7kC+g0gSqExApziswWyzWGy2Oz2h2OGJmRGxVw2twOaEez1eJgKUhknzKP0QJg0NWCwh5+mE5iMpi0kIQvksAJMril1U5JjMujRJPO5NxmwI2BwhEkZCecxwAFsTlNMWTLqqqfcnl9XmJ3sznuVEJYjDoPNoTIFAloNCZ9K5AiKRl5bALhBo+U1AorjaTCLAnMgltd8ahCUddkrZvHE9cLTSrUobYyivavo7Ks0NF5rFpuc1GjYRYEDHo4S0gpZncJXNHYrHs0m8erNdrdQajX3zgPc3d83SxG9Ch8HWzKoLdIQXQ0fFZjJZXCKjMjCKFhCYwmewd6tD2ouiY1OAK5LJZwWAp3az4kPrPP1+wWA81pa0F1tJdS1ZUAKl9GxNwMTkGnDOxhWcdlm0Idw20sQJbDlP1ezOLEHmIMhH2wKhVFgOQnl2B45jkAgAApuWEABKShMzJYjSPIxcmRKMtV3PbDCCCXRGh8HcPBQ7poUIWE2wRJEUSMAiTXmbiyIoqiaMIOiGOwZieTYjify4kitMEBk7QEyC1HZOxPFcG9kVcXRYVcc8RX0dDXGdfcpTEjQ-jU2N9QeZBHweMh6GQAz9jAOKvkoWgWE4FhqD4ktbO+KDEG5EwvG0IIvWafdQhFP5+iw5yqnXKNFTQCA4BUTibJZXL7IQABaA9UJ6mpjLPNzAg0WFtFvSZJ1mRIwHalc8oQBpvNrLxJQ6Zzm3MeoNFC5UzWuebBMW3DW3WrQrDMfdfEDfx5KBAxJVGgxJvvaaiGnDYjrs6CzECTcPTCXx-VPfRvI8WocPMJDwXqX09t-F832+zroI6HRmg5HDgvE5zOn6v6MK9IJz1rKUOgR8yeLm8CcvLbwOnk5z3ACKUEMDHzg0lXQPGaXRQnGO9OMIcLIui2L4sShbso68sUTlUTjK9AWgcsSqNyMQYfNG5zcdvSIgA */
    id: 'neoWorker',
    initial: 'idle',
    context: {
        batchIds: [] as bigint[],
        retryCount: 0,
        error: null as any,
    },
    states: {
        idle: {
            on: {
                TRIGGER_SYNC: 'fetching',
                CRON_TICK: 'fetching'
            }
        },
        fetching: {
            invoke: {
                src: 'fetchBatchFromPostgres',
                onDone: [
                    {
                        target: 'syncing',
                        guard: ({ event }) => event.output.length > 0,
                        actions: assign({ batchIds: ({ event }) => event.output })
                    },
                    { target: 'idle' }
                ],
                onError: { target: 'failure' }
            }
        },
        syncing: {
            invoke: {
                src: 'syncToNeo',
                onDone: {
                    target: 'success'
                },
                onError: {
                    target: 'failure',
                    actions: assign({ error: ({ event }) => String(event.error) })
                }
            }
        },
        success: {
            invoke: {
                src: 'markAsCompleted',
                onDone: {
                    target: 'idle',
                    actions: assign({ batchIds: [], retryCount: 0 })
                }
            }
        },
        failure: {
            after: {
                // 指數退避重試邏輯 (Exponential Backoff)
                2000: [
                    {
                        target: 'syncing',
                        guard: ({ context }) => context.retryCount < 3,
                        actions: assign({ retryCount: ({ context }) => context.retryCount + 1 })
                    },
                    { target: 'manualIntervention' } // 重試三次都失敗，停下來等人工
                ]
            }
        },
        manualIntervention: {
            // 這裡可以發送 Slack 通知或打日誌
            on: { RESET: 'idle' }
        }
    }
});