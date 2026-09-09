import type { QueryClient } from "@tanstack/angular-query-experimental";
import { z } from "zod";

import type { SseBrokerService } from "@/shared/services/sse-broker.service";

export type SsePatch<
	TEntry extends Record<string, unknown> = Record<string, unknown>,
> = {
	seq: number;
	op: string;
	entry: TEntry;
};

export function enqueueSsePatches<
	TPatch extends SsePatch<Record<string, unknown>>,
>(
	queryClient: QueryClient,
	patchQueryKey: readonly unknown[],
	patchSchema: z.ZodType<TPatch>,
	payload: unknown,
): TPatch[] | null {
	const newPatches = Array.isArray(payload) ? payload : [payload];
	const result = z.array(patchSchema).safeParse(newPatches);

	if (!result.success) {
		return null;
	}

	queryClient.setQueryData<TPatch[]>(patchQueryKey, (oldPatches = []) => {
		return [...oldPatches, ...result.data];
	});

	return result.data;
}

export function registerSsePatchQueue<
	TPatch extends SsePatch<Record<string, unknown>>,
>(
	sseBrokerService: SseBrokerService,
	streamUrl: string,
	eventType: string,
	queryClient: QueryClient,
	patchQueryKey: readonly unknown[],
	patchSchema: z.ZodType<TPatch>,
): () => void {
	return sseBrokerService.registerHandler(streamUrl, eventType, (payload) => {
		enqueueSsePatches(queryClient, patchQueryKey, patchSchema, payload);
	});
}

export function commitSsePatchQueue<
	TSnapshot,
	TPatch extends SsePatch<Record<string, unknown>>,
>({
	queryClient,
	patchQueryKey,
	snapshotQueryKey,
	mergePatchIntoMap,
	applyPatchesToSnapshot,
}: {
	queryClient: QueryClient;
	patchQueryKey: readonly unknown[];
	snapshotQueryKey?: readonly unknown[];
	mergePatchIntoMap: (patchMap: Map<string, TPatch>, sseItem: TPatch) => void;
	applyPatchesToSnapshot: (
		snapshot: TSnapshot,
		patchMap: Map<string, TPatch>,
	) => TSnapshot;
}): TPatch[] {
	const patchesToCommit =
		queryClient.getQueryData<TPatch[]>(patchQueryKey) ?? [];

	if (patchesToCommit.length === 0) {
		return [];
	}

	const patchMap = new Map<string, TPatch>();
	for (const patch of patchesToCommit) {
		mergePatchIntoMap(patchMap, patch);
	}

	if (snapshotQueryKey) {
		queryClient.setQueryData<TSnapshot>(snapshotQueryKey, (oldSnapshot) => {
			return oldSnapshot === undefined
				? oldSnapshot
				: applyPatchesToSnapshot(oldSnapshot, patchMap);
		});
	}

	queryClient.setQueryData<TPatch[]>(patchQueryKey, (currentPatches = []) => {
		return currentPatches.slice(patchesToCommit.length);
	});

	return patchesToCommit;
}
