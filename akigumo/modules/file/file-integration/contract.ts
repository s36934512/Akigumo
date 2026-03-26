/**
 * @file Action contracts and constants for process-file-item workflow
 *
 * Keep action codes centralized so child-machine tasks, worker processors,
 * and feedback routing remain stable across retries.
 */

import { defineActions } from 'akigumo/shared/contracts/action.types';
import { createEventCodes } from 'akigumo/shared/contracts/event-codes.helper';
import { ActionCategory, Severity } from 'generated/prisma/enums';

/**
 * Canonical action definitions for process-file-item child workflow.
 */
export const FILE_INTEGRATION_ACTIONS = defineActions({
    /**
     * Locks the upload record before any processing begins.
     *
     * Prevents concurrent upload mutations from corrupting the
     * processing pipeline while the file is still being written.
     */
    SEAL: {
        code: 'FILE_SEAL',
        name: '完成上傳封存',
        category: ActionCategory.DATA_OP,
        severity: Severity.MEDIUM,
    },
    /**
     * Registers extracted child files so the parent can track them.
     *
     * Child files must be known to the parent workflow before dispatch
     * so progress accounting can expect the correct count up front.
     */
    INIT_RECURSIVE: {
        code: 'FILE_INIT_RECURSIVE',
        name: '初始化遞迴解壓縮檔案子項目',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
    /**
     * Unpacks archive contents before graph sync can proceed.
     *
     * Graph labels and child-file references cannot be determined
     * until archive members are extracted and identified.
     */
    UNCOMPRESS: {
        code: 'FILE_UNCOMPRESS',
        name: '解壓縮檔案',
        category: ActionCategory.DATA_OP,
        severity: Severity.MEDIUM,
    },
    /**
     * Produces display-ready derivatives from the raw source image.
     *
     * The frontend requires WebP format; the source file cannot be
     * served until at least one derivative has been created.
     */
    TRANSCODE: {
        code: 'FILE_TRANSCODE',
        name: '轉碼檔案',
        category: ActionCategory.DATA_OP,
        severity: Severity.MEDIUM,
    },
    /**
     * Persists the finalized file node into Neo4j before notifying the parent.
     *
     * Sync is the last step before the parent receives a completion event,
     * ensuring node durability before the batch counter advances.
     */
    SYNC: {
        code: 'FILE_SYNC_NODE',
        name: '同步檔案節點到neo4j',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
    /**
     * Fans out child-file integration tasks in parallel.
     *
     * Parallel dispatch prevents the parent from blocking on sequential
     * processing when an archive contains many extracted entries.
     */
    DISPATCH_SUB_TASKS: {
        code: 'FILE_DISPATCH_SUB_TASKS',
        name: '子任務派發',
        category: ActionCategory.SYSTEM,
        severity: Severity.LOW,
    },

    /**
     * Reports single child-file completion back to the parent machine.
     *
     * Each child sends this event so the parent increments its progress
     * counter without polling or coupling to child machine internals.
     */
    NOTIFY_SUB_TASK: {
        code: 'FILE_NOTIFY_SUB_TASK',
        name: '通知子任務',
        category: ActionCategory.SYSTEM,
        severity: Severity.LOW,
    }
} as const);

export type FileIntegrationActionCode = typeof FILE_INTEGRATION_ACTIONS[keyof typeof FILE_INTEGRATION_ACTIONS]['code'];

export const FileIntegrationEventCode = createEventCodes(FILE_INTEGRATION_ACTIONS);

export type FileIntegrationEventCode = typeof FileIntegrationEventCode[keyof typeof FileIntegrationEventCode];


/**
 * Maps file category to processing flags used by the SEAL processor.
 *
 * Centralizing strategy flags here avoids scattered conditionals across
 * action handlers and keeps routing logic in one place.
 */
export const FILE_CATEGORY_STRATEGIES = {
    ARCHIVE: {
        shouldUncompress: true,
        shouldTranscode: false,
        description: '壓縮檔'
    },
    IMAGE: {
        shouldUncompress: false,
        shouldTranscode: true,
        description: '圖片'
    },
    VIDEO: {
        shouldUncompress: false,
        shouldTranscode: false,
        description: '影片'
    },
    DOC: {
        shouldUncompress: false,
        shouldTranscode: false,
        description: '文件'
    },
    AUDIO: {
        shouldUncompress: false,
        shouldTranscode: false,
        description: '音訊'
    },
    OTHERS: {
        shouldUncompress: false,
        shouldTranscode: false,
        description: '其他'
    }
} as const;

export type FileCategory = keyof typeof FILE_CATEGORY_STRATEGIES;
export type FileCategoryStrategy = typeof FILE_CATEGORY_STRATEGIES[FileCategory];

