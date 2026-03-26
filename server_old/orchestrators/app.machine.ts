import { createMachine } from 'xstate';

export const appMachine = createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqB0BLAdlgLlsgDZYBeuUAxBAPY5jY4ButA1o2prgUaRTigJcrAMbJC9ANoAGALqy5iUKlqxe9ZSAAeiABwBWDAGYATABYAnJb0zzM4zIBsFgDQgAnogumMB2zIAjAaW9qaWxoEAvlHuXEy8JOSUVGAATmm0aRioxBIAZlkAthjxPIRJAkIitOKSOIqKWqrq9Vq6CE4yMhhOlgYypv56eoFOIe5eCIHWJl1BAOx6Q9bmxk4xcegYaQCuOHiCVADKABIAqgAqACIA8gDqAHJNSCAtGjjtiPaBJoFDY1MIwWY2Mk0QCxkCwwejWxmMINM-385k2IHi+HSRVwEhSdAYTFYHFK20xaWxOFxgmELFquOk8heKjUHy+CGMNgw-W6pkGfScSwM4OmvKcGFMCzMMksSIWBlMEpisRAOFoEDgWi4zRZbVeHQAtIEFsLfk49GY9JKDAjzE54Qs0WU8BV+JRta0sJo9d9TMKRlzzUCBWbAo4QY7tnsDm7Xu9daAOpFhQiekD4SFJf8gsYI5go4coCSsMd0sx0u7Wd6EAtLMLzAZof505ZAvX-A3czt9gWiyW0mXsrB8Mg0oRBBX4zpEP9jZ5EAZzOYYeb1g5rOF65385Re6X0jswMgIFNmR6vQnpxLhV1jCYV8YG+nbXot92dwAjZCiNhQTL7CD3FkHBpPAsY6p6nxVjW16Ssu8K2i21ovsq8TboIGCft+v60P+gFpMBsAYEOI5jlAE4QWyM7CgsTi-IEK62mYlg0Yur7RuhmE-n+OAAUB6SEVgEDEGA5HnlOIrQt0UnSdJYJzggIxLk4cL0UMjHSp2ZIUlSZFgWekEXuyhgYA4cozJayw0Ve8nWHo4p2sYsJAqYkSKih2xgNoBCiQZ4kuL8ZgAuEDiir68lZre-yBbCCxyrFqLuZgohpLw4jEAAYsgWDELsaQiXplaGWavhAt0MzMaENGzlMlhdFyDgPkE668gYSpREAA */
    id: 'app',
    initial: 'initializing',
    states: {
        initializing: {
            invoke: {
                src: 'setupResources', // 調用 core/infrastructure 中的初始化
                onDone: 'running',
                onError: 'criticalFailure'
            }
        },
        running: {
            type: 'parallel', // 這裡就是你原本想要的平行處理
            states: {
                apiServer: {
                    initial: 'starting',
                    states: {
                        starting: { /* 啟動 Express/Fastify */ },
                        ready: {}
                    }
                },
                backgroundWorkers: {
                    initial: 'starting',
                    states: {
                        starting: {
                            // 啟動你目錄中的 neo-sync.worker.ts 或 file-processing.worker.ts 
                        },
                        idle: {}
                    }
                }
            },
            on: {
                SHUTDOWN: 'terminating'
            }
        },
        terminating: {
            invoke: {
                src: 'cleanup', // 執行優雅關機
                onDone: 'exit'
            }
        },
        exit: { type: 'final' },
        criticalFailure: { /* 發生不可挽回錯誤時的行為 */ }
    }
});