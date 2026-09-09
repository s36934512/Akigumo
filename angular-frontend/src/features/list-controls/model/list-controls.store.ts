import { Injectable, signal } from "@angular/core";

import {
	initialFilterState,
	type ListFilterState,
} from "./list-controls.types";

const MAX_GRID_DENSITY = 8;
const MIN_GRID_DENSITY = 2;

@Injectable({ providedIn: "root" }) // 如果有多個清單，可以改為 Widget 層級 provide
export class ListControlsStore {
	// 記錄當前的篩選條件
	private state = signal<ListFilterState>(initialFilterState);
	private _isExpanded = signal<boolean>(false);
	private _columnCount = signal<number>(5);

	// 唯讀的 Signal 供外部訂閱
	readonly currentQueryParams = this.state.asReadonly();
	readonly isExpanded = this._isExpanded.asReadonly();
	readonly columnCount = this._columnCount.asReadonly();

	get canIncrease() {
		return this.columnCount() < MAX_GRID_DENSITY;
	}

	get canDecrease() {
		return this.columnCount() > MIN_GRID_DENSITY;
	}

	// 更新搜尋關鍵字
	updateSearch(query: string) {
		this.state.update((s) => ({ ...s, searchQuery: query }));
	}

	// 更新分類篩選
	updateCategory(category: string) {
		this.state.update((s) => ({ ...s, category }));
	}

	// 更新標籤篩選
	updateTags(tags: string[]) {
		this.state.update((s) => ({ ...s, selectedTags: tags }));
	}

	toggleTag(tag: string) {
		this.state.update((s) => {
			const nextTags = new Set(s.selectedTags);
			if (nextTags.has(tag)) {
				nextTags.delete(tag);
			} else {
				nextTags.add(tag);
			}
			return { ...s, selectedTags: Array.from(nextTags) };
		});
	}

	clearTags() {
		this.state.update((s) => ({ ...s, selectedTags: [] }));
	}

	// 更新排序
	updateSort(sortBy: ListFilterState["sortBy"]) {
		this.state.update((s) => {
			const isSameField = s.sortBy === sortBy;
			const sortOrder = isSameField && s.sortOrder === "desc" ? "asc" : "desc";
			return { ...s, sortBy, sortOrder };
		});
	}

	updateDensity(delta: number) {
		this._columnCount.update((v) =>
			Math.min(MAX_GRID_DENSITY, Math.max(MIN_GRID_DENSITY, v + delta)),
		);
	}

	toggleExpanded() {
		this._isExpanded.update((v) => !v);
	}
}
