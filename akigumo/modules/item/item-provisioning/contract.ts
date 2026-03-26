/**
 * @file Action contracts and constants for item aggregate
 *
 * This module centralizes action identifiers for the ITEM aggregate so
 * processors, workflow engine, and audit systems share the same contract.
 * Keeping these constants in one place prevents drift between layers.
 */

import { createEventCodes } from 'akigumo/shared/contracts/event-codes.helper';
import { ActionCategory, Severity } from 'generated/prisma/enums';

/**
 * Item creation workflow identifier with explicit version suffix
 *
 * Versioning allows us to introduce ITEM_CREATE_FLOW_V2 in the future while
 * still processing in-flight tasks created by V1 safely.
 */
export const ITEM_CREATE_WORKFLOW_NAME = 'ITEM_CREATE_FLOW_V1' as const;

/**
 * Action definitions for the ITEM aggregate
 *
 * We split creation into CREATE and SYNC actions because relational persistence
 * and graph synchronization have different failure modes and retry strategies.
 *
 * @property {object} CREATE - Persists items to PostgreSQL (source of truth)
 * @property {object} SYNC - Replicates items to Neo4j for graph queries
 */
export const ITEM_ACTIONS = {
    /**
     * CREATE_ITEM: persist item records to PostgreSQL
     *
     * We execute this first to establish canonical item identity before any
     * secondary-system synchronization happens.
     */
    CREATE: {
        code: 'ITEM_CREATE',
        name: '建立項目',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
    /**
     * SYNC_ITEM: synchronize item nodes to Neo4j
     *
     * We keep this as a separate action so sync can retry independently without
     * re-running CREATE_ITEM and risking duplicate relational writes.
     */
    SYNC: {
        code: 'ITEM_SYNC',
        name: '同步項目到neo4j',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    }
} as const;

/**
 * Type alias for valid item action codes
 * Union: CREATE_ITEM | SYNC_ITEM
 */
export type ItemActionCode = typeof ITEM_ACTIONS[keyof typeof ITEM_ACTIONS]['code'];

export const ItemEventCode = createEventCodes(ITEM_ACTIONS);

export type ItemEventCode = typeof ItemEventCode[keyof typeof ItemEventCode];
