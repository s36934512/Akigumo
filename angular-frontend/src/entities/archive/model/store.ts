import { computed, DestroyRef, inject, Service } from "@angular/core";
import { injectQuery, QueryClient } from "@tanstack/angular-query-experimental";
import { produce } from "immer";
import { v7 as uuidv7 } from "uuid";

import { environment } from "@/environments/environment";
import { DefaultService } from "@/shared/api/default/default.service";
import {
	commitSsePatchQueue,
	registerSsePatchQueue,
} from "@/shared/lib/sse-patch-store";
import { SseBrokerService } from "@/shared/services/sse-broker.service";

import { PatchOperate, type PatchPayload, PatchPayloadSchema } from "./sse";
import { type ArchiveEntry, ArchiveSchema } from "./types";

function mergePatchIntoMap(
	patchMap: Map<string, PatchPayload["single"]>,
	sseItem: PatchPayload["single"],
): void {
	const entryId = sseItem.entry.id;
	const existing = patchMap.get(entryId);

	if (!existing) {
		switch (sseItem.op) {
			case PatchOperate.UPSERT_PROP:
			case PatchOperate.REPLACE_PROP:
				patchMap.set(entryId, {
					op: PatchOperate.OVERWRITE_OBJ,
					entry: { ...sseItem.entry },
					seq: sseItem.seq,
				});
				break;

			default:
				patchMap.set(entryId, { ...sseItem });
				break;
		}
		return;
	}

	existing.seq = sseItem.seq; // 維持最新號碼牌

	switch (sseItem.op) {
		case PatchOperate.DELETE_OBJ:
			existing.op = PatchOperate.DELETE_OBJ;
			existing.entry = { id: entryId };
			break;

		case PatchOperate.OVERWRITE_OBJ:
			existing.op = PatchOperate.OVERWRITE_OBJ;
			existing.entry = { ...sseItem.entry };
			break;

		case PatchOperate.UPSERT_PROP:
		case PatchOperate.REPLACE_PROP:
			if (
				existing.op === PatchOperate.DELETE_OBJ ||
				existing.op === PatchOperate.REMOVE_PROP
			) {
				Object.assign(existing, {
					op: PatchOperate.OVERWRITE_OBJ,
					entry: { ...sseItem.entry },
				});
			} else {
				existing.entry = {
					...existing.entry,
					...sseItem.entry,
				};
			}
			break;

		case PatchOperate.REMOVE_PROP:
			if (existing.op === PatchOperate.DELETE_OBJ) {
				break;
			}

			if (existing.op === PatchOperate.REMOVE_PROP) {
				existing.entry = {
					...existing.entry,
					...sseItem.entry,
				};
			} else {
				const nextEntry = { ...existing.entry };

				Object.keys(sseItem.entry).forEach((key) => {
					if (key in nextEntry) {
						// 如果現有資料有這個 key，直接將它刪除（剔除屬性）
						delete nextEntry[key];
					} else {
						// 如果現有資料找不到這個 key，將它設為 undefined
						nextEntry[key] = undefined;
					}
				});

				existing.entry = nextEntry;
			}
			break;
	}
}

function applyPatchesToSnapshot(
	baseItems: ArchiveEntry[],
	patchMap: Map<string, PatchPayload["single"]>,
): ArchiveEntry[] {
	if (baseItems.length === 0) return [];

	return produce(baseItems, (draft) => {
		// 逆向迴圈安全處理陣列刪除
		for (let i = draft.length - 1; i >= 0; i--) {
			const item = draft[i];

			const finalPatch = patchMap.get(item.id);

			if (finalPatch) {
				if (finalPatch.seq > 0) {
					switch (finalPatch.op) {
						case PatchOperate.DELETE_OBJ:
							draft.splice(i, 1);
							break;
						case PatchOperate.OVERWRITE_OBJ:
							draft[i] = {
								...item,
								...finalPatch.entry,
							};
							break;
						case PatchOperate.REMOVE_PROP: {
							Object.keys(finalPatch.entry).forEach((key) => {
								const draftKey =
									key as keyof (typeof draft)[number];

								if (draftKey in draft[i]) {
									delete draft[i][draftKey];
								}
							});

							break;
						}
					}
				}
				patchMap.delete(item.id);
			}
		}

		// 處理全新項目
		patchMap.forEach((finalPatch) => {
			if (finalPatch.op === PatchOperate.OVERWRITE_OBJ) {
				const result = ArchiveSchema.safeParse(finalPatch.entry);

				if (result.success) {
					draft.push({ ...result.data });
				} else {
					console.log("[SSE patch commit] 失敗");
					console.dir(finalPatch.entry);
					console.dir(result.error);
				}
			}
		});
	});
}

@Service()
export class ArchiveEntryStore {
	private readonly defaultService = inject(DefaultService);
	private readonly queryClient = inject(QueryClient);
	private readonly sseBrokerService = inject(SseBrokerService);
	private readonly destroyRef = inject(DestroyRef);

	readonly notifyId = uuidv7();

	private snapshotQuery = injectQuery(() => ({
		queryKey: ["archive-snapshot"],
		queryFn: async () => {
			this.queryClient.setQueryData(["archive-patches"], []);
			console.log(
				"[SSE 雙軌防禦] HTTP 重新請求發動，已清空舊的patch歷史",
			);

			const response = await this.defaultService.postApiV1Browse({
				notifyId: this.notifyId,
				showDeleted: false,
			});

			return response.items.flatMap((item) => {
				const result = ArchiveSchema.safeParse(item);
				console.dir(result);

				return result.success ? result.data : [];
			});
		},
		staleTime: Infinity, // 拿到後就不用自動重拉，交給 SSE 更新
	}));

	private patchesQuery = injectQuery(() => ({
		queryKey: ["archive-patches"],
		queryFn: () => [] as PatchPayload["array"],
		staleTime: Infinity,
		gcTime: Infinity,
	}));

	readonly visibleEntries = computed(() => {
		if (!this.snapshotQuery.isSuccess()) return [];

		const rawSnapshot = this.snapshotQuery.data();
		const accumulatedPatches = this.patchesQuery.data() ?? [];

		if (accumulatedPatches.length > 0) {
			queueMicrotask(() => this.flushPatchQueue());
		}

		return rawSnapshot;
	});

	readonly visibleEntriesMap = computed(() => {
		return new Map(this.visibleEntries().map((entry) => [entry.id, entry]));
	});

	constructor() {
		const url = `${environment.apiUrl}/api/v1/stream`;

		const unregister = registerSsePatchQueue(
			this.sseBrokerService,
			url,
			"ARCHIVE_PATCH",
			this.queryClient,
			["archive-patches"],
			PatchPayloadSchema.single,
		);

		this.destroyRef.onDestroy(() => {
			unregister();
		});

		this.sseBrokerService.listen(url);
	}

	private flushPatchQueue() {
		const patchesToCommit = commitSsePatchQueue<
			ArchiveEntry[],
			PatchPayload["single"]
		>({
			queryClient: this.queryClient,
			patchQueryKey: ["archive-patches"],
			snapshotQueryKey: ["archive-snapshot"],
			mergePatchIntoMap,
			applyPatchesToSnapshot,
		});

		if (patchesToCommit.length > 0) {
			console.log(
				`[SSE 防禦系統] 已成功 Commit ${patchesToCommit.length} 筆，並安全更新佇列。`,
			);
		}
	}

	/**
	 * 當畫面上使用者按下「手動重新整理」時，只需要呼叫這個方法
	 */
	public refetchData() {
		this.snapshotQuery.refetch();
	}
}
