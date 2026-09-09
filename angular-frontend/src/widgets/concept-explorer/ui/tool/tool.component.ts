import { Component, computed, inject } from "@angular/core";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { ConceptSelectionStore } from "@/features/concept-selection";
import { THEME } from "@/shared/themes/theme";
import { UiIntentStore, UiToken } from "@/shared/ui-intent";

@Component({
	selector: "widget-navigation-sidebar-tool",
	templateUrl: "./tool.component.html",
	standalone: true,
	imports: [MatButtonToggleModule],
})
export class ToolComponent {
	private readonly uiIntentStore = inject(UiIntentStore);
	private readonly conceptSelectionStore = inject(ConceptSelectionStore);

	readonly theme = THEME;

	selectedLayout: string = "Force Directed";

	// 處理新增節點
	onAddNode(): void {
		this.uiIntentStore.dispatch(UiToken.OPEN_REGISTRY);
	}

	// 處理新增連線
	onAddEdge(): void {
		console.log("Add Edge clicked");
		// 在這裡加入實作邏輯
	}

	// 處理刪除選取項目
	onDelete(event: Event): void {
		const ids = Array.from(
			this.conceptSelectionStore.nodeSelection.selectedIds(),
		).map((id) => ({ id }));
		this.uiIntentStore.dispatch(UiToken.DELETE, { event, ids });
	}

	// 處理佈局變更
	onLayoutChange(event: Event): void {
		const selectElement = event.target as HTMLSelectElement;
		this.selectedLayout = selectElement.value;
		console.log("Layout changed to:", this.selectedLayout);
		// 在這裡加入切換圖表佈局的邏輯
	}

	openDeleteMode = computed(() => {
		return this.conceptSelectionStore.nodeSelection.selectedIds().size > 0;
	});
}
