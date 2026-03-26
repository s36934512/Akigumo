/**
 * @file Contracts for item-file linking workflow.
 *
 * Keep aggregate and operation identifiers centralized so outbox producers
 * and worker processors cannot drift on routing keys.
 */

import { createEventCodes } from 'akigumo/shared/contracts/event-codes.helper';
import { ActionCategory, Severity } from 'generated/prisma/enums';

/**
 * Aggregate key consumed by kernel processor registry.
 */
export const ITEM_FILE_SYNC_AGGREGATE = 'ITEM_FILE_SYNC' as const;

/**
 * Operation definitions for item-file graph synchronization.
 */
export const ITEM_FILE_SYNC_ACTIONS = {
    SWITCH_PRIMARY_FILE: {
        code: 'SWITCH_PRIMARY_FILE',
        name: '切換 Item 主展示檔案',
        category: ActionCategory.DATA_OP,
        severity: Severity.MEDIUM,
    },
} as const;

export const ItemFileSyncEventCode = createEventCodes(ITEM_FILE_SYNC_ACTIONS);

export type ItemFileSyncActionCode =
    typeof ITEM_FILE_SYNC_ACTIONS[keyof typeof ITEM_FILE_SYNC_ACTIONS]['code'];
