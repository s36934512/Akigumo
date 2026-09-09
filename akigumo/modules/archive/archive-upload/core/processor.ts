import fs from "fs-extra";
import { v7 as uuidv7 } from "uuid";
import { logger } from "#akigumo/db/pino.js";
import { NonRetryableError } from "#akigumo/kernel/index.js";
import * as Paths from "#akigumo/kernel/paths.js";
import { defineProcessor } from "#akigumo/shared/factories/index.js";
import { DiskGuard } from "#akigumo/shared/utils/index.js";
import type { Prisma } from "#generated/prisma/client.js";
import { FileStatus, ItemStatus, ItemType } from "#generated/prisma/enums.js";
import {
	FileCreateManyInputObjectZodSchema,
	ItemCreateManyInputObjectZodSchema,
} from "#generated/zod/schemas/index.js";
import { getOrCreateDefaultExt } from "../../common/service.js";
import { ArchiveIntentSchema, ArchiveSealSchema } from "../api/schema.js";
import { ACTION_LIST } from "../contract.js";
import { FileStateSchema } from "../machine/schema.js";
import * as svc from "./service.js";

export const archiveIntentProcessor = defineProcessor(
	ACTION_LIST.INTENT.code,
	ArchiveIntentSchema.single,
	async (input) => {
		const log = logger.child({
			label: ACTION_LIST.INTENT.code,
			notifyId: input.payload.notifyId,
		});

		const inputFileList = input.payload.fileList;
		const totalSize = inputFileList.reduce(
			(acc, f) => acc + BigInt(f.size),
			BigInt(0),
		);
		log.debug(`fileList: ${JSON.stringify(inputFileList)}`);
		log.debug(`totalSize: ${totalSize}`);

		if (
			!(await DiskGuard.hasEnoughSpace(Paths.TMP_TUS, Number(totalSize)))
		) {
			throw new NonRetryableError("磁碟空間不足");
		}

		const defaultExt = await getOrCreateDefaultExt();

		const fileListWithTempScanId = inputFileList.map((f) => {
			const result = FileCreateManyInputObjectZodSchema.safeParse({
				id: uuidv7(),
				originalName: f.name,
				size: f.size,
				checksum: f.checksum,
				isOriginal: true,
				metadata: f.metadata,
				status: FileStatus.UPLOADING,
				fileExtensionId: defaultExt.id,
			});

			if (!result.success) {
				throw new NonRetryableError(result.error.message);
			}
			return {
				result: result.data as Prisma.FileCreateManyInput,
				tempScanId: f.metadata.tempScanId,
			};
		});

		const fileList = fileListWithTempScanId.map((f) => f.result);
		const itemList = fileList.map((f) => {
			const result = ItemCreateManyInputObjectZodSchema.safeParse({
				id: f.id,
				name: f.originalName,
				type: ItemType.FILE_CONTAINER,
				status: ItemStatus.PROCESSING,
			});
			if (!result.success) {
				throw new NonRetryableError(result.error.message);
			}
			return result.data as Prisma.ItemCreateManyInput;
		});
		await svc.createItemFile({ fileList, itemList });
		log.debug(`fileList: ${JSON.stringify(fileList)}`);
		log.debug(`itemList: ${JSON.stringify(itemList)}`);

		return {
			notifyId: input.payload.notifyId,
			batchId: input.payload.batchId,
			fileList: fileListWithTempScanId.map((pair) => {
				const { result: f, tempScanId } = pair;

				return FileStateSchema.parse({
					fileId: f.id,
					fileName: f.originalName,
					status: "UPLOADING",
					tempScanId,
					itemId: f.id,
				});
			}),
		};
	},
);

export const archiveSealProcessor = defineProcessor(
	ACTION_LIST.SEAL.code,
	ArchiveSealSchema.single,
	async (input) => {
		const { fileId, fileName, checksum } = input.payload;

		const sourcePath = Paths.concat("TMP_TUS", fileId);
		const sourceMetadataPath = `${sourcePath}.json`;
		const targetDir = Paths.concat("TMP_PROCESS", fileId);
		const originalFilePath = Paths.concat(targetDir, "original");

		await fs.move(sourcePath, originalFilePath, { overwrite: true });
		await fs.remove(sourceMetadataPath);

		await svc.updateFileAndIntegrationRequest({
			fileId,
			fileName,
			checksum,
			originalFilePath,
		});

		return fileId;
	},
);
