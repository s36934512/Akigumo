/**
 * @file Factory that creates Item and File records atomically.
 *
 * Why this factory exists:
 * - Relational writes must be canonical in PostgreSQL.
 * - Outbox intent must be committed in the same transaction to avoid lost sync.
 * - Neo4j linking is delegated to worker processors for retry-safe async execution.
 */

import { prisma } from 'akigumo/db/prisma';
import {
    GRAPH_REFINEMENT_ENGINE_ACTIONS,
    GRAPH_REFINEMENT_ENGINE_AGGREGATE,
} from 'akigumo/services/graph-refinement-engine/contract';
import type { DispatchGraphTaskPayload } from 'akigumo/services/graph-refinement-engine/schema';

import {
    ITEM_FILE_SYNC_ACTIONS,
    ITEM_FILE_SYNC_AGGREGATE,
} from './contract';
import {
    CreateItemFileBundle,
    CreateItemFileBundleSchema,
} from './schema';


export interface ItemFileFactoryResult {
    itemId: string;
    fileId: string;
    outboxId: bigint;
}

export interface EnqueueSwitchPrimaryInput {
    itemId: string;
    newFileId: string;
    sourceFileId?: string;
    markOldLogicalOnly?: boolean;
    taskType?: 'UPSERT_FILE_GRAPH' | 'FOLD_DERIVATION_PATH';
    lineageRelation?: DispatchGraphTaskPayload['lineageRelation'];
    correlationId?: string;
    workflowId?: string;
}

export interface EnqueueSwitchPrimaryResult {
    itemId: string;
    newFileId: string;
    outboxIds: bigint[];
}

export const ItemFileFactory = {
    async create(bundle: CreateItemFileBundle): Promise<ItemFileFactoryResult> {
        const input = CreateItemFileBundleSchema.parse(bundle);

        return await prisma.$transaction(async (tx) => {
            const item = await tx.item.create({
                data: {
                    name: input.item.name,
                    description: input.item.description,
                    metadata: input.item.metadata,
                    type: input.item.type,
                    status: input.item.status,
                    publishedTime: input.item.publishedTime,
                },
                select: { id: true },
            });

            const file = await tx.file.create({
                data: {
                    originalName: input.file.originalName,
                    systemName: input.file.systemName,
                    physicalPath: input.file.physicalPath,
                    size: input.file.size,
                    checksum: input.file.checksum,
                    isOriginal: input.file.isOriginal,
                    metadata: input.file.metadata,
                    status: input.file.status,
                    fileExtensionId: input.file.fileExtensionId,
                },
                select: { id: true },
            });

            const outbox = await tx.outbox.create({
                data: {
                    aggregateType: ITEM_FILE_SYNC_AGGREGATE,
                    aggregateId: item.id,
                    correlationId: item.id,
                    operation: ITEM_FILE_SYNC_ACTIONS.SWITCH_PRIMARY_FILE.code,
                    payload: {
                        itemId: item.id,
                        newFileId: file.id,
                        markOldLogicalOnly: false,
                        itemPath: item.id,
                        itemIsFolder: false,
                    },
                    status: 'PENDING',
                },
                select: { id: true },
            });

            return {
                itemId: item.id,
                fileId: file.id,
                outboxId: outbox.id,
            };
        });
    },

    async enqueueSwitchPrimary(input: EnqueueSwitchPrimaryInput): Promise<EnqueueSwitchPrimaryResult> {
        return await prisma.$transaction(async (tx) => {
            const item = await tx.item.findUnique({
                where: { id: input.itemId },
                select: { id: true },
            });
            if (!item) {
                throw new Error(`Item not found: ${input.itemId}`);
            }

            const newFile = await tx.file.findUnique({
                where: { id: input.newFileId },
                select: { id: true },
            });
            if (!newFile) {
                throw new Error(`File not found: ${input.newFileId}`);
            }

            if (input.sourceFileId) {
                const sourceFile = await tx.file.findUnique({
                    where: { id: input.sourceFileId },
                    select: { id: true },
                });
                if (!sourceFile) {
                    throw new Error(`Source file not found: ${input.sourceFileId}`);
                }
            }

            const relation = input.lineageRelation ?? 'DERIVED_FROM';
            const now = new Date().toISOString();

            const switchOutbox = await tx.outbox.create({
                data: {
                    aggregateType: ITEM_FILE_SYNC_AGGREGATE,
                    aggregateId: input.itemId,
                    correlationId: input.correlationId ?? input.itemId,
                    workflowId: input.workflowId,
                    operation: ITEM_FILE_SYNC_ACTIONS.SWITCH_PRIMARY_FILE.code,
                    payload: {
                        itemId: input.itemId,
                        newFileId: input.newFileId,
                        markOldLogicalOnly: input.markOldLogicalOnly ?? false,
                    },
                    status: 'PENDING',
                },
                select: { id: true },
            });

            const graphOutbox = await tx.outbox.create({
                data: {
                    aggregateType: GRAPH_REFINEMENT_ENGINE_AGGREGATE,
                    aggregateId: input.newFileId,
                    correlationId: input.correlationId ?? input.itemId,
                    workflowId: input.workflowId,
                    operation: GRAPH_REFINEMENT_ENGINE_ACTIONS.DISPATCH_GRAPH_TASK.code,
                    payload: {
                        taskType: input.taskType ?? 'UPSERT_FILE_GRAPH',
                        fileId: input.newFileId,
                        itemId: input.itemId,
                        sourceFileId: input.sourceFileId,
                        lineageRelation: relation,
                        markLogicalOnly: input.markOldLogicalOnly ?? false,
                        emittedAt: now,
                    },
                    status: 'PENDING',
                },
                select: { id: true },
            });

            return {
                itemId: input.itemId,
                newFileId: input.newFileId,
                outboxIds: [switchOutbox.id, graphOutbox.id],
            };
        });
    },
};
