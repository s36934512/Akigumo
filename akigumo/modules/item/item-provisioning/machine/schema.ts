import { z } from '@hono/zod-openapi';
import { ItemSearchEventCode } from 'akigumo/modules/item/item-search/contract';
import {
    ErrorDetailSchema,
    TaskSchema,
    failureEvent,
    successEvent,
} from 'akigumo/shared/schemas/machine.schema';

import { ItemEventCode as EventCode } from '../contract';

export const MachineContextSchema = z.object({
    correlationId: z.uuid().nullable(),
    itemIds: z.array(z.uuid()).default([]),
    error: ErrorDetailSchema.nullable(),
    nextTask: TaskSchema.nullable(),
});

export type MachineContext = z.infer<typeof MachineContextSchema>;

export const MachineEventsSchema = z.discriminatedUnion('type', [
    successEvent(EventCode.ITEM_CREATE_SUCCESS, z.any()),
    failureEvent(EventCode.ITEM_CREATE_FAILURE),
    successEvent(EventCode.ITEM_SYNC_SUCCESS, z.any()),
    failureEvent(EventCode.ITEM_SYNC_FAILURE),
    successEvent(ItemSearchEventCode.ITEM_SEARCH_UPSERT_SUCCESS, z.any()),
    failureEvent(ItemSearchEventCode.ITEM_SEARCH_UPSERT_FAILURE),
]);

export type MachineEvents = z.infer<typeof MachineEventsSchema>;
