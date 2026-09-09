import { computed, Directive, input, signal } from "@angular/core";
import type { Identifiable } from "./types";

@Directive({
	selector: "[sharedSelectionDirective]",
	standalone: true,
	exportAs: "sharedSelectionDirective",
})
export class SelectionDirective<T extends Identifiable> {
	rawDataSource = input.required<T[]>({ alias: "sharedSelectionDirective" });
	dataSourceMap = input<Map<T["id"], T>>();

	// 1. 純粹狀態：被選中的 ID 集合
	selectedIds = signal<Set<T["id"]>>(new Set());

	// 2. 衍生狀態：所有資料的 ID 列表
	allIds = computed(() => this.rawDataSource().map((item) => item.id));

	// 3. 衍生狀態：是否全選
	isAllSelected = computed(() => {
		const ids = this.allIds();
		if (ids.length === 0) return false;
		const currentSet = this.selectedIds();
		return ids.every((id) => currentSet.has(id));
	});

	// 4. 衍生狀態：是否半選 (Indeterminate)
	isIndeterminate = computed(() => {
		const selectedCount = this.selectedIds().size;
		const totalCount = this.allIds().length;
		return selectedCount > 0 && selectedCount < totalCount;
	});

	// 5. 衍生狀態：將原始資料包裝上 isSelected 狀態
	viewData = computed(() => {
		const data = this.rawDataSource();
		const currentSet = this.selectedIds();
		return data.map((item) => ({
			...item,
			isSelected: currentSet.has(item.id),
		}));
	});

	// 6. 衍生狀態：判斷是否「恰好只選了一個」
	hasExactlyOneSelected = computed(() => {
		return this.selectedIds().size === 1;
	});

	singleSelected = computed(() => {
		if (!this.hasExactlyOneSelected()) return null;
		const [singleId] = this.selectedIds();
		const map = this.dataSourceMap();

		// 如果有提供 Map 就用 O(1) 查找，沒有就用原來的 .find()
		if (map) {
			return map.get(singleId) || null;
		}
		return this.rawDataSource().find((p) => p.id === singleId) || null;
	});

	// ==========================================
	// 動作 (Actions)
	// ==========================================

	// 切換單一項目
	toggleSelect = (id: T["id"]) => {
		this.selectedIds.update((set) => {
			const newSet = new Set(set);
			newSet.has(id) ? newSet.delete(id) : newSet.add(id);
			return newSet;
		});
	};

	// 全選 / 取消全選
	toggleAll() {
		if (this.isAllSelected()) {
			this.selectedIds.set(new Set());
		} else {
			this.selectedIds.set(new Set(this.allIds()));
		}
	}

	// 清空
	clearSelection() {
		this.selectedIds.set(new Set());
	}
}
