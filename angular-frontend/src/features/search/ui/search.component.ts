import { CommonModule } from "@angular/common";
import {
	Component,
	inject,
	type OnDestroy,
	type OnInit,
	signal,
} from "@angular/core";
import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import { injectQuery } from "@tanstack/angular-query-experimental";
import instantsearch from "instantsearch.js";
import { hits, searchBox } from "instantsearch.js/es/widgets";
import { DefaultService } from "@/shared/api/default/default.service";

@Component({
	selector: "feature-search",
	standalone: true,
	imports: [CommonModule], // 不再需要引入 NgAisModule
	templateUrl: "./search.component.html",
})
export class SearchComponent implements OnInit, OnDestroy {
	private readonly defaultService = inject(DefaultService);

	private searchInstance!: any;

	// 使用 Angular 最新穩定的 Signals 管理搜尋結果狀態
	searchResults = signal<any[]>([]);

	private query = injectQuery(() => ({
		queryKey: ["concept"],
		queryFn: () => this.defaultService.getApiV1SystemSearch(),
	}));

	ngOnInit() {
		if (!this.query.isSuccess()) {
			console.error(
				"Failed to fetch initial search data:",
				this.query.error(),
			);
			return;
		}

		const initialData = this.query.data();

		// 1. 初始化 Meilisearch 連接器
		const { searchClient } = instantMeiliSearch(
			"http://127.0.0.1:7700",
			initialData.key || "",
		);

		// 2. 建立原生高效率 InstantSearch 實例
		this.searchInstance = instantsearch({
			indexName: "你的Index名稱",
			searchClient,
		});

		// 3. 掛載小部件
		this.searchInstance.addWidgets([
			// 自動綁定 HTML 中的輸入框
			searchBox({
				container: "#searchbox",
				placeholder: "請輸入名稱進行搜尋...",
			}),

			// 自定義渲染小部件：這裏將資料導向 Angular 的 Signal 處理
			hits({
				container: "#hits-placeholder", // 放置一個隱藏容器或藉由它監聽
				templates: {
					item: () => "", // 留空，因為我們要用 Angular 的控制流程自己渲染
				},
				transformItems: (items) => {
					// 當搜尋結果更新時，直接推送給 Angular Signal，觸發高效變更偵測
					this.searchResults.set(items);
					return items;
				},
			}),
		]);

		// 4. 啟動搜尋
		this.searchInstance.start();
	}

	// 處理多結構資料的輔助函式
	getDisplayName(hit: any): string {
		return hit.name || hit.title || hit.metadata?.product_name || "未命名";
	}

	ngOnDestroy() {
		if (this.searchInstance) {
			this.searchInstance.dispose(); // 妥善銷毀防記憶體洩漏
		}
	}
}
