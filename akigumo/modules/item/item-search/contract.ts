/**
 * @file Contracts for item-search module.
 *
 * Aggregate and action identifiers are centralized here so the processor
 * registry key and workflow task dispatch cannot drift independently.
 */

import { createEventCodes } from 'akigumo/shared/contracts/event-codes.helper';
import { ActionCategory, Severity } from 'generated/prisma/enums';

export const ITEM_SEARCH_AGGREGATE = 'ITEM_SEARCH' as const;

export const ITEM_SEARCH_ACTIONS = {
    UPSERT: {
        code: 'ITEM_SEARCH_UPSERT',
        name: '更新 MeiliSearch 索引文件',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
} as const;

export const ItemSearchEventCode = createEventCodes(ITEM_SEARCH_ACTIONS);

export type ItemSearchActionCode =
    typeof ITEM_SEARCH_ACTIONS[keyof typeof ITEM_SEARCH_ACTIONS]['code'];
