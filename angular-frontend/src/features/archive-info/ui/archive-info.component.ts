import { Component, computed, inject, input } from "@angular/core";

import type { Archive } from "@/entities/archive";
import { ConceptEntryStore, TagComponent } from "@/entities/concept";
import { UiIntentStore, UiToken } from "@/shared/ui-intent";

@Component({
	selector: "feature-archive-info",
	standalone: true,
	imports: [TagComponent],
	templateUrl: "./archive-info.component.html",
})
export class ArchiveInfoComponent {
	readonly uiIntentStore = inject(UiIntentStore);

	private readonly conceptEntryStore = inject(ConceptEntryStore);

	entry = input<Archive | null>(null);

	concepts = computed(() => {
		const entry = this.entry();
		const conceptItemsMap = this.conceptEntryStore.nodeMap();

		return entry?.conceptList?.flatMap((item) => {
			if (!item.conceptId) return [];

			const concept = conceptItemsMap.get(item.conceptId);
			if (!concept) return [];

			return [{ concept, type: item.type }];
		});
	});

	onExpanded() {
		this.uiIntentStore.dispatch(UiToken.EXPANDED);
	}
}
