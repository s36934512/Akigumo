/**
 * @file Encapsulated actions for user-registration machine.
 *
 * Why isolate these handlers?
 * Keeping transition logic separate from machine wiring simplifies tests and
 * makes event-shape changes local to one module.
 */

import { buildWorkflowError } from 'akigumo/shared/schemas/machine.schema';
import { UserModelSchema } from 'generated/zod/schemas';
import { assertEvent } from 'xstate';

import { UserEventCode } from '../contract';
import { MachineEvents } from './schema';

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, UserEventCode.USER_CREATE_SUCCESS);
        const users = UserModelSchema.array().parse(event.data || []);

        return {
            userIds: users.map((user) => user.id),
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        return {
            error: buildWorkflowError(event, 'UserRegistrationMachine'),
        };
    },
};
