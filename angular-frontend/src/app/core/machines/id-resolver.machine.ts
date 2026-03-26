import { assign, fromPromise, setup } from 'xstate';

interface ResolveItemFilesResponse {
    mappings: Array<{
        itemId: string;
        fileId: string | null;
        coverUrl: string | null;
        displayAs: 'DISPLAY_AS' | 'CONTAINS' | 'AUTO_DETECT' | null;
    }>;
}

export interface ResolvedItemDisplay {
    fileId: string | null;
    coverUrl: string | null;
    displayAs: 'DISPLAY_AS' | 'CONTAINS' | 'AUTO_DETECT' | null;
}

export type ResolverPriority = 'high' | 'low';

export interface IdResolverContext {
    priorityQueue: Set<string>;
    loadingCache: Set<string>;
    resolvedMap: Map<string, ResolvedItemDisplay>;
}

type IdResolverEvent =
    | { type: 'ENQUEUE'; itemIds: string[]; priority: ResolverPriority }
    | { type: 'RESOLVE' }
    | { type: 'xstate.done.actor.resolveBatch'; output: ResolveBatchOutput }
    | { type: 'xstate.error.actor.resolveBatch'; error: unknown };

interface ResolveBatchOutput {
    requestedIds: string[];
    mappings: ResolveItemFilesResponse['mappings'];
}

export const IdResolverMachine = setup({
    types: {
        context: {} as IdResolverContext,
        events: {} as IdResolverEvent,
        output: {} as ResolveBatchOutput,
    },
    guards: {
        hasPending: ({ context }) => context.priorityQueue.size > 0,
    },
    actions: {
        enqueueByPriority: assign(({ context, event }) => {
            if (event.type !== 'ENQUEUE') return {};

            const existing = Array.from(context.priorityQueue);
            const incoming = Array.from(new Set(event.itemIds))
                .filter((id) => !!id)
                .filter((id) => !context.resolvedMap.has(id))
                .filter((id) => !context.loadingCache.has(id));

            if (incoming.length === 0) return {};

            const incomingSet = new Set(incoming);
            const existingWithoutIncoming = existing.filter((id) => !incomingSet.has(id));

            const nextQueue = event.priority === 'high'
                // Why: high priority ids are moved to queue head to reduce visible-card latency.
                ? new Set<string>([...incoming, ...existingWithoutIncoming])
                : new Set<string>([...existingWithoutIncoming, ...incoming]);

            return { priorityQueue: nextQueue };
        }),
        markBatchAsLoading: assign(({ context }) => {
            const batchIds = Array.from(context.priorityQueue).slice(0, 50);
            return { loadingCache: new Set(batchIds) };
        }),
        applyResolvedMappings: assign(({ context, event }) => {
            if (event.type !== 'xstate.done.actor.resolveBatch') return {};

            const { requestedIds, mappings } = event.output;
            const requestedSet = new Set(requestedIds);

            const nextResolved = new Map(context.resolvedMap);
            for (const itemId of requestedIds) {
                nextResolved.set(itemId, { fileId: null, coverUrl: null, displayAs: null });
            }
            for (const mapping of mappings ?? []) {
                nextResolved.set(mapping.itemId, {
                    fileId: mapping.fileId ?? null,
                    coverUrl: mapping.coverUrl ?? null,
                    displayAs: mapping.displayAs ?? null,
                });
            }

            const nextQueue = new Set(
                Array.from(context.priorityQueue).filter((id) => !requestedSet.has(id)),
            );

            return {
                resolvedMap: nextResolved,
                priorityQueue: nextQueue,
                loadingCache: new Set<string>(),
            };
        }),
        clearLoadingCache: assign(() => ({
            loadingCache: new Set<string>(),
        })),
    },
    actors: {
        resolveBatch: fromPromise(async ({ input }: { input: { batchIds: string[] } }): Promise<ResolveBatchOutput> => {
            const requestedIds = input.batchIds.slice(0, 50);
            if (requestedIds.length === 0) {
                return { requestedIds: [], mappings: [] };
            }

            const payload = { itemIds: requestedIds };

            const primaryResponse = await fetch('/api/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (primaryResponse.ok) {
                const data = (await primaryResponse.json()) as ResolveItemFilesResponse;
                return { requestedIds, mappings: data.mappings ?? [] };
            }

            // Why: keep compatibility with existing explorer endpoint during API migration.
            const fallbackResponse = await fetch('/api/v1/explorer/resolve-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!fallbackResponse.ok) {
                throw new Error('Failed to resolve item ids');
            }

            const fallbackData = (await fallbackResponse.json()) as ResolveItemFilesResponse;
            return { requestedIds, mappings: fallbackData.mappings ?? [] };
        }),
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QEkICU4HsA2A3MATgLICGAxgBYCWAdmAHRUTZgDEAogHICKAqu-wDaABgC6iUAAdMsKgBcqmGhJAAPRABYATPWF79B-QEYNAGhABPREYDsADnoBWGxoCcrgGw2AzBrs2tDQBfIPNUDFgcfGJyajpGZjY0dgBlAHkAGQA1dhFxJBBpWQUlFXUEQO96I39HI1dhby1XI29vcysEWyqPRz1vYVqtLWFHLRCw9Cw8QlJKWgYmFlY8lSL5RWUC8srq2vrG5tb2y0Rhqu8+4XqjYS1HV28TCZBw6ei5uIYCd9ooVggSkWNFwmAA1t93mAAEIkOSUVYFdYlLagHaORz0e56G6ODy2GyuOwdM4eBwYvQaRqOXzCGxeF5vSIzGLzeI-Zm4P6sQgETAEeiSbBwgBm-IAtvQOVEYXCEWI1jINqVtmc7Bp6B5sZctR42m0SQg7EZ6AN+hoNANXD5GVNObNYgspb8aP8uHwBLkFUilSiyohHBobFjHnZBm5PBiPIb1fQLe47I8jMmGhojCFQiAaJgIHAVEyZayvoript-QgALSY9w12u1uzR06Vjy2iKFz5OpZgEvK1FqRABejubwuDx6xNa5OGrT2IfYkbCPzNYSuVtQotO6V4P49v2qhB+TH0+51GpUjQ0w1n+hhnFaLUaDyDOx2DNBIA */
    id: 'IdResolverMachine',
    initial: 'idle',
    context: {
        priorityQueue: new Set<string>(),
        loadingCache: new Set<string>(),
        resolvedMap: new Map<string, ResolvedItemDisplay>(),
    },
    states: {
        idle: {
            on: {
                ENQUEUE: { actions: 'enqueueByPriority' },
                RESOLVE: {
                    guard: 'hasPending',
                    target: 'resolving',
                },
            },
            always: {
                guard: 'hasPending',
                target: 'resolving',
            },
        },
        resolving: {
            entry: 'markBatchAsLoading',
            invoke: {
                id: 'resolveBatch',
                src: 'resolveBatch',
                input: ({ context }) => ({
                    batchIds: Array.from(context.priorityQueue).slice(0, 50),
                }),
                onDone: {
                    target: 'idle',
                    actions: 'applyResolvedMappings',
                },
                onError: {
                    target: 'idle',
                    actions: 'clearLoadingCache',
                },
            },
            on: {
                ENQUEUE: { actions: 'enqueueByPriority' },
            },
        },
    },
});
