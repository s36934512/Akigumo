import { Injectable, inject } from "@angular/core";

import { ArchiveEntryUiStore } from "@/entities/archive";
import { ConceptEntryStore } from "@/entities/concept";
import { DefaultService } from "@/shared/api/default/default.service";
import type { ConceptRegistryInput } from "./schema";

@Injectable()
export class ConceptEditorStore {
	private readonly defaultService = inject(DefaultService);
	private readonly archiveEntryUiStore = inject(ArchiveEntryUiStore);
	protected readonly conceptEntryStore = inject(ConceptEntryStore);

	registry(conceptRegistryInputs: ConceptRegistryInput[]) {
		this.defaultService.postApiV1OntologyRegistry({
			notifyId: this.conceptEntryStore.notifyId,
			registryList: conceptRegistryInputs,
		});
	}

	attach(customAttributes: { key: string; value: ConceptRegistryInput[] }[]) {
		const selectedIds = this.archiveEntryUiStore.selection
			.selectedIds()
			.values();
		const targetIds = [];
		for (const id of selectedIds) {
			targetIds.push({
				id,
				type: "item" as const,
			});
		}

		this.defaultService.postApiV1OntologyAttacher([
			{
				targetIds: targetIds,
				customAttributes,
			},
		]);
	}
}
