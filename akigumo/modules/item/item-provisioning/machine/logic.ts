import { buildWorkflowError } from 'akigumo/shared/schemas/machine.schema';
import { ItemModelSchema } from 'generated/zod/schemas';
import { assertEvent } from 'xstate';

import { ItemEventCode } from '../contract';
import { MachineEvents } from './schema';

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ItemEventCode.ITEM_CREATE_SUCCESS);
        const items = ItemModelSchema.array().parse(event.data || []);

        return {
            itemIds: items.map((item) => item.id),
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        return {
            error: buildWorkflowError(event, 'ItemProvisioningMachine'),
        };
    },
};
