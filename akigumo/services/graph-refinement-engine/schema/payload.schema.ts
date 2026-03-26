/**
 * @file Payload schemas for file graph refinement dispatch.
 *
 * Why: Strong typing ensures TS and Python workers respect the same contract.
 * Why: Support both upsert and batch operations with atomic graph updates.
 * Why: Item-File-Entity relationships require explicit itemId + containment tracking.
 */

import { z } from '@hono/zod-openapi';

export const GraphTaskTypeSchema = z.enum([
    'UPSERT_FILE_GRAPH',
    'FOLD_DERIVATION_PATH',
]);

export const GraphLineageRelationSchema = z.enum([
    'DERIVED_FROM',
    'VERSION_OF',
    'EXTRACTED_FROM',
]);

/**
 * A single node in the ancestor chain from root Collection to File_Container.
 * Why: Python worker needs the full ordered hierarchy to build Collection nodes
 *      and CONTAINS relationships in Neo4j — itemId alone is insufficient.
 */
export const GraphItemChainNodeSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    itemType: z.enum(['COLLECTION', 'FILE_CONTAINER']),
});

export type GraphItemChainNode = z.infer<typeof GraphItemChainNodeSchema>;

/**
 * Single file graph task directed to Python worker.
 * Why: Item relationship is mandatory for proper graph structure.
 */
export const DispatchGraphTaskPayloadSchema = z.object({
    taskVersion: z.number().int().positive().default(1),
    taskType: GraphTaskTypeSchema.default('UPSERT_FILE_GRAPH'),
    fileId: z.uuid(),
    itemId: z.uuid(),
    // Full ordered chain: [Collection*, File_Container] — used to build Neo4j hierarchy.
    // Why: Without this the Python worker can only create Item->File, missing the Collection tree.
    parentChain: z.array(GraphItemChainNodeSchema).optional(),
    // File metadata
    originalName: z.string().optional(),
    extension: z.string().optional(),
    checksum: z.string().optional(),
    physicalPath: z.string().optional(),
    // Lineage and relationship
    sourceFileId: z.uuid().optional(),
    originalSourceId: z.uuid().optional(),
    lineageRelation: GraphLineageRelationSchema.optional(),
    // Storage and versioning
    markLogicalOnly: z.boolean().optional(),
    rank: z.number().int().optional(),
    // Tracing fields
    correlationId: z.string().optional(),
    emittedAt: z.iso.datetime().optional(),
});

export type DispatchGraphTaskPayload = z.infer<typeof DispatchGraphTaskPayloadSchema>;

/**
 * Batch operation payload for micro-batching optimization.
 * Why: Enables UNWIND-based Neo4j writes for 100+ tasks in single transaction.
 */
export const BatchGraphTaskPayloadSchema = z.object({
    batchId: z.uuid(),
    batchVersion: z.number().int().positive().default(1),
    tasks: z.array(DispatchGraphTaskPayloadSchema),
    emittedAt: z.iso.datetime().optional(),
});

export type BatchGraphTaskPayload = z.infer<typeof BatchGraphTaskPayloadSchema>;

export const DispatchGraphTaskResultSchema = z.object({
    queuedCount: z.number().int().nonnegative(),
});

export type DispatchGraphTaskResult = z.infer<typeof DispatchGraphTaskResultSchema>;

/**
 * Result of batch processing.
 * Why: Provides observability for micro-batching operations.
 */
export const BatchGraphTaskResultSchema = z.object({
    batchId: z.uuid(),
    processedCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
});

export type BatchGraphTaskResult = z.infer<typeof BatchGraphTaskResultSchema>;
