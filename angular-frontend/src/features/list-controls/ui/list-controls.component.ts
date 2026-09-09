import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "@openng/optimus-ui/button";
import { InputGroupModule } from "@openng/optimus-ui/inputgroup";
import { InputGroupAddonModule } from "@openng/optimus-ui/inputgroupaddon";
import { InputTextModule } from "@openng/optimus-ui/inputtext";
import { type SelectChangeEvent, SelectModule } from "@openng/optimus-ui/select";
import { ToolbarModule } from "@openng/optimus-ui/toolbar";
import { TooltipModule } from "@openng/optimus-ui/tooltip";

import { ListControlsStore } from "../model/list-controls.store";
import { AdvancedPanelComponent } from "./advanced-panel.component";
import { SORT_OPTIONS } from "./interface";

@Component({
	selector: "feature-list-controls",
	templateUrl: "./list-controls.component.html",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [
		ButtonModule,
		SelectModule,
		FormsModule,
		InputTextModule,
		InputGroupModule,
		InputGroupAddonModule,
		ToolbarModule,
		TooltipModule,
		AdvancedPanelComponent,
	],
})
export class ListControlsComponent {
	sortState = "asc";
	sortOptions = SORT_OPTIONS;
	selectedSortIndex = 0;
	sortIcon = "pi-arrow-up";
	searchValue = "";
	protected store = inject(ListControlsStore);
	// protected uploadService = inject(UploadService);

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

	onSearchChange(query: string) {
		this.store.updateSearch(query);
	}

	onFolderSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		// this.uploadService.addFilesFromFolderInput(input.files);
		input.value = "";
	}
}
