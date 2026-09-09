import fs from "fs-extra";
import { v7 as uuidv7 } from "uuid";
import { NonRetryableError } from "#akigumo/kernel/index.js";
import * as Paths from "#akigumo/kernel/paths.js";
import { CommonIdObjectSchema } from "#akigumo/shared/contracts/common.js";
import { defineProcessor } from "#akigumo/shared/factories/index.js";
import type { Prisma } from "#generated/prisma/client.js";
import { FileStatus, ItemStatus, ItemType } from "#generated/prisma/enums.js";
import {
	FileCreateManyInputObjectZodSchema,
	ItemCreateManyInputObjectZodSchema,
} from "#generated/zod/schemas/index.js";
import { getOrCreateDefaultExt } from "../../common/service.js";
import { ACTION_LIST } from "../contract.js";
import * as dispatchService from "./dispatch.service.js";
import * as svc from "./service.js";
import * as transcodeService from "./transcode.service.js";
import {
	DispatchInputSchema,
	StorageInputSchema,
	UncompressInputSchema,
} from "./type.js";
import { extractArchive, moveMassiveFiles } from "./uncompress.helper.js";
import * as uncompressService from "./uncompress.service.js";

export const archiveIntegrationProcessor = defineProcessor(
	ACTION_LIST.STORAGE.code,
	StorageInputSchema,
	async (input) => {
		const { fileId, fileList } = input.payload;

		const processDir = Paths.concat("TMP_PROCESS", fileId);
		const finalDir = Paths.concat("STORAGE_ORIGINALS", fileId);

		await fs.copy(processDir, finalDir, { overwrite: true });
		await fs.remove(processDir);

		const targetIdList = fileList.concat(fileId);
		const oldSegment = Paths.TMP_PROCESS;
		const newSegment = Paths.STORAGE_ORIGINALS;

		await svc.updateFilePath({ targetIdList, oldSegment, newSegment });
	},
);

export const archiveIntegrationDispatchProcessor = defineProcessor(
	ACTION_LIST.DISPATCH_TASKS.code,
	DispatchInputSchema,
	async (input) => {
		const { fileId, uncompressMaxDepth, correlationId } = input.payload;

		const result = await dispatchService.dispatchTask({
			fileId,
			uncompressMaxDepth,
			correlationId,
		});

		return result;
	},
);

export const archiveIntegrationTranscodeProcessor = defineProcessor(
	ACTION_LIST.TRANSCODE.code,
	CommonIdObjectSchema.single,
	async (input) => {
		return transcodeService.transcode(input.payload);
	},
);

export const archiveIntegrationUncompressProcessor = defineProcessor(
	ACTION_LIST.TRANSCODE.code,
	UncompressInputSchema,
	async (input) => {
		const extractedFiles = await extractArchive(
			input.payload.fileId,
			input.payload.extensionCode,
		);
		const defaultExt = await getOrCreateDefaultExt();

		const fileListWithPaths = extractedFiles.map((absolutePath) => {
			const id = uuidv7();
			const physicalPath = Paths.concat("TMP_PROCESS", id, "original");

			const result = FileCreateManyInputObjectZodSchema.safeParse({
				id,
				originalName: Paths.basename(absolutePath),
				physicalPath: physicalPath,
				isOriginal: true,
				status: FileStatus.PROCESSING,
				fileExtensionId: defaultExt.id,
			});

			if (!result.success) {
				throw new NonRetryableError(result.error.message);
			}
			return {
				result: result.data as Prisma.FileCreateManyInput,
				absolutePath,
				physicalPath,
			};
		});
		const fileList = fileListWithPaths.map((f) => f.result);
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

		await moveMassiveFiles(
			fileListWithPaths.map((f) => ({
				sourcePath: f.absolutePath,
				targetPath: f.physicalPath,
			})),
		);
		await uncompressService.createItemFile({ fileList, itemList });

		return {
			fileIds: fileList.map((f) => f.id),
		};
	},
);

export const archiveIntegrationNotifyProcessor = defineProcessor(
	ACTION_LIST.NOTIFY.code,
	CommonIdObjectSchema.single,
	async (input) => {
		return input.payload;
	},
);

export const archiveIntegrationNotifyParentProcessor = defineProcessor(
	ACTION_LIST.NOTIFY_PARENT.code,
	CommonIdObjectSchema.single,
	async (input) => {
		await svc.notifyParentWorkflowState(input.payload);
	},
);
