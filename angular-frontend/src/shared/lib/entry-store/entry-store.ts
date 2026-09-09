import { computed, inject, signal } from "@angular/core";
import { z } from "@hono/zod-openapi";
import _ from "lodash";
import { type Observable, scan, tap } from "rxjs";
import { SseConnectionService } from "@/shared/services/sse-connection.service";

// 強制要求所有要存入的資料，都必須有一個基礎識別欄位（例如 id）
export interface BaseEntity {
	[key: string]: unknown;
}

export type PatchPayload<E> = {
	op: "UPSERT" | "DELETE";
	entry: E;
	seq?: number;
	ts?: number;
};

// 泛型型態參數：
// T: 代表資料的完整結構（必須繼承 BaseEntity）
// P: 代表後端傳來的 Patch 結構，預設為局部更新 Partial<T>
export abstract class EntryStore<
	K extends string | number,
	T extends BaseEntity,
	P extends Record<string, unknown> = Record<string, unknown>,
> {
	// 直接注入全域唯一 SSE 連線服務
	private sseService = inject(SseConnectionService);

	// 1. 內部狀態改用泛型 Map
	private itemMap = signal<Map<K, T>>(new Map());

	// 2. 暴露唯讀的 Map Signal 給外部存取（高效率 O(1) 查找）
	readonly items = this.itemMap.asReadonly();

	// 3. 自動同步的唯讀陣列（供 @for 渲染）
	readonly itemList = computed(() => Array.from(this.itemMap().values()));

	protected abstract keySelector(item: T | P | unknown): K;

	/**
	 * 規格化選取器 (預設直接回傳，子類別可覆寫)
	 * 專門用來把不完整的 API 原始資料，補齊或轉換為具備完整欄位的 T 泛型。
	 */
	protected sanitizeEntity(rawItem: unknown): T {
		return rawItem as T;
	}

	/**
	 * 全量覆蓋方法 (通常在第一次 HTTP 載入時呼叫)
	 */
	setEntries(entries: unknown[]): void {
		this.itemMap.update((currentMap) => {
			const nextMap = new Map<K, T>(currentMap);

			entries.forEach((rawEntry) => {
				const newEntry = this.sanitizeEntity(rawEntry);
				const key = this.keySelector(newEntry);
				const oldEntry = nextMap.get(key);

				// 如果有舊物件，就把新舊物件合併；沒有就直接放新的
				const mergedEntry = oldEntry
					? _.mergeWith(
							structuredClone(oldEntry),
							newEntry,
							this.arrayCustomizer,
						)
					: newEntry;

				nextMap.set(key, mergedEntry);
			});
			return nextMap;
		});
	}

	/**
	 * @param eventType 對應你後端傳來的事件名稱（例如 "browse-items"）
	 * @param initialList 初始資料
	 */
	connectSseStream(
		eventType: string,
		initialList: unknown[] = [],
	): Observable<T[]> {
		// 優先寫入初始值
		if (initialList.length > 0) {
			this.setEntries(initialList);
		}

		const patchPayloadSchema = z.object({
			op: z.enum(["UPSERT", "DELETE"]),
			entry: z.record(z.string(), z.unknown()),
			seq: z.number().optional(),
			ts: z.number().optional(),
		});
		const listSchema = z.array(patchPayloadSchema);

		// 1. 直接呼叫你寫好的 watchTopic，傳入 eventType
		return this.sseService.watchTopic<PatchPayload<P>[]>(eventType).pipe(
			// 2. 利用 Zod 進行局部欄位安全性驗證
			scan((currentList: T[], payload) => {
				try {
					const validatedPatches = listSchema.parse(payload);
					let updatedList = [...currentList];

					for (const patch of validatedPatches) {
						const targetKey = this.keySelector(patch.entry as P);

						const index = updatedList.findIndex(
							(item) => this.keySelector(item) === targetKey,
						);

						if (index !== -1 && patch.seq !== undefined) {
							interface HasSequence {
								seq?: number;
							}

							const currentItem = updatedList[
								index
							] as HasSequence;
							const currentSeq = currentItem.seq ?? 0;
							const patchSeq = patch.seq;

							// 如果補丁的序號落後或等於目前的序號，代表這是重複或舊的補丁，直接跳過不做任何處理
							if (patchSeq <= currentSeq) {
								console.warn(
									`[BaseStore] 偵測到落後補丁。ID: ${targetKey}, 補丁序號: ${patchSeq} <= 目前序號: ${currentSeq}。已自動忽略該變更。`,
								);
								continue;
							}
						}

						if (patch.op === "DELETE") {
							updatedList = updatedList.filter(
								(item) => this.keySelector(item) !== targetKey,
							);
							continue; // 處理下一筆補丁
						}

						if (patch.op === "UPSERT") {
							if (index === -1) {
								// 案例 A：全新資料，清洗欄位後直接推入陣列
								// 確保 patch.entry 內也要保留 seq，這樣下次比對才拿得到
								const newEntity = {
									...this.sanitizeEntity(patch.entry),
									seq: patch.seq, // 強制鎖定最新序號
								} as T;
								updatedList.push(newEntity);
							} else {
								// 案例 B：局部更新，使用 Lodash mergeWith 進行深層合併
								updatedList[index] = _.mergeWith(
									structuredClone(updatedList[index]),
									{ ...patch.entry, seq: patch.seq }, // 合併時一併把最新的 seq 寫進去
									this.arrayCustomizer,
								) as T;
							}
						}
					}
					return updatedList;
				} catch (err) {
					console.error(`[BaseStore] Zod 驗證或主鍵擷取失敗:`, err);
				}
				return currentList;
			}, Array.from(this.itemMap().values())),
			// 3. 自動把 RxJS 的最終成果同步回寫至 Signal
			tap((latestList) => this.setEntries(latestList)),
		);
	}

	private arrayCustomizer(objValue: unknown, srcValue: unknown) {
		// 如果當前欄位是陣列
		if (_.isArray(objValue)) {
			return srcValue;
		}
		return undefined;
	}
}
