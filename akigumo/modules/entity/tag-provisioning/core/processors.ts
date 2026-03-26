/**
 * @file Implements the business logic for the Tag Provisioning workflow.
 *
 * This module registers processors that execute the actual work for each step
 * defined in the workflow's contract. The kernel invokes these processors from
 * a background worker, passing in a payload and expecting a validated result.
 * This architecture keeps the core workflow logic decoupled from API handlers
 * and allows for reliable, asynchronous execution.
 */
import { z } from '@hono/zod-openapi';
import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';
import { syncEntitiesToGraph } from 'akigumo/services/graph-refinement-engine';
import { v5 as uuidv5 } from 'uuid';

import { registerEntityProcessor } from '../../common/registry.helper';
import { ENTITY_TAG_PROVISIONING_ACTIONS as ACTIONS, ENTITY_NAMESPACE } from '../contract';

/**
 * Schema for a single entity creation request.
 *
 * Why: Enforces required fields and structure for each entity, supporting validation and API docs.
 */
const EntityCreateSchema = z.object({
    name: z.string().min(1, '名稱不能為空').openapi({
        description: '實體名稱，至少 1 個字元',
        example: 'Product'
    }),
    description: z.string().optional().openapi({
        description: '實體描述，用於補充說明此實體用途',
        example: '代表產品主檔資料'
    }),
    metadata: z.record(z.string(), z.any()).optional().openapi({
        description: '自訂鍵值對 metadata，可存放額外設定或標記',
        example: {
            source: 'admin-panel',
            version: 1,
            tags: ['core', 'catalog']
        }
    }),
}).openapi({
    description: '單一待建立實體資料'
});



/**
 * Schema for batch entity creation requests (array of entities).
 *
 * Why: Enables efficient bulk creation and validation of multiple entities in a single API call.
 */
const EntityCreateBatchSchema = z.array(EntityCreateSchema).openapi({
    description: '批次建立實體的輸入資料，陣列中的每一筆皆會建立一個實體',
    example: [
        {
            name: 'Product',
            description: '代表產品主檔資料',
            metadata: {
                source: 'admin-panel',
                version: 1,
                tags: ['core', 'catalog']
            }
        }
    ]
});



/**
 * Schema for entity creation input (single or batch).
 *
 * Why: Allows API to flexibly accept either a single entity or an array, simplifying client integration.
 */
export const EntityCreateInputSchema = z.union([
    EntityCreateBatchSchema,
    EntityCreateSchema
]).openapi({
    description: '單一或批次建立實體的輸入資料'
});

/**
 * Type for entity creation input (single or batch).
 */
export type EntityCreateInput = z.infer<typeof EntityCreateInputSchema>;



/**
 * Payload schema for SYNC_TAGS_TO_GRAPH action.
 *
 * Why only id and name? The Neo4j MERGE operation identifies nodes by id and
 * sets the display name — it does not need the full entity record. Keeping this
 * schema narrow prevents unintentional coupling to PostgreSQL column changes.
 */
const EntityTagSyncPayloadSchema = z.array(
    z.object({
        id: z.string().min(1),
        name: z.string().min(1),
    })
).min(1);


/**
 * Processor for the PROVISION_TAGS action.
 *
 * Architectural Responsibility:
 * This processor's only job is to ensure all tag texts exist as records in the
 * source-of-truth database (PostgreSQL), stored in the `Entity` table.
 * It is explicitly NOT responsible for storing group relationships, as that
 * logic is handled by Neo4j.
 *
 * It uses `createMany` with `skipDuplicates` to achieve idempotency, making it safe to re-run.
 * This assumes the underlying database is PostgreSQL, which supports this feature.
 */
registerEntityProcessor(
    ACTIONS.PROVISION_TAGS,
    EntityCreateInputSchema,
    async (data) => {
        const preparedData = Array.isArray(data) ? data : [data];

        return prisma.entity.createMany({
            data: preparedData.map((item) => ({
                id: uuidv5(JSON.stringify(item), ENTITY_NAMESPACE),
                name: item.name,
                description: item.description,
                metadata: item.metadata,
            })),
            skipDuplicates: true,
        });
    }
);

/**
 * Processor for the SYNC_TAGS_TO_GRAPH action.
 *
 * Architectural Responsibility:
 * This is where the grouping logic lives. This processor takes the original
 * payload and builds the complex relationship structure in Neo4j.
 * The Cypher query uses `MERGE` to idempotently create `TagGroup` nodes,
 * find the `Entity` nodes created in the previous step, and create the
 * relationships between them.
 */
registerEntityProcessor(
    ACTIONS.SYNC_TAGS_TO_GRAPH,
    EntityTagSyncPayloadSchema,
    async (data, metadata) => {
        if (!data || data.length === 0) {
            logger.warn(
                { label: 'SYNC_TAGS_TO_GRAPH', traceId: metadata.traceId },
                `No tag group data found in trace.`,
            );
            return { synced: 0 };
        }

        const syncedCount = await syncEntitiesToGraph(data);

        return { synced: syncedCount };
    },
);
