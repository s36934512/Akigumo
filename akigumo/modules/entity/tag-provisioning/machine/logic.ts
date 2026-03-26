/**
 * @file Encapsulated actions for tag-provisioning machine
 *
 * Why this module exists:
 * - Keep machine.ts focused on state transitions.
 * - Isolate event parsing and payload mapping for easier unit tests.
 */

import { buildWorkflowError } from 'akigumo/shared/schemas/machine.schema';
import { EntityModelSchema } from 'generated/zod/schemas';
import { assertEvent } from 'xstate';

import { MachineEvents } from './schema';
import { EntityTagProvisioningEventCode } from '../contract';

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }
    ) {
        assertEvent(event, EntityTagProvisioningEventCode.TAG_PROVISION_SUCCESS);
        const entities = EntityModelSchema.array().parse(event.data || []);

        // Only id and name are forwarded to the sync step. The Neo4j MERGE query
        // identifies nodes by id and sets name — no other fields are needed there,
        // so keeping the context payload minimal reduces serialization overhead.
        return {
            entityList: entities.map((entity) => ({ id: entity.id, name: entity.name })),
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        return {
            error: buildWorkflowError(event, 'TagProvisioningMachine'),
        };
    },
};
