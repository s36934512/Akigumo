/**
 * @file Processor for switching Item primary file in one atomic Cypher query.
 *
 * Why one query:
 * the relation rewrite must be all-or-nothing to keep UI primary pointers and
 * lineage edges consistent under retries or worker restarts.
 */
import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';
import {
    getPrimaryFileNodeByItemId,
    switchPrimaryFileInGraph,
} from 'akigumo/services/graph-refinement-engine';

import { itemRepository } from '../../index-stream/core/repository';
import {
    PrimaryFileNode,
    SwitchPrimaryFilePayload,
    SwitchPrimaryFileResult,
} from '../schema';

export async function switchPrimaryFile(
    data: SwitchPrimaryFilePayload,
    metadata: { traceId: string },
): Promise<SwitchPrimaryFileResult> {
    const item = await prisma.item.findUnique({
        where: { id: data.itemId },
        select: { id: true },
    });
    if (!item) {
        throw new Error(`ITEM_NOT_FOUND: ${data.itemId}`);
    }

    const file = await prisma.file.findUnique({
        where: { id: data.newFileId },
        select: { id: true },
    });
    if (!file) {
        throw new Error(`FILE_NOT_FOUND: ${data.newFileId}`);
    }

    const result = await switchPrimaryFileInGraph({
        itemId: data.itemId,
        newFileId: data.newFileId,
        markOldLogicalOnly: data.markOldLogicalOnly,
        itemPath: data.itemPath,
        itemIsFolder: data.itemIsFolder,
    });
    const oldFileIds = result.oldFileIds;
    const newFileId = result.newFileId;

    logger.info(
        {
            label: 'ITEM_FILE_SYNC_SWITCH_PRIMARY_FILE',
            traceId: metadata.traceId,
            itemId: data.itemId,
            oldFileIds,
            newFileId,
            markOldLogicalOnly: data.markOldLogicalOnly,
        },
        'Switched Item primary file in Neo4j',
    );

    await itemRepository.invalidateItem(data.itemId);

    return {
        switched: true,
        oldFileIds,
        newFileId,
    };
}

export async function getPrimaryFileByItemId(itemId: string): Promise<PrimaryFileNode | null> {
    const payload = await getPrimaryFileNodeByItemId(itemId);
    return payload ?? null;
}
