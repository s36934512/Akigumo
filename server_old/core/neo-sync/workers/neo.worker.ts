import { createActor, fromPromise } from "xstate";
import { neoWorkerMachine } from "../domain/machine/neo-worker.machine";

interface NeoWorkerDeps {
    pgClient: any; // 這裡的類型可以根據實際使用的 PostgreSQL 客戶端來定義

}

export default class NeoWorker {
    private workerActor;

    constructor(private deps: NeoWorkerDeps) {
        this.workerActor = createActor(neoWorkerMachine, {
            // inspect: (ev) => console.log('State:', ev.state.value),
        });
        this.workerActor.start();
        this.setupPgListener();
    }

    private get pgClient() { return this.deps.pgClient; }

    private createSyncActor() {
        return neoWorkerMachine.provide({
            actors: {
                fetchBatchFromPostgres: fromPromise(async () => {
                    /* 執行 UPDATE ... RETURNING */
                }),
                syncToNeo4j: fromPromise(async ({ context }) => {
                    /* 執行 Neo4j TX */
                }),
                markAsCompleted: fromPromise(async ({ context }) => {
                    /* 執行 updateMany COMPLETED */
                })
            }
        });
    }

    private setupPgListener() {
        this.pgClient.on('notification', () => {
            this.triggerSync();
        });
    }

    triggerSync() {
        this.workerActor.send({ type: 'TRIGGER_SYNC' });
    }

    getActor() {
        return this.workerActor;
    }
}