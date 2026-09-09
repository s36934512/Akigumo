import { inject, Service } from "@angular/core";
import { createSelectionStore } from "@/shared/lib/selection";
import { ArchiveEntryStore } from "./store";

@Service()
export class ArchiveEntryUiStore {
	private readonly store = inject(ArchiveEntryStore);

	readonly selection = createSelectionStore(this.store.visibleEntries);
}
