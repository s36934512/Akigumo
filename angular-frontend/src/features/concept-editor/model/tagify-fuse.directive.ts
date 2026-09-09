import {
	afterRenderEffect,
	Directive,
	ElementRef,
	inject,
	output,
} from "@angular/core";
import Tagify, { type TagifySettings } from "@yaireo/tagify";
import { ConceptEntryStore } from "@/entities/concept"; // 注入 Store

@Directive({
	selector: "appConceptTagify", // 改名為更具具體意義的名稱
	standalone: true,
})
export class ConceptTagifyDirective {
	private readonly el = inject(ElementRef<HTMLInputElement>);

	// 直接在指令內注入 Store 服務
	private readonly conceptEntryStore = inject(ConceptEntryStore);

	tagsChange = output<string[]>();
	private tagifyInstance?: Tagify;

	constructor() {
		afterRenderEffect(() => {
			// 直接從注入的 Store 取得資料，完全不需要靠外部 Component 傳入
			const currentNodes = this.conceptEntryStore.nodes() || [];
			const whitelist = currentNodes.flatMap((item) =>
				item ? [{ value: item.name, id: item.id }] : [],
			);

			const settings: TagifySettings = {
				whitelist,
				enforceWhitelist: false,
				dropdown: {
					enabled: 0,
					searchKeys: [],
					fuzzySearch: false,
					closeOnSelect: true,
				},
			};

			if (!this.tagifyInstance) {
				this.tagifyInstance = new Tagify(
					this.el.nativeElement,
					settings,
				);

				this.tagifyInstance.on("input", (e) => {
					const tagify = e.detail.tagify;
					const value = tagify.DOM.input.textContent?.trim() ?? "";

					// 直接使用內部的 Store 進行搜尋
					const fuseInstance = this.conceptEntryStore.fuse();
					if (value.length > 0 && fuseInstance) {
						const searchResults = fuseInstance.search(value);
						tagify.settings.whitelist = searchResults.map(
							(r: any) => ({ value: r.item.name, id: r.item.id }),
						);
						tagify.dropdown.show(value);
					} else {
						tagify.dropdown.hide();
					}
				});

				this.tagifyInstance.on("change", (e) => {
					try {
						const tags = JSON.parse(e.detail.value || "[]");
						this.tagsChange.emit(
							tags.map((t: any) => t.id || `!newTag-${t.value}`),
						);
					} catch {
						this.tagsChange.emit([]);
					}
				});
			} else {
				this.tagifyInstance.whitelist = whitelist;
			}
		});
	}
}
