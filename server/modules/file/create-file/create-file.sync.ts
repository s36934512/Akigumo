import { outboxRegistry, ProcessFn } from "@core/worker/outbox.registry";
import { neogma } from "@core/db/neogma";
import { AggregateType, FILE_ACTIONS, GetPayload } from "./create-file.contract";

const initFileToGraph: ProcessFn = async (input) => {
    const payloads = input.map(item => item.payload as GetPayload<"INITIALIZED", "graph">).filter(Boolean);
    if (payloads.length === 0) return;

    await neogma.queryRunner.run(`
        UNWIND $data AS row
        MERGE(f: File { id: row.fileId })
        ON CREATE SET f.createdTime = datetime()

        MERGE(i: Item :FileContainer { id: row.itemId })
        ON CREATE SET i.createdTime = datetime(), i.status = 'PROCESSING'

        WITH f, i, row
        FOREACH (ignoreMe IN CASE WHEN row.parentItemId IS NOT NULL THEN [1] ELSE [] END |
            MERGE (parent:Item { id: row.parentItemId })
            MERGE (parent)-[:CONTAINS]->(i)
        )
        MERGE (i)-[:CONTAINS]->(f)
    `, {
        data: payloads
    });
};

const syncFileToGraph: ProcessFn = async (input) => {
    const payloads = input.map(item => item.payload as GetPayload<"SYNCED", "graph">).filter(Boolean);

    if (payloads.length === 0) return;

    await neogma.queryRunner.run(`
        UNWIND $data AS row
        MERGE(f: File { id: row.fileId })
        ON CREATE SET f.createdTime = datetime()

        WITH f, row
        FOREACH (ignoreMe IN CASE WHEN row.parentItemId IS NOT NULL THEN [1] ELSE [] END |
            MERGE (parent:Item :FileContainer { id: row.parentItemId })
            ON CREATE SET parent.createdTime = datetime(), parent.status = 'PROCESSING'
            MERGE (parent)-[:CONTAINS]->(f)
        )
    `, {
        data: payloads
    });
};

outboxRegistry.register(AggregateType, FILE_ACTIONS.INITIALIZED.code, initFileToGraph);
outboxRegistry.register(AggregateType, FILE_ACTIONS.SYNCED.code, syncFileToGraph);