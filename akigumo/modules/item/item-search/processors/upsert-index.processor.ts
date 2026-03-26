/**
 * @file Processor that upserts item records into MeiliSearch.
 *
 * Why we fetch from Prisma rather than using the workflow payload directly:
 * the outbox only carries item IDs to keep queue messages small; we read
 * the latest Prisma state so the index always reflects the current truth.
 */



import { ITEMS_INDEX, meili } from 'akigumo/db/meiliSearch';
import { logger } from 'akigumo/db/pino';
import { prisma } from 'akigumo/db/prisma';

import { ITEM_SEARCH_ACTIONS } from '../contract';
import { registerItemSearchProcessor } from '../registry.helper';
import { UpsertIndexPayloadSchema, ItemSearchDoc } from '../schema';

registerItemSearchProcessor(
    ITEM_SEARCH_ACTIONS.UPSERT,
    UpsertIndexPayloadSchema,
    async (itemIds, metadata) => {
        const items = await prisma.item.findMany({
            where: { id: { in: itemIds } },
            select: {
                id: true,
                name: true,
                type: true,
                status: true,
                metadata: true,
                publishedTime: true,
                createdTime: true,
                modifiedTime: true,
            },
        });

        if (items.length === 0) {
            logger.warn(
                { label: 'ITEM_SEARCH_UPSERT', traceId: metadata.traceId },
                'No items found for indexing',
            );
            return { indexed: 0 };
        }

        const docs: ItemSearchDoc[] = items.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            status: item.status,
            metadata:
                item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
                    ? (item.metadata as Record<string, any>)
                    : {},
            publishedTime: item.publishedTime ? item.publishedTime.getTime() : null,
            createdTime: item.createdTime.getTime(),
            modifiedTime: item.modifiedTime.getTime(),
        }));

        const task = await meili.index(ITEMS_INDEX).addDocuments(docs, { primaryKey: 'id' });

        logger.info(
            { label: 'ITEM_SEARCH_UPSERT', traceId: metadata.traceId, taskUid: task.taskUid },
            `Queued ${docs.length} item(s) for MeiliSearch indexing`,
        );

        return { indexed: docs.length, taskUid: task.taskUid };
    },
);
