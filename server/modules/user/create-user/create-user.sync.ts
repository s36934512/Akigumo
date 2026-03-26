import { neogma } from "@core/db/neogma";
import { outboxRegistry, ProcessFn } from "@core/worker/outbox.registry";
import { AggregateType, GetPayload, USER_ACTIONS } from "./create-user.contract";

const syncUserToGraph: ProcessFn = async (input) => {
    const payloads = input.map(item => item.payload as GetPayload<"CREATED", "graph">).filter(Boolean);

    if (payloads.length === 0) return;

    await neogma.queryRunner.run(`
        UNWIND $data AS row
        MERGE (u:User { id: row.userId }) ON CREATE SET u.createdTime = datetime()
        MERGE (root:Item:Root { id: row.rootItemId }) ON CREATE SET root.createdTime = datetime()
        MERGE (u)-[:HAS_ROOT]->(root)
    `,
        { data: payloads }
    );
};

outboxRegistry.register(AggregateType, USER_ACTIONS.CREATED.code, syncUserToGraph);
