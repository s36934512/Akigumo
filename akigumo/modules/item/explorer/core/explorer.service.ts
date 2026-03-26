import { z } from '@hono/zod-openapi';
import { neogma } from 'akigumo/db/neogma';
import { prisma } from 'akigumo/db/prisma';
import { ItemTypeSchema } from 'generated/zod/schemas';

import { notifyIndexPatchesForLinkedItems } from '../../index-stream';
import { BrowseExplorerRequest, GetStructureFromNeo4j } from '../schema';

export async function browseExplorer(input: BrowseExplorerRequest) {
    const { parentId, notifyUploadId, showDeleted } = input;

    const items = await getStructureFromNeo4j({ parentId, showDeleted });

    const breadcrumbs = parentId
        ? await getBreadcrumbs(parentId)
        : [];

    const itemIds = items.map(i => i.id);
    if (itemIds.length > 0) {
        notifyIndexPatchesForLinkedItems(notifyUploadId, itemIds).catch(err => {
            console.error('Failed to trigger index patches:', err);
        });
    }

    return { items, breadcrumbs };
}

async function getStructureFromNeo4j(input: GetStructureFromNeo4j) {
    const { parentId, showDeleted } = input;

    const query = parentId
        ? `
        MATCH (p:Item { id: $parentId })-[r:CONTAINS]->(c:Item)
        WHERE $showDeleted OR (c.isDeleted IS NULL OR c.isDeleted = false)
        RETURN c.id AS id, labels(c) AS labels, coalesce(r.order, 0) AS position
        ORDER BY r.order ASC
        `
        : `
        MATCH (c:Item)
        WHERE NOT (()-[:CONTAINS]->(c)) 
        AND ($showDeleted OR (c.isDeleted IS NULL OR c.isDeleted = false))
        RETURN c.id AS id, labels(c) AS labels, 0 AS position
        ORDER BY c.createdTime DESC
        `;

    const result = await neogma.queryRunner.run(query, { parentId, showDeleted });

    return result.records.map(r => ({
        id: r.get('id'),
        position: Number(r.get('position')),
        types: z.array(z.any())
            .transform((items) =>
                items.filter((item) => ItemTypeSchema.safeParse(item).success)
            )
            .pipe(ItemTypeSchema.array())
            .parse(r.get('labels')),
    }));
}

async function getBreadcrumbs(id: string) {
    const item = await prisma.item.findUnique({
        where: { id },
        select: { id: true, name: true }
    });
    return item ? [{ id: item.id, name: item.name }] : [];
}