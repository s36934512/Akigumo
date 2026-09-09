import { computed, Injectable, inject, signal } from "@angular/core";
import Fuse from "fuse.js";

import { ConceptEntryStore } from "@/entities/concept";
import type { PostApiV1OntologyResolver200NodesItemData } from "@/shared/api/model";

@Injectable()
export class ConceptSearchStore {
	readonly store = inject(ConceptEntryStore);

	searchKeyword = signal<string>("");

	private fuse = computed(() => {
		return new Fuse<PostApiV1OntologyResolver200NodesItemData>(
			this.store.nodes(),
			{
				keys: [
					{ name: "name", weight: 2 }, // 權重較高：名稱匹配更重要
					{ name: "description", weight: 1 }, // 權重較低
				],
				threshold: 0.4, // Fuse.js 嚴格度：0.0 完美匹配，1.0 匹配所有內容
				distance: 0,
				ignoreLocation: true, // 當描述字數較長時，關閉位置敏感度可大幅提升精準度
				useExtendedSearch: true, // 啟用 7.x 進階語法（如使用 '=' 進行精確匹配）
				minMatchCharLength: 1,
			},
		);
	});

	readonly filteredData = computed(() => {
		const keyword = this.searchKeyword().trim();
		const nodes = this.store.nodes();

		// 如果關鍵字為空，直接回傳完整原始資料
		if (!keyword) {
			return nodes;
		}

		const searchResult = this.fuse().search(keyword);

		return searchResult.map((result) => result.item);
	});

	search(keyword: string) {
		this.searchKeyword.set(keyword);
	}
}
