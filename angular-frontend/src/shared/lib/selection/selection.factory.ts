import { computed, type Signal, signal } from "@angular/core";
import type { Identifiable } from "./types";

export function createSelectionStore<T extends Identifiable>(
	rawDataSource: Signal<T[]>,
	dataSourceMap?: Signal<Map<T["id"], T>>,
) {
	// 1. 純粹狀態：被選中的 ID 集合
	const selectedIds = signal<Set<T["id"]>>(new Set());

	// 2. 衍生狀態：所有資料的 ID 列表
	const allIds = computed(() => rawDataSource().map((item) => item.id));

	// 3. 衍生狀態：是否全選
	const isAllSelected = computed(() => {
		const ids = allIds();
		if (ids.length === 0) return false;
		const currentSet = selectedIds();
		return ids.every((id) => currentSet.has(id));
	});

	// 4. 衍生狀態：是否半選 (Indeterminate)
	const isIndeterminate = computed(() => {
		const selectedCount = selectedIds().size;
		const totalCount = allIds().length;
		return selectedCount > 0 && selectedCount < totalCount;
	});

	// 5. 衍生狀態：將原始資料包裝上 isSelected 狀態
	const viewData = computed(() => {
		const data = rawDataSource();
		const currentSet = selectedIds();
		return data.map((item) => ({
			...item,
			isSelected: currentSet.has(item.id),
		}));
	});

	// 6. 衍生狀態：判斷是否「恰好只選了一個」
	const hasExactlyOneSelected = computed(() => {
		return selectedIds().size === 1;
	});

	const singleSelected = computed(() => {
		if (!hasExactlyOneSelected()) return null;
		const [singleId] = selectedIds();

		// 如果有提供 Map 就用 O(1) 查找，沒有就用原來的 .find()
		if (dataSourceMap) {
			return dataSourceMap().get(singleId) || null;
		}
		return rawDataSource().find((p) => p.id === singleId) || null;
	});

	// ==========================================
	// 動作 (Actions)
	// ==========================================

	// 切換單一項目
	function toggleSelect(id: T["id"]) {
		selectedIds.update((set) => {
			const newSet = new Set(set);
			newSet.has(id) ? newSet.delete(id) : newSet.add(id);
			return newSet;
		});
	}

	// 全選 / 取消全選
	function toggleAll() {
		if (isAllSelected()) {
			selectedIds.set(new Set());
		} else {
			selectedIds.set(new Set(allIds()));
		}
	}

	// 清空
	function clearSelection() {
		selectedIds.set(new Set());
	}

	// 返回外部可以使用的狀態與方法
	return {
		selectedIds,
		viewData,
		isAllSelected,
		isIndeterminate,
		hasExactlyOneSelected,
		singleSelected,
		toggleSelect,
		toggleAll,
		clearSelection,
	};
}
