/**
 * @file State machine context and task schemas
 *
 * These schemas define persisted workflow context for tag provisioning.
 * Explicit persisted shape enables reliable rehydration after restarts.
 */

import { z } from '@hono/zod-openapi';
import {
    ErrorDetailSchema,
    TaskSchema,
    failureEvent,
    successEvent,
} from 'akigumo/shared/schemas/machine.schema';

import { EntityTagProvisioningEventCode as EventCode } from '../contract';

export const MachineContextSchema = z.object({
    // Ties this workflow instance to its outbox record across all logs and audit entries.
    correlationId: z.uuid().nullable(),
    // Carries the minimal entity shape (id + name) from PROVISION_TAGS into SYNC_TAGS_TO_GRAPH.
    // Only id and name are kept because Neo4j only needs identity data for MERGE operations.
    entityList: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })).default([]),
    // Captures the last failure reason so the FAILED terminal state is self-describing
    // without requiring a separate log query.
    error: ErrorDetailSchema.nullable(),
    // Holds the serialized task for the next processor step. Cleared on SUCCESS or FAILED
    // to prevent accidental duplicate dispatch on rehydration.
    nextTask: TaskSchema.nullable()
});

/**
 * TypeScript type for machine context
 */
export type MachineContext = z.infer<typeof MachineContextSchema>;

/**
 * Event schema for tag provisioning state machine transitions.
 */
export const MachineEventsSchema = z.discriminatedUnion('type', [
    successEvent(
        EventCode.TAG_PROVISION_SUCCESS,
        z.any()
    ),
    failureEvent(EventCode.TAG_PROVISION_FAILURE),

    successEvent(
        EventCode.TAG_SYNC_TO_GRAPH_SUCCESS,
        z.any()
    ),
    failureEvent(EventCode.TAG_SYNC_TO_GRAPH_FAILURE),
]);

export type MachineEvents = z.infer<typeof MachineEventsSchema>;