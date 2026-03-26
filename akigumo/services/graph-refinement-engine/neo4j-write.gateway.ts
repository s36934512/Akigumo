import { neogma } from 'akigumo/db/neogma';

export interface GraphEntitySyncInput {
    id: string;
    name: string;
}

export interface GraphFileNodeSyncInput {
    fileId: string;
    labels?: string[];
}

export interface SwitchPrimaryFileGraphInput {
    itemId: string;
    newFileId: string;
    markOldLogicalOnly: boolean;
    itemPath?: string;
    itemIsFolder?: boolean;
}

export interface SwitchPrimaryFileGraphResult {
    oldFileIds: string[];
    newFileId: string;
}

export interface PrimaryFileGraphNode {
    id: string;
    checksum?: string | null;
    physicalPath?: string | null;
    storageStatus?: string | null;
}

const SWITCH_PRIMARY_FILE_QUERY = `
MERGE (i:Item { id: $itemId })
ON CREATE SET
    i.createdTime = datetime(),
    i.path = coalesce($itemPath, $itemId),
    i.isFolder = coalesce($itemIsFolder, false)
ON MATCH SET
    i.path = coalesce(i.path, $itemPath, $itemId),
    i.isFolder = coalesce(i.isFolder, $itemIsFolder, false)
MERGE (newF:File { id: $newFileId })
ON CREATE SET newF.createdTime = datetime()
WITH i, newF
OPTIONAL MATCH (i)-[oldRel:CONTAINS]->(oldF:File)
OPTIONAL MATCH (i)-[oldDisplayRel:DISPLAY_AS]->(:File)
WITH i, newF, collect(oldRel) AS oldRels, collect(oldF) AS oldFiles, collect(oldDisplayRel) AS oldDisplayRels
FOREACH (rel IN oldRels | DELETE rel)
FOREACH (displayRel IN oldDisplayRels | DELETE displayRel)
FOREACH (oldF IN oldFiles |
    FOREACH (_ IN CASE WHEN oldF IS NULL OR oldF.id = newF.id THEN [] ELSE [1] END |
        MERGE (i)-[:SOURCE_OF]->(oldF)
        FOREACH (__ IN CASE WHEN $markOldLogicalOnly THEN [1] ELSE [] END |
            SET oldF.storageStatus = 'logical_only'
            SET oldF:Ghost
        )
    )
)
MERGE (i)-[:CONTAINS]->(newF)
MERGE (i)-[:DISPLAY_AS]->(newF)
RETURN [oldF IN oldFiles WHERE oldF IS NOT NULL AND oldF.id <> newF.id | oldF.id] AS oldFileIds,
       newF.id AS newFileId
`;

export async function syncUsersToGraph(userIds: string[]): Promise<number> {
    if (userIds.length === 0) {
        return 0;
    }

    const result = await neogma.queryRunner.run(
        `
        UNWIND $data AS id
        MERGE (u:User { id: id })
        ON CREATE SET u.createdTime = datetime()
        RETURN count(u) AS syncedCount
        `,
        { data: userIds },
    );

    return result.records[0]?.get('syncedCount')?.toNumber() || 0;
}

export async function syncItemsToGraph(itemIds: string[]): Promise<number> {
    if (itemIds.length === 0) {
        return 0;
    }

    const result = await neogma.queryRunner.run(
        `
        UNWIND $data AS id
        MERGE (i:Item { id: id })
        ON CREATE SET i.createdTime = datetime()
        RETURN count(i) AS syncedCount
        `,
        { data: itemIds },
    );

    return result.records[0]?.get('syncedCount')?.toNumber() || 0;
}

export async function syncEntitiesToGraph(entities: GraphEntitySyncInput[]): Promise<number> {
    if (entities.length === 0) {
        return 0;
    }

    const result = await neogma.queryRunner.run(
        `
        UNWIND $data AS row
        MERGE (e:Entity { id: row.id })
        SET e.name = row.name
        ON CREATE SET e.createdTime = datetime()
        RETURN count(distinct e) AS syncedCount
        `,
        { data: entities },
    );

    return result.records[0]?.get('syncedCount')?.toNumber() || 0;
}

export async function syncFileNodesToGraph(files: GraphFileNodeSyncInput[]): Promise<number> {
    if (files.length === 0) {
        return 0;
    }

    const result = await neogma.queryRunner.run(
        `
        UNWIND $data AS file
        MERGE (f:File { id: file.fileId })
        ON CREATE SET f.createdTime = datetime()
        WITH f, file
        SET f:$(['File'] + coalesce(file.labels, []))
        RETURN count(f) AS syncedCount
        `,
        { data: files },
    );

    return result.records[0]?.get('syncedCount')?.toNumber() || 0;
}

export async function switchPrimaryFileInGraph(
    input: SwitchPrimaryFileGraphInput,
): Promise<SwitchPrimaryFileGraphResult> {
    const result = await neogma.queryRunner.run(SWITCH_PRIMARY_FILE_QUERY, {
        itemId: input.itemId,
        newFileId: input.newFileId,
        markOldLogicalOnly: input.markOldLogicalOnly,
        itemPath: input.itemPath,
        itemIsFolder: input.itemIsFolder,
    });

    const row = result.records[0];
    return {
        oldFileIds: (row?.get('oldFileIds') as string[] | undefined) ?? [],
        newFileId: (row?.get('newFileId') as string | undefined) ?? input.newFileId,
    };
}

export async function getPrimaryFileNodeByItemId(itemId: string): Promise<PrimaryFileGraphNode | null> {
    const result = await neogma.queryRunner.run(
        `
        OPTIONAL MATCH (:Item { id: $itemId })-[:DISPLAY_AS]->(displayFile:File)
        WITH head(collect(displayFile)) AS displayFile
        OPTIONAL MATCH (:Item { id: $itemId })-[r:CONTAINS]->(containedFile:File)
        WITH displayFile, containedFile, coalesce(r.order, 0) AS relOrder
        ORDER BY relOrder ASC, containedFile.createdTime ASC
        WITH coalesce(displayFile, head(collect(containedFile))) AS f
        WHERE f IS NOT NULL
        RETURN {
            id: f.id,
            checksum: f.checksum,
            physicalPath: f.physicalPath,
            storageStatus: f.storageStatus
        } AS primaryFile
        LIMIT 1
        `,
        { itemId },
    );

    return (result.records[0]?.get('primaryFile') as PrimaryFileGraphNode | undefined) ?? null;
}
