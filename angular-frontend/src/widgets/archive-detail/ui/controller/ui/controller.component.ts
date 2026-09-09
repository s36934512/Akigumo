import { Component, inject } from "@angular/core";
import { ButtonModule } from "@openng/optimus-ui/button";
import type { SelectChangeEvent } from "@openng/optimus-ui/select";
import { SplitButtonModule } from "@openng/optimus-ui/splitbutton";
import { ToolbarModule } from "@openng/optimus-ui/toolbar";

@Component({
	selector: "widget-archive-detail-controller",
	templateUrl: "./controller.component.html",
	standalone: true,
	imports: [ButtonModule, ToolbarModule, SplitButtonModule],
})
export class ControllerComponent {
	// toggleSort() {
	//     this.provider.updateState({
	//         sortState: this.sortState === 'asc' ? 'desc' : 'asc'
	//     });
	// }

	onSortChange(event: SelectChangeEvent) {
		// this.provider.updateState({
		//     selectedSortIndex: this.sortOptions.findIndex(o => o.code === event.value.code)
		// });
	}

	get items() {
		return [
			{ label: "Edit", icon: "pi pi-pen-to-square" },
			{ separator: true },
			{
				label: "Delete",
				icon: "pi pi-trash",
			},
		];
	}
}
