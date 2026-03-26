import { outboxRegistry, ProcessFn } from "@core/worker/outbox.registry";
import { neogma } from "@core/db/neogma";
import { AggregateType, ENTITY_ACTIONS, GetPayload } from "./create-entity.contract";

const syncEntityToGraph: ProcessFn = async (input) => {
    const payloads = input.map(entity => entity.payload as GetPayload<"CREATED", "graph">).filter(Boolean);
    const entityIds = payloads.map(entity => entity.entityId);

    if (entityIds.length === 0) return;

    await neogma.queryRunner.run(`
        UNWIND $data AS row
        MERGE(e: Entity { id: row.entityId })
        ON CREATE SET e.createdTime = datetime()
    `, {
        data: payloads
    });
};

outboxRegistry.register(AggregateType, ENTITY_ACTIONS.CREATED.code, syncEntityToGraph);
