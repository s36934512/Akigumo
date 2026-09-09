import { Component, computed, effect, inject, viewChild } from "@angular/core";

import { ArchiveSelectionStore } from "@/features/archive-selection";
import { ConceptEditorComponent } from "@/features/concept-editor";
import { DefaultService } from "@/shared/api/default/default.service";
import {
	SIDEBAR_INITIAL_STATE,
	SidebarComponent,
	SidebarStore,
} from "@/shared/ui/sidebar";
import { UiIntentStore, UiToken } from "@/shared/ui-intent";
import { InfoAddComponent } from "@/widgets/info-add";
import { InfoPanelComponent } from "@/widgets/info-panel";

type KeyType = { name: string; id?: string } | { id: string };

@Component({
	selector: "page-explorer-right-sidebar",
	standalone: true,
	imports: [
		InfoPanelComponent,
		ConceptEditorComponent,
		SidebarComponent,
		InfoAddComponent,
	],
	templateUrl: "./right-sidebar.component.html",
	providers: [
		SidebarStore,
		{
			provide: SIDEBAR_INITIAL_STATE,
			useValue: {
				reversed: true,
				collapsed: true,
				baseWidth: "24rem",
				pinnedCollapseWidth: "0px",
			},
		},
	],
})
export class RightSidebarComponent {
	private readonly defaultService = inject(DefaultService);
	readonly archiveSelectionStore = inject(ArchiveSelectionStore);
	private readonly uiIntentStore = inject(UiIntentStore);

	readonly sidebarEl = viewChild(SidebarComponent);
	readonly infoAddEl = viewChild(InfoAddComponent);

	private readonly selection = computed(() => {
		return this.archiveSelectionStore.selection.selectedIds().size > 0;
	});

	edit = false;

	constructor() {
		effect(() => {
			const isSelected = this.selection();
			this.sidebarEl()?.store.setCollapsed(!isSelected);
		});
	}

	async onEditSave() {
		this.edit = false;
		const entry = this.archiveSelectionStore.selection.singleSelected();
		console.log(entry);
		if (entry) {
			const metadataList = this.infoAddEl()
				?.allData()
				.map((data) => {
					const keyId = data.value.keyId;
					// 雖然是string[]，但收到是string

					console.log(keyId);
					const key = keyId.startsWith("newTag-")
						? { name: keyId.slice("newTag-".length) }
						: { id: keyId };

					const value = data.value.valueId.flatMap<KeyType>(
						(value) => {
							// newTag-tagName
							// id
							if (value.startsWith("newTag-")) {
								return [
									{ name: value.slice("newTag-".length) },
								];
							}
							return [{ id: value }];
						},
					);

					return { key: key, value };
				});

			console.dir(metadataList);
			if (metadataList) {
				await this.defaultService.postApiV1ArchiveConcept([
					{
						targetIdList: [entry.id],
						metadataList,
					},
				]);
			}
		}
	}

	onDelete(event: Event): void {
		const ids = Array.from(
			this.archiveSelectionStore.selection.selectedIds(),
		).map((id) => ({ id }));
		this.uiIntentStore.dispatch(UiToken.DELETE, { event, ids });
	}
}
