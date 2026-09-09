import _ from "lodash";
import { prisma } from "#akigumo/db/prisma.js";
import { handlersRegistry } from "../core/index.js";
import {
	buildArchiveConceptPoolTask,
	buildArchiveConceptTask,
	EntrySchema,
	type Neo4jImportRow,
} from "../factory/archive-concept.js";

const PayloadSchema = EntrySchema;

handlersRegistry.registerHandler({
	name: "archive-concept",
	schema: PayloadSchema,
	logic: async (payload) => {
		const { pool, entryList } = payload;
		console.dir(payload);

		const conceptIdList = new Set<string>();

		const result: Neo4jImportRow[] = [];

		for (const entry of entryList) {
			for (const targetId of entry.targetIdList) {
				conceptIdList.add(targetId);
			}

			for (const { key, value } of entry.metadataList ?? []) {
				conceptIdList.add(key);

				for (const v of value) {
					conceptIdList.add(v);
				}
			}
		}

		const keyConcept = await prisma.concept.findMany({
			where: { id: { in: Array.from(conceptIdList) } },
			select: { id: true, name: true },
		});

		const keyConceptMap = new Map(
			keyConcept.map((concept) => [concept.id, concept.name]),
		);

		const updateEntryList = entryList.map((entry) => {
			return {
				...entry,
				metadataList: entry.metadataList.map((metadata) => {
					const type = keyConceptMap.get(metadata.key);
					return {
						...metadata,
						key: { id: metadata.key, type },
					};
				}),
			};
		});

		for (const entry of updateEntryList) {
			for (const targetId of entry.targetIdList) {
				for (const metadata of entry.metadataList) {
					result.push({
						targetId: targetId,
						keyId: metadata.key.id,
						keyType: metadata.key.type ?? "UNKNOWN", // 處理 undefined
						values: metadata.value,
					});
				}
			}
		}

		return {
			taskType: "ArchiveConceptExecutor",
			payload: {
				pool: pool.map((task) => buildArchiveConceptPoolTask(task)),
				taskList: result,
			},
		};
	},
});
