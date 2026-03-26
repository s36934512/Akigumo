import { assign, setup, fromPromise } from 'xstate';
import { prisma } from '@core/db/prisma';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout, map, tap } from 'rxjs/operators';
import {
    CreateItemContext,
    CreateItemInput,
    PersistItemToDbInput,
    PersistItemToDbInputSchema,
    SyncItemToGraphInput,
    SyncItemToGraphInputSchema
} from './create-item.schema';
import { status$ } from '@core/db/stream-listener';
import { ItemStatus, ItemType } from 'generated/prisma/enums';
import { AggregateType, ITEM_ACTIONS } from './create-item.contract';
import { z } from '@hono/zod-openapi';

export const createItemMachine = setup({
    types: {
        input: {} as CreateItemInput,
        context: {} as CreateItemContext,
    },
    actions: {
        logSuccess: () => console.log('完成！'),
        logError: ({ context, event }) => {
            console.log('=== [createItem logError Action 觸發] ===');
            console.log('當前 Context:', context);
            console.log('錯誤來源 Event:', event);

            if ('error' in event) {
                console.error('具體錯誤原因:', event.error);
            }
        },
    },
    actors: {
        'SAVE_ITEM': fromPromise(async ({ input }: { input: PersistItemToDbInput }) => {
            if (!input.name) throw new Error('Name is required');

            return await prisma.$transaction(async (tx) => {
                const item = await tx.item.create({
                    data: {
                        title: input.name,
                        type: ItemType.WORK,
                        status: ItemStatus.ACTIVE,
                    }
                });
                await tx.outbox.create({
                    data: {
                        aggregateType: AggregateType,
                        operation: ITEM_ACTIONS.CREATED.code,
                        payload: { itemId: item.id, targetItemId: input.targetItemId },
                    }
                });

                return { itemId: item.id };
            });
        }),
        'WAIT_SYNC': fromPromise(async ({ input }: { input: SyncItemToGraphInput }) => {
            const schema = ITEM_ACTIONS.CREATED.schemas.graph;

            const result = await firstValueFrom(
                status$.pipe(
                    tap(data =>
                        console.log('=== [createItemMachine Stream Emitted Data] === \n', data)
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
                    filter((data) => input.itemIds.includes(data.itemId)),
                    take(1),
                    timeout(8000)
                )
            );

            return result;
        })
    }
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMBJHAtgHQDKAggGq4ByA4gPq4AqAogLIDEEA9gHZhEAlrwBu3ANYC0mHPjDFyVOo1ZsEwscmyC+AbQAMAXQOHEoAA7dYgrDt5mQAD0QAmACwBmIm-2-9bgFZ9AA43UIA2ABoQAE9XfQBGInCAdiD9F3CAThcUhP0s8IBfIujpbDxCUkoaBmZ2DjBUVG5UInMAG2wAM1bictkqxVqVdnVRbi1bPSMTB0trafskJ1dPbz9-INCI6LiED3C3ZLSMj2CC9JSSsvQKuQUATWoAYVquPgENCSk7wflSM83nRxpptDNjEZ5lYbHYHM4EOEAi4iMEPGlcgFDuFcntEGiiFk3Fksjs3ClicSPDcQANKgCSED3k0Wm1Oj0+kQ6Q9Aa9aqDJuDeCY5isFrC+PDEEiUWiMWlsbjYq4XF5NpcEod9GkAjTuUMmXQOI5YFgKkQMN0cKgABT5PwASg4+oZhtooosMKWUsRyNR6ORCvCOJSeIQmv0yXSW3c+g8WRKpRAvG4EDgDhdBGhizhKwRAFoosqEIWiOry74Em49X96Qoasp6mxsxLlqAEW4XGGPGFvGie1jgi5Mh5dUnM7zgbQW9684hO0ksqd3KqLguwwkSckSSSEgFAilEgnx7WeSQAKovF4sEgkGe59v4oKo05ucL6AI40JZMPBJIeTYqyrFIl1HGsZDrIgADEyFwAAZFgABF70lOcEGCZ9glfd9Pxcb8w3cLwElOBIsPRTthzHEogA */
    id: 'createItem',
    initial: 'SAVING_ITEM',
    context: ({ input }) => ({
        ...input,
        itemId: null,
        error: null,
    }),
    states: {
        'SAVING_ITEM': {
            invoke: {
                src: 'SAVE_ITEM',
                input: ({ context }) => (PersistItemToDbInputSchema.parse(context)),
                onDone: {
                    target: 'SYNCING',
                    actions: assign({ itemId: ({ event }) => event.output.itemId })
                },
                onError: { target: 'FAILED', actions: assign({ error: ({ event }) => String(event.error) }) }
            }
        },
        'SYNCING': {
            invoke: {
                src: 'WAIT_SYNC',
                input: ({ context }) => (SyncItemToGraphInputSchema.parse({ itemIds: [context.itemId] })),
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
