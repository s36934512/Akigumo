import { assign, setup, fromPromise } from 'xstate';
import { prisma } from '@core/db/prisma';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout, map, tap } from 'rxjs/operators';
import {
    CreateUserContext,
    CreateUserInput,
    PersistUserToDbInput,
    PersistUserToDbInputSchema,
    SyncUserToGraphInput,
    SyncUserToGraphInputSchema
} from './create-user.schema';
import { status$ } from '@core/db/stream-listener';
import { ItemStatus, ItemType } from 'generated/prisma/enums';
import { OUTBOX_DEFS } from 'libs/contract/constants/outbox.constants';
import { AggregateType, GetPayload, USER_ACTIONS } from './create-user.contract';
import { z } from '@hono/zod-openapi';


export const createUserMachine = setup({
    types: {
        input: {} as CreateUserInput,
        context: {} as CreateUserContext,
    },
    actions: {
        logSuccess: () => console.log('完成！'),
        logError: ({ context, event }) => {
            console.log('=== [createUser logError Action 觸發] ===');
            console.log('當前 Context:', context);
            console.log('錯誤來源 Event:', event);

            if ('error' in event) {
                console.error('具體錯誤原因:', event.error);
            }
        },
    },
}).createMachine({
    id: 'createUser',
    initial: 'SYNCING',
    context: ({ input }) => ({
        ...input,
        userId: null,
        error: null,
    }),
    states: {
        'SYNCING': {
            on: {
                SYNC_SUCCESS: {
                    target: 'SUCCESS',
                },
                SYNC_FAILURE: {
                    target: 'FAILED',
                    actions: assign({ error: ({ event }) => event.error })
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
