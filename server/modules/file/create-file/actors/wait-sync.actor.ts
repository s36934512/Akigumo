import { fromPromise } from 'xstate';
import { firstValueFrom, throwError, filter, take, timeout } from 'rxjs';
import { status$, parseOutboxPayload } from '@core/db/stream-listener';
import { WaitSyncInput } from '../create-file.schema';
import { AggregateType, FILE_ACTIONS } from '../create-file.contract';

/**
 * 監聽neo4j同步完成的 Actor
 */
export const waitSyncActor = fromPromise(async ({ input }: { input: WaitSyncInput }) => {
    if (!input.fileId) throw new Error('File ID is missing');

    return await firstValueFrom(
        status$.pipe(
            filter(data => data.aggregateType === AggregateType),
            parseOutboxPayload(FILE_ACTIONS.SYNCED.schemas.graph),
            filter(payload => payload.fileId === input.fileId),
            take(1),
            timeout({
                each: 60000,
                with: () => throwError(() => new Error(`Graph sync timed out for file: ${input.fileId}`))
            })
        )
    );
});