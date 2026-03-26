import { assign, setup, fromPromise } from 'xstate';
import { prisma } from '@core/db/prisma';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout, map, tap } from 'rxjs/operators';
import {
    CreateEntityContext,
    CreateEntityInput,
    PersistEntityToDbInput,
    PersistEntityToDbInputSchema,
    SyncEntityToGraphInput,
    SyncEntityToGraphInputSchema
} from './create-entity.schema';
import { status$ } from '@core/db/stream-listener';
import { AggregateType, ENTITY_ACTIONS } from './create-entity.contract';
import { z } from '@hono/zod-openapi';

export const createEntityMachine = setup({
    types: {
        input: {} as CreateEntityInput,
        context: {} as CreateEntityContext,
    },
    actions: {
        logSuccess: () => console.log('完成！'),
        logError: ({ context, event }) => {
            console.log('=== [createEntity logError Action 觸發] ===');
            console.log('當前 Context:', context);
            console.log('錯誤來源 Event:', event);

            if ('error' in event) {
                console.error('具體錯誤原因:', event.error);
            }
        },
    },
    actors: {
        'SAVE_ENTITY': fromPromise(async ({ input }: { input: PersistEntityToDbInput }) => {
            if (!input.name) throw new Error('Name is required');

            return await prisma.$transaction(async (tx) => {
                const entity = await tx.entity.create({
                    data: {
                        name: input.name,
                        description: input.description,
                        metadata: input.metadata || undefined,
                    }
                });
                await tx.outbox.create({
                    data: {
                        aggregateType: AggregateType,
                        operation: ENTITY_ACTIONS.CREATED.code,
                        payload: { entityId: entity.id },
                    }
                });

                return { entityId: entity.id };
            });
        }),
        'WAIT_SYNC': fromPromise(async ({ input }: { input: SyncEntityToGraphInput }) => {
            const schema = ENTITY_ACTIONS.CREATED.schemas.graph;

            const result = await firstValueFrom(
                status$.pipe(
                    tap(data =>
                        console.log('=== [createEntityMachine Stream Listener Emitted Data] === \n', data)
                    ),
                    filter((data) => {
                        return data.aggregateType === AggregateType;
                    }),
                    map(data => {
                        try {
                            const raw = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
                            return schema.safeParse(raw);
                        } catch (e) {
                            return { success: false as const };
                        }
                    }),
                    filter((result): result is { success: true; data: z.infer<typeof schema> } => result.success),
                    map(result => result.data),
                    filter((data) => input.entityIds.includes(data.entityId)),
                    take(1),
                    timeout(8000)
                )
            );

            return result;
        })
    }
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMBRAdlgJZYCeAdAMoCCAagJIByA4gPq6MAq9nAmgMQQA9vjDki+AG5CA1mLSYcBYmSp0mbDtz4IJ05NiIiA2gAYAumfOJQAByGwSR-DZAAPRACYArAA5yAGwAjD5BvgCcEZ4RQQDMADQgpIhxpoHepqZBAOym2Z6esZ45AL4liQrYeIQkFDQMLOxcPAJgqKhCqOS2ADbYAGadALbklUo1qvUaTdq8ulJCBsQmFlau9o7LLkjuXn6BId5hkeHR4XGJyQixAQAsgdkZ3tlFt2-eAWUV6FXKtVS8RgAYQ0ghEYj0snkP3GKjqgJBLHm+kMK0sFnWDicIlcHgQARe5E8AR8RyO4W8nluQUuiF8sXIFMyQVMH18QTeni+IDG1ThAOBoLaHS6vQGw1GML5-0oCI0yMWqPwVjWOw22O2oDxBIZxNJQXJlOptIQBQZmUyt1i4TypmpIW5vL+kzlLH4blgWCq5Aw-RwqAAFCyLQBKfhOibwwUsVV2LFbXGIHVEkneMlBClUmlJFKxNIBDJZXL5QrFbJlcogfBCCBwVwRuGYzbORMIAC0ARNbe8jPCff7A77vk+lYbMvUjS0LSbGtbt08Jtit38y9isQi9NMvj83kdUudUcRzBnCZ2eNulPItwtsWyAVM4TzqZNIX8BIyGd8pgC1s8kT3ijSpMACqQJArglCUCeLZnnS7LkHmmTZMhS52mmJrwYhSEfNkOThPOAG-JG5AAGLUPQAAyuAACLQTisEIL4mEWshLzXhe3iLoSsSFlkFK3EytzlhWQA */
    id: 'createEntity',
    initial: 'SAVING_ENTITY',
    context: ({ input }) => ({
        ...input,
        entityId: null,
        error: null,
    }),
    states: {
        'SAVING_ENTITY': {
            invoke: {
                src: 'SAVE_ENTITY',
                input: ({ context }) => (PersistEntityToDbInputSchema.parse(context)),
                onDone: {
                    target: 'SYNCING',
                    actions: assign({ entityId: ({ event }) => event.output.entityId })
                },
                onError: { target: 'FAILED', actions: assign({ error: ({ event }) => String(event.error) }) }
            }
        },
        'SYNCING': {
            invoke: {
                src: 'WAIT_SYNC',
                input: ({ context }) => (SyncEntityToGraphInputSchema.parse({ entityIds: [context.entityId] })),
                onDone: {
                    target: 'SUCCESS',
                },
                onError: {
                    target: 'FAILED',
                    actions: assign({ error: ({ event }) => String(event.error) })
                }
            },
            after: {
                10000: { target: 'FAILED', actions: assign({ error: () => 'Timeout waiting for worker' }) }
            }
        },
        'SUCCESS': { type: 'final' },
        'FAILED': { type: 'final' }
    }
});
