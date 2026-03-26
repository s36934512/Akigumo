// import { neogma } from "akigumo/db/neogma";
// import { prisma } from "akigumo/db/prisma";

// import { TusIntentInput } from "./schema";
// import { SYNC_FOLDERS_AND_FILES } from "../../infrastructure/cypher";


// export const IntentService = {
//     /**
//      * 核心進入點
//      */
//     async handleIntent(data: TusIntentInput) {
//         const filesArray = Array.isArray(data.files) ? data.files : [data.files];

//         await this._syncGraphPaths(filesArray);

//         const defaultExt = await this._getOrCreateDefaultExt();

//         // 2. 處理 Postgres (事務操作)
//         return await prisma.$transaction(async (tx) => {
//             return await this._createDatabaseRecords(tx, data.notifyUploadId, filesArray);
//         });
//     },

//     /**
//      * 私有邏輯：同步 Neo4j 路徑
//      */
//     async _syncGraphPaths(files: any[]) {
//         const paths = files.map(f => f.metadata?.path || f.name);
//         await neogma.queryRunner.run(SYNC_FOLDERS_AND_FILES, { data: paths });
//     },

//     /**
//      * 私有邏輯：建立 PG 紀錄 (Item, File, Outbox)
//      */
//     async _createDatabaseRecords(tx: any, notifyUploadId: string, files: any[]) {
//         // ... 這裡放入你原本在 transaction 內的邏輯 ...
//         // 包括：建立自動生成的 Item、建立 File、產生 OutboxRows
//         // 這樣拆分後，這段代碼會變得非常純粹，只負責 SQL 事務
//         return { notifyUploadId, createdFiles: [] }; // 示意回傳
//     },

//     async _getOrCreateDefaultExt() {
//         return await prisma.fileExtension.upsert({
//             where: { code: 'unknown' },
//             update: {},
//             create: {
//                 code: 'unknown',
//                 name: '未知格式',
//                 category: {
//                     connectOrCreate: {
//                         where: { code: 'others' },
//                         create: { code: 'others', name: '其他' },
//                     },
//                 },
//             },
//         });
//     }
// };

// function extractItemIdFromMetadata(metadata: unknown): string | null {
//     if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
//         return null;
//     }

//     const value = (metadata as Record<string, unknown>).itemId;
//     if (typeof value !== 'string') {
//         return null;
//     }

//     const parsed = ItemIdSchema.safeParse(value);
//     return parsed.success ? parsed.data : null;
// }

// function withItemId(metadata: unknown, itemId: string) {
//     if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
//         return { itemId };
//     }

//     return {
//         ...(metadata as Record<string, unknown>),
//         itemId,
//     };
// }

// export async function createIntent(data: TusIntentInput) {
//     const payloadArray = 'file' in data ? [data.file] : data.files;



//     const files = await prisma.$transaction(async (tx) => {
//         const requestedItemIds = payloadArray.map((item) => extractItemIdFromMetadata(item.metadata));
//         const providedItemIds = requestedItemIds.filter((id): id is string => id !== null);

//         const existingItems = providedItemIds.length > 0
//             ? await tx.item.findMany({
//                 where: { id: { in: providedItemIds } },
//                 select: { id: true },
//             })
//             : [];

//         const existingItemSet = new Set(existingItems.map((item) => item.id));
//         const missingProvidedItem = providedItemIds.find((id) => !existingItemSet.has(id));
//         if (missingProvidedItem) {
//             throw new Error(`ITEM_NOT_FOUND: ${missingProvidedItem}`);
//         }

//         const autoCreatedItemIds = await Promise.all(
//             requestedItemIds.map(async (itemId, index) => {
//                 if (itemId) return itemId;

//                 const created = await tx.item.create({
//                     data: {
//                         title: payloadArray[index].name,
//                         type: ItemType.FILE_CONTAINER,
//                         status: ItemStatus.ACTIVE,
//                         metadata: {
//                             source: 'file-receiver.intent',
//                             autoCreated: true,
//                         },
//                     },
//                     select: { id: true },
//                 });

//                 return created.id;
//             }),
//         );

//         const createdFiles = await tx.file.createManyAndReturn({
//             data: payloadArray.map((item, index) => ({
//                 originalName: item.name,
//                 size: BigInt(item.size),
//                 checksum: item.checksum,
//                 isOriginal: true,
//                 metadata: withItemId(item.metadata, autoCreatedItemIds[index]),
//                 status: FileStatus.UPLOADING,
//                 fileExtensionId: defaultExt.id,
//             })),
//         });

//         const outboxRows = createdFiles
//             .map((file) => {
//                 const itemId = extractItemIdFromMetadata(file.metadata);
//                 if (!itemId) return null;

//                 return {
//                     aggregateType: ITEM_FILE_SYNC_AGGREGATE,
//                     aggregateId: itemId,
//                     correlationId: itemId,
//                     operation: ITEM_FILE_SYNC_ACTIONS.SWITCH_PRIMARY_FILE.code,
//                     payload: {
//                         itemId,
//                         newFileId: file.id,
//                         markOldLogicalOnly: false,
//                         itemPath: itemId,
//                         itemIsFolder: false,
//                     },
//                     status: 'PENDING' as const,
//                 };
//             })
//             .filter((row): row is NonNullable<typeof row> => row !== null);

//         const graphRefinementOutboxRows = createdFiles.map((file) => ({
//             aggregateType: FILE_GRAPH_REFINEMENT_AGGREGATE,
//             aggregateId: file.id,
//             correlationId: data.notifyUploadId,
//             operation: FILE_GRAPH_REFINEMENT_ACTIONS.DISPATCH_PYTHON_GRAPH_TASK.code,
//             payload: {
//                 fileId: file.id,
//                 originalName: file.originalName ?? undefined,
//                 checksum: file.checksum ?? undefined,
//                 physicalPath: file.physicalPath ?? undefined,
//             },
//             status: 'PENDING' as const,
//         }));

//         const allOutboxRows = [...outboxRows, ...graphRefinementOutboxRows];

//         if (allOutboxRows.length > 0) {
//             await tx.outbox.createMany({ data: allOutboxRows });
//         }

//         return createdFiles;
//     });

//     return {
//         notifyUploadId: data.notifyUploadId,
//         files,
//     };
// }
