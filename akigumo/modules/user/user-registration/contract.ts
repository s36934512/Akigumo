/**
 * @file Action contracts and constants for user aggregate
 *
 * This module centralizes action identifiers for the USER aggregate so
 * processors, workflow engine, and audit systems share the same contract.
 * Keeping these constants in one place prevents drift between layers.
 */

import { createEventCodes } from 'akigumo/shared/contracts/event-codes.helper';
import { ActionCategory, Severity } from 'generated/prisma/enums';

/**
 * User creation workflow identifier with semantic versioning
 *
 * Versioning allows us to introduce USER_CREATE_FLOW_V2 in the future while
 * still processing in-flight tasks created by V1 safely.
 */
export const USER_CREATE_WORKFLOW_NAME = 'USER_CREATE_FLOW_V1' as const;

/**
 * Action definitions for the USER aggregate
 *
 * We split creation into CREATE and SYNC actions because relational persistence
 * and graph synchronization have different failure modes and retry strategies.
 *
 * @property {object} CREATE - Persists users to PostgreSQL (source of truth)
 * @property {object} SYNC - Replicates users to Neo4j for graph queries
 */
export const USER_ACTIONS = {
    /**
        * CREATE_USER: persist user records to PostgreSQL
        *
        * We execute this first to establish canonical user identity before any
        * secondary-system synchronization happens.
     */
    CREATE: {
        code: 'USER_CREATE',
        name: '建立使用者',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
    /**
        * SYNC_USER: synchronize user nodes to Neo4j
        *
        * We keep this as a separate action so sync can retry independently without
        * re-running CREATE_USER and risking duplicate relational writes.
     */
    SYNC: {
        code: 'USER_SYNC',
        name: '同步使用者到neo4j',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    }
} as const;

/**
 * Type alias for valid user action codes
 * Union: CREATE_USER | SYNC_USER
 */
export type UserActionCode = typeof USER_ACTIONS[keyof typeof USER_ACTIONS]['code'];

export const UserEventCode = createEventCodes(USER_ACTIONS);

export type UserEventCode = typeof UserEventCode[keyof typeof UserEventCode];
