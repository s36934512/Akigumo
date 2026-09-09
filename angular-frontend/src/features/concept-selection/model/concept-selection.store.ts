import { Injectable, inject } from "@angular/core";

import { ConceptEntryStore } from "@/entities/concept";
import { createSelectionStore } from "@/shared/lib/selection";

@Injectable()
export class ConceptSelectionStore {
	readonly store = inject(ConceptEntryStore);

	readonly nodeSelection = createSelectionStore(
		this.store.nodes,
		this.store.nodeMap,
	);

	readonly edgeSelection = createSelectionStore(
		this.store.edges,
		this.store.edgeMap,
	);
}
