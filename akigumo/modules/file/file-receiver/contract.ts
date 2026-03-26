/**
 * @file Action contracts and constants for file receiver workflow
 *
 * Keep action codes centralized so state machines, processors, and outbox
 * payloads remain consistent across retries and deployments.
 */

import { createEventCodes } from 'akigumo/shared/contracts/event-codes.helper';
import { ActionCategory, Severity } from 'generated/prisma/enums';

/**
 * Workflow identifier for file receiver orchestration.
 */
export const FILE_CREATE_WORKFLOW_NAME = 'FILE_CREATE_FLOW_V1' as const;

/**
 * Default extension fallback when probe result is not available yet.
 */
export const DEFAULT_EXT = 'unknown';

/**
 * Canonical action definitions for file receiver workflow.
 */
export const FILE_RECEIVER_ACTIONS = {
    /**
     * CREATE: reserves file identity before streaming starts.
     *
     * Why: this gives the workflow a stable file reference so later upload,
     * sealing, and synchronization steps can operate idempotently.
     */
    INTENT: {
        code: 'FILE_CREATE_INTENT',
        name: '建立上傳意圖',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
    SYNC_INTENT_TO_GRAPH: {
        code: 'INTENT_SYNC_TO_GRAPH',
        name: '同步意圖到圖資料庫',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
    /**
     * INIT_ITEM: dispatches item-level child workflow initialization.
     *
     * Why: parent and child workflows are decoupled so each file item can retry
     * independently without blocking the whole batch.
     */
    INIT_ITEM: {
        code: 'FILE_INIT_ITEM',
        name: '初始化檔案子項目',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
    START_NOTIFY: {
        code: 'FILE_START_NOTIFY',
        name: '通知檔案整合模組開始',
        category: ActionCategory.SYSTEM,
        severity: Severity.LOW,
    },
    /**
     * SYNC: replicates canonical file data to graph storage.
     *
     * Why: relational writes and graph sync have different failure domains,
     * so sync remains a separate retriable operation.
     */
    SYNC: {
        code: 'FILE_SYNC_NEO4J',
        name: '同步圖資料庫',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    }
} as const;


export type FileReceiverActionCode = typeof FILE_RECEIVER_ACTIONS[keyof typeof FILE_RECEIVER_ACTIONS]['code'];

export const FileReceiverEventCode = createEventCodes(FILE_RECEIVER_ACTIONS);

export type FileReceiverEventCode = typeof FileReceiverEventCode[keyof typeof FileReceiverEventCode];
