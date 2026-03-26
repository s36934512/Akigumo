/**
 * @file State machine context and event schemas for user-registration.
 */

import { z } from '@hono/zod-openapi';
import {
    ErrorDetailSchema,
    TaskSchema,
    failureEvent,
    successEvent,
} from 'akigumo/shared/schemas/machine.schema';

import { UserEventCode as EventCode } from '../contract';

export const MachineContextSchema = z.object({
    correlationId: z.uuid().nullable(),
    userIds: z.array(z.uuid()).default([]),
    error: ErrorDetailSchema.nullable(),
    nextTask: TaskSchema.nullable(),
});

export type MachineContext = z.infer<typeof MachineContextSchema>;

export const MachineEventsSchema = z.discriminatedUnion('type', [
    successEvent(
        EventCode.USER_CREATE_SUCCESS,
        z.any(),
    ),
    failureEvent(EventCode.USER_CREATE_FAILURE),
    successEvent(
        EventCode.USER_SYNC_SUCCESS,
        z.any(),
    ),
    failureEvent(EventCode.USER_SYNC_FAILURE),
]);

export type MachineEvents = z.infer<typeof MachineEventsSchema>;
