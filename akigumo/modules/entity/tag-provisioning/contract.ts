/**
 * @file Defines stable contracts for the "Entity Tag Provisioning" workflow.
 *
 * Why are these constants so important?
 * These identifiers are the "stable public API" of this vertical slice.
 * They are used in database records (outbox, audit logs), event streams, and worker
 * queues. Changing them after they've been used in a production system can
 * break the link between persisted tasks and their executable logic.
 *
 * They provide:
 * - Traceability: A consistent ID to follow a task from API call to completion.
 * - Idempotency: Workers can safely identify and ignore duplicate tasks.
 * - Decoupling: The kernel/worker system uses these codes to invoke logic without
 *   being tightly coupled to the implementation of this slice.
 */

import { createEventCodes } from 'akigumo/shared/contracts/event-codes.helper';
import { ActionCategory, Severity } from 'generated/prisma/enums';

// A unique, versioned name for the state machine associated with this workflow.
// "V1" indicates that future, non-backward-compatible changes will require a new name.
export const ENTITY_TAG_PROVISIONING_WORKFLOW_NAME = 'ENTITY_TAG_PROVISIONING_FLOW_V1' as const;

export const ENTITY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

export const ENTITY_TAG_PROVISIONING_ACTIONS = {
    /**
     * PROVISION_TAGS: Creates or updates the canonical tag/group records in PostgreSQL.
     *
     * This is the first and most critical step. It establishes the source-of-truth
     * records. The operation is designed to be idempotent (e.g., using upserts)
     * so it can be run repeatedly without creating duplicates.
     */
    PROVISION_TAGS: {
        code: 'TAG_PROVISION',
        name: '預置標籤與群組',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
    /**
     * SYNC_TAGS_TO_GRAPH: Replicates tags and their relationships to Neo4j.
     *
     * This step is separated to ensure that failures in the graph database (a secondary,
     * eventual-consistency store) do not fail the primary provisioning step.
     * Retrying this action is safe and idempotent.
     */
    SYNC_TAGS_TO_GRAPH: {
        code: 'TAG_SYNC_TO_GRAPH',
        name: '同步標籤到圖資料庫',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    }
} as const;

// This TypeScript magic creates a union type of all possible action codes, e.g., 'TAG_PROVISION' | 'TAG_SYNC_TO_GRAPH'
export type EntityTagProvisioningActionCode = typeof ENTITY_TAG_PROVISIONING_ACTIONS[keyof typeof ENTITY_TAG_PROVISIONING_ACTIONS]['code'];

// Helper function that derives event codes (e.g., TAG_PROVISION_SUCCESS, TAG_PROVISION_FAILURE) from the action definitions.
export const EntityTagProvisioningEventCode = createEventCodes(ENTITY_TAG_PROVISIONING_ACTIONS);

// The corresponding type for the generated event codes.
export type EntityTagProvisioningEventCode = typeof EntityTagProvisioningEventCode[keyof typeof EntityTagProvisioningEventCode];