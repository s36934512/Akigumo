import { Injectable, inject } from "@angular/core";

import { ArchiveEntryStore } from "@/entities/archive";
import { createSelectionStore } from "@/shared/lib/selection";

@Injectable()
export class ArchiveSelectionStore {
	readonly store = inject(ArchiveEntryStore);

	readonly selection = createSelectionStore(
		this.store.visibleEntries,
		this.store.visibleEntriesMap,
	);
}
