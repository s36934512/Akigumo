import { computed, Injectable, inject } from "@angular/core";
import { BehaviorSubject, filter, map } from "rxjs";
import {
	ArchiveEntryStore,
	FileTypeSchema,
	ItemTypeSchema,
} from "@/entities/archive";
import { ListControlsStore } from "@/features/list-controls";

@Injectable()
export class ItemListStore {
	archiveEntryStore = inject(ArchiveEntryStore);
	listControlsStore = inject(ListControlsStore);

	hoveredIndex$ = new BehaviorSubject<number | null>(null);

	normalizedGallery = computed(() =>
		this.archiveEntryStore.visibleEntries().map((entry) => {
			if (
				entry.type !== ItemTypeSchema.enum.FILE_CONTAINER ||
				entry.file.type !== FileTypeSchema.enum.image
			) {
				return null;
			} else {
				const ratio = this.calculateScaleRatio(
					window.innerWidth - 2,
					window.innerHeight - 38,
					entry.file.width,
					entry.file.height,
				);

				return {
					id: entry.id,
					name: entry.name,
					url: entry.file.url,
					width: Number((entry.file.width * ratio).toFixed(2)),
					height: Number((entry.file.height * ratio).toFixed(2)),
				};
			}
		}),
	);

	filteredEntries = computed(() => {
		const entries = this.archiveEntryStore.visibleEntries();
		const state = this.listControlsStore.currentQueryParams();
		const query = state.searchQuery.trim().toLowerCase();
		const selectedTags = state.selectedTags ?? [];

		return entries?.filter((entry) => {
			const searchable = [entry.name, entry.id, entry.type]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			const matchesSearch = !query || searchable.includes(query);

			const matchesTags = selectedTags.length === 0;

			return matchesSearch && matchesTags;
		});
	});

	dynamicArchives$ = this.hoveredIndex$.pipe(
		filter((index): index is number => index !== null),
		map((index) => this.normalizedGallery()[index]),
	);

	setHovered(index: number | null): void {
		this.hoveredIndex$.next(index);
	}

	calculateScaleRatio(
		maxWidth: number,
		maxHeight: number,
		imgWidth: number,
		imgHeight: number,
	) {
		const widthRatio = maxWidth / imgWidth;
		const heightRatio = maxHeight / imgHeight;
		return Math.min(widthRatio, heightRatio, 1);
	}
}
