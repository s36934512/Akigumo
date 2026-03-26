import { outboxRegistry, ProcessFn } from "@core/worker/outbox.registry";
import { neogma } from "@core/db/neogma";
import { AggregateType, GetPayload, ITEM_ACTIONS } from "./create-item.contract";

const syncItemToGraph: ProcessFn = async (input) => {
    const payloads = input.map(item => item.payload as GetPayload<"CREATED", "graph">).filter(Boolean);
    const itemIds = payloads.map(item => item.itemId);

    if (itemIds.length === 0) return;

    await neogma.queryRunner.run(`
        UNWIND $data AS row
        MERGE(i: Item { id: row.itemId })
        ON CREATE SET i.createdTime = datetime()

        WITH i, row
        FOREACH (ignoreMe IN CASE WHEN row.targetItemId IS NOT NULL THEN [1] ELSE [] END |
            MERGE (target:Item { id: row.targetItemId })
            MERGE (i)-[:CONTAINS]->(target)
        )
    `, {
        data: payloads
    });
};

outboxRegistry.register(AggregateType, ITEM_ACTIONS.CREATED.code, syncItemToGraph);
