import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';
import { ItemStatus, ItemType } from 'generated/prisma/enums';
import { v7 as uuidv7 } from 'uuid';

import {
    GRAPH_REFINEMENT_ENGINE_ACTIONS,
    GRAPH_REFINEMENT_ENGINE_AGGREGATE,
} from '../contract';
import { SyncIntentToGraphPayload } from './sync-intent-to-graph.schema';

type IntentNode = {
    id: string;
    path: string;
    name: string;
    itemType: ItemType;
};

// Ordered node list from root Collection down to File_Container (inclusive).
// Why: Python worker needs this to materialise the full hierarchy in Neo4j.
type IntentChainNode = {
    id: string;
    name: string;
    itemType: ItemType;
};

type IntentFileMapping = {
    fileId: string;
    fileName?: string;
    fullPath: string;
    containerId: string;
    containerPath: string;
    // Ordered: [Collection*, File_Container]
    parentChain: IntentChainNode[];
};

function coerceObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return value as Record<string, unknown>;
}

function sanitizePath(pathLike: string): string {
    const trimmed = pathLike.trim().replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
    return trimmed;
}

function buildIntentGraph(files: SyncIntentToGraphPayload['files']) {
    const nodeMap = new Map<string, IntentNode>();
    const mappings: IntentFileMapping[] = [];

    files.forEach((file) => {
        const rawPath = file.path || file.fileName;
        if (!rawPath) {
            return;
        }

        const normalized = sanitizePath(rawPath);
        if (!normalized) {
            return;
        }

        const parts = normalized.split('/').filter(Boolean);
        if (parts.length === 0) {
            return;
        }

        const fileName = file.fileName || parts[parts.length - 1];
        const folderParts = parts.slice(0, -1);

        const parentChain: IntentChainNode[] = [];
        let rollingPath = '';
        folderParts.forEach((part) => {
            rollingPath += `/${part}`;
            if (!nodeMap.has(rollingPath)) {
                nodeMap.set(rollingPath, {
                    id: uuidv7(),
                    path: rollingPath,
                    name: part,
                    itemType: ItemType.COLLECTION,
                });
            }
            const n = nodeMap.get(rollingPath)!;
            parentChain.push({ id: n.id, name: n.name, itemType: n.itemType });
        });

        const filePath = `/${parts.join('/')}`;
        const containerPath = `${filePath}/container`;

        if (!nodeMap.has(containerPath)) {
            nodeMap.set(containerPath, {
                id: uuidv7(),
                path: containerPath,
                name: `Container for ${fileName}`,
                itemType: ItemType.FILE_CONTAINER,
            });
        }
        const containerNode = nodeMap.get(containerPath)!;
        parentChain.push({ id: containerNode.id, name: containerNode.name, itemType: containerNode.itemType });

        mappings.push({
            fileId: file.fileId,
            fileName,
            fullPath: filePath,
            containerId: containerNode.id,
            containerPath,
            parentChain,
        });
    });

    return {
        nodes: Array.from(nodeMap.values()),
        mappings,
    };
}

function mergeMetadataWithContainer(
    metadata: unknown,
    containerId: string,
    fullPath: string,
    containerPath: string,
) {
    return {
        ...coerceObject(metadata),
        itemId: containerId,
        path: fullPath,
        graphProxy: {
            type: ItemType.FILE_CONTAINER,
            itemId: containerId,
            path: containerPath,
        },
    };
}

export async function syncIntentToGraphWithEngine(data: SyncIntentToGraphPayload) {
    if (data.files.length === 0) {
        return { synced: 0, queuedGraphRefinement: 0 };
    }

    const { nodes, mappings } = buildIntentGraph(data.files);
    if (mappings.length === 0) {
        return { synced: 0, queuedGraphRefinement: 0 };
    }

    logger.info(
        {
            label: 'GRAPH_REFINEMENT_ENGINE_SYNC_INTENT',
            nodeCount: nodes.length,
            fileCount: mappings.length,
        },
        'Sync intent delegated to Graph Refinement Engine',
    );

    const fileRecords = await prisma.file.findMany({
        where: { id: { in: mappings.map((entry) => entry.fileId) } },
        select: {
            id: true,
            originalName: true,
            systemName: true,
            checksum: true,
            physicalPath: true,
            metadata: true,
        },
    });

    const fileById = new Map(fileRecords.map((file) => [file.id, file]));

    await prisma.$transaction(async (tx) => {
        await tx.item.createMany({
            data: nodes.map((node) => ({
                id: node.id,
                name: node.name,
                metadata: { path: node.path },
                type: node.itemType,
                status: ItemStatus.PROCESSING,
            })),
            skipDuplicates: true,
        });

        for (const mapping of mappings) {
            const file = fileById.get(mapping.fileId);
            if (!file) {
                continue;
            }

            await tx.file.update({
                where: { id: mapping.fileId },
                data: {
                    metadata: mergeMetadataWithContainer(
                        file.metadata,
                        mapping.containerId,
                        mapping.fullPath,
                        mapping.containerPath,
                    ),
                },
            });

            await tx.outbox.create({
                data: {
                    aggregateType: GRAPH_REFINEMENT_ENGINE_AGGREGATE,
                    aggregateId: mapping.fileId,
                    correlationId: mapping.containerId,
                    operation: GRAPH_REFINEMENT_ENGINE_ACTIONS.DISPATCH_GRAPH_TASK.code,
                    payload: {
                        taskType: 'UPSERT_FILE_GRAPH',
                        fileId: mapping.fileId,
                        itemId: mapping.containerId,
                        originalName: file.originalName ?? file.systemName ?? mapping.fileName,
                        checksum: file.checksum ?? undefined,
                        physicalPath: file.physicalPath ?? undefined,
                        // Pass the full ordered ancestor chain so the Python worker can
                        // materialise Collection > ... > File_Container nodes in Neo4j.
                        parentChain: mapping.parentChain.map((n) => ({
                            id: n.id,
                            name: n.name,
                            itemType: n.itemType as 'COLLECTION' | 'FILE_CONTAINER',
                        })),
                        emittedAt: new Date().toISOString(),
                    },
                    status: 'PENDING',
                },
            });
        }
    });

    return {
        synced: mappings.length,
        queuedGraphRefinement: mappings.length,
    };
}
