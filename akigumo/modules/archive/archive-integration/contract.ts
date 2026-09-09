import {
	createEventCodes,
	type InferActionCode,
	type InferEventCode,
} from "#akigumo/shared/contracts/index.js";
import { ActionCategory, Severity } from "#generated/prisma/enums.js";

export const WORKFLOW_TYPE = "ARCHIVE_INTEGRATION_FLOW_V1" as const;

export const ACTION_LIST = {
	INIT_RECURSIVE: {
		code: "INIT_RECURSIVE",
		name: "初始化遞迴解壓縮檔案子項目",
		category: ActionCategory.DATA_OP,
		severity: Severity.LOW,
	},

	UNCOMPRESS: {
		code: "ARCHIVE_UNCOMPRESS",
		name: "解壓縮檔案",
		category: ActionCategory.DATA_OP,
		severity: Severity.MEDIUM,
	},

	TRANSCODE: {
		code: "ARCHIVE_TRANSCODE",
		name: "轉碼檔案",
		category: ActionCategory.DATA_OP,
		severity: Severity.MEDIUM,
	},

	DISPATCH_TASKS: {
		code: "ARCHIVE_DISPATCH_TASKS",
		name: "任務派發",
		category: ActionCategory.SYSTEM,
		severity: Severity.LOW,
	},

	NOTIFY: {
		code: "ARCHIVE_NOTIFY",
		name: "子任務回覆",
		category: ActionCategory.SYSTEM,
		severity: Severity.LOW,
	},
	NOTIFY_PARENT: {
		code: "ARCHIVE_NOTIFY_PARENT",
		name: "父任務回覆",
		category: ActionCategory.SYSTEM,
		severity: Severity.LOW,
	},

	STORAGE: {
		code: "ARCHIVE_STORAGE",
		name: "檔案最終儲存",
		category: ActionCategory.SYSTEM,
		severity: Severity.MEDIUM,
	},
} as const;

export const EventCode = createEventCodes(ACTION_LIST);

export type ActionCode = InferActionCode<typeof ACTION_LIST>;
export type EventCode = InferEventCode<typeof ACTION_LIST>;

export const FILE_CATEGORY_STRATEGIES = {
	ARCHIVE: {
		shouldUncompress: true,
		shouldTranscode: false,
		description: "壓縮檔",
	},
	IMAGE: {
		shouldUncompress: false,
		shouldTranscode: true,
		description: "圖片",
	},
	VIDEO: {
		shouldUncompress: false,
		shouldTranscode: false,
		description: "影片",
	},
	DOC: {
		shouldUncompress: false,
		shouldTranscode: false,
		description: "文件",
	},
	AUDIO: {
		shouldUncompress: false,
		shouldTranscode: false,
		description: "音訊",
	},
	OTHERS: {
		shouldUncompress: false,
		shouldTranscode: false,
		description: "其他",
	},
} as const;

export type FileCategory = keyof typeof FILE_CATEGORY_STRATEGIES;
export type FileCategoryStrategy =
	(typeof FILE_CATEGORY_STRATEGIES)[FileCategory];
