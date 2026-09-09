import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { TagComponent } from "@/entities/concept";
import { ArchiveInfoComponent } from "@/features/archive-info";
import { ArchiveSelectionStore } from "@/features/archive-selection";

@Component({
	selector: "widget-info-panel",
	standalone: true,
	imports: [FormsModule, RouterModule, TagComponent, ArchiveInfoComponent],
	templateUrl: "./info-panel.component.html",
})
export class InfoPanelComponent {
	readonly archiveSelectionStore = inject(ArchiveSelectionStore);
}
