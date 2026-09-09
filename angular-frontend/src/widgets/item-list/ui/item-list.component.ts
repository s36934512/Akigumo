import { AsyncPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ArchiveEntryStore, ItemCardComponent } from "@/entities/archive";
import { ArchiveSelectionStore } from "@/features/archive-selection";
import {
	ListControlsComponent,
	ListControlsStore,
} from "@/features/list-controls";
import { NavigateToDetailDirective } from "@/features/navigate-to-detail";
import { UploadByDropComponent } from "@/features/upload-file";
import { OverlayPanelDirective } from "@/shared/ui/overlay-panel";
import { ItemListStore } from "../model";

@Component({
	selector: "widget-item-list",
	standalone: true,
	imports: [
		ListControlsComponent,
		ItemCardComponent,
		UploadByDropComponent,
		OverlayPanelDirective,
		NavigateToDetailDirective,
		AsyncPipe,
	],
	templateUrl: "./item-list.component.html",
	styleUrls: ["./item-list.component.scss"],
	changeDetection: ChangeDetectionStrategy.Eager,
	providers: [ItemListStore],
})
export class ItemListComponent {
	readonly archiveEntryStore = inject(ArchiveEntryStore);
	readonly itemListStore = inject(ItemListStore);
	readonly listControlsStore = inject(ListControlsStore);
	readonly archiveSelectionStore = inject(ArchiveSelectionStore);
}
